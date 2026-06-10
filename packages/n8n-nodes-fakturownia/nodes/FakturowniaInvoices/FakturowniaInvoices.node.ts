import type {
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IDataObject,
	IExecuteFunctions,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { callInvoiceApi } from './transport/restClient';
import { assertLicense, callDirect, type DirectCredentials } from './transport/fakturowniaDirectClient';
import { invoiceOperations, invoiceFields } from './descriptions';

// Mapowanie operacji UI -> akcja REST endpointu /fakturownia/invoices/:action
export const OPERATION_TO_ACTION: Record<string, string> = {
	getMany: 'list',
	get: 'get',
	getByNumber: 'get-by-number',
	search: 'search',
	getByClient: 'by-client',
	getByClientTaxNo: 'by-client-tax-no',
	create: 'create',
	update: 'update',
	downloadPdf: 'pdf',
};

export class FakturowniaInvoices implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fakturownia Invoices',
		name: 'fakturowniaInvoices',
		icon: 'file:fakturownia.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Handle Fakturownia invoices directly (API Keys) or via the fakto.app proxy (Bearer token)',
		defaults: { name: 'Fakturownia Invoices' },
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{ name: 'fakturowniaDirectApi', required: true, displayOptions: { show: { authentication: ['apiKeys'] } } },
			{ name: 'fakturowniaBearerApi', required: true, displayOptions: { show: { authentication: ['bearerToken'] } } },
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'API Keys (Direct)', value: 'apiKeys', description: 'Connect directly to Fakturownia; fakto.app subscription key is verified daily as a license' },
					{ name: 'Bearer Token', value: 'bearerToken', description: 'Bearer token generated in fakto.app (routed through the fakto.app proxy)' },
				],
				default: 'apiKeys',
			},
			...invoiceOperations,
			...invoiceFields,
		],
	};

	methods = {
		credentialTest: {
			async fakturowniaDirectTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const data = (credential.data ?? {}) as IDataObject;
				const faktoUrl = String(data.faktoServerUrl || 'https://fakto.app').replace(/\/+$/, '');

				// Krok 1: licencja fakto.app
				try {
					const resp = (await this.helpers.request({
						method: 'POST',
						uri: `${faktoUrl}/subscription/verify`,
						headers: { 'x-subscription-key': data.subscriptionApiKey },
						body: {},
						json: true,
					})) as IDataObject;
					if (resp.active !== true) {
						return { status: 'Error', message: `Subskrypcja fakto.app nieaktywna (status: ${resp.status ?? 'unknown'}).` };
					}
				} catch (error) {
					const status = (error as IDataObject).statusCode;
					if (status === 401 || status === 400) {
						return { status: 'Error', message: 'Klucz subskrypcji fakto.app jest nieprawidłowy lub nieaktywny.' };
					}
					return { status: 'Error', message: `Nie można zweryfikować licencji na fakto.app: ${(error as Error).message}` };
				}

				// Krok 2: połączenie z Fakturownią
				try {
					await this.helpers.request({
						method: 'GET',
						uri: `https://${data.subdomain}.fakturownia.pl/invoices.json`,
						qs: { api_token: data.apiToken, per_page: 1 },
						json: true,
					});
				} catch (error) {
					return { status: 'Error', message: `Połączenie z Fakturownią nie powiodło się (sprawdź subdomenę i token): ${(error as Error).message}` };
				}

				return { status: 'OK', message: 'Licencja fakto.app aktywna i połączenie z Fakturownią działa.' };
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const authentication = this.getNodeParameter('authentication', 0) as string;
		const isDirect = authentication !== 'bearerToken';

		// Tryb Direct: pobierz credential raz i zweryfikuj licencję (gating dobowy) przed pętlą.
		let directCred: DirectCredentials | undefined;
		if (isDirect) {
			directCred = (await this.getCredentials('fakturowniaDirectApi')) as unknown as DirectCredentials;
			await assertLicense(this, directCred);
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const action = OPERATION_TO_ACTION[operation];
				if (!action) {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
				}

				const args = buildArgs.call(this, operation, i);
				const response = isDirect
					? await callDirect(this, directCred as DirectCredentials, operation, args, i)
					: await callInvoiceApi(this, 'fakturowniaBearerApi', action, args, i);

				// PDF: endpoint zwraca { pdf_base64, filename, mime_type } -> wystaw jako binary
				if (operation === 'downloadPdf' && !Array.isArray(response) && response.pdf_base64) {
					const buffer = Buffer.from(response.pdf_base64 as string, 'base64');
					const filename = (response.filename as string) || 'invoice.pdf';
					const mimeType = (response.mime_type as string) || 'application/pdf';
					const binaryData = await this.helpers.prepareBinaryData(buffer, filename, mimeType);
					returnData.push({
						json: { filename, mimeType },
						binary: { data: binaryData },
						pairedItem: { item: i },
					});
					continue;
				}

				if (Array.isArray(response)) {
					for (const entry of response) {
						returnData.push({ json: entry ?? {}, pairedItem: { item: i } });
					}
				} else {
					returnData.push({ json: response ?? {}, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}

function buildArgs(this: IExecuteFunctions, operation: string, i: number): IDataObject {
	const additional = safeGetParam<IDataObject>(this, 'additionalFields', i, {});

	switch (operation) {
		case 'get':
		case 'downloadPdf':
			return { id: this.getNodeParameter('invoiceId', i) };
		case 'getByNumber':
			return { number: this.getNodeParameter('number', i) };
		case 'getByClient':
			return { client_id: this.getNodeParameter('clientId', i), limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(additional) };
		case 'getByClientTaxNo':
			return { tax_no: this.getNodeParameter('taxNo', i), limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(additional) };
		case 'search':
			return { query: this.getNodeParameter('query', i), limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(additional) };
		case 'getMany':
			return { limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(additional) };
		case 'create': {
			const positions = buildPositions.call(this, i);
			const buyerMode = this.getNodeParameter('buyerMode', i) as string;
			const base: IDataObject = {
				sell_date: this.getNodeParameter('sell_date', i),
				issue_date: this.getNodeParameter('issue_date', i),
				payment_to: this.getNodeParameter('payment_to', i),
				...cleanObj(additional),
			};
			if (buyerMode === 'inline') {
				base.buyer_name = this.getNodeParameter('buyerName', i);
			} else {
				base.client_id = this.getNodeParameter('buyerClientId', i);
			}
			if (positions.length) base.positions = positions;
			return { ...base, ...buildRawOverride.call(this, i) };
		}
		case 'update': {
			const positions = buildPositions.call(this, i);
			const base: IDataObject = {
				id: this.getNodeParameter('invoiceId', i),
				...cleanObj(additional),
			};
			if (positions.length) base.positions = positions;
			return { ...base, ...buildRawOverride.call(this, i) };
		}
		default:
			return {};
	}
}

function buildPositions(this: IExecuteFunctions, i: number): IDataObject[] {
	const raw = safeGetParam<IDataObject>(this, 'positions', i, {});
	const list = (raw.position as IDataObject[] | undefined) || [];
	return list.map((p) => {
		const cleaned = cleanObj(p);
		// id 0 means "no id" -> drop it so Fakturownia adds a new line instead of targeting line 0
		if (cleaned.id === 0) delete cleaned.id;
		// only send _destroy when actually removing a line (avoids sending _destroy:false noise)
		if (cleaned._destroy === false) delete cleaned._destroy;
		// Treat 0 in price fields as "not provided": lets the server compute totals on create
		// and prevents partial edits (e.g. quantity-only) from zeroing an existing line's amount.
		for (const field of ['price_net', 'price_gross', 'total_price_net', 'total_price_gross']) {
			if (cleaned[field] === 0) delete cleaned[field];
		}
		return cleaned;
	});
}

function buildRawOverride(this: IExecuteFunctions, i: number): IDataObject {
	const raw = safeGetParam<string>(this, 'rawJsonOverride', i, '');
	if (!raw || (typeof raw === 'string' && raw.trim() === '')) return {};
	return safeJsonParse(this, raw, 'rawJsonOverride', i);
}

function safeGetParam<T>(ef: IExecuteFunctions, name: string, idx: number, fallback: T): T {
	return ef.getNodeParameter(name, idx, fallback) as T;
}

function safeJsonParse(ef: IExecuteFunctions, value: string, field: string, i: number): IDataObject {
	try {
		return JSON.parse(value) as IDataObject;
	} catch {
		throw new NodeOperationError(ef.getNode(), `Invalid JSON in "${field}"`, { itemIndex: i });
	}
}

export function cleanObj(obj: IDataObject): IDataObject {
	const result: IDataObject = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value !== '' && value !== undefined && value !== null) {
			result[key] = value;
		}
	}
	return result;
}

import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { callInvoiceApi } from './transport/restClient';
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
		description: 'Handle Fakturownia invoices via the fakto.app REST proxy (API Keys or Bearer token)',
		defaults: { name: 'Fakturownia Invoices' },
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{ name: 'fakturowniaApi', required: true, displayOptions: { show: { authentication: ['apiKeys'] } } },
			{ name: 'fakturowniaBearerApi', required: true, displayOptions: { show: { authentication: ['bearerToken'] } } },
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'API Keys', value: 'apiKeys', description: 'Fakturownia token + subdomain + fakto.app subscription key' },
					{ name: 'Bearer Token', value: 'bearerToken', description: 'Bearer token generated in fakto.app' },
				],
				default: 'apiKeys',
			},
			...invoiceOperations,
			...invoiceFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const authentication = this.getNodeParameter('authentication', 0) as string;
		const credName = authentication === 'bearerToken' ? 'fakturowniaBearerApi' : 'fakturowniaApi';

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const action = OPERATION_TO_ACTION[operation];
				if (!action) {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
				}

				const args = buildArgs.call(this, operation, i);
				const response = await callInvoiceApi(this, credName, action, args, i);

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
			const base: IDataObject = { ...cleanObj(additional) };
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
	return list.map((p) => cleanObj(p));
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

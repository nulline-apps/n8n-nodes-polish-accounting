import { createHash } from 'crypto';
import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

// ====================================================================================
// Tryb "Direct": node łączy się bezpośrednio z API Fakturowni, a klucz subskrypcji
// fakto.app jest weryfikowany jako licencja ~raz na dobę (assertLicense).
// Odwzorowuje logikę serwera (src/api/endpoints/fakturownia-invoices.ts) po stronie node'a.
// ====================================================================================

export interface DirectCredentials {
	faktoServerUrl: string;
	subscriptionApiKey: string;
	subdomain: string;
	apiToken: string;
}

const LICENSE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface LicenseCacheEntry {
	verifiedAt: number;
	active: boolean;
}

// ---- Licencja (gating dobowy przez workflow static data) ----------------------------

export async function assertLicense(ef: IExecuteFunctions, cred: DirectCredentials): Promise<void> {
	const staticData = ef.getWorkflowStaticData('global') as IDataObject;
	const cacheKey = `faktoLicense:${createHash('sha256').update(cred.subscriptionApiKey).digest('hex').slice(0, 16)}`;
	const cached = staticData[cacheKey] as LicenseCacheEntry | undefined;

	// Świeży pozytywny wynik (<24h) -> przepuść bez odpytywania fakto.app.
	if (cached && cached.active && Date.now() - cached.verifiedAt < LICENSE_TTL_MS) {
		return;
	}

	const faktoUrl = (cred.faktoServerUrl || 'https://fakto.app').replace(/\/+$/, '');
	let body: IDataObject;
	try {
		const resp = (await ef.helpers.httpRequest({
			method: 'POST',
			url: `${faktoUrl}/subscription/verify`,
			headers: { 'x-subscription-key': cred.subscriptionApiKey, 'Content-Type': 'application/json' },
			body: {},
			json: true,
			returnFullResponse: true,
		})) as { body: IDataObject };
		body = resp.body ?? {};
	} catch (error) {
		const status = String(
			(error as IDataObject).httpCode ??
				(error as IDataObject).statusCode ??
				((error as IDataObject).response as IDataObject | undefined)?.statusCode ??
				'',
		);
		// Jednoznaczna odmowa (zły/wygasły klucz, zły format) -> blokuj.
		if (status === '401' || status === '400') {
			staticData[cacheKey] = { verifiedAt: Date.now(), active: false };
			throw new NodeOperationError(
				ef.getNode(),
				'Subskrypcja fakto.app jest nieaktywna lub klucz jest nieprawidłowy. Odnów plan na fakto.app lub popraw klucz subskrypcji.',
			);
		}
		// Błąd sieci / fakto.app niedostępny -> fail-open (przepuść, ponów przy następnym uruchomieniu).
		return;
	}

	if (body.active === true) {
		staticData[cacheKey] = { verifiedAt: Date.now(), active: true };
		return;
	}

	// 200 z active:false (np. status cancelled/past_due) -> blokuj.
	staticData[cacheKey] = { verifiedAt: Date.now(), active: false };
	throw new NodeOperationError(
		ef.getNode(),
		`Subskrypcja fakto.app jest nieaktywna (status: ${body.status ?? 'unknown'}). Odnów plan na fakto.app, aby korzystać z node'a.`,
	);
}

// ---- Niskopoziomowe wywołanie API Fakturowni ----------------------------------------

async function callFakturownia(
	ef: IExecuteFunctions,
	cred: DirectCredentials,
	method: IHttpRequestMethods,
	endpoint: string,
	opts: { params?: IDataObject; body?: IDataObject; binary?: boolean; itemIndex?: number } = {},
): Promise<any> {
	const baseUrl = `https://${cred.subdomain}.fakturownia.pl`;
	const qs: IDataObject = { ...(opts.params ?? {}) };
	let body = opts.body;

	// Fakturownia: api_token w query dla GET/DELETE, w body dla POST/PUT.
	if (method === 'GET' || method === 'DELETE') {
		qs.api_token = cred.apiToken;
	} else {
		body = { ...(body ?? {}), api_token: cred.apiToken };
	}

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		qs,
		json: !opts.binary,
	};
	if (body !== undefined) options.body = body;
	if (opts.binary) options.encoding = 'arraybuffer';

	try {
		return await ef.helpers.httpRequest(options);
	} catch (error) {
		throw new NodeApiError(ef.getNode(), error as JsonObject, { itemIndex: opts.itemIndex });
	}
}

// ---- Mapowanie filtrów listy (odwzorowanie fakturownia-invoices.ts:30-77) ------------

const LIST_PASSTHROUGH = [
	'number', 'fullnumber', 'kind', 'client_id', 'client_name', 'buyer_name', 'buyer_tax_no',
	'income', 'period', 'search_date_type', 'date_from', 'date_to',
	'issue_date_from', 'issue_date_to', 'sell_date_from', 'sell_date_to',
	'payment_to_from', 'payment_to_to', 'paid', 'status', 'currency', 'payment_type',
];

function buildListParams(filters: IDataObject): IDataObject {
	const p: IDataObject = {};
	for (const key of LIST_PASSTHROUGH) {
		const v = filters[key];
		if (v !== undefined && v !== '' && v !== null) p[key] = v;
	}
	const perPage = (filters.limit ?? filters.per_page) as number | undefined;
	if (perPage) p.per_page = perPage;
	if (filters.page) {
		p.page = filters.page;
	} else if (filters.offset && perPage) {
		p.page = Math.floor(Number(filters.offset) / Number(perPage)) + 1;
	}
	return p;
}

async function listInvoices(ef: IExecuteFunctions, cred: DirectCredentials, filters: IDataObject, i: number): Promise<IDataObject[]> {
	const res = await callFakturownia(ef, cred, 'GET', '/invoices.json', { params: buildListParams(filters), itemIndex: i });
	return Array.isArray(res) ? (res as IDataObject[]) : [];
}

// ---- Normalizacja pozycji (odwzorowanie createInvoice w fakturownia-invoice-tools.ts) -

export function normalizePositions(positions: IDataObject[] | undefined): IDataObject[] | undefined {
	if (!positions || positions.length === 0) return positions;
	return positions.map((position) => {
		const tax = position.tax !== undefined ? (typeof position.tax === 'string' ? parseFloat(position.tax) : (position.tax as number)) : undefined;
		const quantity = position.quantity !== undefined ? (typeof position.quantity === 'string' ? parseFloat(position.quantity) : (position.quantity as number)) : 1;
		const price_net = position.price_net !== undefined ? (typeof position.price_net === 'string' ? parseFloat(position.price_net) : (position.price_net as number)) : undefined;
		const price_gross = position.price_gross !== undefined ? (typeof position.price_gross === 'string' ? parseFloat(position.price_gross) : (position.price_gross as number)) : undefined;

		let total_price_net = position.total_price_net !== undefined ? (typeof position.total_price_net === 'string' ? parseFloat(position.total_price_net) : (position.total_price_net as number)) : undefined;
		let total_price_gross = position.total_price_gross !== undefined ? (typeof position.total_price_gross === 'string' ? parseFloat(position.total_price_gross) : (position.total_price_gross as number)) : undefined;

		if (total_price_net === undefined && price_net !== undefined) {
			total_price_net = price_net * quantity;
		}
		if (total_price_gross === undefined) {
			if (price_gross !== undefined) {
				total_price_gross = price_gross * quantity;
			} else if (total_price_net !== undefined && tax !== undefined) {
				total_price_gross = total_price_net * (1 + tax / 100);
			} else if (price_net !== undefined && tax !== undefined) {
				total_price_gross = price_net * quantity * (1 + tax / 100);
			}
		}

		const result: IDataObject = { ...position };
		if (tax !== undefined) result.tax = tax;
		result.quantity = quantity;
		if (price_net !== undefined) result.price_net = price_net;
		if (price_gross !== undefined) result.price_gross = price_gross;
		if (total_price_net !== undefined) result.total_price_net = total_price_net;
		if (total_price_gross !== undefined) result.total_price_gross = total_price_gross;
		// id / _destroy przekazywane 1:1 (node już je oczyścił w buildPositions)
		return result;
	});
}

// ---- Dispatcher operacji -------------------------------------------------------------

export async function callDirect(
	ef: IExecuteFunctions,
	cred: DirectCredentials,
	operation: string,
	args: IDataObject,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	switch (operation) {
		case 'getMany':
			return listInvoices(ef, cred, args, i);

		case 'get':
			return callFakturownia(ef, cred, 'GET', `/invoices/${args.id}.json`, { itemIndex: i });

		case 'getByNumber': {
			const number = String(args.number);
			const list = await listInvoices(ef, cred, { number, limit: 100 }, i);
			const match = list.find((inv) => inv.number === number || String(inv.number ?? '').includes(number));
			return match ?? {};
		}

		case 'getByClient':
			return listInvoices(ef, cred, args, i); // args zawiera client_id

		case 'getByClientTaxNo': {
			const { tax_no, ...rest } = args;
			return listInvoices(ef, cred, { ...rest, buyer_tax_no: tax_no }, i);
		}

		case 'search': {
			const { query, limit, ...rest } = args;
			const all = await listInvoices(ef, cred, { ...rest, limit: 1000 }, i);
			const q = String(query ?? '').toLowerCase();
			const filtered = all.filter((inv) => {
				if (String(inv.number ?? '').toLowerCase().includes(q)) return true;
				if (String(inv.buyer_name ?? '').toLowerCase().includes(q)) return true;
				if (String(inv.seller_name ?? '').toLowerCase().includes(q)) return true;
				if (String(inv.buyer_tax_no ?? '').toLowerCase().includes(q)) return true;
				if (Array.isArray(inv.positions) && (inv.positions as IDataObject[]).some((p) =>
					String(p.name ?? '').toLowerCase().includes(q) || String(p.description ?? '').toLowerCase().includes(q))) return true;
				if (String(inv.description ?? '').toLowerCase().includes(q)) return true;
				return false;
			});
			return typeof limit === 'number' ? filtered.slice(0, limit) : filtered;
		}

		case 'create': {
			const invoice: IDataObject = { ...args };
			invoice.positions = normalizePositions(args.positions as IDataObject[] | undefined);
			return callFakturownia(ef, cred, 'POST', '/invoices.json', { body: { invoice }, itemIndex: i });
		}

		case 'update': {
			const { id, ...rest } = args;
			const invoice: IDataObject = { ...rest };
			if (rest.positions) invoice.positions = normalizePositions(rest.positions as IDataObject[]);
			return callFakturownia(ef, cred, 'PUT', `/invoices/${id}.json`, { body: { invoice }, itemIndex: i });
		}

		case 'downloadPdf': {
			const buffer = (await callFakturownia(ef, cred, 'GET', `/invoices/${args.id}.pdf`, { binary: true, itemIndex: i })) as Buffer;
			return {
				pdf_base64: Buffer.from(buffer).toString('base64'),
				filename: `invoice_${args.id}.pdf`,
				mime_type: 'application/pdf',
			};
		}

		default:
			throw new NodeOperationError(ef.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
	}
}

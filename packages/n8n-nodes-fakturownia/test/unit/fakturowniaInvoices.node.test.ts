import { FakturowniaInvoices, OPERATION_TO_ACTION, cleanObj } from '../../nodes/FakturowniaInvoices/FakturowniaInvoices.node';

function getProp(node: FakturowniaInvoices, name: string): any {
	return node.description.properties.find((p) => p.name === name);
}

function getOperationValues(node: FakturowniaInvoices): string[] {
	return (getProp(node, 'operation') as any).options.map((o: any) => o.value);
}

describe('FakturowniaInvoices Node', () => {
	let node: FakturowniaInvoices;

	beforeEach(() => {
		node = new FakturowniaInvoices();
	});

	describe('description', () => {
		it('should have correct basic metadata', () => {
			expect(node.description.displayName).toBe('Fakturownia Invoices');
			expect(node.description.name).toBe('fakturowniaInvoices');
			expect(node.description.version).toBe(1);
			expect(node.description.usableAsTool).toBe(true);
		});

		it('should default authentication to apiKeys', () => {
			const auth = getProp(node, 'authentication');
			expect(auth.default).toBe('apiKeys');
			const values = auth.options.map((o: any) => o.value);
			expect(values).toEqual(['apiKeys', 'bearerToken']);
		});

		it('should declare both credentials gated by authentication', () => {
			expect(node.description.credentials).toEqual([
				{ name: 'fakturowniaApi', required: true, displayOptions: { show: { authentication: ['apiKeys'] } } },
				{ name: 'fakturowniaBearerApi', required: true, displayOptions: { show: { authentication: ['bearerToken'] } } },
			]);
		});

		it('should expose all 9 invoice operations', () => {
			const ops = getOperationValues(node);
			expect(ops.sort()).toEqual(
				['create', 'downloadPdf', 'get', 'getByClient', 'getByClientTaxNo', 'getByNumber', 'getMany', 'search', 'update'].sort(),
			);
			expect(ops).toHaveLength(9);
		});

		it('should not have a resource selector', () => {
			expect(getProp(node, 'resource')).toBeUndefined();
		});
	});

	describe('OPERATION_TO_ACTION', () => {
		it('should map every UI operation to a REST action', () => {
			for (const op of getOperationValues(node)) {
				expect(typeof OPERATION_TO_ACTION[op]).toBe('string');
				expect(OPERATION_TO_ACTION[op].length).toBeGreaterThan(0);
			}
		});

		it('should map operations to the expected REST actions', () => {
			expect(OPERATION_TO_ACTION.getMany).toBe('list');
			expect(OPERATION_TO_ACTION.getByNumber).toBe('get-by-number');
			expect(OPERATION_TO_ACTION.getByClientTaxNo).toBe('by-client-tax-no');
			expect(OPERATION_TO_ACTION.downloadPdf).toBe('pdf');
			expect(OPERATION_TO_ACTION.create).toBe('create');
		});
	});

	describe('cleanObj', () => {
		it('should remove empty/null/undefined but keep 0 and false', () => {
			expect(cleanObj({ a: '', b: null, c: undefined, d: 0, e: false, f: 'x' })).toEqual({ d: 0, e: false, f: 'x' });
		});
	});
});

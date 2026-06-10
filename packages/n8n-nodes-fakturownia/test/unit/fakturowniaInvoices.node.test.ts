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
				{ name: 'fakturowniaDirectApi', required: true, displayOptions: { show: { authentication: ['apiKeys'] } } },
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

		it('should surface required create fields up-front (buyer + positions)', () => {
			const buyerMode = getProp(node, 'buyerMode');
			expect(buyerMode.default).toBe('clientId');
			expect(buyerMode.displayOptions?.show?.operation).toEqual(['create']);

			const buyerClientId = node.description.properties.find(
				(p) => p.name === 'buyerClientId',
			) as any;
			expect(buyerClientId.required).toBe(true);
			expect(buyerClientId.displayOptions?.show?.buyerMode).toEqual(['clientId']);

			const positionsForCreate = node.description.properties.find(
				(p) => p.name === 'positions' && p.displayOptions?.show?.operation?.includes('create'),
			) as any;
			expect(positionsForCreate.required).toBe(true);
		});

		it('should surface dates as required top-level create fields (validated server-side)', () => {
			for (const dateField of ['sell_date', 'issue_date', 'payment_to']) {
				const topLevel = node.description.properties.find(
					(p) => p.name === dateField && p.displayOptions?.show?.operation?.includes('create'),
				) as any;
				expect(topLevel).toBeDefined();
				expect(topLevel.required).toBe(true);
			}
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

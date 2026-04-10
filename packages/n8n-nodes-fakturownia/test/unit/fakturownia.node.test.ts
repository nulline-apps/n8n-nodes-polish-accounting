import { Fakturownia } from '../../nodes/Fakturownia/Fakturownia.node';

describe('Fakturownia Node', () => {
	let node: Fakturownia;

	beforeEach(() => {
		node = new Fakturownia();
	});

	describe('description', () => {
		it('should have correct basic metadata', () => {
			expect(node.description.displayName).toBe('Fakturownia');
			expect(node.description.name).toBe('fakturownia');
			expect(node.description.version).toBe(1);
			expect(node.description.group).toContain('transform');
		});

		it('should require fakturowniaApi credentials', () => {
			expect(node.description.credentials).toEqual([
				{ name: 'fakturowniaApi', required: true },
			]);
		});

		it('should define all 5 resources', () => {
			const resourceProp = node.description.properties.find(
				(p) => p.name === 'resource',
			);
			expect(resourceProp).toBeDefined();

			const options = (resourceProp as any).options;
			const resourceValues = options.map((o: any) => o.value);

			expect(resourceValues).toContain('invoice');
			expect(resourceValues).toContain('contractor');
			expect(resourceValues).toContain('product');
			expect(resourceValues).toContain('warehouse');
			expect(resourceValues).toContain('analytics');
			expect(options).toHaveLength(5);
		});

		it('should have invoice operations including CRUD and search', () => {
			const invoiceOps = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('invoice'),
			);
			expect(invoiceOps).toBeDefined();

			const opValues = (invoiceOps as any).options.map((o: any) => o.value);
			expect(opValues).toContain('getMany');
			expect(opValues).toContain('get');
			expect(opValues).toContain('create');
			expect(opValues).toContain('update');
			expect(opValues).toContain('search');
			expect(opValues).toContain('downloadPdf');
		});

		it('should have product operations including delete', () => {
			const productOps = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('product'),
			);
			const opValues = (productOps as any).options.map((o: any) => o.value);
			expect(opValues).toContain('delete');
		});

		it('should have warehouse document operations', () => {
			const warehouseOps = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('warehouse'),
			);
			const opValues = (warehouseOps as any).options.map((o: any) => o.value);
			expect(opValues).toContain('createIn');
			expect(opValues).toContain('createOut');
			expect(opValues).toContain('createInternal');
			expect(opValues).toContain('getStock');
		});
	});
});

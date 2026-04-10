import { Wfirma } from '../../nodes/Wfirma/Wfirma.node';

describe('Wfirma Node', () => {
	let node: Wfirma;

	beforeEach(() => {
		node = new Wfirma();
	});

	describe('description', () => {
		it('should have correct basic metadata', () => {
			expect(node.description.displayName).toBe('wFirma');
			expect(node.description.name).toBe('wfirma');
			expect(node.description.version).toBe(1);
			expect(node.description.group).toContain('transform');
		});

		it('should require wfirmaApi credentials', () => {
			expect(node.description.credentials).toEqual([
				{ name: 'wfirmaApi', required: true },
			]);
		});

		it('should define all 10 resources', () => {
			const resourceProp = node.description.properties.find(
				(p) => p.name === 'resource',
			);
			expect(resourceProp).toBeDefined();
			expect(resourceProp?.type).toBe('options');

			const options = (resourceProp as any).options;
			const resourceValues = options.map((o: any) => o.value);

			expect(resourceValues).toContain('invoice');
			expect(resourceValues).toContain('contractor');
			expect(resourceValues).toContain('expense');
			expect(resourceValues).toContain('payment');
			expect(resourceValues).toContain('product');
			expect(resourceValues).toContain('warehouse');
			expect(resourceValues).toContain('analytics');
			expect(resourceValues).toContain('prediction');
			expect(resourceValues).toContain('automation');
			expect(resourceValues).toContain('tax');
			expect(options).toHaveLength(10);
		});

		it('should have operation properties for each resource', () => {
			const operationProps = node.description.properties.filter(
				(p) => p.name === 'operation',
			);
			expect(operationProps.length).toBeGreaterThanOrEqual(10);
		});

		it('should define invoice operations', () => {
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
			expect(opValues).toContain('downloadPdf');
		});
	});

	describe('TOOL_MAP coverage', () => {
		it('should map all invoice operations to tool names', () => {
			const invoiceOps = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('invoice'),
			);
			const opValues = (invoiceOps as any).options.map((o: any) => o.value);

			expect(opValues.length).toBe(8);
		});

		it('should map all tax operations to tool names', () => {
			const taxOps = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('tax'),
			);
			const opValues = (taxOps as any).options.map((o: any) => o.value);

			expect(opValues.length).toBe(6);
		});
	});
});

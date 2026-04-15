import { Wfirma, TOOL_MAP, cleanObj } from '../../nodes/Wfirma/Wfirma.node';

function getResourceValues(node: Wfirma): string[] {
	const resourceProp = node.description.properties.find((p) => p.name === 'resource');
	return (resourceProp as any).options.map((o: any) => o.value);
}

function getOperationValues(node: Wfirma, resource: string): string[] {
	const opProp = node.description.properties.find(
		(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes(resource),
	);
	return (opProp as any).options.map((o: any) => o.value);
}

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
			const resources = getResourceValues(node);
			expect(resources).toContain('invoice');
			expect(resources).toContain('contractor');
			expect(resources).toContain('expense');
			expect(resources).toContain('payment');
			expect(resources).toContain('product');
			expect(resources).toContain('warehouse');
			expect(resources).toContain('analytics');
			expect(resources).toContain('prediction');
			expect(resources).toContain('automation');
			expect(resources).toContain('tax');
			expect(resources).toHaveLength(10);
		});

		it('should have operation properties for each resource', () => {
			const operationProps = node.description.properties.filter(
				(p) => p.name === 'operation',
			);
			expect(operationProps.length).toBeGreaterThanOrEqual(10);
		});

		it('should define invoice operations', () => {
			const opValues = getOperationValues(node, 'invoice');
			expect(opValues).toContain('getMany');
			expect(opValues).toContain('get');
			expect(opValues).toContain('create');
			expect(opValues).toContain('downloadPdf');
		});
	});

	describe('cleanObj', () => {
		it('should remove empty strings', () => {
			expect(cleanObj({ a: '', b: 'value' })).toEqual({ b: 'value' });
		});

		it('should remove null and undefined values', () => {
			expect(cleanObj({ a: null, b: undefined, c: 'value' })).toEqual({ c: 'value' });
		});

		it('should preserve 0 values', () => {
			expect(cleanObj({ paid: 0, status: 1 })).toEqual({ paid: 0, status: 1 });
		});

		it('should preserve false values', () => {
			expect(cleanObj({ active: false, name: 'test' })).toEqual({ active: false, name: 'test' });
		});

		it('should return empty object when all values are empty', () => {
			expect(cleanObj({ a: '', b: null, c: undefined })).toEqual({});
		});

		it('should pass through object with no empty values unchanged', () => {
			const input = { a: 'x', b: 42, c: true };
			expect(cleanObj(input)).toEqual(input);
		});
	});

	describe('TOOL_MAP parity with UI descriptions', () => {
		it('every UI resource should exist in TOOL_MAP', () => {
			const resources = getResourceValues(node);
			for (const resource of resources) {
				expect(TOOL_MAP[resource]).toBeDefined();
			}
		});

		it('every UI operation should have a TOOL_MAP entry', () => {
			const resources = getResourceValues(node);
			for (const resource of resources) {
				const operations = getOperationValues(node, resource);
				for (const op of operations) {
					expect(TOOL_MAP[resource]?.[op]).toBeDefined();
				}
			}
		});

		it('every TOOL_MAP entry should have a matching UI operation', () => {
			for (const [resource, ops] of Object.entries(TOOL_MAP)) {
				const uiOps = getOperationValues(node, resource);
				for (const op of Object.keys(ops)) {
					expect(uiOps).toContain(op);
				}
			}
		});

		it('TOOL_MAP values should be non-empty strings', () => {
			for (const ops of Object.values(TOOL_MAP)) {
				for (const toolName of Object.values(ops)) {
					expect(typeof toolName).toBe('string');
					expect(toolName.length).toBeGreaterThan(0);
				}
			}
		});
	});
});

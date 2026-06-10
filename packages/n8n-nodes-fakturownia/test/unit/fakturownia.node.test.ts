import { Fakturownia, TOOL_MAP, cleanObj } from '../../nodes/Fakturownia/Fakturownia.node';

function getResourceValues(node: Fakturownia): string[] {
	const resourceProp = node.description.properties.find((p) => p.name === 'resource');
	return (resourceProp as any).options.map((o: any) => o.value);
}

function getOperationValues(node: Fakturownia, resource: string): string[] {
	const opProp = node.description.properties.find(
		(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes(resource),
	);
	return (opProp as any).options.map((o: any) => o.value);
}

describe('Fakturownia Node', () => {
	let node: Fakturownia;

	beforeEach(() => {
		node = new Fakturownia();
	});

	describe('description', () => {
		it('should have correct basic metadata', () => {
			expect(node.description.displayName).toBe('Fakturownia MCP');
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
			const resources = getResourceValues(node);
			expect(resources).toContain('invoice');
			expect(resources).toContain('contractor');
			expect(resources).toContain('product');
			expect(resources).toContain('warehouse');
			expect(resources).toContain('analytics');
			expect(resources).toHaveLength(5);
		});

		it('should have invoice operations including CRUD and search', () => {
			const opValues = getOperationValues(node, 'invoice');
			expect(opValues).toContain('getMany');
			expect(opValues).toContain('get');
			expect(opValues).toContain('create');
			expect(opValues).toContain('update');
			expect(opValues).toContain('search');
			expect(opValues).toContain('downloadPdf');
		});

		it('should have product operations including delete', () => {
			const opValues = getOperationValues(node, 'product');
			expect(opValues).toContain('delete');
		});

		it('should have warehouse document operations', () => {
			const opValues = getOperationValues(node, 'warehouse');
			expect(opValues).toContain('createIn');
			expect(opValues).toContain('createOut');
			expect(opValues).toContain('createInternal');
			expect(opValues).toContain('getStock');
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

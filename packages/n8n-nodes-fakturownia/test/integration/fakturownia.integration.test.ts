/**
 * Integration tests for Fakturownia n8n node against a running MCP server.
 *
 * Prerequisites:
 *   - MCP server running at MCP_SERVER_URL (default: http://localhost:3000)
 *   - Valid Fakturownia credentials set in environment variables:
 *     FAKTUROWNIA_TOKEN, FAKTUROWNIA_SUBDOMAIN, SUBSCRIPTION_API_KEY
 *
 * Run with: INTEGRATION=1 npm test -- --testPathPattern=integration
 */

const SKIP = !process.env.INTEGRATION;

const serverUrl = process.env.MCP_SERVER_URL || 'http://localhost:3000';

async function mcpCall(toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
	const credentials = JSON.stringify({
		token: process.env.FAKTUROWNIA_TOKEN,
		subdomain: process.env.FAKTUROWNIA_SUBDOMAIN,
		subscriptionApiKey: process.env.SUBSCRIPTION_API_KEY,
	});

	const response = await fetch(`${serverUrl}/fakturownia/stream`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-fakturownia-credentials': credentials,
		},
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: `test-${Date.now()}`,
			method: 'tools/call',
			params: { name: toolName, arguments: args },
		}),
	});

	return response.json();
}

(SKIP ? describe.skip : describe)('Fakturownia Integration Tests', () => {
	it('should initialize MCP session', async () => {
		const credentials = JSON.stringify({
			token: process.env.FAKTUROWNIA_TOKEN,
			subdomain: process.env.FAKTUROWNIA_SUBDOMAIN,
			subscriptionApiKey: process.env.SUBSCRIPTION_API_KEY,
		});

		const response = await fetch(`${serverUrl}/fakturownia/stream`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-fakturownia-credentials': credentials,
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 'init-1',
				method: 'initialize',
				params: {
					protocolVersion: '2024-11-05',
					capabilities: {},
					clientInfo: { name: 'integration-test', version: '1.0.0' },
				},
			}),
		});

		const data = (await response.json()) as any;
		expect(data.result).toBeDefined();
		expect(data.result.protocolVersion).toBeDefined();
	}, 15000);

	it('should list invoices', async () => {
		const data = (await mcpCall('get_invoices', { limit: 5 })) as any;
		expect(data.result).toBeDefined();
		expect(data.result.isError).toBeFalsy();
	}, 15000);

	it('should list contractors', async () => {
		const data = (await mcpCall('get_contractors', { limit: 5 })) as any;
		expect(data.result).toBeDefined();
		expect(data.result.isError).toBeFalsy();
	}, 15000);

	it('should list products', async () => {
		const data = (await mcpCall('get_products', { limit: 5 })) as any;
		expect(data.result).toBeDefined();
		expect(data.result.isError).toBeFalsy();
	}, 15000);

	it('should reject missing credentials', async () => {
		const response = await fetch(`${serverUrl}/fakturownia/stream`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 'no-auth',
				method: 'tools/call',
				params: { name: 'get_invoices', arguments: {} },
			}),
		});

		expect(response.status).toBe(401);
	}, 15000);
});

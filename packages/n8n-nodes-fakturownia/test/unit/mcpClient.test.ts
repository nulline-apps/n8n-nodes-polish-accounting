import { callMcpTool, parseToolResult } from '../../nodes/Fakturownia/transport/mcpClient';
import type { McpToolResult } from '../../nodes/Fakturownia/transport/mcpClient';

const mockHttpRequestWithAuthentication = jest.fn();

const mockExecuteFunctions = {
	getCredentials: jest.fn().mockResolvedValue({
		serverUrl: 'https://fakto.app',
		token: 'test-token',
		subdomain: 'testco',
		subscriptionApiKey: 'test-sub',
	}),
	helpers: {
		httpRequestWithAuthentication: mockHttpRequestWithAuthentication,
	},
	getNode: jest.fn().mockReturnValue({ name: 'Fakturownia', type: 'fakturownia' }),
} as any;

describe('mcpClient (Fakturownia)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('callMcpTool', () => {
		it('should send JSON-RPC request to /fakturownia/stream', async () => {
			mockHttpRequestWithAuthentication.mockResolvedValue({
				jsonrpc: '2.0',
				id: 'test',
				result: {
					content: [{ type: 'text', text: '{"invoices":[]}' }],
					isError: false,
				},
			});

			await callMcpTool(mockExecuteFunctions, 'get_invoices', { limit: 10 }, 0);

			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'fakturowniaApi',
				expect.objectContaining({
					method: 'POST',
					url: 'https://fakto.app/fakturownia/stream',
					body: expect.objectContaining({
						jsonrpc: '2.0',
						method: 'tools/call',
						params: {
							name: 'get_invoices',
							arguments: { limit: 10 },
						},
					}),
				}),
			);
		});

		it('should throw on JSON-RPC error', async () => {
			mockHttpRequestWithAuthentication.mockResolvedValue({
				jsonrpc: '2.0',
				id: 'test',
				error: { code: -32600, message: 'Invalid Request' },
			});

			await expect(
				callMcpTool(mockExecuteFunctions, 'get_invoices', {}, 0),
			).rejects.toThrow();
		});

		it('should throw on tool error flag', async () => {
			mockHttpRequestWithAuthentication.mockResolvedValue({
				jsonrpc: '2.0',
				id: 'test',
				result: {
					content: [{ type: 'text', text: 'Error message' }],
					isError: true,
				},
			});

			await expect(
				callMcpTool(mockExecuteFunctions, 'get_invoices', {}, 0),
			).rejects.toThrow('MCP tool returned an error');
		});
	});

	describe('parseToolResult', () => {
		it('should parse JSON response', () => {
			const result: McpToolResult = {
				content: [{ type: 'text', text: '{"count":3}' }],
			};
			expect(parseToolResult(result)).toEqual({ count: 3 });
		});

		it('should handle non-JSON gracefully', () => {
			const result: McpToolResult = {
				content: [{ type: 'text', text: 'plain text' }],
			};
			expect(parseToolResult(result)).toEqual({ rawText: 'plain text' });
		});
	});
});

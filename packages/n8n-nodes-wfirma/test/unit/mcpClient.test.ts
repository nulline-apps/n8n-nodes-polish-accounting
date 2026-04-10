import { callMcpTool, parseToolResult } from '../../nodes/Wfirma/transport/mcpClient';
import type { McpToolResult } from '../../nodes/Wfirma/transport/mcpClient';

const mockHttpRequestWithAuthentication = jest.fn();

const mockExecuteFunctions = {
	getCredentials: jest.fn().mockResolvedValue({
		serverUrl: 'https://fakto.app',
		accessKey: 'test-key',
		secretKey: 'test-secret',
		appKey: 'test-app',
		subscriptionApiKey: 'test-sub',
	}),
	helpers: {
		httpRequestWithAuthentication: mockHttpRequestWithAuthentication,
	},
	getNode: jest.fn().mockReturnValue({ name: 'wFirma', type: 'wfirma' }),
} as any;

describe('mcpClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('callMcpTool', () => {
		it('should send JSON-RPC request to correct URL', async () => {
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
				'wfirmaApi',
				expect.objectContaining({
					method: 'POST',
					url: 'https://fakto.app/wfirma/stream',
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

		it('should strip trailing slashes from server URL', async () => {
			(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValueOnce({
				serverUrl: 'https://fakto.app/',
			});

			mockHttpRequestWithAuthentication.mockResolvedValue({
				jsonrpc: '2.0',
				id: 'test',
				result: { content: [{ type: 'text', text: '{}' }] },
			});

			await callMcpTool(mockExecuteFunctions, 'get_invoices', {}, 0);

			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'wfirmaApi',
				expect.objectContaining({
					url: 'https://fakto.app/wfirma/stream',
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

		it('should throw on empty result', async () => {
			mockHttpRequestWithAuthentication.mockResolvedValue({
				jsonrpc: '2.0',
				id: 'test',
			});

			await expect(
				callMcpTool(mockExecuteFunctions, 'get_invoices', {}, 0),
			).rejects.toThrow('Empty response');
		});

		it('should throw on MCP tool error (isError flag)', async () => {
			mockHttpRequestWithAuthentication.mockResolvedValue({
				jsonrpc: '2.0',
				id: 'test',
				result: {
					content: [{ type: 'text', text: 'Subscription required' }],
					isError: true,
				},
			});

			await expect(
				callMcpTool(mockExecuteFunctions, 'get_invoices', {}, 0),
			).rejects.toThrow('MCP tool returned an error');
		});

		it('should return valid result on success', async () => {
			const expectedResult: McpToolResult = {
				content: [{ type: 'text', text: '{"count":5}' }],
				isError: false,
			};

			mockHttpRequestWithAuthentication.mockResolvedValue({
				jsonrpc: '2.0',
				id: 'test',
				result: expectedResult,
			});

			const result = await callMcpTool(mockExecuteFunctions, 'get_invoices', {}, 0);

			expect(result).toEqual(expectedResult);
		});
	});

	describe('parseToolResult', () => {
		it('should parse JSON text content', () => {
			const result: McpToolResult = {
				content: [{ type: 'text', text: '{"invoices":[{"id":1}]}' }],
			};

			const parsed = parseToolResult(result);
			expect(parsed).toEqual({ invoices: [{ id: 1 }] });
		});

		it('should concatenate multiple text blocks', () => {
			const result: McpToolResult = {
				content: [
					{ type: 'text', text: '{"part' },
					{ type: 'text', text: '":"value"}' },
				],
			};

			const parsed = parseToolResult(result);
			expect(parsed).toEqual({ part: 'value' });
		});

		it('should return rawText for non-JSON content', () => {
			const result: McpToolResult = {
				content: [{ type: 'text', text: 'Not valid JSON' }],
			};

			const parsed = parseToolResult(result);
			expect(parsed).toEqual({ rawText: 'Not valid JSON' });
		});

		it('should ignore non-text content types', () => {
			const result: McpToolResult = {
				content: [
					{ type: 'image', text: 'base64data' },
					{ type: 'text', text: '{"key":"val"}' },
				],
			};

			const parsed = parseToolResult(result);
			expect(parsed).toEqual({ key: 'val' });
		});

		it('should handle array responses', () => {
			const result: McpToolResult = {
				content: [{ type: 'text', text: '[{"id":1},{"id":2}]' }],
			};

			const parsed = parseToolResult(result);
			expect(parsed).toEqual([{ id: 1 }, { id: 2 }]);
		});
	});
});

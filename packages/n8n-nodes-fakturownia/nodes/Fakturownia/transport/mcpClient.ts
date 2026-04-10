import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export interface McpToolResult {
	content: Array<{ type: string; text: string }>;
	isError?: boolean;
}

export interface McpJsonRpcResponse {
	jsonrpc: string;
	id: string;
	result?: McpToolResult;
	error?: { code: number; message: string; data?: unknown };
}

export async function callMcpTool(
	executeFunctions: IExecuteFunctions,
	toolName: string,
	args: Record<string, unknown>,
	itemIndex: number,
): Promise<McpToolResult> {
	const credentials = await executeFunctions.getCredentials('fakturowniaApi');
	const serverUrl = (credentials.serverUrl as string).replace(/\/+$/, '');

	const options: IHttpRequestOptions = {
		method: 'POST' as IHttpRequestMethods,
		url: `${serverUrl}/fakturownia/stream`,
		body: {
			jsonrpc: '2.0',
			id: `n8n-${Date.now()}-${itemIndex}`,
			method: 'tools/call',
			params: {
				name: toolName,
				arguments: args,
			},
		},
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
		returnFullResponse: false,
	};

	const response = (await executeFunctions.helpers.httpRequestWithAuthentication.call(
		executeFunctions,
		'fakturowniaApi',
		options,
	)) as McpJsonRpcResponse;

	if (response.error) {
		throw new NodeApiError(executeFunctions.getNode(), {
			message: response.error.message,
			description: `MCP Error (code ${response.error.code}): ${JSON.stringify(response.error.data ?? '')}`,
		});
	}

	if (!response.result) {
		throw new NodeApiError(executeFunctions.getNode(), {
			message: 'Empty response from MCP server',
			description: 'The MCP server returned a response without a result.',
		});
	}

	if (response.result.isError) {
		const errorText = response.result.content
			.map((c) => c.text)
			.join('\n');
		throw new NodeApiError(executeFunctions.getNode(), {
			message: 'MCP tool returned an error',
			description: errorText,
		});
	}

	return response.result;
}

export function parseToolResult(result: McpToolResult): IDataObject | IDataObject[] {
	const text = result.content
		.filter((c) => c.type === 'text')
		.map((c) => c.text)
		.join('');

	try {
		return JSON.parse(text) as IDataObject | IDataObject[];
	} catch {
		return { rawText: text } as IDataObject;
	}
}

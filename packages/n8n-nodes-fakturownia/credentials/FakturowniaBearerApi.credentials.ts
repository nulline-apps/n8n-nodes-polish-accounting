import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FakturowniaBearerApi implements ICredentialType {
	name = 'fakturowniaBearerApi';

	displayName = 'Fakturownia (Bearer)';

	documentationUrl = 'https://github.com/nulline-apps/n8n-nodes-polish-accounting/tree/main/packages/n8n-nodes-fakturownia';

	properties: INodeProperties[] = [
		{
			displayName: 'MCP Server URL',
			name: 'serverUrl',
			type: 'string',
			default: 'https://fakto.app',
			placeholder: 'https://fakto.app',
			description: 'URL of the MCP server (fakto.app hosted or self-hosted)',
		},
		{
			displayName: 'Bearer Token',
			name: 'bearerToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Bearer token generated in fakto.app after activating a subscription',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.bearerToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: '={{$credentials.serverUrl.replace(/\\/+$/,"")}}/fakturownia/invoices/list',
			body: { limit: 1 },
			headers: { 'Content-Type': 'application/json' },
		},
	};
}

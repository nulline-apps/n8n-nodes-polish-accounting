import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FakturowniaApi implements ICredentialType {
	name = 'fakturowniaApi';

	displayName = 'Fakturownia API';

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
			displayName: 'API Token',
			name: 'token',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Fakturownia API token',
		},
		{
			displayName: 'Subdomain',
			name: 'subdomain',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'mycompany',
			description: 'Your Fakturownia subdomain (e.g. "mycompany" from mycompany.fakturownia.pl)',
		},
		{
			displayName: 'Subscription API Key',
			name: 'subscriptionApiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Fakto subscription API key for service access',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-fakturownia-credentials':
					'={{JSON.stringify({token:$credentials.token,subdomain:$credentials.subdomain,subscriptionApiKey:$credentials.subscriptionApiKey})}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: '={{$credentials.serverUrl.replace(/\\/+$/,"")}}/fakturownia/stream',
			body: {
				jsonrpc: '2.0',
				id: 'credential-test',
				method: 'initialize',
				params: {
					protocolVersion: '2024-11-05',
					capabilities: {},
					clientInfo: { name: 'n8n-fakturownia-test', version: '0.1.0' },
				},
			},
			headers: { 'Content-Type': 'application/json' },
		},
	};
}

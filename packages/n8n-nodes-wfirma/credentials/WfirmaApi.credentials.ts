import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WfirmaApi implements ICredentialType {
	name = 'wfirmaApi';

	displayName = 'wFirma API';

	documentationUrl = 'https://github.com/your-org/n8n-nodes-wfirma';

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
			displayName: 'Access Key',
			name: 'accessKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'wFirma API Access Key',
		},
		{
			displayName: 'Secret Key',
			name: 'secretKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'wFirma API Secret Key',
		},
		{
			displayName: 'App Key',
			name: 'appKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'wFirma API App Key',
		},
		{
			displayName: 'Company ID',
			name: 'companyId',
			type: 'string',
			default: '',
			description: 'wFirma Company ID (optional, for multi-company accounts)',
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
				'x-wfirma-credentials':
					'={{JSON.stringify({accessKey:$credentials.accessKey,secretKey:$credentials.secretKey,appKey:$credentials.appKey,companyId:$credentials.companyId||undefined,subscriptionApiKey:$credentials.subscriptionApiKey})}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: '={{$credentials.serverUrl.replace(/\\/+$/,"")}}/wfirma/stream',
			body: {
				jsonrpc: '2.0',
				id: 'credential-test',
				method: 'initialize',
				params: {
					protocolVersion: '2024-11-05',
					capabilities: {},
					clientInfo: { name: 'n8n-wfirma-test', version: '0.1.0' },
				},
			},
			headers: { 'Content-Type': 'application/json' },
		},
	};
}

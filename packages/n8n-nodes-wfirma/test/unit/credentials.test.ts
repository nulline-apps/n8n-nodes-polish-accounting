import { WfirmaApi } from '../../credentials/WfirmaApi.credentials';

describe('WfirmaApi Credentials', () => {
	let credentials: WfirmaApi;

	beforeEach(() => {
		credentials = new WfirmaApi();
	});

	it('should have correct name and displayName', () => {
		expect(credentials.name).toBe('wfirmaApi');
		expect(credentials.displayName).toBe('wFirma API');
	});

	it('should define all required properties', () => {
		const propNames = credentials.properties.map((p) => p.name);
		expect(propNames).toContain('serverUrl');
		expect(propNames).toContain('accessKey');
		expect(propNames).toContain('secretKey');
		expect(propNames).toContain('appKey');
		expect(propNames).toContain('companyId');
		expect(propNames).toContain('subscriptionApiKey');
	});

	it('should have password type for secret fields', () => {
		const secretFields = ['accessKey', 'secretKey', 'appKey', 'subscriptionApiKey'];
		for (const fieldName of secretFields) {
			const field = credentials.properties.find((p) => p.name === fieldName);
			expect(field?.typeOptions).toEqual(expect.objectContaining({ password: true }));
		}
	});

	it('should default serverUrl to fakto.app', () => {
		const serverUrl = credentials.properties.find((p) => p.name === 'serverUrl');
		expect(serverUrl?.default).toBe('https://fakto.app');
	});

	it('should configure generic authentication with x-wfirma-credentials header', () => {
		expect(credentials.authenticate).toEqual(
			expect.objectContaining({
				type: 'generic',
				properties: expect.objectContaining({
					headers: expect.objectContaining({
						'x-wfirma-credentials': expect.stringContaining('JSON.stringify'),
					}),
				}),
			}),
		);
	});

	it('should configure credential test request', () => {
		expect(credentials.test).toBeDefined();
		expect(credentials.test.request).toBeDefined();
		expect(credentials.test.request.method).toBe('POST');
		expect(credentials.test.request.body).toEqual(
			expect.objectContaining({
				jsonrpc: '2.0',
				method: 'initialize',
			}),
		);
	});
});

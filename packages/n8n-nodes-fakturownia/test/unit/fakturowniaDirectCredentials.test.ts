import { FakturowniaDirectApi } from '../../credentials/FakturowniaDirectApi.credentials';

describe('FakturowniaDirectApi Credentials', () => {
	let credentials: FakturowniaDirectApi;

	beforeEach(() => {
		credentials = new FakturowniaDirectApi();
	});

	it('should have correct name and displayName', () => {
		expect(credentials.name).toBe('fakturowniaDirectApi');
		expect(credentials.displayName).toContain('Direct');
	});

	it('should define all required fields', () => {
		const propNames = credentials.properties.map((p) => p.name);
		expect(propNames).toContain('faktoServerUrl');
		expect(propNames).toContain('subscriptionApiKey');
		expect(propNames).toContain('subdomain');
		expect(propNames).toContain('apiToken');
	});

	it('should mark secret fields as password', () => {
		for (const fieldName of ['subscriptionApiKey', 'apiToken']) {
			const field = credentials.properties.find((p) => p.name === fieldName);
			expect(field?.typeOptions).toEqual(expect.objectContaining({ password: true }));
		}
	});

	it('should default faktoServerUrl to fakto.app', () => {
		const serverUrl = credentials.properties.find((p) => p.name === 'faktoServerUrl');
		expect(serverUrl?.default).toBe('https://fakto.app');
	});

	it('should be tested by the custom node test (no generic authenticate)', () => {
		expect((credentials as any).testedBy).toBe('fakturowniaDirectTest');
		expect((credentials as any).authenticate).toBeUndefined();
	});
});

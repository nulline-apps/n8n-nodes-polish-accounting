import { FakturowniaBearerApi } from '../../credentials/FakturowniaBearerApi.credentials';

describe('FakturowniaBearerApi Credentials', () => {
	let credentials: FakturowniaBearerApi;

	beforeEach(() => {
		credentials = new FakturowniaBearerApi();
	});

	it('should have correct name and displayName', () => {
		expect(credentials.name).toBe('fakturowniaBearerApi');
		expect(credentials.displayName).toBe('Fakturownia (Bearer)');
	});

	it('should define serverUrl and bearerToken properties', () => {
		const propNames = credentials.properties.map((p) => p.name);
		expect(propNames).toContain('serverUrl');
		expect(propNames).toContain('bearerToken');
	});

	it('should mark bearerToken as a password field', () => {
		const field = credentials.properties.find((p) => p.name === 'bearerToken');
		expect(field?.typeOptions).toEqual(expect.objectContaining({ password: true }));
	});

	it('should default serverUrl to fakto.app', () => {
		const serverUrl = credentials.properties.find((p) => p.name === 'serverUrl');
		expect(serverUrl?.default).toBe('https://fakto.app');
	});

	it('should send an Authorization Bearer header', () => {
		expect(credentials.authenticate).toEqual(
			expect.objectContaining({
				type: 'generic',
				properties: expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: expect.stringContaining('Bearer'),
					}),
				}),
			}),
		);
	});

	it('should test against the invoices REST list endpoint', () => {
		expect(credentials.test.request.method).toBe('POST');
		expect(credentials.test.request.url).toContain('/fakturownia/invoices/list');
		expect(credentials.test.request.body).toEqual({ limit: 1 });
	});
});

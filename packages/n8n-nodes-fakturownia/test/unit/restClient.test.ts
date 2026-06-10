import { callInvoiceApi } from '../../nodes/FakturowniaInvoices/transport/restClient';

const mockHttpRequestWithAuthentication = jest.fn();

const mockExecuteFunctions = {
	getCredentials: jest.fn().mockResolvedValue({ serverUrl: 'https://fakto.app' }),
	helpers: {
		httpRequestWithAuthentication: mockHttpRequestWithAuthentication,
	},
	getNode: jest.fn().mockReturnValue({ name: 'Fakturownia Invoices', type: 'fakturowniaInvoices' }),
} as any;

describe('restClient (FakturowniaInvoices)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should POST to /fakturownia/invoices/:action with the chosen credential', async () => {
		mockHttpRequestWithAuthentication.mockResolvedValue({ invoices: [] });

		await callInvoiceApi(mockExecuteFunctions, 'fakturowniaBearerApi', 'list', { limit: 1 }, 0);

		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
			'fakturowniaBearerApi',
			expect.objectContaining({
				method: 'POST',
				url: 'https://fakto.app/fakturownia/invoices/list',
				body: { limit: 1 },
				json: true,
			}),
		);
	});

	it('should strip trailing slashes from serverUrl', async () => {
		mockExecuteFunctions.getCredentials.mockResolvedValueOnce({ serverUrl: 'https://fakto.app/' });
		mockHttpRequestWithAuthentication.mockResolvedValue({});

		await callInvoiceApi(mockExecuteFunctions, 'fakturowniaApi', 'create', {}, 0);

		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
			'fakturowniaApi',
			expect.objectContaining({ url: 'https://fakto.app/fakturownia/invoices/create' }),
		);
	});

	it('should wrap HTTP errors in NodeApiError', async () => {
		mockHttpRequestWithAuthentication.mockRejectedValue({ message: 'Forbidden', httpCode: '403' });

		await expect(
			callInvoiceApi(mockExecuteFunctions, 'fakturowniaApi', 'list', {}, 0),
		).rejects.toThrow();
	});

	it('should return the parsed response body unchanged', async () => {
		const body = { invoices: [{ id: 1 }] };
		mockHttpRequestWithAuthentication.mockResolvedValue(body);

		const result = await callInvoiceApi(mockExecuteFunctions, 'fakturowniaApi', 'list', {}, 0);
		expect(result).toEqual(body);
	});
});

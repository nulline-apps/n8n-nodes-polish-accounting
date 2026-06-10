import {
	assertLicense,
	callDirect,
	normalizePositions,
	type DirectCredentials,
} from '../../nodes/FakturowniaInvoices/transport/fakturowniaDirectClient';

const cred: DirectCredentials = {
	faktoServerUrl: 'https://fakto.app',
	subscriptionApiKey: 'sub_key_1234567890',
	subdomain: 'testco',
	apiToken: 'tok_abc123',
};

function makeEf(httpRequest: jest.Mock, staticData: Record<string, unknown> = {}) {
	return {
		helpers: { httpRequest },
		getNode: () => ({ name: 'Fakturownia Invoices', type: 'fakturowniaInvoices' }),
		getWorkflowStaticData: () => staticData,
	} as any;
}

describe('fakturowniaDirectClient', () => {
	describe('callDirect — api_token placement & URLs', () => {
		it('GET (getMany): api_token in query, hits *.fakturownia.pl', async () => {
			const httpRequest = jest.fn().mockResolvedValue([]);
			await callDirect(makeEf(httpRequest), cred, 'getMany', { limit: 10, income: '1' }, 0);

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: 'https://testco.fakturownia.pl/invoices.json',
					qs: expect.objectContaining({ api_token: 'tok_abc123', per_page: 10, income: '1' }),
				}),
			);
		});

		it('POST (create): api_token in body, wrapped in { invoice }', async () => {
			const httpRequest = jest.fn().mockResolvedValue({ id: 1 });
			await callDirect(makeEf(httpRequest), cred, 'create', {
				sell_date: '2024-01-01', issue_date: '2024-01-01', payment_to: '2024-01-15',
				client_id: 5,
				positions: [{ name: 'Usługa', quantity: 2, price_net: 100, tax: '23' }],
			}, 0);

			const opts = httpRequest.mock.calls[0][0];
			expect(opts.method).toBe('POST');
			expect(opts.url).toBe('https://testco.fakturownia.pl/invoices.json');
			expect(opts.body.api_token).toBe('tok_abc123');
			expect(opts.body.invoice.client_id).toBe(5);
			expect(opts.body.invoice.positions[0].total_price_gross).toBeCloseTo(246); // 2*100*1.23
		});

		it('PUT (update): targets /invoices/{id}.json and strips id from invoice body', async () => {
			const httpRequest = jest.fn().mockResolvedValue({ id: 42 });
			await callDirect(makeEf(httpRequest), cred, 'update', { id: 42, payment_to: '2024-02-01' }, 0);

			const opts = httpRequest.mock.calls[0][0];
			expect(opts.method).toBe('PUT');
			expect(opts.url).toBe('https://testco.fakturownia.pl/invoices/42.json');
			expect(opts.body.invoice.id).toBeUndefined();
			expect(opts.body.invoice.payment_to).toBe('2024-02-01');
		});

		it('downloadPdf: requests .pdf as binary and returns base64 payload', async () => {
			const httpRequest = jest.fn().mockResolvedValue(Buffer.from('PDFDATA'));
			const res = (await callDirect(makeEf(httpRequest), cred, 'downloadPdf', { id: 7 }, 0)) as any;

			expect(httpRequest.mock.calls[0][0]).toEqual(
				expect.objectContaining({ url: 'https://testco.fakturownia.pl/invoices/7.pdf', encoding: 'arraybuffer' }),
			);
			expect(res.pdf_base64).toBe(Buffer.from('PDFDATA').toString('base64'));
			expect(res.mime_type).toBe('application/pdf');
		});

		it('getByClientTaxNo: maps tax_no -> buyer_tax_no filter', async () => {
			const httpRequest = jest.fn().mockResolvedValue([]);
			await callDirect(makeEf(httpRequest), cred, 'getByClientTaxNo', { tax_no: '1234567890', limit: 50 }, 0);

			const opts = httpRequest.mock.calls[0][0];
			expect(opts.qs.buyer_tax_no).toBe('1234567890');
			expect(opts.qs.tax_no).toBeUndefined();
		});
	});

	describe('assertLicense — daily gating', () => {
		it('skips the network call when a fresh active result is cached', async () => {
			const httpRequest = jest.fn();
			const staticData = {
				[`faktoLicense:${require('crypto').createHash('sha256').update(cred.subscriptionApiKey).digest('hex').slice(0, 16)}`]:
					{ verifiedAt: Date.now(), active: true },
			};
			await assertLicense(makeEf(httpRequest, staticData), cred);
			expect(httpRequest).not.toHaveBeenCalled();
		});

		it('verifies and passes when fakto.app returns active:true', async () => {
			const httpRequest = jest.fn().mockResolvedValue({ body: { active: true, status: 'active' } });
			const staticData: Record<string, unknown> = {};
			await expect(assertLicense(makeEf(httpRequest, staticData), cred)).resolves.toBeUndefined();
			expect(httpRequest).toHaveBeenCalled();
		});

		it('blocks when subscription is inactive (200 active:false)', async () => {
			const httpRequest = jest.fn().mockResolvedValue({ body: { active: false, status: 'cancelled' } });
			await expect(assertLicense(makeEf(httpRequest), cred)).rejects.toThrow(/nieaktywna/i);
		});

		it('blocks on explicit 401 from fakto.app', async () => {
			const httpRequest = jest.fn().mockRejectedValue({ statusCode: 401 });
			await expect(assertLicense(makeEf(httpRequest), cred)).rejects.toThrow();
		});

		it('fail-open on network error (does not throw, does not cache)', async () => {
			const httpRequest = jest.fn().mockRejectedValue({ message: 'ECONNREFUSED' });
			const staticData: Record<string, unknown> = {};
			await expect(assertLicense(makeEf(httpRequest, staticData), cred)).resolves.toBeUndefined();
			expect(Object.keys(staticData)).toHaveLength(0);
		});
	});

	describe('normalizePositions', () => {
		it('computes totals from unit price, quantity and VAT', () => {
			const out = normalizePositions([{ name: 'A', quantity: 3, price_net: 50, tax: '23' }])!;
			expect(out[0].tax).toBe(23);
			expect(out[0].total_price_net).toBeCloseTo(150);
			expect(out[0].total_price_gross).toBeCloseTo(184.5);
		});

		it('keeps id and _destroy untouched', () => {
			const out = normalizePositions([{ id: 9, _destroy: true, name: 'X', tax: '8' }])!;
			expect(out[0].id).toBe(9);
			expect(out[0]._destroy).toBe(true);
		});

		it('returns input unchanged when empty/undefined', () => {
			expect(normalizePositions(undefined)).toBeUndefined();
			expect(normalizePositions([])).toEqual([]);
		});
	});
});

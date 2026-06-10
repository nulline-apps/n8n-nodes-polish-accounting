import type { ICredentialType, INodeProperties } from 'n8n-workflow';

// Tryb "Direct": node łączy się bezpośrednio z API Fakturowni (subdomain + apiToken),
// a klucz subskrypcji fakto.app pełni rolę licencji weryfikowanej ~raz na dobę.
// Brak bloku `authenticate` - api_token wstrzykuje transport node'a ręcznie (query dla GET,
// body dla POST/PUT). Test danych logowania robi `methods.credentialTest.fakturowniaDirectTest`
// na node'cie (dwa żądania po kolei: licencja fakto.app -> połączenie z Fakturownią).
export class FakturowniaDirectApi implements ICredentialType {
	name = 'fakturowniaDirectApi';

	displayName = 'Fakturownia (Direct + Fakto.app license)';

	documentationUrl = 'https://github.com/nulline-apps/n8n-nodes-polish-accounting/tree/main/packages/n8n-nodes-fakturownia';

	// Wskazuje custom test zdefiniowany w node'cie FakturowniaInvoices.
	testedBy = 'fakturowniaDirectTest';

	properties: INodeProperties[] = [
		{
			displayName: 'Fakto.app Server URL',
			name: 'faktoServerUrl',
			type: 'string',
			default: 'https://fakto.app',
			placeholder: 'https://fakto.app',
			description: 'URL of the fakto.app server used to verify the subscription (license check)',
		},
		{
			displayName: 'Fakto.app Subscription Key',
			name: 'subscriptionApiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your fakto.app subscription key. Required as a license; verified about once a day.',
		},
		{
			displayName: 'Fakturownia Subdomain',
			name: 'subdomain',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'mycompany',
			description: 'Your Fakturownia subdomain (e.g. "mycompany" from mycompany.fakturownia.pl)',
		},
		{
			displayName: 'Fakturownia API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Fakturownia API token (used to call the Fakturownia API directly)',
		},
	];
}

import type { INodeProperties } from 'n8n-workflow';

// Operacje faktur (bez selektora resource - node obsługuje wyłącznie faktury).
// Wartości operacji są zgodne z istniejącym node'em "Fakturownia MCP" dla spójności,
// a mapowanie operacja -> akcja REST żyje w FakturowniaInvoices.node.ts (OPERATION_TO_ACTION).
export const invoiceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'Create', value: 'create', description: 'Create a new invoice', action: 'Create an invoice' },
			{ name: 'Download PDF', value: 'downloadPdf', description: 'Download invoice as PDF', action: 'Download an invoice PDF' },
			{ name: 'Get', value: 'get', description: 'Get a single invoice by ID', action: 'Get an invoice' },
			{ name: 'Get by Client', value: 'getByClient', description: 'Get invoices for a client', action: 'Get invoices by client' },
			{ name: 'Get by Client Tax No', value: 'getByClientTaxNo', description: 'Get invoices by client NIP', action: 'Get invoices by client tax no' },
			{ name: 'Get by Number', value: 'getByNumber', description: 'Get invoice by number', action: 'Get an invoice by number' },
			{ name: 'Get Many', value: 'getMany', description: 'Get many invoices with filters', action: 'Get many invoices' },
			{ name: 'Search', value: 'search', description: 'Full-text search invoices', action: 'Search invoices' },
			{ name: 'Update', value: 'update', description: 'Update an existing invoice', action: 'Update an invoice' },
		],
		default: 'getMany',
	},
];

// Wspólne pola jednej pozycji faktury. Model danych dopasowany do najbardziej
// naturalnego wprowadzania: nazwa + ilość + cena jednostkowa netto + VAT.
// Serwer MCP sam policzy total_price_net/gross, jeśli nie podasz ich jawnie.
const positionValueFields: INodeProperties[] = [
	{ displayName: 'Name', name: 'name', type: 'string', default: '', description: 'Position name' },
	{ displayName: 'Quantity', name: 'quantity', type: 'number', default: 1, description: 'Quantity' },
	{ displayName: 'Unit Price Net', name: 'price_net', type: 'number', default: 0, description: 'Net price per unit (totals are computed by the server when not given)' },
	{
		displayName: 'VAT Rate', name: 'tax', type: 'options', default: '23',
		options: [
			{ name: '23%', value: '23' }, { name: '8%', value: '8' },
			{ name: '5%', value: '5' }, { name: '0%', value: '0' },
		],
		description: 'VAT rate',
	},
	{ displayName: 'Total Price Gross', name: 'total_price_gross', type: 'number', default: 0, description: 'Override the gross total for this position (otherwise computed from unit price, quantity and VAT)' },
	{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'Position description' },
];

// Pozycje przy CREATE - wszystkie linie są nowe, więc bez ID i bez kasowania.
// Name oznaczone jako wymagane (przy tworzeniu nazwa pozycji jest obowiązkowa).
const createPositionValueFields: INodeProperties[] = [
	{ displayName: 'Name', name: 'name', type: 'string', default: '', required: true, description: 'Position name' },
	...positionValueFields.slice(1),
];

const positionsCollection: INodeProperties = {
	displayName: 'Positions',
	name: 'positions',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	placeholder: 'Add Position',
	default: { position: [{ name: '', quantity: 1, price_net: 0, tax: '23' }] },
	options: [
		{
			displayName: 'Position',
			name: 'position',
			values: createPositionValueFields,
		},
	],
};

// Pozycje przy UPDATE - Fakturownia scala je z istniejącymi (nie zastępuje listy):
// brak ID = nowa linia, ID = modyfikacja tej linii, ID + Delete = usunięcie.
const positionsUpdateCollection: INodeProperties = {
	displayName: 'Positions',
	name: 'positions',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	placeholder: 'Add Position',
	default: {},
	description:
		'Add, modify, or delete line items. This MERGES with the invoice\'s existing positions — it does not replace them. A row with no Position ID adds a new line; a row with a Position ID modifies that line; tick Delete This Line (with the ID) to remove it. Lines you do not list stay unchanged.',
	options: [
		{
			displayName: 'Position',
			name: 'position',
			values: [
				{ displayName: 'Position ID', name: 'id', type: 'number', default: 0, description: 'Leave at 0 to ADD a new line. Set to an existing line\'s ID to modify or delete it (find IDs via Get → positions[].id)' },
				...positionValueFields,
				{ displayName: 'Delete This Line', name: '_destroy', type: 'boolean', default: false, description: 'Remove this line from the invoice. Requires a Position ID' },
			],
		},
	],
};

// Opcjonalne pola dat (create/update). API Fakturownia auto-uzupełnia je dzisiejszą datą,
// dlatego nie są wymagane.
const dateOptions: INodeProperties['options'] = [
	{ displayName: 'Sell Date', name: 'sell_date', type: 'string', default: '', placeholder: '2024-01-15', description: 'Sale date (YYYY-MM-DD). Defaults to today if empty.' },
	{ displayName: 'Issue Date', name: 'issue_date', type: 'string', default: '', placeholder: '2024-01-15', description: 'Issue date (YYYY-MM-DD). Defaults to today if empty.' },
	{ displayName: 'Payment To', name: 'payment_to', type: 'string', default: '', placeholder: '2024-01-29', description: 'Payment due date (YYYY-MM-DD). Computed by Fakturownia if empty.' },
];

// Opcjonalne pola nagłówka dokumentu.
const docOptions: INodeProperties['options'] = [
	{
		displayName: 'Income', name: 'income', type: 'options', default: '1',
		options: [{ name: 'Sales (Income)', value: '1' }, { name: 'Cost', value: '0' }],
		description: 'Cost invoice requires income = Cost + Kind = VAT + a manual Number',
	},
	{ displayName: 'Number', name: 'number', type: 'string', default: '', description: 'Invoice number. Required for cost invoices (income = Cost); auto-generated for sales' },
	{
		displayName: 'Kind', name: 'kind', type: 'options', default: 'vat',
		options: [
			{ name: 'VAT Invoice', value: 'vat' }, { name: 'Pro Forma', value: 'proforma' },
			{ name: 'Receipt', value: 'receipt' }, { name: 'Estimate', value: 'estimate' },
			{ name: 'Advance', value: 'advance' }, { name: 'Final', value: 'final' },
			{ name: 'Correction', value: 'correction' },
		],
		description: 'Document type. For cost invoices use VAT + income = Cost (not Kind = Cost)',
	},
	{ displayName: 'Department ID', name: 'department_id', type: 'number', default: 0, description: 'Fakturownia department (seller) ID' },
	{ displayName: 'Currency', name: 'currency', type: 'string', default: 'PLN', description: 'Currency (default PLN)' },
	{ displayName: 'Payment Type', name: 'payment_type', type: 'string', default: '', description: 'transfer, cash, card, check, compensation' },
	{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'Invoice notes/description' },
	{ displayName: 'Description Footer', name: 'description_footer', type: 'string', default: '', description: 'Invoice footer text' },
];

// Dodatkowe dane nabywcy (gdy nie używasz istniejącego klienta / chcesz nadpisać).
const buyerExtraOptions: INodeProperties['options'] = [
	{ displayName: 'Buyer Tax No (NIP)', name: 'buyer_tax_no', type: 'string', default: '' },
	{ displayName: 'Buyer Email', name: 'buyer_email', type: 'string', default: '' },
	{ displayName: 'Buyer Post Code', name: 'buyer_post_code', type: 'string', default: '' },
	{ displayName: 'Buyer City', name: 'buyer_city', type: 'string', default: '' },
	{ displayName: 'Buyer Street', name: 'buyer_street', type: 'string', default: '' },
	{ displayName: 'Buyer Country', name: 'buyer_country', type: 'string', default: '' },
];

// Dane sprzedawcy (zwykle pobierane z konta - nadpisuj tylko gdy trzeba).
const sellerOptions: INodeProperties['options'] = [
	{ displayName: 'Seller Name', name: 'seller_name', type: 'string', default: '' },
	{ displayName: 'Seller Tax No', name: 'seller_tax_no', type: 'string', default: '' },
	{ displayName: 'Seller Post Code', name: 'seller_post_code', type: 'string', default: '' },
	{ displayName: 'Seller City', name: 'seller_city', type: 'string', default: '' },
	{ displayName: 'Seller Street', name: 'seller_street', type: 'string', default: '' },
	{ displayName: 'Seller Country', name: 'seller_country', type: 'string', default: '' },
];

export const invoiceFields: INodeProperties[] = [
	// --- ID-based operations ---
	{
		displayName: 'Invoice ID',
		name: 'invoiceId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { operation: ['get', 'downloadPdf', 'update'] } },
		description: 'The ID of the invoice',
	},
	{
		displayName: 'Invoice Number',
		name: 'number',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { operation: ['getByNumber'] } },
		description: 'The invoice number to search for',
	},
	{
		displayName: 'Client ID',
		name: 'clientId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { operation: ['getByClient'] } },
		description: 'The client ID in Fakturownia',
	},
	{
		displayName: 'Client Tax No (NIP)',
		name: 'taxNo',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { operation: ['getByClientTaxNo'] } },
		description: 'Client tax identification number (NIP, 10 digits)',
	},
	{
		displayName: 'Search Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { operation: ['search'] } },
		description: 'Full-text search across invoice number, client name, items, and notes',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 1000 },
		default: 50,
		displayOptions: { show: { operation: ['getMany', 'getByClient', 'getByClientTaxNo', 'search'] } },
		description: 'Max number of results to return',
	},
	// --- List filters ---
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { operation: ['getMany'] } },
		options: [
			{ displayName: 'Client ID', name: 'client_id', type: 'number', default: 0, description: 'Filter by client ID' },
			{ displayName: 'Currency', name: 'currency', type: 'string', default: '', description: 'Filter by currency (PLN, EUR, USD)' },
			{ displayName: 'Date From', name: 'date_from', type: 'string', default: '', placeholder: '2024-01-01', description: 'Filter from date (YYYY-MM-DD)' },
			{ displayName: 'Date To', name: 'date_to', type: 'string', default: '', placeholder: '2024-12-31', description: 'Filter until date (YYYY-MM-DD)' },
			{
				displayName: 'Income', name: 'income', type: 'options', default: '',
				options: [{ name: 'Yes (Sales)', value: 'yes' }, { name: 'No (Costs)', value: 'no' }],
				description: 'Filter by income type: yes = sales invoices, no = cost invoices',
			},
			{
				displayName: 'Kind', name: 'kind', type: 'options', default: '',
				options: [
					{ name: 'VAT Invoice', value: 'vat' }, { name: 'Pro Forma', value: 'proforma' },
					{ name: 'Receipt', value: 'receipt' }, { name: 'Estimate', value: 'estimate' },
					{ name: 'Advance', value: 'advance' }, { name: 'Final', value: 'final' },
					{ name: 'Correction', value: 'correction' },
				],
				description: 'Filter by document type',
			},
			{ displayName: 'Offset', name: 'offset', type: 'number', default: 0, description: 'Number of results to skip' },
			{
				displayName: 'Paid', name: 'paid', type: 'options', default: '',
				options: [{ name: 'Paid', value: 1 }, { name: 'Unpaid', value: 0 }],
				description: 'Filter by payment status',
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { operation: ['getByClient', 'getByClientTaxNo', 'search'] } },
		options: [
			{ displayName: 'Date From', name: 'date_from', type: 'string', default: '', placeholder: '2024-01-01', description: 'Filter from date (YYYY-MM-DD)' },
			{ displayName: 'Date To', name: 'date_to', type: 'string', default: '', placeholder: '2024-12-31', description: 'Filter until date (YYYY-MM-DD)' },
			{ displayName: 'Offset', name: 'offset', type: 'number', default: 0, description: 'Number of results to skip' },
		],
	},
	// === CREATE: required fields shown up-front ===
	// Buyer: pick an existing contractor by ID (recommended by Fakturownia) or enter a name inline.
	{
		displayName: 'Buyer',
		name: 'buyerMode',
		type: 'options',
		noDataExpression: true,
		default: 'clientId',
		displayOptions: { show: { operation: ['create'] } },
		options: [
			{ name: 'Existing Client (by ID)', value: 'clientId', description: 'Reference a contractor already in Fakturownia (recommended)' },
			{ name: 'New Buyer (by name)', value: 'inline', description: 'Provide buyer name directly; Fakturownia matches or creates the contractor' },
		],
	},
	{
		displayName: 'Client ID',
		name: 'buyerClientId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { operation: ['create'], buyerMode: ['clientId'] } },
		description: 'Fakturownia contractor ID for the buyer',
	},
	{
		displayName: 'Buyer Name',
		name: 'buyerName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { operation: ['create'], buyerMode: ['inline'] } },
		description: 'Buyer (customer) name. Add NIP/address under Additional Fields.',
	},
	// Dates: required server-side by fakto.app (validateInvoiceData), so surfaced up-front.
	{
		displayName: 'Sell Date',
		name: 'sell_date',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2024-01-15',
		displayOptions: { show: { operation: ['create'] } },
		description: 'Sale date (YYYY-MM-DD)',
	},
	{
		displayName: 'Issue Date',
		name: 'issue_date',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2024-01-15',
		displayOptions: { show: { operation: ['create'] } },
		description: 'Issue date (YYYY-MM-DD)',
	},
	{
		displayName: 'Payment To',
		name: 'payment_to',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2024-01-29',
		displayOptions: { show: { operation: ['create'] } },
		description: 'Payment due date (YYYY-MM-DD)',
	},
	// Positions: at least one line item is required.
	{
		...positionsCollection,
		required: true,
		displayOptions: { show: { operation: ['create'] } },
		description: 'Invoice line items (at least one required)',
	},
	// Create: everything else is optional.
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { operation: ['create'] } },
		options: [
			...docOptions,
			...buyerExtraOptions,
			...sellerOptions,
		],
	},
	// === UPDATE: ID + optional changes ===
	{
		...positionsUpdateCollection,
		displayOptions: { show: { operation: ['update'] } },
	},
	{
		displayName: 'Update Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { operation: ['update'] } },
		options: [
			...dateOptions,
			...docOptions,
			{ displayName: 'Client ID', name: 'client_id', type: 'number', default: 0, description: 'Buyer contractor ID' },
			{ displayName: 'Buyer Name', name: 'buyer_name', type: 'string', default: '' },
			...buyerExtraOptions,
			...sellerOptions,
		],
	},
	// --- Escape hatch: raw JSON merged over built args (create/update) ---
	{
		displayName: 'Raw JSON Override',
		name: 'rawJsonOverride',
		type: 'json',
		default: '',
		displayOptions: { show: { operation: ['create', 'update'] } },
		description: 'Optional raw JSON merged on top of the fields above. Use for parameters not exposed by the form.',
	},
];

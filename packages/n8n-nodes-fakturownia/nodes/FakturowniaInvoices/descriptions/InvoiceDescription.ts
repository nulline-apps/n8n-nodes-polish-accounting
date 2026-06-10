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

// Wspólne pozycje faktury (fixedCollection) - używane przez create i update.
const positionsCollection: INodeProperties = {
	displayName: 'Positions',
	name: 'positions',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	placeholder: 'Add Position',
	default: {},
	options: [
		{
			displayName: 'Position',
			name: 'position',
			values: [
				{ displayName: 'Name', name: 'name', type: 'string', default: '', description: 'Position name' },
				{ displayName: 'Quantity', name: 'quantity', type: 'number', default: 1, description: 'Quantity' },
				{
					displayName: 'Tax (VAT %)', name: 'tax', type: 'options', default: '23',
					options: [
						{ name: '23%', value: '23' }, { name: '8%', value: '8' },
						{ name: '5%', value: '5' }, { name: '0%', value: '0' },
					],
					description: 'VAT rate',
				},
				{ displayName: 'Unit Price Net', name: 'price_net', type: 'number', default: 0, description: 'Unit net price' },
				{ displayName: 'Unit Price Gross', name: 'price_gross', type: 'number', default: 0, description: 'Unit gross price' },
				{ displayName: 'Total Price Net', name: 'total_price_net', type: 'number', default: 0, description: 'Total net price for the position' },
				{ displayName: 'Total Price Gross', name: 'total_price_gross', type: 'number', default: 0, description: 'Total gross price for the position (required by API)' },
				{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'Position description' },
			],
		},
	],
};

// Opcjonalne pola nagłówka faktury (create/update) - kupiec/sprzedawca, typ, waluta itd.
const invoiceHeaderOptions: INodeProperties['options'] = [
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
	{ displayName: 'Client ID', name: 'client_id', type: 'number', default: 0, description: 'Fakturownia contractor ID (alternative to buyer_*/seller_* fields)' },
	{ displayName: 'Department ID', name: 'department_id', type: 'number', default: 0, description: 'Fakturownia department ID (alternative to seller_*/buyer_* fields)' },
	{ displayName: 'Seller Name', name: 'seller_name', type: 'string', default: '' },
	{ displayName: 'Seller Tax No', name: 'seller_tax_no', type: 'string', default: '' },
	{ displayName: 'Seller Post Code', name: 'seller_post_code', type: 'string', default: '' },
	{ displayName: 'Seller City', name: 'seller_city', type: 'string', default: '' },
	{ displayName: 'Seller Street', name: 'seller_street', type: 'string', default: '' },
	{ displayName: 'Seller Country', name: 'seller_country', type: 'string', default: '' },
	{ displayName: 'Buyer Name', name: 'buyer_name', type: 'string', default: '' },
	{ displayName: 'Buyer Tax No', name: 'buyer_tax_no', type: 'string', default: '' },
	{ displayName: 'Buyer Post Code', name: 'buyer_post_code', type: 'string', default: '' },
	{ displayName: 'Buyer City', name: 'buyer_city', type: 'string', default: '' },
	{ displayName: 'Buyer Street', name: 'buyer_street', type: 'string', default: '' },
	{ displayName: 'Buyer Country', name: 'buyer_country', type: 'string', default: '' },
	{ displayName: 'Currency', name: 'currency', type: 'string', default: 'PLN', description: 'Currency (default PLN)' },
	{ displayName: 'Payment Type', name: 'payment_type', type: 'string', default: '', description: 'transfer, cash, card, check, compensation' },
	{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'Invoice notes/description' },
	{ displayName: 'Description Footer', name: 'description_footer', type: 'string', default: '', description: 'Invoice footer text' },
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
	// --- Create: required header dates ---
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
	// --- Create/Update: positions ---
	{
		...positionsCollection,
		displayOptions: { show: { operation: ['create', 'update'] } },
	},
	// --- Create: optional header fields ---
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { operation: ['create'] } },
		options: invoiceHeaderOptions,
	},
	// --- Update: fields to change (all optional) ---
	{
		displayName: 'Update Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { operation: ['update'] } },
		options: [
			{ displayName: 'Sell Date', name: 'sell_date', type: 'string', default: '', placeholder: '2024-01-15', description: 'Sale date (YYYY-MM-DD)' },
			{ displayName: 'Issue Date', name: 'issue_date', type: 'string', default: '', placeholder: '2024-01-15', description: 'Issue date (YYYY-MM-DD)' },
			{ displayName: 'Payment To', name: 'payment_to', type: 'string', default: '', placeholder: '2024-01-29', description: 'Payment due date (YYYY-MM-DD)' },
			...invoiceHeaderOptions,
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

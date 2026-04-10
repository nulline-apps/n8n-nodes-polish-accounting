import type { INodeProperties } from 'n8n-workflow';

export const invoiceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['invoice'] } },
		options: [
			{ name: 'Create', value: 'create', description: 'Create a new invoice', action: 'Create an invoice' },
			{ name: 'Create With XML', value: 'createXml', description: 'Create invoice using raw XML data', action: 'Create an invoice with XML' },
			{ name: 'Download PDF', value: 'downloadPdf', description: 'Download invoice as PDF', action: 'Download an invoice PDF' },
			{ name: 'Get', value: 'get', description: 'Get a single invoice by ID', action: 'Get an invoice' },
			{ name: 'Get by Number', value: 'getByNumber', description: 'Get invoice by full number', action: 'Get an invoice by number' },
			{ name: 'Get Many', value: 'getMany', description: 'Get many invoices with filters', action: 'Get many invoices' },
			{ name: 'Get by Contractor ID', value: 'getByContractorId', description: 'Get invoices for a contractor', action: 'Get invoices by contractor ID' },
			{ name: 'Get by Contractor NIP', value: 'getByContractorNip', description: 'Get invoices by contractor tax ID', action: 'Get invoices by contractor NIP' },
		],
		default: 'getMany',
	},
];

export const invoiceFields: INodeProperties[] = [
	// --- Get ---
	{
		displayName: 'Invoice ID',
		name: 'invoiceId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['invoice'], operation: ['get', 'downloadPdf'] } },
		description: 'The ID of the invoice',
	},
	// --- Get by Number ---
	{
		displayName: 'Full Number',
		name: 'fullnumber',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['invoice'], operation: ['getByNumber'] } },
		placeholder: 'FV 19/2024',
		description: 'Full invoice number (e.g. "FV 19/2024")',
	},
	// --- Get by Contractor NIP ---
	{
		displayName: 'NIP (Tax ID)',
		name: 'nip',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['invoice'], operation: ['getByContractorNip'] } },
		description: 'Contractor tax identification number (10 digits)',
	},
	// --- Get by Contractor ID ---
	{
		displayName: 'Contractor ID',
		name: 'contractorId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['invoice'], operation: ['getByContractorId'] } },
		description: 'The ID of the contractor in wFirma',
	},
	// --- Create ---
	{
		displayName: 'Contractor ID',
		name: 'contractorId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['invoice'], operation: ['create'] } },
		description: 'The ID of the contractor for the invoice',
	},
	{
		displayName: 'Items (JSON)',
		name: 'items',
		type: 'json',
		required: true,
		default: '[{"name":"Service","quantity":1,"unit_price":100,"vat_rate":23}]',
		displayOptions: { show: { resource: ['invoice'], operation: ['create'] } },
		description: 'Invoice line items as JSON array with name, quantity, unit_price, vat_rate',
	},
	{
		displayName: 'Payment Date',
		name: 'paymentDate',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['invoice'], operation: ['create'] } },
		placeholder: '2025-12-31',
		description: 'Payment due date in YYYY-MM-DD format',
	},
	// --- Create XML ---
	{
		displayName: 'XML Data',
		name: 'xmlData',
		type: 'string',
		typeOptions: { rows: 10 },
		required: true,
		default: '',
		displayOptions: { show: { resource: ['invoice'], operation: ['createXml'] } },
		description: 'Complete XML with invoice data (must contain api/invoices/invoice elements)',
	},
	// --- Get Many & list filters ---
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		displayOptions: { show: { resource: ['invoice'], operation: ['getMany', 'getByContractorId', 'getByContractorNip'] } },
		description: 'Max number of results to return',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['invoice'], operation: ['getMany'] } },
		options: [
			{ displayName: 'Contractor ID', name: 'contractor_id', type: 'string', default: '', description: 'Filter by contractor ID' },
			{ displayName: 'Date From', name: 'date_from', type: 'string', default: '', placeholder: '2024-01-01', description: 'Filter invoices from this date (YYYY-MM-DD)' },
			{ displayName: 'Date To', name: 'date_to', type: 'string', default: '', placeholder: '2024-12-31', description: 'Filter invoices until this date (YYYY-MM-DD)' },
			{ displayName: 'Offset', name: 'offset', type: 'number', default: 0, description: 'Number of results to skip (pagination)' },
			{ displayName: 'Paid', name: 'paid', type: 'boolean', default: false, description: 'Whether to only return paid invoices' },
			{
				displayName: 'Payment Method', name: 'paymentmethod', type: 'options', default: '',
				options: [
					{ name: 'Cash', value: 'cash' }, { name: 'Transfer', value: 'transfer' },
					{ name: 'Compensation', value: 'compensation' }, { name: 'COD', value: 'cod' },
					{ name: 'Payment Card', value: 'payment_card' },
				],
				description: 'Filter by payment method',
			},
			{
				displayName: 'Payment State', name: 'paymentstate', type: 'options', default: '',
				options: [
					{ name: 'Paid', value: 'paid' }, { name: 'Unpaid', value: 'unpaid' },
					{ name: 'Undefined', value: 'undefined' },
				],
				description: 'Filter by payment state',
			},
			{
				displayName: 'Type', name: 'type', type: 'options', default: 'normal',
				options: [
					{ name: 'VAT Invoice', value: 'normal' }, { name: 'Margin Invoice', value: 'margin' },
					{ name: 'Pro Forma', value: 'proforma' }, { name: 'Offer', value: 'offer' },
					{ name: 'Receipt', value: 'receipt_normal' }, { name: 'Fiscal Receipt', value: 'receipt_fiscal_normal' },
					{ name: 'Other Income', value: 'income_normal' }, { name: 'Non-VAT Invoice', value: 'bill' },
				],
				description: 'Filter by document type',
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['invoice'], operation: ['getByContractorId', 'getByContractorNip'] } },
		options: [
			{ displayName: 'Date From', name: 'date_from', type: 'string', default: '', placeholder: '2024-01-01', description: 'Filter from date (YYYY-MM-DD)' },
			{ displayName: 'Date To', name: 'date_to', type: 'string', default: '', placeholder: '2024-12-31', description: 'Filter until date (YYYY-MM-DD)' },
			{ displayName: 'Page', name: 'page', type: 'number', default: 1, description: 'Page number' },
		],
	},
];

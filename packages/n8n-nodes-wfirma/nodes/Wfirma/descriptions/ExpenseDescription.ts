import type { INodeProperties } from 'n8n-workflow';

export const expenseOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['expense'] } },
		options: [
			{ name: 'Get', value: 'get', description: 'Get a single expense by ID', action: 'Get an expense' },
			{ name: 'Get Many', value: 'getMany', description: 'Get many expenses with filters', action: 'Get many expenses' },
		],
		default: 'getMany',
	},
];

export const expenseFields: INodeProperties[] = [
	{
		displayName: 'Expense ID',
		name: 'expenseId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['expense'], operation: ['get'] } },
		description: 'The ID of the expense document',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		displayOptions: { show: { resource: ['expense'], operation: ['getMany'] } },
		description: 'Max number of results to return',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['expense'], operation: ['getMany'] } },
		options: [
			{ displayName: 'Category', name: 'category', type: 'string', default: '', description: 'Filter by category (partial match)' },
			{ displayName: 'Contractor ID', name: 'contractor_id', type: 'string', default: '', description: 'Filter by contractor ID' },
			{ displayName: 'Contractor NIP', name: 'contractor_nip', type: 'string', default: '', description: 'Filter by contractor NIP' },
			{ displayName: 'Date From', name: 'date_from', type: 'string', default: '', placeholder: '2024-01-01', description: 'Filter from date (YYYY-MM-DD)' },
			{ displayName: 'Date To', name: 'date_to', type: 'string', default: '', placeholder: '2024-12-31', description: 'Filter until date (YYYY-MM-DD)' },
			{ displayName: 'Page', name: 'page', type: 'number', default: 1, description: 'Page number' },
			{ displayName: 'Paid', name: 'paid', type: 'boolean', default: false, description: 'Whether to only return paid expenses' },
			{
				displayName: 'Type', name: 'type', type: 'options', default: '',
				options: [
					{ name: 'Invoice', value: 'invoice' }, { name: 'Bill', value: 'bill' },
					{ name: 'VAT Exempt', value: 'vat_exempt' },
				],
				description: 'Expense document type',
			},
		],
	},
];

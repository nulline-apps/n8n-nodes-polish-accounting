import type { INodeProperties } from 'n8n-workflow';

export const paymentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['payment'] } },
		options: [
			{ name: 'Get Details', value: 'getDetails', description: 'Get payment details by payment ID', action: 'Get payment details' },
			{ name: 'Get Details by Object', value: 'getDetailsByObject', description: 'Get payment details by document object ID', action: 'Get payment details by object' },
			{ name: 'Get Many', value: 'getMany', description: 'Get many payments with filters', action: 'Get many payments' },
		],
		default: 'getMany',
	},
];

export const paymentFields: INodeProperties[] = [
	{
		displayName: 'Payment ID',
		name: 'paymentId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['payment'], operation: ['getDetails'] } },
		description: 'The ID of the payment',
	},
	{
		displayName: 'Object ID',
		name: 'objectId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['payment'], operation: ['getDetailsByObject'] } },
		description: 'The object ID of the linked document (invoice/expense)',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		displayOptions: { show: { resource: ['payment'], operation: ['getMany'] } },
		description: 'Max number of results to return',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['payment'], operation: ['getMany'] } },
		options: [
			{ displayName: 'Date From', name: 'date_from', type: 'string', default: '', placeholder: '2024-01-01', description: 'Filter from date (YYYY-MM-DD)' },
			{ displayName: 'Date To', name: 'date_to', type: 'string', default: '', placeholder: '2024-12-31', description: 'Filter until date (YYYY-MM-DD)' },
			{
				displayName: 'Object Name', name: 'object_name', type: 'options', default: '',
				options: [
					{ name: 'Invoice', value: 'invoice' }, { name: 'Expense', value: 'expense' },
					{ name: 'Tax Declaration', value: 'declaration_header' },
				],
				description: 'Filter by linked document type',
			},
			{ displayName: 'Object ID', name: 'object_id', type: 'string', default: '', description: 'Filter by linked document ID' },
			{ displayName: 'Page', name: 'page', type: 'number', default: 1, description: 'Page number' },
		],
	},
];

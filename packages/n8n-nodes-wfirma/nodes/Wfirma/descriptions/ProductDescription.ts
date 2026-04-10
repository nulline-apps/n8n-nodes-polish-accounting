import type { INodeProperties } from 'n8n-workflow';

export const productOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['product'] } },
		options: [
			{ name: 'Create', value: 'create', description: 'Create a new product/service', action: 'Create a product' },
			{ name: 'Get', value: 'get', description: 'Get a product/service by ID', action: 'Get a product' },
			{ name: 'Get Many', value: 'getMany', description: 'Get many products/services', action: 'Get many products' },
		],
		default: 'getMany',
	},
];

export const productFields: INodeProperties[] = [
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['product'], operation: ['get'] } },
		description: 'The ID of the product/service',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['product'], operation: ['create'] } },
		description: 'Product or service name',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['product'], operation: ['create'] } },
		options: [
			{ displayName: 'Category', name: 'category', type: 'string', default: '', description: 'Product category' },
			{ displayName: 'Net Price', name: 'price_netto', type: 'number', default: 0, description: 'Net price' },
			{ displayName: 'Unit', name: 'unit', type: 'string', default: 'szt.', description: 'Unit of measure' },
			{ displayName: 'VAT Rate (%)', name: 'vat_rate', type: 'number', default: 23, description: 'VAT rate in percent' },
		],
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		displayOptions: { show: { resource: ['product'], operation: ['getMany'] } },
		description: 'Max number of results to return',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['product'], operation: ['getMany'] } },
		options: [
			{ displayName: 'Category', name: 'category', type: 'string', default: '', description: 'Filter by category' },
			{ displayName: 'Name', name: 'name', type: 'string', default: '', description: 'Filter by name (partial match)' },
			{ displayName: 'Offset', name: 'offset', type: 'number', default: 0, description: 'Number of results to skip' },
		],
	},
];

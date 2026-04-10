import type { INodeProperties } from 'n8n-workflow';

export const warehouseOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['warehouse'] } },
		options: [
			{ name: 'Get Stock', value: 'getStock', description: 'Get current stock levels', action: 'Get stock levels' },
			{ name: 'Get Warehouses', value: 'getWarehouses', description: 'Get list of warehouses', action: 'Get warehouses' },
		],
		default: 'getWarehouses',
	},
];

export const warehouseFields: INodeProperties[] = [
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['warehouse'], operation: ['getStock'] } },
		options: [
			{ displayName: 'Product ID', name: 'good_id', type: 'string', default: '', description: 'Filter by product ID' },
			{ displayName: 'Product Name', name: 'name', type: 'string', default: '', description: 'Filter by product name (supports % wildcard)' },
			{ displayName: 'Warehouse ID', name: 'warehouse_id', type: 'string', default: '', description: 'Filter by warehouse ID' },
		],
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		displayOptions: { show: { resource: ['warehouse'], operation: ['getWarehouses'] } },
		description: 'Max number of results to return',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['warehouse'], operation: ['getWarehouses'] } },
		options: [
			{ displayName: 'Main Only', name: 'main', type: 'boolean', default: false, description: 'Whether to only return main warehouses' },
			{ displayName: 'Name', name: 'name', type: 'string', default: '', description: 'Filter by warehouse name' },
			{ displayName: 'Offset', name: 'offset', type: 'number', default: 0, description: 'Number of results to skip' },
		],
	},
];

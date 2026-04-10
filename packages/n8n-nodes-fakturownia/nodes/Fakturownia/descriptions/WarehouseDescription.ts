import type { INodeProperties } from 'n8n-workflow';

export const warehouseOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['warehouse'] } },
		options: [
			{ name: 'Create Document (In)', value: 'createIn', description: 'Create incoming warehouse document (PZ)', action: 'Create incoming document' },
			{ name: 'Create Document (Internal)', value: 'createInternal', description: 'Create internal transfer document (MM)', action: 'Create internal document' },
			{ name: 'Create Document (Out)', value: 'createOut', description: 'Create outgoing warehouse document (WZ)', action: 'Create outgoing document' },
			{ name: 'Delete Document', value: 'deleteDocument', description: 'Delete a warehouse document', action: 'Delete a warehouse document' },
			{ name: 'Get Document', value: 'getDocument', description: 'Get a warehouse document by ID', action: 'Get a warehouse document' },
			{ name: 'Get Documents', value: 'getDocuments', description: 'Get many warehouse documents', action: 'Get warehouse documents' },
			{ name: 'Get Stock', value: 'getStock', description: 'Get current stock levels', action: 'Get stock levels' },
			{ name: 'Get Warehouses', value: 'getWarehouses', description: 'Get list of warehouses', action: 'Get warehouses' },
			{ name: 'Update Document', value: 'updateDocument', description: 'Update a warehouse document', action: 'Update a warehouse document' },
		],
		default: 'getWarehouses',
	},
];

export const warehouseFields: INodeProperties[] = [
	{
		displayName: 'Document ID',
		name: 'documentId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['warehouse'], operation: ['getDocument', 'updateDocument', 'deleteDocument'] } },
		description: 'The ID of the warehouse document',
	},
	{
		displayName: 'Document Data (JSON)',
		name: 'documentData',
		type: 'json',
		required: true,
		default: '{"warehouse_id":"","warehouse_document_positions":[]}',
		displayOptions: { show: { resource: ['warehouse'], operation: ['createIn', 'createOut', 'createInternal'] } },
		description: 'Warehouse document data as JSON',
	},
	{
		displayName: 'Update Fields (JSON)',
		name: 'updateData',
		type: 'json',
		required: true,
		default: '{}',
		displayOptions: { show: { resource: ['warehouse'], operation: ['updateDocument'] } },
		description: 'Fields to update as JSON object',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 1000 },
		default: 50,
		displayOptions: { show: { resource: ['warehouse'], operation: ['getDocuments', 'getWarehouses'] } },
		description: 'Max number of results to return',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['warehouse'], operation: ['getDocuments', 'getWarehouses'] } },
		options: [
			{ displayName: 'Offset', name: 'offset', type: 'number', default: 0, description: 'Number of results to skip' },
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['warehouse'], operation: ['getStock'] } },
		options: [
			{ displayName: 'Product ID', name: 'product_id', type: 'number', default: 0, description: 'Filter by product ID' },
			{ displayName: 'Warehouse ID', name: 'warehouse_id', type: 'number', default: 0, description: 'Filter by warehouse ID' },
		],
	},
];

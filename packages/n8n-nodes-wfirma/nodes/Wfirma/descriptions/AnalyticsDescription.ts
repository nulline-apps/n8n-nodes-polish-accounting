import type { INodeProperties } from 'n8n-workflow';

export const analyticsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['analytics'] } },
		options: [
			{ name: 'Calculate Profit', value: 'calculateProfit', description: 'Calculate profit for a period', action: 'Calculate profit' },
			{ name: 'Cash Flow', value: 'getCashflow', description: 'Get cash flow data', action: 'Get cash flow' },
			{ name: 'Financial Analytics', value: 'financialAnalytics', description: 'Generate detailed financial analytics', action: 'Generate financial analytics' },
			{ name: 'Financial Summary', value: 'financialSummary', description: 'Get financial summary for a period', action: 'Get financial summary' },
			{ name: 'Inventory Analytics', value: 'inventoryAnalytics', description: 'Generate inventory/warehouse analytics', action: 'Generate inventory analytics' },
			{ name: 'Sales Analytics', value: 'salesAnalytics', description: 'Generate sales analytics with trends', action: 'Generate sales analytics' },
		],
		default: 'financialSummary',
	},
];

export const analyticsFields: INodeProperties[] = [
	{
		displayName: 'Date From',
		name: 'dateFrom',
		type: 'string',
		default: '',
		placeholder: '2024-01-01',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['financialSummary', 'getCashflow', 'calculateProfit', 'salesAnalytics', 'financialAnalytics'],
			},
		},
		description: 'Start date in YYYY-MM-DD format',
	},
	{
		displayName: 'Date To',
		name: 'dateTo',
		type: 'string',
		default: '',
		placeholder: '2024-12-31',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['financialSummary', 'getCashflow', 'calculateProfit', 'salesAnalytics', 'financialAnalytics'],
			},
		},
		description: 'End date in YYYY-MM-DD format',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: { resource: ['analytics'], operation: ['financialSummary', 'calculateProfit'] },
		},
		options: [
			{ displayName: 'Month', name: 'month', type: 'number', default: 0, description: 'Month (1-12), used when date range is not specified' },
			{ displayName: 'Year', name: 'year', type: 'number', default: 0, description: 'Year (e.g. 2025), used when date range is not specified' },
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['analytics'], operation: ['salesAnalytics'] } },
		options: [
			{ displayName: 'Category', name: 'category', type: 'string', default: '', description: 'Filter by product category' },
			{ displayName: 'Contractor ID', name: 'contractorId', type: 'string', default: '', description: 'Filter by contractor ID' },
			{ displayName: 'Include Predictions', name: 'includePredictions', type: 'boolean', default: false, description: 'Whether to include predictions in the analysis' },
		],
	},
];

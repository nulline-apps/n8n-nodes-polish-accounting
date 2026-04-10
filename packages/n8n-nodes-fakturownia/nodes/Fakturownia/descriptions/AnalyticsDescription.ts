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
			{ name: 'Expenses Report', value: 'expensesReport', description: 'Generate expenses report', action: 'Generate expenses report' },
			{ name: 'Financial Analytics', value: 'financialAnalytics', description: 'Generate detailed financial analytics', action: 'Generate financial analytics' },
			{ name: 'Revenue Report', value: 'revenueReport', description: 'Generate revenue report', action: 'Generate revenue report' },
			{ name: 'Sales Analytics', value: 'salesAnalytics', description: 'Generate sales analytics', action: 'Generate sales analytics' },
			{ name: 'Warehouse Report', value: 'warehouseReport', description: 'Generate warehouse report', action: 'Generate warehouse report' },
		],
		default: 'salesAnalytics',
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
				operation: ['calculateProfit', 'financialAnalytics', 'salesAnalytics', 'revenueReport', 'expensesReport'],
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
				operation: ['calculateProfit', 'financialAnalytics', 'salesAnalytics', 'revenueReport', 'expensesReport'],
			},
		},
		description: 'End date in YYYY-MM-DD format',
	},
];

import type { INodeProperties } from 'n8n-workflow';

export const predictionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['prediction'] } },
		options: [
			{ name: 'Cash Flow', value: 'cashflow', description: 'Predict cash flow for upcoming months', action: 'Predict cash flow' },
			{ name: 'Inventory Demand', value: 'inventoryDemand', description: 'Predict inventory demand for products', action: 'Predict inventory demand' },
			{ name: 'Payments', value: 'payments', description: 'Predict payment dates for unpaid invoices', action: 'Predict payments' },
			{ name: 'Sales', value: 'sales', description: 'Predict sales for upcoming months', action: 'Predict sales' },
		],
		default: 'cashflow',
	},
];

export const predictionFields: INodeProperties[] = [
	{
		displayName: 'Months Ahead',
		name: 'months',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 24 },
		default: 6,
		displayOptions: { show: { resource: ['prediction'], operation: ['cashflow', 'sales'] } },
		description: 'Number of months to predict ahead',
	},
];

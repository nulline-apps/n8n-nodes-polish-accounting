import type { INodeProperties } from 'n8n-workflow';

export const taxOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['tax'] } },
		options: [
			{ name: 'Compare Monthly', value: 'compareMonthly', description: 'Compare financial results between months', action: 'Compare monthly results' },
			{ name: 'Get Purchase Entries', value: 'purchaseEntries', description: 'Get purchase entries from KPiR ledger', action: 'Get purchase entries' },
			{ name: 'Get Registers', value: 'getRegisters', description: 'Get KPiR tax register entries', action: 'Get tax registers' },
			{ name: 'Get Register Summary', value: 'getSummary', description: 'Get KPiR summary with totals', action: 'Get register summary' },
			{ name: 'Get Sales Entries', value: 'salesEntries', description: 'Get sales entries from KPiR ledger', action: 'Get sales entries' },
			{ name: 'Get ZUS Contributions', value: 'zusContributions', description: 'Get ZUS social security contributions', action: 'Get ZUS contributions' },
		],
		default: 'getRegisters',
	},
];

export const taxFields: INodeProperties[] = [
	{
		displayName: 'Year',
		name: 'year',
		type: 'number',
		required: true,
		default: 2025,
		displayOptions: {
			show: {
				resource: ['tax'],
				operation: ['getRegisters', 'getSummary', 'zusContributions', 'salesEntries', 'purchaseEntries', 'compareMonthly'],
			},
		},
		description: 'Year for the tax data (e.g. 2025)',
	},
	{
		displayName: 'Month',
		name: 'month',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 12 },
		required: true,
		default: 1,
		displayOptions: {
			show: {
				resource: ['tax'],
				operation: ['getRegisters', 'getSummary', 'zusContributions', 'salesEntries', 'purchaseEntries'],
			},
		},
		description: 'Month (1-12) for the tax data',
	},
	{
		displayName: 'Months to Compare (JSON)',
		name: 'months',
		type: 'json',
		required: true,
		default: '[1, 2, 3]',
		displayOptions: { show: { resource: ['tax'], operation: ['compareMonthly'] } },
		description: 'Array of month numbers to compare (e.g. [1,2,3] for Jan-Mar)',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['tax'], operation: ['getRegisters'] } },
		options: [
			{ displayName: 'Limit', name: 'limit', type: 'number', default: 100, description: 'Max number of entries' },
			{ displayName: 'Page', name: 'page', type: 'number', default: 1, description: 'Page number' },
		],
	},
];

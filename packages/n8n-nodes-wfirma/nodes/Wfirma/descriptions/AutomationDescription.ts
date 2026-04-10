import type { INodeProperties } from 'n8n-workflow';

export const automationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['automation'] } },
		options: [
			{ name: 'Auto-Number Invoices', value: 'autoNumber', description: 'Automatically number invoices', action: 'Auto-number invoices' },
			{ name: 'Auto-Send Invoices', value: 'autoSend', description: 'Automatically send invoices by email', action: 'Auto-send invoices' },
			{ name: 'Execute Rules', value: 'executeRules', description: 'Execute all configured automation rules', action: 'Execute automation rules' },
			{ name: 'Low Stock Alerts', value: 'lowStockAlerts', description: 'Generate low stock level alerts', action: 'Generate low stock alerts' },
			{ name: 'Payment Reminders', value: 'paymentReminders', description: 'Send overdue payment reminders', action: 'Send payment reminders' },
		],
		default: 'paymentReminders',
	},
];

export const automationFields: INodeProperties[] = [
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['automation'], operation: ['paymentReminders'] } },
		options: [
			{ displayName: 'Days After Due', name: 'daysAfterDue', type: 'number', default: 7, description: 'Number of days after payment due date' },
			{ displayName: 'Include Interest', name: 'includeInterest', type: 'boolean', default: false, description: 'Whether to include interest calculation' },
			{ displayName: 'Max Reminders', name: 'maxReminders', type: 'number', default: 3, description: 'Maximum number of reminders to send' },
			{ displayName: 'Template', name: 'template', type: 'string', default: '', description: 'Reminder email template' },
		],
	},
];

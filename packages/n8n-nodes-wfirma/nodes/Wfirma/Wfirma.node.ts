import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { callMcpTool, parseToolResult } from './transport/mcpClient';
import {
	invoiceOperations, invoiceFields,
	contractorOperations, contractorFields,
	expenseOperations, expenseFields,
	paymentOperations, paymentFields,
	productOperations, productFields,
	warehouseOperations, warehouseFields,
	analyticsOperations, analyticsFields,
	predictionOperations, predictionFields,
	automationOperations, automationFields,
	taxOperations, taxFields,
} from './descriptions';

const TOOL_MAP: Record<string, Record<string, string>> = {
	invoice: {
		getMany: 'get_invoices',
		get: 'get_invoice',
		getByNumber: 'get_invoice_by_fullnumber',
		getByContractorNip: 'get_invoices_by_contractor_nip',
		getByContractorId: 'get_invoices_by_contractor_id',
		create: 'create_invoice',
		createXml: 'create_invoice_with_xml',
		downloadPdf: 'download_invoice_pdf',
	},
	contractor: {
		getMany: 'get_contractors',
		get: 'get_contractor',
		getByTaxNo: 'get_contractor_by_tax_no',
		search: 'search_contractors',
		create: 'create_contractor',
		createXml: 'create_contractor_with_xml',
	},
	expense: {
		getMany: 'get_expenses',
		get: 'get_expense',
	},
	payment: {
		getMany: 'get_payments',
		getDetails: 'get_payment_details',
		getDetailsByObject: 'get_payment_details_by_object_id',
	},
	product: {
		getMany: 'get_goods',
		get: 'get_good',
		create: 'create_good',
	},
	warehouse: {
		getStock: 'get_stock',
		getWarehouses: 'get_warehouses',
	},
	analytics: {
		financialSummary: 'get_financial_summary',
		getCashflow: 'get_cashflow',
		calculateProfit: 'calculate_profit',
		salesAnalytics: 'generate_sales_analytics',
		financialAnalytics: 'generate_financial_analytics',
		inventoryAnalytics: 'generate_inventory_analytics',
	},
	prediction: {
		cashflow: 'predict_cashflow',
		sales: 'predict_sales',
		inventoryDemand: 'predict_inventory_demand',
		payments: 'predict_payments',
	},
	automation: {
		paymentReminders: 'send_payment_reminders',
		autoNumber: 'auto_number_invoices',
		autoSend: 'auto_send_invoices',
		lowStockAlerts: 'generate_low_stock_alerts',
		executeRules: 'execute_automation_rules',
	},
	tax: {
		getRegisters: 'get_tax_registers',
		getSummary: 'get_tax_register_summary',
		zusContributions: 'get_zus_contributions',
		salesEntries: 'get_sales_entries',
		purchaseEntries: 'get_purchase_entries',
		compareMonthly: 'compare_monthly_results',
	},
};

export class Wfirma implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'wFirma',
		name: 'wfirma',
		icon: 'file:wfirma.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with wFirma Polish accounting software via MCP server',
		defaults: { name: 'wFirma' },
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'wfirmaApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Analytics', value: 'analytics' },
					{ name: 'Automation', value: 'automation' },
					{ name: 'Contractor', value: 'contractor' },
					{ name: 'Expense', value: 'expense' },
					{ name: 'Invoice', value: 'invoice' },
					{ name: 'Payment', value: 'payment' },
					{ name: 'Prediction', value: 'prediction' },
					{ name: 'Product', value: 'product' },
					{ name: 'Tax (KPiR)', value: 'tax' },
					{ name: 'Warehouse', value: 'warehouse' },
				],
				default: 'invoice',
			},
			...invoiceOperations, ...invoiceFields,
			...contractorOperations, ...contractorFields,
			...expenseOperations, ...expenseFields,
			...paymentOperations, ...paymentFields,
			...productOperations, ...productFields,
			...warehouseOperations, ...warehouseFields,
			...analyticsOperations, ...analyticsFields,
			...predictionOperations, ...predictionFields,
			...automationOperations, ...automationFields,
			...taxOperations, ...taxFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				const toolName = TOOL_MAP[resource]?.[operation];
				if (!toolName) {
					throw new NodeOperationError(this.getNode(), `Unknown resource/operation: ${resource}/${operation}`, { itemIndex: i });
				}

				const args = buildArgs.call(this, resource, operation, i);
				const result = await callMcpTool(this, toolName, args, i);
				const parsed = parseToolResult(result);

				if (Array.isArray(parsed)) {
					for (const item of parsed) {
						returnData.push({ json: item });
					}
				} else {
					returnData.push({ json: parsed });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}

function buildArgs(this: IExecuteFunctions, resource: string, operation: string, i: number): IDataObject {
	const additional = safeGetParam<IDataObject>(this, 'additionalFields', i, {});

	switch (resource) {
		case 'invoice':
			return buildInvoiceArgs.call(this, operation, i, additional);
		case 'contractor':
			return buildContractorArgs.call(this, operation, i, additional);
		case 'expense':
			return buildExpenseArgs.call(this, operation, i, additional);
		case 'payment':
			return buildPaymentArgs.call(this, operation, i, additional);
		case 'product':
			return buildProductArgs.call(this, operation, i, additional);
		case 'warehouse':
			return buildWarehouseArgs.call(this, operation, i, additional);
		case 'analytics':
			return buildAnalyticsArgs.call(this, operation, i, additional);
		case 'prediction':
			return buildPredictionArgs.call(this, operation, i);
		case 'automation':
			return buildAutomationArgs.call(this, operation, i, additional);
		case 'tax':
			return buildTaxArgs.call(this, operation, i, additional);
		default:
			return {};
	}
}

function safeGetParam<T>(ef: IExecuteFunctions, name: string, idx: number, fallback: T): T {
	try { return ef.getNodeParameter(name, idx) as T; } catch { return fallback; }
}

function buildInvoiceArgs(this: IExecuteFunctions, op: string, i: number, extra: IDataObject): IDataObject {
	switch (op) {
		case 'get': case 'downloadPdf':
			return { [op === 'downloadPdf' ? 'invoice_id' : 'id']: this.getNodeParameter('invoiceId', i) };
		case 'getByNumber':
			return { fullnumber: this.getNodeParameter('fullnumber', i) };
		case 'getByContractorNip':
			return { nip: this.getNodeParameter('nip', i), limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		case 'getByContractorId':
			return { contractor_id: this.getNodeParameter('contractorId', i), limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		case 'create': {
			const args: IDataObject = {
				contractor_id: this.getNodeParameter('contractorId', i),
				items: JSON.parse(this.getNodeParameter('items', i) as string),
			};
			const pd = safeGetParam(this, 'paymentDate', i, '');
			if (pd) args.payment_date = pd;
			return args;
		}
		case 'createXml':
			return { xmlData: this.getNodeParameter('xmlData', i) };
		case 'getMany':
			return { limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		default:
			return {};
	}
}

function buildContractorArgs(this: IExecuteFunctions, op: string, i: number, extra: IDataObject): IDataObject {
	switch (op) {
		case 'get':
			return { id: this.getNodeParameter('contractorId', i) };
		case 'getByTaxNo':
			return { nip: this.getNodeParameter('nip', i) };
		case 'search':
			return { query: this.getNodeParameter('query', i), limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		case 'create':
			return { name: this.getNodeParameter('name', i), nip: safeGetParam(this, 'nip', i, ''), ...cleanObj(extra) };
		case 'createXml':
			return {
				name: this.getNodeParameter('name', i), nip: this.getNodeParameter('nip', i),
				street: this.getNodeParameter('street', i), zip: this.getNodeParameter('zip', i),
				city: this.getNodeParameter('city', i), country: safeGetParam(this, 'country', i, 'PL'),
				...cleanObj(extra),
			};
		case 'getMany':
			return { limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		default:
			return {};
	}
}

function buildExpenseArgs(this: IExecuteFunctions, op: string, i: number, extra: IDataObject): IDataObject {
	if (op === 'get') return { id: this.getNodeParameter('expenseId', i) };
	return { limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
}

function buildPaymentArgs(this: IExecuteFunctions, op: string, i: number, extra: IDataObject): IDataObject {
	if (op === 'getDetails') return { payment_id: this.getNodeParameter('paymentId', i) };
	if (op === 'getDetailsByObject') return { object_id: this.getNodeParameter('objectId', i) };
	return { limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
}

function buildProductArgs(this: IExecuteFunctions, op: string, i: number, extra: IDataObject): IDataObject {
	if (op === 'get') return { id: this.getNodeParameter('productId', i) };
	if (op === 'create') return { name: this.getNodeParameter('name', i), ...cleanObj(extra) };
	return { limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
}

function buildWarehouseArgs(this: IExecuteFunctions, op: string, i: number, extra: IDataObject): IDataObject {
	if (op === 'getStock') return cleanObj(extra);
	return { limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
}

function buildAnalyticsArgs(this: IExecuteFunctions, op: string, i: number, extra: IDataObject): IDataObject {
	const args: IDataObject = {};
	const dateFrom = safeGetParam(this, 'dateFrom', i, '');
	const dateTo = safeGetParam(this, 'dateTo', i, '');
	if (dateFrom) args.date_from = dateFrom;
	if (dateTo) args.date_to = dateTo;
	if (op === 'salesAnalytics' || op === 'financialAnalytics') {
		if (dateFrom || dateTo) args.dateRange = { from: dateFrom, to: dateTo };
		if (extra.contractorId) args.contractorId = extra.contractorId;
		if (extra.category) args.category = extra.category;
		if (extra.includePredictions) args.includePredictions = extra.includePredictions;
	}
	if (extra.year) args.year = extra.year;
	if (extra.month) args.month = extra.month;
	return args;
}

function buildPredictionArgs(this: IExecuteFunctions, op: string, i: number): IDataObject {
	if (op === 'cashflow' || op === 'sales') {
		return { months: safeGetParam(this, 'months', i, 6) };
	}
	return {};
}

function buildAutomationArgs(this: IExecuteFunctions, op: string, i: number, extra: IDataObject): IDataObject {
	if (op === 'paymentReminders') return cleanObj(extra);
	return {};
}

function buildTaxArgs(this: IExecuteFunctions, op: string, i: number, extra: IDataObject): IDataObject {
	const args: IDataObject = { year: this.getNodeParameter('year', i) as number };
	if (op === 'compareMonthly') {
		args.months = JSON.parse(this.getNodeParameter('months', i) as string);
	} else {
		args.month = this.getNodeParameter('month', i);
	}
	return { ...args, ...cleanObj(extra) };
}

function cleanObj(obj: IDataObject): IDataObject {
	const result: IDataObject = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value !== '' && value !== undefined && value !== null && value !== 0) {
			result[key] = value;
		}
	}
	return result;
}

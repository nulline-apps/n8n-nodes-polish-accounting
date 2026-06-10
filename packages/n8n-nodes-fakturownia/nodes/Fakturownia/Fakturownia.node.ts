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
	productOperations, productFields,
	warehouseOperations, warehouseFields,
	analyticsOperations, analyticsFields,
} from './descriptions';

export const TOOL_MAP: Record<string, Record<string, string>> = {
	invoice: {
		getMany: 'get_invoices',
		get: 'get_invoice',
		getByNumber: 'get_invoice_by_number',
		search: 'search_invoices',
		getByClient: 'get_invoices_by_client',
		getByClientTaxNo: 'get_invoices_by_client_tax_no',
		create: 'create_invoice',
		update: 'update_invoice',
		downloadPdf: 'download_invoice_pdf',
	},
	contractor: {
		getMany: 'get_contractors',
		get: 'get_contractor',
		getByTaxNo: 'get_contractors',
		search: 'search_contractors',
		create: 'create_contractor',
		update: 'update_contractor',
	},
	product: {
		getMany: 'get_products',
		get: 'get_product',
		getByCode: 'get_product_by_code',
		search: 'search_products',
		create: 'create_product',
		update: 'update_product',
		delete: 'delete_product',
	},
	warehouse: {
		getDocuments: 'get_warehouse_documents',
		getDocument: 'get_warehouse_document',
		createIn: 'create_warehouse_document_in',
		createOut: 'create_warehouse_document_out',
		createInternal: 'create_warehouse_document_internal',
		updateDocument: 'update_warehouse_document',
		deleteDocument: 'delete_warehouse_document',
		getWarehouses: 'get_warehouses',
		getStock: 'get_stock',
	},
	analytics: {
		calculateProfit: 'calculate_profit',
		financialAnalytics: 'generate_financial_analytics',
		salesAnalytics: 'generate_sales_analytics',
		revenueReport: 'generate_revenue_report',
		expensesReport: 'generate_expenses_report',
		warehouseReport: 'generate_warehouse_report',
	},
};

export class Fakturownia implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fakturownia MCP',
		name: 'fakturownia',
		icon: 'file:fakturownia.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Fakturownia Polish invoicing software via MCP server',
		defaults: { name: 'Fakturownia MCP' },
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'fakturowniaApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Analytics', value: 'analytics' },
					{ name: 'Contractor', value: 'contractor' },
					{ name: 'Invoice', value: 'invoice' },
					{ name: 'Product', value: 'product' },
					{ name: 'Warehouse', value: 'warehouse' },
				],
				default: 'invoice',
			},
			...invoiceOperations, ...invoiceFields,
			...contractorOperations, ...contractorFields,
			...productOperations, ...productFields,
			...warehouseOperations, ...warehouseFields,
			...analyticsOperations, ...analyticsFields,
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
					returnData.push({ json: item ?? {}, pairedItem: { item: i } });
				}
			} else {
				returnData.push({ json: parsed ?? {}, pairedItem: { item: i } });
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
		case 'product':
			return buildProductArgs.call(this, operation, i, additional);
		case 'warehouse':
			return buildWarehouseArgs.call(this, operation, i, additional);
		case 'analytics':
			return buildAnalyticsArgs.call(this, operation, i);
		default:
			return {};
	}
}

function safeGetParam<T>(ef: IExecuteFunctions, name: string, idx: number, fallback: T): T {
	return ef.getNodeParameter(name, idx, fallback) as T;
}

function safeJsonParse(ef: IExecuteFunctions, value: string, field: string, i: number): IDataObject {
	try { return JSON.parse(value) as IDataObject; }
	catch { throw new NodeOperationError(ef.getNode(), `Invalid JSON in "${field}"`, { itemIndex: i }); }
}

function buildInvoiceArgs(this: IExecuteFunctions, op: string, i: number, extra: IDataObject): IDataObject {
	switch (op) {
		case 'get': case 'downloadPdf':
			return { id: this.getNodeParameter('invoiceId', i) };
		case 'getByNumber':
			return { number: this.getNodeParameter('number', i) };
		case 'getByClient':
			return { client_id: this.getNodeParameter('clientId', i), limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		case 'getByClientTaxNo':
			return { tax_no: this.getNodeParameter('taxNo', i), limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		case 'search':
			return { query: this.getNodeParameter('query', i), limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		case 'create':
			return safeJsonParse(this, this.getNodeParameter('createData', i) as string, 'createData', i);
		case 'update':
			return { id: this.getNodeParameter('invoiceId', i), ...safeJsonParse(this, this.getNodeParameter('updateData', i) as string, 'updateData', i) };
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
			return { tax_no: this.getNodeParameter('taxNo', i), limit: 1 };
		case 'search':
			return { query: this.getNodeParameter('query', i), limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		case 'create':
			return { name: this.getNodeParameter('name', i), ...cleanObj(extra) };
		case 'update':
			return { id: this.getNodeParameter('contractorId', i), ...safeJsonParse(this, this.getNodeParameter('updateData', i) as string, 'updateData', i) };
		case 'getMany':
			return { limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		default:
			return {};
	}
}

function buildProductArgs(this: IExecuteFunctions, op: string, i: number, extra: IDataObject): IDataObject {
	switch (op) {
		case 'get': case 'delete':
			return { id: this.getNodeParameter('productId', i) };
		case 'getByCode':
			return { code: this.getNodeParameter('code', i) };
		case 'search':
			return { query: this.getNodeParameter('query', i), limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		case 'create':
			return { name: this.getNodeParameter('name', i), ...cleanObj(extra) };
		case 'update':
			return { id: this.getNodeParameter('productId', i), ...safeJsonParse(this, this.getNodeParameter('updateData', i) as string, 'updateData', i) };
		case 'getMany':
			return { limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		default:
			return {};
	}
}

function buildWarehouseArgs(this: IExecuteFunctions, op: string, i: number, extra: IDataObject): IDataObject {
	switch (op) {
		case 'getDocument': case 'deleteDocument':
			return { id: this.getNodeParameter('documentId', i) };
		case 'createIn': case 'createOut': case 'createInternal':
			return safeJsonParse(this, this.getNodeParameter('documentData', i) as string, 'documentData', i);
		case 'updateDocument':
			return { id: this.getNodeParameter('documentId', i), ...safeJsonParse(this, this.getNodeParameter('updateData', i) as string, 'updateData', i) };
		case 'getDocuments': case 'getWarehouses':
			return { limit: safeGetParam(this, 'limit', i, 50), ...cleanObj(extra) };
		case 'getStock':
			return cleanObj(extra);
		default:
			return {};
	}
}

function buildAnalyticsArgs(this: IExecuteFunctions, op: string, i: number): IDataObject {
	const args: IDataObject = {};
	const dateFrom = safeGetParam(this, 'dateFrom', i, '');
	const dateTo = safeGetParam(this, 'dateTo', i, '');
	if (dateFrom) args.date_from = dateFrom;
	if (dateTo) args.date_to = dateTo;
	if (op === 'salesAnalytics' || op === 'financialAnalytics') {
		if (dateFrom || dateTo) args.dateRange = { from: dateFrom, to: dateTo };
	}
	return args;
}

export function cleanObj(obj: IDataObject): IDataObject {
	const result: IDataObject = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value !== '' && value !== undefined && value !== null) {
			result[key] = value;
		}
	}
	return result;
}

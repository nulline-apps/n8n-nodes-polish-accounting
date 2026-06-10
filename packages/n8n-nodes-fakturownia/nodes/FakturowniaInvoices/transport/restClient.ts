import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

// Woła cienki endpoint REST faktur na serwerze MCP (fakto.app):
//   POST {serverUrl}/fakturownia/invoices/{action}
// Uwierzytelnianie wstrzykuje wybrany credential (API Keys lub Bearer) przez
// httpRequestWithAuthentication. Zwraca sparsowany JSON odpowiedzi (zwykły obiekt,
// nie koperta JSON-RPC).
export async function callInvoiceApi(
	executeFunctions: IExecuteFunctions,
	credName: string,
	action: string,
	body: IDataObject,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const credentials = await executeFunctions.getCredentials(credName);
	const serverUrl = (credentials.serverUrl as string).replace(/\/+$/, '');

	const options: IHttpRequestOptions = {
		method: 'POST' as IHttpRequestMethods,
		url: `${serverUrl}/fakturownia/invoices/${action}`,
		body,
		headers: { 'Content-Type': 'application/json' },
		json: true,
		returnFullResponse: false,
	};

	try {
		const response = (await executeFunctions.helpers.httpRequestWithAuthentication.call(
			executeFunctions,
			credName,
			options,
		)) as IDataObject | IDataObject[];
		return response;
	} catch (error) {
		throw new NodeApiError(executeFunctions.getNode(), error as JsonObject, { itemIndex });
	}
}

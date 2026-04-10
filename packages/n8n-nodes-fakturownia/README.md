# n8n-nodes-faktoapp-fakturownia

This is an n8n community node for **Fakturownia** — a popular Polish online invoicing platform. It connects to the Fakturownia API through the [Fakto MCP server](https://fakto.app).

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Prerequisites

- An active [Fakturownia](https://fakturownia.pl) account with API access (API token)
- A [Fakto](https://fakto.app) subscription API key
- n8n v1.0.0 or later

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

```
npm install n8n-nodes-faktoapp-fakturownia
```

## Credentials

Configure the **Fakturownia API** credential in n8n:

| Field | Description |
|-------|-------------|
| MCP Server URL | URL of the MCP server (default: `https://fakto.app`) |
| API Token | Your Fakturownia API token |
| Subdomain | Your Fakturownia subdomain (e.g. `mycompany` from `mycompany.fakturownia.pl`) |
| Subscription API Key | Your Fakto subscription key |

## Resources & Operations

### Invoice
- **Get Many** — List invoices with filters (date range, type, client, payment status, amounts)
- **Get** — Get single invoice by ID
- **Get by Number** — Find invoice by number
- **Search** — Full-text search across invoice number, client name, items, and notes
- **Get by Client** — List invoices by client ID
- **Get by Client Tax No** — List invoices by client NIP
- **Create** — Create a new invoice
- **Update** — Update an existing invoice
- **Download PDF** — Download invoice as PDF

### Contractor
- **Get Many** — List contractors with filters
- **Get** — Get single contractor by ID
- **Get by Tax No** — Find contractor by NIP
- **Search** — Full-text search across multiple contractor fields
- **Create** — Create a new contractor
- **Update** — Update an existing contractor

### Product
- **Get Many** — List products
- **Get** — Get single product by ID
- **Get by Code** — Find product by code/SKU
- **Search** — Full-text search products
- **Create** — Create a new product
- **Update** — Update an existing product
- **Delete** — Delete a product

### Warehouse
- **Get Warehouses** — List warehouses
- **Get Stock** — Get current stock levels
- **Get Documents** — List warehouse documents
- **Get Document** — Get single warehouse document
- **Create Document (In)** — Create incoming document (PZ)
- **Create Document (Out)** — Create outgoing document (WZ)
- **Create Document (Internal)** — Create internal transfer (MM)
- **Update Document** — Update a warehouse document
- **Delete Document** — Delete a warehouse document

### Analytics
- **Calculate Profit** — Calculate profit for a period
- **Financial Analytics** — Detailed financial analysis
- **Sales Analytics** — Sales analytics and trends
- **Revenue Report** — Revenue report
- **Expenses Report** — Expenses report
- **Warehouse Report** — Warehouse analytics report

## Compatibility

Tested with n8n v1.0.0 and later. Requires Node.js 22+.

## License

[MIT](LICENSE)

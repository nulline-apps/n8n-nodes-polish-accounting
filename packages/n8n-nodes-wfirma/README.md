# n8n-nodes-faktoapp-wfirma

This is an n8n community node for **wFirma** — a popular Polish accounting and invoicing software. It connects to the wFirma API through the [Fakto MCP server](https://fakto.app).

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Prerequisites

- An active [wFirma](https://wfirma.pl) account with API access (Access Key, Secret Key, App Key)
- A [Fakto](https://fakto.app) subscription API key
- n8n v1.0.0 or later

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

```
npm install n8n-nodes-faktoapp-wfirma
```

## Credentials

Configure the **wFirma API** credential in n8n:

| Field | Description |
|-------|-------------|
| MCP Server URL | URL of the MCP server (default: `https://fakto.app`) |
| Access Key | Your wFirma API Access Key |
| Secret Key | Your wFirma API Secret Key |
| App Key | Your wFirma API App Key |
| Company ID | Optional — for multi-company accounts |
| Subscription API Key | Your Fakto subscription key |

## Resources & Operations

### Invoice
- **Get Many** — List invoices with advanced filtering (date range, type, payment status, amounts)
- **Get** — Get single invoice by ID
- **Get by Number** — Find invoice by full number (e.g. "FV 19/2024")
- **Get by Contractor NIP** — List invoices by contractor tax ID
- **Get by Contractor ID** — List invoices by contractor ID
- **Create** — Create a new invoice with line items
- **Create With XML** — Create invoice using raw XML format
- **Download PDF** — Download invoice as PDF

### Contractor
- **Get Many** — List contractors with filters (name, NIP, city)
- **Create** — Create a new contractor
- **Create With XML** — Create contractor with full XML data

### Expense
- **Get Many** — List purchase documents with filters
- **Get** — Get single expense by ID

### Payment
- **Get Many** — List payments with filters
- **Get Details** — Get payment details by payment ID
- **Get Details by Object** — Get payment details by document ID

### Product
- **Get Many** — List products/services
- **Get** — Get single product by ID
- **Create** — Create a new product/service

### Warehouse
- **Get Warehouses** — List warehouses
- **Get Stock** — Get current stock levels

### Analytics
- **Financial Summary** — Revenue, expenses, and profit for a period
- **Cash Flow** — Cash flow analysis
- **Calculate Profit** — Profit calculation for a period
- **Sales Analytics** — Sales trends, top contractors and products
- **Financial Analytics** — Detailed financial analysis with margins
- **Inventory Analytics** — Warehouse turnover and stock level analysis

### Prediction
- **Cash Flow** — Predict future cash flow
- **Sales** — Predict future sales
- **Inventory Demand** — Predict product demand
- **Payments** — Predict payment dates for unpaid invoices

### Automation
- **Payment Reminders** — Send overdue payment reminders
- **Auto-Number Invoices** — Automatically number invoices
- **Auto-Send Invoices** — Automatically send invoices by email
- **Low Stock Alerts** — Generate low stock alerts
- **Execute Rules** — Execute configured automation rules

### Tax (KPiR)
- **Get Registers** — Get KPiR (tax ledger) entries
- **Get Register Summary** — Get KPiR summary with totals
- **Get ZUS Contributions** — Get ZUS social security entries
- **Get Sales Entries** — Get sales entries from KPiR
- **Get Purchase Entries** — Get purchase entries from KPiR
- **Compare Monthly** — Compare financial results between months

## Compatibility

Tested with n8n v1.0.0 and later. Requires Node.js 22+.

## License

[MIT](LICENSE)

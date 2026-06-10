# n8n-nodes-faktoapp-fakturownia

n8n community nodes for **Fakturownia** — a popular Polish online invoicing platform. The package ships **two nodes**:

| Node | What it does | Connection |
|------|--------------|------------|
| **Fakturownia MCP** | Full coverage: invoices, contractors, products, warehouse, analytics | Through the [Fakto MCP server](https://fakto.app) (`fakto.app`) |
| **Fakturownia Invoices** | Dedicated, streamlined **invoice** node with a polished create/update form | **Direct** to the Fakturownia API (API Keys) *or* through the fakto.app proxy (Bearer) |

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Prerequisites

- An active [Fakturownia](https://fakturownia.pl) account with API access (API token + subdomain)
- A [Fakto](https://fakto.app) subscription key (required as a license)
- n8n v1.0.0 or later (Node.js 22+)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

```
npm install n8n-nodes-faktoapp-fakturownia
```

## Nodes & credentials

### 1. Fakturownia MCP

Full-feature node covering invoices, contractors, products, warehouse and analytics. All calls are routed through the Fakto MCP server, which enforces your subscription plan.

Uses the **Fakturownia API** credential (`fakturowniaApi`):

| Field | Description |
|-------|-------------|
| MCP Server URL | URL of the MCP server (default `https://fakto.app`) |
| API Token | Your Fakturownia API token |
| Subdomain | Your Fakturownia subdomain (e.g. `mycompany` from `mycompany.fakturownia.pl`) |
| Subscription API Key | Your Fakto subscription key |

### 2. Fakturownia Invoices (new)

A focused node for invoice workflows, with a redesigned, intuitive create/update form. It offers **two authentication modes** (dropdown **Authentication**):

#### a) API Keys (Direct) — *default*

The node talks **directly to the Fakturownia API** (`https://<subdomain>.fakturownia.pl`); your invoice operations never pass through fakto.app. The fakto.app subscription key is used **only as a license**: the node verifies it against fakto.app roughly **once a day** and caches the result per workflow.

- Subscription **inactive / invalid** → operations are blocked with a clear error.
- fakto.app **temporarily unreachable** → operations still run (fail-open) and the check is retried on the next run, so a brief fakto.app outage never blocks your Fakturownia automations.

Uses the **Fakturownia (Direct + Fakto.app license)** credential (`fakturowniaDirectApi`):

| Field | Description |
|-------|-------------|
| Fakto.app Server URL | Used for the license check (default `https://fakto.app`) |
| Fakto.app Subscription Key | Your fakto.app subscription key (license) |
| Fakturownia Subdomain | Your Fakturownia subdomain |
| Fakturownia API Token | Your Fakturownia API token |

The credential **Test** button verifies both, in order: (1) the fakto.app license is active, then (2) the Fakturownia subdomain + token actually connect.

#### b) Bearer Token — fakto.app proxy

Routes operations through the fakto.app proxy using a single Bearer token generated in fakto.app (the token has your Fakturownia credentials encrypted server-side). Plan enforcement happens on the server.

Uses the **Fakturownia (Bearer)** credential (`fakturowniaBearerApi`):

| Field | Description |
|-------|-------------|
| MCP Server URL | URL of the MCP server (default `https://fakto.app`) |
| Bearer Token | Token generated in fakto.app after activating a subscription |

> **Direct vs Bearer:** Direct is faster (no extra hop) and keeps working during a fakto.app outage; Bearer keeps your Fakturownia token off the n8n side and enforces the subscription server-side. Pick per workflow.

## Operations

### Fakturownia Invoices

| Operation | Description |
|-----------|-------------|
| **Get Many** | List invoices with filters (kind, income, date range, paid status, client, currency…) |
| **Get** | Get a single invoice by ID |
| **Get by Number** | Find an invoice by its number |
| **Search** | Full-text search across number, client name, NIP, line items and notes |
| **Get by Client** | List invoices for a client ID |
| **Get by Client Tax No** | List invoices for a client NIP |
| **Create** | Create a new invoice |
| **Update** | Update an existing invoice |
| **Download PDF** | Download the invoice PDF (returned as binary) |

**Create — designed for clarity.** The form shows only what you actually need, up-front and marked as required:

- **Buyer** — choose *Existing Client (by ID)* or *New Buyer (by name)*.
- **Sell Date / Issue Date / Payment To** — required (`YYYY-MM-DD`).
- **Positions** — at least one line; each line needs a **Name** and a **VAT Rate**. Enter the net unit price and quantity — totals are computed for you.
- **Additional Fields** — everything optional (kind, number, currency, seller/buyer NIP & address, payment type, notes…).
- **Raw JSON Override** — escape hatch for any field not exposed by the form.

> Cost invoices: set **Income = Cost**, **Kind = VAT**, and provide a **Number** (Fakturownia does not auto-number cost invoices).

**Update — merges, never overwrites.** Listed positions are merged with the invoice's existing lines:

- no **Position ID** → adds a new line,
- a **Position ID** → modifies that line,
- a **Position ID** + **Delete This Line** → removes it,
- lines you don't list stay unchanged.

(In **Direct** mode this add/modify/delete behaves exactly as the Fakturownia API specifies. When editing a single field of a line, also re-enter its VAT/price so it isn't reset.)

### Fakturownia MCP

<details>
<summary>Invoice / Contractor / Product / Warehouse / Analytics (click to expand)</summary>

**Invoice** — Get Many, Get, Get by Number, Search, Get by Client, Get by Client Tax No, Create, Update, Download PDF

**Contractor** — Get Many, Get, Get by Tax No, Search, Create, Update

**Product** — Get Many, Get, Get by Code, Search, Create, Update, Delete

**Warehouse** — Get Warehouses, Get Stock, Get Documents, Get Document, Create Document (In/Out/Internal), Update Document, Delete Document

**Analytics** — Calculate Profit, Financial Analytics, Sales Analytics, Revenue Report, Expenses Report, Warehouse Report

</details>

## AI Agent integration

Both nodes have `usableAsTool` enabled, so they appear directly in the **AI Agent** node's tool list — the agent can create invoices, search, generate reports, etc. from natural-language instructions.

Alternatively, connect the AI Agent to the MCP server with the built-in **MCP Client** node:

1. Add an **MCP Client** tool to your AI Agent node.
2. Set the **SSE URL** to `https://fakto.app/fakturownia/stream`.
3. Add authentication headers with your Fakturownia credentials:
   ```json
   {
     "x-fakturownia-credentials": "{\"token\":\"YOUR_TOKEN\",\"subdomain\":\"YOUR_SUBDOMAIN\",\"subscriptionApiKey\":\"YOUR_KEY\"}"
   }
   ```
4. The AI Agent discovers all available tools from the MCP server automatically.

## Compatibility

Tested with n8n v1.0.0 and later. Requires Node.js 22+.

## License

[MIT](LICENSE)

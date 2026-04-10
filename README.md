# n8n Community Nodes for Polish Accounting

Monorepo containing n8n community nodes for Polish accounting and invoicing software:

- **[n8n-nodes-wfirma](packages/n8n-nodes-wfirma)** — wFirma accounting integration (42 tools, 10 resources)
- **[n8n-nodes-fakturownia](packages/n8n-nodes-fakturownia)** — Fakturownia invoicing integration (37 tools, 5 resources)

Both nodes communicate with the [Fakto MCP server](https://fakto.app) which provides a unified API gateway for wFirma and Fakturownia.

## Architecture

```
n8n Instance                    MCP Server (fakto.app)         External APIs
┌──────────────────┐           ┌──────────────────────┐       ┌──────────────┐
│ n8n-nodes-wfirma │──JSON-RPC──▶ /wfirma/stream     │──────▶│api2.wfirma.pl│
│                  │           │                      │       └──────────────┘
│ n8n-nodes-       │──JSON-RPC──▶ /fakturownia/stream │──────▶│*.fakturownia │
│ fakturownia      │           │                      │       │   .pl        │
└──────────────────┘           └──────────────────────┘       └──────────────┘
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Publishing

Each package is published independently via GitHub Actions with npm provenance:

- Tag `wfirma-v*` triggers publish of n8n-nodes-wfirma
- Tag `fakturownia-v*` triggers publish of n8n-nodes-fakturownia

## License

[MIT](packages/n8n-nodes-wfirma/LICENSE)

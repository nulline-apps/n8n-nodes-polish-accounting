# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Monorepo of n8n community nodes for Polish accounting/invoicing software. Two published packages, each wrapping a service exposed through the hosted **Fakto MCP server** (`https://fakto.app`), which proxies to the real wFirma / Fakturownia APIs. The nodes never talk to wFirma/Fakturownia directly — they only call fakto.app.

- `packages/n8n-nodes-wfirma` → npm `n8n-nodes-faktoapp-wfirma` (wFirma; 10 resources)
- `packages/n8n-nodes-fakturownia` → npm `n8n-nodes-faktoapp-fakturownia` (Fakturownia; ships two nodes)

## Commands

Root scripts fan out across both workspaces (`npm run <x> --workspaces`):

```bash
npm install            # install all workspaces
npm run build          # tsc + gulp build:icons, per package -> dist/
npm run lint           # eslint nodes + credentials (n8n-nodes-base plugin)
npm run lintfix
npm test               # jest, per package
npm run dev            # tsc --watch
```

Per-package work (run inside a `packages/*` dir, or with `--workspace`):

```bash
npm test -- --testPathPattern=wfirma.node      # single test file by pattern
npm test -- -t "TOOL_MAP parity"               # single test by name
npm run test:watch
```

Integration tests are gated behind `INTEGRATION=1` and hit a live MCP server (`MCP_SERVER_URL`, default `http://localhost:3000`) with real credentials in env vars (`WFIRMA_ACCESS_KEY`, etc.). They are skipped by default, so plain `npm test` runs only unit tests. CI (`.github/workflows/ci.yml`) runs lint + build + test on Node 22 in a matrix over both packages.

## Architecture

Every node follows the same shape; learn it once and both packages read the same way.

**1. A static map from UI selections to a remote operation name.** `Wfirma.node.ts` exports `TOOL_MAP[resource][operation] → mcpToolName`; `FakturowniaInvoices.node.ts` exports `OPERATION_TO_ACTION[operation] → restAction`. `execute()` looks up this map, throws `NodeOperationError` on a miss, otherwise builds args and dispatches.

**2. Argument building.** A top-level `buildArgs` switches on resource/operation and delegates to small per-resource `buildXArgs` helpers that pull node parameters and assemble the request body. The exported `cleanObj()` helper strips `''`/`null`/`undefined` (but **keeps `0` and `false`**) from optional-field bundles before sending. JSON-typed UI fields go through `safeJsonParse`, which rethrows as a `NodeOperationError`.

**3. Transport — two distinct wire protocols:**
- **MCP JSON-RPC** (`transport/mcpClient.ts`, used by the wFirma node and the main Fakturownia node): POSTs `{jsonrpc, id, method:"tools/call", params:{name, arguments}}` to `{serverUrl}/<service>/stream`. `callMcpTool` unwraps the JSON-RPC envelope and the MCP `result.content[].text`, surfacing `response.error`, empty results, and `result.isError` as `NodeApiError`. `parseToolResult` JSON-parses the text payload, falling back to `{ rawText }`.
- **Thin REST proxy** (`FakturowniaInvoices/transport/restClient.ts`): POSTs a plain body to `{serverUrl}/fakturownia/invoices/<action>` and returns the parsed JSON directly (no JSON-RPC envelope). This is the newer node.

**4. Auth via credential header injection, not in code.** Each `*.credentials.ts` defines `authenticate: IAuthenticateGeneric` that injects a header, and the transport calls `helpers.httpRequestWithAuthentication`. So request code never reads secrets — it just names the credential. Patterns:
- `WfirmaApi` / `FakturowniaApi`: serialize keys into a custom header (e.g. `x-wfirma-credentials` = JSON of the keys + Fakto `subscriptionApiKey`).
- `FakturowniaBearerApi`: `Authorization: Bearer <token>`.
- `FakturowniaInvoices` is **dual-auth**: an `authentication` UI option (`apiKeys` | `bearerToken`) picks which credential (`fakturowniaApi` | `fakturowniaBearerApi`) is required, via `displayOptions` on the `credentials` array; `execute()` selects the credential name to pass to the transport accordingly.
- Every credential has a `test` request so n8n's "Test" button validates against the MCP server.

**5. UI descriptions are split per resource.** `nodes/<Node>/descriptions/*Description.ts` each export `<resource>Operations` and `<resource>Fields` arrays (n8n `INodeProperties`), re-exported through `descriptions/index.ts` and spread into the node's `properties`. Adding/renaming an operation means touching three things in sync: the description file, the `TOOL_MAP`/`OPERATION_TO_ACTION` entry, and `buildArgs`.

All nodes set `usableAsTool: true` and run per-input-item with `continueOnFail()` support (errors become `{ json: { error } }` rows instead of throwing). The Fakturownia `downloadPdf` operation is special-cased to convert a base64 response into n8n binary data.

## Conventions & gotchas

- **TOOL_MAP/UI parity is enforced by tests** (`test/unit/wfirma.node.test.ts`): every UI resource+operation must have a `TOOL_MAP` entry and vice versa. If you add an operation in only one place, tests fail — keep both sides aligned.
- Source uses **tabs** for indentation; match it.
- `dist/` is committed in some packages but is build output — edit `.ts` sources, not `.d.ts`/`.js` under `dist/`.
- Some comments are written in Polish; this is expected, not a translation task.

## Publishing

Each package publishes independently with npm provenance via GitHub Actions, triggered by tags:
- `wfirma-v*` → publishes `n8n-nodes-faktoapp-wfirma`
- `fakturownia-v*` → publishes `n8n-nodes-faktoapp-fakturownia`

Releases are cut with `release-it` (`npm run release` in the package). Ensure `dist/` is built and shipped — a past release (`bec63c4`) was published without it.


---

## Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
---
name: packet-context
description: |
  Search and fetch shared Packet artifacts for agent context. Use when the user
  asks for a Packet, receipt graph, proof packet, source-backed artifact, or
  creation artifact context. Also answers to "packet", "receipt-graph", and
  "context-packet".
aliases:
  - packet
  - receipt-graph
  - context-packet
author: Packet
---

# Packet Context

Packet is a creation-artifact contract: a durable object with sources, evidence,
workflow runs, credit ledger entries, provider receipts, exports, status
receipts, and proof records. This skill tells agents how to read shared Packet
truth without minting new receipts or spending credits.

## Use When

- The user asks for a Packet artifact, packet context, or proof packet.
- You need source/evidence/proof context before implementing or reviewing work.
- A handoff references a Packet slug or id.
- You need the same receipt graph the Packet app renders.

## Do Not Use When

- The answer is fully available in local files and no Packet artifact is needed.
- The user wants to create or mutate a Packet through the MCP read tools; the
  read tools stay read-only. Use the Packet-side agent publish contract below
  when the task is explicitly to publish a markdown/debrief artifact.
- The requested artifact is private or unavailable. Say it is not shared instead
  of trying to bypass visibility.

## MCP Read Tools

- `packet_search` (`packet.read`) — search shared Packet artifacts, sources, and
  evidence with a bounded page. Input: `{ "query": "terms", "limit": 10 }`.
- `packet_get` (`packet.read`) — fetch a shared Packet by `id`, `slug`, or
  `packetSlug` with its receipt graph. Input:
  `{ "slug": "production-golden-thread" }`.

Both tools are read-only. They spend zero credits and must not create receipts.

## Agent Publish Contract

When Luke explicitly asks an agent to publish a markdown/debrief Packet, agents
drive the Packet-side publish path instead of hand-uploading or inventing a
separate write tool.

Preferred Packet repo command:

```sh
pnpm publish:debrief -- <markdown-file> <slug> \
  --site-url <packet-dev-or-approved-site-url> \
  --convex-url <matching-convex-url> \
  --metadata '{"source":"agent-closeout"}'
```

CLI sugar in the Packet checkout:

```sh
packet publish <slug> --from-file <markdown-file> \
  --site-url <packet-dev-or-approved-site-url> \
  --convex-url <matching-convex-url>
```

Required contract:

- `PACKET_MCP_INGEST_TOKEN` supplies the bearer token for `POST /api/mcp/ingest`.
- The publish request must set `publish: true` and include a stable
  idempotency key or let `scripts/agent-publish.mjs` derive one from the slug,
  markdown hash, objective, and metadata.
- Always pass explicit `--site-url` and `--convex-url`; dev-agent config and
  shell env can point at different deployments.
- A real run is not done until the script verifies `packet_get` against the
  same Convex URL and finds the source/capture, publish, and rendered export
  receipts.
- No production writes from this companion contract unless Luke explicitly
  authorizes the target; Fable-owned production runs remain separate.

## Workflow

1. **Search first** unless the user gives a concrete slug or id.
   Call `packet_search` with a narrow query and `limit` no higher than 10.
2. **Select a packet.** Prefer exact slug/title matches, then source/evidence
   matches. If several candidates remain, tell the user the candidates instead
   of guessing.
3. **Fetch the graph.** Call `packet_get` for the selected slug or id.
4. **Carry receipt context forward.** Preserve source hashes, evidence excerpts,
   run ids, provider/export receipt ids, status messages, and proof summaries
   when using Packet context in another task.
5. **Be honest about visibility.** If `packet_get` returns not found, say the
   packet is missing or not shared. Do not imply private data was inspected.

## Output Discipline

When summarizing a Packet, include:

- packet slug and route
- source identity and evidence records used
- latest run id/status and credit ledger summary
- provider/export/status/proof receipt highlights
- any `human_required`, planned, blocked, or failed proof state

Do not collapse receipt details into unsourced prose when the downstream task
needs auditability.

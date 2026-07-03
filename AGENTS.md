# Packet plugins — agent guide

Publication-staged companion repo for Packet: one `packet-context` skill,
generated plugin manifests for Cursor, Codex, and Claude Code, `.mcp.json`, and
the MCP Registry `server.json`.

## Generate, do not hand-edit

`packet.config.ts` is the single source of truth. Every generated manifest,
`.mcp.json`, `server.json`, and the README install block are emitted by
`tooling/generate.ts`.

```sh
pnpm generate
pnpm verify
```

Never hand-edit generated files:

- `.mcp.json`
- `.claude-plugin/*`
- `.codex-plugin/*`
- `.cursor-plugin/*`
- `server.json`
- the README `AUTO-GENERATED` install block

## Companion plugin profile

This repo intentionally uses the `agent-plugin-companion` profile rather than a
full app-family turborepo profile. It owns generated plugin manifests, skills,
MCP metadata, and install documentation. It does not own Packet product runtime
code, Convex schema, deployment, or public repo creation.

Required root contract:

- `AGENTS.md` plus `CLAUDE.md -> AGENTS.md`
- `README.md`, `LICENSE`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`,
  `.nvmrc`, `.gitignore`, `.github/workflows/verify.yml`
- canonical config at `packet.config.ts`
- generator and smoke tooling under `tooling/`
- distributed skills under `skills/`
- generated client adapters: `.mcp.json`, `server.json`, `.claude-plugin/`,
  `.codex-plugin/`, `.cursor-plugin/`

## Scope

The Packet MCP read surface exposes:

- `packet_search` — read-only search across shared Packet artifacts, sources,
  and evidence with a bounded page.
- `packet_get` — read-only artifact/document fetch with the receipt graph:
  source identity, evidence, runs, provider receipts, export receipts, status
  receipts, proof records, and viewer receipt.

Reads do not mint receipts or spend credits. Private Packet artifacts are hidden
unless a future authenticated companion flow deliberately extends the profile.

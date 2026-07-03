# Packet plugins

Packet plugins is the publication-staged agent companion for Packet.

It gives agents one focused skill, `packet-context`, plus generated plugin and
MCP metadata for reading shared Packet artifacts through `packet_search` and
`packet_get`.

## Install

<!-- AUTO-GENERATED:INSTALL START -->

### Any agent (npx skills)

Works across Claude Code, Cursor, Codex, Copilot, Windsurf, and other skill-aware agents.

```sh
npx skills add creative-int/packet-plugins
```

### Claude Code

Add the marketplace, then install the Packet plugin.

```sh
/plugin marketplace add creative-int/packet-plugins
/plugin install packet@packet
```

### Codex

Add this repo as a Codex plugin marketplace, then install from /plugins.

```sh
codex plugin marketplace add creative-int/packet-plugins
```

### Cursor

Install Packet from the Cursor plugin marketplace.

```sh
Cursor -> Settings -> Plugins -> Add marketplace -> creative-int/packet-plugins
```

### Any remote MCP client

Point your MCP-aware client at Packet's remote MCP metadata URL.

```json
{
	"mcpServers": {
		"packet": {
			"url": "https://packet.creative-int.com/api/mcp"
		}
	}
}
```

### Direct HTTP read tools

Use these staged read endpoints when your agent cannot speak MCP yet.

```json
{
	"packet_search": {
		"method": "POST",
		"url": "https://packet.creative-int.com/api/mcp/search",
		"body": {
			"query": "search terms",
			"limit": 10
		}
	},
	"packet_get": {
		"method": "POST",
		"url": "https://packet.creative-int.com/api/mcp/get",
		"body": {
			"slug": "production-golden-thread"
		}
	}
}
```

<!-- AUTO-GENERATED:INSTALL END -->

## Included skill

- `packet-context` — search shared Packet artifacts, fetch a packet with its
  receipt graph, and carry source/evidence/proof receipts into downstream work.

## MCP read tools

The Packet read surface is intentionally read-only:

- `packet_search`: search shared Packet artifacts, sources, and evidence with a
  bounded page.
- `packet_get`: fetch a shared packet artifact by id or slug with source
  identity, evidence, runs, provider receipts, export receipts, status receipts,
  proof records, and viewer receipt.

Private artifacts are hidden. Reads do not mint receipts and do not spend
credits.

## Develop

```sh
pnpm install
pnpm generate
pnpm verify
```

## Publication gate

This scaffold is ready for Fable's go-public gate, but it intentionally does not
create or publish the GitHub repo.

## License

[MIT](LICENSE) © creative-int

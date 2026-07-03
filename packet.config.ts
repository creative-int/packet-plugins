/**
 * Canonical source of truth for every Packet install adapter.
 *
 * One config in, every client manifest out. Run `pnpm generate` to emit
 * `.mcp.json`, the Cursor / Codex / Claude Code plugin manifests, the MCP
 * Registry `server.json`, and the README install block.
 */

export interface PacketPluginConfig {
	name: string;
	displayName: string;
	version: string;
	tagline: string;
	shortDescription: string;
	longDescription: string;
	homepage: string;
	repository: string;
	license: string;
	owner: { name: string; email: string };
	category: string;
	keywords: string[];
	mcp: {
		id: string;
		url: string;
		transport: "streamable-http";
		endpoints: {
			search: string;
			get: string;
			ingest: string;
		};
	};
	registryName: string;
	skills: Array<{
		name: string;
		aliases: string[];
		description: string;
	}>;
	tools: Array<{
		name: "packet_search" | "packet_get";
		scope: string;
		endpoint: string;
		description: string;
		readOnly: true;
	}>;
	readiness: {
		status: string;
	};
	registry: {
		repoProfile: "agent-plugin-companion";
		companionOf: "packet";
	};
}

export const packet: PacketPluginConfig = {
	name: "packet",
	displayName: "Packet",
	version: "0.1.0",
	tagline: "Agent-readable creation artifacts with receipt graphs.",
	shortDescription:
		"Read shared Packet artifacts, sources, evidence, and receipt graphs from agents.",
	longDescription:
		"Packet is the creative-int creation-artifact contract: sources, workflow steps, credits, provider receipts, exports, status receipts, and proof records in one durable object. This companion gives agents a small read-only context workflow over Packet's MCP read surface: search shared packet artifacts, then fetch the exact receipt graph the app renders.",
	homepage: "https://packet.creative-int.com",
	repository: "https://github.com/creative-int/packet-plugins",
	license: "MIT",
	owner: { name: "creative-int", email: "hello@creative-int.com" },
	category: "Productivity",
	keywords: [
		"packet",
		"mcp",
		"agent-skills",
		"context",
		"artifacts",
		"receipts",
		"evidence",
		"proof",
	],
	mcp: {
		id: "packet",
		url: "https://packet.creative-int.com/api/mcp",
		transport: "streamable-http",
		endpoints: {
			search: "https://packet.creative-int.com/api/mcp/search",
			get: "https://packet.creative-int.com/api/mcp/get",
			ingest: "https://packet.creative-int.com/api/mcp/ingest",
		},
	},
	registryName: "io.github.creative-int/packet",
	skills: [
		{
			name: "packet-context",
			aliases: ["packet", "receipt-graph", "context-packet"],
			description:
				"Search shared Packet artifacts and fetch packet receipt graphs for agent context.",
		},
	],
	tools: [
		{
			name: "packet_search",
			scope: "packet.read",
			endpoint: "https://packet.creative-int.com/api/mcp/search",
			description:
				"Search shared Packet artifacts, sources, and evidence with a bounded page. Read-only; spends zero credits.",
			readOnly: true,
		},
		{
			name: "packet_get",
			scope: "packet.read",
			endpoint: "https://packet.creative-int.com/api/mcp/get",
			description:
				"Fetch a shared Packet artifact by id or slug with its source, evidence, run, provider, export, status, and proof receipt graph.",
			readOnly: true,
		},
	],
	readiness: {
		status:
			"Publication-staged. The Packet app branch adds read-only /api/mcp/search and /api/mcp/get endpoints; Fable owns GitHub repo creation and public release.",
	},
	registry: {
		repoProfile: "agent-plugin-companion",
		companionOf: "packet",
	},
};

export default packet;

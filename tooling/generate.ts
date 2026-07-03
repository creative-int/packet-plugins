/**
 * Emit every Packet install adapter from the canonical config.
 *
 *   pnpm generate
 *   pnpm generate --check
 *
 * Generated files: .mcp.json, .claude-plugin/*, .codex-plugin/*,
 * .cursor-plugin/*, server.json, and the README install block.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { packet } from "../packet.config.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const repoGit = `${packet.repository}.git`;
const author = { name: packet.owner.name, email: packet.owner.email };

const json = (value: unknown) => `${JSON.stringify(value, null, "\t")}\n`;

function slug() {
	return packet.repository.replace("https://github.com/", "");
}

export const installClients = [
	{
		id: "skills",
		label: "Any agent (npx skills)",
		blurb:
			"Works across Claude Code, Cursor, Codex, Copilot, Windsurf, and other skill-aware agents.",
		steps: [`npx skills add ${slug()}`],
	},
	{
		id: "claude-code",
		label: "Claude Code",
		blurb: "Add the marketplace, then install the Packet plugin.",
		steps: [
			`/plugin marketplace add ${slug()}`,
			`/plugin install ${packet.name}@${packet.name}`,
		],
	},
	{
		id: "codex",
		label: "Codex",
		blurb: "Add this repo as a Codex plugin marketplace, then install from /plugins.",
		steps: [`codex plugin marketplace add ${slug()}`],
	},
	{
		id: "cursor",
		label: "Cursor",
		blurb: "Install Packet from the Cursor plugin marketplace.",
		steps: [`Cursor -> Settings -> Plugins -> Add marketplace -> ${slug()}`],
	},
	{
		id: "mcp-remote",
		label: "Any remote MCP client",
		blurb: "Point your MCP-aware client at Packet's remote MCP metadata URL.",
		steps: [
			json({
				mcpServers: {
					[packet.mcp.id]: {
						url: packet.mcp.url,
					},
				},
			}).trim(),
		],
	},
	{
		id: "http-read-tools",
		label: "Direct HTTP read tools",
		blurb: "Use these staged read endpoints when your agent cannot speak MCP yet.",
		steps: [
			json({
				packet_search: {
					method: "POST",
					url: packet.mcp.endpoints.search,
					body: { query: "search terms", limit: 10 },
				},
				packet_get: {
					method: "POST",
					url: packet.mcp.endpoints.get,
					body: { slug: "production-golden-thread" },
				},
			}).trim(),
		],
	},
];

const files: Record<string, string> = {
	".mcp.json": json({
		mcpServers: { [packet.mcp.id]: { url: packet.mcp.url } },
	}),

	".claude-plugin/plugin.json": json({
		name: packet.name,
		version: packet.version,
		description: packet.shortDescription,
		author,
		homepage: packet.homepage,
		repository: repoGit,
		license: packet.license,
		keywords: packet.keywords,
		displayName: packet.displayName,
		skills: "./skills",
		mcpServers: "./.mcp.json",
	}),
	".claude-plugin/marketplace.json": json({
		name: packet.name,
		owner: author,
		plugins: [
			{
				name: packet.name,
				displayName: packet.displayName,
				source: "./",
				description: packet.shortDescription,
			},
		],
	}),

	".codex-plugin/plugin.json": json({
		name: packet.name,
		version: packet.version,
		description: packet.shortDescription,
		author,
		homepage: packet.homepage,
		repository: repoGit,
		license: packet.license,
		keywords: packet.keywords,
		skills: "./skills",
		mcpServers: "./.mcp.json",
		interface: {
			displayName: packet.displayName,
			shortDescription: packet.shortDescription,
			longDescription: packet.longDescription,
			developerName: packet.owner.name,
			category: packet.category,
			capabilities: ["Read", "MCP", "Skills"],
			defaultPrompt: [
				"Find the relevant Packet and pull its receipt graph.",
				"Read the production golden-thread Packet proof.",
				"Search Packet sources for this handoff.",
			],
		},
	}),

	".cursor-plugin/plugin.json": json({
		name: packet.name,
		version: packet.version,
		description: packet.shortDescription,
		author,
		homepage: packet.homepage,
		repository: repoGit,
		license: packet.license,
		keywords: packet.keywords,
		displayName: packet.displayName,
		skills: "./skills",
		mcpServers: "./.mcp.json",
	}),
	".cursor-plugin/marketplace.json": json({
		name: packet.name,
		owner: author,
		metadata: {
			description: packet.shortDescription,
			...packet.registry,
		},
		plugins: [
			{ name: packet.name, source: ".", description: packet.shortDescription },
		],
	}),

	"server.json": json({
		$schema:
			"https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json",
		name: packet.registryName,
		description: packet.shortDescription,
		version: packet.version,
		repository: { url: packet.repository, source: "github" },
		remotes: [{ type: packet.mcp.transport, url: packet.mcp.url }],
		metadata: {
			...packet.registry,
			tools: packet.tools.map((tool) => ({
				name: tool.name,
				scope: tool.scope,
				readOnly: tool.readOnly,
				endpoint: tool.endpoint,
			})),
		},
	}),
};

function readmeInstallBlock() {
	return installClients
		.map((client) => {
			const body =
				client.id === "mcp-remote" || client.id === "http-read-tools"
					? ["```json", client.steps[0], "```"].join("\n")
					: ["```sh", ...client.steps, "```"].join("\n");
			return `### ${client.label}\n\n${client.blurb}\n\n${body}`;
		})
		.join("\n\n");
}

const START = "<!-- AUTO-GENERATED:INSTALL START -->";
const END = "<!-- AUTO-GENERATED:INSTALL END -->";

function applyReadme(current: string) {
	const block = `${START}\n\n${readmeInstallBlock()}\n\n${END}`;
	const re = new RegExp(`${START}[\\s\\S]*?${END}`);
	if (!re.test(current)) {
		throw new Error("README is missing the AUTO-GENERATED:INSTALL markers.");
	}
	return current.replace(re, block);
}

function safeRead(path: string) {
	try {
		return readFileSync(path, "utf8");
	} catch {
		return null;
	}
}

let stale = 0;
function report(rel: string) {
	console.log(`${CHECK ? "stale" : "wrote"}: ${rel}`);
	stale += 1;
}

for (const [rel, content] of Object.entries(files)) {
	const path = join(ROOT, rel);
	const existing = safeRead(path);
	if (existing === content) continue;
	if (CHECK) {
		report(rel);
	} else {
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, content);
		report(rel);
	}
}

{
	const path = join(ROOT, "README.md");
	const current = safeRead(path);
	if (current !== null) {
		const next = applyReadme(current);
		if (next !== current) {
			if (CHECK) {
				report("README.md (install block)");
			} else {
				writeFileSync(path, next);
				report("README.md (install block)");
			}
		}
	}
}

if (CHECK && stale > 0) {
	console.error(
		`\n${stale} generated file(s) are stale. Run \`pnpm generate\` and commit.`,
	);
	process.exit(1);
}

console.log(CHECK ? "generated files are up to date." : "generated all adapters.");

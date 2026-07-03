/**
 * Validate the publication-staged Packet companion manifests.
 *
 * This is intentionally structural, not a production reachability claim.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { packet } from "../packet.config.ts";

const root = new URL("..", import.meta.url);

function readJson(relativePath: string) {
	return JSON.parse(readFileSync(new URL(relativePath, root), "utf8")) as Record<
		string,
		unknown
	>;
}

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

function getRecord(value: unknown, label: string) {
	assert(value && typeof value === "object" && !Array.isArray(value), label);
	return value as Record<string, unknown>;
}

const generated = [
	".mcp.json",
	"server.json",
	".claude-plugin/plugin.json",
	".codex-plugin/plugin.json",
	".cursor-plugin/plugin.json",
];

for (const file of generated) {
	readJson(file);
}

const mcp = readJson(".mcp.json");
const mcpServers = getRecord(mcp.mcpServers, ".mcp.json missing mcpServers");
const packetServer = getRecord(
	mcpServers[packet.mcp.id],
	".mcp.json missing packet server",
);
assert(packetServer.url === packet.mcp.url, ".mcp.json has stale Packet MCP URL");

const server = readJson("server.json");
assert(server.name === packet.registryName, "server.json registry name drift");
assert(server.description === packet.shortDescription, "server.json description drift");
const remotes = server.remotes;
assert(Array.isArray(remotes) && remotes.length === 1, "server.json remotes invalid");
assert(
	getRecord(remotes[0], "server.json remote invalid").url === packet.mcp.url,
	"server.json remote URL drift",
);
const serverMetadata = getRecord(server.metadata, "server.json metadata missing");
assert(
	serverMetadata.repoProfile === "agent-plugin-companion",
	"server.json repoProfile missing",
);
assert(serverMetadata.companionOf === "packet", "server.json companionOf missing");

for (const manifestPath of [
	".claude-plugin/plugin.json",
	".codex-plugin/plugin.json",
	".cursor-plugin/plugin.json",
]) {
	const manifest = readJson(manifestPath);
	assert(manifest.name === packet.name, `${manifestPath} name drift`);
	assert(manifest.skills === "./skills", `${manifestPath} skills path drift`);
	assert(
		manifest.mcpServers === "./.mcp.json",
		`${manifestPath} mcpServers path drift`,
	);
	assert(
		!("metadata" in manifest),
		`${manifestPath} should keep registry metadata out of plugin manifests`,
	);
}

const codexManifest = readJson(".codex-plugin/plugin.json");
const codexInterface = getRecord(
	codexManifest.interface,
	".codex-plugin/plugin.json interface missing",
);
assert(
	Array.isArray(codexInterface.capabilities),
	".codex-plugin/plugin.json interface.capabilities missing",
);

const skillPath = join("skills", "packet-context", "SKILL.md");
const skill = readFileSync(new URL(skillPath, root), "utf8");
assert(skill.includes("packet_search"), "packet-context skill missing packet_search");
assert(skill.includes("packet_get"), "packet-context skill missing packet_get");

console.log("Packet plugin manifests validate.");

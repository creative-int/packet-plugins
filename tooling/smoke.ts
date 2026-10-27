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

/**
 * A Claude-compatible remote entry. Claude Code parses an entry without
 * `type` as stdio, fails it for lacking `command`, and silently drops it.
 */
function checkRemoteEntry(entry: unknown, where: string) {
	const server = getRecord(entry, `${where} is not an object`);
	assert(
		server.type === "http",
		`${where} must declare type "http"; without it Claude Code drops the server`,
	);
	assert(server.url === packet.mcp.url, `${where} has a stale Packet MCP URL`);
	assert(!("command" in server), `${where} must not carry a stdio command`);
}

function checkMcpServers(value: unknown, where: string) {
	const servers = getRecord(value, `${where} missing mcpServers`);
	assert(
		Object.keys(servers).join(",") === packet.mcp.id,
		`${where} must declare only the ${packet.mcp.id} server`,
	);
	checkRemoteEntry(servers[packet.mcp.id], `${where} ${packet.mcp.id} server`);
	return servers[packet.mcp.id];
}

const mcp = readJson(".mcp.json");
const packetServer = checkMcpServers(mcp.mcpServers, ".mcp.json");

// Every distributed example that a Claude-compatible client could paste.
const readme = readFileSync(new URL("README.md", root), "utf8");
const installBlock = readme.match(
	/<!-- AUTO-GENERATED:INSTALL START -->([\s\S]*?)<!-- AUTO-GENERATED:INSTALL END -->/,
)?.[1];
assert(installBlock, "README is missing the AUTO-GENERATED install block");
const examples = [...installBlock.matchAll(/```json\n([\s\S]*?)\n```/g)]
	.map((match) => JSON.parse(match[1] ?? "") as Record<string, unknown>)
	.filter((example) => "mcpServers" in example);
assert(examples.length > 0, "README has no remote MCP client example");
for (const example of examples) {
	checkMcpServers(example.mcpServers, "README remote MCP example");
}

// The check must reject a missing or wrong transport, every run.
const transportMutations: Array<[string, (entry: Record<string, unknown>) => void]> = [
	["no type", (entry) => {
		delete entry.type;
	}],
	["type stdio", (entry) => {
		entry.type = "stdio";
	}],
	["the registry spelling", (entry) => {
		entry.type = "streamable-http";
	}],
];
for (const [label, mutate] of transportMutations) {
	const mutated = structuredClone(getRecord(packetServer, ".mcp.json server"));
	mutate(mutated);
	let rejected = false;
	try {
		checkRemoteEntry(mutated, `self-test (${label})`);
	} catch {
		rejected = true;
	}
	assert(rejected, `transport check accepted a remote entry with ${label}`);
}

const server = readJson("server.json");
assert(server.name === packet.registryName, "server.json registry name drift");
assert(server.description === packet.shortDescription, "server.json description drift");
assert(server.version === packet.version, "server.json version drift");
const remotes = server.remotes;
assert(Array.isArray(remotes) && remotes.length === 1, "server.json remotes invalid");
const remote = getRecord(remotes[0], "server.json remote invalid");
assert(remote.url === packet.mcp.url, "server.json remote URL drift");
assert(
	remote.type === packet.mcp.transport && packet.mcp.transport === "streamable-http",
	"server.json remote must keep the registry transport spelling streamable-http",
);

const marketplace = readJson(".claude-plugin/marketplace.json");
const marketplaceMetadata = getRecord(
	marketplace.metadata,
	".claude-plugin/marketplace.json metadata missing",
);
assert(
	typeof marketplaceMetadata.description === "string" &&
		marketplaceMetadata.description.length > 0,
	".claude-plugin/marketplace.json needs a description for strict validation",
);

const packageJson = readJson("package.json");
assert(packageJson.version === packet.version, "package.json version drift");
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
	assert(manifest.version === packet.version, `${manifestPath} version drift`);
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

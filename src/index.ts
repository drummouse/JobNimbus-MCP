import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

// ─── Stdio entry point (local Claude Desktop / CLI usage) ────────────────────

if (!process.env.JOBNIMBUS_API_KEY) {
  process.stderr.write("Error: JOBNIMBUS_API_KEY environment variable is required\n");
  process.exit(1);
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("JobNimbus MCP Server running\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});

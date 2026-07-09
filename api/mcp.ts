import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "../src/server.js";

// ─── Vercel entry point: stateless Streamable HTTP MCP endpoint ──────────────
// Each POST gets a fresh server + transport, so requests are independent and
// safe across serverless invocations (no session state to lose).

type VercelRequest = IncomingMessage & { body?: unknown };

function reply(res: ServerResponse, status: number, message: string, code: number) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null }));
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  const expected = process.env.MCP_AUTH_TOKEN;
  if (expected) {
    const got = req.headers.authorization ?? "";
    if (got !== `Bearer ${expected}`) {
      return reply(res, 401, "Unauthorized: missing or invalid bearer token", -32001);
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(res, 405, "Method not allowed. This stateless MCP server only accepts POST.", -32000);
  }

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

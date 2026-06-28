/**
 * Shared Kapruka MCP client — call tools directly without self-HTTP.
 * Import this in any server-side route that needs to talk to the MCP server.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const DEFAULT_URL =
  process.env.MCP_SERVER_URL ?? "https://mcp.kapruka.com/mcp";

/** Call a single Kapruka MCP tool and return the parsed JSON response. */
export async function callKaprukaTool(
  toolName: string,
  params: Record<string, unknown>,
  serverUrl = DEFAULT_URL,
): Promise<Record<string, unknown>> {
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
  const client = new Client(
    { name: "kapruka-mcp-ui", version: "1.0.0" },
    { capabilities: {} },
  );

  await client.connect(transport);

  try {
    const result = await client.callTool({
      name: toolName,
      arguments: { params: { ...params, response_format: "json" } },
    });

    // MCP SDK wraps the tool output in content[].text
    const content = (result as { content?: { type: string; text?: string }[] })
      ?.content;
    const text = content?.find((c) => c.type === "text")?.text ?? "";

    return JSON.parse(text) as Record<string, unknown>;
  } finally {
    try {
      await transport.close();
    } catch {
      // ignore close errors
    }
  }
}

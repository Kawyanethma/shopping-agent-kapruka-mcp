/**
 * Shared Kapruka MCP client — call tools directly without self-HTTP.
 * Import this in any server-side route that needs to talk to the MCP server.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const DEFAULT_URL = process.env.MCP_SERVER_URL ?? "https://mcp.kapruka.com/mcp";

/**
 * Call a single Kapruka MCP tool and return the parsed JSON response.
 *
 * The MCP tool always returns text; when that text isn't valid JSON
 * (e.g. "No products found for '…'", "Error: …") we return a safe
 * object so callers never have to guard against JSON parse errors.
 */
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

    // Safe JSON parse — MCP can return plain-text error messages like:
    // "No products found for 'xyz'" or "Error: <message>"
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      // Not JSON: treat as an error message and surface it cleanly
      return {
        _mcpError: true,
        message: text || "No results returned from Kapruka.",
        results: [], // safe default for search
        categories: [], // safe default for list_categories
        cities: [], // safe default for list_delivery_cities
      };
    }
  } finally {
    try {
      await transport.close();
    } catch {
      // ignore close errors
    }
  }
}

import { z } from "zod";
import { NextResponse } from "next/server";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SERVER_URL =
  process.env.MCP_SERVER_URL ?? "https://mcp.kapruka.com/mcp";

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("list-tools"),
    serverUrl: z.string().url().optional(),
  }),
  z.object({
    action: z.literal("call-tool"),
    serverUrl: z.string().url().optional(),
    toolName: z.string().min(1),
    args: z.record(z.string(), z.unknown()).optional(),
  }),
]);

async function withClient<T>(
  serverUrl: string,
  handler: (client: Client) => Promise<T>,
) {
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
  const client = new Client(
    { name: "kapruka-mcp-ui", version: "1.0.0" },
    { capabilities: {} },
  );
  await client.connect(transport);
  try {
    return await handler(client);
  } finally {
    try {
      await transport.close();
    } catch (e) {
      console.error("MCP transport close error:", e);
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const serverUrl = body.serverUrl ?? DEFAULT_SERVER_URL;

    if (body.action === "list-tools") {
      const tools = await withClient(serverUrl, async (c) => {
        const r = await c.listTools();
        return r.tools;
      });
      return NextResponse.json({ success: true, serverUrl, tools });
    }

    const result = await withClient(serverUrl, async (c) =>
      c.callTool({ name: body.toolName, arguments: body.args ?? {} }),
    );
    return NextResponse.json({ success: true, serverUrl, result });
  } catch (error) {
    console.error("MCP error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "MCP error",
      },
      { status: 500 },
    );
  }
}

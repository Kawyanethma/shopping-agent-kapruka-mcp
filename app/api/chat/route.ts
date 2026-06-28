import {
  GoogleGenerativeAI,
  type FunctionDeclaration,
  type Tool,
  SchemaType,
} from "@google/generative-ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { callKaprukaTool } from "@/lib/kapruka-mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Request schema ───────────────────────────────────────────────────────────
const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        parts: z.array(z.object({ text: z.string() })),
      }),
    )
    .optional()
    .default([]),
});

// ─── Gemini function declarations for all Kapruka tools ──────────────────────
const KAPRUKA_FUNCTIONS: FunctionDeclaration[] = [
  {
    name: "kapruka_search_products",
    description:
      "Search for products on Kapruka.com by keyword. Use this whenever the user asks to find, show, browse, or search for any product.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        q: {
          type: SchemaType.STRING,
          description: "Search query e.g. 'birthday cake', 'red roses'",
        },
        category: {
          type: SchemaType.STRING,
          description: "Category filter e.g. 'Cakes', 'Flowers'",
        },
        limit: {
          type: SchemaType.NUMBER,
          description: "Results to return (default 12, max 20)",
        },
        sort: {
          type: SchemaType.STRING,
          description: "Sort: relevance|price_asc|price_desc|newest|bestseller",
        },
        min_price: {
          type: SchemaType.NUMBER,
          description: "Minimum price in LKR",
        },
        max_price: {
          type: SchemaType.NUMBER,
          description: "Maximum price in LKR",
        },
        in_stock_only: {
          type: SchemaType.BOOLEAN,
          description: "Only return in-stock items",
        },
      },
      required: ["q"],
    },
  },
  {
    name: "kapruka_list_categories",
    description:
      "List all product categories on Kapruka. Use when the user asks what categories, product types, or departments exist.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        depth: {
          type: SchemaType.NUMBER,
          description: "Subcategory depth: 1 or 2 (default 2)",
        },
      },
    },
  },
  {
    name: "kapruka_list_delivery_cities",
    description:
      "List Sri Lankan cities Kapruka delivers to. Use when the user asks where Kapruka delivers, which cities are covered, or delivery areas.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: "Partial city name filter e.g. 'colombo', 'kandy'",
        },
        limit: {
          type: SchemaType.NUMBER,
          description: "Max cities to return (default 25)",
        },
      },
    },
  },
  {
    name: "kapruka_check_delivery",
    description:
      "Check if Kapruka delivers to a specific city and the flat delivery rate. Use when the user asks about delivery availability to a city.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        city: {
          type: SchemaType.STRING,
          description: "City name e.g. 'Colombo 03', 'Galle', 'Kandy'",
        },
        delivery_date: {
          type: SchemaType.STRING,
          description: "Optional delivery date YYYY-MM-DD",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "kapruka_track_order",
    description:
      "Track a Kapruka order by order number. Use when the user wants to track, check status, or find their order.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        order_number: {
          type: SchemaType.STRING,
          description: "Order number e.g. 'VIMP34456CB2'",
        },
      },
      required: ["order_number"],
    },
  },
];

const GEMINI_TOOLS: Tool[] = [{ functionDeclarations: KAPRUKA_FUNCTIONS }];

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let body: z.infer<typeof chatRequestSchema>;
  try {
    body = chatRequestSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof z.ZodError ? err.issues : "Invalid request" },
      { status: 400 },
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      tools: GEMINI_TOOLS,
      systemInstruction:
        "You are a helpful Kapruka shopping assistant for Sri Lanka's largest e-commerce platform. " +
        "Help users find products, browse categories, check delivery, and track orders. " +
        "When a user asks about products always call kapruka_search_products. " +
        "When you have product results, briefly describe what you found (e.g. 'Here are some birthday cakes for you:') " +
        "but DO NOT list individual products in text — the UI will render them as cards automatically. " +
        "Keep replies concise and friendly.",
    });

    const chat = model.startChat({ history: body.history });
    let result = await chat.sendMessage(body.message);
    let response = result.response;

    // ── Tool-calling loop ────────────────────────────────────────────────────
    const toolResults: { toolName: string; data: Record<string, unknown> }[] =
      [];

    while (
      response.candidates?.[0]?.content?.parts?.some((p) => p.functionCall)
    ) {
      const calls = response.candidates[0].content.parts.filter(
        (p) => p.functionCall,
      );

      const functionResponses = await Promise.all(
        calls.map(async (part) => {
          const fc = part.functionCall!;
          const data = await callKaprukaTool(
            fc.name,
            (fc.args ?? {}) as Record<string, unknown>,
          );
          toolResults.push({ toolName: fc.name, data });
          return { functionResponse: { name: fc.name, response: data } };
        }),
      );

      result = await chat.sendMessage(functionResponses);
      response = result.response;
    }

    return NextResponse.json({ text: response.text(), toolResults });
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gemini request failed" },
      { status: 500 },
    );
  }
}

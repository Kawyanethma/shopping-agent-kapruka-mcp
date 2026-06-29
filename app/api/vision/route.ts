import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const visionRequestSchema = z.object({
  image: z.string(), // base64
  mimeType: z.string(),
});

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  let body;
  try {
    body = visionRequestSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-3.1-flash-lite as it's the model available in this environment
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const prompt = "Identify the main product in this image. Is it a cake, chocolate, flower arrangement, or something else? Return ONLY a short 2-5 word search query for an e-commerce store (e.g. 'chocolate birthday cake', 'red roses bouquet', 'ferrero rocher box'). Do not add any extra text.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: body.image,
          mimeType: body.mimeType,
        },
      },
    ]);

    const text = result.response.text().trim();
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Vision API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Vision request failed" },
      { status: 500 },
    );
  }
}

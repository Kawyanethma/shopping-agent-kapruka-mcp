import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { audio, mimeType } = await req.json();

    if (!audio || !mimeType) {
      return NextResponse.json({ error: "Missing audio or mimeType" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    // Use gemini-3.1-flash-lite for fast multimodal processing
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const prompt = `Please transcribe the following audio. Output ONLY the transcribed text, nothing else. The audio might be in English, Sinhala, or Tamil. Do not translate it.
    
    CRITICAL: If the audio is mostly silence, static, background noise, or unintelligible, you MUST output exactly the word [SILENCE] and nothing else. Do not hallucinate words like "Thank you" or "Okay".`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: audio,
        },
      },
    ]);

    const response = await result.response;
    let text = response.text().trim();
    
    // Filter out common hallucinations or our strict keyword
    if (text === "[SILENCE]" || text.toLowerCase() === "thank you." || text.toLowerCase() === "thanks for watching.") {
       text = "";
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json({ error: "Error transcribing audio" }, { status: 500 });
  }
}

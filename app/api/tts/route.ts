import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

function pcmToWavBase64(base64: string, sampleRate = 24000): string {
  const pcmBuffer = Buffer.from(base64, 'base64');
  const wavHeader = Buffer.alloc(44);
  
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);
  
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(1, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(sampleRate * 2, 28);
  wavHeader.writeUInt16LE(2, 32);
  wavHeader.writeUInt16LE(16, 34);
  
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);
  
  const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);
  return wavBuffer.toString('base64');
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-tts-preview" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore"
            }
          }
        }
      } as any // Cast to any to bypass strict SDK typing for newer fields
    });

    const response = await result.response;
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
       return NextResponse.json({ error: "No audio generated" }, { status: 500 });
    }

    const audioData = candidates[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      return NextResponse.json({ error: "No audio generated" }, { status: 500 });
    }

    // Convert raw PCM to a playable WAV format
    const wavBase64 = pcmToWavBase64(audioData, 24000);

    return NextResponse.json({ audio: wavBase64, mimeType: "audio/wav" });
  } catch (error) {
    console.error("Error generating TTS with Gemini:", error);
    return NextResponse.json({ error: "Error generating audio" }, { status: 500 });
  }
}

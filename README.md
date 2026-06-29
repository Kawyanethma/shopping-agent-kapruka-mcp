# Kapruka Buddy 🛍️🤖

Kapruka Buddy is an intelligent, voice-activated shopping assistant for Kapruka.com, Sri Lanka's largest e-commerce platform. Built with Next.js, Shadcn UI, and powered by Gemini AI via MCP (Model Context Protocol).

## ✨ Features

### 🎙️ Intelligent Voice Search & TTS
- **Real-Time Voice Input:** Talk directly to the app using your microphone.
- **Dynamic Mic Visualizer:** A stunning, reactive sound wave equalizer (Purple & Gold gradient) that dynamically scales and pulses based on your live audio volume (RMS).
- **Silence Detection:** Automatically finishes recording and submits your query when you stop speaking.
- **Voice Responses:** Native Gemini TTS (Text-to-Speech) reads out product availability, tracking updates, and assistance.
- **Language Agnostic:** Seamlessly speak in English, Sinhala, or Tamil.

### 📸 Visual AI Product Search
- **Image Upload:** Upload a picture of a product (like a birthday cake, chocolate box, or flower bouquet).
- **Gemini Vision Integration:** Utilizes Gemini Vision capabilities to automatically analyze the image, detect the main product, and instantly trigger a Kapruka product search within the chat flow!

### ⚡ Quick Actions (No-LLM Mode)
- One-click quick actions to instantly search for "Birthday cakes", "Flowers", "Colombo Delivery", or "Order Tracking" without wasting AI tokens, talking directly to the Kapruka MCP.

### 💬 Smart AI Chat
- Context-aware shopping AI that knows precisely when to invoke Kapruka tools (Search, Categories, Tracking, Delivery).
- Rich UI responses with beautifully designed product cards.
- **In-Chat Ordering:** Instantly generate an inline order form inside the chat flow.

### 🎨 Premium UI/UX
- **Custom Theming:** Deep Purple (`#442a73`) and Gold (`#f9dc09`) brand color integration.
- **Smooth Animations:** Bouncing loaders, micro-interactions, and beautiful transitions.
- **Elegant Error Handling:** Clean, non-intrusive toast notifications powered by `Sonner`.
- **Isolated Renders:** Highly optimized React architecture ensuring typing and recording doesn't re-render the heavy message list.

## 🛠️ Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **AI / LLMs:** Google Generative AI (Gemini Flash Lite & Vision APIs)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (Tailwind CSS, Radix UI)
- **Notifications:** Sonner (Toast)
- **API Architecture:** MCP (Model Context Protocol) bridging Gemini function calling with Kapruka endpoints.

## 🚀 Getting Started

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   pnpm install
   ```
3. **Set up Environment Variables**
   Create a `.env.local` file and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. **Run the development server**
   ```bash
   pnpm dev
   ```
5. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Key Directories

- `/app/chat-shopping.tsx`: The primary AI Chat Interface housing the message list, voice visualization, image uploading, and API interactions.
- `/app/api/chat/route.ts`: Serverless route bridging Gemini models, managing tool execution, and handling history.
- `/app/api/vision/route.ts`: Endpoint processing base64 image uploads to generate intelligent search queries via Gemini Vision.
- `/app/api/tts/route.ts`: Generates audio responses natively using Gemini TTS.

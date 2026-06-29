"use client";

import { memo, UIEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard, type Product } from "@/components/ProductCard";
import { ProductDetailsModal } from "@/components/ProductDetailsModal";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Package,
  Tag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClockIcon,
  Send,
  Cake,
  Flower2,
  Gift,
  ArrowDown,
  Mic,
  X,
  ImagePlus
} from "lucide-react";
import { toast } from "sonner";
import { TruckIcon } from "@/components/ui/truck";
import { MapPinIcon } from "@/components/ui/map-pin";
import { LoaderCircleIcon } from "@/components/ui/loader-circle";
import { OrderFormDialog } from "@/components/order/OrderFormDialog";
import { ChatOrderForm } from "@/components/order/ChatOrderForm";
import { OrderConfirmationCard } from "@/components/order/OrderConfirmationCard";
import type { OrderResult } from "@/components/order/types";
import { GithubIcon } from "@/components/ui/github";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ShinyText from "@/components/ui/shiny-text";
import Image from "next/image";
import { KaprukaBuddyFeaturesDialog } from "@/components/FeatursDialog";


// ─── Types ────────────────────────────────────────────────────────────────────
type GeminiHistory = { role: "user" | "model"; parts: { text: string }[] };
type ToolResult = { toolName: string; data: Record<string, unknown> };

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  toolResults?: ToolResult[];
  orderResult?: OrderResult;
  /** Inline chat order form — product being ordered */
  chatOrderProduct?: Product;
  isLoading?: boolean;
};

let _id = 0;
const uid = () => String(++_id);

// ─── Rich result cards ────────────────────────────────────────────────────────
const DeliveryCard = memo(function DeliveryCard({
  data,
}: {
  data: Record<string, unknown>;
}) {
  const available = Boolean(data.available);
  const city = String(data.city ?? "");
  const rate = Number(data.rate ?? 0);
  const date = String(data.checked_date ?? "");
  const reason = data.reason ? String(data.reason) : null;
  const nextDate = data.next_available_date
    ? String(data.next_available_date)
    : null;
  const warning = data.perishable_warning
    ? String(data.perishable_warning)
    : null;

  return (
    <Card
      className={`border-l-4 ${available ? "border-l-green-500" : "border-l-red-400"}`}
    >
      <CardContent className="pt-4 pb-3 space-y-2">
        <div className="flex items-center gap-2">
          <MapPinIcon size={16} className="text-muted-foreground" />
          <span className="font-semibold">{city}</span>
          <Badge
            variant={available ? "default" : "destructive"}
            className="ml-auto gap-1"
          >
            {available ? (
              <>
                <CheckCircle2 className="w-3 h-3" /> Available
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" /> Unavailable
              </>
            )}
          </Badge>
        </div>
        {available && (
          <>
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              <TruckIcon size={14} />
              Flat delivery rate:{" "}
              <span className="font-medium text-foreground">
                LKR {rate.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ClockIcon size={12} /> Checked for {date}
            </div>
          </>
        )}
        {!available && reason && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 shrink-0" /> {reason}
          </p>
        )}
        {!available && nextDate && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <ClockIcon size={14} className="shrink-0" /> Next available:{" "}
            <strong>{nextDate}</strong>
          </p>
        )}
        {warning && (
          <p className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 rounded p-2 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {warning}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

const CategoryList = memo(function CategoryList({
  data,
}: {
  data: Record<string, unknown>;
}) {
  type Cat = { name: string; url: string; children?: Cat[] };
  const categories = (data.categories ?? []) as Cat[];
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-primary" />
          <span className="font-semibold">Product Categories</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map((cat) => (
            <a
              key={cat.name}
              href={cat.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-2 rounded-lg border hover:bg-primary hover:text-primary-foreground transition-colors truncate"
            >
              {cat.name}
              {cat.children?.length ? (
                <span className="text-xs opacity-60 ml-1">
                  +{cat.children.length}
                </span>
              ) : null}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

const CitiesList = memo(function CitiesList({
  data,
}: {
  data: Record<string, unknown>;
}) {
  type City = { name: string; aliases?: string[] };
  const cities = (data.cities ?? []) as City[];
  const total = Number(data.total_matched ?? cities.length);
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <MapPinIcon size={16} className="text-primary" />
          <span className="font-semibold">Delivery Cities</span>
          <Badge variant="secondary" className="ml-auto">
            {total} total
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-48 overflow-y-auto">
          {cities.map((c) => (
            <div
              key={c.name}
              className="text-xs px-2 py-1 rounded bg-muted truncate"
              title={c.aliases?.join(", ")}
            >
              {c.name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

const OrderCard = memo(function OrderCard({
  data,
}: {
  data: Record<string, unknown>;
}) {
  type Progress = { step: string; timestamp: string };
  type Item = { name: string; quantity: number; selling_price: number };
  const progress = (data.progress ?? []) as Progress[];
  const items = (data.items ?? []) as Item[];

  const statusColor: Record<string, string> = {
    delivered: "bg-green-100 text-green-800",
    "out-for-delivery": "bg-blue-100 text-blue-800",
    confirmed: "bg-purple-100 text-purple-800",
    received: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
  };
  const status = String(data.status ?? "");

  return (
    <Card>
      <CardContent className="pt-4 pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="font-semibold">
            Order {String(data.order_number)}
          </span>
          <span
            className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[status] ?? "bg-gray-100 text-gray-700"}`}
          >
            {String(data.status_display ?? status)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-muted-foreground">Order date</div>
          <div>{String(data.order_date ?? "–")}</div>
          <div className="text-muted-foreground">Delivery date</div>
          <div>{String(data.delivery_date ?? "–")}</div>
          <div className="text-muted-foreground">Amount</div>
          <div>LKR {String(data.amount ?? "–")}</div>
        </div>
        {items.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="truncate pr-2">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    LKR {item.selling_price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
        {progress.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1.5">
              {progress.map((p, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{p.step}</p>
                    <p className="text-muted-foreground">{p.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

// ─── Single message row (memoised – won't re-render when input changes) ───────
const MessageRow = memo(function MessageRow({
  msg,
  onViewProduct,
  onOrderNow,
  onOrderInChat,
  onChatOrderCreated,
  onDismissChatOrder,
  messagesFocusRef,
}: {
  msg: ChatMessage;
  onViewProduct: (p: Product) => void;
  onOrderNow: (p: Product) => void;
  onOrderInChat: (p: Product) => void;
  onChatOrderCreated: (result: OrderResult, msgId: string) => void;
  onDismissChatOrder: (msgId: string) => void;
  messagesFocusRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="space-y-3">
      {/* Bubble */}
      {(msg.content || msg.isLoading) && (
        <div
          className={`flex items-start gap-0 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "assistant" && (
            <div
              className={`w-15 h-15 rounded-full flex items-center justify-center shrink-0 mt-0.5 motion-preset-pop`}
            >
              <Image
                src="/buddy-chat.png"
                alt="Kapruka Buddy"
                height={100}
                width={100}
              />
            </div>
          )}
          <div
            className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
            }`}
          >
            {msg.isLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <LoaderCircleIcon size={14} className="animate-spin" />
                <ShinyText text="Thinking..." />
              </span>
            ) : (
              <p className="whitespace-pre-wrap">
                {msg.content.toLowerCase().includes("error:")
                  ? "Sorry, something went wrong."
                  : msg.content}
              </p>
            )}
          </div>
        </div>
      )}
      <div ref={messagesFocusRef ?? undefined} />
      {/* Non-search tool result cards */}
      {!msg.isLoading &&
        msg.toolResults
          ?.filter((r) => r.toolName !== "kapruka_search_products")
          .map((r, i) => (
            <div key={i} className="pl-9">
              {r.toolName === "kapruka_check_delivery" && (
                <DeliveryCard data={r.data} />
              )}
              {r.toolName === "kapruka_list_categories" && (
                <CategoryList data={r.data} />
              )}
              {r.toolName === "kapruka_list_delivery_cities" && (
                <CitiesList data={r.data} />
              )}
              {r.toolName === "kapruka_track_order" && (
                <OrderCard data={r.data} />
              )}
            </div>
          ))}

      {/* Product grid */}
      {!msg.isLoading && msg.products && msg.products.length > 0 && (
        <div className="pl-9 space-y-2">
          <p className="text-xs text-muted-foreground">
            {msg.products.length} product{msg.products.length !== 1 ? "s" : ""}{" "}
            found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {msg.products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onViewDetails={onViewProduct}
                onOrderNow={onOrderNow}
                onOrderInChat={onOrderInChat}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inline chat order form */}
      {!msg.isLoading && msg.chatOrderProduct && (
        <div className="pl-9">
          <ChatOrderForm
            product={msg.chatOrderProduct}
            onOrderCreated={(result) => onChatOrderCreated(result, msg.id)}
            onDismiss={() => onDismissChatOrder(msg.id)}
          />
        </div>
      )}

      {/* Order confirmation */}
      {!msg.isLoading && msg.orderResult && (
        <div className="pl-9">
          <OrderConfirmationCard result={msg.orderResult} />
        </div>
      )}
    </div>
  );
});

// ─── Isolated input component – has its own state so the message list
//     never re-renders while the user types ──────────────────────────────────
const ChatInput = memo(function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string, isVoice?: boolean) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const hasSpokenRef = useRef(false);

  const unlockSpeechAPI = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const silentUtterance = new SpeechSynthesisUtterance('');
      silentUtterance.volume = 0;
      window.speechSynthesis.speak(silentUtterance);
    }
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isProcessingAudio || isUploadingImage) return;
    unlockSpeechAPI();
    onSend(trimmed, false);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }, [value, disabled, isProcessingAudio, isUploadingImage, onSend, unlockSpeechAPI]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Use webm for chrome/firefox, mp4 for safari
      const mimeType = typeof window !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      // --- Silence Detection ---
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      let silenceStart = Date.now();
      hasSpokenRef.current = false;

      const checkSilence = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
          audioContext.close().catch(() => {});
          return;
        }
        
        analyser.getByteTimeDomainData(dataArray);
        
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        
        // --- Reactivity ---
        // Sound waves scaling based on RMS volume and time
        const voiceScale = rms * 40;
        const bars = document.querySelectorAll('.sound-wave-bar');
        const time = Date.now() / 200;
        bars.forEach((el, i) => {
           const wave = Math.sin(time + i * 0.8) * 0.5 + 0.5; // 0 to 1
           const layerScale = 1 + (voiceScale * (0.5 + wave * 1.5));
           (el as HTMLElement).style.transform = `scaleY(${Math.min(layerScale, 6)})`;
        });
        
        // Typical background noise RMS < 0.01. Speech is > 0.03.
        if (rms > 0.02) {
          hasSpokenRef.current = true;
          silenceStart = Date.now();
        } else {
          // Auto submit after 1.5s of silence (if spoken), or cancel after 6s of complete silence
          if ((hasSpokenRef.current && Date.now() - silenceStart > 1500) || (!hasSpokenRef.current && Date.now() - silenceStart > 6000)) {
             if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                 mediaRecorderRef.current.stop();
                 setIsListening(false);
             }
             audioContext.close().catch(() => {});
             return;
          }
        }
        requestAnimationFrame(checkSilence);
      };
      // ------------------------
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessingAudio(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        // Completely ignore if the user didn't say anything
        if (!hasSpokenRef.current) {
           setIsProcessingAudio(false);
           return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          try {
            const res = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64Audio, mimeType }),
            });
            const data = await res.json();
            if (data.text) {
               setValue(data.text);
               onSend(data.text, true);
               setValue("");
            }
          } catch(e) {
            console.error(e);
            toast.error("Error transcribing audio");
          } finally {
            setIsProcessingAudio(false);
          }
        };
      };

      mediaRecorder.start();
      setIsListening(true);
      checkSilence();
    } catch (err) {
      console.error("Error accessing microphone", err);
      toast.error("Could not access microphone.");
    }
  }, [onSend]);

  const toggleListening = useCallback(() => {
    unlockSpeechAPI();
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isListening, startRecording, stopRecording, unlockSpeechAPI]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingImage(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const mimeType = file.type;
        const base64Data = base64.split(',')[1];
        
        try {
          const response = await fetch('/api/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data, mimeType }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.text) {
              onSend("Find me " + data.text, false);
            }
          } else {
            console.error("Vision API failed:", await response.text());
            toast.error("Sorry, could not process the image.");
          }
        } catch(err) {
          console.error(err);
          toast.error("Error processing image.");
        } finally {
          setIsUploadingImage(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };
    } catch(err) {
      console.error(err);
      setIsUploadingImage(false);
    }
  }, [onSend]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border bg-card overflow-hidden",
        "transition-shadow duration-150",
        "focus-within:ring-3 focus-within:ring-ring/20 focus-within:border-ring",
        (disabled || isProcessingAudio || isUploadingImage) && "opacity-60 pointer-events-none",
      )}
    >
      <style>{`
        .sound-wave-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 60px;
          gap: 6px;
        }
        .sound-wave-bar {
          width: 5px;
          height: 6px;
          border-radius: 4px;
          background: linear-gradient(to top, rgba(68, 42, 115, 0.9), rgba(249, 220, 9, 1));
          transition: transform 0.05s ease-out;
          transform-origin: center;
          box-shadow: 0 0 10px rgba(68, 42, 115, 0.5);
        }
      `}</style>
      
      {(isListening || isProcessingAudio || isUploadingImage) && (
        <div className="absolute top-0 left-0 right-0 bottom-12 z-20 flex flex-col items-center justify-center bg-card/70 backdrop-blur-xl">
           <div className="relative flex items-center justify-center h-20">
             {isListening && (
              <div className="sound-wave-container">
               <div className="sound-wave-bar" />
               <div className="sound-wave-bar" />
               <div className="sound-wave-bar" />
               <div className="sound-wave-bar" />
               <div className="sound-wave-bar" />
               <div className="sound-wave-bar" />
               <div className="sound-wave-bar" />
             </div>
             )}
           </div>
           <p className="mt-3 text-xs font-medium text-foreground/80 tracking-wide animate-pulse">
             {isListening ? "Listening..." : isUploadingImage ? "Analyzing image..." : "Transcribing..."}
           </p>
           {(isProcessingAudio || isUploadingImage) && (
             <Button
               variant="ghost"
               size="sm"
               className="h-6 px-2 mt-1 rounded-full text-[10px] bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20"
               onClick={() => {
                 stopRecording();
                 setIsProcessingAudio(false);
                 setIsUploadingImage(false);
               }}
             >
               <X className="w-3 h-3 mr-1" /> Cancel
             </Button>
           )}
        </div>
      )}
      <textarea
        ref={textareaRef}
        rows={2}
        style={{ minHeight: "52px", maxHeight: "160px" }}
        className={cn("w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed", (isListening || isProcessingAudio || isUploadingImage) && "opacity-0")}
        placeholder={isUploadingImage ? "Analyzing image..." : isProcessingAudio ? "Transcribing..." : "Ask anything — 'Show me cakes', 'Deliver to Kandy?', 'Track VIMP34456'..."}
        value={value}
        disabled={disabled || isProcessingAudio || isUploadingImage}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">
            Enter
          </kbd>{" "}
          to send ·{" "}
          <kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">
            Shift+Enter
          </kbd>{" "}
          for newline
        </p>

        <div className="flex items-center gap-1.5 shrink-0">
          {isProcessingAudio || isUploadingImage ? (
            <span className="flex gap-0.75 items-center mr-2">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1 h-1 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
          ) : (
            <>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-[10px] shrink-0 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                title="Search with an image"
              >
                <ImagePlus className="w-4 h-4" />
              </Button>
              <div className="relative flex items-center justify-center mx-1">
                {isListening && (
                  <>
                    <span className="absolute inset-0 rounded-[10px] bg-linear-to-r from-[#f9dc09] to-[#442a73] blur opacity-50 animate-pulse" />
                    <span className="absolute inset-0 rounded-[10px] bg-linear-to-r from-[#f9dc09] to-[#442a73] animate-ping opacity-20" />
                  </>
                )}
                <Button
                  size="icon"
                  variant={isListening ? "default" : "ghost"}
                  className={cn(
                    "relative z-10 h-8 w-8 rounded-[10px] shrink-0 transition-all duration-300",
                    isListening && "bg-linear-to-br from-[#f9dc09] to-[#442a73] text-white hover:opacity-90 border-0 scale-110 shadow-lg ring-2 ring-white/20",
                  )}
                  onClick={() => {
                    if (isListening) {
                      stopRecording();
                    } else {
                      toggleListening();
                    }
                  }}
                  title={isListening ? "Listening... click to stop and search" : "Speak to search / chat (Auto-detects EN/SI/TA)"}
                  disabled={disabled}
                >
                  {isListening ? (
                    <Mic className="w-4 h-4 animate-bounce" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </>
          )}

          <Button
            size="icon"
            className="h-8 w-8 rounded-[10px] shrink-0"
            disabled={!value.trim() || disabled || isProcessingAudio || isUploadingImage}
            onClick={handleSend}
            aria-label={disabled ? "Sending…" : "Send message"}
          >
            {disabled || isProcessingAudio || isUploadingImage ? (
              <span className="flex gap-0.75 items-center">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1 h-1 rounded-full bg-primary-foreground animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});
// ─── Quick actions – call MCP directly (no Gemini, no API credits) ────────────
const QUICK_ACTIONS = [
  {
    icon: <Cake size={14} />,
    label: "Birthday cakes",
    toolName: "kapruka_search_products",
    params: { q: "birthday cake", limit: 12 },
  },
  {
    icon: <Flower2 size={14} />,
    label: "Flowers",
    toolName: "kapruka_search_products",
    params: { q: "flowers", limit: 12 },
  },
  {
    icon: <Gift size={14} />,
    label: "Chocolates",
    toolName: "kapruka_search_products",
    params: { q: "chocolates", limit: 12 },
  },
  {
    icon: <Tag className="w-3.5 h-3.5" />, // no animated version installed
    label: "Categories",
    toolName: "kapruka_list_categories",
    params: { depth: 2 },
  },
  {
    icon: <MapPinIcon size={14} />,
    label: "Delivery cities",
    toolName: "kapruka_list_delivery_cities",
    params: { limit: 25 },
  },
  {
    icon: <MapPinIcon size={14} />,
    label: "Colombo delivery",
    toolName: "kapruka_check_delivery",
    params: { city: "Colombo 03" },
  },
];

// ─── Speak text helper using Gemini TTS API ────────────────────────────────────
const speakText = async (
  text: string,
  onStart?: () => void,
  onFinish?: () => void
) => {
  if (typeof window === "undefined") return;

  const cleanText = text
    .replace(/\*+/g, "")
    .replace(/_+/g, "")
    .replace(/#[#\s]*[a-zA-Z0-9 ]+/g, "")
    .replace(/-\s+/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/LKR\s*([0-9,]+)/gi, "$1 Rupees")
    .trim();

  if (!cleanText) return;

  if ((window as any).currentAudio) {
    (window as any).currentAudio.pause();
  }

  if (onStart) onStart();

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText }),
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.audio) {
        const audioSrc = `data:${data.mimeType};base64,${data.audio}`;
        const audio = new window.Audio(audioSrc);
        (window as any).currentAudio = audio;
        audio.play().catch(console.error);
        return; // Success!
      }
    }
  } catch (err) {
    console.error("TTS API error:", err);
    toast.error("Could not play audio.");
  } finally {
    if (onFinish) onFinish();
  }
};

// ─── Main page ────────────────────────────────────────────────────────────────
export function ChatShoppingPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Ayubowan & welcome! 👋 Kapruka Buddy here. \nLet's get your Kapruka orders sorted out, no stress. 💯\n\n" +
        "Try asking me:\n" +
        "  • Birthday cakes under LKR 6000 🎂\n" +
        "  • Browse categories 👀\n" +
        "  • Can you deliver to Galle?\n" +
        "  • Track order VIMPXXXXXX 📦\n\n" +
        "Or use the quick-action buttons below to pass the vibe check.",
    },
  ]);
  const [geminiHistory, setGeminiHistory] = useState<GeminiHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  // Details modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Order modal
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesFocusRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isNotAtBottom, setIsNotAtBottom] = useState(false);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesFocusRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [messages]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;

    // Calculate the distance from the bottom
    const distanceFromBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;

    // If the distance is greater than 2px, they are not at the bottom
    if (distanceFromBottom > 50) {
      setIsNotAtBottom(true);
    } else {
      setIsNotAtBottom(false);
    }
  };

  const handleMessagesEnd = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleViewProduct = useCallback((p: Product) => {
    setSelectedProduct(p);
    setDetailsOpen(true);
  }, []);

  const handleOrderNow = useCallback((p: Product) => {
    setOrderProduct(p);
    setOrderModalOpen(true);
  }, []);

  // Called when the dialog's order is created
  const handleOrderCreated = useCallback((result: OrderResult) => {
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        content: `Order created — ref ${result.order_ref}. Complete your payment below.`,
        orderResult: result,
      },
    ]);
  }, []);

  // "Order in Chat" — inserts an inline form card into the conversation
  const handleOrderInChat = useCallback((p: Product) => {
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", content: `I want to order: ${p.name}` },
      {
        id: uid(),
        role: "assistant",
        content:
          "Sure! Fill in the delivery details below and I’ll create an order for you.",
        chatOrderProduct: p,
      },
    ]);
  }, []);

  // Replace the chat order form with a confirmation card once created
  const handleChatOrderCreated = useCallback(
    (result: OrderResult, msgId: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, chatOrderProduct: undefined, orderResult: result }
            : m,
        ),
      );
    },
    [],
  );

  // Dismiss an inline chat order form
  const handleDismissChatOrder = useCallback((msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, chatOrderProduct: undefined } : m,
      ),
    );
  }, []);

  // ── Gemini-powered send (user typed messages) ─────────────────────────────
  const sendToGemini = useCallback(
    async (text: string, isVoice: boolean = false) => {
      if (loading) return;

      const loadingId = uid();
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content: text },
        { id: loadingId, role: "assistant", content: "", isLoading: true },
      ]);
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history: geminiHistory }),
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const { text: replyText, toolResults } = (await res.json()) as {
          text: string;
          toolResults: ToolResult[];
        };

        setGeminiHistory((h) => [
          ...h,
          { role: "user", parts: [{ text }] },
          { role: "model", parts: [{ text: replyText }] },
        ]);

        const searchResult = toolResults.find(
          (r) => r.toolName === "kapruka_search_products",
        );
        const products = searchResult
          ? ((searchResult.data.results ?? []) as Product[])
          : undefined;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: replyText,
                  products,
                  toolResults,
                  isLoading: false,
                }
              : m,
          ),
        );

        if (isVoice) {
          let spokenText = replyText;
          if (!spokenText && toolResults && toolResults.length > 0) {
             const toolName = toolResults[0].toolName;
             if (toolName === "kapruka_search_products") {
                const count = products?.length ?? 0;
                spokenText = count > 0 ? `I found ${count} options for you.` : "I couldn't find any items for that search.";
             } else if (toolName === "kapruka_check_delivery") {
                spokenText = "Here are the delivery details you requested.";
             } else if (toolName === "kapruka_track_order") {
                spokenText = "Here is the latest tracking update for your order.";
             } else {
                spokenText = "Here is the information I found.";
             }
          }
          if (spokenText) {
            speakText(
              spokenText,
              () => setIsGeneratingTTS(true),
              () => setIsGeneratingTTS(false)
            );
          }
        }
      } catch (err) {
        const errorMsg = `Error: ${err instanceof Error ? err.message : "Something went wrong."}`;
        toast.error("Failed to get a response from Gemini.");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: errorMsg,
                  isLoading: false,
                }
              : m,
          ),
        );
        if (isVoice) {
          speakText("Sorry, I encountered an error. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, geminiHistory],
  );

  // ── Direct MCP call for quick actions (no Gemini = no credit usage) ───────
  const runQuickAction = useCallback(
    async (
      label: string,
      toolName: string,
      params: Record<string, unknown>,
    ) => {
      if (loading) return;

      const loadingId = uid();
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content: label },
        { id: loadingId, role: "assistant", content: "", isLoading: true },
      ]);
      setLoading(true);

      try {
        const res = await fetch("/api/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "call-tool",
            toolName,
            args: { params: { ...params, response_format: "json" } },
          }),
        });

        const outer = (await res.json()) as {
          success: boolean;
          error?: string;
          result?: { content?: { type: string; text?: string }[] };
        };

        if (!outer.success) throw new Error(outer.error ?? "MCP error");

        // Extract the JSON text from MCP's content wrapper
        const text =
          outer.result?.content?.find((c) => c.type === "text")?.text ?? "{}";

        let data: Record<string, unknown>;
        try {
          data = JSON.parse(text) as Record<string, unknown>;
        } catch {
          data = {
            _mcpError: true,
            message: text || "No results returned from Kapruka.",
            results: [],
            categories: [],
            cities: [],
          };
        }

        const products =
          toolName === "kapruka_search_products"
            ? ((data.results ?? []) as Product[])
            : undefined;

        const toolResults: ToolResult[] = [{ toolName, data }];

        // ── Generate "Intelligent" Hardcoded Responses ───────
        let replyContent = "";

        if (data._mcpError) {
          replyContent = `I'm sorry, I ran into a small issue: ${data.message as string}. Could you try again or use a different keyword?`;
        } else {
          switch (toolName) {
            case "kapruka_search_products":
              const count = products?.length ?? 0;
              if (count === 0) {
                replyContent = `I couldn't find any items for "${label}". Let's try searching with a different keyword!`;
              } else {
                replyContent = `I found ${count} great option${count !== 1 ? "s" : ""} for "${label}"! Here are the results for you. Click Order or Order in Chat on any card to proceed.`;
              }
              break;

            case "kapruka_track_order":
              replyContent = `Here is the latest tracking update for your order:`;
              break;

            case "kapruka_check_delivery":
              replyContent = `Here are the delivery details you requested:`;
              break;

            case "kapruka_list_categories":
              replyContent = `Here are all our categories! Let me know what catches your eye, and we can start searching.`;
              break;

            default:
              replyContent = `Here is the information for "${label}":`;
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: replyContent,
                  products,
                  toolResults,
                  isLoading: false,
                }
              : m,
          ),
        );
      } catch (err) {
        const errorMsg = `Error: ${err instanceof Error ? err.message : "Something went wrong."}`;
        toast.error("Quick action failed.");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: errorMsg,
                  isLoading: false,
                }
              : m,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Header ── */}
      <header className="border-b shrink-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 motion-preset-shrink ">
            <Image
              src="/animated-logo-buddy.gif"
              alt="Kapruka Buddy"
              height={45}
              width={45}
              unoptimized
            />
            <div>
              <p className="text-md font-bold leading-none">Kapruka Buddy</p>
              <p className="text-xs text-muted-foreground leading-none mt-1">
                powered by Kapruka MCP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="https://github.com/Kawyanethma/shopping-agent-kapruka-mcp"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              <Button size="icon-lg" variant="ghost">
                <GithubIcon />
              </Button>
            </Link>
            <KaprukaBuddyFeaturesDialog />
          </div>
        </div>
      </header>

      {/* ── Scrollable message list ──
          Using a plain overflow-y-auto div instead of the Base-UI ScrollArea
          component, which was intercepting pointer events and blocking button clicks. */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0"
      >
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-5 pb-2">
          {messages.map((msg, index) => (
            <MessageRow
              key={msg.id}
              messagesFocusRef={
                index === messages.length - 2 ? messagesFocusRef : undefined
              }
              msg={msg}
              onViewProduct={handleViewProduct}
              onOrderNow={handleOrderNow}
              onOrderInChat={handleOrderInChat}
              onChatOrderCreated={handleChatOrderCreated}
              onDismissChatOrder={handleDismissChatOrder}
            />
          ))}
          {isGeneratingTTS && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-12 py-2 animate-in fade-in slide-in-from-bottom-2">
               <span className="flex gap-1 items-center">
                 {[0, 150, 300].map((delay) => (
                   <span key={delay} className="w-1.5 h-1.5 rounded-full bg-[#f9dc09] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                 ))}
               </span>
               Synthesizing voice response...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div
        className={`absolute z-10 bottom-45 left-1/2 -translate-x-1/2 transition-all duration-300 ease-in-out ${
          isNotAtBottom
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <Button
          size="icon-lg"
          onClick={handleMessagesEnd}
        >
          <ArrowDown className="motion-preset-oscillate motion-duration-1500" />
        </Button>
      </div>
      {/* ── Bottom panel ── */}
      <div className="shrink-0 bg-background relative">
        <div className="max-w-4xl mx-auto px-4 pt-3 pb-4 space-y-2">
          {/* Quick actions (MCP direct – no Gemini credits) */}
          <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-width-none [&::-webkit-scrollbar]:hidden">
            {QUICK_ACTIONS.map(({ icon, label, toolName, params }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                disabled={loading}
                onClick={() => runQuickAction(label, toolName, params)}
              >
                {icon}
                {label}
              </Button>
            ))}
          </div>

          {/* Input (isolated component = no message-list re-renders while typing) */}
          <ChatInput onSend={sendToGemini} disabled={loading} />
        </div>
      </div>

      {/* ── Product details modal ── */}
      <ProductDetailsModal
        product={selectedProduct}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onOrderNow={(prod) => {
          setDetailsOpen(false);
          handleOrderNow(prod);
        }}
        onOrderInChat={(prod) => {
          setDetailsOpen(false);
          handleOrderInChat(prod);
        }}
      />

      {/* ── Order dialog ── */}
      <OrderFormDialog
        product={orderProduct}
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
}

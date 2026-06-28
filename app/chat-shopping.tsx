"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard, type Product } from "@/components/ProductCard";
import { ProductDetailsModal } from "@/components/ProductDetailsModal";
import { ThemeToggle } from "@/components/theme-toggle";
// lucide-react — icons without animated versions
import {
  Package,
  Tag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
} from "lucide-react";
// lucide-animated icons
import { BotIcon } from "@/components/ui/bot";
import { SearchIcon } from "@/components/ui/search";
import { ZapIcon } from "@/components/ui/zap";
import { TruckIcon } from "@/components/ui/truck";
import { MapPinIcon } from "@/components/ui/map-pin";
import { ClockIcon } from "@/components/ui/clock";
import { LoaderCircleIcon } from "@/components/ui/loader-circle";
import { OrderFormDialog } from "@/components/order/OrderFormDialog";
import { ChatOrderForm } from "@/components/order/ChatOrderForm";
import { OrderConfirmationCard } from "@/components/order/OrderConfirmationCard";
import type { OrderResult } from "@/components/order/types";
import { GithubIcon } from "@/components/ui/github";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
}: {
  msg: ChatMessage;
  onViewProduct: (p: Product) => void;
  onOrderNow: (p: Product) => void;
  onOrderInChat: (p: Product) => void;
  onChatOrderCreated: (result: OrderResult, msgId: string) => void;
  onDismissChatOrder: (msgId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Bubble */}
      {(msg.content || msg.isLoading) && (
        <div
          className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "assistant" && (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <BotIcon size={14} className="text-primary" />
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
                Thinking…
              </span>
            ) : (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            )}
          </div>
        </div>
      )}

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
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }, [value, disabled, onSend]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card",
        "transition-shadow duration-150",
        "focus-within:ring-3 focus-within:ring-ring/20 focus-within:border-ring",
        disabled && "opacity-60 pointer-events-none",
      )}
    >
      <textarea
        ref={textareaRef}
        rows={2}
        style={{ minHeight: "52px", maxHeight: "160px" }}
        className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        placeholder="Ask anything — 'Show me cakes', 'Deliver to Kandy?', 'Track VIMP34456'..."
        value={value}
        disabled={disabled}
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

        <Button
          size="icon"
          className="h-8 w-8 rounded-[10px] shrink-0"
          disabled={!value.trim() || disabled}
          onClick={handleSend}
          aria-label={disabled ? "Sending…" : "Send message"}
        >
          {disabled ? (
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
  );
});
// ─── Quick actions – call MCP directly (no Gemini, no API credits) ────────────
const QUICK_ACTIONS = [
  {
    icon: <SearchIcon size={14} />,
    label: "Birthday cakes",
    toolName: "kapruka_search_products",
    params: { q: "birthday cake", limit: 12 },
  },
  {
    icon: <SearchIcon size={14} />,
    label: "Flowers",
    toolName: "kapruka_search_products",
    params: { q: "flowers", limit: 12 },
  },
  {
    icon: <SearchIcon size={14} />,
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

// ─── Main page ────────────────────────────────────────────────────────────────
export function ChatShoppingPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm K-Shopping Agent, powered by Kapruka MCP.\n\n" +
        "Try asking:\n" +
        "  Show me birthday cakes under LKR 6000\n" +
        "  What categories do you have?\n" +
        "  Can you deliver to Galle?\n" +
        "  Track order VIMP34456CB2\n\n" +
        "Or use the quick-action buttons below.",
    },
  ]);
  const [geminiHistory, setGeminiHistory] = useState<GeminiHistory[]>([]);
  const [loading, setLoading] = useState(false);
  // Details modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Order modal
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    async (text: string) => {
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
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: `Error: ${err instanceof Error ? err.message : "Something went wrong."}`,
                  isLoading: false,
                }
              : m,
          ),
        );
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

        const replyContent =
          data._mcpError
            ? (data.message as string)
            : toolName === "kapruka_search_products"
            ? `${products?.length ?? 0} result${(products?.length ?? 0) !== 1 ? "s" : ""} for "${label}":`
            : `Information for "${label}":`;

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
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: `Error: ${err instanceof Error ? err.message : "Something went wrong."}`,
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
          <div className="flex items-center gap-2">
            <ZapIcon size={20} className="text-primary" />
            <div>
              <p className="text-sm font-bold leading-none">K-Shopping Agent</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                powered by Kapruka MCP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="https://github.com/Kawyanethma/shopping-agent-kapruka-mcp"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              <Button variant="ghost">
                <GithubIcon />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Scrollable message list ──
          Using a plain overflow-y-auto div instead of the Base-UI ScrollArea
          component, which was intercepting pointer events and blocking button clicks. */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-5 pb-2">
          {messages.map((msg) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              onViewProduct={handleViewProduct}
              onOrderNow={handleOrderNow}
              onOrderInChat={handleOrderInChat}
              onChatOrderCreated={handleChatOrderCreated}
              onDismissChatOrder={handleDismissChatOrder}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Bottom panel ── */}
      <div className="shrink-0 bg-background">
        <div className="max-w-4xl mx-auto px-4 pt-3 pb-4 space-y-2">
          {/* Quick actions (MCP direct – no Gemini credits) */}
          <div className="flex flex-wrap gap-1.5">
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

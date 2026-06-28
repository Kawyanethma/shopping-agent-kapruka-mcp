"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShoppingBag, AlertCircle, Truck, User, MapPin, Gift } from "lucide-react";
import type { Product } from "./ProductCard";

export type OrderResult = {
  checkout_url: string;
  order_ref: string;
  summary: {
    items_total: number;
    delivery_fee: number;
    addons_total: number;
    grand_total: number;
    currency: string;
  };
  expires_at: string;
};

type Props = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: (result: OrderResult) => void;
};

function todayLK() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
}

function tomorrowLK() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
}

const SECTION = "text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3";

export function OrderModal({ product, open, onOpenChange, onOrderCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Form fields ──────────────────────────────────────────────────────────
  const [quantity, setQuantity] = useState(1);
  const [icingText, setIcingText] = useState("");
  const [giftMessage, setGiftMessage] = useState("");

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [locationType, setLocationType] = useState("house");
  const [deliveryDate, setDeliveryDate] = useState(tomorrowLK);
  const [instructions, setInstructions] = useState("");

  const [senderName, setSenderName] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const isCake = Boolean(
    product?.id.match(/^cake/i) || product?.category.slug.includes("cake"),
  );

  const resetForm = () => {
    setQuantity(1);
    setIcingText("");
    setGiftMessage("");
    setRecipientName("");
    setRecipientPhone("");
    setAddress("");
    setCity("");
    setLocationType("house");
    setDeliveryDate(tomorrowLK());
    setInstructions("");
    setSenderName("");
    setAnonymous(false);
    setError(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!product) return;

    // Basic validation
    if (!recipientName.trim()) return setError("Recipient name is required.");
    if (!recipientPhone.trim()) return setError("Recipient phone is required.");
    if (!address.trim()) return setError("Delivery address is required.");
    if (!city.trim()) return setError("Delivery city is required.");
    if (!deliveryDate) return setError("Delivery date is required.");
    if (!senderName.trim()) return setError("Your name (sender) is required.");

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "call-tool",
          toolName: "kapruka_create_order",
          args: {
            params: {
              cart: [
                {
                  product_id: product.id,
                  quantity,
                  ...(isCake && icingText ? { icing_text: icingText } : {}),
                },
              ],
              recipient: { name: recipientName.trim(), phone: recipientPhone.trim() },
              delivery: {
                address: address.trim(),
                city: city.trim(),
                location_type: locationType,
                date: deliveryDate,
                instructions: instructions.trim() || null,
              },
              sender: { name: senderName.trim(), anonymous },
              gift_message: giftMessage.trim() || null,
              response_format: "json",
            },
          },
        }),
      });

      const outer = (await res.json()) as {
        success: boolean;
        error?: string;
        result?: { content?: { type: string; text?: string }[] };
      };

      if (!outer.success) throw new Error(outer.error ?? "Order creation failed");

      const text =
        outer.result?.content?.find((c) => c.type === "text")?.text ?? "{}";
      const data = JSON.parse(text) as OrderResult & { error?: string };

      if (data.error) throw new Error(data.error);
      if (!data.checkout_url) throw new Error("No checkout URL returned");

      onOrderCreated(data);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order creation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Place Order</DialogTitle>
          <DialogDescription>
            Fill in delivery details to create a checkout link
          </DialogDescription>
        </DialogHeader>

        {/* ── Product summary ── */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-14 h-14 object-cover rounded shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm line-clamp-2">{product.name}</p>
            <p className="text-primary font-bold text-sm mt-0.5">
              {product.price.currency} {product.price.amount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* ── Order details ── */}
          <div>
            <p className={SECTION}>
              <Gift className="w-3.5 h-3.5" /> Order details
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label className="w-20 shrink-0">Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-24"
                />
              </div>

              {isCake && (
                <div className="space-y-1.5">
                  <Label>
                    Cake icing text{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional, max 120 chars)
                    </span>
                  </Label>
                  <Input
                    placeholder="e.g. Happy Birthday John!"
                    maxLength={120}
                    value={icingText}
                    onChange={(e) => setIcingText(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>
                  Gift message{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional, max 300 chars)
                  </span>
                </Label>
                <Textarea
                  placeholder="A personal message to include with this order…"
                  maxLength={300}
                  rows={2}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Recipient ── */}
          <div>
            <p className={SECTION}>
              <User className="w-3.5 h-3.5" /> Recipient
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full name *</Label>
                <Input
                  placeholder="Who is receiving this order?"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone number *</Label>
                <Input
                  placeholder="077 123 4567 or +94771234567"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Delivery ── */}
          <div>
            <p className={SECTION}>
              <Truck className="w-3.5 h-3.5" /> Delivery
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Street address *</Label>
                <Input
                  placeholder="123 Main Street, Area"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>City *</Label>
                  <Input
                    placeholder="e.g. Colombo 03"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Location type</Label>
                  <Select value={locationType} onValueChange={(v) => setLocationType(v ?? "house")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Delivery date *</Label>
                <Input
                  type="date"
                  min={todayLK()}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Delivery instructions{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  placeholder="e.g. Call before arriving"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Sender ── */}
          <div>
            <p className={SECTION}>
              <MapPin className="w-3.5 h-3.5" /> From (sender)
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Your name *</Label>
                <Input
                  placeholder="Sender's name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="anon"
                  checked={anonymous}
                  onCheckedChange={(v) => setAnonymous(v === true)}
                />
                <Label htmlFor="anon" className="font-normal cursor-pointer text-sm">
                  Send anonymously — gift card will show &quot;Anonymous&quot;
                </Label>
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" /> Create Order
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

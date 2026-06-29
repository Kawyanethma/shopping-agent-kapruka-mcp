"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ShoppingBag,
  AlertCircle,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  OrderDetailsFields,
  RecipientFields,
  DeliveryFields,
  SenderFields,
} from "./OrderFields";
import {
  validateOrderForm,
  submitOrder,
  tomorrowLK,
  stepValidation,
  type OrderFormData,
  type OrderResult,
} from "./types";
import type { Product } from "@/components/ProductCard";

type Props = {
  product: Product;
  onOrderCreated: (result: OrderResult) => void;
  onDismiss: () => void;
};

const DEFAULT = (): OrderFormData => ({
  quantity: 1,
  icingText: "",
  giftMessage: "",
  recipientName: "",
  recipientPhone: "",
  address: "",
  city: "",
  locationType: "house",
  deliveryDate: tomorrowLK(),
  instructions: "",
  senderName: "",
  anonymous: false,
});

const STEPS = ["Details", "Recipient", "Delivery", "Sender"];



/**
 * An inline order form that renders as a chat message card.
 * Triggered when the user clicks "Order in Chat" on a product card.
 */
export function ChatOrderForm({ product, onOrderCreated, onDismiss }: Props) {
  const [formData, setFormData] = useState<OrderFormData>(DEFAULT);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCake = Boolean(
    product.id.match(/^cake/i) || product.category.slug.includes("cake"),
  );

  const handleChange = useCallback(
    <K extends keyof OrderFormData>(key: K, value: OrderFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setError(null);
    },
    [],
  );

  const handleNext = () => {
    const err = stepValidation(step, formData);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step < 4) setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
  };

  const handleSubmit = async () => {
    const validationError = validateOrderForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await submitOrder(product.id, formData, isCake);
      onOrderCreated(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Order creation failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Card className="border shadow-md overflow-hidden">
      {/* ── Product bar ── */}
      <div className="flex items-center gap-3 px-4 -mt-5 p-4 border-b bg-muted/30">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-14 h-14 object-cover rounded-lg shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold line-clamp-1 leading-tight">
            {product.name}
          </p>
          <p className="text-sm text-primary font-bold mt-0.5">
            {product.price.currency} {product.price.amount.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="View on Kapruka.com"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* ── Step progress ── */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex justify-between mb-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`text-[10px] font-semibold transition-colors ${
                i + 1 === step
                  ? "text-primary"
                  : i + 1 < step
                    ? "text-muted-foreground"
                    : "text-muted-foreground/40"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-1.5">
          Step {step} of {STEPS.length}
        </p>
      </div>

      <CardContent className="px-4 pt-3 pb-4 space-y-4">
        {step === 1 && (
          <OrderDetailsFields
            data={formData}
            onChange={handleChange}
            isCake={isCake}
          />
        )}
        {step === 2 && (
          <RecipientFields data={formData} onChange={handleChange} />
        )}
        {step === 3 && (
          <DeliveryFields data={formData} onChange={handleChange} />
        )}
        {step === 4 && <SenderFields data={formData} onChange={handleChange} />}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <Separator />

        <div className="flex gap-2 -mb-4">
          {step > 1 ? (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 gap-1"
              onClick={handleBack}
              disabled={loading}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
          ) : (
            <Button
              variant="outline"
              size='lg'
              className="flex-1"
              onClick={onDismiss}
              disabled={loading}
            >
              Cancel
            </Button>
          )}

          {step < 4 ? (
            <Button size="lg" className="flex-1 gap-1" onClick={handleNext}>
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="flex-1 gap-1.5"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" /> Create Order
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

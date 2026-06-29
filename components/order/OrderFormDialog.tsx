"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ShoppingBag,
  AlertCircle,
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
  type OrderFormData,
  type OrderResult,
} from "./types";
import type { Product } from "@/components/ProductCard";

type Props = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: (result: OrderResult) => void;
};

const DEFAULT_FORM = (): OrderFormData => ({
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

const STEPS = [
  { label: "Details", shortLabel: "Details" },
  { label: "Recipient", shortLabel: "Recipient" },
  { label: "Delivery", shortLabel: "Delivery" },
  { label: "Sender", shortLabel: "Sender" },
];

function stepValidation(step: number, data: OrderFormData): string | null {
  if (step === 2) {
    if (!data.recipientName.trim()) return "Recipient name is required.";
    if (!data.recipientPhone.trim()) return "Recipient phone is required.";
  }
  if (step === 3) {
    if (!data.address.trim()) return "Delivery address is required.";
    if (!data.city.trim()) return "Delivery city is required.";
    if (!data.deliveryDate) return "Delivery date is required.";
  }
  if (step === 4) {
    if (!data.senderName.trim()) return "Your name (sender) is required.";
  }
  return null;
}

export function OrderFormDialog({
  product,
  open,
  onOpenChange,
  onOrderCreated,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<OrderFormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCake = Boolean(
    product?.id.match(/^cake/i) || product?.category.slug.includes("cake"),
  );

  const handleChange = useCallback(
    <K extends keyof OrderFormData>(key: K, value: OrderFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setError(null);
    },
    [],
  );

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      setStep(1);
      setFormData(DEFAULT_FORM());
      setError(null);
    }, 200);
  };

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
    const err = validateOrderForm(formData);
    if (err) {
      setError(err);
      return;
    }
    if (!product) return;

    setError(null);
    setLoading(true);
    try {
      const result = await submitOrder(product.id, formData, isCake);
      onOrderCreated(result);
      handleClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Order creation failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden flex flex-col max-h-[92vh]">
        {/* ── Sticky header ── */}
        <div className="shrink-0 border-b">
          {/* Product preview */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-18 h-18 object-cover rounded-xl shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-muted shrink-0" />
            )}
            <div className="min-w-0">
              <DialogHeader className="space-y-0">
                <DialogTitle className="text-base leading-snug line-clamp-2 w-[95%]">
                  {product.name}
                </DialogTitle>
                <DialogDescription className="text-primary font-bold text-md mt-0.5">
                  {product.price.currency}{" "}
                  {product.price.amount.toLocaleString()}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Step indicator */}
          <div className="px-5 pb-4">
            {/* Labels */}
            <div className="flex justify-between mb-2">
              {STEPS.map((s, i) => (
                <span
                  key={s.label}
                  className={`text-[11px] font-semibold transition-colors ${
                    i + 1 === step
                      ? "text-primary"
                      : i + 1 < step
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {s.shortLabel}
                </span>
              ))}
            </div>

            {/* Progress bar */}
            <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step dots */}
            <div className="flex justify-between mt-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i + 1 <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Scrollable fields ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
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
          {step === 4 && (
            <SenderFields data={formData} onChange={handleChange} />
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* ── Sticky footer ── */}
        <div className="shrink-0 border-t px-5 py-4 space-y-3">
          {/* Step counter */}
          <p className="text-center text-xs text-muted-foreground">
            Step {step} of {STEPS.length} — {STEPS[step - 1].label}
          </p>

          <Separator />

          <div className="flex gap-2">
            {step > 1 ? (
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={handleBack}
                disabled={loading}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
            )}

            {step < 4 ? (
              <Button className="flex-1 gap-1.5" onClick={handleNext}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

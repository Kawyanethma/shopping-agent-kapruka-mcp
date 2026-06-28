"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, ExternalLink, Truck, Receipt } from "lucide-react";
import type { OrderResult } from "./types";

export const OrderConfirmationCard = memo(function OrderConfirmationCard({
  result,
}: {
  result: OrderResult;
}) {
  const expires = result.expires_at
    ? new Date(result.expires_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      {/* Green header bar */}
      <div className="bg-primary px-4 py-3 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-primary-foreground shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm text-primary-foreground">Order Created</p>
          <p className="text-[11px] text-primary-foreground/70">Ref: {result.order_ref}</p>
        </div>
      </div>

      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Price breakdown */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" /> Items
            </span>
            <span>
              {result.summary.currency}{" "}
              {result.summary.items_total.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Delivery
            </span>
            <span>
              {result.summary.currency}{" "}
              {result.summary.delivery_fee.toLocaleString()}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-primary">
              {result.summary.currency}{" "}
              {result.summary.grand_total.toLocaleString()}
            </span>
          </div>
        </div>

        {expires && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Payment link expires at {expires}
          </p>
        )}

        <a
          href={result.checkout_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ExternalLink className="w-4 h-4" /> Complete Payment on Kapruka
        </a>
      </CardContent>
    </Card>
  );
});

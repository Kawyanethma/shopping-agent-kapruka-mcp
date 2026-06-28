"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBag,
  Truck,
  Package,
  ExternalLink,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import type { Product } from "./ProductCard";

type ProductDetailsModalProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderNow?: (product: Product) => void;
  onOrderInChat?: (product: Product) => void;
};

export function ProductDetailsModal({
  product,
  open,
  onOpenChange,
  onOrderNow,
  onOrderInChat,
}: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-xl leading-snug">
              {product.name}
            </DialogTitle>
            <DialogDescription>{product.category.name}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Image */}
          <div className="w-full bg-muted rounded-xl overflow-hidden aspect-[16/9]">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No image available
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.summary}
          </p>

          <Separator />

          {/* Price */}
          <div className="flex items-end gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Price</p>
              <p className="text-3xl font-bold text-primary">
                {product.price.currency}{" "}
                {product.price.amount.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            {product.compare_at_price && (
              <p className="text-sm text-muted-foreground line-through mb-1">
                {product.compare_at_price.amount.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </p>
            )}
          </div>

          <Separator />

          {/* Stock + shipping */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Stock
              </p>
              <Badge
                variant="outline"
                className={
                  product.in_stock
                    ? "bg-green-50 text-green-700 border-green-200 gap-1"
                    : "bg-red-50 text-red-700 border-red-200"
                }
              >
                {product.in_stock && <CheckCircle2 className="w-3 h-3" />}
                {product.in_stock ? "In Stock" : "Out of Stock"}
              </Badge>
              <p className="text-xs text-muted-foreground capitalize">
                {product.stock_level} stock level
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Shipping
              </p>
              {product.ships_internationally ? (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 border gap-1">
                  <Truck className="w-3 h-3" /> Ships Worldwide
                </Badge>
              ) : (
                <Badge variant="outline">Local Delivery Only</Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Package className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Reliable Packaging</p>
                <p className="text-xs text-muted-foreground">
                  Items are carefully packaged to arrive in perfect condition
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Fast Delivery</p>
                <p className="text-xs text-muted-foreground">
                  Quick and reliable delivery across Sri Lanka
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t px-6 py-4 flex-row gap-2">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ExternalLink className="w-4 h-4" /> View on Site
          </a>

          <div className="flex-1" />

          <Button
            variant="outline"
            disabled={!product.in_stock}
            className="gap-1.5"
            onClick={() => {
              onOpenChange(false);
              onOrderInChat?.(product);
            }}
          >
            <MessageSquare className="w-4 h-4" /> Order in Chat
          </Button>

          <Button
            disabled={!product.in_stock}
            className="gap-1.5"
            onClick={() => {
              onOpenChange(false);
              onOrderNow?.(product);
            }}
          >
            <ShoppingBag className="w-4 h-4" /> Order Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

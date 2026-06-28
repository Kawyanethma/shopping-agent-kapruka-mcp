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
import { ShoppingCart, Truck, Package } from "lucide-react";
import type { Product } from "./ProductCard";

type ProductDetailsModalProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart?: (product: Product) => void;
};

export function ProductDetailsModal({
  product,
  open,
  onOpenChange,
  onAddToCart,
}: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          <DialogDescription className="text-base">
            {product.category.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Image */}
          <div className="w-full bg-gray-100 rounded-lg overflow-hidden aspect-video">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>

          {/* Summary and Description */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{product.summary}</p>
          </div>

          <Separator />

          {/* Price Section */}
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Price</div>
                <div className="text-3xl font-bold text-primary">
                  {product.price.currency}{" "}
                  {product.price.amount.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              {product.compare_at_price && (
                <div className="text-sm text-gray-500 line-through mb-1">
                  {product.compare_at_price.amount.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Stock and Availability */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 uppercase">
                Stock Status
              </div>
              <Badge
                variant="outline"
                className={
                  product.in_stock
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }
              >
                {product.in_stock ? "✓ In Stock" : "Out of Stock"}
              </Badge>
              <p className="text-xs text-gray-600 capitalize">
                {product.stock_level} stock
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 uppercase">
                Shipping
              </div>
              {product.ships_internationally ? (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 border">
                  <Truck className="w-3 h-3 mr-1" />
                  Ships Worldwide
                </Badge>
              ) : (
                <Badge variant="outline">Local Delivery Only</Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Additional Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">Reliable Packaging</div>
                <p className="text-xs text-gray-600">
                  All items are carefully packaged to ensure they arrive in
                  perfect condition
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">Fast Delivery</div>
                <p className="text-xs text-gray-600">
                  Quick and reliable delivery to your location
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            disabled={!product.in_stock}
            className="gap-2"
            onClick={() => {
              onAddToCart?.(product);
              onOpenChange(false);
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

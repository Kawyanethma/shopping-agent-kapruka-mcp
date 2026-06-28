"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ShoppingCart as ShoppingCartIcon, Trash2, Plus, Minus } from "lucide-react";
import type { Product } from "./ProductCard";

export type CartItem = {
  product: Product;
  quantity: number;
  icingText?: string;
};

type ShoppingCartProps = {
  items: CartItem[];
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemoveItem?: (productId: string) => void;
  onCheckout?: () => void;
  isLoading?: boolean;
};

export function ShoppingCartComponent({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isLoading = false,
}: ShoppingCartProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price.amount * item.quantity,
    0
  );

  const deliveryFee = items.length > 0 ? 500 : 0; // Example delivery fee
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <Card className="h-full flex flex-col items-center justify-center">
        <CardContent className="pt-12 text-center">
          <ShoppingCartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">Your cart is empty</h3>
          <p className="text-sm text-gray-500">
            Add items from the product list to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShoppingCartIcon className="w-5 h-5" />
          <CardTitle className="text-lg">Shopping Cart</CardTitle>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-3 pr-4">
        {items.map((item) => (
          <div key={item.product.id} className="border rounded-lg p-3 space-y-2">
            {/* Product Info */}
            <div className="flex gap-2">
              {item.product.image_url && (
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-2">{item.product.name}</p>
                <p className="text-xs text-gray-600">
                  {item.product.price.currency}{" "}
                  {item.product.price.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => onUpdateQuantity?.(item.product.id, Math.max(1, item.quantity - 1))}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                min="1"
                max="99"
                value={item.quantity}
                onChange={(e) =>
                  onUpdateQuantity?.(item.product.id, parseInt(e.target.value) || 1)
                }
                className="h-7 w-12 text-center text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => onUpdateQuantity?.(item.product.id, item.quantity + 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 p-2 ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onRemoveItem?.(item.product.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Item Total */}
            <div className="text-right text-sm font-medium">
              {item.product.price.currency}{" "}
              {(item.product.price.amount * item.quantity).toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        ))}
      </CardContent>

      <Separator />

      {/* Pricing Summary */}
      <div className="space-y-2 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span>
            LKR {subtotal.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Delivery</span>
          <span>
            LKR {deliveryFee.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </span>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>LKR {total.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <CardFooter className="pt-3">
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={onCheckout}
          disabled={items.length === 0 || isLoading}
        >
          <ShoppingCartIcon className="w-4 h-4" />
          Proceed to Checkout
        </Button>
      </CardFooter>
    </Card>
  );
}

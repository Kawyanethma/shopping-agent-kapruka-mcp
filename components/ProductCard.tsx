"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EyeIcon } from "@/components/ui/eye";
import { MessageSquareIcon } from "@/components/ui/message-square";
import { ShoppingBag, ExternalLink } from "lucide-react";

export type Product = {
  id: string;
  name: string;
  summary: string;
  price: { amount: number; currency: string };
  compare_at_price?: { amount: number; currency: string } | null;
  in_stock: boolean;
  stock_level: string;
  image_url: string | null;
  category: { id: string; name: string; slug: string };
  ships_internationally: boolean;
  url: string;
  rating?: number | null;
};

type ProductCardProps = {
  product: Product;
  onOrderNow?: (product: Product) => void;
  onOrderInChat?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
};

const stockBadge: Record<string, { label: string; cls: string }> = {
  low: {
    label: "Low Stock",
    cls: "bg-orange-50 text-orange-700 border-orange-200",
  },
  medium: {
    label: "In Stock",
    cls: "bg-green-50  text-green-700  border-green-200",
  },
  high: {
    label: "In Stock",
    cls: "bg-green-50  text-green-700  border-green-200",
  },
};

export function ProductCard({
  product,
  onOrderNow,
  onOrderInChat,
  onViewDetails,
}: ProductCardProps) {
  const discount = product.compare_at_price
    ? Math.round(
        ((product.compare_at_price.amount - product.price.amount) /
          product.compare_at_price.amount) *
          100,
      )
    : null;

  const badge = stockBadge[product.stock_level] ?? {
    label: "Unknown",
    cls: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* ── Image — fixed height so all cards align ── */}
      <div className="relative w-full h-44 shrink-0 overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}

        {/* Discount */}
        {discount && (
          <Badge className="absolute top-2 right-2 bg-destructive hover:bg-destructive text-destructive-foreground text-[10px] px-1.5">
            -{discount}%
          </Badge>
        )}

        {/* View on site shortcut */}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 left-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background transition-colors"
          title="View on Kapruka.com"
        >
          <ExternalLink className="w-3 h-3 text-foreground" />
        </a>
      </div>

      {/* ── Content ── */}
      <CardHeader className="px-3 pt-3 pb-0">
        <CardDescription className="text-[10px] font-semibold text-primary uppercase tracking-wide">
          {product.category.name}
        </CardDescription>
        <CardTitle className="line-clamp-2 text-sm font-semibold leading-snug mt-0.5">
          {product.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-3 pt-2 pb-0 flex-1">
        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-primary">
            {product.price.currency}{" "}
            {product.price.amount.toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}
          </span>
          {product.compare_at_price && (
            <span className="text-xs text-muted-foreground line-through">
              {product.compare_at_price.amount.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 ${badge.cls}`}
          >
            {badge.label}
          </Badge>
          {product.ships_internationally && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 bg-blue-50 text-blue-700 border-blue-200"
            >
              Ships int&apos;l
            </Badge>
          )}
        </div>
      </CardContent>

      {/* ── Actions ── */}
      <CardFooter className="px-3 pt-3 pb-3 flex-col gap-1.5">
        {/* View details */}
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5 text-xs h-8"
          onClick={() => onViewDetails?.(product)}
        >
          <EyeIcon size={14} />
          View Details
        </Button>

        {/* Order options */}
        <div className="flex gap-1.5 w-full">
          <Button
            size="sm"
            className="flex-1 gap-1 text-xs h-8"
            disabled={!product.in_stock}
            onClick={() => onOrderNow?.(product)}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Order
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1 text-xs h-8"
            disabled={!product.in_stock}
            onClick={() => onOrderInChat?.(product)}
          >
            <MessageSquareIcon size={14} />
            In Chat
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

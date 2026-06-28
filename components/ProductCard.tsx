"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart } from "lucide-react";

export type Product = {
  id: string;
  name: string;
  summary: string;
  price: {
    amount: number;
    currency: string;
  };
  compare_at_price?: {
    amount: number;
    currency: string;
  } | null;
  in_stock: boolean;
  stock_level: string;
  image_url: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  ships_internationally: boolean;
  url: string;
  rating?: number | null;
};

type ProductCardProps = {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
};

export function ProductCard({
  product,
  onAddToCart,
  onViewDetails,
}: ProductCardProps) {
  const discount = product.compare_at_price
    ? Math.round(
        ((product.compare_at_price.amount - product.price.amount) /
          product.compare_at_price.amount) *
          100,
      )
    : null;

  const stockColor =
    {
      low: "bg-orange-100 text-orange-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-green-100 text-green-800",
    }[product.stock_level] || "bg-gray-100 text-gray-800";

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative w-full bg-gray-100 aspect-square overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}

        {/* Discount Badge */}
        {discount && (
          <Badge className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white">
            -{discount}%
          </Badge>
        )}

        {/* Stock Badge */}
        <Badge className={`absolute bottom-3 left-3 ${stockColor}`}>
          {product.stock_level === "low" && "Low Stock"}
          {product.stock_level === "medium" && "In Stock"}
          {product.stock_level === "high" && "In Stock"}
        </Badge>

        {/* Wishlist Button */}
        <button className="absolute top-3 left-3 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors">
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <CardHeader className="flex-none pb-3">
        <CardDescription className="text-xs font-medium text-primary mb-1">
          {product.category.name}
        </CardDescription>
        <CardTitle className="line-clamp-2 text-base leading-snug">
          {product.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-none">
        <p className="text-xs text-gray-600 line-clamp-2">{product.summary}</p>

        {/* Price Section */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            {product.price.currency}{" "}
            {product.price.amount.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
          </span>
          {product.compare_at_price && (
            <span className="text-sm text-gray-500 line-through">
              {product.compare_at_price.amount.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </span>
          )}
        </div>

        {/* International Shipping */}
        {product.ships_internationally && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            ✓ Ships Internationally
          </div>
        )}
      </CardContent>

      {/* Footer Actions */}
      <CardFooter className="flex-none gap-2 mt-auto pt-3">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => onViewDetails?.(product)}
        >
          View Details
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-1"
          disabled={!product.in_stock}
          onClick={() => onAddToCart?.(product)}
        >
          <ShoppingCart className="w-3 h-3" />
          {product.in_stock ? "Add" : "Out of Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
}

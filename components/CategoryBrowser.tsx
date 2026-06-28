"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Grid3x3, Menu } from "lucide-react";
import { useState } from "react";

export type CategoryNode = {
  name: string;
  url: string;
  children?: CategoryNode[];
};

type CategoryBrowserProps = {
  categories: CategoryNode[];
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
  isLoading?: boolean;
};

export function CategoryBrowser({
  categories,
  selectedCategory,
  onSelectCategory,
  isLoading = false,
}: CategoryBrowserProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (name: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpanded(newExpanded);
  };

  const renderCategory = (category: CategoryNode, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expanded.has(category.name);

    return (
      <div key={category.name}>
        <div className="flex items-center gap-1">
          {hasChildren && (
            <button
              onClick={() => toggleExpand(category.name)}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <Menu className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          )}
          <Button
            variant={selectedCategory === category.name ? "default" : "ghost"}
            className="justify-start w-full"
            onClick={() => onSelectCategory(category.name)}
            disabled={isLoading}
          >
            <span className="truncate text-sm">{category.name}</span>
          </Button>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-2">
        <Grid3x3 className="w-5 h-5" />
        <h3 className="font-semibold text-sm">Categories</h3>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-1">
          <Button
            variant={selectedCategory === null ? "default" : "ghost"}
            className="justify-start w-full"
            onClick={() => onSelectCategory("")}
            disabled={isLoading}
          >
            All Products
          </Button>

          {categories.map((category) => renderCategory(category))}
        </div>
      </ScrollArea>
    </div>
  );
}

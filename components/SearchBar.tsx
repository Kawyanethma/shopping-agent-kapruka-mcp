"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { useState } from "react";

type SearchBarProps = {
  onSearch: (query: string, category?: string, sort?: string) => void;
  onClearFilters?: () => void;
  isLoading?: boolean;
  categories?: string[];
};

export function SearchBar({
  onSearch,
  onClearFilters,
  isLoading = false,
  categories = [],
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("relevance");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, category || undefined, sort);
    }
  };

  const handleClear = () => {
    setQuery("");
    setCategory("");
    setSort("relevance");
    onClearFilters?.();
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search for cakes, flowers, gifts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex gap-2 flex-wrap">
        {/* Category Filter */}
        <Select
          value={category}
          onValueChange={(v) => setCategory(v ?? "")}
          disabled={isLoading}
        >
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Filter */}
        <Select
          value={sort}
          onValueChange={(v) => setSort(v ?? "relevance")}
          disabled={isLoading}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="bestseller">Best Sellers</SelectItem>
          </SelectContent>
        </Select>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={isLoading || (!query && !category)}
          >
            Clear
          </Button>
          <Button type="submit" disabled={isLoading || !query.trim()}>
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>
    </form>
  );
}

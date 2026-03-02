import { useQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import ProductCard, { ProductCardSkeleton } from "@/components/product-card";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product, Category } from "@shared/schema";
import { useState } from "react";
import { Search, Package } from "lucide-react";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);

  const [keyword, setKeyword] = useState(params.get("q") || "");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") || "");
  const [page, setPage] = useState(parseInt(params.get("page") || "1"));

  const queryStr = new URLSearchParams();
  if (keyword) queryStr.set("q", keyword);
  if (minPrice) queryStr.set("minPrice", minPrice);
  if (maxPrice) queryStr.set("maxPrice", maxPrice);
  queryStr.set("page", String(page));
  queryStr.set("limit", "24");

  const { data: category } = useQuery<Category>({
    queryKey: ["/api/categories", slug],
  });

  const { data, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/categories", slug, "products", `?${queryStr.toString()}`],
  });

  const totalPages = data ? Math.ceil(data.total / 24) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1" data-testid="text-category-heading">
          {category?.name || slug}
        </h1>
        {data && (
          <p className="text-sm text-muted-foreground mb-6" data-testid="text-category-count">
            {data.total} items
          </p>
        )}

        <div className="flex items-end gap-3 mb-6 flex-wrap">
          <div className="space-y-1.5">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-category-search"
                placeholder="Search in category..."
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Min Price</Label>
            <Input
              data-testid="input-category-min-price"
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
              className="w-28"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max Price</Label>
            <Input
              data-testid="input-category-max-price"
              type="number"
              placeholder="Any"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
              className="w-28"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : data?.products?.length ? (
            data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No products in this category yet</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-4">Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">
              Next
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

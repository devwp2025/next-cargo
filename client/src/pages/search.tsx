import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import ProductCard, { ProductCardSkeleton } from "@/components/product-card";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Product, Category } from "@shared/schema";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";

export default function SearchPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const [, navigate] = useLocation();

  const [keyword, setKeyword] = useState(params.get("q") || "");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") || "");
  const [categoryId, setCategoryId] = useState(params.get("categoryId") || "");
  const [page, setPage] = useState(parseInt(params.get("page") || "1"));
  const [showFilters, setShowFilters] = useState(false);

  const queryStr = new URLSearchParams();
  if (keyword) queryStr.set("q", keyword);
  if (minPrice) queryStr.set("minPrice", minPrice);
  if (maxPrice) queryStr.set("maxPrice", maxPrice);
  if (categoryId) queryStr.set("categoryId", categoryId);
  queryStr.set("page", String(page));
  queryStr.set("limit", "24");

  const { data, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products/search", `?${queryStr.toString()}`],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleApply = () => {
    setPage(1);
  };

  const clearFilters = () => {
    setKeyword("");
    setMinPrice("");
    setMaxPrice("");
    setCategoryId("");
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / 24) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-search-heading">
              {keyword ? `ผลลัพธ์สำหรับ "${keyword}"` : "สินค้าทั้งหมด"}
            </h1>
            {data && (
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-search-count">
                พบ {data.total} รายการ
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            ตัวกรอง
          </Button>
        </div>

        {showFilters && (
          <div className="bg-card border rounded-md p-4 mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">คำค้นหา</Label>
                <Input
                  data-testid="input-filter-keyword"
                  placeholder="ค้นหา..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">หมวดหมู่</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger data-testid="select-filter-category">
                    <SelectValue placeholder="ทุกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                    {categories?.filter(c => c.isActive).map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ราคาต่ำสุด</Label>
                <Input
                  data-testid="input-filter-min-price"
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ราคาสูงสุด</Label>
                <Input
                  data-testid="input-filter-max-price"
                  type="number"
                  placeholder="ไม่จำกัด"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" onClick={handleApply} data-testid="button-apply-filters">ใช้ตัวกรอง</Button>
              <Button size="sm" variant="ghost" onClick={clearFilters} data-testid="button-clear-filters">
                <X className="w-4 h-4 mr-1" /> ล้าง
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : data?.products?.length ? (
            data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <SearchIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">ไม่พบสินค้าตามเงื่อนไขที่เลือก</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              data-testid="button-prev-page"
            >
              ก่อนหน้า
            </Button>
            <span className="text-sm text-muted-foreground px-4" data-testid="text-page-info">
              หน้า {page} จาก {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              data-testid="button-next-page"
            >
              ถัดไป
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

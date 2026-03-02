import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@shared/schema";
import { Package } from "lucide-react";

function formatPrice(price: number) {
  return `฿${price.toLocaleString()}`;
}

const conditionThai: Record<string, string> = {
  "new": "ใหม่",
  "like-new": "เหมือนใหม่",
  "excellent": "ดีเยี่ยม",
  "good": "ดี",
  "fair": "พอใช้",
};

const conditionColors: Record<string, string> = {
  "new": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "like-new": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "excellent": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "good": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "fair": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export default function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images?.[0];
  const conditionClass = conditionColors[product.condition] || conditionColors["good"];

  return (
    <Link href={`/product/${product.id}`}>
      <div
        className="group cursor-pointer hover-elevate rounded-md"
        data-testid={`card-product-${product.id}`}
      >
        <div className="aspect-square bg-muted rounded-md mb-3 relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              className="w-full h-full object-cover rounded-md"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-md bg-gradient-to-br from-muted to-secondary">
              <Package className="w-12 h-12 text-muted-foreground/40" />
            </div>
          )}
          {product.status === "reserved" && (
            <div className="absolute inset-0 bg-black/40 rounded-md flex items-center justify-center">
              <span className="text-white font-semibold text-sm px-3 py-1 bg-black/60 rounded-md">จองแล้ว</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium line-clamp-2 leading-tight" data-testid={`text-product-title-${product.id}`}>
            {product.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" data-testid={`text-product-price-${product.id}`}>
              {formatPrice(product.price)}
            </span>
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${conditionClass} border-0`}>
              {conditionThai[product.condition] || product.condition}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-muted rounded-md mb-3" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

export { formatPrice };

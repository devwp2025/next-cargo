import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/components/product-card";
import { MessageCircle, ShoppingBag, Package, ChevronLeft, ChevronRight, User as UserIcon } from "lucide-react";
import type { Product, Category, User } from "@shared/schema";
import { useState } from "react";

const conditionThai: Record<string, string> = {
  "new": "ใหม่",
  "like-new": "เหมือนใหม่",
  "excellent": "ดีเยี่ยม",
  "good": "ดี",
  "fair": "พอใช้",
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentImage, setCurrentImage] = useState(0);

  const { data: product, isLoading } = useQuery<Product & { seller: { id: number; name: string }; category: Category }>({
    queryKey: ["/api/products", id],
  });

  const chatMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chat/start", { productId: product!.id });
      return res.json();
    },
    onSuccess: (data) => {
      navigate(`/chat/${data.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const buyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders", { productId: product!.id });
      return res.json();
    },
    onSuccess: (data) => {
      navigate(`/pay/mock/${data.sessionId}`);
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const handleChat = () => {
    if (!user) { navigate("/login"); return; }
    chatMutation.mutate();
  };

  const handleBuy = () => {
    if (!user) { navigate("/login"); return; }
    buyMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-md" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">ไม่พบสินค้า</h2>
          <p className="text-muted-foreground">สินค้านี้อาจถูกลบหรือขายไปแล้ว</p>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const isSeller = user?.id === product.sellerId;
  const canBuy = product.status === "active" && !isSeller;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-muted rounded-md relative mb-3">
              {images.length > 0 ? (
                <img
                  src={images[currentImage]}
                  alt={product.title}
                  className="w-full h-full object-cover rounded-md"
                  data-testid="img-product-main"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-md bg-gradient-to-br from-muted to-secondary">
                  <Package className="w-20 h-20 text-muted-foreground/30" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-80"
                    onClick={() => setCurrentImage(i => i > 0 ? i - 1 : images.length - 1)}
                    data-testid="button-prev-image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-80"
                    onClick={() => setCurrentImage(i => i < images.length - 1 ? i + 1 : 0)}
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-16 h-16 rounded-md flex-shrink-0 border-2 ${
                      i === currentImage ? "border-foreground" : "border-transparent"
                    }`}
                    data-testid={`button-thumbnail-${i}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover rounded-md" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              {product.category && (
                <Badge variant="secondary" className="mb-2" data-testid="badge-category">
                  {product.category.name}
                </Badge>
              )}
              <h1 className="text-2xl font-bold mb-2" data-testid="text-product-title">{product.title}</h1>
              <p className="text-3xl font-bold" data-testid="text-product-price">{formatPrice(product.price)}</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" data-testid="badge-condition">
                สภาพ: {conditionThai[product.condition] || product.condition}
              </Badge>
              <Badge
                variant={product.status === "active" ? "default" : "secondary"}
                data-testid="badge-status"
              >
                {product.status === "active" ? "พร้อมขาย" : product.status === "reserved" ? "จอง" : product.status === "sold" ? "ขายแล้ว" : product.status}
              </Badge>
            </div>

            {(product.brand || product.model || product.size || product.color || product.location) && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-2">รายละเอียดเพิ่มเติม</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {product.brand && <div><span className="text-muted-foreground">แบรนด์:</span> {product.brand}</div>}
                  {product.model && <div><span className="text-muted-foreground">รุ่น:</span> {product.model}</div>}
                  {product.size && <div><span className="text-muted-foreground">ไซส์:</span> {product.size}</div>}
                  {product.color && <div><span className="text-muted-foreground">สี:</span> {product.color}</div>}
                  {product.location && <div><span className="text-muted-foreground">สถานที่:</span> {product.location}</div>}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">รายละเอียด</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-description">
                {product.description}
              </p>
            </div>

            {product.seller && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-2">ผู้ขาย</h3>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium" data-testid="text-seller-name">{product.seller.name}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {canBuy && (
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleBuy}
                  disabled={buyMutation.isPending}
                  data-testid="button-buy-now"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  {buyMutation.isPending ? "กำลังดำเนินการ..." : "ซื้อเลย"}
                </Button>
              )}
              {!isSeller && (
                <Button
                  size="lg"
                  variant="secondary"
                  className={canBuy ? "" : "flex-1"}
                  onClick={handleChat}
                  disabled={chatMutation.isPending}
                  data-testid="button-chat-seller"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  แชทกับผู้ขาย
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

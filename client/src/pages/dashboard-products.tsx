import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Package, Loader2 } from "lucide-react";
import type { Product } from "@shared/schema";
import { useEffect, useState } from "react";
import { formatPrice } from "@/components/product-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardProducts() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [pendingStatus, setPendingStatus] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/dashboard/products"],
    enabled: !!user,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/dashboard/products/${id}/status`, { status });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/products"] });
      setPendingStatus(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast({ title: "อัปเดตสถานะสำเร็จ" });
    },
    onError: (err: Error, { id }) => {
      setPendingStatus(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const handleSaveStatus = (id: number) => {
    const status = pendingStatus[id];
    if (status) {
      statusMutation.mutate({ id, status });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-products-heading">สินค้าของฉัน</h1>
            <p className="text-sm text-muted-foreground">{products?.length || 0} รายการ</p>
          </div>
          <Link href="/dashboard/products/new">
            <Button data-testid="button-new-product">
              <Plus className="w-4 h-4 mr-2" /> ลงขายใหม่
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-md animate-pulse" />
            ))}
          </div>
        ) : products?.length ? (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-4 border rounded-md"
                data-testid={`row-product-${product.id}`}
              >
                <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="text-sm font-medium truncate hover:underline cursor-pointer">{product.title}</h3>
                  </Link>
                  <p className="text-sm font-bold">{formatPrice(product.price)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Select
                    value={pendingStatus[product.id] || product.status}
                    onValueChange={(status) => setPendingStatus(prev => ({ ...prev, [product.id]: status }))}
                  >
                    <SelectTrigger className="w-28" data-testid={`select-status-${product.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">พร้อมขาย</SelectItem>
                      <SelectItem value="hidden">ซ่อน</SelectItem>
                      <SelectItem value="sold">ขายแล้ว</SelectItem>
                    </SelectContent>
                  </Select>
                  {pendingStatus[product.id] && pendingStatus[product.id] !== product.status && (
                    <Button
                      size="sm"
                      onClick={() => handleSaveStatus(product.id)}
                      disabled={statusMutation.isPending}
                      data-testid={`button-save-status-${product.id}`}
                    >
                      {statusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "บันทึก"}
                    </Button>
                  )}
                  <Link href={`/dashboard/products/${product.id}/edit`}>
                    <Button size="icon" variant="ghost" data-testid={`button-edit-${product.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">ยังไม่มีสินค้า</p>
            <Link href="/dashboard/products/new">
              <Button data-testid="button-list-first">ลงขายสินค้าแรก</Button>
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

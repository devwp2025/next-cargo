import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";
import { useEffect, useState } from "react";
import { ShoppingBag, Loader2 } from "lucide-react";

const statusFlow: Record<string, string[]> = {
  paid: ["preparing", "canceled"],
  preparing: ["shipped", "canceled"],
  shipped: ["completed"],
};

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  preparing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  canceled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusThai: Record<string, string> = {
  pending_payment: "รอชำระ",
  paid: "ชำระแล้ว",
  preparing: "กำลังจัดเตรียม",
  shipped: "จัดส่งแล้ว",
  completed: "เสร็จสิ้น",
  canceled: "ยกเลิก",
};

export default function DashboardOrders() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [pendingStatus, setPendingStatus] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const { data: orders, isLoading } = useQuery<(Order & { product?: { title: string }; buyer?: { name: string } })[]>({
    queryKey: ["/api/dashboard/orders"],
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/dashboard/orders/${id}/status`, { status });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/orders"] });
      setPendingStatus(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast({ title: "อัปเดตสถานะสำเร็จ" });
    },
    onError: (err: Error, { id }) => {
      setPendingStatus(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const handleSave = (id: number) => {
    const status = pendingStatus[id];
    if (status) {
      updateMutation.mutate({ id, status });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" data-testid="text-seller-orders-heading">รายการขาย</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />
            ))}
          </div>
        ) : orders?.length ? (
          <div className="space-y-3">
            {orders.map((order) => {
              const nextStatuses = statusFlow[order.status] || [];
              return (
                <div key={order.id} className="flex items-center gap-4 p-4 border rounded-md flex-wrap" data-testid={`row-seller-order-${order.id}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">คำสั่งซื้อ #{order.id}</p>
                    {order.product && <p className="text-xs text-muted-foreground truncate">{order.product.title}</p>}
                    {order.buyer && <p className="text-xs text-muted-foreground">ผู้ซื้อ: {order.buyer.name}</p>}
                  </div>
                  <p className="text-sm font-bold">฿{order.amount.toLocaleString()}</p>
                  <Badge variant="secondary" className={`border-0 ${statusColors[order.status] || ""}`}>
                    {statusThai[order.status] || order.status}
                  </Badge>
                  {nextStatuses.length > 0 && (
                    <>
                      <Select
                        value={pendingStatus[order.id] || ""}
                        onValueChange={(status) => setPendingStatus(prev => ({ ...prev, [order.id]: status }))}
                      >
                        <SelectTrigger className="w-32" data-testid={`select-order-status-${order.id}`}>
                          <SelectValue placeholder="อัปเดต" />
                        </SelectTrigger>
                        <SelectContent>
                          {nextStatuses.map(s => (
                            <SelectItem key={s} value={s}>{statusThai[s] || s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {pendingStatus[order.id] && (
                        <Button
                          size="sm"
                          onClick={() => handleSave(order.id)}
                          disabled={updateMutation.isPending}
                          data-testid={`button-save-order-${order.id}`}
                        >
                          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "บันทึก"}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">ยังไม่มีรายการขาย</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

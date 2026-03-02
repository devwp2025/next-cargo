import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@shared/schema";
import { useEffect } from "react";
import { ShoppingBag } from "lucide-react";

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  preparing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  canceled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function BuyerOrders() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const { data: orders, isLoading } = useQuery<(Order & { product?: { title: string; images?: string[] }; seller?: { name: string } })[]>({
    queryKey: ["/api/me/orders"],
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" data-testid="text-buyer-orders-heading">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-md animate-pulse" />
            ))}
          </div>
        ) : orders?.length ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 p-4 border rounded-md flex-wrap" data-testid={`row-buyer-order-${order.id}`}>
                {order.product?.images?.[0] && (
                  <div className="w-14 h-14 rounded-md bg-muted flex-shrink-0">
                    <img src={order.product.images[0]} alt="" className="w-full h-full object-cover rounded-md" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${order.productId}`}>
                    <p className="text-sm font-medium truncate hover:underline cursor-pointer">
                      {order.product?.title || `Order #${order.id}`}
                    </p>
                  </Link>
                  {order.seller && <p className="text-xs text-muted-foreground">Seller: {order.seller.name}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm font-bold">B{order.amount.toLocaleString()}</p>
                <Badge variant="secondary" className={`border-0 ${statusColors[order.status] || ""}`}>
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No orders yet. Start shopping!</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

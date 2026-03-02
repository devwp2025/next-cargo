import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingBag, Plus, ArrowRight, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle, ShieldCheck } from "lucide-react";
import type { Product, Order } from "@shared/schema";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/dashboard/products"],
    enabled: !!user,
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/dashboard/orders"],
    enabled: !!user,
  });

  if (!user) return null;

  const activeProducts = products?.filter(p => p.status === "active").length || 0;
  const soldProducts = products?.filter(p => p.status === "sold").length || 0;
  const pendingOrders = orders?.filter(o => ["paid", "preparing"].includes(o.status)).length || 0;
  const totalRevenue = orders?.filter(o => ["paid", "preparing", "shipped", "completed"].includes(o.status)).reduce((sum, o) => sum + o.amount, 0) || 0;

  const isSeller = user.accountType === "seller";
  const kycBanner = isSeller && user.kycStatus !== "approved";

  const kycMessages: Record<string, { text: string; icon: any; color: string }> = {
    unverified: { text: "ยังไม่ยืนยันตัวตน กรุณายืนยันตัวตนเพื่อเพิ่มความน่าเชื่อถือ", icon: AlertTriangle, color: "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200" },
    pending: { text: "รอตรวจสอบเอกสารยืนยันตัวตน", icon: Clock, color: "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200" },
    rejected: { text: "เอกสารถูกปฏิเสธ กรุณาส่งใหม่อีกครั้ง", icon: XCircle, color: "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200" },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-dashboard-heading">แดชบอร์ด</h1>
            <p className="text-sm text-muted-foreground">ยินดีต้อนรับ, {user.name}</p>
          </div>
          <Link href="/dashboard/products/new">
            <Button data-testid="button-new-product">
              <Plus className="w-4 h-4 mr-2" /> ลงขายสินค้าใหม่
            </Button>
          </Link>
        </div>

        {kycBanner && kycMessages[user.kycStatus] && (
          <div className={`flex items-center gap-3 p-4 rounded-md border mb-6 ${kycMessages[user.kycStatus].color}`} data-testid="banner-kyc">
            {(() => { const IconComp = kycMessages[user.kycStatus].icon; return <IconComp className="w-5 h-5 flex-shrink-0" />; })()}
            <p className="text-sm flex-1">{kycMessages[user.kycStatus].text}</p>
            {(user.kycStatus === "unverified" || user.kycStatus === "rejected") && (
              <Link href="/dashboard/verify">
                <Button size="sm" variant="outline" data-testid="button-verify-now">
                  <ShieldCheck className="w-4 h-4 mr-1" /> ยืนยันตัวตนตอนนี้
                </Button>
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { title: "สินค้าที่ขายอยู่", value: activeProducts, icon: Package },
            { title: "ขายแล้ว", value: soldProducts, icon: TrendingUp },
            { title: "คำสั่งซื้อรอดำเนินการ", value: pendingOrders, icon: ShoppingBag },
            { title: "รายได้", value: `฿${totalRevenue.toLocaleString()}`, icon: DollarSign },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-lg font-bold" data-testid={`text-stat-${i}`}>{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-base">สินค้าของฉัน</CardTitle>
              <Link href="/dashboard/products">
                <Button variant="ghost" size="sm" data-testid="link-view-products">
                  ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {products?.length ? (
                <div className="space-y-3">
                  {products.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center gap-3" data-testid={`row-product-${p.id}`}>
                      <div className="w-10 h-10 rounded-md bg-muted flex-shrink-0">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover rounded-md" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">฿{p.price.toLocaleString()} - {p.status === "active" ? "พร้อมขาย" : p.status === "sold" ? "ขายแล้ว" : p.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">ยังไม่มีสินค้า</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-base">คำสั่งซื้อล่าสุด</CardTitle>
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="sm" data-testid="link-view-orders">
                  ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {orders?.length ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between gap-2" data-testid={`row-order-${o.id}`}>
                      <div>
                        <p className="text-sm font-medium">คำสั่งซื้อ #{o.id}</p>
                        <p className="text-xs text-muted-foreground">฿{o.amount.toLocaleString()}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted">{statusThai(o.status)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">ยังไม่มีคำสั่งซื้อ</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function statusThai(status: string) {
  const map: Record<string, string> = {
    pending_payment: "รอชำระ",
    paid: "ชำระแล้ว",
    preparing: "กำลังจัดเตรียม",
    shipped: "จัดส่งแล้ว",
    completed: "เสร็จสิ้น",
    canceled: "ยกเลิก",
  };
  return map[status] || status;
}

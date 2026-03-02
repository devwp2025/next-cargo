import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link, useRoute } from "wouter";
import Header from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, Order, Category, User } from "@shared/schema";
import { useEffect, useState } from "react";
import { Package, ShoppingBag, Layers, Users, Shield, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

const statusThai: Record<string, string> = {
  pending_payment: "รอชำระ",
  paid: "ชำระแล้ว",
  preparing: "กำลังจัดเตรียม",
  shipped: "จัดส่งแล้ว",
  completed: "เสร็จสิ้น",
  canceled: "ยกเลิก",
};

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  preparing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  canceled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const kycStatusThai: Record<string, string> = {
  unverified: "ยังไม่ยืนยัน",
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ถูกปฏิเสธ",
};

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") navigate("/dashboard");
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-6 h-6" />
          <h1 className="text-2xl font-bold" data-testid="text-admin-heading">แผงควบคุมผู้ดูแล</h1>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products" data-testid="tab-admin-products">
              <Package className="w-4 h-4 mr-2" /> สินค้า
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-admin-orders">
              <ShoppingBag className="w-4 h-4 mr-2" /> คำสั่งซื้อ
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-admin-categories">
              <Layers className="w-4 h-4 mr-2" /> หมวดหมู่
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-admin-users">
              <Users className="w-4 h-4 mr-2" /> ผู้ใช้งาน
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products"><AdminProducts /></TabsContent>
          <TabsContent value="orders"><AdminOrders /></TabsContent>
          <TabsContent value="categories"><AdminCategories /></TabsContent>
          <TabsContent value="users"><AdminUsers /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AdminProducts() {
  const { toast } = useToast();
  const { data: products, isLoading } = useQuery<(Product & { seller?: { name: string } })[]>({
    queryKey: ["/api/admin/products"],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/admin/products/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({ title: "อัปเดตสินค้าสำเร็จ" });
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const productStatusThai: Record<string, string> = {
    active: "พร้อมขาย",
    hidden: "ซ่อน",
    sold: "ขายแล้ว",
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />)
      ) : products?.length ? (
        products.map((p) => (
          <div key={p.id} className="flex items-center gap-4 p-4 border rounded-md flex-wrap" data-testid={`row-admin-product-${p.id}`}>
            <div className="w-12 h-12 rounded-md bg-muted flex-shrink-0">
              {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover rounded-md" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{p.title}</p>
              <p className="text-xs text-muted-foreground">
                ผู้ขาย: {p.seller?.name || "ไม่ทราบ"} | ฿{p.price.toLocaleString()}
              </p>
            </div>
            <Select value={p.status} onValueChange={(status) => statusMutation.mutate({ id: p.id, status })}>
              <SelectTrigger className="w-28" data-testid={`select-admin-product-status-${p.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">พร้อมขาย</SelectItem>
                <SelectItem value="hidden">ซ่อน</SelectItem>
                <SelectItem value="sold">ขายแล้ว</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">ยังไม่มีสินค้า</p>
      )}
    </div>
  );
}

function AdminOrders() {
  const { toast } = useToast();
  const { data: orders, isLoading } = useQuery<(Order & { product?: { title: string }; buyer?: { name: string }; seller?: { name: string } })[]>({
    queryKey: ["/api/admin/orders"],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/admin/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "อัปเดตสถานะสำเร็จ" });
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-3">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />)
      ) : orders?.length ? (
        orders.map((o) => (
          <div key={o.id} className="flex items-center gap-4 p-4 border rounded-md flex-wrap" data-testid={`row-admin-order-${o.id}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">คำสั่งซื้อ #{o.id}</p>
              <p className="text-xs text-muted-foreground">
                {o.product?.title} | ผู้ซื้อ: {o.buyer?.name} | ผู้ขาย: {o.seller?.name}
              </p>
            </div>
            <p className="text-sm font-bold">฿{o.amount.toLocaleString()}</p>
            <Badge variant="secondary" className={`border-0 ${statusColors[o.status] || ""}`}>
              {statusThai[o.status] || o.status}
            </Badge>
            <Select value={o.status} onValueChange={(status) => statusMutation.mutate({ id: o.id, status })}>
              <SelectTrigger className="w-32" data-testid={`select-admin-order-status-${o.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_payment">รอชำระ</SelectItem>
                <SelectItem value="paid">ชำระแล้ว</SelectItem>
                <SelectItem value="preparing">กำลังจัดเตรียม</SelectItem>
                <SelectItem value="shipped">จัดส่งแล้ว</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                <SelectItem value="canceled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">ยังไม่มีคำสั่งซื้อ</p>
      )}
    </div>
  );
}

function AdminCategories() {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/categories", { name: newName, slug: newSlug });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setNewName("");
      setNewSlug("");
      toast({ title: "สร้างหมวดหมู่สำเร็จ" });
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/admin/categories/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "อัปเดตหมวดหมู่สำเร็จ" });
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/admin/categories/${editId}`, { name: editName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditId(null);
      toast({ title: "อัปเดตหมวดหมู่สำเร็จ" });
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">เพิ่มหมวดหมู่</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1.5">
              <Label className="text-xs">ชื่อ (ภาษาไทย)</Label>
              <Input
                data-testid="input-new-category-name"
                placeholder="ชื่อหมวดหมู่"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Slug</Label>
              <Input
                data-testid="input-new-category-slug"
                placeholder="url-slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={!newName || !newSlug} data-testid="button-create-category">
              เพิ่ม
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {categories?.map((cat) => (
          <div key={cat.id} className="flex items-center gap-4 p-4 border rounded-md" data-testid={`row-admin-category-${cat.id}`}>
            {editId === cat.id ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  data-testid={`input-edit-category-${cat.id}`}
                />
                <Button size="sm" onClick={() => editMutation.mutate()} data-testid={`button-save-category-${cat.id}`}>บันทึก</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>ยกเลิก</Button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-sm font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                  data-testid={`button-edit-category-${cat.id}`}
                >
                  แก้ไข
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{cat.isActive ? "ใช้งาน" : "ปิด"}</span>
                  <Switch
                    checked={cat.isActive}
                    onCheckedChange={(isActive) => toggleMutation.mutate({ id: cat.id, isActive })}
                    data-testid={`switch-category-${cat.id}`}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminUsers() {
  const { toast } = useToast();
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const kycMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approve" | "reject" }) => {
      await apiRequest("POST", `/api/admin/users/${id}/kyc`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "อัปเดต KYC สำเร็จ" });
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "อัปเดตบทบาทสำเร็จ" });
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const roleThai: Record<string, string> = {
    user: "ผู้ใช้",
    admin: "ผู้ดูแล",
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />)
      ) : users?.length ? (
        users.map((u) => (
          <div key={u.id} className="flex items-center gap-4 p-4 border rounded-md flex-wrap" data-testid={`row-admin-user-${u.id}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{u.name}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                  {roleThai[u.role] || u.role}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {u.accountType === "seller" ? "ผู้ขาย" : "ผู้ซื้อ"}
                </Badge>
                {u.accountType === "seller" && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      u.kycStatus === "approved"
                        ? "border-green-500 text-green-700 dark:text-green-300"
                        : u.kycStatus === "pending"
                        ? "border-blue-500 text-blue-700 dark:text-blue-300"
                        : u.kycStatus === "rejected"
                        ? "border-red-500 text-red-700 dark:text-red-300"
                        : ""
                    }`}
                  >
                    ยืนยันตัวตน: {kycStatusThai[u.kycStatus] || u.kycStatus}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {u.accountType === "seller" && u.kycStatus === "pending" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-700 border-green-500 hover:bg-green-50"
                    onClick={() => kycMutation.mutate({ id: u.id, action: "approve" })}
                    disabled={kycMutation.isPending}
                    data-testid={`button-approve-kyc-${u.id}`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> อนุมัติ
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700 border-red-500 hover:bg-red-50"
                    onClick={() => kycMutation.mutate({ id: u.id, action: "reject" })}
                    disabled={kycMutation.isPending}
                    data-testid={`button-reject-kyc-${u.id}`}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> ปฏิเสธ
                  </Button>
                </>
              )}
              <Select value={u.role} onValueChange={(role) => roleMutation.mutate({ id: u.id, role })}>
                <SelectTrigger className="w-24" data-testid={`select-user-role-${u.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">ผู้ใช้</SelectItem>
                  <SelectItem value="admin">ผู้ดูแล</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">ยังไม่มีผู้ใช้งาน</p>
      )}
    </div>
  );
}

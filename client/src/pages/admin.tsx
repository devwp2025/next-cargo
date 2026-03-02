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
import { Package, ShoppingBag, Layers, Users, Shield } from "lucide-react";

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
          <h1 className="text-2xl font-bold" data-testid="text-admin-heading">Admin Panel</h1>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products" data-testid="tab-admin-products">
              <Package className="w-4 h-4 mr-2" /> Products
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-admin-orders">
              <ShoppingBag className="w-4 h-4 mr-2" /> Orders
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-admin-categories">
              <Layers className="w-4 h-4 mr-2" /> Categories
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-admin-users">
              <Users className="w-4 h-4 mr-2" /> Users
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
      toast({ title: "Product updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

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
                Seller: {p.seller?.name || "Unknown"} | B{p.price.toLocaleString()}
              </p>
            </div>
            <Select value={p.status} onValueChange={(status) => statusMutation.mutate({ id: p.id, status })}>
              <SelectTrigger className="w-28" data-testid={`select-admin-product-status-${p.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">No products</p>
      )}
    </div>
  );
}

function AdminOrders() {
  const { data: orders, isLoading } = useQuery<(Order & { product?: { title: string }; buyer?: { name: string }; seller?: { name: string } })[]>({
    queryKey: ["/api/admin/orders"],
  });

  const statusColors: Record<string, string> = {
    pending_payment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    paid: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    preparing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    canceled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />)
      ) : orders?.length ? (
        orders.map((o) => (
          <div key={o.id} className="flex items-center gap-4 p-4 border rounded-md flex-wrap" data-testid={`row-admin-order-${o.id}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Order #{o.id}</p>
              <p className="text-xs text-muted-foreground">
                {o.product?.title} | Buyer: {o.buyer?.name} | Seller: {o.seller?.name}
              </p>
            </div>
            <p className="text-sm font-bold">B{o.amount.toLocaleString()}</p>
            <Badge variant="secondary" className={`border-0 ${statusColors[o.status] || ""}`}>
              {o.status}
            </Badge>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">No orders</p>
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
      toast({ title: "Category created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/admin/categories/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
      toast({ title: "Category updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1.5">
              <Label className="text-xs">Name (Thai)</Label>
              <Input
                data-testid="input-new-category-name"
                placeholder="Category name"
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
              Add
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
                <Button size="sm" onClick={() => editMutation.mutate()} data-testid={`button-save-category-${cat.id}`}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
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
                  Edit
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{cat.isActive ? "Active" : "Inactive"}</span>
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
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  return (
    <div className="space-y-3">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />)
      ) : users?.length ? (
        users.map((u) => (
          <div key={u.id} className="flex items-center gap-4 p-4 border rounded-md" data-testid={`row-admin-user-${u.id}`}>
            <div className="flex-1">
              <p className="text-sm font-medium">{u.name}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">No users</p>
      )}
    </div>
  );
}

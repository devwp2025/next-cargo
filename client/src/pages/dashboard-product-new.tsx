import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category, Product } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function DashboardProductNew() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const isEdit = !!params.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("like-new");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: existingProduct } = useQuery<Product>({
    queryKey: ["/api/products", params.id],
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingProduct) {
      setTitle(existingProduct.title);
      setDescription(existingProduct.description);
      setPrice(String(existingProduct.price));
      setCondition(existingProduct.condition);
      setCategoryId(String(existingProduct.categoryId));
      setImages(existingProduct.images?.join("\n") || "");
    }
  }, [existingProduct]);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        title,
        description,
        price: parseInt(price),
        condition,
        categoryId: parseInt(categoryId),
        images: images.split("\n").map(s => s.trim()).filter(Boolean),
      };
      if (isEdit) {
        await apiRequest("PATCH", `/api/dashboard/products/${params.id}`, body);
      } else {
        await apiRequest("POST", "/api/dashboard/products", body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/products"] });
      toast({ title: isEdit ? "Product updated" : "Product created" });
      navigate("/dashboard/products");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" data-testid="text-product-form-heading">
          {isEdit ? "Edit Product" : "List New Item"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              data-testid="input-title"
              placeholder="e.g. Nike Air Jordan 1 Retro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              data-testid="input-description"
              placeholder="Describe your item, condition details, size, color..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (Baht)</Label>
              <Input
                id="price"
                data-testid="input-price"
                type="number"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger data-testid="select-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.filter(c => c.isActive).map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="images">Image URLs (one per line)</Label>
            <Textarea
              id="images"
              data-testid="input-images"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              value={images}
              onChange={(e) => setImages(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Enter image URLs, one per line</p>
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-product">
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Update Product" : "List Item"}
          </Button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

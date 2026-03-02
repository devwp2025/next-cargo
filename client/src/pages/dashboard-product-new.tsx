import { useState, useEffect, useRef } from "react";
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
import { Loader2, Upload, X } from "lucide-react";

export default function DashboardProductNew() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const isEdit = !!params.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("like-new");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [location, setLocation] = useState("");
  const [uploading, setUploading] = useState(false);

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
      setImages(existingProduct.images || []);
      setBrand(existingProduct.brand || "");
      setModel(existingProduct.model || "");
      setSize(existingProduct.size || "");
      setColor(existingProduct.color || "");
      setLocation(existingProduct.location || "");
    }
  }, [existingProduct]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      const data = await res.json();
      setImages(prev => [...prev, ...data.urls]);
      toast({ title: "อัปโหลดสำเร็จ" });
    } catch (err: any) {
      toast({ title: "อัปโหลดไม่สำเร็จ", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const body: any = {
        title,
        description,
        price: parseInt(price),
        condition,
        categoryId: parseInt(categoryId),
        images,
      };
      if (brand) body.brand = brand;
      if (model) body.model = model;
      if (size) body.size = size;
      if (color) body.color = color;
      if (location) body.location = location;

      if (isEdit) {
        await apiRequest("PATCH", `/api/dashboard/products/${params.id}`, body);
      } else {
        await apiRequest("POST", "/api/dashboard/products", body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/products"] });
      toast({ title: isEdit ? "อัปเดตสินค้าสำเร็จ" : "ลงขายสินค้าสำเร็จ" });
      navigate("/dashboard/products");
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
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
          {isEdit ? "แก้ไขสินค้า" : "ลงขายสินค้าใหม่"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">ชื่อสินค้า</Label>
            <Input
              id="title"
              data-testid="input-title"
              placeholder="เช่น Nike Air Jordan 1 Retro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">รายละเอียด</Label>
            <Textarea
              id="description"
              data-testid="input-description"
              placeholder="อธิบายสินค้า สภาพ ไซส์ สี..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">ราคา (บาท)</Label>
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
              <Label>สภาพ</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger data-testid="select-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">ใหม่</SelectItem>
                  <SelectItem value="like-new">เหมือนใหม่</SelectItem>
                  <SelectItem value="excellent">ดีเยี่ยม</SelectItem>
                  <SelectItem value="good">ดี</SelectItem>
                  <SelectItem value="fair">พอใช้</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>หมวดหมู่</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                {categories?.filter(c => c.isActive).map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand">แบรนด์</Label>
              <Input id="brand" data-testid="input-brand" placeholder="เช่น Nike, Gucci" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">รุ่น</Label>
              <Input id="model" data-testid="input-model" placeholder="เช่น Air Jordan 1" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="size">ไซส์</Label>
              <Input id="size" data-testid="input-size" placeholder="เช่น US 10" value={size} onChange={(e) => setSize(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="color">สี</Label>
              <Input id="color" data-testid="input-color" placeholder="เช่น ดำ" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">สถานที่</Label>
              <Input id="location" data-testid="input-location" placeholder="เช่น กรุงเทพ" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>รูปภาพสินค้า</Label>
            <div className="border-2 border-dashed rounded-md p-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                data-testid="button-upload-images"
              >
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {uploading ? "กำลังอัปโหลด..." : "เลือกรูปภาพ"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">รองรับ JPEG, PNG, WebP, GIF ขนาดไม่เกิน 5MB ต่อไฟล์</p>
            </div>
            {images.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={img} alt="" className="w-full h-full object-cover rounded-md" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      data-testid={`button-remove-image-${i}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-product">
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "อัปเดตสินค้า" : "ลงขายสินค้า"}
          </Button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

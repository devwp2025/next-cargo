import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"buyer" | "seller">("buyer");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password, accountType);
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "สมัครสมาชิกไม่สำเร็จ", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/">
            <span className="text-lg font-bold tracking-tight cursor-pointer" data-testid="link-home-logo">NEXT CARGO</span>
          </Link>
          <CardTitle className="text-xl mt-4" data-testid="text-register-title">สร้างบัญชีใหม่</CardTitle>
          <CardDescription>เข้าร่วมตลาดสินค้าแบรนด์เนมมือสอง</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">ชื่อ</Label>
              <Input
                id="name"
                data-testid="input-name"
                placeholder="ชื่อของคุณ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                data-testid="input-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label>ประเภทบัญชี</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType("buyer")}
                  className={`p-3 rounded-md border-2 text-center transition-colors ${
                    accountType === "buyer"
                      ? "border-foreground bg-muted"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                  data-testid="radio-buyer"
                >
                  <p className="text-sm font-medium">ผู้ซื้อทั่วไป</p>
                  <p className="text-xs text-muted-foreground mt-1">ค้นหาและซื้อสินค้า</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("seller")}
                  className={`p-3 rounded-md border-2 text-center transition-colors ${
                    accountType === "seller"
                      ? "border-foreground bg-muted"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                  data-testid="radio-seller"
                >
                  <p className="text-sm font-medium">ผู้ขาย</p>
                  <p className="text-xs text-muted-foreground mt-1">ลงขายสินค้าของคุณ</p>
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-register">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              สมัครสมาชิก
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="text-foreground font-medium underline" data-testid="link-login">
              เข้าสู่ระบบ
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

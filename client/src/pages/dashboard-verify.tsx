import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Loader2,
  Upload,
  ShieldCheck,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export default function DashboardVerify() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const [idCardNumber, setIdCardNumber] = useState("");
  const [frontImage, setFrontImage] = useState("");
  const [backImage, setBackImage] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
    if (!authLoading && user && user.accountType !== "seller")
      navigate("/dashboard");
  }, [user, authLoading]);

  const handleUpload = async (file: File, side: "front" | "back") => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
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
      if (side === "front") {
        setFrontImage(data.urls[0]);
      } else {
        setBackImage(data.urls[0]);
      }
    } catch (err: any) {
      toast({
        title: "อัปโหลดไม่สำเร็จ",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCardNumber,
          idCardImageFront: frontImage,
          idCardImageBack: backImage,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Submission failed");
      }
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "ส่งเอกสารยืนยันตัวตนสำเร็จ" });
      navigate("/dashboard");
    },
    onError: (err: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  if (user.kycStatus === "approved") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">ยืนยันตัวตนสำเร็จแล้ว</h2>
          <p className="text-muted-foreground">
            บัญชีของคุณผ่านการยืนยันตัวตนเรียบร้อยแล้ว
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (user.kycStatus === "pending") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">รอตรวจสอบเอกสาร</h2>
          <p className="text-muted-foreground">
            เราจะตรวจสอบเอกสารของคุณโดยเร็วที่สุด กรุณารอสักครู่
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-6 h-6 text-foreground" />
            </div>
            <CardTitle data-testid="text-verify-heading">
              ยืนยันตัวตน (KYC)
            </CardTitle>
            <CardDescription>
              กรุณาอัปโหลดเอกสารยืนยันตัวตนเพื่อเริ่มขายสินค้า
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.kycStatus === "rejected" && (
              <div className="flex items-center gap-2 p-3 rounded-md border border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 mb-4">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">
                  เอกสารของคุณถูกปฏิเสธ กรุณาส่งใหม่อีกครั้ง
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="idCard">เลขบัตรประชาชน</Label>
                <Input
                  id="idCard"
                  data-testid="input-id-card-number"
                  placeholder="หมายเลขบัตรประชาชน 13 หลัก"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  maxLength={13}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>รูปบัตรประชาชนด้านหน้า</Label>
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleUpload(e.target.files[0], "front")
                  }
                  className="hidden"
                  data-testid="input-id-front"
                />
                {frontImage ? (
                  <div className="relative">
                    <img
                      src={frontImage}
                      alt="Front"
                      className="w-full h-40 object-cover rounded-md"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2"
                      onClick={() => frontInputRef.current?.click()}
                      data-testid="button-change-front"
                    >
                      เปลี่ยน
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full h-32"
                    onClick={() => frontInputRef.current?.click()}
                    disabled={uploading}
                    data-testid="button-upload-front"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    อัปโหลดรูปด้านหน้า
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>รูปบัตรประชาชนด้านหลัง</Label>
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleUpload(e.target.files[0], "back")
                  }
                  className="hidden"
                  data-testid="input-id-back"
                />
                {backImage ? (
                  <div className="relative">
                    <img
                      src={backImage}
                      alt="Back"
                      className="w-full h-40 object-cover rounded-md"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2"
                      onClick={() => backInputRef.current?.click()}
                      data-testid="button-change-back"
                    >
                      เปลี่ยน
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full h-32"
                    onClick={() => backInputRef.current?.click()}
                    disabled={uploading}
                    data-testid="button-upload-back"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    อัปโหลดรูปด้านหลัง
                  </Button>
                )}
              </div>

              <Button
                className="w-full"
                onClick={() => submitMutation.mutate()}
                disabled={
                  !idCardNumber ||
                  !frontImage ||
                  !backImage ||
                  submitMutation.isPending
                }
                data-testid="button-submit-kyc"
              >
                {submitMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                ส่งเอกสารยืนยันตัวตน
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

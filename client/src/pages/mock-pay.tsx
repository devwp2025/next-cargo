import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Ban, Loader2, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/components/product-card";

export default function MockPay() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: paymentInfo, isLoading } = useQuery<{
    sessionId: string;
    order: { id: number; amount: number; product: { title: string } };
    status: string;
  }>({
    queryKey: ["/api/pay/mock", sessionId],
  });

  const actionMutation = useMutation({
    mutationFn: async (action: "succeed" | "fail" | "cancel") => {
      await apiRequest("POST", `/api/pay/mock/${sessionId}/action`, { action });
    },
    onSuccess: (_, action) => {
      if (action === "succeed") {
        toast({ title: "ชำระเงินสำเร็จ!" });
        navigate("/me/orders");
      } else {
        toast({ title: action === "fail" ? "การชำระเงินล้มเหลว" : "ยกเลิกการชำระเงิน", variant: "destructive" });
        navigate("/");
      }
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-bold mb-2">ไม่พบรายการชำระเงิน</p>
            <p className="text-sm text-muted-foreground">รายการชำระเงินนี้ไม่ถูกต้องหรือหมดอายุแล้ว</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentInfo.status !== "requires_action") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            {paymentInfo.status === "succeeded" ? (
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            ) : (
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            )}
            <p className="text-lg font-bold mb-2">
              {paymentInfo.status === "succeeded" ? "ชำระเงินเรียบร้อยแล้ว" : "การชำระเงินล้มเหลว"}
            </p>
            <Button className="mt-4" onClick={() => navigate("/me/orders")} data-testid="button-go-orders">
              ดูคำสั่งซื้อ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-6 h-6 text-foreground" />
          </div>
          <CardTitle data-testid="text-payment-title">ช่องทางชำระเงินจำลอง</CardTitle>
          <CardDescription>ระบบชำระเงินจำลองสำหรับทดสอบ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-md p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">สินค้า</span>
              <span className="font-medium" data-testid="text-payment-item">{paymentInfo.order.product.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">คำสั่งซื้อ #</span>
              <span className="font-medium" data-testid="text-payment-order-id">{paymentInfo.order.id}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-medium">ยอดรวม</span>
                <span className="text-lg font-bold" data-testid="text-payment-total">
                  {formatPrice(paymentInfo.order.amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => actionMutation.mutate("succeed")}
              disabled={actionMutation.isPending}
              data-testid="button-pay-success"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              ชำระเงินสำเร็จ
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => actionMutation.mutate("fail")}
                disabled={actionMutation.isPending}
                data-testid="button-pay-fail"
              >
                <XCircle className="w-4 h-4 mr-2" />
                ชำระเงินล้มเหลว
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => actionMutation.mutate("cancel")}
                disabled={actionMutation.isPending}
                data-testid="button-pay-cancel"
              >
                <Ban className="w-4 h-4 mr-2" />
                ยกเลิก
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

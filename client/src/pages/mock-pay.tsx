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
        toast({ title: "Payment successful!" });
        navigate("/me/orders");
      } else {
        toast({ title: action === "fail" ? "Payment failed" : "Payment canceled", variant: "destructive" });
        navigate("/");
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
            <p className="text-lg font-bold mb-2">Payment Not Found</p>
            <p className="text-sm text-muted-foreground">This payment session is invalid or has expired.</p>
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
              Payment {paymentInfo.status === "succeeded" ? "Complete" : "Failed"}
            </p>
            <Button className="mt-4" onClick={() => navigate("/me/orders")} data-testid="button-go-orders">
              View Orders
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
          <CardTitle data-testid="text-payment-title">Mock Payment Gateway</CardTitle>
          <CardDescription>This is a simulated payment for testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-md p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Item</span>
              <span className="font-medium" data-testid="text-payment-item">{paymentInfo.order.product.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order #</span>
              <span className="font-medium" data-testid="text-payment-order-id">{paymentInfo.order.id}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-medium">Total</span>
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
              Pay Success
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
                Pay Fail
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => actionMutation.mutate("cancel")}
                disabled={actionMutation.isPending}
                data-testid="button-pay-cancel"
              >
                <Ban className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

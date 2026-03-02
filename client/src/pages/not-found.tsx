import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2" data-testid="text-404-heading">ไม่พบหน้าที่ค้นหา</h1>
          <p className="text-sm text-muted-foreground mb-6">
            หน้าที่คุณต้องการไม่มีอยู่หรือถูกย้ายไปแล้ว
          </p>
          <Link href="/">
            <Button data-testid="button-go-home">กลับหน้าหลัก</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

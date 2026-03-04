import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { log } from "../index";
import { requireAuth } from "../middleware";

export function registerPaymentRoutes(app: Express) {
  app.get("/api/pay/mock/:sessionId", async (req, res) => {
    const info = await storage.getPaymentInfo(req.params.sessionId);
    if (!info) return res.status(404).json({ message: "Payment not found" });
    res.json(info);
  });

  app.post("/api/pay/mock/:sessionId/action", requireAuth, async (req, res) => {
    try {
      const { action } = z
        .object({ action: z.enum(["succeed", "fail", "cancel"]) })
        .parse(req.body);
      const payment = await storage.getPaymentBySessionId(req.params.sessionId);
      if (!payment)
        return res.status(404).json({ message: "Payment not found" });
      if (payment.status !== "requires_action")
        return res.status(400).json({ message: "Payment already processed" });

      if (action === "succeed") {
        await storage.updatePaymentStatus(payment.sessionId, "succeeded");
        const order = await storage.getOrderById(payment.orderId);
        if (order && order.status === "pending_payment") {
          await storage.updateOrderStatus(order.id, "paid");
        }
        log(`Payment succeeded: ${payment.sessionId}`);
      } else {
        await storage.updatePaymentStatus(payment.sessionId, "failed");
        const order = await storage.getOrderById(payment.orderId);
        if (order) {
          await storage.updateOrderStatus(order.id, "canceled");
          await storage.updateProductStatus(order.productId, "active");
        }
        log(`Payment ${action}: ${payment.sessionId}`);
      }
      res.json({ message: "OK" });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });

  app.post("/api/webhooks/mockpay", async (req, res) => {
    const sig = req.headers["x-mockpay-signature"];
    if (sig !== process.env.MOCKPAY_WEBHOOK_SECRET) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const { event, sessionId } = req.body;
    log(`Webhook received: ${event} for ${sessionId}`);

    const payment = await storage.getPaymentBySessionId(sessionId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status === "succeeded" || payment.status === "failed") {
      log(`Webhook duplicate ignored: ${sessionId} already ${payment.status}`);
      return res.json({ message: "Already processed" });
    }

    if (event === "payment.succeeded") {
      await storage.updatePaymentStatus(sessionId, "succeeded");
      const order = await storage.getOrderById(payment.orderId);
      if (order && order.status === "pending_payment") {
        await storage.updateOrderStatus(order.id, "paid");
      }
    } else if (event === "payment.failed" || event === "payment.canceled") {
      await storage.updatePaymentStatus(sessionId, "failed");
      const order = await storage.getOrderById(payment.orderId);
      if (order) {
        await storage.updateOrderStatus(order.id, "canceled");
        await storage.updateProductStatus(order.productId, "active");
      }
    }

    res.json({ message: "OK" });
  });
}

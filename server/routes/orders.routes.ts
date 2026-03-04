import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { log } from "../index";
import { randomUUID } from "crypto";
import { requireAuth } from "../middleware";

export function registerOrderRoutes(app: Express) {
  app.get("/api/me/orders", requireAuth, async (req, res) => {
    const ords = await storage.getOrdersByBuyerId(req.session.userId!);
    res.json(ords);
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const { productId } = z
        .object({ productId: z.number().int() })
        .parse(req.body);
      const product = await storage.getProductById(productId);
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      if (product.sellerId === req.session.userId)
        return res.status(400).json({ message: "Cannot buy your own product" });

      const reserved = await storage.reserveProduct(productId);
      if (!reserved)
        return res.status(400).json({ message: "Product not available" });

      const order = await storage.createOrder(
        productId,
        req.session.userId!,
        product.sellerId,
        product.price,
      );
      const sessionId = randomUUID();
      await storage.createPayment(order.id, sessionId);

      log(`Order created: ${order.id}, payment session: ${sessionId}`);
      res.json({ orderId: order.id, sessionId });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });
}

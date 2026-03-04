import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { log } from "../index";
import { requireAuth } from "../middleware";

export function registerDashboardRoutes(app: Express) {
  app.get("/api/dashboard/products", requireAuth, async (req, res) => {
    const prods = await storage.getProductsBySellerIdRaw(req.session.userId!);
    res.json(prods);
  });

  app.post("/api/dashboard/products", requireAuth, async (req, res) => {
    try {
      const data = z
        .object({
          title: z.string().min(1),
          description: z.string().min(1),
          price: z.number().int().positive(),
          condition: z.string().min(1),
          categoryId: z.number().int().positive(),
          images: z.array(z.string()).default([]),
          brand: z.string().optional(),
          model: z.string().optional(),
          size: z.string().optional(),
          color: z.string().optional(),
          location: z.string().optional(),
        })
        .parse(req.body);

      const cat = await storage.getCategoryById(data.categoryId);
      if (!cat || !cat.isActive)
        return res
          .status(400)
          .json({ message: "Invalid or inactive category" });

      const product = await storage.createProduct({
        ...data,
        sellerId: req.session.userId!,
      });
      log(`Product created: ${product.id} by user ${req.session.userId}`);
      res.json(product);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });

  app.patch("/api/dashboard/products/:id", requireAuth, async (req, res) => {
    try {
      const data = z
        .object({
          title: z.string().min(1).optional(),
          description: z.string().min(1).optional(),
          price: z.number().int().positive().optional(),
          condition: z.string().min(1).optional(),
          categoryId: z.number().int().positive().optional(),
          images: z.array(z.string()).optional(),
          brand: z.string().optional(),
          model: z.string().optional(),
          size: z.string().optional(),
          color: z.string().optional(),
          location: z.string().optional(),
        })
        .parse(req.body);

      if (data.categoryId) {
        const cat = await storage.getCategoryById(data.categoryId);
        if (!cat || !cat.isActive)
          return res
            .status(400)
            .json({ message: "Invalid or inactive category" });
      }

      const product = await storage.updateProduct(
        parseInt(req.params.id),
        req.session.userId!,
        data,
      );
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });

  app.patch(
    "/api/dashboard/products/:id/status",
    requireAuth,
    async (req, res) => {
      const { status } = z
        .object({ status: z.enum(["active", "hidden", "sold"]) })
        .parse(req.body);
      const product = await storage.updateProductStatus(
        parseInt(req.params.id),
        status,
        req.session.userId!,
      );
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      res.json(product);
    },
  );

  app.get("/api/dashboard/orders", requireAuth, async (req, res) => {
    const ords = await storage.getOrdersBySellerId(req.session.userId!);
    res.json(ords);
  });

  app.patch(
    "/api/dashboard/orders/:id/status",
    requireAuth,
    async (req, res) => {
      try {
        const { status } = z
          .object({
            status: z.enum(["preparing", "shipped", "completed", "canceled"]),
          })
          .parse(req.body);
        const order = await storage.getOrderById(parseInt(req.params.id));
        if (!order || order.sellerId !== req.session.userId) {
          return res.status(404).json({ message: "Order not found" });
        }

        const validTransitions: Record<string, string[]> = {
          paid: ["preparing", "canceled"],
          preparing: ["shipped", "canceled"],
          shipped: ["completed"],
        };
        if (!validTransitions[order.status]?.includes(status)) {
          return res.status(400).json({
            message: `Cannot transition from ${order.status} to ${status}`,
          });
        }

        const updated = await storage.updateOrderStatus(order.id, status);
        if (status === "completed") {
          await storage.updateProductStatus(order.productId, "sold");
        }
        if (status === "canceled") {
          await storage.updateProductStatus(order.productId, "active");
        }
        log(
          `Order ${order.id} status updated to ${status} by seller ${req.session.userId}`,
        );
        res.json(updated);
      } catch (err: any) {
        res.status(400).json({ message: err.message || "Invalid input" });
      }
    },
  );
}

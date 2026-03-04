import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { log } from "../index";
import { requireAdmin } from "../middleware";

export function registerAdminRoutes(app: Express) {
  app.get("/api/admin/products", requireAdmin, async (_req, res) => {
    const prods = await storage.getAllProducts();
    res.json(prods);
  });

  app.patch(
    "/api/admin/products/:id/status",
    requireAdmin,
    async (req, res) => {
      const { status } = z
        .object({ status: z.enum(["active", "hidden", "sold"]) })
        .parse(req.body);
      const product = await storage.updateProductStatus(
        parseInt(req.params.id),
        status,
      );
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      res.json(product);
    },
  );

  app.get("/api/admin/orders", requireAdmin, async (_req, res) => {
    const ords = await storage.getAllOrders();
    res.json(ords);
  });

  app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = z
        .object({
          status: z.enum([
            "paid",
            "preparing",
            "shipped",
            "completed",
            "canceled",
          ]),
        })
        .parse(req.body);
      const order = await storage.getOrderById(parseInt(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });

      const updated = await storage.updateOrderStatus(order.id, status);
      if (status === "completed") {
        await storage.updateProductStatus(order.productId, "sold");
      }
      if (status === "canceled") {
        await storage.updateProductStatus(order.productId, "active");
      }
      log(`Order ${order.id} status updated to ${status} by admin`);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });

  app.get("/api/admin/categories", requireAdmin, async (_req, res) => {
    const cats = await storage.getCategories(false);
    res.json(cats);
  });

  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const { name, slug } = z
        .object({ name: z.string().min(1), slug: z.string().min(1) })
        .parse(req.body);
      const cat = await storage.createCategory(name, slug);
      res.json(cat);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });

  app.patch("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const data = z
        .object({
          name: z.string().min(1).optional(),
          isActive: z.boolean().optional(),
        })
        .parse(req.body);
      const cat = await storage.updateCategory(parseInt(req.params.id), data);
      if (!cat) return res.status(404).json({ message: "Category not found" });
      res.json(cat);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers);
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { role } = z
        .object({ role: z.enum(["user", "admin"]) })
        .parse(req.body);
      const updated = await storage.updateUserRole(
        parseInt(req.params.id),
        role,
      );
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { passwordHash, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });

  app.patch("/api/admin/users/:id/kyc", requireAdmin, async (req, res) => {
    try {
      const { kycStatus } = z
        .object({
          kycStatus: z.enum(["unverified", "pending", "approved", "rejected"]),
        })
        .parse(req.body);
      const updated = await storage.updateUserKycStatus(
        parseInt(req.params.id),
        kycStatus,
      );
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { passwordHash, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });
}

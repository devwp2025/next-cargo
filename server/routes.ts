import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { log } from "./index";
import { randomUUID } from "crypto";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

const PgSession = connectPgSimple(session);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const user = await storage.getUserById(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.use("/uploads", express.static(uploadsDir));

  app.use(
    session({
      store: new PgSession({
        pool: pool as any,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "luxe-market-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    }),
  );

  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    res.set("Cache-Control", "no-store");
    res.set("Pragma", "no-cache");
    next();
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId)
      return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, accountType } = z
        .object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6),
          accountType: z.enum(["buyer", "seller"]).default("buyer"),
        })
        .parse(req.body);

      const existing = await storage.getUserByEmail(email);
      if (existing)
        return res.status(400).json({ message: "Email already registered" });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser(
        name,
        email,
        passwordHash,
        "user",
        accountType,
      );

      await new Promise<void>((resolve, reject) => {
        req.session.userId = user.id;
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      log(`User registered: ${email} (${accountType})`);
      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = z
        .object({
          email: z.string().email(),
          password: z.string().min(1),
        })
        .parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user)
        return res.status(401).json({ message: "Invalid credentials" });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid)
        return res.status(401).json({ message: "Invalid credentials" });

      await new Promise<void>((resolve, reject) => {
        req.session.userId = user.id;
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      log(`User logged in: ${email}`);
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.post(
    "/api/upload",
    requireAuth,
    upload.array("files", 10),
    (req, res) => {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const urls = files.map((f) => `/uploads/${f.filename}`);
      res.json({ urls });
    },
  );

  app.get("/api/categories", async (_req, res) => {
    const cats = await storage.getCategories(true);
    res.json(cats);
  });

  app.get("/api/categories/:slug", async (req, res) => {
    const cat = await storage.getCategoryBySlug(req.params.slug);
    if (!cat) return res.status(404).json({ message: "Category not found" });
    res.json(cat);
  });

  app.get("/api/categories/:slug/products", async (req, res) => {
    const { q, minPrice, maxPrice, page, limit } = req.query;
    const result = await storage.getProductsByCategorySlug(req.params.slug, {
      q: q as string,
      minPrice: minPrice ? parseInt(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 24,
    });
    res.json(result);
  });

  app.get("/api/products", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 12;
    const { products } = await storage.getActiveProducts(limit);
    res.json(products);
  });

  app.get("/api/products/search", async (req, res) => {
    const { q, categoryId, minPrice, maxPrice, page, limit } = req.query;
    const result = await storage.searchProducts({
      q: q as string,
      categoryId:
        categoryId && categoryId !== "all"
          ? parseInt(categoryId as string)
          : undefined,
      minPrice: minPrice ? parseInt(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 24,
    });
    res.json(result);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProductById(parseInt(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

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

  app.get("/api/chat", requireAuth, async (req, res) => {
    const convs = await storage.getConversationsForUser(req.session.userId!);
    res.json(convs);
  });

  app.post("/api/chat/start", requireAuth, async (req, res) => {
    try {
      const { productId } = z
        .object({ productId: z.number().int() })
        .parse(req.body);
      const product = await storage.getProductById(productId);
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      if (product.sellerId === req.session.userId)
        return res.status(400).json({ message: "Cannot chat with yourself" });

      const conv = await storage.getOrCreateConversation(
        productId,
        req.session.userId!,
        product.sellerId,
      );
      res.json(conv);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });

  app.get("/api/chat/:conversationId/info", requireAuth, async (req, res) => {
    const conv = await storage.getConversationInfo(
      parseInt(req.params.conversationId),
      req.session.userId!,
    );
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });
    if (
      conv.buyerId !== req.session.userId &&
      conv.sellerId !== req.session.userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(conv);
  });

  app.get(
    "/api/chat/:conversationId/messages",
    requireAuth,
    async (req, res) => {
      const conv = await storage.getConversationById(
        parseInt(req.params.conversationId),
      );
      if (!conv)
        return res.status(404).json({ message: "Conversation not found" });
      if (
        conv.buyerId !== req.session.userId &&
        conv.sellerId !== req.session.userId
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
      const after = req.query.after as string | undefined;
      const msgs = await storage.getMessages(
        conv.id,
        after && after !== "" ? after : undefined,
      );
      res.json(msgs);
    },
  );

  app.post(
    "/api/chat/:conversationId/messages",
    requireAuth,
    async (req, res) => {
      try {
        const { text } = z
          .object({ text: z.string().min(1).max(1000) })
          .parse(req.body);
        const conv = await storage.getConversationById(
          parseInt(req.params.conversationId),
        );
        if (!conv)
          return res.status(404).json({ message: "Conversation not found" });
        if (
          conv.buyerId !== req.session.userId &&
          conv.sellerId !== req.session.userId
        ) {
          return res.status(403).json({ message: "Access denied" });
        }

        const recentCount = await storage.getRecentMessageCount(
          req.session.userId!,
          1,
        );
        if (recentCount >= 30) {
          return res
            .status(429)
            .json({ message: "Too many messages. Please wait." });
        }

        const sanitized = escapeHtml(text);
        const msg = await storage.createMessage(
          conv.id,
          req.session.userId!,
          sanitized,
        );
        log(`Message sent in conv ${conv.id} by user ${req.session.userId}`);
        res.json(msg);
      } catch (err: any) {
        res.status(400).json({ message: err.message || "Invalid input" });
      }
    },
  );

  app.post("/api/kyc/submit", requireAuth, async (req, res) => {
    try {
      const parsed = z
        .object({
          idCardNumber: z.string().min(5),
          idCardImageFront: z.string().optional(),
          idCardImageBack: z.string().optional(),
        })
        .parse(req.body);

      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;
      const frontFile = files?.idCardFront?.[0];
      const backFile = files?.idCardBack?.[0];
      const frontUrl = frontFile
        ? `/uploads/${frontFile.filename}`
        : parsed.idCardImageFront;
      const backUrl = backFile
        ? `/uploads/${backFile.filename}`
        : parsed.idCardImageBack;

      if (!frontUrl || !backUrl) {
        return res
          .status(400)
          .json({ message: "Both front and back images required" });
      }

      const updated = await storage.updateUserKycInfo(req.session.userId!, {
        idCardNumber: parsed.idCardNumber,
        idCardImageFront: frontUrl,
        idCardImageBack: backUrl,
        kycStatus: "pending",
      });

      if (!updated) return res.status(404).json({ message: "User not found" });
      const { passwordHash, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });

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

  return httpServer;
}

import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import express from "express";
import { uploadsDir } from "./middleware";

import { registerAuthRoutes } from "./routes/auth.routes";
import { registerUploadRoutes } from "./routes/upload.routes";
import { registerCategoryRoutes } from "./routes/categories.routes";
import { registerProductRoutes } from "./routes/products.routes";
import { registerDashboardRoutes } from "./routes/dashboard.routes";
import { registerOrderRoutes } from "./routes/orders.routes";
import { registerPaymentRoutes } from "./routes/payments.routes";
import { registerChatRoutes } from "./routes/chat.routes";
import { registerKycRoutes } from "./routes/kyc.routes";
import { registerAdminRoutes } from "./routes/admin.routes";

const PgSession = connectPgSimple(session);

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

  registerAuthRoutes(app);
  registerUploadRoutes(app);
  registerCategoryRoutes(app);
  registerProductRoutes(app);
  registerDashboardRoutes(app);
  registerOrderRoutes(app);
  registerPaymentRoutes(app);
  registerChatRoutes(app);
  registerKycRoutes(app);
  registerAdminRoutes(app);

  return httpServer;
}

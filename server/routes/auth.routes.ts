import type { Express } from "express";
import { storage } from "../storage";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { log } from "../index";

export function registerAuthRoutes(app: Express) {
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
}

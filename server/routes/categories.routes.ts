import type { Express } from "express";
import { storage } from "../storage";

export function registerCategoryRoutes(app: Express) {
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
}

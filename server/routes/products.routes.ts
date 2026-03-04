import type { Express } from "express";
import { storage } from "../storage";

export function registerProductRoutes(app: Express) {
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
}

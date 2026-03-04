import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users.schema";
import { categories } from "./categories.schema";

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  condition: text("condition").notNull(),
  images: text("images").array().notNull(),
  status: text("status").notNull().default("active"),
  brand: text("brand"),
  model: text("model"),
  size: text("size"),
  color: text("color"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("products_status_created_idx").on(table.status, table.createdAt),
  index("products_category_status_idx").on(table.categoryId, table.status),
]);

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, sellerId: true, status: true });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

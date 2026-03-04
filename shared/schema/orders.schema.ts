import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users.schema";
import { products } from "./products.schema";

export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").notNull().references(() => products.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending_payment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("orders_buyer_idx").on(table.buyerId),
  index("orders_seller_idx").on(table.sellerId),
]);

export type Order = typeof orders.$inferSelect;

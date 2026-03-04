import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "./users.schema";
import { products } from "./products.schema";

export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").notNull().references(() => products.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("messages_conversation_created_idx").on(table.conversationId, table.createdAt),
]);

export const insertMessageSchema = z.object({ text: z.string().min(1).max(1000) });

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders.schema";

export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull().references(() => orders.id).unique(),
  provider: text("provider").notNull().default("mockpay"),
  sessionId: text("session_id").notNull().unique(),
  status: text("status").notNull().default("requires_action"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;

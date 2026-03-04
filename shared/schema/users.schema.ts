import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  accountType: text("account_type").notNull().default("buyer"),
  kycStatus: text("kyc_status").notNull().default("unverified"),
  idCardNumber: text("id_card_number"),
  idCardImageFront: text("id_card_image_front"),
  idCardImageBack: text("id_card_image_back"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, passwordHash: true, kycStatus: true, idCardNumber: true, idCardImageFront: true, idCardImageBack: true }).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  accountType: z.enum(["buyer", "seller"]).default("buyer"),
});
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

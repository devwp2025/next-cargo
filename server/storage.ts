import { db } from "./db";
import { eq, and, desc, asc, ilike, gte, lte, sql, or, ne, gt } from "drizzle-orm";
import {
  users, categories, products, conversations, messages, orders, payments,
  type User, type Category, type Product, type Conversation, type Message, type Order, type Payment,
} from "@shared/schema";

export interface IStorage {
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(name: string, email: string, passwordHash: string, role?: string, accountType?: string): Promise<User>;
  getAllUsers(): Promise<Omit<User, "passwordHash">[]>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  updateUserKycStatus(id: number, kycStatus: string): Promise<User | undefined>;
  updateUserKycInfo(id: number, data: { idCardNumber?: string; idCardImageFront?: string; idCardImageBack?: string; kycStatus?: string }): Promise<User | undefined>;

  getCategories(activeOnly?: boolean): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(name: string, slug: string): Promise<Category>;
  updateCategory(id: number, data: Partial<{ name: string; isActive: boolean }>): Promise<Category | undefined>;

  getActiveProducts(limit?: number, offset?: number): Promise<{ products: Product[]; total: number }>;
  searchProducts(opts: { q?: string; categoryId?: number; minPrice?: number; maxPrice?: number; page?: number; limit?: number }): Promise<{ products: Product[]; total: number }>;
  getProductsByCategorySlug(slug: string, opts: { q?: string; minPrice?: number; maxPrice?: number; page?: number; limit?: number }): Promise<{ products: Product[]; total: number }>;
  getProductById(id: number): Promise<(Product & { seller: { id: number; name: string }; category: Category }) | undefined>;
  getProductsBySellerIdRaw(sellerId: number): Promise<Product[]>;
  createProduct(data: { sellerId: number; categoryId: number; title: string; description: string; price: number; condition: string; images: string[]; brand?: string; model?: string; size?: string; color?: string; location?: string }): Promise<Product>;
  updateProduct(id: number, sellerId: number, data: Partial<{ title: string; description: string; price: number; condition: string; categoryId: number; images: string[]; brand: string; model: string; size: string; color: string; location: string }>): Promise<Product | undefined>;
  updateProductStatus(id: number, status: string, sellerId?: number): Promise<Product | undefined>;
  getAllProducts(): Promise<(Product & { seller?: { name: string } })[]>;
  reserveProduct(productId: number): Promise<boolean>;

  getConversation(productId: number, buyerId: number, sellerId: number): Promise<Conversation | undefined>;
  getOrCreateConversation(productId: number, buyerId: number, sellerId: number): Promise<Conversation>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  getConversationsForUser(userId: number): Promise<any[]>;
  getConversationInfo(id: number, userId: number): Promise<any>;

  getMessages(conversationId: number, after?: string): Promise<Message[]>;
  createMessage(conversationId: number, senderId: number, text: string): Promise<Message>;
  getRecentMessageCount(senderId: number, minutesAgo: number): Promise<number>;

  createOrder(productId: number, buyerId: number, sellerId: number, amount: number): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getOrdersBySellerId(sellerId: number): Promise<any[]>;
  getOrdersByBuyerId(buyerId: number): Promise<any[]>;
  getAllOrders(): Promise<any[]>;

  createPayment(orderId: number, sessionId: string): Promise<Payment>;
  getPaymentBySessionId(sessionId: string): Promise<Payment | undefined>;
  updatePaymentStatus(sessionId: string, status: string): Promise<Payment | undefined>;
  getPaymentInfo(sessionId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(name: string, email: string, passwordHash: string, role = "user", accountType = "buyer") {
    const [user] = await db.insert(users).values({ name, email, passwordHash, role, accountType }).returning();
    return user;
  }

  async getAllUsers() {
    return db.select({
      id: users.id, name: users.name, email: users.email, role: users.role,
      accountType: users.accountType, kycStatus: users.kycStatus,
      idCardNumber: users.idCardNumber, idCardImageFront: users.idCardImageFront,
      idCardImageBack: users.idCardImageBack, createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: number, role: string) {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserKycStatus(id: number, kycStatus: string) {
    const [user] = await db.update(users).set({ kycStatus }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserKycInfo(id: number, data: { idCardNumber?: string; idCardImageFront?: string; idCardImageBack?: string; kycStatus?: string }) {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getCategories(activeOnly = true) {
    if (activeOnly) {
      return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
    }
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategoryBySlug(slug: string) {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, slug));
    return cat;
  }

  async getCategoryById(id: number) {
    const [cat] = await db.select().from(categories).where(eq(categories.id, id));
    return cat;
  }

  async createCategory(name: string, slug: string) {
    const [cat] = await db.insert(categories).values({ name, slug }).returning();
    return cat;
  }

  async updateCategory(id: number, data: Partial<{ name: string; isActive: boolean }>) {
    const [cat] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return cat;
  }

  async getActiveProducts(limit = 12, offset = 0) {
    const prods = await db.select().from(products)
      .where(eq(products.status, "active"))
      .orderBy(desc(products.createdAt))
      .limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(products).where(eq(products.status, "active"));
    return { products: prods, total: count };
  }

  async searchProducts(opts: { q?: string; categoryId?: number; minPrice?: number; maxPrice?: number; page?: number; limit?: number }) {
    const { q, categoryId, minPrice, maxPrice, page = 1, limit = 24 } = opts;
    const conditions = [eq(products.status, "active")];
    if (q) conditions.push(ilike(products.title, `%${q}%`));
    if (categoryId && categoryId > 0) conditions.push(eq(products.categoryId, categoryId));
    if (minPrice) conditions.push(gte(products.price, minPrice));
    if (maxPrice) conditions.push(lte(products.price, maxPrice));

    const where = and(...conditions);
    const prods = await db.select().from(products).where(where!).orderBy(desc(products.createdAt)).limit(limit).offset((page - 1) * limit);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(products).where(where!);
    return { products: prods, total: count };
  }

  async getProductsByCategorySlug(slug: string, opts: { q?: string; minPrice?: number; maxPrice?: number; page?: number; limit?: number }) {
    const cat = await this.getCategoryBySlug(slug);
    if (!cat) return { products: [], total: 0 };
    return this.searchProducts({ ...opts, categoryId: cat.id });
  }

  async getProductById(id: number) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return undefined;
    const [seller] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, product.sellerId));
    const [category] = await db.select().from(categories).where(eq(categories.id, product.categoryId));
    return { ...product, seller, category };
  }

  async getProductsBySellerIdRaw(sellerId: number) {
    return db.select().from(products).where(eq(products.sellerId, sellerId)).orderBy(desc(products.createdAt));
  }

  async createProduct(data: { sellerId: number; categoryId: number; title: string; description: string; price: number; condition: string; images: string[]; brand?: string; model?: string; size?: string; color?: string; location?: string }) {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async updateProduct(id: number, sellerId: number, data: Partial<{ title: string; description: string; price: number; condition: string; categoryId: number; images: string[]; brand: string; model: string; size: string; color: string; location: string }>) {
    const [product] = await db.update(products).set(data).where(and(eq(products.id, id), eq(products.sellerId, sellerId))).returning();
    return product;
  }

  async updateProductStatus(id: number, status: string, sellerId?: number) {
    const conditions = [eq(products.id, id)];
    if (sellerId) conditions.push(eq(products.sellerId, sellerId));
    const [product] = await db.update(products).set({ status }).where(and(...conditions)).returning();
    return product;
  }

  async getAllProducts() {
    const prods = await db.select().from(products).orderBy(desc(products.createdAt));
    const result = [];
    for (const p of prods) {
      const [seller] = await db.select({ name: users.name }).from(users).where(eq(users.id, p.sellerId));
      result.push({ ...p, seller });
    }
    return result;
  }

  async reserveProduct(productId: number): Promise<boolean> {
    const result = await db.update(products)
      .set({ status: "reserved" })
      .where(and(eq(products.id, productId), eq(products.status, "active")))
      .returning();
    return result.length > 0;
  }

  async getConversation(productId: number, buyerId: number, sellerId: number) {
    const [conv] = await db.select().from(conversations)
      .where(and(
        eq(conversations.productId, productId),
        eq(conversations.buyerId, buyerId),
        eq(conversations.sellerId, sellerId)
      ));
    return conv;
  }

  async getOrCreateConversation(productId: number, buyerId: number, sellerId: number) {
    const existing = await this.getConversation(productId, buyerId, sellerId);
    if (existing) return existing;
    const [conv] = await db.insert(conversations).values({ productId, buyerId, sellerId }).returning();
    return conv;
  }

  async getConversationById(id: number) {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv;
  }

  async getConversationsForUser(userId: number) {
    const convs = await db.select().from(conversations)
      .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
      .orderBy(desc(conversations.createdAt));

    const result = [];
    for (const conv of convs) {
      const otherUserId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
      const [otherUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, otherUserId));
      const [product] = await db.select({ title: products.title, images: products.images }).from(products).where(eq(products.id, conv.productId));
      const [lastMessage] = await db.select().from(messages).where(eq(messages.conversationId, conv.id)).orderBy(desc(messages.createdAt)).limit(1);
      result.push({ ...conv, otherUser, product, lastMessage });
    }
    return result;
  }

  async getConversationInfo(id: number, userId: number) {
    const conv = await this.getConversationById(id);
    if (!conv) return undefined;
    const otherUserId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
    const [otherUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, otherUserId));
    const [product] = await db.select({
      id: products.id, title: products.title, images: products.images, price: products.price
    }).from(products).where(eq(products.id, conv.productId));
    return { ...conv, otherUser, product };
  }

  async getMessages(conversationId: number, after?: string) {
    if (after) {
      return db.select().from(messages)
        .where(and(eq(messages.conversationId, conversationId), gt(messages.createdAt, new Date(after))))
        .orderBy(asc(messages.createdAt));
    }
    return db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(conversationId: number, senderId: number, text: string) {
    const [msg] = await db.insert(messages).values({ conversationId, senderId, text }).returning();
    return msg;
  }

  async getRecentMessageCount(senderId: number, minutesAgo: number) {
    const since = new Date(Date.now() - minutesAgo * 60 * 1000);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(messages)
      .where(and(eq(messages.senderId, senderId), gt(messages.createdAt, since)));
    return count;
  }

  async createOrder(productId: number, buyerId: number, sellerId: number, amount: number) {
    const [order] = await db.insert(orders).values({ productId, buyerId, sellerId, amount }).returning();
    return order;
  }

  async getOrderById(id: number) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async updateOrderStatus(id: number, status: string) {
    const [order] = await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return order;
  }

  async getOrdersBySellerId(sellerId: number) {
    const ords = await db.select().from(orders).where(eq(orders.sellerId, sellerId)).orderBy(desc(orders.createdAt));
    const result = [];
    for (const o of ords) {
      const [product] = await db.select({ title: products.title }).from(products).where(eq(products.id, o.productId));
      const [buyer] = await db.select({ name: users.name }).from(users).where(eq(users.id, o.buyerId));
      result.push({ ...o, product, buyer });
    }
    return result;
  }

  async getOrdersByBuyerId(buyerId: number) {
    const ords = await db.select().from(orders).where(eq(orders.buyerId, buyerId)).orderBy(desc(orders.createdAt));
    const result = [];
    for (const o of ords) {
      const [product] = await db.select({ title: products.title, images: products.images }).from(products).where(eq(products.id, o.productId));
      const [seller] = await db.select({ name: users.name }).from(users).where(eq(users.id, o.sellerId));
      result.push({ ...o, product, seller });
    }
    return result;
  }

  async getAllOrders() {
    const ords = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const result = [];
    for (const o of ords) {
      const [product] = await db.select({ title: products.title }).from(products).where(eq(products.id, o.productId));
      const [buyer] = await db.select({ name: users.name }).from(users).where(eq(users.id, o.buyerId));
      const [seller] = await db.select({ name: users.name }).from(users).where(eq(users.id, o.sellerId));
      const [payment] = await db.select({ status: payments.status }).from(payments).where(eq(payments.orderId, o.id));
      result.push({ ...o, product, buyer, seller, payment });
    }
    return result;
  }

  async createPayment(orderId: number, sessionId: string) {
    const [payment] = await db.insert(payments).values({ orderId, sessionId }).returning();
    return payment;
  }

  async getPaymentBySessionId(sessionId: string) {
    const [payment] = await db.select().from(payments).where(eq(payments.sessionId, sessionId));
    return payment;
  }

  async updatePaymentStatus(sessionId: string, status: string) {
    const [payment] = await db.update(payments).set({ status, updatedAt: new Date() }).where(eq(payments.sessionId, sessionId)).returning();
    return payment;
  }

  async getPaymentInfo(sessionId: string) {
    const payment = await this.getPaymentBySessionId(sessionId);
    if (!payment) return undefined;
    const order = await this.getOrderById(payment.orderId);
    if (!order) return undefined;
    const [product] = await db.select({ title: products.title }).from(products).where(eq(products.id, order.productId));
    return { sessionId: payment.sessionId, status: payment.status, order: { id: order.id, amount: order.amount, product } };
  }
}

export const storage = new DatabaseStorage();

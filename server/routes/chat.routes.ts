import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { log } from "../index";
import { requireAuth, escapeHtml } from "../middleware";

export function registerChatRoutes(app: Express) {
  app.get("/api/chat", requireAuth, async (req, res) => {
    const convs = await storage.getConversationsForUser(req.session.userId!);
    res.json(convs);
  });

  app.post("/api/chat/start", requireAuth, async (req, res) => {
    try {
      const { productId } = z
        .object({ productId: z.number().int() })
        .parse(req.body);
      const product = await storage.getProductById(productId);
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      if (product.sellerId === req.session.userId)
        return res.status(400).json({ message: "Cannot chat with yourself" });

      const conv = await storage.getOrCreateConversation(
        productId,
        req.session.userId!,
        product.sellerId,
      );
      res.json(conv);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });

  app.get("/api/chat/:conversationId/info", requireAuth, async (req, res) => {
    const conv = await storage.getConversationInfo(
      parseInt(req.params.conversationId),
      req.session.userId!,
    );
    if (!conv)
      return res.status(404).json({ message: "Conversation not found" });
    if (
      conv.buyerId !== req.session.userId &&
      conv.sellerId !== req.session.userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(conv);
  });

  app.get(
    "/api/chat/:conversationId/messages",
    requireAuth,
    async (req, res) => {
      const conv = await storage.getConversationById(
        parseInt(req.params.conversationId),
      );
      if (!conv)
        return res.status(404).json({ message: "Conversation not found" });
      if (
        conv.buyerId !== req.session.userId &&
        conv.sellerId !== req.session.userId
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
      const after = req.query.after as string | undefined;
      const msgs = await storage.getMessages(
        conv.id,
        after && after !== "" ? after : undefined,
      );
      res.json(msgs);
    },
  );

  app.post(
    "/api/chat/:conversationId/messages",
    requireAuth,
    async (req, res) => {
      try {
        const { text } = z
          .object({ text: z.string().min(1).max(1000) })
          .parse(req.body);
        const conv = await storage.getConversationById(
          parseInt(req.params.conversationId),
        );
        if (!conv)
          return res.status(404).json({ message: "Conversation not found" });
        if (
          conv.buyerId !== req.session.userId &&
          conv.sellerId !== req.session.userId
        ) {
          return res.status(403).json({ message: "Access denied" });
        }

        const recentCount = await storage.getRecentMessageCount(
          req.session.userId!,
          1,
        );
        if (recentCount >= 30) {
          return res
            .status(429)
            .json({ message: "Too many messages. Please wait." });
        }

        const sanitized = escapeHtml(text);
        const msg = await storage.createMessage(
          conv.id,
          req.session.userId!,
          sanitized,
        );
        log(`Message sent in conv ${conv.id} by user ${req.session.userId}`);
        res.json(msg);
      } catch (err: any) {
        res.status(400).json({ message: err.message || "Invalid input" });
      }
    },
  );
}

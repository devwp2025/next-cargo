import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { requireAuth } from "../middleware";

export function registerKycRoutes(app: Express) {
  app.post("/api/kyc/submit", requireAuth, async (req, res) => {
    try {
      const parsed = z
        .object({
          idCardNumber: z.string().min(5),
          idCardImageFront: z.string().optional(),
          idCardImageBack: z.string().optional(),
        })
        .parse(req.body);

      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;
      const frontFile = files?.idCardFront?.[0];
      const backFile = files?.idCardBack?.[0];
      const frontUrl = frontFile
        ? `/uploads/${frontFile.filename}`
        : parsed.idCardImageFront;
      const backUrl = backFile
        ? `/uploads/${backFile.filename}`
        : parsed.idCardImageBack;

      if (!frontUrl || !backUrl) {
        return res
          .status(400)
          .json({ message: "Both front and back images required" });
      }

      const updated = await storage.updateUserKycInfo(req.session.userId!, {
        idCardNumber: parsed.idCardNumber,
        idCardImageFront: frontUrl,
        idCardImageBack: backUrl,
        kycStatus: "pending",
      });

      if (!updated) return res.status(404).json({ message: "User not found" });
      const { passwordHash, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid input" });
    }
  });
}

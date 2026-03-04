import type { Express } from "express";
import { requireAuth, upload } from "../middleware";

export function registerUploadRoutes(app: Express) {
  app.post(
    "/api/upload",
    requireAuth,
    upload.array("files", 10),
    (req, res) => {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const urls = files.map((f) => `/uploads/${f.filename}`);
      res.json({ urls });
    },
  );
}

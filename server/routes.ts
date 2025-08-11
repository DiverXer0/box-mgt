import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBoxSchema, insertItemSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const unlinkAsync = promisify(fs.unlink);

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads", "receipts");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, and GIF files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/", (req, res) => {
    res.json({ message: "Box Management API is running" });
  });

  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Box routes
  app.get("/api/boxes", async (req, res) => {
    try {
      const boxes = await storage.getBoxes();
      res.json(boxes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get boxes" });
    }
  });

  app.get("/api/boxes/:id", async (req, res) => {
    try {
      const box = await storage.getBox(req.params.id);
      if (!box) {
        return res.status(404).json({ message: "Box not found" });
      }
      res.json(box);
    } catch (error) {
      res.status(500).json({ message: "Failed to get box" });
    }
  });

  app.post("/api/boxes", async (req, res) => {
    try {
      const boxData = insertBoxSchema.parse(req.body);
      const box = await storage.createBox(boxData);
      res.status(201).json(box);
    } catch (error) {
      if (error instanceof Error && error.message.includes('parse')) {
        return res.status(400).json({ message: "Invalid box data" });
      }
      res.status(500).json({ message: "Failed to create box" });
    }
  });

  app.put("/api/boxes/:id", async (req, res) => {
    try {
      const boxData = insertBoxSchema.partial().parse(req.body);
      const box = await storage.updateBox(req.params.id, boxData);
      if (!box) {
        return res.status(404).json({ message: "Box not found" });
      }
      res.json(box);
    } catch (error) {
      if (error instanceof Error && error.message.includes('parse')) {
        return res.status(400).json({ message: "Invalid box data" });
      }
      res.status(500).json({ message: "Failed to update box" });
    }
  });

  app.delete("/api/boxes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBox(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Box not found" });
      }
      res.json({ message: "Box deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete box" });
    }
  });

  // Item routes
  app.get("/api/boxes/:boxId/items", async (req, res) => {
    try {
      const items = await storage.getBoxItems(req.params.boxId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get items" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to get item" });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      const item = await storage.createItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof Error && error.message.includes('parse')) {
        return res.status(400).json({ message: "Invalid item data" });
      }
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.put("/api/items/:id", async (req, res) => {
    try {
      const itemData = insertItemSchema.partial().parse(req.body);
      const item = await storage.updateItem(req.params.id, itemData);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof Error && error.message.includes('parse')) {
        return res.status(400).json({ message: "Invalid item data" });
      }
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Delete receipt file if it exists
      if (item.receiptFilename) {
        const filePath = path.join(uploadDir, item.receiptFilename);
        try {
          await unlinkAsync(filePath);
        } catch (error) {
          console.warn(`Failed to delete receipt file: ${filePath}`);
        }
      }

      const deleted = await storage.deleteItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Receipt file operations
  app.post("/api/items/:id/receipt", upload.single('receipt'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const item = await storage.updateItem(req.params.id, {
        receiptFilename: req.file.filename
      });

      if (!item) {
        // Clean up uploaded file if item doesn't exist
        await unlinkAsync(req.file.path);
        return res.status(404).json({ message: "Item not found" });
      }

      res.json({ message: "Receipt uploaded successfully", filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload receipt" });
    }
  });

  app.get("/api/items/:id/receipt", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item || !item.receiptFilename) {
        return res.status(404).json({ message: "Receipt not found" });
      }

      const filePath = path.join(uploadDir, item.receiptFilename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Receipt file not found" });
      }

      res.sendFile(filePath);
    } catch (error) {
      res.status(500).json({ message: "Failed to download receipt" });
    }
  });

  app.delete("/api/items/:id/receipt", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item || !item.receiptFilename) {
        return res.status(404).json({ message: "Receipt not found" });
      }

      const filePath = path.join(uploadDir, item.receiptFilename);
      try {
        await unlinkAsync(filePath);
      } catch (error) {
        console.warn(`Failed to delete receipt file: ${filePath}`);
      }

      await storage.updateItem(req.params.id, { receiptFilename: null });
      res.json({ message: "Receipt deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete receipt" });
    }
  });

  // Search
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        return res.json({ boxes: [], items: [] });
      }

      const results = await storage.searchBoxesAndItems(query.trim());
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

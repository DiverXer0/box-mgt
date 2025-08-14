import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBoxSchema, insertItemSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import archiver from "archiver";
import yauzl from "yauzl";
import { pipeline } from "stream/promises";

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

  // Backup and Restore endpoints
  app.post("/api/backup/full", async (req, res) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupFileName = `box-management-backup-${timestamp}.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${backupFileName}"`);

      const archive = archiver('zip', { zlib: { level: 9 } });
      
      archive.on('error', (err) => {
        console.error('Archive error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Backup failed' });
        }
      });

      archive.pipe(res);

      // Add database file
      const dbPath = path.join(process.cwd(), 'data', 'boxes.db');
      if (fs.existsSync(dbPath)) {
        archive.file(dbPath, { name: 'data/boxes.db' });
      }

      // Add uploads directory
      const uploadsPath = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(uploadsPath)) {
        archive.directory(uploadsPath, 'uploads');
      }

      // Add metadata
      const metadata = {
        created: new Date().toISOString(),
        version: '1.0.0',
        type: 'full-backup'
      };
      archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-metadata.json' });

      await archive.finalize();
    } catch (error) {
      console.error('Backup error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Backup failed' });
      }
    }
  });

  // Configure multer for backup uploads  
  const backupUpload = multer({
    dest: path.join(process.cwd(), 'temp'),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
      if (file.originalname.endsWith('.zip')) {
        cb(null, true);
      } else {
        cb(new Error('Only ZIP files are allowed for restore'));
      }
    }
  });

  app.post("/api/restore/full", backupUpload.single('backup'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No backup file uploaded" });
      }

      const tempExtractPath = path.join(process.cwd(), 'temp', `extract-${Date.now()}`);
      fs.mkdirSync(tempExtractPath, { recursive: true });

      // Extract ZIP file
      await new Promise<void>((resolve, reject) => {
        yauzl.open(req.file!.path, { lazyEntries: true }, (err, zipfile) => {
          if (err) return reject(err);
          
          zipfile.readEntry();
          zipfile.on('entry', (entry) => {
            if (/\/$/.test(entry.fileName)) {
              // Directory entry
              const dirPath = path.join(tempExtractPath, entry.fileName);
              fs.mkdirSync(dirPath, { recursive: true });
              zipfile.readEntry();
            } else {
              // File entry
              zipfile.openReadStream(entry, (err, readStream) => {
                if (err) return reject(err);
                
                const filePath = path.join(tempExtractPath, entry.fileName);
                const dirPath = path.dirname(filePath);
                fs.mkdirSync(dirPath, { recursive: true });
                
                const writeStream = fs.createWriteStream(filePath);
                readStream.pipe(writeStream);
                writeStream.on('close', () => zipfile.readEntry());
              });
            }
          });
          
          zipfile.on('end', () => resolve());
          zipfile.on('error', reject);
        });
      });

      // Validate backup metadata
      const metadataPath = path.join(tempExtractPath, 'backup-metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        console.log('Restoring backup created:', metadata.created);
      }

      // Stop any database connections and restore database
      const dbPath = path.join(process.cwd(), 'data', 'boxes.db');
      const backupDbPath = path.join(tempExtractPath, 'data', 'boxes.db');
      
      if (fs.existsSync(backupDbPath)) {
        // Ensure data directory exists
        const dataDir = path.dirname(dbPath);
        fs.mkdirSync(dataDir, { recursive: true });
        
        // Copy database file
        fs.copyFileSync(backupDbPath, dbPath);
      }

      // Restore uploads directory
      const currentUploadsPath = path.join(process.cwd(), 'uploads');
      const backupUploadsPath = path.join(tempExtractPath, 'uploads');
      
      if (fs.existsSync(backupUploadsPath)) {
        // Remove current uploads and replace with backup
        if (fs.existsSync(currentUploadsPath)) {
          fs.rmSync(currentUploadsPath, { recursive: true, force: true });
        }
        
        // Copy uploads directory
        fs.cpSync(backupUploadsPath, currentUploadsPath, { recursive: true });
      }

      // Clean up temporary files
      fs.rmSync(req.file.path, { force: true });
      fs.rmSync(tempExtractPath, { recursive: true, force: true });

      res.json({ message: 'Restore completed successfully' });
    } catch (error) {
      console.error('Restore error:', error);
      
      // Clean up on error
      if (req.file) {
        fs.rmSync(req.file.path, { force: true });
      }
      
      res.status(500).json({ message: 'Restore failed: ' + (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

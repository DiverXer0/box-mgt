import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBoxSchema, insertItemSchema, insertLocationSchema, insertActivityLogSchema, type Location, type ActivityLog } from "@shared/schema";
import { reconnectDatabase } from "./db";
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
      
      // Log activity
      await storage.logActivity({
        action: "create",
        entityType: "box",
        entityId: box.id,
        entityName: box.name,
        details: `Created box: ${box.name} at ${box.location}`
      });
      
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
      
      // Log activity
      await storage.logActivity({
        action: "update",
        entityType: "box",
        entityId: box.id,
        entityName: box.name,
        details: `Updated box: ${box.name}`
      });
      
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
      // Get box info before deletion for logging
      const box = await storage.getBox(req.params.id);
      const deleted = await storage.deleteBox(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Box not found" });
      }
      
      // Log activity
      if (box) {
        await storage.logActivity({
          action: "delete",
          entityType: "box",
          entityId: box.id,
          entityName: box.name,
          details: `Deleted box: ${box.name} from ${box.location}`
        });
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
      
      // Log activity
      await storage.logActivity({
        action: "create",
        entityType: "item",
        entityId: item.id,
        entityName: item.name,
        details: `Added item: ${item.name} (qty: ${item.quantity})`
      });
      
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

      archive.on('warning', (err) => {
        console.warn('Archive warning:', err);
      });

      archive.on('progress', (progress) => {
        console.log('Archive progress:', progress);
      });

      archive.pipe(res);

      // Force SQLite to commit WAL to main database before backup using better-sqlite3
      try {
        const { sqlite } = await import('./db.js');
        const result = sqlite.pragma('wal_checkpoint(FULL)');
        console.log('SQLite WAL checkpoint completed:', result);
        
        // Verify the checkpoint worked by checking if WAL file is now smaller  
        const walPath = path.join(process.cwd(), 'data', 'boxes.db-wal');
        if (fs.existsSync(walPath)) {
          console.log(`WAL file size after checkpoint: ${fs.statSync(walPath).size} bytes`);
        }
      } catch (walError) {
        console.warn('WAL checkpoint failed:', walError);
      }

      // Add database file
      const dbPath = path.join(process.cwd(), 'data', 'boxes.db');
      console.log(`Backup - DB path: ${dbPath}`);
      console.log(`Backup - DB exists: ${fs.existsSync(dbPath)}`);
      if (fs.existsSync(dbPath)) {
        const dbSize = fs.statSync(dbPath).size;
        console.log(`Backup - DB size: ${dbSize} bytes`);
        archive.file(dbPath, { name: 'data/boxes.db' });
        
        // Also backup WAL and SHM files if they exist
        const walPath = dbPath + '-wal';
        const shmPath = dbPath + '-shm';
        
        if (fs.existsSync(walPath)) {
          console.log(`Backup - WAL size: ${fs.statSync(walPath).size} bytes`);
          archive.file(walPath, { name: 'data/boxes.db-wal' });
        }
        
        if (fs.existsSync(shmPath)) {
          console.log(`Backup - SHM size: ${fs.statSync(shmPath).size} bytes`);
          archive.file(shmPath, { name: 'data/boxes.db-shm' });
        }
      } else {
        console.error('Database file not found during backup!');
      }

      // Add uploads directory
      const uploadsPath = path.join(process.cwd(), 'uploads');
      console.log(`Backup - Uploads path: ${uploadsPath}`);
      console.log(`Backup - Uploads exists: ${fs.existsSync(uploadsPath)}`);
      if (fs.existsSync(uploadsPath)) {
        console.log(`Backup - Uploads contents:`, fs.readdirSync(uploadsPath));
        archive.directory(uploadsPath, 'uploads');
      }

      // Add metadata
      const metadata = {
        created: new Date().toISOString(),
        version: '1.0.0',
        type: 'full-backup'
      };
      archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-metadata.json' });

      console.log('Finalizing archive...');
      await archive.finalize();
      console.log('Archive finalized');
    } catch (error) {
      console.error('Backup error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Backup failed' });
      }
    }
  });

  // Configure multer for backup uploads  
  const tempDir = path.join(process.cwd(), 'uploads', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const backupUpload = multer({
    dest: tempDir,
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

      const tempExtractPath = path.join(process.cwd(), 'uploads', 'temp', `extract-${Date.now()}`);
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
      
      // Debug: List extracted contents
      console.log('Extracted contents:', fs.readdirSync(tempExtractPath));
      if (fs.existsSync(path.join(tempExtractPath, 'data'))) {
        console.log('Data directory contents:', fs.readdirSync(path.join(tempExtractPath, 'data')));
      }

      // Restore database files (including WAL files)
      const dbPath = path.join(process.cwd(), 'data', 'boxes.db');
      const backupDbPath = path.join(tempExtractPath, 'data', 'boxes.db');
      
      if (fs.existsSync(backupDbPath)) {
        // Ensure data directory exists
        const dataDir = path.dirname(dbPath);
        fs.mkdirSync(dataDir, { recursive: true });
        
        // Remove all SQLite files (main db, WAL, and SHM files)
        const dbFiles = [
          path.join(dataDir, 'boxes.db'),
          path.join(dataDir, 'boxes.db-wal'), 
          path.join(dataDir, 'boxes.db-shm')
        ];
        
        for (const file of dbFiles) {
          if (fs.existsSync(file)) {
            fs.rmSync(file, { force: true });
          }
        }
        
        // Copy the backup database file
        console.log(`Copying database from ${backupDbPath} to ${dbPath}`);
        console.log(`Backup DB exists: ${fs.existsSync(backupDbPath)}`);
        console.log(`Backup DB size: ${fs.existsSync(backupDbPath) ? fs.statSync(backupDbPath).size : 'N/A'} bytes`);
        
        fs.copyFileSync(backupDbPath, dbPath);
        console.log(`New DB size: ${fs.statSync(dbPath).size} bytes`);
        
        // Also restore WAL and SHM files if they exist in backup
        const backupWalPath = path.join(tempExtractPath, 'data', 'boxes.db-wal');
        const backupShmPath = path.join(tempExtractPath, 'data', 'boxes.db-shm');
        const walPath = dbPath + '-wal';
        const shmPath = dbPath + '-shm';
        
        if (fs.existsSync(backupWalPath)) {
          fs.copyFileSync(backupWalPath, walPath);
          console.log(`Restored WAL file: ${fs.statSync(walPath).size} bytes`);
        }
        
        if (fs.existsSync(backupShmPath)) {
          fs.copyFileSync(backupShmPath, shmPath);
          console.log(`Restored SHM file: ${fs.statSync(shmPath).size} bytes`);
        }
        
        // Reconnect to the database with new data
        reconnectDatabase();
        
        // Reinitialize storage to use the new database connection
        storage.reinitialize();
        
        console.log('Database restored, reconnected, and storage reinitialized successfully');
      }

      // Restore uploads directory
      const currentUploadsPath = path.join(process.cwd(), 'uploads');
      const backupUploadsPath = path.join(tempExtractPath, 'uploads');
      
      if (fs.existsSync(backupUploadsPath)) {
        // Clear current uploads content (but not the directory itself)
        if (fs.existsSync(currentUploadsPath)) {
          const items = fs.readdirSync(currentUploadsPath);
          for (const item of items) {
            const itemPath = path.join(currentUploadsPath, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
              // Skip temp directory we created
              if (item !== 'temp') {
                fs.rmSync(itemPath, { recursive: true, force: true });
              }
            } else {
              fs.rmSync(itemPath, { force: true });
            }
          }
        }
        
        // Copy contents from backup uploads directory
        const backupItems = fs.readdirSync(backupUploadsPath);
        for (const item of backupItems) {
          const sourcePath = path.join(backupUploadsPath, item);
          const destPath = path.join(currentUploadsPath, item);
          
          const stat = fs.statSync(sourcePath);
          if (stat.isDirectory()) {
            fs.cpSync(sourcePath, destPath, { recursive: true });
          } else {
            fs.copyFileSync(sourcePath, destPath);
          }
        }
      }

      // Clean up temporary files
      fs.rmSync(req.file.path, { force: true });
      fs.rmSync(tempExtractPath, { recursive: true, force: true });

      res.json({ message: 'Restore completed successfully. Please refresh the page to see restored data.' });
    } catch (error) {
      console.error('Restore error:', error);
      
      // Clean up on error
      if (req.file) {
        fs.rmSync(req.file.path, { force: true });
      }
      
      res.status(500).json({ message: 'Restore failed: ' + (error as Error).message });
    }
  });

  // Location management routes
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const data = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(data);
      
      // Log activity
      await storage.logActivity({
        action: "create",
        entityType: "location",
        entityId: location.id,
        entityName: location.name,
        details: `Created location: ${location.name}`
      });

      res.status(201).json(location);
    } catch (error) {
      console.error('Error creating location:', error);
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  app.put("/api/locations/:id", async (req, res) => {
    try {
      const data = insertLocationSchema.parse(req.body);
      const location = await storage.updateLocation(req.params.id, data);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Log activity
      await storage.logActivity({
        action: "update",
        entityType: "location",
        entityId: location.id,
        entityName: location.name,
        details: `Updated location: ${location.name}`
      });

      res.json(location);
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.delete("/api/locations/:id", async (req, res) => {
    try {
      const location = await storage.getLocation(req.params.id);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      await storage.deleteLocation(req.params.id);
      
      // Log activity
      await storage.logActivity({
        action: "delete",
        entityType: "location",
        entityId: location.id,
        entityName: location.name,
        details: `Deleted location: ${location.name}`
      });

      res.json({ message: "Location deleted successfully" });
    } catch (error) {
      console.error('Error deleting location:', error);
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  // Activity log routes
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const logs = await storage.getActivityLogs(50); // Get last 50 activities
      res.json(logs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

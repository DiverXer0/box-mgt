import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: express.Express) {
  const distPath = path.resolve(__dirname, "../dist/public");
  const uploadsPath = path.resolve(__dirname, "../uploads");
  
  // Serve static files from dist/public
  app.use(express.static(distPath));
  
  // Serve uploads from uploads directory
  app.use("/uploads", express.static(uploadsPath));
  
  // Serve index.html for all non-API routes (SPA fallback)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
      return next();
    }
    
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export function log(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [express] ${message}`);
}
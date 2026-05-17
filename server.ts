import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import cors from "cors";
import { Readable } from 'stream';
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, uniqueSuffix + '-' + safeName)
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 1024 } // 1GB limit
  });

  app.post("/api/upload", (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error("Multer upload error:", err);
        return res.status(500).json({ error: err.message || "Upload failed" });
      }
      next();
    });
  }, (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({ url: `/uploads/${req.file.filename}` });
  });

  
  app.get('/api/download', async (req, res) => {
    try {
      const url = req.query.url as string;
      const filename = (typeof req.query.filename === "string" ? req.query.filename : null) || "download";

      if (!url || typeof url !== 'string') {
        return res.status(400).send("No URL provided");
      }

      if (url.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), url);
        if (fs.existsSync(localPath)) {
          let downloadName = filename as string;
          const extMatch = localPath.match(/\.[a-zA-Z0-9]+$/);
          if (extMatch && !downloadName.includes('.')) {
            const lowerName = downloadName.toLowerCase();
            if (lowerName === "download" || lowerName === "document" || lowerName === "attachment" || lowerName === "download.zip" || lowerName.startsWith("download")) {
              downloadName += extMatch[0];
            } else {
              downloadName += extMatch[0];
            }
          }
          return res.download(localPath, downloadName);
        }
        return res.status(404).send("Local file not found");
      }

      const fetchUrl = url;

      const fetchResp = await fetch(fetchUrl);
      if (!fetchResp.ok) throw new Error("Failed to fetch remote URL <" + fetchUrl + ">: " + fetchResp.statusText + " (" + fetchResp.status + ")");

      let extractedFilename = filename as string;
      const remoteDisposition = fetchResp.headers.get('content-disposition');
      if (remoteDisposition) {

        const filenameStarMatch = remoteDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        const filenameMatch = remoteDisposition.match(/filename="?([^";]+)"?/i);
        if (filenameStarMatch && filenameStarMatch[1]) {
          extractedFilename = decodeURIComponent(filenameStarMatch[1]);
        } else if (filenameMatch && filenameMatch[1]) {
          extractedFilename = filenameMatch[1];
        }
      }

      if (!extractedFilename) extractedFilename = "download";
      
      const lowerName = extractedFilename.toLowerCase();
      if (lowerName === "download" || lowerName === "document" || lowerName === "attachment" || lowerName === "download.zip" || lowerName.startsWith("download") || !extractedFilename.includes('.')) {
        try {
          const urlObj = new URL(url);
          const decodedPath = decodeURIComponent(urlObj.pathname);
          const parts = decodedPath.split('/');
          const lastPart = parts[parts.length - 1];
          if (lastPart && lastPart.includes('.')) {
            extractedFilename = lastPart;
          }
        } catch (e) {}
      }

      let safeFilename = (extractedFilename || "download").replace(/["\\/]/g, "");

      const contentType = fetchResp.headers.get('content-type') || '';
      if (!safeFilename.includes('.') && contentType) {
        const mimeToExt: Record<string, string> = {
          'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
          'application/pdf': 'pdf', 'application/msword': 'doc', 'text/plain': 'txt',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'application/vnd.ms-excel': 'xls', 'application/csv': 'csv', 'text/csv': 'csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
          'video/mp4': 'mp4', 'audio/mpeg': 'mp3', 'application/zip': 'zip',
          'application/x-zip-compressed': 'zip', 'application/vnd.rar': 'rar',
          'application/x-rar-compressed': 'rar', 'application/octet-stream': 'bin',
          'application/vnd.android.package-archive': 'apk'
        };
        const ext = mimeToExt[contentType.split(';')[0].toLowerCase() as any];
        if (ext) {
          safeFilename += '.' + ext;
        }
      }

      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
      res.setHeader('Content-Type', fetchResp.headers.get('content-type') || 'application/octet-stream');
      
      const contentLength = fetchResp.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
      
      if (fetchResp.body) {
        const readableNodeStream = Readable.fromWeb(fetchResp.body as any);
        readableNodeStream.pipe(res);
      } else {
        res.end();
      }

    } catch (e: any) {
      console.error("Proxy download error:", e);
      res.status(500).send("Download failed: " + (e.message || String(e)));
    }
  });

  app.use('/uploads', express.static(uploadsDir));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {

  });
}

startServer();

const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const proxyCode = `
  app.get('/api/download', async (req, res) => {
    try {
      const url = req.query.url;
      const filename = req.query.filename || "download";

      if (!url || typeof url !== 'string') {
        return res.status(400).send("No URL provided");
      }

      if (url.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), url);
        if (fs.existsSync(localPath)) {
          return res.download(localPath, filename);
        }
        return res.status(404).send("Local file not found");
      }

      const fetchResp = await fetch(url);
      if (!fetchResp.ok) throw new Error("Failed to fetch remote URL: " + fetchResp.statusText);

      res.setHeader('Content-Disposition', \`attachment; filename="\${filename}"\`);
      res.setHeader('Content-Type', fetchResp.headers.get('content-type') || 'application/octet-stream');
      
      const buffer = await fetchResp.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (e) {
      console.error("Proxy download error:", e);
      res.status(500).send("Download failed");
    }
  });
`;

code = code.replace("app.use('/uploads', express.static(uploadsDir));", proxyCode + "\n  app.use('/uploads', express.static(uploadsDir));");

fs.writeFileSync('server.ts', code);
console.log("Server updated");

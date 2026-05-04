
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  
  // API routes can go here if needed in the future

  // Intercept for Google site verification
  app.get('/google46d0fa093843f771.html', (req, res) => {
    res.send('google-site-verification: google46d0fa093843f771.html');
  });

  const isProduction = process.env.NODE_ENV === 'production';
  let vite: any;

  if (!isProduction) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, '.dist');
    app.use(express.static(distPath, { index: false })); // Disable index.html auto-serving so we can intercept it
  }

  // Fallback to index.html for SPA routing and inject dynamic Open Graph tags
  app.get('*', async (req, res) => {
    try {
      let template = '';
      if (!isProduction) {
        // Read index.html from source and apply Vite transforms
        template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
      } else {
        template = await fs.readFile(path.resolve(__dirname, '.dist', 'index.html'), 'utf-8');
      }

      const postId = req.query.postId as string;
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      let ogTitle = "e-Vedhika Portal";
      let ogDescription = "E-Vedhika is a digital portal for rural development and administration.";
      let ogImage = "https://placehold.co/400x400/0d3b66/ffffff/png?text=E-Vedhika";

      if (postId) {
        try {
          const fbConfig = JSON.parse(await fs.readFile(path.resolve(__dirname, 'firebase-applet-config.json'), 'utf-8'));
          const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${fbConfig.projectId}/databases/(default)/documents/posts/${postId}`;
          
          const response = await fetch(firestoreUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.fields) {
              if (data.fields.title?.stringValue) {
                ogTitle = data.fields.title.stringValue.replace(/🛑🚀/g, '🛑\n🚀').replace(/🛑 🚀/g, '🛑\n🚀');
              }
              
              const contentField = data.fields.content?.stringValue || data.fields.message?.stringValue || data.fields.text?.stringValue || data.fields.desc?.stringValue || data.fields.msg?.stringValue;
              if (contentField) {
                ogDescription = contentField.substring(0, 150) + '...';
              }

              if (data.fields.mediaUrl?.stringValue && !data.fields.mediaUrl.stringValue.startsWith('data:')) {
                ogImage = data.fields.mediaUrl.stringValue;
              }
            }
          }
        } catch (e) {
          console.error("Error fetching post data for Open Graph tags:", e);
        }
      }

      // Inject tags before </head>
      const ogTags = `
        <meta property="og:title" content="${ogTitle.replace(/"/g, '&quot;')}" />
        <meta property="og:description" content="${ogDescription.replace(/"/g, '&quot;')}" />
        <meta property="og:image" content="${ogImage}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${protocol}://${req.get('host')}${req.originalUrl}" />
        <meta name="twitter:card" content="summary_large_image" />
      `;

      template = template.replace('<title>E-Vedhika Portal</title>', `<title>${ogTitle.replace(/"/g, '&quot;')}</title>`);
      template = template.replace('</head>', `${ogTags}\n</head>`);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      if (e instanceof Error) {
        vite?.ssrFixStacktrace(e);
        console.error(e.stack);
        res.status(500).end(e.stack);
      }
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();


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
  app.post('/api/admin/restart', (req, res) => {
    res.json({ success: true, message: 'Server is restarting...' });
    setTimeout(() => {
      console.log('Restarting server as requested via Admin Panel...');
      process.exit(0);
    }, 1000);
  });

  // Intercept for Google site verification
  app.get('/google46d0fa093843f771.html', (req, res) => {
    res.send('google-site-verification: google46d0fa093843f771.html');
  });

  const isProduction = process.env.NODE_ENV === 'production';
  let vite: any;

  if (!isProduction) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
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
      const problemId = req.query.problemId as string;
      const suggestionId = req.query.suggestionId as string;
      const requestId = req.query.requestId as string;

      const targetId = postId || problemId || suggestionId || requestId;
      const targetCollection = postId ? 'posts' : problemId ? 'problems' : suggestionId ? 'suggestions' : requestId ? 'requests' : null;

      const protocol = req.get('x-forwarded-proto') || req.protocol;
      let ogTitle = "E-Vedhika Portal";
      let ogDescription = "E-Vedhika All problems one solution";
      let ogImage = "https://placehold.co/1200x630/0d3b66/ffffff/png?text=E-Vedhika";

      if (targetId && targetCollection) {
        try {
          const fbConfig = JSON.parse(await fs.readFile(path.resolve(__dirname, 'firebase-applet-config.json'), 'utf-8'));
          const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${fbConfig.projectId}/databases/(default)/documents/${targetCollection}/${targetId}`;
          
          const response = await fetch(firestoreUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.fields) {
              // Title extraction
              const titleField = data.fields.title?.stringValue || data.fields.subject?.stringValue || data.fields.name?.stringValue || (postId ? 'Community Post' : targetCollection === 'problems' ? 'Problem Report' : 'Portal Update');
              ogTitle = titleField.replace(/[\r\n]+/g, ' ').replace(/ +/g, ' ').trim();
              
              // Description extraction
              const contentField = data.fields.content?.stringValue || data.fields.message?.stringValue || data.fields.text?.stringValue || data.fields.desc?.stringValue || data.fields.msg?.stringValue || data.fields.description?.stringValue;
              if (contentField) {
                const plainText = contentField.replace(/[#*`]/g, '').replace(/[\r\n]+/g, ' ').replace(/ +/g, ' ').substring(0, 160).trim();
                ogDescription = plainText + (contentField.length > 160 ? '...' : '');
              }

              // Image extraction
              if (data.fields.mediaUrl?.stringValue && !data.fields.mediaUrl.stringValue.startsWith('data:')) {
                ogImage = data.fields.mediaUrl.stringValue;
              } else if (data.fields.imageUrl?.stringValue && !data.fields.imageUrl.stringValue.startsWith('data:')) {
                ogImage = data.fields.imageUrl.stringValue;
              } else {
                ogImage = "https://placehold.co/1200x630/0d3b66/ffffff/png?text=E-Vedhika";
              }
            }
          }
        } catch (e) {
          console.error("Error fetching data for Open Graph tags:", e);
        }
      }

      // Prepare tags
      const sanitizedTitle = ogTitle.replace(/"/g, '&quot;');
      const sanitizedDesc = ogDescription.replace(/"/g, '&quot;');
      
      const ogTags = `
        <title>${sanitizedTitle}</title>
        <meta name="description" content="${sanitizedDesc}" />
        <meta property="og:site_name" content="E-Vedhika" />
        <meta property="og:title" content="${sanitizedTitle}" />
        <meta property="og:description" content="${sanitizedDesc}" />
        <meta property="og:image" content="${ogImage}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${protocol}://${req.get('host')}${req.originalUrl}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${sanitizedTitle}" />
        <meta name="twitter:description" content="${sanitizedDesc}" />
        <meta name="twitter:image" content="${ogImage}" />
      `;

      // Use regex to replace title and description tags if they exist
      template = template.replace(/<title>.*?<\/title>/gi, '');
      template = template.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, '');
      template = template.replace(/<meta\s+property="og:.*?"\s+content=".*?"\s*\/?>/gi, '');
      template = template.replace(/<meta\s+name="twitter:.*?"\s+content=".*?"\s*\/?>/gi, '');
      
      // Inject tags before </head>
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

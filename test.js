var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_promises = __toESM(require("fs/promises"), 1);
const import_meta = {};
const __filename = (0, import_url.fileURLToPath)(import_meta.url);
const __dirname = import_path.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  app.post("/api/admin/restart", (req, res) => {
    res.json({ success: true, message: "Server is restarting..." });
    setTimeout(() => {
      console.log("Restarting server as requested via Admin Panel...");
      process.exit(0);
    }, 1e3);
  });
  app.get("/google46d0fa093843f771.html", (req, res) => {
    res.send("google-site-verification: google46d0fa093843f771.html");
  });
  const isProduction = false;
  let vite;
  if (!isProduction) {
    vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "custom"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.resolve(__dirname, ".dist");
    app.use(import_express.default.static(distPath, { index: false }));
  }
  app.get("*", async (req, res) => {
    try {
      let template = "";
      if (!isProduction) {
        template = await import_promises.default.readFile(import_path.default.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
      } else {
        template = await import_promises.default.readFile(import_path.default.resolve(__dirname, ".dist", "index.html"), "utf-8");
      }
      const postId = req.query.postId;
      const problemId = req.query.problemId;
      const suggestionId = req.query.suggestionId;
      const requestId = req.query.requestId;
      const targetId = postId || problemId || suggestionId || requestId;
      const targetCollection = postId ? "posts" : problemId ? "problems" : suggestionId ? "suggestions" : requestId ? "requests" : null;
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      let ogTitle = "E-Vedhika Portal";
      let ogDescription = "E-Vedhika is a digital portal for rural development and administration.";
      let ogImage = "https://placehold.co/1200x630/0d3b66/ffffff/png?text=E-Vedhika";
      if (targetId && targetCollection) {
        try {
          const fbConfig = JSON.parse(await import_promises.default.readFile(import_path.default.resolve(__dirname, "firebase-applet-config.json"), "utf-8"));
          const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${fbConfig.projectId}/databases/(default)/documents/${targetCollection}/${targetId}`;
          const response = await fetch(firestoreUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.fields) {
              const titleField = data.fields.title?.stringValue || data.fields.subject?.stringValue || data.fields.name?.stringValue || (postId ? "Community Post" : targetCollection === "problems" ? "Problem Report" : "Portal Update");
              ogTitle = titleField.replace(/🛑🚀/g, "\u{1F6D1}\n\u{1F680}").replace(/🛑 🚀/g, "\u{1F6D1}\n\u{1F680}");
              const contentField = data.fields.content?.stringValue || data.fields.message?.stringValue || data.fields.text?.stringValue || data.fields.desc?.stringValue || data.fields.msg?.stringValue || data.fields.description?.stringValue;
              if (contentField) {
                const plainText = contentField.replace(/[#*`]/g, "").substring(0, 160).trim();
                ogDescription = plainText + (contentField.length > 160 ? "..." : "");
              }
              if (data.fields.mediaUrl?.stringValue && !data.fields.mediaUrl.stringValue.startsWith("data:")) {
                ogImage = data.fields.mediaUrl.stringValue;
              } else if (data.fields.imageUrl?.stringValue && !data.fields.imageUrl.stringValue.startsWith("data:")) {
                ogImage = data.fields.imageUrl.stringValue;
              }
            }
          }
        } catch (e) {
          console.error("Error fetching data for Open Graph tags:", e);
        }
      }
      const sanitizedTitle = ogTitle.replace(/"/g, "&quot;");
      const sanitizedDesc = ogDescription.replace(/"/g, "&quot;");
      const ogTags = `
        <title>${sanitizedTitle}</title>
        <meta name="description" content="${sanitizedDesc}" />
        <meta property="og:title" content="${sanitizedTitle}" />
        <meta property="og:description" content="${sanitizedDesc}" />
        <meta property="og:image" content="${ogImage}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${protocol}://${req.get("host")}${req.originalUrl}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${sanitizedTitle}" />
        <meta name="twitter:description" content="${sanitizedDesc}" />
        <meta name="twitter:image" content="${ogImage}" />
      `;
      template = template.replace(/<title>.*?<\/title>/i, "");
      template = template.replace(/<meta name="description" content=".*?" \/?>/i, "");
      template = template.replace("</head>", `${ogTags}
</head>`);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (e instanceof Error) {
        vite?.ssrFixStacktrace(e);
        console.error(e.stack);
        res.status(500).end(e.stack);
      }
    }
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();

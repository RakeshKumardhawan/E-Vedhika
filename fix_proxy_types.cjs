const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const filename = req\.query\.filename \|\| "download";/, 'const filename = (typeof req.query.filename === "string" ? req.query.filename : null) || "download";');
// the problem was `req.query.filename` can be an array in Express
// the res.download requires string
code = code.replace(/return res\.download\(localPath, filename\);/, 'return res.download(localPath, filename as string);');

code = code.replace(/const url = req\.query\.url;/, 'const url = req.query.url as string;');

fs.writeFileSync('server.ts', code);
console.log("Server fixed");

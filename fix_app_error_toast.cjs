const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/addToast\(\s*(["'].*?["']\s*\+\s*)?err\.message\s*\)/g, 'addToast(getFriendlyError(err))');
content = content.replace(/addToast\(err\.message\)/g, 'addToast(getFriendlyError(err))');

fs.writeFileSync('src/App.tsx', content);

let contentGos = fs.readFileSync('src/GosAndFormats.tsx', 'utf8');
contentGos = contentGos.replace(/addToast\(\s*(["'].*?["']\s*\+\s*)?(error|err)\.message\s*\)/g, 'addToast(getFriendlyError($2))');
contentGos = contentGos.replace(/addToast\((error|err)\.message\)/g, 'addToast(getFriendlyError($1))');
fs.writeFileSync('src/GosAndFormats.tsx', contentGos);
console.log("Replaced!");

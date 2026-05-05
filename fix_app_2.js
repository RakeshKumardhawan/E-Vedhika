
const fs = require('fs');
const filePath = 'src/App.tsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');
// Line 6653 is index 6652.
// Line 6679 is index 6678.
lines.splice(6652, 6679 - 6653 + 1);
fs.writeFileSync(filePath, lines.join('\n'));
console.log("Successfully removed lines.");

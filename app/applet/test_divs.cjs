const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

let openDivs = 0;
for (let i = 14862; i < 15250; i++) {
  const line = lines[i];
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  openDivs += opens - closes;
  if(openDivs < 0) { console.log(`Closed at ${i + 1}`); openDivs = 0; }
  if (opens > 0 || closes > 0) {
      console.log(`${i+1}: OPENS: ${opens}, CLOSES: ${closes}, TOTAL: ${openDivs} -> ${line.trim()}`);
  }
}

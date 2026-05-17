import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/w-\[900px\]/g, 'w-full');
content = content.replace(/style=\{\{ width: '900px', fontSize: '10px', lineHeight: '14px', height: '80\.9688px' \}\}/g, 'style={{ width: "100%" }}');
content = content.replace(/style=\{\{ background: 'linear-gradient\(to bottom, #2b88d8 0%, #1565c0 100%\)', paddingTop: '10px', paddingLeft: '10px', paddingRight: '0px', height: '54\.6667px' \}\}/g, 'style={{ background: "linear-gradient(to bottom, #2b88d8 0%, #1565c0 100%)", padding: "10px" }}');

fs.writeFileSync('src/App.tsx', content);
console.log('Done');

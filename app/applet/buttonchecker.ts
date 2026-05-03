import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<button') && !lines[i].includes('aria-label') && !lines[i].includes('title=')) {
        console.log(`${i+1}: ${lines[i].trim()}`);
    }
}

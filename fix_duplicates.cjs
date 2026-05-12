const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = '{activeSubTab === "builder" && (';
let idx1 = content.indexOf(targetStr);
let idx2 = content.indexOf(targetStr, idx1 + 1);

if (idx2 !== -1) {
  let trashIdx = content.indexOf('{activeSubTab === "trash" && (', idx2);
  if (trashIdx !== -1) {
    content = content.substring(0, idx2) + content.substring(trashIdx);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Removed duplicate!");
  } else {
    console.log("Error: Trash tab not found after duplicate.");
  }
} else {
  console.log("Duplicate not found.");
}

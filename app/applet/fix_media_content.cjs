const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const startTarget = '        <div>\n          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">\n            Media Content\n          </label>';
const endTarget = '                  Autosized for optimized upload. All formats supported.\n                </p>\n              </div>\n            )}\n          </div>\n';

const startIndex = content.indexOf(startTarget);
if (startIndex !== -1) {
    const endIndex = content.indexOf(endTarget, startIndex);
    if (endIndex !== -1) {
        const toDelete = content.substring(startIndex, endIndex + endTarget.length);
        content = content.replace(toDelete, '');
        fs.writeFileSync('src/App.tsx', content);
        console.log("Deleted media content block!");
    } else {
        console.log("End target not found!");
    }
} else {
    console.log("Start target not found!");
}

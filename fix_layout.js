import fs from 'fs';

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = `      {post.content && post.content.length > 200 && !isExpanded && (\n        <button`;
const endStr = `      <div className="flex flex-wrap gap-4 justify-between items-center pt-6 border-t border-slate-100 mt-6">\n        <div className="flex items-center gap-6">`;

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find start or end index.");
  process.exit(1);
}

const blockToMove = content.substring(startIndex, endIndex);

// Remove blockToMove
content = content.substring(0, startIndex) + content.substring(endIndex);

// We need to insert `blockToMove` inside the TechSpot LHS
// The TechSpot LHS ends just before `<div className="w-full md:w-[280px] lg:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8 flex flex-col">`
const techspotTargetStr = `            <div className="w-full md:w-[280px] lg:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8 flex flex-col">`;
const techspotInsertIndex = content.indexOf(techspotTargetStr);

if (techspotInsertIndex !== -1) {
   // The closing </div> for flex-1 min-w-0 is right before techspotTargetStr
   // Actually, let's just insert it right before the closing </div>
   // Let's find "</div>\n\n            <div className=\"w-full md:w-[280px]"
   const techspotEndLhs1 = content.lastIndexOf(`            </div>`, techspotInsertIndex);
   content = content.substring(0, techspotEndLhs1) + blockToMove + `\n` + content.substring(techspotEndLhs1);
}

// And also insert it at the end of the non-TechSpot branch
// Which is right before:
// `         </>\n      )}`
// Let's find that.
const defaultStr = `         </>\n      )}`;
const defaultInsertIndex = content.indexOf(defaultStr, techspotInsertIndex + blockToMove.length);

if (defaultInsertIndex !== -1) {
  content = content.substring(0, defaultInsertIndex) + blockToMove + `\n` + content.substring(defaultInsertIndex);
}

fs.writeFileSync(file, content);
console.log("Feed view fixed");

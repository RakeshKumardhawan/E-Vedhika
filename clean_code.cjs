const fs = require('fs');

const cleanFile = (filepath) => {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Remove standalone console.log statements
    content = content.replace(/^[ \t]*console\.log\(.*?\)[;]?\s*$/gm, '');
    
    // Remove standalone // comments
    // Matches lines that have only whitespace followed by // and then anything.
    // We make sure it's not a Next.js or React directive like // @ts-ignore
    content = content.replace(/^[ \t]*\/\/(?! @ts-ignore)(?!\/)(?! eslint).*$/gm, '');

    // Remove empty line blocks caused by the cleanup (3 or more newlines become 2)
    content = content.replace(/\n{3,}/g, '\n\n');

    fs.writeFileSync(filepath, content);
};

['src/App.tsx', 'src/GosAndFormats.tsx', 'src/ExcelPrinterTool.tsx', 'src/services/geminiService.ts', 'server.ts'].forEach(cleanFile);
console.log("Cleanup done.");

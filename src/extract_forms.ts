import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

const formsHubLines = lines.slice(5122, 5238);
const newContent = `import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Search, ExternalLink, Download } from 'lucide-react';
import { FORMS_DATA } from '../data/docsData';
import { requireLoginAlert } from '../App';

export default ` + formsHubLines.join('\n');

fs.writeFileSync('src/pages/FormsHubScreen.tsx', newContent);

const updatedApp = lines.slice(0, 5122).join('\n') + '\n\nconst FormsHub = lazy(() => import("./pages/FormsHubScreen"));\n\n' + lines.slice(5238).join('\n');
fs.writeFileSync('src/App.tsx', updatedApp);
console.log('done forms hub');

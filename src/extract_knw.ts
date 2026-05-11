import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

const knwHubLines = lines.slice(6967, 7214);
const newContent = `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, AlertTriangle, Lightbulb, MapPin, Scale, Users, LayoutDashboard, Share2, CornerDownRight } from 'lucide-react';
` + knwHubLines.join('\n') + `\n\nexport { KnowledgeHubSection, PRActHub };`;

fs.writeFileSync('src/pages/KnowledgeHubScreen.tsx', newContent);

const updatedApp = lines.slice(0, 6967).join('\n') + '\n\nconst KnowledgeHubSection = lazy(() => import("./pages/KnowledgeHubScreen").then(m => ({ default: m.KnowledgeHubSection })));\nconst PRActHub = lazy(() => import("./pages/KnowledgeHubScreen").then(m => ({ default: m.PRActHub })));\n\n' + lines.slice(7214).join('\n');
fs.writeFileSync('src/App.tsx', updatedApp);
console.log('done knw hub');

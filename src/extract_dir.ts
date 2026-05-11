import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

const directorySectionLines = lines.slice(5238, 5395);
const newContent = `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, User, Building, Flag } from 'lucide-react';
import Swal from 'sweetalert2';
import { UserProfile } from '../App';

export default ` + directorySectionLines.join('\n');

fs.writeFileSync('src/pages/DirectoryScreen.tsx', newContent);

const updatedApp = lines.slice(0, 5238).join('\n') + '\n\nconst DirectorySection = lazy(() => import("./pages/DirectoryScreen"));\n\n' + lines.slice(5395).join('\n');
fs.writeFileSync('src/App.tsx', updatedApp);
console.log('done');

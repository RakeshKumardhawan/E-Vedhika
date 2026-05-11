import fs from 'fs';

const admin = fs.readFileSync('src/pages/AdminPanelScreen.tsx', 'utf-8');
fs.writeFileSync('src/pages/AdminPanelScreen.tsx', admin.replace(/loadHeavyModules\(\)/g, 'loadHeavyModulesAdmin()'));

const ws = fs.readFileSync('src/pages/WorkspaceScreen.tsx', 'utf-8');
fs.writeFileSync('src/pages/WorkspaceScreen.tsx', ws.replace(/loadHeavyModules\(\)/g, 'loadHeavyModulesWorkspace()'));

console.log('done fixing modules');

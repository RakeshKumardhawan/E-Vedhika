import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

const wsLines = lines.slice(5036, 6475);
const newContent = `import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Share2, BarChart3, Layers, GraduationCap, Book, FileText, Download, CheckCircle, Upload, Search, Users, Eye, Building2, UserCheck, XCircle, ArrowRight, Play, UploadCloud, Clock, ShieldCheck, Mail, MapPin } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import Swal from 'sweetalert2';
import { PR_ACT_DB, PRSection } from '../data/prActData';
import { handleShare } from '../App';
import { User as FirebaseUser } from 'firebase/auth';

export default ` + wsLines.join('\n');

fs.writeFileSync('src/pages/WorkspaceScreen.tsx', newContent);

const updatedApp = lines.slice(0, 5036).join('\n') + '\n\nconst DigitalWorkspaceSection = lazy(() => import("./pages/WorkspaceScreen"));\n\n' + lines.slice(6475).join('\n');
fs.writeFileSync('src/App.tsx', updatedApp);
console.log('done workspace');

import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

const adminLines = lines.slice(3204, 5036);
const newContent = `import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, MapPin, Search, Download, Trash2, ArrowLeft, Loader2, Send } from 'lucide-react';
import { AlertCircle, FileText, CheckCircle2, MessageSquare, AlertOctagon, Info, Flag, Building, User, Users, ClipboardList, Clock, Zap, Hash, X } from 'lucide-react';
import Swal from 'sweetalert2';
import * as Tooltip from '@radix-ui/react-tooltip';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, handleFirestoreError, OperationType, LocationManager, getValidTime } from '../App';

export default ` + adminLines.join('\n');

fs.writeFileSync('src/pages/AdminPanelScreen.tsx', newContent);

const updatedApp = lines.slice(0, 3204).join('\n') + '\n\nconst AdminPanel = lazy(() => import("./pages/AdminPanelScreen"));\n\n' + lines.slice(5036).join('\n');
fs.writeFileSync('src/App.tsx', updatedApp);
console.log('done admin');

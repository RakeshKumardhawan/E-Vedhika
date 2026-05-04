/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bell, Menu, X, Home, Megaphone, FileText, Wheat, Vote, 
  Wallet, Building, MessageCircle, Handshake, Lightbulb, 
  AlertTriangle, Send, LogOut, ChevronDown, ChevronUp, Search, Filter,
  Eye, Heart, Share2, PlusCircle, Camera, User, Edit2, Save,
  Activity, Book, GraduationCap, BarChart3, Database, Download, Bot, MessageSquare,
  Trash2, Edit3, Settings, TrendingUp, Upload, Play, RefreshCw, Layers, Calendar, LayoutDashboard, ShieldAlert, Lock, Shield, Pin,
  Users, AlertOctagon, CheckCircle2, CheckCircle, ClipboardList, Zap, Clock, ArrowLeft, Loader2, XCircle, ChevronRight, Flag, ShieldCheck, Info, Hash, EyeOff, Rocket, Mail, RotateCcw
} from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
// Lazy loaded modules
let XLSX: any = null;
let jsPDF: any = null;
let autoTable: any = null;

const loadHeavyModules = async () => {
  if (!XLSX) XLSX = await import('xlsx');
  if (!jsPDF) {
    const j = await import('jspdf');
    jsPDF = j.default || j.jsPDF;
  }
  if (!autoTable) {
    const a = await import('jspdf-autotable');
    autoTable = a.default;
  }
};
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { 
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  GoogleAuthProvider, signInWithPopup, updateProfile, User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDocs,
  increment, arrayUnion, query, orderBy, limit, setDoc, getDoc, where,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from "../firebase";
import { GoogleGenAI } from "@google/genai";

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase connection check: Client is offline");
      // We don't want to spam alerts on every page load, but we can log it.
    }
  }
}
testConnection();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }

  const lowerErr = errInfo.error.toLowerCase();
  
  // Show the error in the console
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (lowerErr.includes('permission') || lowerErr.includes('insufficient')) {
      console.warn(`PERMISSION ERROR ON PATH: ${path}. User might need to update Firebase Security Rules for this collection.`);
  }

  // We MUST throw or handle this so it shows up in the UI (we'll let the user know directly)
  throw new Error(JSON.stringify(errInfo));
}

const logUserActivity = async (actionDesc: string) => {
  if (!auth.currentUser) return;
  try {
    const userDisplay = auth.currentUser.email || auth.currentUser.displayName || auth.currentUser.uid || 'Registered User';
    await addDoc(collection(db, 'security_logs'), {
      admin: userDisplay,
      action: actionDesc,
      time: Date.now()
    });
  } catch (e) {}
};

function EVAnimatedLogo({ size = 64 }: { size?: number }) {
  const scale = size / 64;
  return (
    <div className="logo-pro transition-transform hover:scale-105 active:scale-95 duration-200" style={{ transform: `scale(${scale})` }}>
      <div className="logo-particles">
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <svg viewBox="0 0 64 64" width="64" height="64">
        <defs>
          <linearGradient id="modal-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22c55e"/>
            <stop offset="100%" stopColor="#0ea5e9"/>
          </linearGradient>
          <linearGradient id="modal-ringG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22c55e"/>
            <stop offset="50%" stopColor="#facc15"/>
            <stop offset="100%" stopColor="#0ea5e9"/>
          </linearGradient>
        </defs>
        
        <circle className="logo-ring" cx="32" cy="32" r="29" fill="none" stroke="url(#modal-ringG)" strokeWidth="2.5" strokeDasharray="10 5"/>
        <circle cx="32" cy="32" r="25" fill="url(#modal-g)"/>
        <circle cx="32" cy="32" r="21" fill="#0d3b66"/>
        <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="900" fontFamily="Segoe UI">EV</text>
      </svg>
    </div>
  );
}

export function requireLoginAlert(userObj?: any): boolean {
  const account = userObj || auth.currentUser;
  if (!account || account.isAnonymous) {
    Swal.fire({
      text: "లాగిన్ అయ్యాక మీకు యాక్సెస్ ఉంటుంది",
      icon: "info",
      confirmButtonText: "సరే (OK)",
      confirmButtonColor: "#0d3b66"
    });
    return true;
  }
  return false;
}

function formatDistanceToNow(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

// --- TYPES ---
interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  subCategory?: string;
  mediaUrl?: string;
  mediaType?: string;
  likes: number;
  views: number;
  comments: Comment[];
  commentCount?: number;
  likedBy?: string[];
  userName?: string;
  userPhoto?: string;
  time: number;
  uid: string;
  status?: string;
  pinned?: boolean;
}

interface Comment {
  user: string;
  msg: string;
  time: number;
}

interface UserProfile {
  id: string;
  username: string;
  surname?: string;
  name?: string;
  designation?: string;
  gender?: string;
  status?: string;
  state?: string;
  district?: string;
  mandal?: string;
  village?: string;
  mobile?: string;
  email?: string;
  photoURL?: string;
  office?: string;
  role?: string;
  hidden?: boolean;
  time: number;
}

const TELANGANA_DATA: Record<string, string[]> = {
  "Adilabad": ["Adilabad","Bazarhathnoor","Bela","Bheempur","Bhoraj","Boath","Gadiguda","Gudihathnur","Ichoda","Inderavelly","Jainad","Mavala","Narnoor","Neradigonda","Sirikonda","Sathnala","Sonala","Talamadugu","Tamsi","Utnur"],
  "Bhadradri Kothagudem": ["Allapalli","Annapureddypalli","Aswapuram","Aswaraopeta","Bhadrachalam","Burgampadu","Chandrugonda","Cherla","Chunchupalli","Dammapeta","Dummugudem","Gundala","Julurpad","Karakagudem","Laxmidevipalli","Manuguru","Mulakalapalle","Palawancha","Pinapaka","Sujathanagar","Tekulapalle","Yellandu"],
  "Hanumakonda": ["Atmakur","Bheemadevarpalle","Damera","Dharmasagar","Elkathurthi","Hasanparthy","Inavolue","Kamalapur","Nadikuda","Parkal","Shayampet","Velair"],
  "Jagtial": ["Bheemaram","Bheerpur","Buggaram","Dharmapuri","Endapalli","Gollapalle","Ibrahimpatnam","Jagitial Rural","Jagtial","Kathlapur","Kodimial","Korutla","Mallapur","Mallial","Medipalle","Metpalle","Pegadapalle","Raikal","Sarangapur","Velgatoor"],
  "Jangaon": ["Bachannapeta","Chilpur","Devaruppula","Ghanpur(Stn)","Jangaon","Kodakandla","Lingala Ghanpur","Narmetta","Palakurthi","Raghunatha Palle","Tharigoppula","Zaffergadh"],
  "Karimnagar": ["Chigurumamidi","Choppadandi","Ellandhakunta","Gangadhara","Ganneruvaram","Huzurabad","Jammikunta","Karimnagar","Kothapally","Manakondur","Ramadugu","Shankarapatnam","Thimmapur","V Saidapur","Veenavanka"],
  "Khammam": ["Bonakal","Chinthakani","Enkuru","Kalluru","Kamepalle","Khammam Rural","Konijerla","Kusumanchi","Madhira","Mudigonda","Nelakondapalle","Penuballi","Raghunadhapalem","Sathupalle","Singareni","Thallada","Thirumalayapalem","Vemsoor","Wyra","Yerrupalem"],
  "Mahabubnagar": ["Addakal","Balanagar","Bhoothpur","Chinna Chinta Kunta","Devarkadara","Gandeed","Hanwada","Jadcherla","Koilkonda","Koukuntla","Mahbubnagar","Midjil","Mohammadabad","Moosapet","Nawabpet","Rajapur"],
  "Mancherial": ["Bellampalle","Bheemaram","Bheemini","Chennur","Dandepalle","Hajipur","Jaipur","Jannaram","Kannepally","Kasipet","Kotapalle","Luxettipet","Mandamarri","Nennal","Tandur","Vemanpalle"],
  "Medak": ["Alladurg","Chegunta","Chilpiched","Havelighanpur","Kowdipalle","Kulcharam","Manoharabad","Masaipet","Medak","Narsapur","Narsingi","Nizampet","Papannapet","Ramayampet","Regode","Shankarampet (A)","Shankarampet (R)","Shivampet","Tekmal","Tupran","Yeldurthy"],
  "Nalgonda": ["Adavidevulapally","Anumula","Chandam Pet","Chandur","Chintha Palle","Chityala","Dameracherla","Devarakonda","Gattuppal","Gudipally","Gundla Palle","Gurrampode","Kangal","Kattangoor","Kethepalle","Kondamallepally","Madugulapally","Marri Guda","Miryalaguda","Munugode","Nakrekal","Nalgonda","Nampalle","Narketpalle","Neredugomma","Nidamanur","Pedda Adiserlapalle","Peddavura","Saligouraram","Thipparthi","Thirumalagiri sagar","Thripuraram","Vemulapalle"],
  "Nizamabad": ["Aloor","Armur","Balkonda","Bheemgal","Bodhan","Chandur","Dhar Palle","Dich Palle","Donkeshwar","Indalwai","Jakranpalle","Kammar Palle","Kotgiri","Makloor","Mendora","Mortad","Mosara","Mugpal","Mupkal","Nandipet","Navipet","Nizamabad","Pothangal","Ranjal","Rudrur","Saloora","Sirkonda","Varni","Velpur","Yeda Palle","Yergatla"],
  "Sangareddy": ["Ameenpur","Andole","Chowtakur","Gummadidala","Hathnoora","Jharasangam","Jinnaram","Kalher","Kandi","Kangti","Kohir","Kondapur","Manoor","Mogadampally","Munpalle","Nagalgidda","Narayankhed","Nizampet","Nyalkal","Patancheru","Pulkal","Raikode","Sadasivpet","Sangareddy","Sirgapur","Vatpally","Zahirabad"],
  "Siddipet": ["AkbarpetNA Bhoompally","Akkannapeta","Bejjanki","Cheriyal","Chinna Kodur","Dhoolmitta","Doultabad","Dubbak","Gajwel","Husnabad","Jagdevpur","Koheda","Komuravelli","Kondapak","Kukunoorpally","Maddur","Markook","Mirdoddi","Mulug","Nanganur","Narayanaraopet","Raipole","Siddipet","Siddipet Rural","Thoguta","Wargal"],
  "Warangal": ["Chennaraopet","Duggondi","Geesugonda","Khanapur","Nallabelly","Narsampet","Nekkonda","Parvathagiri","Raiparthy","Sangem","Wardhannapet"]
};

interface Suggestion {
  id: string;
  name: string;
  author?: string;
  village?: string;
  mobile?: string;
  text?: string;
  msg?: string;
  suggestion?: string;
  category?: string;
  status: string;
  time: number;
  uid?: string;
  resolvedAt?: number;
}

interface ProblemReport {
  id: string;
  msg: string;
  category?: string;
  status?: 'pending' | 'solved' | 'resolved' | 'Deleted';
  time: number;
  uid: string;
  resolvedAt?: number;
}

interface ChatMessage {
  id: string;
  msg: string;
  time: number;
  uid: string;
  userName?: string;
}

interface RequestData {
  id: string;
  msg: string;
  time: number;
  uid: string;
}

interface Update {
  id: string;
  text: string;
  time: number;
  status?: string;
  type?: string;
}

interface Notification {
  id: string;
  uid: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  time: number;
  link?: string;
}

// --- STYLES ---
const APP_STYLES = `
:root {
  --primary: #0d3b66;
  --accent: #fbbf24;
  --success: #16a34a;
  --danger: #dc2626;
  --bg-light: #f1f5f9;
  --google-red: #ea4335;
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

body {
  margin: 0;
  background-color: #f1f5f9;
  color: #1e293b;
}

.brand-title {
  font-family: 'Righteous', cursive;
  font-size: 34px;
  margin: 0;
  letter-spacing: 2px;
  color: var(--accent);
  text-shadow: 2px 2px 0px var(--primary);
}

.sub-tagline {
  margin: 0;
  font-size: 10px;
  font-weight: 800;
  color: #fff;
  opacity: 0.9;
  letter-spacing: 1px;
}

.latest-bar {
  background: #fff;
  padding: 10px 5%;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}
.latest-label {
  background: var(--danger);
  color: #fff;
  padding: 5px 12px;
  border-radius: 4px;
  font-weight: 900;
  font-size: 11px;
  margin-right: 15px;
  white-space: nowrap;
}
.latest-text { flex: 1; overflow: hidden; font-weight: 700; font-size: 14px; color: var(--primary); }
.latest-text span { display: inline-block; white-space: nowrap; animation: scrollLeft 30s linear infinite; }
@keyframes scrollLeft { from { transform: translateX(100%); } to { transform: translateX(-100%); } }

.sidebar-card {
  background: #fff;
  border-radius: 16px;
  padding: 15px;
  box-shadow: var(--card-shadow);
}
.side-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 15px;
  margin-bottom: 2px;
  background: transparent;
  color: #64748b;
  border: 1px solid transparent;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  text-align: left;
  gap: 12px;
}
.side-btn:hover { background: #f1f5f9; color: var(--primary); transform: translateX(5px); }
.side-btn.active-tab {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(13, 59, 102, 0.4);
}
.side-btn-emoji { font-size: 18px; width: 24px; text-align: center; }

.section-card {
  background: #fff;
  border-radius: 20px;
  padding: 15px;
  box-shadow: var(--card-shadow);
  margin-bottom: 20px;
}
@media (min-width: 640px) {
  .section-card {
    padding: 25px;
    margin-bottom: 25px;
  }
}
.section-card {
  border-top: 5px solid var(--primary);
}
.scheme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}
.scheme-card {
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 25px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  border-bottom: 4px solid #e2e8f0;
}
.scheme-card:hover { transform: translateY(-8px); box-shadow: 0 12px 25px rgba(0,0,0,0.08); border-bottom-color: var(--primary); }
.scheme-card h4 { margin: 15px 0 10px; font-size: 19px; color: var(--primary); }
.scheme-card p { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 20px; }
.scheme-link-btn {
  margin-top: auto;
  background: var(--primary);
  color: #fff;
  text-decoration: none;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.msg-bubble {
  padding: 10px 15px;
  border-radius: 15px;
  max-width: 80%;
  font-size: 14px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
.msg-other { background: #fff; border-bottom-left-radius: 2px; align-self: flex-start; color: #334155; }
.msg-me { background: var(--primary); color: #fff; border-bottom-right-radius: 2px; align-self: flex-end; }

.mana-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 15px;
}
@media (min-width: 640px) {
  .mana-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }
}
.mana-card {
  background: #fff;
  border: 1.5px solid #f1f5f9;
  border-radius: 28px;
  padding: 20px 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}
@media (min-width: 640px) {
  .mana-card {
    padding: 35px 25px;
  }
}
.mana-card:hover {
  border-color: var(--primary);
  transform: translateY(-8px);
  box-shadow: 0 15px 35px rgba(13, 59, 102, 0.1);
}
.mana-card h4 {
  font-size: 15px;
  font-weight: 800;
  color: var(--primary);
  margin-top: 15px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
`;

function cleanStringData(val: any) {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function getValidTime(obj: any): number {
  if (!obj) return Date.now();
  if (obj.time) {
    if (typeof obj.time === 'number') return obj.time;
    if (obj.time.seconds) return obj.time.seconds * 1000;
  }
  if (obj.createdAt) {
    if (typeof obj.createdAt === 'number') return obj.createdAt;
    if (obj.createdAt.seconds) return obj.createdAt.seconds * 1000;
  }
  if (obj.timestamp) {
    if (typeof obj.timestamp === 'number') return obj.timestamp;
    if (obj.timestamp.seconds) return obj.timestamp.seconds * 1000;
  }
  if (obj.date) {
    if (typeof obj.date === 'string' || typeof obj.date === 'number') {
      const parsed = new Date(obj.date).getTime();
      if (!isNaN(parsed)) return parsed;
    }
  }
  return Date.now();
}

let globalAudioContext: AudioContext | null = null;

export const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!globalAudioContext) {
      globalAudioContext = new AudioContextClass();
    }
    
    if (globalAudioContext.state === 'suspended') {
      globalAudioContext.resume().catch(() => {});
    }
    
    const playNote = (freq: number, startTime: number, duration: number) => {
      if (!globalAudioContext) return;
      const oscillator = globalAudioContext.createOscillator();
      const gainNode = globalAudioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, globalAudioContext.currentTime + startTime);
      
      gainNode.gain.setValueAtTime(0, globalAudioContext.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.5, globalAudioContext.currentTime + startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, globalAudioContext.currentTime + startTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(globalAudioContext.destination);

      oscillator.start(globalAudioContext.currentTime + startTime);
      oscillator.stop(globalAudioContext.currentTime + startTime + duration);
    };

    playNote(1318.51, 0, 0.4);
    playNote(1760.00, 0.15, 0.6);
  } catch (e) {
    console.error("Audio playback error:", e);
  }
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const postIdFromUrl = searchParams.get('postId');
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'user'>('user');
  const hasGreetedRef = useRef(false);
  const initialUpdatesLoaded = useRef(false);
  const initialPostsLoaded = useRef(false);
  
  const isDevEmail = user?.email?.toLowerCase() === 'rakeshkumardhawan123@gmail.com';
  const isAdmin = userRole === 'admin' || isDevEmail;
  const isEditor = userRole === 'admin' || userRole === 'editor' || isDevEmail;
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [currentFilter, setCurrentFilter] = useState('All');
  const [posts, setPosts] = useState<Post[]>([]);

  // Correct sticky header height coordination
  const headerHeight = "72px";
  const tickerHeight = "44px";
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const approvedSuggestions = suggestions.filter(s => s.status === 'Approved' || s.status === 'approved');
  const [problemsGlobal, setProblemsGlobal] = useState<ProblemReport[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<{ id: number, msg: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showPostForm, setShowPostForm] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isSuggestionsHovered, setIsSuggestionsHovered] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      console.log('App was installed');
      setShowInstallButton(false);
      addToast('యాప్ విజయవంతంగా ఇన్‌స్టాల్ చేయబడింది!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // Optionally, send analytics event with outcome of user choice
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };
  const suggestionsScrollRef = useRef<HTMLDivElement>(null);

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  
  useEffect(() => {
    if (currentTab === 'suggestions' && !sessionStorage.getItem('sawSuggestionAlert')) {
      Swal.fire({
        title: 'e-Vedhika Suggestion Portal',
        text: 'Welcome to e-Vedhika Suggestion Portal! మీ సూచనలను ఇక్కడ నమోదు చేయండి.',
        icon: 'info',
        confirmButtonColor: '#0d3b66',
        confirmButtonText: 'సరే (OK)'
      });
      sessionStorage.setItem('sawSuggestionAlert', 'true');
    }
  }, [currentTab]);
  
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const uArr: UserProfile[] = [];
      snap.forEach(d => uArr.push({ id: d.id, ...d.data() } as UserProfile));
      setAllUsers(uArr.sort((a, b) => (b.time || 0) - (a.time || 0)));
    }, (e) => console.error("Users List Error:", e));
    return () => unsub();
  }, []);

  useEffect(() => {
    let interval: any;
    if (currentTab === 'suggestions' && approvedSuggestions.length > 0 && !isSuggestionsHovered) {
      interval = setInterval(() => {
        const box = suggestionsScrollRef.current;
        if (!box) return;
        
        // Only scroll if there is overflow
        if (box.scrollHeight <= box.clientHeight + 1) return;
        
        box.scrollTop += 1;
        
        // When we reach near the bottom, reset with a loop
        if (box.scrollTop >= box.scrollHeight - box.clientHeight - 1) {
          box.scrollTop = 0;
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [currentTab, approvedSuggestions.length, isSuggestionsHovered]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showForcedProfileSetup, setShowForcedProfileSetup] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [adminLocked, setAdminLocked] = useState(true);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [currentAdminPin, setCurrentAdminPin] = useState('1234');
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'admin_config'));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.pin) setCurrentAdminPin(data.pin);
        }
      } catch (err) { console.error("Error fetching settings:", err); }
    };
    fetchSettings();
  }, []);
  
  useEffect(() => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [currentTab, postIdFromUrl]);

  // Outside click listener for sidebar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // If clicking on the menu toggle button, don't close it immediately 
        // to avoid toggling states conflicting (often handled via stopPropagation, but good to be safe)
        const target = event.target as Element;
        if (!target.closest('.menu-toggle')) {
           setSidebarOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [sidebarOpen]);

  // Body scroll lock for sidebar
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [sidebarOpen]);

  // Styles Injection
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = APP_STYLES;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setUserProfile(null);
        setUserRole('user');
        hasGreetedRef.current = false;
      }
    });
    return () => unsubAuth();
  }, []);

  // Public Listeners
  useEffect(() => {
    const unsubUpdates = onSnapshot(collection(db, 'updates'), (snap) => {
      const uArr: Update[] = [];
      snap.forEach(d => uArr.push({ id: d.id, ...(d.data() as any) } as Update));
      setUpdates(uArr);
      
      if (!initialUpdatesLoaded.current) {
        initialUpdatesLoaded.current = true;
      } else {
        const hasNew = snap.docChanges().some(change => change.type === 'added');
        if (hasNew) {
          playNotificationSound();
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'updates'));
    
    const unsubSuggestions = onSnapshot(collection(db, 'suggestions'), (snap) => {
      const sArr: Suggestion[] = [];
      snap.forEach(d => sArr.push({ id: d.id, ...(d.data() as any) } as Suggestion));
      setSuggestions(sArr.sort((a, b) => (b.time || 0) - (a.time || 0)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'suggestions'));

    const unsubPosts = onSnapshot(query(collection(db, 'posts')), (snap) => {
      const pArr: Post[] = [];
      snap.forEach((d) => {
          const data = d.data() as any;
          pArr.push({ id: d.id, ...data } as Post);
      });
      // We store all posts and filter 'Deleted' out in render if not editor
      setPosts(pArr.sort((a, b) => {
        const pinSort = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        if (pinSort !== 0) return pinSort;
        return (b.time || 0) - (a.time || 0);
      }));

      if (!initialPostsLoaded.current) {
        initialPostsLoaded.current = true;
      } else {
        const hasNew = snap.docChanges().some(change => change.type === 'added');
        if (hasNew) {
          playNotificationSound();
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'posts'));

    return () => {
      unsubUpdates();
      unsubSuggestions();
      unsubPosts();
    };
  }, []);

  // Authenticated-Only Listeners
  useEffect(() => {
    if (!user) return;

    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const p = { id: snap.id, ...snap.data() } as UserProfile;
        setUserProfile(p);
        
        // Force setup if required fields are missing
        if (!p.name || !p.surname || !p.username || !p.mobile || !p.district || !p.mandal || !p.designation) {
           setShowForcedProfileSetup(true);
        } else {
           setShowForcedProfileSetup(false);
           // Show greeting on first load
           if (p.status === 'Approved' && !hasGreetedRef.current) {
              hasGreetedRef.current = true;
              const honorific = p.gender === 'Female' ? 'Madam' : 'Sir';
              addToast(`Welcome to E-vedhika website, ${honorific}!`);
           }
        }
      } else {
        setUserProfile(null);
        setShowForcedProfileSetup(true);
      }
      setProfileLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      if (err.message.includes('offline')) {
        addToast("Network Error: Firestore is offline. Please check your connection.");
      }
      setProfileLoading(false);
    });

    const unsubAdminCheck = onSnapshot(doc(db, 'admins', user.uid), (snap) => {
      const isDevEmail = user.email?.toLowerCase() === 'rakeshkumardhawan123@gmail.com';
      if (isDevEmail) {
        setUserRole('admin');
      } else if (snap.exists()) {
        const data = snap.data();
        setUserRole(data?.role || 'admin');
      } else {
        setUserRole('user');
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `admins/${user.uid}`));

    const unsubChat = onSnapshot(collection(db, 'chat'), (snap) => {
      const cArr: ChatMessage[] = [];
      snap.forEach((d) => cArr.push({ id: d.id, ...(d.data() as any) } as ChatMessage));
      setChatMessages(cArr.sort((a, b) => (a.time || 0) - (b.time || 0)).slice(-50));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'chat'));

    const problemsQuery = (userRole === 'admin' || userRole === 'editor')
      ? collection(db, 'problems')
      : query(collection(db, 'problems'), where('uid', '==', user.uid));

    const unsubProblems = onSnapshot(problemsQuery, (snap) => {
      const pArr: ProblemReport[] = [];
      snap.forEach(d => pArr.push({ id: d.id, ...(d.data() as any) } as ProblemReport));
      setProblemsGlobal(pArr.sort((a, b) => (b.time || 0) - (a.time || 0)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'problems');
    });

    // Requests visibility: Admins see all, users see their own
    const requestsQuery = (userRole === 'admin' || userRole === 'editor')
      ? collection(db, 'requests')
      : query(collection(db, 'requests'), where('uid', '==', user.uid));

    const unsubRequests = onSnapshot(requestsQuery, (snap) => {
      const rArr: RequestData[] = [];
      snap.forEach(d => rArr.push({ id: d.id, ...(d.data() as any) } as RequestData));
      setRequests(rArr.sort((a, b) => (b.time || 0) - (a.time || 0)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'requests');
    });

    const unsub1 = onSnapshot(query(collection(db, 'notifications'), where('uid', 'in', [user.uid, 'all'])), (snap) => {
      const nArr: Notification[] = [];
      snap.forEach(d => nArr.push({ id: d.id, ...(d.data() as any) } as Notification));
      setNotifications(nArr.sort((a, b) => b.time - a.time).slice(0, 50));
      setUnreadCount(nArr.filter(n => !n.read).length);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

    return () => {
      unsubProfile();
      unsubAdminCheck();
      unsubChat();
      unsubProblems();
      unsubRequests();
      unsub1();
    };
  }, [user, userRole]);

  // Removing automatic Profile Modal trigger based on user request to not force signup flows

  const addToast = (msg: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleGoogleLogin = async () => {
    const loginWaitToast = "Google లాగిన్ ప్రాసెస్ అవుతోంది... దయచేసి వేచి ఉండండి.";
    addToast(loginWaitToast);
    
    // Warning timeout if it takes too long
    const slowLoginWarning = setTimeout(() => {
      addToast("లాగిన్ ఆలస్యం అవుతోంది. ఒకవేళ పాపప్ రాకపోతే, యాప్‌ను కొత్త ట్యాబ్‌లో (పైన కుడివైపు అమ్ము గుర్తు) ఓపెన్ చేయండి.");
    }, 8000);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      clearTimeout(slowLoginWarning);
      
      try {
        const docRef = doc(db, 'users', result.user.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
           await setDoc(docRef, {
             name: result.user.displayName || 'System User',
             email: result.user.email,
             photoURL: result.user.photoURL,
             gender: '',
             designation: '',
             time: Date.now()
           });
        }
      } catch (e) {
        // Silent fail
      }

      setShowAuthModal(false);

      try {
        const isAdminEmail = ['rakeshkumardhawan123@gmail.com', 'mpo.kasipett@gmail.com'].includes(result.user.email || '');
        await addDoc(collection(db, 'security_logs'), {
           [isAdminEmail ? 'admin' : 'userEmail']: result.user.email,
           action: `Google Login (${navigator.userAgent.substring(0, 50)}...)`,
           time: Date.now()
        });
      } catch (e) {
        // Silent fail for logging
      }
      
      // dynamic greeting handled via profile listener
    } catch (err: any) {
      clearTimeout(slowLoginWarning);
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/popup-blocked') {
         addToast("Login Failed: Popup closed or blocked. Try opening the app in a new tab (arrow on top right) if this persists.");
      } else {
         addToast("Login Failed: " + err.message);
      }
    }
  };

  const triggerLogin = () => {
    setShowAuthModal(true);
  };

  const togglePostExpansion = async (id: string) => {
    setExpandedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    if (!expandedPosts.has(id)) {
      try {
        await updateDoc(doc(db, 'posts', id), { views: increment(1) });
      } catch (err) { console.error(err); }
    }
  };

  const filteredPosts = posts.filter(p => {
    if (p.status === 'Deleted') return false;
    
    // Normal users shouldn't see unapproved posts (unless it's their own)
    const pStatus = (p.status || '').toLowerCase();
    if (!isAdmin && !['approved', 'active'].includes(pStatus) && p.uid !== user?.uid) return false;

    const q = searchQuery.toLowerCase().trim();
    const tMatch = (p.title || "").toLowerCase().includes(q);
    const cMatch = (p.content || "").toLowerCase().includes(q);
    const searchOk = !q || tMatch || cMatch;
    if (currentFilter === 'All') return searchOk;
    return searchOk && (p.category === currentFilter || p.subCategory === currentFilter);
  });

  if (location.pathname.endsWith('/Evdka')) {
    if (!isEditor) {
      return (
        <div className="h-[100dvh] overflow-hidden bg-slate-950 font-sans selection:bg-accent/20 selection:text-primary antialiased flex flex-col justify-center items-center p-4">
           <AnimatePresence>
            {toasts.map(t => (
               <motion.div
                 key={t.id}
                 initial={{ opacity: 0, y: -20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0 }}
                 className="fixed top-4 right-4 z-[9999] bg-primary text-white px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-3"
                 style={{ background: '#0d3b66' }}
               >
                 <div className="w-1.5 h-1.5 rounded-full bg-accent" style={{ background: '#fbbf24' }}></div>
                 {t.msg}
               </motion.div>
            ))}
           </AnimatePresence>

           <div className="text-center relative z-10 w-full max-w-sm">
              <h1 className="text-3xl font-black mb-4 text-white uppercase tracking-tighter">System Admin</h1>
              {!user ? (
                 <div className="bg-slate-900 border-2 border-slate-800 p-8 rounded-3xl w-full shadow-2xl">
                    <p className="text-slate-400 font-bold mb-6 text-sm">Please identify yourself to access the administration console.</p>
                    <button aria-label="Verify Identity with Google" onClick={handleGoogleLogin} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                       Google Identity Verification
                    </button>
                    <button aria-label="Return to Public Portal" onClick={() => navigate('/')} className="mt-8 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest border border-slate-800 px-6 py-2 rounded-xl">Return to Public Portal</button>
                 </div>
              ) : (
                 <div className="bg-slate-900 border-2 border-red-900/50 p-8 rounded-3xl w-full shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                       <Lock size={32} className="text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-red-400 mb-2 uppercase">Access Denied</h2>
                    <p className="text-slate-400 text-xs font-bold mb-6">Your account ({user.email}) does not have administrative privileges.</p>
                    <button aria-label="Sign out" onClick={() => auth.signOut()} className="w-full border border-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all text-xs mb-3 uppercase tracking-wider">Sign Out</button>
                    <button aria-label="Return to Public Portal" onClick={() => navigate('/')} className="w-full text-slate-500 hover:text-slate-300 transition-colors text-[10px] uppercase tracking-widest font-bold">Return to Public Portal</button>
                 </div>
              )}
           </div>
        </div>
      );
    }
    return (
      <div className="h-[100dvh] overflow-hidden bg-slate-950 font-sans selection:bg-accent/20 selection:text-primary antialiased">
         <AnimatePresence>
          {toasts.map(t => (
             <motion.div
               key={t.id}
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0 }}
               className="fixed top-4 right-4 z-[9999] bg-primary text-white px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-3"
               style={{ background: '#0d3b66' }}
             >
               <div className="w-1.5 h-1.5 rounded-full bg-accent" style={{ background: '#fbbf24' }}></div>
               {t.msg}
             </motion.div>
          ))}
         </AnimatePresence>
         
         {adminLocked ? (
            <div className="fixed inset-0 z-[5000] bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center relative z-10"
              >
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                  <Lock size={40} className="text-blue-400" />
                </div>
                <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Admin Session Locked</h2>
                <p className="text-slate-400 font-bold mb-8 uppercase text-xs tracking-widest">Restricted Access Level: 1</p>
                
                <div className="max-w-xs mx-auto">
                  <input 
                    type="password" 
                    placeholder="Enter Access PIN" 
                    className="w-full bg-slate-900 border-2 border-slate-800 focus:border-blue-500 p-4 rounded-2xl text-center text-2xl tracking-[1em] outline-none shadow-inner"
                    value={adminPinInput}
                    onChange={(e) => {
                      const target = e.target;
                      setAdminPinInput(target.value);
                      if (target.value === currentAdminPin) {
                        setAdminLocked(false);
                      }
                    }}
                  />
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-4">Security PIN required to view sensitive data</p>
                </div>
                
                <button aria-label="Back to Portal" onClick={() => navigate('/')} className="mt-8 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest border border-slate-800 px-6 py-2 rounded-xl">Back to Portal</button>
              </motion.div>
            </div>
         ) : (
            <div className="h-screen w-full">
              <AdminPanel 
                 posts={posts}
                 addToast={addToast} 
                 onNewPost={() => setShowPostForm(true)}
                 onEditPost={(post) => { setEditingPost(post); setShowPostForm(true); }}
                 problems={problemsGlobal} 
                 suggestions={suggestions} 
                 setAdminLocked={setAdminLocked} 
                 adminLocked={adminLocked} 
                 notifications={notifications} 
                 requests={requests} 
                 updates={updates}
                 userRole={userRole}
                 isDevEmail={isDevEmail}
                 currentAdminPin={currentAdminPin}
                 setCurrentAdminPin={setCurrentAdminPin}
                 users={allUsers}
                 onExit={() => navigate('/')}
              />
            </div>
         )}
         
         {(showPostForm || editingPost) && (
           <div className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl custom-scrollbar">
                <PostForm addToast={addToast} onCancel={() => { setShowPostForm(false); setEditingPost(null); }} currentUserProfile={userProfile} editingPost={editingPost} isAdmin={isAdmin} isEditor={isEditor} />
             </div>
           </div>
         )}
      </div>
    );
  }


  return (
    <div className="h-[100dvh] overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-[#f8fafc] to-slate-100 text-slate-800 flex flex-col font-sans selection:bg-accent/20 selection:text-primary antialiased">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-[9999] bg-primary text-white px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-3"
            style={{ background: '#0d3b66' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent" style={{ background: '#fbbf24' }}></div>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {userProfile?.role === 'suspended' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm"
          >
             <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8 border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                <ShieldAlert size={48} className="text-red-500 animate-pulse" />
             </div>
             <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Access Restricted</h1>
             <p className="text-red-400 font-black mb-6 uppercase text-xs tracking-[0.2em] bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">Security Suspension Active</p>
             <p className="text-slate-400 max-w-sm text-base font-medium leading-relaxed mb-10">
                మీ ఖాతా భద్రతా కారణాల దృష్ట్యా తాత్కాలికంగా నిలిపివేయబడింది. దయచేసి అడ్మినిస్ట్రేటర్‌ను సంప్రదించండి.
             </p>
             <button aria-label="Sign out and exit portal"
                onClick={() => auth.signOut()}
                className="px-10 py-5 bg-white text-slate-950 font-black rounded-2xl uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all flex items-center gap-3 shadow-2xl active:scale-95"
             >
                <LogOut size={18} /> Sign Out & Exit Portal
             </button>
             <div className="mt-16 text-[9px] text-slate-600 font-bold uppercase tracking-[0.4em] font-mono">
                System Security Layer • E-VEDHIKA PRO
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-[1001] shadow-2xl bg-[#103052] border-b-[3px] border-accent flex items-center">
        <div className="brand-wrapper cursor-pointer flex items-center gap-4" onClick={() => { setCurrentTab('home'); setSidebarOpen(false); }}>
          {/* లోగో HTML స్ట్రక్చర్ */}
          <div className="logo-pro cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-200">
            {/* యానిమేటెడ్ పార్టికల్స్ */}
            <div className="logo-particles">
              <span></span>
              <span></span>
              <span></span>
            </div>
            
            {/* SVG లోగో */}
            <svg viewBox="0 0 64 64" width="48" height="48">
              <defs>
                {/* కలర్ గ్రేడియంట్స్ */}
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22c55e"/>
                  <stop offset="100%" stopColor="#0ea5e9"/>
                </linearGradient>
                <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22c55e"/>
                  <stop offset="50%" stopColor="#facc15"/>
                  <stop offset="100%" stopColor="#0ea5e9"/>
                </linearGradient>
              </defs>
              
              {/* బయటి రింగ్ */}
              <circle className="logo-ring" cx="32" cy="32" r="29" fill="none" stroke="url(#ringG)" strokeWidth="2.5" strokeDasharray="10 5"/>
              
              {/* లోపలి సర్కిల్స్ */}
              <circle cx="32" cy="32" r="25" fill="url(#g)"/>
              <circle cx="32" cy="32" r="21" fill="#0d3b66"/>
              
              {/* EV టెక్స్ట్ */}
              <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="900" fontFamily="Segoe UI">EV</text>
            </svg>
          </div>
          {/* Website Name Section */}
          <div className="flex flex-col justify-center translate-y-[-2px]">
            <h2 className="brand-title" style={{ 
              color: '#fbe947', 
              background: 'none',
              WebkitTextFillColor: 'initial',
              WebkitBackgroundClip: 'initial',
              filter: 'none',
              animation: 'none',
              fontWeight: '900',
              letterSpacing: '1px',
              fontFamily: '"Arial Black", Impact, sans-serif',
              lineHeight: '1',
             }}>E<span style={{color: '#facc15'}}>-</span>VEDHIKA</h2>
            <div className="flex items-center mt-[1px]">
              <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '1px', color: '#94a3b8', textTransform: 'uppercase' }}>
                all problems one solution
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-5">
          {user && !user.isAnonymous ? (
            <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)} 
                className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#174b7c] to-transparent pl-1.5 pr-2 sm:pr-5 py-1.5 rounded-[16px] border border-accent/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(250,204,21,0.25)] hover:border-accent/60 transition-all duration-300 relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/10 to-accent/0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-gradient-to-br from-accent to-[#d97706] flex items-center justify-center text-primary font-black text-lg shadow-inner border-[2px] border-white/20 relative z-10 shadow-[0_0_10px_rgba(250,204,21,0.5)] overflow-hidden">
                   {user?.photoURL ? (
                     <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                   ) : (
                     <User size={16} className="text-primary sm:w-[18px] sm:h-[18px]" />
                   )}
                </div>
                <div className="hidden sm:flex flex-col justify-center relative z-10">
                  <span className="text-white text-[12px] font-black tracking-wide leading-tight drop-shadow-sm">{userProfile?.username || "Panchayat Member"}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981] animate-pulse"></span>
                    <span className="text-accent text-[9px] font-bold uppercase tracking-[0.15em] drop-shadow-sm">{isAdmin ? 'System Admin' : isEditor ? 'Editor' : 'Active User'}</span>
                  </div>
                </div>
                <ChevronDown size={14} className={`hidden sm:block text-accent/50 group-hover:text-accent transition-transform duration-300 relative z-10 ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[2000] p-2"
                  >
                    <button aria-label="Edit Profile"
                      onClick={() => { setShowProfileModal(true); setShowProfileDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-blue-50 transition-colors rounded-xl group text-left"
                    >
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <User size={18} />
                      </div>
                      Edit Profile
                    </button>
                    <div className="h-px bg-slate-100 my-1 mx-2" />
                    <button aria-label="Logout"
                      onClick={() => { auth.signOut(); setShowProfileDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors rounded-xl group text-left"
                    >
                      <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
                        <LogOut size={18} />
                      </div>
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button aria-label="Sign In"
              onClick={triggerLogin}
              className="bg-[#fbbf24] text-[#0f2e4a] px-5 py-2.5 rounded-[12px] font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#fbbf24]/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#fbbf24]/30 hover:bg-[#fcd34d] transition-all active:scale-[0.96] flex items-center gap-2 border border-[#fbbf24]/30"
            >
              <User size={14} className="text-[#0f2e4a]" />
              Sign In
            </button>
          )}
        </div>
      </header>

      <div className="latest-bar overflow-hidden">
        <div className="latest-label">Latest Updates</div>
        <div className="latest-text flex-1">
          <span>
            {(() => {
              const visibleUpdates = updates.filter(u => (u.type === 'flash' || (!u.type && !u.status)) && u.status !== 'hidden' && u.status?.toLowerCase() !== 'deleted');
              return visibleUpdates.length > 0 
                ? visibleUpdates.map(u => u.text || (u as any).msg || (u as any).update).join('  •  ') 
                : '🔥 Welcome to E-Vedhika Portal... 🔥 • 🔥 The E-Vedhika Portal is now live – Empowering Governance with Digital Excellence.. 🔥';
            })()}
          </span>
        </div>
      </div>

      <nav className="nav-trigger-bar sticky top-0 z-[1000]">
        <div className="trigger-left">
          <button aria-label="Toggle Menu" className="menu-toggle shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-4">
          <div 
            className="notif-bell p-2 -mr-2"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notif-badge" style={{ display: 'flex' }}>
                {unreadCount}
              </span>
            )}
          </div>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
                 className="fixed top-16 right-4 sm:right-10 w-[280px] sm:w-[320px] bg-white rounded-3xl shadow-2xl border border-slate-100 z-[2000] overflow-hidden"
              >
                 <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest">Signal Inbox</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-danger"><X size={14}/></button>
                 </div>
                 <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-slate-50">
                        {notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={async () => {
                              if (!n.read) {
                                try {
                                  await updateDoc(doc(db, 'notifications', n.id), { read: true });
                                } catch(e) {}
                              }
                              setShowNotifications(false);
                            }}
                            className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}
                          >
                             <div className="flex justify-between items-start mb-1">
                                <span className={`text-[9px] font-black uppercase tracking-wider ${n.type === 'flash_update' ? 'text-amber-500' : 'text-primary'}`}>
                                   {n.type?.replace('_', ' ')}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400">
                                   {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                             <h4 className="text-xs font-black text-slate-800 leading-tight mb-1">{n.title}</h4>
                             <p className="text-[10px] font-medium text-slate-500 line-clamp-2">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center">
                         <Zap size={24} className="mx-auto text-slate-200 mb-2" />
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active signals</p>
                      </div>
                    )}
                 </div>
                 {notifications.length > 0 && (
                   <button 
                     onClick={async () => {
                        const unread = notifications.filter(n => !n.read);
                        try {
                           await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
                           addToast("Marked all as read");
                        } catch(e) {}
                     }}
                     className="w-full p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary bg-slate-50 border-t border-slate-100 transition-colors"
                   >
                     Mark all as read
                   </button>
                 )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </nav>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-[1050]"
          />
        )}
      </AnimatePresence>

      <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <aside ref={sidebarRef} className={`sidebar ${sidebarOpen ? 'z-[1100]' : ''}`}>
          <div className="sidebar-inner relative" onClick={(e) => {
            if (e.target === e.currentTarget) setSidebarOpen(false);
          }}>
            {sidebarOpen && (
              <button aria-label="Close sidebar"
                onClick={() => setSidebarOpen(false)}
                className="absolute right-2 p-2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                style={{ top: 'calc(8px + env(safe-area-inset-top))' }}
                title="Close sidebar"
              >
                <X size={20} />
              </button>
            )}
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-4">Navigations</h3>
            <MenuButton label="Home" emoji="🏠" active={currentTab === 'home'} onClick={() => {setCurrentTab('home'); setCurrentFilter('All'); setSidebarOpen(false);}} />
            <MenuButton label="🏛️ Mana Panchayath" emoji="📊" active={currentTab === 'workspace'} onClick={() => {setCurrentTab('workspace'); setSidebarOpen(false);}} />
            <MenuButton label="Schemes info and govt" emoji="📢" active={currentTab === 'schemes'} onClick={() => {setCurrentTab('schemes'); setSidebarOpen(false);}} />
            <MenuButton label="Live Chat" emoji="💬" active={currentTab === 'chat'} onClick={() => {setCurrentTab('chat'); setSidebarOpen(false);}} />
            <MenuButton label="Union Corner" emoji="🤝" active={currentTab === 'union'} onClick={() => {setCurrentTab('union'); setSidebarOpen(false);}} />
            <MenuButton label="What's New! 🚀" emoji="✨" active={currentTab === 'changelog'} onClick={() => {setCurrentTab('changelog'); setSidebarOpen(false);}} />
            <MenuButton label="💡 Public suggestions & Feedback" emoji="💡" active={currentTab === 'suggestions'} onClick={() => {setCurrentTab('suggestions'); setSidebarOpen(false);}} />
            
            {showInstallButton && (
              <div className="mt-8 px-4">
                <button aria-label="Install App"
                  onClick={handleInstallClick}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between group hover:shadow-lg transition-all active:scale-95 border border-blue-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Download size={20} className="text-white" />
                    </div>
                    <div className="flex flex-col items-start translate-y-[-1px]">
                      <span className="text-[14px] font-black leading-tight tracking-tight">యాప్ ఇన్‌స్టాల్</span>
                      <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest opacity-80">Install App</span>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <PlusCircle size={14} />
                  </div>
                </button>
              </div>
            )}

            {(isAdmin || isEditor) && (
               <MenuButton label="Admin Panel" emoji="⚙️" active={false} onClick={() => {navigate('/Evdka'); setSidebarOpen(false);}} />
            )}
          </div>
        </aside>

        <main className="flex-1 w-full h-full overflow-y-auto custom-scrollbar p-3 sm:p-6 lg:p-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
          {postIdFromUrl ? (
            <PostDetail 
               postId={postIdFromUrl} 
               onBack={() => {
                 searchParams.delete('postId');
                 setSearchParams(searchParams);
               }} 
               isAdmin={isAdmin}
               addToast={addToast}
               userProfile={userProfile}
            />
          ) : (
            <AnimatePresence mode="wait">
              {currentTab === 'home' && (
                <motion.div key="home" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 sm:space-y-6">


                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                       <div className="flex-1 w-full text-center sm:text-left">
                          {user && !user.isAnonymous ? (
                            <h3 className="text-xl font-black text-primary uppercase tracking-tighter">📝 Portal Updates</h3>
                          ) : (
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 border border-slate-200 rounded-3xl px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 shadow-sm focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                               <Search size={20} className="text-slate-400 shrink-0 sm:w-6 sm:h-6" />
                               <input 
                                 type="text" 
                                 placeholder="Search latest news, reports or notices..." 
                                 className="!bg-transparent !border-none !p-0 !m-0 focus:!ring-0 text-[16px] sm:text-[18px] w-full font-bold text-primary placeholder:text-slate-400"
                                 value={searchQuery}
                                 onChange={(e) => setSearchQuery(e.target.value)}
                               />
                               {searchQuery && (
                                 <button aria-label="Clear Search" onClick={() => setSearchQuery('')} className="text-slate-300 hover:text-danger hover:scale-110 transition-all">
                                   <XCircle size={22} />
                                 </button>
                               )}
                            </div>
                          )}
                        </div>
                        {user && !user.isAnonymous && (
                           <div className="flex items-center gap-3 w-64 border border-slate-100 rounded-2xl px-4 py-2 bg-slate-50 focus-within:bg-white focus-within:border-primary/30 transition-all">
                             <Search size={16} className="text-slate-400 shrink-0" />
                             <input 
                               type="text" 
                               placeholder="Filter updates..." 
                               className="!bg-transparent !border-none !p-0 !m-0 focus:!ring-0 text-[13px] w-full font-medium"
                               value={searchQuery}
                               onChange={(e) => setSearchQuery(e.target.value)}
                             />
                           </div>
                        )}
                    </div>

                    {user && !user.isAnonymous && (
                      <button aria-label="Compose official update"
                        onClick={() => { setEditingPost(null); setShowPostForm(true); }}
                        className="w-full bg-slate-50 border-2 border-dashed border-slate-200 p-6 sm:p-8 rounded-[28px] text-slate-400 font-bold hover:bg-slate-100 hover:border-primary/20 transition-all flex flex-col items-center gap-3"
                      >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border shadow-sm text-primary">
                          <PlusCircle size={24} />
                        </div>
                        <span>Compose an official update...</span>
                      </button>
                    )}



                  </div>

                  <div className="space-y-10">
                    <AnimatePresence mode="popLayout">
                      {filteredPosts.map((post, index) => (
                        <motion.div key={post.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                          <PostCard 
                            post={post} 
                            isExpanded={expandedPosts.has(post.id)} 
                            toggleExpansion={() => togglePostExpansion(post.id)} 
                            addToast={addToast} 
                            isAdmin={isEditor} 
                            onEdit={(p) => { setEditingPost(p); setShowPostForm(true); }} 
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  

                </motion.div>
              )}

            {currentTab === 'workspace' && (
              <motion.div key="workspace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <DigitalWorkspaceSection addToast={addToast} user={user} />
              </motion.div>
            )}

            {currentTab === 'schemes' && (
              <motion.div key="schemes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                 <div className="section-card card-blue">
                    <h2 className="text-2xl font-black text-primary mb-6">🏛️ Rural Development Schemes</h2>
                    <div className="scheme-grid">
                      {[{ name: 'SthreeNidhi', desc: 'Financial support and credit facilities for Mahila SHG members across Telangana.', icon: '👩‍💼', link: 'https://streenidhi.telangana.gov.in/' },
                        { name: 'Mission Bhagiratha', desc: 'The flagship project to provide safe and sustainable tap water to every household.', icon: '🚰', link: 'https://missionbhagiratha.telangana.gov.in/' },
                        { name: 'MGNREGS', desc: 'Ensuring wage employment and building durable assets in rural areas.', icon: '👷', link: 'https://nregs.telangana.gov.in/' },
                        { name: 'SERP', desc: 'Programs focused on poverty elimination and building community institutions.', icon: '🏘️', link: 'https://serp.telangana.gov.in/' }
                      ].map(s => (
                        <div key={s.name} className="scheme-card">
                          <div className="text-3xl mb-3">{s.icon}</div>
                          <h4 className="font-black text-lg text-primary">{s.name}</h4>
                          <p className="text-sm font-medium text-slate-600 mt-2 flex-1">{s.desc}</p>
                        </div>
                      ))}
                    </div>
                 </div>
              </motion.div>
            )}

            {currentTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ChatSection messages={chatMessages} user={user} addToast={addToast} userProfile={userProfile} />
              </motion.div>
            )}

            {currentTab === 'changelog' && (
              <motion.div 
                key="changelog" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl mx-auto py-12"
              >
                <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-3 bg-blue-50 px-6 py-2 rounded-full border border-blue-100 mb-4">
                    <Rocket size={16} className="text-blue-500 animate-bounce" />
                    <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Platform Evolution</span>
                  </div>
                  <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-4">E-Vedhika Journey</h2>
                  <p className="text-slate-500 font-bold max-w-lg mx-auto">Tracking the digital transformation and feature deployments of the master portal.</p>
                </div>

                <div className="relative space-y-12">
                   {/* Vertical Line */}
                   <div className="absolute left-7 lg:left-10 top-0 bottom-0 w-px bg-slate-200 z-0" />

                   {[
                     {
                       id: 'foundation',
                       text: (
                         <div className="text-left space-y-4">
                           <p className="font-bold text-slate-700">**ప్రారంభం:** ఏప్రిల్ 11వ తేదీ, మధ్యాహ్నం 2:00 గంటలకు.</p>
                           <p className="text-slate-600 text-sm">పంచాయతీ ఆపరేటర్ల నుంచి అందిన అమూల్యమైన సూచనలు మాకు స్ఫూర్తినిచ్చాయి. గూగుల్ **Gemini** మరియు **Chat GPT** సహాయంతో ఈ వేదికను అభివృద్ధి చేశాము.</p>
                         </div>
                       ),
                       time: 1712851200000,
                       type: 'changelog'
                     },
                     ...updates.filter(u => u.type === 'changelog' && u.status?.toLowerCase() !== 'deleted'),
                     ...posts.map(p => ({
                        id: p.id,
                        text: `New Post created by Admin: ${p.title || (p.content ? p.content.substring(0, 50) + "..." : "Updates added")}`,
                        time: p.time,
                        type: 'changelog',
                        isAutoPost: true
                     }))
                   ].sort((a: any, b: any) => (b.time || 0) - (a.time || 0)).map((u: any, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }} 
                        whileInView={{ opacity: 1, x: 0 }} 
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        key={u.id || i} 
                        className="relative flex gap-6 z-10 pl-2 lg:pl-4"
                      >
                         <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 ${u.isAutoPost ? 'bg-indigo-50' : 'bg-blue-50'}`}>
                           {u.isAutoPost ? <PlusCircle size={16} className="text-indigo-500" /> : <Zap size={16} className="text-blue-500" />}
                         </div>
                         <div className="flex-1 pt-2 lg:pt-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                               <h3 className="text-sm sm:text-base font-black text-slate-800">
                                 {u.id === 'foundation' ? 'Foundation Launch' : (u.isAutoPost ? 'Community Notice' : 'System Update')}
                               </h3>
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md w-max">
                                 {new Date(getValidTime(u)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                               </span>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                               <div className="text-[14px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                                 {typeof u.text === 'string' ? u.text : u.text}
                               </div>
                            </div>
                         </div>
                      </motion.div>
                   ))}
                </div>
              </motion.div>
            )}

            {currentTab === 'suggestions' && (
              <motion.div key="suggestions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
                  <div className="border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex flex-row items-center flex-wrap gap-2">
                       <Lightbulb className="text-amber-500 shrink-0" /> 
                       <span>e-Vedhika Suggestion Portal</span>
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">మీ సూచనలు మాకు ఎంతో ముఖ్యం</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="bg-[#f8fafc] rounded-2xl border border-slate-200 p-6 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Latest Suggestions</h3>
                        </div>
                        <div 
                          ref={suggestionsScrollRef} 
                          onMouseEnter={() => setIsSuggestionsHovered(true)}
                          onMouseLeave={() => setIsSuggestionsHovered(false)}
                          className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2"
                        >
                          {approvedSuggestions.length > 0 ? (
                            [...approvedSuggestions]
                              .sort((a, b) => getValidTime(b) - getValidTime(a))
                              .map(s => (
                              <motion.div 
                                key={s.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ 
                                  opacity: 1, 
                                  y: 0,
                                  boxShadow: [
                                    "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                                    "0 0 8px 0 rgba(59, 130, 246, 0.2)",
                                    "0 1px 2px 0 rgb(0 0 0 / 0.05)"
                                  ]
                                }}
                                transition={{ 
                                  boxShadow: {
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }
                                }}
                                className="bg-white p-3 rounded-xl border border-slate-100 hover:border-blue-300 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-50">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[9px] font-black text-slate-400">
                                      {(s.name || s.author || 'U')[0].toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-700 leading-tight">
                                        {s.name || s.author || 'Unknown'}
                                      </span>
                                      {s.village && (
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                          {s.village}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight text-right">
                                    <div className="leading-none mb-0.5">
                                      {new Date(getValidTime(s)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </div>
                                    <div className="text-[8px] opacity-70">
                                      {new Date(getValidTime(s)).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-[13px] text-slate-700 font-medium leading-relaxed">{s.msg || s.suggestion}</p>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-20 text-slate-400 text-xs font-bold uppercase tracking-widest">
                               No submissions yet
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div 
                      className="relative bg-white p-5 sm:p-8 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col h-full"
                    >
                      {(!user || user?.isAnonymous) && (
                        <div 
                           className="absolute inset-0 z-10 cursor-pointer bg-transparent rounded-3xl"
                           onClick={async () => {
                             const res = await Swal.fire({
                               title: 'లాగిన్ అవసరం',
                               text: 'మీరు లాగిన్ అయ్యాక ఏదైనా Suggestion & Feedback ఇవ్వచ్చు. మీరు లాగిన్ అవుతారా?',
                               icon: 'info',
                               showCancelButton: true,
                               confirmButtonText: 'లాగిన్ అవ్వండి',
                               cancelButtonText: 'వద్దు',
                               confirmButtonColor: '#4f46e5'
                             });
                             if (res.isConfirmed) {
                               setShowAuthModal(true);
                             }
                           }}
                        />
                      )}
                      <div className={(!user || user?.isAnonymous) ? "opacity-30 pointer-events-none" : ""}>
                       <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">
                         Submit Suggestion & Feedback
                       </h3>
                       <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-tight mb-6">
                         మీ అమూల్యమైన సూచనలను ఇక్కడ నమోదు చేయండి
                       </p>
                       
                       <form onSubmit={async (e) => {
                        e.preventDefault();
                        const target = e.target as any;
                        const name = target.name.value.trim();
                        const village = target.village.value.trim();
                        const mobile = target.mobile.value.trim();
                        const category = target.category.value;
                        const suggestion = target.suggestion.value.trim();

                        if (!name || !village || !mobile || !category || !suggestion) {
                          return addToast("దయచేసి అన్ని వివరాలు నింపండి (Please fill all fields)");
                        }

                        if (!/^[0-9]{10}$/.test(mobile)) {
                          return addToast("దయచేసి 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి");
                        }

                        try {
                          await addDoc(collection(db, 'suggestions'), {
                            name,
                            village,
                            mobile,
                            category,
                            suggestion,
                            time: Date.now(),
                            status: 'pending',
                            uid: user?.uid || 'anonymous'
                          });
                          await logUserActivity(`Submitted Suggestion: ${category}`);
                          target.name.value = userProfile ? `${userProfile.name || ''} ${userProfile.surname || ''}`.trim() : '';
                          target.village.value = userProfile ? `${userProfile.mandal || ''} / ${userProfile.district || ''}`.trim().replace(/^ \/ | \/ $/g, '') : '';
                          target.mobile.value = userProfile?.mobile || '';
                          target.category.value = "";
                          target.suggestion.value = "";
                          
                          Swal.fire({
                            title: '✅ సక్సెస్!',
                            text: 'మీ సూచన విజయవంతంగా నమోదు చేయబడింది.',
                            icon: 'success',
                            confirmButtonColor: '#0d3b66'
                          });
                        } catch (error) {
                          handleFirestoreError(error, OperationType.CREATE, 'suggestions');
                          addToast("సబ్మిట్ చేయడంలో లోపం కలిగింది.");
                        }
                      }} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">మీ పేరు (Name)</label>
                              <input 
                                name="name" 
                                type="text"
                                defaultValue={userProfile ? `${userProfile.name || ''} ${userProfile.surname || ''}`.trim() : ''}
                                placeholder="Enter your name" 
                                className="w-full bg-slate-50 border-slate-100 rounded-xl p-3 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20" 
                                required
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">జిల్లా / మండలం (Area)</label>
                              <input 
                                name="village" 
                                type="text"
                                defaultValue={userProfile ? `${userProfile.mandal || ''} / ${userProfile.district || ''}`.trim().replace(/^ \/ | \/ $/g, '') : ''}
                                placeholder="District / Mandal" 
                                className="w-full bg-slate-50 border-slate-100 rounded-xl p-3 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20" 
                                required
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">మొబైల్ నంబర్ (Mobile)</label>
                              <input 
                                name="mobile" 
                                type="tel"
                                defaultValue={userProfile?.mobile || ''}
                                maxLength={10}
                                placeholder="10 Digit Number" 
                                className="w-full bg-slate-50 border-slate-100 rounded-xl p-3 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20" 
                                required
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">విభాగం (Category)</label>
                              <select 
                                name="category" 
                                className="w-full bg-slate-50 border-slate-100 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                required
                              >
                                <option value="">విభాగం ఎంచుకోండి</option>
                                <option>Home</option>
                                <option>Latest News</option>
                                <option>Services</option>
                                <option>Missing Features</option>
                                <option>Discussion Forum</option>
                                <option>User Login</option>
                                <option>FAQ</option>
                                <option>Search</option>
                                <option>Suggestion for website</option>
                              </select>
                           </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">మీ సూచన (Suggestion)</label>
                          <textarea 
                            name="suggestion" 
                            placeholder="మీ సూచన ఇక్కడ టైప్ చేయండి..." 
                            rows={4} 
                            className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" 
                            required
                          ></textarea>
                        </div>

                        <button aria-label="Submit Entry" type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95">
                          Submit Entry
                        </button>
                      </form>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentTab === 'problems' && (
              <motion.div key="problems" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex justify-between items-center mb-4">
                  <button aria-label="Back to Dashboard" onClick={() => setCurrentTab('home')} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                    <ArrowLeft size={16} /> Back to Dashboard
                  </button>
                </div>
                <div className="section-card card-gold !border-t-danger">
                  <h2 className="text-2xl font-black text-primary mb-6">🚩 Report an Issue</h2>
                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mb-8">
                     <form onSubmit={async (e) => {
                       e.preventDefault();
                       const target = e.target as any;
                       const cat = target.category.value;
                       const msg = target.message.value;
                       if (requireLoginAlert(user)) return;
                       try {
                         await addDoc(collection(db, 'problems'), {
                           msg,
                           category: cat,
                           status: 'pending',
                           time: Date.now(),
                           uid: user.uid
                         });
                         await logUserActivity(`Reported Problem: ${cat}`);
                         addToast("Problem reported successfully!");
                         target.reset();
                       } catch(err) { handleFirestoreError(err, OperationType.WRITE, 'problems'); }
                     }} className="space-y-4">
                       <input name="category" placeholder="Category (e.g. Aadhar, Water, Tax)" required className="bg-white" />
                       <textarea name="message" placeholder="Explain your problem in detail..." required rows={3} className="bg-white" />
                       <button aria-label="Submit Report" className="w-full bg-danger text-white py-3 rounded-xl font-black shadow-md hover:opacity-90">Submit Report</button>
                     </form>
                  </div>
                  <div className="space-y-4">
                    {problemsGlobal.map(p => (
                      <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-2xl border-l-4 border-danger">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-danger uppercase tracking-widest">{p.category}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.status === 'solved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status?.toUpperCase()}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700">{p.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Secondary admin block removed */}
          </AnimatePresence>
        )}

        {(showPostForm || editingPost) && (
          <div className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl custom-scrollbar">
               <PostForm addToast={addToast} onCancel={() => { setShowPostForm(false); setEditingPost(null); }} currentUserProfile={userProfile} editingPost={editingPost} isAdmin={isAdmin} isEditor={isEditor} />
            </div>
          </div>
        )}

                    {showAuthModal && (
                      <AuthModal 
                        onClose={() => setShowAuthModal(false)} 
                        addToast={addToast} 
                        handleGoogleLogin={handleGoogleLogin} 
                      />
                    )}

                    {showSuggestionForm && (
                      <div className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-[24px] shadow-2xl custom-scrollbar relative">
                           <SuggestionForm addToast={addToast} onCancel={() => setShowSuggestionForm(false)} />
                        </div>
                      </div>
                    )}

                    {(showProfileModal || showForcedProfileSetup) && (
                      <EditProfileModal 
                        onClose={() => {
                          if (showForcedProfileSetup) {
                            addToast("Please complete your profile first.");
                            return;
                          }
                          setShowProfileModal(false);
                        }}
                        onExitForced={() => {
                          auth.signOut();
                          setShowForcedProfileSetup(false);
                          setShowProfileModal(false);
                          setCurrentTab('home');
                        }}
                        user={user} 
                        userProfile={userProfile} 
                        addToast={addToast}
                        isForced={showForcedProfileSetup}
                        onComplete={() => setShowForcedProfileSetup(false)}
                      />
                    )}
      </main>
    </div>
  </div>
);
}

function EditProfileModal({ onClose, onExitForced, user, userProfile, addToast, isForced, onComplete }: { onClose: () => void, onExitForced?: () => void, user: any, userProfile: UserProfile | null, addToast: (s:string) => void, isForced?: boolean, onComplete?: () => void }) {
  const [surname, setSurname] = useState(userProfile?.surname || '');
  const [name, setName] = useState(userProfile?.name || '');
  const [username, setUsername] = useState(userProfile?.username || user?.displayName || '');
  const [gender, setGender] = useState(userProfile?.gender || '');
  const [state, setState] = useState(userProfile?.state || 'Telangana');
  const [district, setDistrict] = useState(userProfile?.district || '');
  const [mandal, setMandal] = useState(userProfile?.mandal || '');
  const [village, setVillage] = useState(userProfile?.village || '');
  const [mobile, setMobile] = useState(userProfile?.mobile || '');
  const [email, setEmail] = useState(userProfile?.email || user?.email || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || user?.photoURL || '');
  const [designation, setDesignation] = useState(userProfile?.designation || '');
  const [office, setOffice] = useState(userProfile?.office || '');
  const [saving, setSaving] = useState(false);

  const mandals = district ? TELANGANA_DATA[district] || [] : [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!username || !name || !surname || !mobile || !district || !mandal || !designation) {
      addToast("Please fill all required fields (*)");
      return;
    }
    setSaving(true);
    try {
      // Check if username changed and is unique
      if (username !== userProfile?.username) {
        const lowerUsername = username.toLowerCase().trim();
        const usernameDoc = await getDoc(doc(db, 'usernames', lowerUsername));
        if (usernameDoc.exists() && usernameDoc.data().uid !== user.uid) {
           addToast("Username already taken. Please choose another.");
           setSaving(false);
           return;
        }
        
        // Remove old username if exists
        if (userProfile?.username) {
          await deleteDoc(doc(db, 'usernames', userProfile.username.toLowerCase().trim()));
        }
        
        // Reserve new username
        await setDoc(doc(db, 'usernames', lowerUsername), { uid: user.uid });
      }

      await setDoc(doc(db, 'users', user.uid), {
        surname,
        name,
        username,
        gender,
        state,
        district,
        mandal,
        village,
        designation,
        office,
        mobile,
        email,
        photoURL,
        time: userProfile?.time || Date.now()
      }, { merge: true });

      if (designation === 'Citizen') {
        Swal.fire({
          title: "సిటిజన్ గారికి నమస్కారం",
          text: "ప్రస్తుతం ఈ వేదిక Webportal సిటిజన్ సర్వీస్ ఇంకా అందుబాటులోకి రాలేదు. రాగానే మీ మొబైల్ నెంబర్ కి మెసేజ్ లేదా ఇమెయిల్ ద్వారా మీకు సమాచారం ఇవ్వడం జరుగుతుంది.",
          icon: "info",
          confirmButtonText: "సరే (OK)",
          confirmButtonColor: "#0d3b66"
        });
      } else {
        addToast("Profile updated successfully!");
      }

      if (onComplete) onComplete();
      onClose();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      if (err.message.includes('offline')) {
        addToast("Error: Connection lost. Please check your internet or refresh the page.");
      } else {
        addToast("Failed to update profile: " + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
      >
        {!isForced && (
          <button aria-label="Close profile modal" onClick={onClose} className="absolute top-6 right-6 bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20}/>
          </button>
        )}
        
        <div className="text-center mb-6">
           <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">Profile Setup</h2>
           <div className="flex justify-center mt-1">
             <p className="bg-accent text-primary px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.12em] shadow-sm">
               {isForced ? "Complete your identity to continue" : "Update your portal credentials & Workplace Details"}
             </p>
           </div>
        </div>
        
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-[20px] overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center relative group">
              {photoURL ? <img src={photoURL} alt="Preview" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" /> : <User size={30} className="text-slate-300" />}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera size={16} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Surname *</label>
              <input value={surname} onChange={e => setSurname(e.target.value)} required className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" placeholder="Surname" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" placeholder="Name" />
            </div>
          </div>

          <div>
             <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Display Name / Username *</label>
             <input value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" placeholder="Username" />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Gender</label>
               <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs">
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
               </select>
             </div>
             <div>
               <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Mobile No *</label>
               <input value={mobile} onChange={e => setMobile(e.target.value)} required className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" placeholder="Mobile Number" />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">State</label>
               <select className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl outline-none font-bold text-xs cursor-not-allowed" disabled>
                  <option>Telangana</option>
               </select>
             </div>
             <div>
               <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">District *</label>
               <select value={district} onChange={e => { setDistrict(e.target.value); setMandal(''); }} required className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs">
                  <option value="">Select District</option>
                  {Object.keys(TELANGANA_DATA).sort().map(d => <option key={d}>{d}</option>)}
               </select>
             </div>
          </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Mandal *</label>
                   <select value={mandal} onChange={e => setMandal(e.target.value)} required className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" disabled={!district}>
                      <option value="">Select Mandal</option>
                      {mandals.map((m, idx) => <option key={`${m}_${idx}`} value={m}>{m}</option>)}
                   </select>
                 </div>
             <div>
               <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Village / GP</label>
               <input value={village} onChange={e => setVillage(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" placeholder="Village" />
             </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Designation *</label>
            <input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Type Designation (e.g. e-Panchayat, MPO)" required className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" />
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Office Address</label>
            <input value={office} onChange={e => setOffice(e.target.value)} placeholder="Office location / Building" className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" />
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            {!isForced && (
              <>
                <button aria-label="Cancel"
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 min-w-[120px] bg-slate-100 text-slate-600 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button aria-label="Logout"
                  type="button" 
                  onClick={() => { auth.signOut(); onClose(); }} 
                  className="flex-1 min-w-[120px] bg-red-50 text-red-600 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-100 transition-all active:scale-95 border border-red-200 flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            )}
            {isForced && (
              <button aria-label="Exit to Home"
                type="button" 
                onClick={onExitForced} 
                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >
                Exit to Home
              </button>
            )}
            <button aria-label="Save Profile Changes"
             type="submit"
             disabled={saving}
             className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase text-sm tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-3"
             style={{ background: '#0d3b66' }}
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ClockWidget() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="text-right hidden sm:block">
      <p className="text-sm font-black text-slate-800">{time.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      <p className="text-[14px] font-mono font-black text-slate-600 tracking-wider">
        {time.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
    </div>
  );
}

function AdminPanel({ addToast, posts, problems, suggestions, users, setAdminLocked, adminLocked, notifications, requests, updates, userRole, onExit, onNewPost, onEditPost, isDevEmail, currentAdminPin, setCurrentAdminPin }: any) {
  const isAdmin = userRole === 'admin' || isDevEmail;
  const isEditor = userRole === 'admin' || userRole === 'editor' || isDevEmail;
  const [activeSubTab, setActiveSubTab] = useState('dash');
  const [usersFilter, setUsersFilter] = useState<'All' | 'Deleted'>('All');
  const [trashTab, setTrashTab] = useState<'posts' | 'problems' | 'suggestions' | 'users' | 'updates'>('posts');
  const [userViewMode, setUserViewMode] = useState<'access' | 'directory'>('access');
  const [showPin, setShowPin] = useState(false);
  const [logType, setLogType] = useState<'admin' | 'public'>('admin');
  const [logActionFilter, setLogActionFilter] = useState('');
  const [logAdminFilter, setLogAdminFilter] = useState('');

  const exportLogsToCSV = () => {
    const filteredLogs = logs.filter(log => {
      const isCorrectType = logType === 'admin' ? !!log.admin : !log.admin;
      const matchesAction = logActionFilter === '' || (log.action || '').toLowerCase().includes(logActionFilter.toLowerCase());
      const matchesAdmin = logAdminFilter === '' || (log.admin || log.userEmail || log.userId || '').toLowerCase().includes(logAdminFilter.toLowerCase());
      return isCorrectType && matchesAction && matchesAdmin;
    });

    if (filteredLogs.length === 0) {
      addToast("No logs to export");
      return;
    }

    const headers = ["Trace ID", "Subject", "Action", "Time", "Status"];
    const rows = filteredLogs.map(log => [
      log.id || '',
      log.admin || log.userEmail || log.userId || 'Anonymous',
      log.action || 'System Event',
      new Date(getValidTime(log)).toLocaleString(),
      "Verified"
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.map(String).map(s => `"${s.replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security_logs_${logType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Logs exported as CSV");
  };

  const [reportsType, setReportsType] = useState<'issues' | 'posts'>('posts');
  const [reportsFilter, setReportsFilter] = useState<'All' | 'Pending' | 'Approved' | 'Flagged' | 'Resolved' | 'Deleted'>('Pending');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [allProblems, setAllProblems] = useState<ProblemReport[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleBulkApprove = async () => {
     let col = activeSubTab === 'suggestions' ? 'suggestions' : (reportsType === 'posts' ? 'posts' : 'problems');
     for (const id of selectedItems) {
        try {
           await updateDoc(doc(db, col, id), { status: col === 'posts' || col === 'suggestions' ? (col === 'suggestions' ? 'approved' : 'Approved') : 'solved' });
        } catch(e) {}
     }
     setSelectedItems([]);
     addToast(`Bulk Approved ${selectedItems.length} items`);
  };

  const handleBulkDelete = async () => {
    let col = activeSubTab === 'suggestions' ? 'suggestions' : (reportsType === 'posts' ? 'posts' : 'problems');
    const res = await Swal.fire({
        title: 'Delete Selected?',
        text: `Are you sure you want to delete ${selectedItems.length} items?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete'
    });
    if (res.isConfirmed) {
        for (const id of selectedItems) {
            try {
               await updateDoc(doc(db, col, id), { status: 'Deleted', deletedAt: Date.now() });
            } catch(e) {}
        }
        setSelectedItems([]);
        addToast(`Bulk Deleted ${selectedItems.length} items`);
    }
  };

  useEffect(() => {
    if (!isEditor) return;

    const unsubProblems = onSnapshot(collection(db, 'problems'), (snap) => {
      const pList: ProblemReport[] = [];
      snap.forEach(d => pList.push({ id: d.id, ...(d.data() as any) }));
      setAllProblems(pList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'problems'));

    let unsubLogs = () => {};
    if (isAdmin) {
      unsubLogs = onSnapshot(query(collection(db, 'security_logs'), orderBy('time', 'desc'), limit(100)), (snap) => {
        const lList: any[] = [];
        snap.forEach(d => lList.push({ id: d.id, ...d.data() }));
        setLogs(lList);
        setLogsError(false);
      }, (err) => {
        setLogsError(true);
        handleFirestoreError(err, OperationType.LIST, 'security_logs');
      });
    }

    return () => {
      unsubProblems();
      unsubLogs();
    };
  }, [isEditor, isAdmin]);

  const deleteUser = async (id: string) => {
    const res = await Swal.fire({
      title: 'Move to Trash?',
      text: "This user will be marked as deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Trash It'
    });
    if (!res.isConfirmed) return;
    try {
      await updateDoc(doc(db, 'users', id), { isDeleted: true });
      addToast("User moved to trash");
    } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `users/${id}`); }
  };

  const resolveProblem = async (problem: ProblemReport) => {
    try {
      await updateDoc(doc(db, 'problems', problem.id), { status: 'solved', resolvedAt: Date.now() });
      
      await addDoc(collection(db, 'notifications'), {
        uid: problem.uid,
        title: "Issue Resolved",
        message: `Your reported issue "${problem.msg.substring(0, 30)}..." has been resolved.`,
        type: "problem_resolved",
        read: false,
        time: Date.now()
      });

      addToast("Problem marked as solved!");
    } catch (err: any) { 
      handleFirestoreError(err, OperationType.WRITE, `problems/${problem.id}`);
      addToast("Failed to update"); 
    }
  };

  if (adminLocked) {
    return (
      <div className="fixed inset-0 z-[5000] bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center relative z-10"
        >
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <Lock size={40} className="text-blue-400" />
          </div>
          <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Admin Session Locked</h2>
          <p className="text-slate-400 font-bold mb-8 uppercase text-xs tracking-widest">Restricted Access Level: 1</p>
          
          <div className="max-w-xs mx-auto">
            <input 
              type="password" 
              placeholder="Enter Access PIN" 
              className="w-full bg-slate-900 border-2 border-slate-800 focus:border-blue-500 p-4 rounded-2xl text-center text-2xl tracking-[1em] outline-none shadow-inner"
              onKeyUp={(e) => {
                const target = e.target as HTMLInputElement;
                // Simple demo PIN for now, can be changed to dynamic check
                if (target.value === currentAdminPin) {
                  setAdminLocked(false);
                }
              }}
            />
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-4">Security PIN required to view sensitive data</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-[#f8fafc] overflow-hidden border border-slate-200">
      {/* SIDEBAR */}
      <AnimatePresence>
        {(adminMenuOpen || window.innerWidth >= 1024) && (
          <motion.aside 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`w-full lg:w-64 bg-[#1a1c1e] text-white p-6 shrink-0 flex flex-col absolute lg:relative z-50 h-full lg:h-auto ${adminMenuOpen ? 'fixed inset-y-0 left-0 max-w-[280px]' : 'hidden lg:flex'}`}
          >
            <div className="flex items-center justify-between mb-0 pb-0 border-b border-white/5 text-[13px] leading-[18px]">
              <div className="flex items-center gap-3">
                <div className="logo-pro logo-pro-glow relative">
                  <div className="logo-particles"><span></span><span></span><span></span></div>
                  <svg viewBox="0 0 64 64" width="36" height="36">
                    <defs>
                      <linearGradient id="adminG" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-white/20 logo-ring" />
                    <circle cx="32" cy="32" r="28" fill="url(#adminG)" />
                    <circle cx="32" cy="32" r="24" fill="#0d3b66" />
                    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="900">EV</text>
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight leading-none mb-1">E-VEDHIKA</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Admin</p>
                </div>
              </div>
              <button aria-label="Close menu" className="lg:hidden text-white/50 hover:text-white" onClick={() => setAdminMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {[
                { id: 'dash', label: 'Analytics Dashboard', icon: <Activity size={18}/> },
                { id: 'reports', label: 'Posts & Issues', icon: <AlertOctagon size={18}/> },
                { id: 'suggestions', label: 'Suggestions & Feedback', icon: <PlusCircle size={18}/> },
                { id: 'users', label: 'User Access & Directory', icon: <Users size={18}/> },
                { id: 'trash', label: 'Recycle Bin', icon: <Trash2 size={18}/> },
                { id: 'updates', label: 'Flash News', icon: <Zap size={18}/> },
                { id: 'changelog', label: "What's New", icon: <Info size={18}/> },
                { id: 'logs', label: 'Security Logs', icon: <ShieldAlert size={18}/> },
                { id: 'settings', label: 'System Config', icon: <Settings size={18}/> }
              ].filter(t => isAdmin || ['dash', 'reports', 'suggestions', 'trash', 'updates'].includes(t.id)).map(tab => (
                <button aria-label={tab.label}
                  key={tab.id}
                  onClick={() => { setActiveSubTab(tab.id); setAdminMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 p-2.5 lg:p-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeSubTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-0 border-t border-white/5 space-y-1.5">
              <button aria-label="Exit to Portal" onClick={onExit} className="w-full flex items-center gap-3 p-2.5 lg:p-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                <LogOut size={16} />
                Exit to Portal
              </button>
              <button aria-label="Lock Session" onClick={() => setAdminLocked(true)} className="w-full flex items-center gap-3 p-2.5 lg:p-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-400/10 transition-all">
                <Lock size={16} />
                Lock Session
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* OVERLAY FOR MOBILE */}
      <AnimatePresence>
        {adminMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAdminMenuOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

              <main className="flex-1 p-2 lg:p-6 bg-slate-50 overflow-y-auto custom-scrollbar flex flex-col relative w-full h-full" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 !bg-transparent !h-auto !p-0">
          <div className="flex items-center gap-4">
            <button aria-label="Open Admin Menu" className="lg:hidden p-2 bg-white text-slate-600 rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors" onClick={() => setAdminMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                {activeSubTab === 'dash' && '📊 Dashboard Hub'}
                {activeSubTab === 'reports' && '🚩 Posts & Issues'}
                {activeSubTab === 'users' && '👥 User Access & Directory'}
                {activeSubTab === 'trash' && '🗑️ Recycle Bin System'}
                {activeSubTab === 'logs' && '🛡️ Security Audits'}
                {activeSubTab === 'settings' && '⚙️ System Settings'}
                {activeSubTab === 'suggestions' && '💡 Suggestions & Feedback'}
                {activeSubTab === 'updates' && '⚡ Flash News'}
                {activeSubTab === 'changelog' && "🚀 What's New Management"}
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 ml-1">Administration & Monitoring Terminal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {(activeSubTab === 'reports' || activeSubTab === 'dash') && (
               <button aria-label="Create New Post"
                 onClick={onNewPost}
                 className="px-6 py-3 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
               >
                 <PlusCircle size={18} /> Create New Post
               </button>
             )}
             <ClockWidget />
          </div>
        </header>

        {activeSubTab === 'dash' && (
          <div className="space-y-8 pb-20">
            {/* Unified Stat Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
            >
              {[
                { label: 'Citizens Enrolled', value: users.filter(u => !(u.isDeleted || u.role === 'deleted')).length, icon: <Users size={20} className="sm:w-6 sm:h-6" />, color: 'blue' },
                { label: 'Unresolved Issues', value: allProblems.filter(p => !p.status || (!['solved','resolved','deleted'].includes((p.status||'').toLowerCase()))).length, icon: <AlertTriangle size={20} className="sm:w-6 sm:h-6" />, color: 'rose' },
                { label: 'Pending Curation', value: posts.filter(p => !p.status || (p.status||'').toLowerCase() === 'pending').length, icon: <Megaphone size={20} className="sm:w-6 sm:h-6" />, color: 'amber' },
                { label: 'Flash Broadcasts', value: updates.filter(u => (u.type === 'flash' || !u.type) && u.status?.toLowerCase() !== 'deleted').length, icon: <Zap size={20} className="sm:w-6 sm:h-6" />, color: 'emerald' },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    if (stat.label === 'Citizens Enrolled') setActiveSubTab('users');
                    else if (stat.label === 'Unresolved Issues') { setActiveSubTab('reports'); setReportsType('issues'); }
                    else if (stat.label === 'Pending Curation') { setActiveSubTab('reports'); setReportsType('posts'); }
                    else if (stat.label === 'Flash Broadcasts') setActiveSubTab('updates');
                  }}
                  className="bg-white p-3 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 group hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-2xl flex shrink-0 items-center justify-center bg-slate-50 text-slate-600 group-hover:scale-110 transition-transform">{stat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight sm:leading-none mb-1 sm:mb-1 truncate">{stat.label}</p>
                    <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
                  </div>
                </div>
              ))}
            </motion.div>


          </div>
        )}

        {(activeSubTab === 'reports' || activeSubTab === 'suggestions') && (
           <div className="space-y-8 pb-20">
              {activeSubTab === 'reports' && (
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 mb-6">
                  {['posts', 'issues'].map(type => (
                    <button aria-label={type}
                      key={type}
                      onClick={() => setReportsType(type as any)}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportsType === type ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {type === 'posts' ? '🚩 Community Posts' : '⚠️ Citizen Issues'}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex flex-wrap items-center gap-3">
                   {['All', 'Approved', 'Pending', 'Resolved', 'Deleted'].map(f => (
                      <button aria-label={f}
                         key={f}
                         onClick={() => setReportsFilter(f as any)} 
                         className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${reportsFilter === f ? 'bg-indigo-900 border-indigo-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                         {f}
                      </button>
                   ))}
                   {reportsFilter === 'Deleted' && (
                      <button aria-label="Empty Trash"
                        onClick={async () => {
                           const res = await Swal.fire({
                              title: 'Empty Trash?',
                              text: 'This will permanently delete all items in the trash. This action cannot be undone.',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#ef4444',
                              confirmButtonText: 'Yes, Empty Trash'
                           });
                           if (res.isConfirmed) {
                              const col = activeSubTab === 'reports' ? (reportsType === 'posts' ? 'posts' : 'problems') : 'suggestions';
                              const list = activeSubTab === 'reports' ? (reportsType === 'posts' ? posts : allProblems) : suggestions;
                              const deletedItems = list.filter(i => (i.status || '').toLowerCase() === 'deleted');
                              try {
                                 await Promise.all(deletedItems.map((item: any) => deleteDoc(doc(db, col, item.id))));
                                 addToast(`Permanently deleted ${deletedItems.length} items`);
                              } catch(e: any) { addToast("Error: " + e.message); }
                           }
                        }}
                        className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border bg-red-50 border-red-100 text-red-600 hover:bg-red-600 hover:text-white ml-auto flex items-center gap-2 shadow-sm"
                      >
                         <Trash2 size={14} /> Empty Trash
                      </button>
                   )}
                </div>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                  <table className="w-full text-left border-separate border-spacing-y-4">
                     <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                           <th className="pb-4 pl-8 font-black">Context & Interaction</th>
                           <th className="pb-4 font-black">Status & Identification</th>
                           <th className="pb-4 text-right pr-8 font-black">Administrative Actions</th>
                        </tr>
                     </thead>
                     <tbody className="space-y-4">
                        {(activeSubTab === 'reports' ? (reportsType === 'posts' ? posts : allProblems) : suggestions)
                          .filter(item => {
                             if (reportsFilter === 'All') return (item.status || '').toLowerCase() !== 'deleted';
                             if (reportsFilter === 'Pending') return !item.status || (item.status||'').toLowerCase() === 'pending';
                             return (item.status || '').toLowerCase() === reportsFilter.toLowerCase();
                          })
                          .map((item, idx) => (
                             <motion.tr 
                               initial={{ opacity: 0, y: 10 }} 
                               animate={{ opacity: 1, y: 0 }} 
                               transition={{ delay: idx * 0.05 }}
                               key={item.id} 
                               className={`group bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all border border-slate-100 ${activeSubTab === 'suggestions' ? 'border-l-4 border-l-amber-400 bg-amber-50/10' : ''}`}
                             >
                                <td className="py-4 pl-6">
                                   <div className="flex items-center gap-4 mb-3">
                                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${
                                        activeSubTab === 'suggestions' ? 'bg-amber-100 text-amber-600' :
                                        reportsType === 'posts' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
                                      }`}>
                                         {item.photoURL ? <img src={item.photoURL} alt="Profile" className="w-full h-full object-cover rounded-2xl" loading="lazy" referrerPolicy="no-referrer" /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><User size={18}/></div>}
                                      </div>
                                      <div>
                                         <h5 className="font-black text-slate-800 text-[15px] leading-tight mb-1">
                                            {item.userName || item.name || 'Portal User'}
                                         </h5>
                                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2">
                                            <Mail size={10}/> {item.userEmail || item.userId || 'Citizen Entry'}
                                         </p>
                                      </div>
                                   </div>
                                   <div className={`p-5 rounded-2xl border ${activeSubTab === 'suggestions' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                                      <p className="text-[12px] text-slate-700 font-bold leading-relaxed italic">
                                        "{item.msg || item.content || item.text || item.problem || item.suggestion}"
                                      </p>
                                   </div>
                                </td>
                                <td className="py-6">
                                   <div className="space-y-4">
                                      <div className="flex flex-wrap items-center gap-2">
                                         <span className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                           item.status === 'Approved' || item.status === 'Resolved' || item.status === 'solved' || item.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
                                           item.status === 'flagged' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                                         }`}>
                                            {item.status || 'Processing'}
                                         </span>
                                         <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                                            <Hash size={12}/> {item.category || (activeSubTab === 'suggestions' ? 'SUUCHANA (SUGGESTION)' : 'GENERAL')}
                                         </span>
                                      </div>
                                      <div className="flex items-center gap-2.5 text-slate-400 pl-2">
                                         <Clock size={14}/>
                                         <span className="text-[11px] font-black uppercase tracking-tighter">
                                            {new Date(getValidTime(item)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                         </span>
                                      </div>
                                   </div>
                                </td>
                                <td className="py-4 text-right pr-6">
                                   <div className="flex justify-end items-center gap-2">
                                      <select 
                                        value={(item.status || 'pending').toLowerCase()}
                                        onChange={async (e) => {
                                          try {
                                            const col = activeSubTab === 'reports' ? (reportsType === 'posts' ? 'posts' : 'problems') : 'suggestions';
                                            await updateDoc(doc(db, col, item.id), { status: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) });
                                            addToast("Status Updated");
                                          } catch(err: any) { addToast(err.message); }
                                        }}
                                        className="bg-slate-50 border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest p-2 pr-8 rounded-xl focus:border-blue-500 outline-none w-auto min-w-[150px] shadow-sm cursor-pointer"
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="flagged">Flagged</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="deleted">Deleted (Trash)</option>
                                      </select>
                                      
                                      <button aria-label="Edit Post"
                                        onClick={() => {
                                           if (activeSubTab === 'reports' && reportsType === 'posts') {
                                              onEditPost(item);
                                           } else {
                                              Swal.fire({
                                                title: 'Quick Signal Override',
                                                input: 'textarea',
                                                inputLabel: 'Modify Public Message',
                                                inputValue: item.msg || item.content || item.text || item.problem || item.suggestion,
                                                showCancelButton: true,
                                                confirmButtonColor: '#2563eb'
                                              }).then(async (res) => {
                                                 if (res.isConfirmed && res.value) {
                                                   const col = activeSubTab === 'reports' ? (reportsType === 'posts' ? 'posts' : 'problems') : 'suggestions';
                                                   const field = item.msg ? 'msg' : (item.problem ? 'problem' : (item.content ? 'content' : 'text'));
                                                   await updateDoc(doc(db, col, item.id), { [field]: res.value });
                                                   addToast("Signal Synchronized");
                                                 }
                                              });
                                           }
                                        }}
                                        className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        title="Edit Content"
                                      >
                                         <Edit3 size={18}/>
                                      </button>

                                      {item.status?.toLowerCase() === 'deleted' ? (
                                        <div className="flex items-center gap-2">
                                          <button aria-label="Restore"
                                             onClick={async () => {
                                                try {
                                                  const col = activeSubTab === 'reports' ? (reportsType === 'posts' ? 'posts' : 'problems') : 'suggestions';
                                                  await updateDoc(doc(db, col, item.id), { status: 'Pending' });
                                                  addToast("Restored from Trash");
                                                } catch(err: any) { addToast(err.message); }
                                             }}
                                             className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm text-xs font-bold gap-2"
                                             title="Restore Item"
                                          >
                                             <RotateCcw size={14}/> Restore
                                          </button>

                                          <button aria-label="Permanently Delete"
                                             onClick={async () => {
                                                const res = await Swal.fire({
                                                  title: 'Permanently Delete?',
                                                  text: 'This action cannot be undone.',
                                                  icon: 'error',
                                                  showCancelButton: true,
                                                  confirmButtonColor: '#ef4444',
                                                  confirmButtonText: 'Yes, Delete Permanently'
                                                });
                                                if (res.isConfirmed) {
                                                   try {
                                                     const col = activeSubTab === 'reports' ? (reportsType === 'posts' ? 'posts' : 'problems') : 'suggestions';
                                                     await deleteDoc(doc(db, col, item.id));
                                                     addToast("Permanently Deleted");
                                                   } catch(err: any) { addToast(err.message); }
                                                }
                                             }}
                                             className="px-3 py-2 bg-red-100 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm text-xs font-bold gap-2"
                                             title="Permanently Delete"
                                          >
                                             <Trash2 size={14}/> Permanently Delete
                                          </button>
                                        </div>
                                      ) : (
                                        <button aria-label="Trash Item"
                                          onClick={async () => {
                                             const res = await Swal.fire({
                                               title: 'Move to Trash?',
                                               text: 'This item will be marked as deleted.',
                                               icon: 'warning',
                                               showCancelButton: true,
                                               confirmButtonColor: '#ef4444',
                                               confirmButtonText: 'Yes, Trash'
                                             });
                                             if (res.isConfirmed) {
                                                try {
                                                  const col = activeSubTab === 'reports' ? (reportsType === 'posts' ? 'posts' : 'problems') : 'suggestions';
                                                  await updateDoc(doc(db, col, item.id), { status: 'Deleted' });
                                                  addToast("Moved to Trash");
                                                } catch(err: any) { addToast(err.message); }
                                             }
                                          }}
                                          className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                          title="Move to Trash"
                                        >
                                           <Trash2 size={18}/>
                                        </button>
                                      )}
                                   </div>
                                </td>
                             </motion.tr>
                          ))}
                     </tbody>
                  </table>
               </div>
            </div>
        )}
        {activeSubTab === 'users' && (
           <div className="space-y-12 pb-20">
              <div className="pt-8 text-left">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 bg-white rounded-[32px] shadow-sm border border-slate-100">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                      🛡️ Access Control
                    </h3>
                    <p className="text-sm font-bold text-slate-500 mt-1">Manage user roles, visibility and suspensions.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button aria-label="All Users" onClick={() => setUsersFilter('All')} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${usersFilter === 'All' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}>All Users</button>
                    <button aria-label="Deleted Users" onClick={() => setUsersFilter('Deleted')} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${usersFilter === 'Deleted' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20 scale-105' : 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100 hover:border-rose-200'}`}>Deleted (Trash)</button>
                    
                    {usersFilter === 'Deleted' && (
                        <button aria-label="Empty User Trash"
                          onClick={async () => {
                             const res = await Swal.fire({
                                title: 'Empty Trash?',
                                text: 'This will permanently delete all users in the trash. This action cannot be undone.',
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#ef4444',
                                confirmButtonText: 'Yes, Empty Trash'
                             });
                             if (res.isConfirmed) {
                                const deletedUsers = users.filter(u => u.isDeleted || u.role === 'deleted');
                                try {
                                   await Promise.all(deletedUsers.map(u => deleteDoc(doc(db, 'users', u.id))));
                                   addToast(`Permanently deleted ${deletedUsers.length} users`);
                                } catch(e: any) { addToast("Error: " + e.message); }
                             }
                          }}
                          className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border bg-red-50 border-red-100 text-red-600 hover:bg-red-600 hover:text-white flex items-center gap-2 shadow-sm"
                        >
                           <Trash2 size={14} /> Empty Trash
                        </button>
                     )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {users.filter(u => usersFilter === 'Deleted' ? (u.isDeleted || u.role === 'deleted') : (!u.isDeleted && u.role !== 'deleted')).sort((a, b) => (b.time || 0) - (a.time || 0)).map(u => (
                     <motion.div 
                       layout
                       key={u.id}
                       className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 relative overflow-hidden group"
                     >
                        <div className="absolute top-0 right-0 p-4 flex gap-2">
                           {usersFilter === 'Deleted' ? (
                             <>
                               <button aria-label="Restore Settings" 
                                  onClick={async () => {
                                     try {
                                        await updateDoc(doc(db, 'users', u.id), { isDeleted: false, role: u.role === 'deleted' ? 'user' : u.role });
                                        addToast("User restored from trash");
                                     } catch (err: any) { addToast("Error: " + err.message); }
                                  }}
                                  className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                  title="Restore User"
                               >
                                  <RotateCcw size={16} /> Restore
                               </button>
                               <button aria-label="Permanently Delete User" 
                                  onClick={async () => {
                                     const res = await Swal.fire({
                                        title: 'Permanently Delete User?',
                                        text: 'This action cannot be undone.',
                                        icon: 'error',
                                        showCancelButton: true,
                                        confirmButtonColor: '#ef4444',
                                        confirmButtonText: 'Yes, Delete Permanently'
                                     });
                                     if (res.isConfirmed) {
                                        try {
                                           await deleteDoc(doc(db, 'users', u.id));
                                           addToast("User permanently deleted");
                                        } catch (err: any) { addToast("Error: " + err.message); }
                                     }
                                  }}
                                  className="p-2 text-red-500 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                                  title="Permanently Delete"
                               >
                                  <X size={16} />
                               </button>
                             </>
                           ) : (
                             <>
                               <button aria-label={u.role === 'suspended' ? 'Unblock User' : 'Block User'}
                                 onClick={async () => {
                                   try {
                                     const nextRole = u.role === 'suspended' ? 'user' : 'suspended';
                                     await updateDoc(doc(db, 'users', u.id), { role: nextRole });
                                     addToast(nextRole === 'suspended' ? "User Access Restricted" : "User Access Restored");
                                     
                                     await addDoc(collection(db, 'security_logs'), {
                                       admin: auth.currentUser?.email || 'System',
                                       action: `${nextRole === 'suspended' ? 'Blocked' : 'Unblocked'} User: ${u.email || u.id}`,
                                       time: Date.now()
                                     });
                                   } catch (e: any) { addToast(e.message); }
                                 }} 
                                 title={u.role === 'suspended' ? "Unblock User" : "Block User"}
                                 className={`p-2 rounded-lg transition-colors ${u.role === 'suspended' ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                               >
                                 <ShieldAlert size={16}/>
                               </button>
                               <button aria-label={u.hidden ? 'Show Profile' : 'Hide Profile'}
                                 onClick={async () => {
                                   try {
                                     await updateDoc(doc(db, 'users', u.id), { hidden: !u.hidden });
                                     addToast(u.hidden ? "Profile Restored" : "Profile Hidden");
                                   } catch (e: any) { addToast(e.message); }
                                 }} 
                                 title={u.hidden ? "Show Profile" : "Hide Profile"}
                                 className={`p-2 rounded-lg transition-colors ${u.hidden ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-blue-500 hover:bg-slate-50'}`}
                               >
                                 {u.hidden ? <EyeOff size={16}/> : <Eye size={16}/>}
                               </button>
                               <button aria-label="Delete user" onClick={() => deleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Move to Trash"><Trash2 size={16}/></button>
                             </>
                           )}
                        </div>
                        <div className="flex items-start gap-4 mb-6 pt-2">
                          <div className={`w-14 h-14 bg-slate-100 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden border-2 shadow-sm transition-all ${u.role === 'suspended' ? 'grayscale border-red-200 scale-95' : 'border-white'}`}>
                             {u.photoURL ? <img src={u.photoURL} alt={u.name || "User"} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" /> : <User size={24} className="text-slate-300" />}
                          </div>
                          <div>
                             <h4 className="font-black text-primary text-sm mb-1 flex items-center gap-2">
                                {u.name || u.surname ? `${u.name || ''} ${u.surname || ''}`.trim() : (u.email ? u.email.split('@')[0] : 'Unknown User')}
                                {u.hidden && <span className="bg-amber-100 text-amber-600 text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black">Hidden</span>}
                                {u.role === 'suspended' && <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black animate-pulse">Blocked</span>}
                             </h4>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {u.username ? `@${u.username}` : (u.email || u.id)}
                             </p>
                          </div>
                       </div>
                       
                       <div className="space-y-4">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                             <span>Registered</span>
                             <span className="text-slate-600 tracking-normal font-bold normal-case">{u.time ? new Date(u.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown'}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                             <span>Access Level</span>
                             <span className={`px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{u.role || 'User'}</span>
                          </div>
                          <select 
                            value={u.role || 'user'}
                            onChange={async (e) => {
                              try {
                                await updateDoc(doc(db, 'users', u.id), { role: e.target.value });
                                addToast("Role Authorization Updated");
                              } catch (err) { handleFirestoreError(err, OperationType.WRITE, `users/${u.id}`); }
                            }}
                            className="w-full !mb-0 bg-slate-50 border-slate-100 text-[11px] font-black uppercase tracking-widest p-3 rounded-xl focus:border-blue-500 outline-none transition-all cursor-pointer"
                          >
                             <option value="user">USER</option>
                             <option value="moderator">MODERATOR</option>
                             <option value="editor">EDITOR</option>
                             <option value="admin">SYSTEM ADMIN</option>
                             <option value="suspended">SUSPENDED (BLOCK)</option>
                          </select>

                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Profile Visibility</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{u.hidden ? 'Hidden from Directory' : 'Visible to Public'}</span>
                             </div>
                             <button aria-label="Toggle Profile Visibility"
                               onClick={async () => {
                                 try {
                                   await updateDoc(doc(db, 'users', u.id), { hidden: !u.hidden });
                                   addToast(u.hidden ? "Profile Restored to Directory" : "Profile Hidden from Directory");
                                 } catch (e: any) { addToast(e.message); }
                               }}
                               className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${u.hidden ? 'bg-slate-200' : 'bg-emerald-500 shadow-lg shadow-emerald-500/20'}`}
                             >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${u.hidden ? 'translate-x-0' : 'translate-x-6'}`} />
                             </button>
                          </div>

                          <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location: {u.mandal ? `${u.mandal}, ${u.district}` : (u.village || 'Undefined')}</div>
                             <button aria-label="View Full File" onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)} className="text-[10px] font-black text-blue-500 uppercase hover:underline">View Full File</button>
                          </div>
                          {expandedUser === u.id && (
                             <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">
                                <div><span className="text-slate-400 block mb-1">Gender</span>{u.gender || 'N/A'}</div>
                                <div><span className="text-slate-400 block mb-1">Mobile</span>{u.mobile || 'N/A'}</div>
                                <div><span className="text-slate-400 block mb-1">Email</span>{u.email || 'N/A'}</div>
                                <div><span className="text-slate-400 block mb-1">State</span>{u.state || 'N/A'}</div>
                                <div><span className="text-slate-400 block mb-1">District</span>{u.district || 'N/A'}</div>
                                <div><span className="text-slate-400 block mb-1">Mandal</span>{u.mandal || 'N/A'}</div>
                                <div className="col-span-2"><span className="text-slate-400 block mb-1">Village/Town</span>{u.village || 'N/A'}</div>
                                <div><span className="text-slate-400 block mb-1">Office</span>{u.office || u.village || (u.mandal ? `${u.mandal} Office` : 'N/A')}</div>
                             </div>
                          )}
                       </div>
                     </motion.div>
                   ))}
                </div>
              </div>
           </div>
        )}

        {activeSubTab === 'trash' && (
           <div className="space-y-8 pb-20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                       <Trash2 className="text-rose-500" />
                       Recycle Bin System
                    </h3>
                    <p className="text-sm font-bold text-slate-500 mt-1">Manage and permanently drop deleted resources.</p>
                 </div>
                 <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {(['posts', 'problems', 'suggestions', 'users', 'updates'] as const).map(tab => (
                       <button aria-label={tab} key={tab}
                          onClick={() => setTrashTab(tab)}
                          className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${trashTab === tab ? 'bg-white text-rose-500 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'}`}
                       >
                          {tab}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 border-b border-slate-100">
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             <th className="p-5 pl-8">Item Detail</th>
                             <th className="p-5">Type / Category</th>
                             <th className="text-right p-5 pr-8">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {(() => {
                             let list: any[] = [];
                             let col = '';
                             if (trashTab === 'posts') {
                                list = posts.filter((p: any) => p.status?.toLowerCase() === 'deleted');
                                col = 'posts';
                             } else if (trashTab === 'problems') {
                                list = problems.filter((p: any) => p.status?.toLowerCase() === 'deleted');
                                col = 'problems';
                             } else if (trashTab === 'suggestions') {
                                list = suggestions.filter((s: any) => s.status?.toLowerCase() === 'deleted');
                                col = 'suggestions';
                             } else if (trashTab === 'users') {
                                list = users.filter((u: any) => u.isDeleted || u.role === 'deleted');
                                col = 'users';
                             } else if (trashTab === 'updates') {
                                list = updates.filter((u: any) => u.status?.toLowerCase() === 'deleted');
                                col = 'updates';
                             }

                             if (list.length === 0) {
                                return (
                                   <tr>
                                      <td colSpan={3} className="p-12 text-center">
                                         <Trash2 size={40} className="mx-auto text-slate-200 mb-4" />
                                         <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No deleted {trashTab} found</p>
                                      </td>
                                   </tr>
                                );
                             }

                             return (
                                <>
                                  <tr>
                                     <td colSpan={3} className="p-4 bg-rose-50/50 border-b border-rose-100 text-right pr-8">
                                        <button aria-label="Empty Trash"
                                           onClick={async () => {
                                              const res = await Swal.fire({
                                                title: `Empty ${trashTab} Trash?`,
                                                text: 'This will permanently delete ALL items in this category. This action cannot be undone.',
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonColor: '#ef4444',
                                                confirmButtonText: 'Yes, Empty Trash'
                                              });
                                              if (res.isConfirmed) {
                                                 try {
                                                    await Promise.all(list.map(item => deleteDoc(doc(db, col, item.id))));
                                                    addToast(`Permanently deleted ${list.length} ${trashTab}`);
                                                 } catch(e: any) { addToast("Error: " + e.message); }
                                              }
                                           }}
                                           className="px-5 py-2.5 bg-rose-100 text-rose-600 rounded-xl text-xs font-black tracking-widest uppercase hover:bg-rose-500 hover:text-white transition-all inline-flex items-center gap-2 shadow-sm"
                                        >
                                           <Trash2 size={16} /> Empty {trashTab} Trash
                                        </button>
                                     </td>
                                  </tr>
                                  {list.map((item, idx) => (
                                     <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-5 pl-8">
                                           <p className="text-sm font-bold text-slate-700 decoration-rose-200 decoration-2 line-through">
                                              {trashTab === 'posts' ? item.title || 'Untitled Post' : ''}
                                              {trashTab === 'problems' ? item.title || item.desc?.substring(0, 40) || 'Unknown Problem' : ''}
                                              {trashTab === 'suggestions' ? item.title || item.desc?.substring(0, 40) || 'Unknown Suggestion' : ''}
                                              {trashTab === 'users' ? item.email || item.name || 'Unknown User' : ''}
                                              {trashTab === 'updates' ? item.text || item.title || 'Unknown Update' : ''}
                                           </p>
                                           <p className="text-xs font-medium text-slate-400 mt-1 max-w-md truncate">
                                              {item.id}
                                           </p>
                                        </td>
                                        <td className="p-5">
                                           <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100">
                                              {trashTab}
                                           </span>
                                        </td>
                                        <td className="p-5 pr-8">
                                           <div className="flex justify-end gap-2">
                                              <button aria-label="Restore"
                                                 onClick={async () => {
                                                    try {
                                                       if (trashTab === 'users') {
                                                          await updateDoc(doc(db, 'users', item.id), { isDeleted: false, role: item.role === 'deleted' ? 'user' : item.role });
                                                       } else if (trashTab === 'updates') {
                                                          await updateDoc(doc(db, 'updates', item.id), { status: 'visible' });
                                                       } else {
                                                          await updateDoc(doc(db, col, item.id), { status: 'Pending' });
                                                       }
                                                       addToast("Restored from Trash");
                                                    } catch(err: any) { addToast("Error: " + err.message); }
                                                 }}
                                                 className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm text-[10px] uppercase tracking-widest font-black gap-2"
                                                 title="Restore Item"
                                              >
                                                 <RotateCcw size={14}/> Restore
                                              </button>
                                              <button aria-label="Permanently Delete"
                                                 onClick={async () => {
                                                    const res = await Swal.fire({
                                                      title: 'Permanently Delete?',
                                                      text: 'This action cannot be undone.',
                                                      icon: 'error',
                                                      showCancelButton: true,
                                                      confirmButtonColor: '#ef4444',
                                                      confirmButtonText: 'Yes, Delete Permanently'
                                                    });
                                                    if (res.isConfirmed) {
                                                       try {
                                                          await deleteDoc(doc(db, col, item.id));
                                                          addToast("Permanently Deleted");
                                                       } catch(err: any) { addToast("Error: " + err.message); }
                                                    }
                                                 }}
                                                 className="px-3 py-2 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm text-[10px] uppercase tracking-widest font-black gap-2"
                                                 title="Permanently Delete"
                                              >
                                                 <Trash2 size={14}/> Permanent
                                              </button>
                                           </div>
                                        </td>
                                     </tr>
                                  ))}
                                </>
                             );
                          })()}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {activeSubTab === 'updates' && (
          <div className="space-y-10 pb-20">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Zap size={120} className="text-amber-500 fill-amber-500" />
               </div>
               <h4 className="text-xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-3">
                  <span className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center"><Zap size={20} /></span>
                  Broadcast Live Intelligence
               </h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 pr-20">Instant network-wide transmission system. Messages appear on citizen terminals immediately.</p>
               
               <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = e.target as any;
                    const text = f.text.value;
                    if(!text) return;
                    try {
                      await addDoc(collection(db, 'updates'), { text, time: Date.now(), type: 'flash', status: 'visible' });
                      
                      // Global Broadcast
                      await addDoc(collection(db, 'notifications'), {
                        uid: 'all',
                        title: "🚀 New Update",
                        message: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
                        type: "flash_update",
                        read: false,
                        time: Date.now()
                      });

                      f.reset();
                      addToast("Intelligence Transmitted & Broadcasted");
                    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'updates'); }
                  }}
                  className="flex flex-col sm:flex-row gap-4 relative z-10"
               >
                  <input name="text" placeholder="Enter flash bulletin content..." className="flex-1 !mb-0 p-5 rounded-[24px] border-slate-100 bg-slate-50 focus:bg-white focus:border-amber-400 shadow-inner text-sm font-bold placeholder:text-slate-300 transition-all" />
                  <button aria-label="Transmit" className="bg-amber-500 hover:bg-amber-600 text-white px-12 py-5 rounded-[24px] font-black uppercase text-[11px] tracking-widest shadow-xl shadow-amber-200 active:scale-95 transition-all">Transmit</button>
               </form>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Active Signal Feed</h4>
               <div className="grid gap-4">
                  {updates.filter(u => (u.type === 'flash' || !u.type) && u.status?.toLowerCase() !== 'deleted').sort((a: any, b: any) => (b.time || 0) - (a.time || 0)).map((u, idx) => (
                    <div key={u.id || `upd-${idx}`} className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-all ${u.status === 'hidden' ? 'opacity-50 grayscale bg-slate-50 border-dashed' : ''}`}>
                       <div className="flex items-center gap-4 flex-1">
                          <div className={`w-2 h-2 rounded-full ${u.status === 'hidden' ? 'bg-slate-400' : 'bg-blue-500 animate-pulse'}`} />
                          <div className="flex-1">
                            <input 
                              defaultValue={u.text} 
                              onBlur={async (e) => {
                                if (e.target.value !== u.text) {
                                  try {
                                    await updateDoc(doc(db, 'updates', u.id), { text: e.target.value });
                                    addToast("Transmission Modified");
                                  } catch(e: any) { addToast(e.message); }
                                }
                              }}
                              className="text-sm font-bold text-slate-700 bg-transparent border-none outline-none focus:ring-0 w-full cursor-text"
                            />
                          </div>
                       </div>
                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button aria-label={u.status === 'hidden' ? "Make Visible" : "Hide From Public"}
                            onClick={async () => {
                              try {
                                const nextStatus = u.status === 'hidden' ? 'visible' : 'hidden';
                                await updateDoc(doc(db, 'updates', u.id), { status: nextStatus });
                                addToast(nextStatus === 'hidden' ? "Transmission Paused" : "Transmission Live");
                              } catch(e: any) { addToast(e.message); }
                            }}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title={u.status === 'hidden' ? "Make Visible" : "Hide From Public"}
                          >
                             {u.status === 'hidden' ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button aria-label="Delete Transmission"
                            onClick={() => {
                              Swal.fire({
                                title: 'Delete Transmission?',
                                text: "This will permanently remove the flash news.",
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#ef4444',
                                confirmButtonText: 'Yes, Purge it!'
                              }).then(async (result) => {
                                if (result.isConfirmed) {
                                  try {
                                    await updateDoc(doc(db, 'updates', u.id), { status: 'Deleted', deletedAt: Date.now() });
                                    addToast("Transmission Trash-ed");
                                  } catch(e: any) { handleFirestoreError(e, OperationType.UPDATE, `updates/${u.id}`); }
                                }
                              });
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeSubTab === 'logs' && (
           <div className="space-y-8 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {logsError ? (
                   <div className="col-span-full p-12 text-center bg-slate-50 rounded-[32px] text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed border-slate-200">
                      Access Restricted
                   </div>
                 ) : (
                    logs.filter(log => !log.admin || !['rakeshkumardhawan123@gmail.com', 'mpo.kasipett@gmail.com'].includes(log.admin)).length > 0 ? (
                      logs.filter(log => !log.admin || !['rakeshkumardhawan123@gmail.com', 'mpo.kasipett@gmail.com'].includes(log.admin)).map((log, lidx) => (
                        <div key={`public-card-${log.id || lidx}`} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                           <div className="flex justify-between items-start mb-4">
                             <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider rounded-full border border-emerald-100">
                               {log.action || 'Event'}
                             </div>
                             <span className="text-[10px] font-mono text-slate-300">#{log.id?.substring(0,6).toUpperCase()}</span>
                           </div>
                           <div className="space-y-2 mb-4">
                             <div className="text-[13px] font-bold text-slate-800 break-all">
                               {log.userEmail || log.userId || 'Anonymous Citizen'}
                             </div>
                             <div className="text-[10px] text-slate-400 flex items-center gap-2">
                               <Clock size={12} />
                               {new Date(getValidTime(log)).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                             </div>
                           </div>
                           <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">Verified Log</span>
                             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                           </div>
                        </div>
                     ))
                    ) : (
                      <div className="col-span-full p-12 text-center bg-slate-50 rounded-[32px] text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed border-slate-200">
                         No Citizen activity recorded
                      </div>
                    )
                 )}
              </div>
           </div>
        )}

        {activeSubTab === 'changelog' && (
           <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-black text-primary mb-2">🚀 What's New Management</h4>
                  <p className="text-xs text-slate-400 font-medium tracking-tight">Manage the "What's New" (changelog) entries for citizens.</p>
                </div>
                <button aria-label="Post New Update"
                  onClick={() => {
                    Swal.fire({
                      title: 'Post New Update',
                      input: 'textarea',
                      inputLabel: 'Update Content',
                      inputPlaceholder: 'Enter the update text...',
                      showCancelButton: true,
                      confirmButtonText: 'Post Update',
                      confirmButtonColor: '#2563eb',
                      inputValidator: (value) => {
                        if (!value) return 'You need to write something!';
                        return null;
                      }
                    }).then((result) => {
                      if (result.isConfirmed && result.value) {
                        addDoc(collection(db, 'updates'), {
                          text: result.value,
                          time: Date.now(),
                          status: 'Approved',
                          type: 'changelog'
                        }).then(() => addToast("Update added successfully!"))
                          .catch(err => handleFirestoreError(err, OperationType.CREATE, 'updates'));
                      }
                    });
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
                >
                  Post New Update
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {[...updates].filter(u => (u.type === 'changelog' || u.status === 'Approved') && u.status?.toLowerCase() !== 'deleted').sort((a:any, b:any) => (b.time || 0) - (a.time || 0)).map((upd: any) => (
                  <div key={upd.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date(getValidTime(upd)).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">{upd.text}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button aria-label="Edit Update"
                          onClick={() => {
                            Swal.fire({
                              title: 'Edit Update',
                              input: 'textarea',
                              inputLabel: 'Update Content',
                              inputValue: upd.text,
                              showCancelButton: true,
                              confirmButtonText: 'Save Changes',
                              confirmButtonColor: '#2563eb',
                              inputValidator: (value) => {
                                if (!value) return 'Content cannot be empty!';
                                return null;
                              }
                            }).then((result) => {
                              if (result.isConfirmed && result.value !== upd.text) {
                                updateDoc(doc(db, 'updates', upd.id), { text: result.value })
                                  .then(() => addToast("Update modified successfully!"))
                                  .catch(err => handleFirestoreError(err, OperationType.UPDATE, `updates/${upd.id}`));
                              }
                            });
                          }}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button aria-label="Delete Update"
                          onClick={() => {
                            Swal.fire({
                              title: 'Delete Update?',
                              text: "This will remove the entry from What's New timeline.",
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#ef4444',
                              confirmButtonText: 'Yes, Delete it!'
                            }).then(async (result) => {
                              if (result.isConfirmed) {
                                try {
                                  await updateDoc(doc(db, 'updates', upd.id), { status: 'Deleted', deletedAt: Date.now() });
                                  addToast("Update moved to trash.");
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.UPDATE, `updates/${upd.id}`);
                                }
                              }
                            });
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {updates.length === 0 && (
                  <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
                    <Zap size={40} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No updates published yet</p>
                  </div>
                )}
              </div>
           </div>
        )}

        {activeSubTab === 'logs' && (
           <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-black text-primary mb-2 flex items-center gap-3">
                    <ShieldAlert size={24} className="text-primary" />
                    Security Audits & Logs
                  </h4>
                  <p className="text-xs text-slate-400 font-medium tracking-tight">System activity monitoring and administration logs.</p>
                </div>
              </div>

              {logsError ? (
                <div className="p-6 bg-red-50 border border-red-100 rounded-3xl text-red-600 text-sm font-bold text-center">
                  Error loading security logs. Required index might be missing.
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                           <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <th className="p-5 pl-8">Admin / User</th>
                              <th className="p-5">Action Performed</th>
                              <th className="p-5 text-right pr-8">Timestamp</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {logs.length === 0 ? (
                             <tr>
                               <td colSpan={3} className="p-8 text-center text-slate-400 font-bold text-sm">No security logs recorded yet.</td>
                             </tr>
                           ) : (
                             logs.map((log: any, i: number) => (
                               <tr key={log.id || i} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-5 pl-8">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                        <User size={14} />
                                      </div>
                                      <span className="text-[12px] font-bold text-slate-700">{log.admin || log.userEmail || 'System'}</span>
                                    </div>
                                  </td>
                                  <td className="p-5 text-[12px] font-medium text-slate-600">{log.action}</td>
                                  <td className="p-5 text-[11px] font-bold text-slate-400 text-right pr-8 uppercase tracking-widest">
                                     {new Date(getValidTime(log)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </td>
                               </tr>
                             ))
                           )}
                        </tbody>
                     </table>
                   </div>
                </div>
              )}
           </div>
        )}

        {activeSubTab === 'settings' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <div>
                    <h4 className="text-xl font-black text-primary mb-2">Global System Config</h4>
                    <p className="text-xs text-slate-400 font-medium tracking-tight">Adjust master operational parameters</p>
                 </div>

                 <div className="space-y-6 p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Governance Mode</label>
                       <select className="w-full !mb-0 bg-white border-slate-200 rounded-2xl p-4 font-bold text-sm outline-none focus:border-blue-500">
                          <option>LIVE (PUBLIC ACCESS)</option>
                          <option>MAINTENANCE (ADMIN ONLY)</option>
                          <option>READ-ONLY (RESTRICTED WRITES)</option>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Security PIN (Level 1)</label>
                       <div className="relative">
                          <input 
                            id="pin-config-field"
                            type={showPin ? "text" : "password"} 
                            placeholder="••••" 
                            className="w-full !mb-0 bg-white border-slate-200 rounded-2xl p-4 font-black text-xl text-center tracking-[1em]" 
                            defaultValue={currentAdminPin} 
                            maxLength={4} 
                          />
                          <button aria-label="Toggle PIN visibility"
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary transition-colors"
                          >
                            {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                       </div>
                    </div>

                    <button aria-label="Sync Global Configuration"
                      onClick={async () => {
                         const pin = (document.getElementById('pin-config-field') as HTMLInputElement)?.value;
                         if (pin && pin.length === 4) {
                            try {
                               await setDoc(doc(db, 'settings', 'admin_config'), { 
                                 pin,
                                 updatedAt: Date.now()
                               }, { merge: true });
                               
                               await addDoc(collection(db, 'security_logs'), { 
                                 admin: auth.currentUser?.email || 'System Admin', 
                                 action: 'Security PIN Modified', 
                                 time: Date.now() 
                               });
                               
                               setCurrentAdminPin(pin);
                               addToast("System Configuration Encoded");
                            } catch (e: any) { addToast(e.message); }
                         } else {
                            addToast("PIN must be 4 digits");
                         }
                      }}
                      className="w-full py-5 bg-primary text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                    >
                       Sync Global Configuration
                    </button>
                 </div>
              </div>

              <div className="space-y-8">
                 <div>
                    <h4 className="text-xl font-black text-primary mb-2">Systems & Audio</h4>
                    <p className="text-xs text-slate-400 font-medium tracking-tight">Audio context and system tools</p>
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <button aria-label="Test Notification Sound" onClick={() => { playNotificationSound(); addToast("Playing notification sound..."); }} className="p-6 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-between group hover:border-blue-500 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all"><Play size={24}/></div>
                          <div className="text-left">
                             <h5 className="font-black text-primary text-sm uppercase">Test Notification Sound</h5>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Initialize & play ding-ding sound</p>
                          </div>
                       </div>
                       <ChevronRight size={18} className="text-slate-300" />
                    </button>
                 </div>

                 <div>
                    <h4 className="text-xl font-black text-primary mb-2">Data Integrity</h4>
                    <p className="text-xs text-slate-400 font-medium tracking-tight">Backup and recovery protocols</p>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4">
                    <button aria-label="Full Snapshot" className="p-6 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-between group hover:border-green-500 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-50 text-green-500 rounded-2xl group-hover:bg-green-500 group-hover:text-white transition-all"><Download size={24}/></div>
                          <div className="text-left">
                             <h5 className="font-black text-primary text-sm uppercase">Full Snapshot</h5>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Generate database backup</p>
                          </div>
                       </div>
                       <ChevronRight size={18} className="text-slate-300" />
                    </button>

                    <button aria-label="Point-in-time Restore" className="p-6 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-between group hover:border-amber-500 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all"><Upload size={24}/></div>
                          <div className="text-left">
                             <h5 className="font-black text-primary text-sm uppercase">Point-in-time Restore</h5>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Load from existing snapshot</p>
                          </div>
                       </div>
                       <ChevronRight size={18} className="text-slate-300" />
                    </button>
                 </div>

                 <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex flex-col gap-3">
                    <div>
                       <h5 className="text-[11px] font-black text-red-600 uppercase flex items-center gap-2 mb-2">
                          <ShieldAlert size={14} /> Danger Zone
                       </h5>
                       <p className="text-[10px] text-red-700/60 font-bold uppercase mb-2 leading-relaxed">
                          Permanent system resets and partition wipes can only be executed via the Secure Root Shell.
                       </p>
                    </div>
                    <button aria-label="Restart Server" 
                       onClick={() => {
                          Swal.fire({
                             title: 'Restarting Server...',
                             text: 'Please wait while system connections are re-initialized.',
                             icon: 'info',
                             allowOutsideClick: false,
                             showConfirmButton: false,
                             didOpen: () => {
                                Swal.showLoading();
                                setTimeout(() => {
                                   window.location.reload();
                                }, 2000);
                             }
                          });
                       }}
                       className="w-full p-4 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                    >
                       <RefreshCw size={16} /> Restart Application Server
                    </button>
                    <button aria-label="Wipe Interaction Cache" className="w-full py-2.5 bg-red-600/10 text-red-700 hover:bg-red-600 hover:text-white transition-colors font-black text-[10px] rounded-xl uppercase tracking-widest">Wipe Interaction Cache</button>
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, val, color }: { label: string, val: number, color: string }) {
  const themes: any = { 
    indigo: { bg: '#eef2ff', border: '#e0e7ff', text: '#3730a3', icon: Clock },
    rose: { bg: '#fff1f2', border: '#ffe4e6', text: '#9f1239', icon: AlertTriangle },
    blue: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: Users },
    red: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: AlertOctagon },
    green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: CheckCircle2 },
    emerald: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', icon: CheckCircle2 },
    cyan: { bg: '#ecfeff', border: '#a5f3fc', text: '#0e7490', icon: Info },
    amber: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: ClipboardList },
    purple: { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8', icon: Zap },
    slate: { bg: '#f8fafc', border: '#e2e8f0', text: '#334155', icon: Hash }
  };
  const theme = themes[color] || themes.blue;
  const Icon = theme.icon;

  return (
    <motion.div 
      whileHover={{ scale: 1.02, translateY: -4 }}
      className="p-5 rounded-[24px] border border-transparent shadow-sm transition-all hover:shadow-lg group cursor-default" 
      style={{ background: theme.bg, borderColor: theme.border }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: theme.text }}>{label}</div>
        <div className="p-2 rounded-xl bg-white/50 shadow-inner group-hover:bg-white transition-colors">
          <Icon size={16} style={{ color: theme.text }} strokeWidth={2.5} />
        </div>
      </div>
      <div className="text-3xl font-black tracking-tight" style={{ color: theme.text }}>{val}</div>
      <div className="h-1 w-8 rounded-full mt-3 bg-current opacity-20" style={{ color: theme.text }}></div>
    </motion.div>
  );
}

function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2);
  } catch (e) {
    return String(obj);
  }
}

function SmartAssistant({ title, placeholder, systemInstruction, icon: Icon }: { title: string, placeholder: string, systemInstruction: string, icon: any }) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: input,
        config: {
          systemInstruction: systemInstruction,
        },
      });
      setResponse(response.text || "No response received.");
    } catch (error) {
      console.error("AI Error:", error);
      setResponse("Sorry, I encountered an error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className="text-primary" />
        <h4 className="font-bold text-sm text-primary">{title}</h4>
      </div>
      <div className="flex gap-2">
        <input 
          className="flex-1 bg-white border p-2 rounded-xl text-sm" 
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
        />
        <button 
          aria-label="Ask assistant"
          onClick={handleAsk}
          disabled={loading}
          className="bg-primary text-white p-2 rounded-xl disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
      </div>
      {response && (
        <div className="mt-3 p-3 bg-white rounded-xl text-xs text-slate-600 border border-slate-100 markdown-body">
          <ReactMarkdown>{response}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function DigitalWorkspaceSection({ addToast, user }: { addToast: (s:string) => void, user: FirebaseUser | null }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [showTrainingBot, setShowTrainingBot] = useState(false);

  const tools = [
    { id: 'dsr', title: 'DSR Analyzer', icon: BarChart3, desc: 'Analyze Daily Status Reports' },
    { id: 'multiday', title: 'Multi-Day attendance', icon: Layers, desc: 'Multiple Attendance Records' },
    { id: 'training', title: 'Digital Training', icon: GraduationCap, desc: 'Workflows & Tutorials' },
    { id: 'pract', title: 'PR Act Hub', icon: Book, desc: 'A to Z Interactive Guide' }
  ];

  return (
    <div className="section-card card-blue relative">
      <motion.h2 
        initial={{ x: -10, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }}
        style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <LayoutDashboard size={24} style={{ color: '#0891b2' }} /> Mana Panchayath
      </motion.h2>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Advanced tools for PR & RD Officers.</p>

      <div className="mana-grid">
        {tools.map(t => (
          <div key={t.id} className="mana-card" onClick={() => setActiveTool(t.id)}>
            <div style={{ color: 'var(--primary)', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
              <t.icon size={32} />
            </div>
            <h4>{t.title}</h4>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {activeTool === 'dsr' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: '20px', borderTop: '2px dashed #e2e8f0', paddingTop: '20px' }}>
            <DSRAnalyzer addToast={addToast} user={user} />
          </motion.div>
        )}
        {activeTool === 'multiday' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: '20px', borderTop: '2px dashed #e2e8f0', paddingTop: '20px' }}>
            <MultiDayAnalyzer addToast={addToast} user={user} />
          </motion.div>
        )}
        {activeTool === 'training' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: '20px', borderTop: '2px dashed #e2e8f0', paddingTop: '20px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><GraduationCap /> Digital Workflows</h3>
                <button aria-label="Ask Training Bot" onClick={() => setShowTrainingBot(!showTrainingBot)} style={{ background: '#f1f5f9', border: 'none', padding: '5px 12px', borderRadius: '15px', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Bot size={14} /> {showTrainingBot ? "Hide Help" : "Ask Training Bot"}
                </button>
             </div>

             <AnimatePresence>
                {showTrainingBot && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ marginBottom: '20px' }}>
                    <SmartAssistant 
                      title="Training Helper"
                      placeholder="How do I process a DSR? What is the login workflow?"
                      systemInstruction="You are a helpful training assistant for the Mana Panchayath workspace. You help users understand workflows like DSR Analysis (uploading .xls files, viewing charts) and Digital Training steps. Keep answers short and instructional."
                      icon={GraduationCap}
                    />
                  </motion.div>
                )}
             </AnimatePresence>

             {(!user || user.isAnonymous) ? (
                <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl flex flex-col items-center justify-center text-center mt-6">
                   <Lock className="w-16 h-16 text-slate-400 mb-4" />
                   <h4 className="font-black text-2xl text-slate-800 mb-2">Full Access Required</h4>
                   <p className="text-slate-500 max-w-md">Please log in to access the Digital Training content and workflows.</p>
                </div>
             ) : (
                <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                   {[1, 2, 3].map(step => (
                     <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                       <div style={{ width: '40px', height: '40px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>{step}</div>
                       <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                         <span style={{ fontWeight: 700 }}>Workflow Step {step}</span>
                         <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Detailed tutorial content for step {step} will appear here.</p>
                       </div>
                     </div>
                   ))}
                </div>
             )}
          </motion.div>
        )}
        {activeTool === 'pract' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: '20px', borderTop: '2px dashed #e2e8f0', paddingTop: '20px' }}>
            <PRActHub user={user} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormsHub({ addToast, user }: { addToast: (s:string) => void, user: FirebaseUser | null }) {
  const [forms, setForms] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formUsage, setFormUsage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'forms'), orderBy('time', 'desc')), (snap) => {
      const fArr: any[] = [];
      snap.forEach(d => fArr.push({ id: d.id, ...d.data() }));
      setForms(fArr);
    }, (e) => console.error("Forms Error:", e));
    return () => unsub();
  }, []);

  const handleUpload = async () => {
    if (requireLoginAlert(user)) return;
    if (!formName.trim() || !formPurpose.trim() || !formUsage.trim()) return addToast("Please fill all details to upload.");
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'forms'), {
        name: formName,
        purpose: formPurpose,
        usage: formUsage,
        uid: user.uid,
        userName: user.displayName || user.email || 'User',
        time: Date.now()
      });
      addToast("Form uploaded successfully!");
      setShowUpload(false);
      setFormName(''); setFormPurpose(''); setFormUsage('');
    } catch(e: any) {
      addToast("Error uploading: " + e.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div>
          <h3 className="font-bold">Forms Hub</h3>
          <p className="text-sm text-slate-500">Download essential technical forms or contribute new ones.</p>
        </div>
        <button aria-label="Share Form"
          onClick={() => {
            if (requireLoginAlert(user)) return;
            setShowUpload(!showUpload);
          }} 
          className="bg-primary text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-primary-light transition-all"
        >
          <Upload size={16} /> Share Form
        </button>
      </div>

      <AnimatePresence>
        {showUpload && user && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm mb-4 space-y-3">
              <h4 className="font-black text-sm uppercase text-slate-600 mb-2">Upload New Form</h4>
              <input type="text" placeholder="Form Name (e.g. DSR Leave Template)" value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:border-primary/50 border border-slate-200 text-sm font-medium" />
              <textarea placeholder="What is this form for?" value={formPurpose} onChange={e => setFormPurpose(e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:border-primary/50 border border-slate-200 text-sm h-24 custom-scrollbar" />
              <textarea placeholder="Who uses it and how is it used?" value={formUsage} onChange={e => setFormUsage(e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:border-primary/50 border border-slate-200 text-sm h-24 custom-scrollbar" />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase w-2/3">Note: All uploaded forms are publicly visible and verified by Admin.</p>
                <button aria-label="Publish Form" disabled={submitting} onClick={handleUpload} className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 text-sm transition-colors">
                   {submitting ? 'Sharing...' : 'Publish Form'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(!user || user.isAnonymous) ? (
         <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl flex flex-col items-center justify-center text-center mt-6">
            <Lock className="w-16 h-16 text-slate-400 mb-4" />
            <h4 className="font-black text-2xl text-slate-800 mb-2">Full Access Required</h4>
            <p className="text-slate-500 max-w-md">Please log in to view the uploaded forms, instructions, and download the documents.</p>
         </div>
      ) : (
        <div className="grid gap-4">
          {forms.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">No forms uploaded yet.</p>
            </div>
          ) : (
            forms.map(f => (
              <div key={f.id} className="p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center font-black">
                       📄
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 leading-tight">{f.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">By {f.userName}</p>
                    </div>
                  </div>
                  <button aria-label="Download form" onClick={() => addToast("Starting download...")} className="p-2 bg-slate-50 hover:bg-primary hover:text-white text-slate-600 rounded-xl transition-all">
                    <Download size={18} />
                  </button>
                </div>
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Purpose</span>
                    <p className="text-xs text-slate-600 font-medium">{f.purpose}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Usage Guide</span>
                    <p className="text-xs text-slate-600 font-medium">{f.usage}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DirectorySection({ allUsers }: { allUsers: UserProfile[] }) {
  const [q, setQ] = useState('');
  const [distFilter, setDistFilter] = useState('');
  const [mandalFilter, setMandalFilter] = useState('');
  
  const districts = [...new Set(allUsers.map(u => u.district).filter(Boolean))].sort() as string[];
  const mandals = distFilter ? [...new Set(allUsers.filter(u => u.district === distFilter).map(u => u.mandal).filter(Boolean))].sort() as string[] : [];

  const filtered = allUsers.filter(u => {
    const term = q.toLowerCase();
    const matchesSearch = (u.name || '').toLowerCase().includes(term) || 
                         (u.surname || '').toLowerCase().includes(term) || 
                         (u.designation || '').toLowerCase().includes(term);
    
    const matchesDist = !distFilter || u.district === distFilter;
    const matchesMandal = !mandalFilter || u.mandal === mandalFilter;
    
    return matchesSearch && matchesDist && matchesMandal;
  });

  return (
    <div className="space-y-6">
      <div className="section-card card-blue !p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Users size={100} /></div>
        <h2 className="text-3xl font-black text-primary mb-2 flex items-center gap-3">
           👥 సభ్యుల డైరెక్టరీ <span className="text-slate-400 text-sm font-bold">(Member Directory)</span>
        </h2>
        <p className="text-sm font-bold text-slate-500">పంచాయతీ రాజ్ మరియు గ్రామీణాభివృద్ధి అధికారుల వివరాలు.</p>
        
        <div className="mt-8 flex flex-col md:flex-row items-center gap-4">
           <div className="flex-1 flex items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/20 shadow-inner w-full">
              <Search size={20} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="పేరు లేదా పోస్ట్ ద్వారా వెతకండి (Search by name or post...)" 
                className="!bg-transparent !border-none !p-0 !m-0 focus:!ring-0 text-sm w-full font-bold text-primary placeholder:text-slate-400"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
           </div>
           
           <div className="flex gap-3 w-full md:w-auto">
              <select 
                value={distFilter} 
                onChange={e => { setDistFilter(e.target.value); setMandalFilter(''); }}
                className="bg-white px-4 py-3 rounded-2xl border border-slate-200 text-[11px] font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary/20 transition-all min-w-[140px]"
              >
                 <option value="">అన్ని జిల్లాలు (All Districts)</option>
                 {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select 
                value={mandalFilter} 
                onChange={e => setMandalFilter(e.target.value)}
                disabled={!distFilter}
                className="bg-white px-4 py-3 rounded-2xl border border-slate-200 text-[11px] font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary/20 transition-all min-w-[140px] disabled:opacity-50"
              >
                 <option value="">మండలం వారీగా (Mandal Wise)</option>
                 {mandals.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? filtered.map(u => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={u.id}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-primary/20 transition-all flex flex-col h-full"
          >
            <div className="flex items-start gap-4 mb-6">
               <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-white shadow-md overflow-hidden shrink-0">
                  {u.photoURL ? <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" /> : <User size={30} className="m-auto mt-3 text-slate-200" />}
               </div>
               <div className="flex-1 min-w-0">
                  <h4 className="font-black text-primary text-base truncate leading-tight">
                    {u.name || u.surname ? `${u.name || ''} ${u.surname || ''}`.trim() : 'Active Member'}
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {u.designation || 'PR Officer'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active Verified</span>
                  </div>
               </div>
            </div>

            <div className="space-y-3 flex-1">
               <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <Building size={16} className="text-slate-400" />
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Workplace</span>
                     <span className="text-[11px] font-bold text-slate-700 leading-tight">
                        {u.office || u.village || (u.mandal ? `${u.mandal} Office` : 'General Office')}
                     </span>
                  </div>
               </div>
               
               <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <Flag size={16} className="text-slate-400" />
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Jurisdiction</span>
                     <span className="text-[11px] font-bold text-slate-700 leading-tight">
                        {u.mandal ? `${u.mandal}, ${u.district}` : (u.district || 'Undefined Area')}
                     </span>
                  </div>
               </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Contact</span>
                  <span className="text-[10px] font-bold text-slate-400">{u.mobile ? `+91 ${u.mobile.substring(0, 5)}...` : 'Not Public'}</span>
               </div>
               <button aria-label="View Card" onClick={() => {
                  Swal.fire({
                    title: `<div class="font-black text-primary p-2">${u.name || ''} ${u.surname || ''}</div>`,
                    html: `
                      <div class="text-left space-y-4 p-4">
                        <div class="grid grid-cols-2 gap-4 mt-6">
                          <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                             <span class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Mandal</span>
                             <span class="text-xs font-bold text-primary">${u.mandal || 'N/A'}</span>
                          </div>
                          <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                             <span class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Village</span>
                             <span class="text-xs font-bold text-primary">${u.village || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    `,
                    confirmButtonText: 'Great!',
                    confirmButtonColor: '#0d3b66',
                    customClass: {
                      popup: 'rounded-[32px] border-none',
                      confirmButton: 'rounded-2xl px-10 py-3 font-black uppercase text-xs'
                    }
                  });
               }} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95">
                  View Card
               </button>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-slate-300" />
             </div>
             <h3 className="font-black text-slate-400 uppercase tracking-widest">No Members Found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
function StatusCell({ status }: { status: string }) {
  if (status === 'P-I') return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-200" title="Present (Intime: <= 9:00 AM)">✅ Attendance in time</span>;
  if (status === 'P-L') return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black border border-orange-200" title="Present (Late: > 9:00 AM)">⚠️ Late Attendance</span>;
  if (status === 'P') return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-200">✅ PRESENT</span>;
  if (status === 'A') return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black border border-rose-200">❌ ABSENT</span>;
  if (status === 'M') return <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-[10px] font-black border border-cyan-200">🤝 MEETING</span>;
  if (status === 'T') return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black border border-amber-200">🎓 TRAINING</span>;
  if (status === 'L') return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-black border border-slate-200">🏠 LEAVE</span>;
  return <span className="text-slate-300 font-bold">-</span>;
}

function MultiDayAnalyzer({ addToast, user }: { addToast: (s:string) => void, user: any }) {
  const [aggregatedData, setAggregatedData] = useState<Map<string, { gp: string, mandal: string, district: string, division: string, mandalLgd: string, panchayatLgd: string, attendance: Record<string, string>, times: Record<string, string>, dsr: Record<string, boolean> }>>(new Map());
  const [allDates, setAllDates] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mandalFilter, setMandalFilter] = useState("All");
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [parserDebug, setParserDebug] = useState<{file: string, sheet: string, date: string, gpColIdx: number, gpColName: string, statusColIdx: number, statusColName: string, rowsFound: number, datesFound: number}[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [expandedMandals, setExpandedMandals] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(true);

  const toggleMandal = (m: string) => {
    const next = new Set(expandedMandals);
    if (next.has(m)) next.delete(m);
    else next.add(m);
    setExpandedMandals(next);
  };

  const toggleAllMandals = (expand: boolean) => {
    if (expand) {
      const mandals = Array.from(new Set(Array.from(aggregatedData.values()).map(v => v.mandal)));
      setExpandedMandals(new Set(mandals));
    } else {
      setExpandedMandals(new Set());
    }
  };

  const onUpload = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;

    setIsAnalyzing(true);
    await loadHeavyModules();
    const newAggregated = new Map(aggregatedData);
    const datesFound = new Set(allDates);
    const updatedRawRows: any[][] = [...rawRows];
    const debugLogs: any[] = [...parserDebug];

    try {
      for (const file of files) {
        const dataBuffer = await file.arrayBuffer();
        let sheetsToProcess: { sheetName: string, rows: any[][] }[] = [];
        
        try {
          let text = new window.TextDecoder('utf-8').decode(dataBuffer);
          let isHtml = false;
          
          if (!text.toLowerCase().includes('<tr') && !text.toLowerCase().includes('<table')) {
            const utf16Text = new window.TextDecoder('utf-16le').decode(dataBuffer);
            if (utf16Text.toLowerCase().includes('<tr') || utf16Text.toLowerCase().includes('<table')) {
               text = utf16Text;
               isHtml = true;
            }
          } else {
            isHtml = true;
          }

          if (isHtml) {
             const parser = new DOMParser();
             const doc = parser.parseFromString(text, 'text/html');
             const trs = doc.querySelectorAll('tr');
             const rows = Array.from(trs).map(tr => 
               Array.from(tr.querySelectorAll('th, td')).map(td => {
                 let val = td.textContent?.trim().replace(/\s+/g, ' ') || '';
                 if (val.includes('</th>') || val.includes('</td>') || val.includes('<th') || val.includes('<td')) {
                   // Clean up if tags leaked into textContent
                   val = val.replace(/<\/?[^>]+(>|$)/g, "").trim();
                 }
                 return val;
               })
             );
             if (rows.length > 0) {
                // Check if it's a "one column" row that actually has tags in it (meaning querySelectorAll failed)
                const firstRow = rows[0];
                if (firstRow.length === 1 && (firstRow[0].includes('<tr') || firstRow[0].includes('<td'))) {
                   // Simple regex fallback for badly malformed HTML
                   const betterRows = text.split(/<\/tr>/i).map(trStr => {
                     return trStr.split(/<\/td>|<\/th>/i).map(tdStr => {
                       return tdStr.replace(/<\/?[^>]+(>|$)/g, "").trim();
                     }).filter(c => c !== '');
                   }).filter(r => r.length > 0);
                   if (betterRows.length > 0) {
                      sheetsToProcess.push({ sheetName: "HTML_REGEX_" + file.name, rows: betterRows });
                   } else {
                      sheetsToProcess.push({ sheetName: "HTML_" + file.name, rows });
                   }
                } else {
                   sheetsToProcess.push({ sheetName: "HTML_" + file.name, rows });
                }
             }
          } else {
             const workbook = XLSX.read(dataBuffer, { type: 'array' });
             for (const sheetName of workbook.SheetNames) {
                const rows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false }) as any[][];
                if (rows.length > 0) sheetsToProcess.push({ sheetName, rows });
             }
          }
        } catch (e) {
          console.error("File parsing failed for", file.name, e);
          // Fallback to basic XLSX if something threw error
          if (sheetsToProcess.length === 0) {
             try {
               const workbook = XLSX.read(dataBuffer, { type: 'array' });
               for (const sheetName of workbook.SheetNames) {
                  const rows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false }) as any[][];
                  if (rows.length > 0) sheetsToProcess.push({ sheetName, rows });
               }
             } catch(e2) {
               console.error("Fallback XLSX failed", e2);
             }
          }
        }

        if (sheetsToProcess.length === 0) {
          addToast(`No data found in ${file.name}`);
          continue;
        }
        
        for (const { sheetName, rows } of sheetsToProcess) {
          if (rows.length < 1) continue;

          // 1. HEADER DETECTION
          let headerRowIdx = -1;
          let gpCol = -1, mandalCol = -1, districtCol = -1, divisionCol = -1, mLgdCol = -1, pLgdCol = -1;
          let dataStartCol = -1;

          for (let r = 0; r < Math.min(rows.length, 50); r++) {
            const row = rows[r];
            if (!row || !Array.isArray(row)) continue;
            const rStr = row.map(c => String(c || '').toLowerCase().replace(/\s+/g, ' '));
            
            if (rStr.some(c => c.includes('panchayat') || c.includes('gp ') || c.includes('gram'))) {
              headerRowIdx = r;
              gpCol = rStr.findIndex(c => (c.includes('panchayat') || c.includes('gp ') || c.includes('gram')) && !c.includes('lgd'));
              mandalCol = rStr.findIndex(c => (c.includes('mandal') || c.includes('block')) && !c.includes('lgd'));
              districtCol = rStr.findIndex(c => c.includes('district'));
              divisionCol = rStr.findIndex(c => c.includes('division'));
              mLgdCol = rStr.findIndex(c => c.includes('mandal lgd'));
              pLgdCol = rStr.findIndex(c => c.includes('panchayat lgd'));
              
              if (gpCol === -1) gpCol = rStr.findIndex(c => c.includes('name'));
              if (gpCol === -1) gpCol = 0; // Fallback to first column

              // Find first column likely to be attendance data
              dataStartCol = Math.max(gpCol, pLgdCol, mLgdCol, mandalCol, districtCol, divisionCol) + 1;
              break;
            }
          }

          const dbgIdx = debugLogs.length;
          debugLogs.push({
             file: file.name,
             sheet: sheetName,
             date: 'N/A',
             gpColIdx: gpCol,
             gpColName: headerRowIdx >= 0 ? String(rows[headerRowIdx]?.[gpCol] || 'N/A') : 'No Header',
             statusColIdx: -1,
             statusColName: 'N/A',
             rowsFound: 0,
             datesFound: 0
          });

          if (headerRowIdx === -1) {
             console.log("No header found in", file.name, sheetName);
             console.log("First few rows:", rows.slice(0, 10));
             continue;
          }

          console.log(`[${file.name}] Header Row at ${headerRowIdx}:`, rows[headerRowIdx]);
          console.log(`[${file.name}] Data Row 1:`, rows[headerRowIdx + 1]);
          let curDistrict = 'Unknown', curDivision = 'Unknown', curMandal = 'Unknown', curMLgd = '-';
          let rowsAdded = 0;

          for (let r = headerRowIdx + 1; r < rows.length; r++) {
            const row = rows[r];
            if (!row || !Array.isArray(row)) continue;

            const gpNameRaw = String(row[gpCol] || '').trim();
            // Skip sub-headers or empty GP rows
            if (!gpNameRaw || gpNameRaw.toLowerCase().includes('total') || gpNameRaw.toLowerCase().includes('attendance')) continue;

            updatedRawRows.push([file.name, sheetName, ...row]);

            if (districtCol !== -1 && String(row[districtCol] || '').trim()) curDistrict = String(row[districtCol]).trim();
            if (divisionCol !== -1 && String(row[divisionCol] || '').trim()) curDivision = String(row[divisionCol]).trim();
            if (mandalCol !== -1 && String(row[mandalCol] || '').trim()) curMandal = String(row[mandalCol]).trim();
            if (mLgdCol !== -1 && String(row[mLgdCol] || '').trim()) curMLgd = String(row[mLgdCol]).trim();
            
            const pLgd = pLgdCol !== -1 ? String(row[pLgdCol] || '').trim() : '-';
            const key = `${curMandal.toUpperCase()}_${gpNameRaw.toUpperCase()}`;
            
            if (!newAggregated.has(key)) {
              newAggregated.set(key, { 
                gp: gpNameRaw, 
                mandal: curMandal,
                district: curDistrict,
                division: curDivision,
                mandalLgd: curMLgd,
                panchayatLgd: pLgd,
                attendance: {}, times: {}, dsr: {} 
              });
            }
            const entry = newAggregated.get(key)!;

            // HORIZONTAL MULTI-DAY SCAN (Government Portal Format)
            const headers = rows[headerRowIdx] || [];
            for (let c = 0; c < row.length; c++) {
              if (c === gpCol || c === mandalCol || c === districtCol || c === mLgdCol || c === pLgdCol) continue;
              
              const val = String(row[c] || '').trim();
              const headerVal = String(headers[c] || '').trim();
              
              const dateRegex = /(\d{1,4}[-./ ]+\d{1,4}[-./ ]+\d{2,4}|\d{1,4}[-./ ]+[A-Za-z]{3,10}[-./ ]+\d{2,4})/i;
              
              const dateMatch = val.match(dateRegex);
              if (dateMatch && val.includes(':')) {
                const dateKey = dateMatch[0].replace(/\//g, '-').replace(/\./g, '-');
                datesFound.add(dateKey);
                
                if (!entry.times[dateKey]) {
                   entry.times[dateKey] = val;
                }
                
                // Status is usually the column immediately to the left of the time column
                if (c > 0 && !entry.attendance[dateKey]) {
                  const statusVal = String(row[c-1] || '').trim();
                  if (statusVal && statusVal.length < 50 && !statusVal.includes(':') && !statusVal.includes('202')) {
                    entry.attendance[dateKey] = statusVal;
                  }
                }
              } 
              else if (val && !val.includes(':') && !val.includes('202')) {
                // Check if current or previous column header has a date (Alternative horizontal format)
                const hMatch = headerVal.match(dateRegex);
                if (hMatch) {
                   const dKey = hMatch[0].replace(/\//g, '-').replace(/\./g, '-');
                   datesFound.add(dKey);
                   entry.attendance[dKey] = val;
                }
                if (c > 0) {
                   const prevHMatch = String(headers[c-1] || '').match(dateRegex);
                   if (prevHMatch) {
                      const dKey = prevHMatch[0].replace(/\//g, '-').replace(/\./g, '-');
                      datesFound.add(dKey);
                      if (!entry.attendance[dKey]) {
                         entry.attendance[dKey] = val;
                      }
                   }
                }
              }
            }
            rowsAdded++;
          }

          if (debugLogs[dbgIdx]) {
            debugLogs[dbgIdx].rowsFound = rowsAdded;
            debugLogs[dbgIdx].datesFound = datesFound.size;
          }
        }
      }

      setAllDates(Array.from(datesFound).sort());
      setAggregatedData(newAggregated);
      setRawRows(updatedRawRows);
      setParserDebug(debugLogs);
      addToast(`Analyzed ${files.length} reports successfully!`);
    } catch (err) {
      console.error(err);
      addToast("Failed to analyze files");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadRawExcel = async () => {
    await loadHeavyModules();
    if (rawRows.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet(rawRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Combined Raw Data");
    XLSX.writeFile(wb, `MultiDay_Combined_Raw_${new Date().toLocaleDateString()}.xlsx`);
    addToast("మొత్తం కలిపిన Raw డేటా డౌన్లోడ్ అవుతోంది...");
  };

  const downloadRawPdf = async () => {
    await loadHeavyModules();
    if (rawRows.length === 0) return;
    const doc = new jsPDF('l', 'mm', 'a4');
    autoTable(doc, {
      body: rawRows.slice(0, 500), // Limit for PDF safety
      styles: { fontSize: 5 },
      margin: { top: 10 }
    });
    doc.save(`MultiDay_Combined_Raw_${new Date().toLocaleDateString()}.pdf`);
  };

  const downloadMandalSummary = async () => {
    await loadHeavyModules();
    if (aggregatedData.size === 0) return;
    const mandalSummary = new Map<string, { total: number, present: number }>();
    filteredData.forEach((info) => {
      const m = info.mandal;
      if (!mandalSummary.has(m)) mandalSummary.set(m, { total: 0, present: 0 });
      const s = mandalSummary.get(m)!;
      allDates.forEach(d => {
        s.total++;
        const attStr = String(info.attendance[d] || '').toLowerCase();
        if (attStr.startsWith('p') || attStr.includes('ప్రెసెంట్') || attStr.includes('హాజరు')) s.present++;
      });
    });
    const exportData = Array.from(mandalSummary.entries()).map(([m, s]) => ({
      Mandal: m,
      'Total Checks': s.total,
      'Present Count': s.present,
      'Avg Attendance %': s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mandal Summary");
    XLSX.writeFile(wb, `MultiDay_Mandal_Summary_${new Date().toLocaleDateString()}.xlsx`);
    addToast("మండల్ అటెండెన్స్ సమ్మరీ డౌన్లోడ్ అవుతోంది...");
  };

  const downloadGPSummary = async () => {
    await loadHeavyModules();
    if (aggregatedData.size === 0) return;
    const aoa: any[][] = [];
    
    // Row 1
    const row1 = ['Telangana State'];
    for(let i=0; i < allDates.length * 2 + 3; i++) row1.push('');
    aoa.push(row1);

    // Row 2
    const reportDate = allDates[0] ? new Date(allDates[0].split('-').reverse().join('-')).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : '';
    const row2 = [`Report On Attendance Status & DSR Raw Data ${reportDate}`];
    for(let i=0; i < allDates.length * 2 + 3; i++) row2.push('');
    aoa.push(row2);

    // Row 3 (Status heading)
    const row3 = ['', '', '', ''];
    row3.push('Attendace Status');
    for(let i=0; i < allDates.length * 2 - 1; i++) row3.push('');
    aoa.push(row3);

    // Row 4 (Headers)
    const row4 = ['S.No', 'District Name', 'Mandal Name', 'Panchayat Name'];
    allDates.forEach((d) => {
       row4.push(`First Attendance Status (${d})`);
    });
    aoa.push(row4);

    // Data rows
    filteredData.forEach((info, idx) => {
      const row = [
        idx + 1, 
        info.district,
        info.mandal,
        info.gp
      ];
      allDates.forEach(d => {
        const s = info.attendance[d] || '-';
        row.push(s);
      });
      aoa.push(row);
    });

    // Summary Rows
    const statuses = [
      { label: 'Total Present', matches: (s: string) => s.startsWith('p') || s.includes('ప్రెసెంట్') || s.includes('హాజరు') || s.includes('✅') },
      { label: 'Total Absent', matches: (s: string) => s.startsWith('a') || s.includes('గైర్హాజరు') || s.includes('absent') },
      { label: 'Total Leave', matches: (s: string) => s.startsWith('l') || s.includes('సెలవు') || s.includes('leave') },
      { label: 'Total Meeting', matches: (s: string) => s.startsWith('m') || s.includes('సమావేశం') || s.includes('meeting') },
      { label: 'Total Training', matches: (s: string) => s.startsWith('t') || s.includes('శిక్షణ') || s.includes('training') }
    ];

    statuses.forEach(st => {
      const row: (string | number)[] = ['', '', '', st.label];
      allDates.forEach(d => {
        let count = 0;
        filteredData.forEach(info => {
           const s = String(info.attendance[d] || '').toLowerCase();
           if (st.matches(s)) count++;
        });
        row.push(count);
      });
      aoa.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    
    // Merge cells for headers
    const totalCols = allDates.length + 4;
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // Telangana State
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }, // Report Title
      { s: { r: 2, c: 4 }, e: { r: 2, c: totalCols - 1 } }  // Attendace Status
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GP Comparative");
    XLSX.writeFile(wb, `MultiDay_GP_Comparative_${new Date().toLocaleDateString()}.xlsx`);
    addToast("GP వైజ్ కంపారిటివ్ రిపోర్ట్ డౌన్లోడ్ అవుతోంది...");
  };

  const downloadMultiPdf = async () => {
    await loadHeavyModules();
    if (aggregatedData.size === 0) return;
    const doc = new jsPDF('l', 'mm', 'a4');
    const head = [['S.No', 'District', 'Mandal', 'Panchayat Name', ...allDates.map(d => `Attendance\n${d}`)]];
    const body = filteredData.map((info, idx) => [
      idx + 1,
      info.district,
      info.mandal,
      info.gp,
      ...allDates.map(d => info.attendance[d] || '-')
    ]);
    autoTable(doc, {
      head: head,
      body: body,
      styles: { fontSize: 5 },
      theme: 'grid'
    });
    doc.save(`MultiDay_Comparative_${new Date().toLocaleDateString()}.pdf`);
  };

  const mandals = Array.from(new Set(Array.from(aggregatedData.values()).map(info => info.mandal))).sort();
  const filteredData = Array.from(aggregatedData.values())
    .filter((info) => {
      const target = `${info.gp} ${info.mandal} ${info.district} ${info.division}`.toUpperCase();
      const matchesSearch = target.includes(searchTerm.toUpperCase());
      const matchesMandal = mandalFilter === 'All' || info.mandal === mandalFilter;
      return matchesSearch && matchesMandal;
    })
    .sort((a, b) => {
       const mIdA = (a.mandal || '').toUpperCase();
       const mIdB = (b.mandal || '').toUpperCase();
       if (mIdA !== mIdB) return mIdA.localeCompare(mIdB);
       return (a.gp || '').toUpperCase().localeCompare((b.gp || '').toUpperCase());
    });

  const totalGPCount = filteredData.length;
  const groupedByMandal: Record<string, typeof filteredData> = {};
  filteredData.forEach(item => {
    const mKey = (item.mandal || 'UNKNOWN').toUpperCase();
    if (!groupedByMandal[mKey]) groupedByMandal[mKey] = [];
    groupedByMandal[mKey].push(item);
  });
  const mandalList = Object.keys(groupedByMandal).sort();

  const gpIndexMap = new Map<string, number>();
  filteredData.forEach((item, idx) => {
    gpIndexMap.set(`${(item.mandal || '').toUpperCase()}_${(item.gp || '').toUpperCase()}`, idx + 1);
  });

  const sortedDates = [...allDates].sort((a, b) => {
    const parse = (s: string) => {
      const parts = s.split('-');
      if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
      return 0;
    };
    return parse(a) - parse(b);
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-dashed border-slate-200 text-center">
        <h3 className="font-black text-primary uppercase text-sm tracking-widest mb-4">Multi-Day Comparative Hub</h3>
        <input type="file" multiple onChange={onUpload} className="hidden" id="multi-up" />
        <label htmlFor="multi-up" className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase cursor-pointer hover:scale-105 transition-transform inline-flex items-center gap-2">
          {isAnalyzing ? <RefreshCw className="animate-spin" size={14} /> : <Upload size={14} />} {aggregatedData.size > 0 ? "Upload More Reports" : "Upload Multiple Daily Reports"}
        </label>
        {aggregatedData.size > 0 && (
          <div className="flex justify-center mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest gap-4">
             <span>Reports Synced: {parserDebug.length} files</span>
             <span>•</span>
             <span>Real-time Comparative Engine Active</span>
          </div>
        )}
      </div>

      {showDebug && parserDebug.length > 0 && (
        <div className="p-4 bg-slate-900 rounded-2xl text-[10px] font-mono text-emerald-400 space-y-2 overflow-auto max-h-64 border border-white/10 text-left">
          <div className="text-white font-bold mb-2 uppercase tracking-widest text-xs">Parser Analysis History</div>
          {parserDebug.map((d, i) => (
            <div key={i} className="border-b border-white/5 pb-2">
              <span className="text-blue-400 font-bold">[{d.file} / {d.sheet}]</span> 
              <br/>
              Header Row: {d.gpColName !== 'No Header' ? 'Found' : 'Missing'} | GP Col Name: {d.gpColName} | GPs Parsed: {d.rowsFound}
              <br/>
              <span className={d.datesFound > 0 ? 'text-emerald-400' : 'text-rose-400'}>Report Dates Found: {d.datesFound}</span>
            </div>
          ))}
        </div>
      )}

      {aggregatedData.size > 0 && allDates.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
           <h4 className="font-black text-xl mb-2">No Dates Detected</h4>
           <p className="text-sm">We successfully found the Gram Panchayats in your report, but we could not find any attendance dates. Please ensure the columns contain dates in standard format (e.g., DD/MM/YYYY, DD-MMM-YYYY). Check the debug panel for more info.</p>
        </div>
      )}

      {aggregatedData.size > 0 && allDates.length > 0 && (!user || user.isAnonymous) && (
         <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl flex flex-col items-center justify-center text-center">
            <Lock className="w-16 h-16 text-slate-400 mb-4" />
            <h4 className="font-black text-2xl text-slate-800 mb-2">Full Access Required</h4>
            <p className="text-slate-500 max-w-md">The file has been uploaded and processed successfully. Please log in to view the detailed table, analysis, and download the PDF/Excel reports.</p>
         </div>
      )}

      {aggregatedData.size > 0 && allDates.length > 0 && user && !user.isAnonymous && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end px-2">
             <div className="flex-1 w-full">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block ml-1 tracking-widest">Global Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input className="w-full bg-white border pl-10 p-3 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all border-slate-300" placeholder="Search District, Mandal, GP..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
             </div>
             <div className="w-full md:w-64">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block ml-1 tracking-widest">Filter by Mandal</label>
                <select className="w-full bg-white border p-3 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all border-slate-300" value={mandalFilter} onChange={e => setMandalFilter(e.target.value)}>
                  <option value="All">All Mandals</option>
                  {mandals.map((m, idx) => <option key={`${m}_${idx}`} value={m}>{m}</option>)}
                </select>
             </div>
             <div className="flex gap-2">
                <button aria-label="Expand All Mandals"
                  onClick={() => toggleAllMandals(true)}
                  className="bg-primary/10 text-primary px-4 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-primary/20 transition-colors border border-primary/20"
                >
                  Expand All
                </button>
                <button aria-label="Collapse All Mandals"
                  onClick={() => toggleAllMandals(false)}
                  className="bg-slate-100 text-slate-600 px-4 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  Collapse All
                </button>
             </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-5 rounded-[24px] border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold"><Users size={20} /></div>
                <div>
                   <div className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1">Gram Panchayats</div>
                   <div className="text-2xl font-black text-slate-800">{totalGPCount}</div>
                </div>
             </div>
             <div className="bg-white p-5 rounded-[24px] border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold"><Calendar size={20} /></div>
                <div>
                   <div className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1">Report Dates</div>
                   <div className="text-2xl font-black text-slate-800">{sortedDates.length}</div>
                </div>
             </div>
             <div className="col-span-2 flex gap-3">
               <button aria-label="Download Mandal Summary" onClick={downloadMandalSummary} className="flex-1 bg-white border border-slate-100 p-5 rounded-[24px] text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1"><BarChart3 size={18}/></div>
                 Mandal Summary (XL)
               </button>
               <button aria-label="Download GP Comparative" onClick={downloadGPSummary} className="flex-1 bg-white border border-slate-100 p-5 rounded-[24px] text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1"><Database size={18}/></div>
                 GP Comparative (XL)
               </button>
             </div>
          </div>

        <div className="bg-white border rounded-[24px] shadow-2xl overflow-hidden border-slate-100 ring-1 ring-slate-900/5">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-indigo-600 text-white font-bold text-xs text-left">
                    <th className="p-3 border border-indigo-700 w-12 text-sm text-center">S.No</th>
                    <th className="p-3 border border-indigo-700 text-sm min-w-[120px]">District Name</th>
                    <th className="p-3 border border-indigo-700 min-w-[120px] text-sm">Mandal Name</th>
                    <th className="p-3 border border-indigo-700 min-w-[150px] text-sm">Panchayat Name</th>
                    {sortedDates.map(d => (
                       <th key={d} className="p-3 border border-indigo-700 min-w-[120px] text-center text-sm">Attendance ({d})</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {mandalList.map((mName) => {
                    const isEx = expandedMandals.has(mName);
                    const items = groupedByMandal[mName];
                    return (
                      <React.Fragment key={mName}>
                        <tr 
                          className="bg-slate-50 hover:bg-slate-100 cursor-pointer border-b border-slate-200 group transition-colors" 
                          onClick={() => toggleMandal(mName)}
                        >
                          <td className="p-3 border border-slate-200 text-center font-bold text-indigo-600">
                            {isEx ? <ChevronDown size={16} className="mx-auto" /> : <ChevronRight size={16} className="mx-auto" />}
                          </td>
                          <td colSpan={sortedDates.length + 3} className="p-3 border border-slate-200 font-black text-slate-700 uppercase text-xs flex items-center gap-3">
                            <span>{mName}</span>
                            <span className="text-[10px] bg-white text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 shadow-sm">{items.length} GPs</span>
                          </td>
                        </tr>
                        {isEx && items.map((info) => (
                          <tr key={`${(info.mandal || '').toUpperCase()}_${(info.gp || '').toUpperCase()}`} className="hover:bg-indigo-50/50 text-slate-700 border-b border-slate-100 group transition-colors">
                            <td className="p-3 border border-slate-200 text-center font-medium bg-slate-50 text-slate-400 group-hover:text-indigo-600 text-xs">{gpIndexMap.get(`${(info.mandal || '').toUpperCase()}_${(info.gp || '').toUpperCase()}`)}</td>
                            <td className="p-3 border border-slate-200 uppercase text-xs font-bold text-slate-500">{info.district}</td>
                            <td className="p-3 border border-slate-200 uppercase bg-slate-50/50 text-xs font-black text-slate-600">{info.mandal}</td>
                            <td className="p-3 border border-slate-200 font-black text-slate-800 bg-white text-sm">{info.gp}</td>
                            {sortedDates.map(d => {
                              const status = info.attendance[d] || '-';
                              const time = info.times[d] || '-';
                              const statusLower = status.toLowerCase();
                              let color = "text-slate-400";
                              if (statusLower.includes('present') || statusLower === 'p') color = "text-emerald-700 font-bold";
                              else if (statusLower.includes('absent') || statusLower === 'a') color = "text-rose-700 font-bold";
                              else if (statusLower.includes('leave')) color = "text-amber-700 font-bold";
                              else if (statusLower !== '-') color = "text-blue-700 font-bold";

                              return (
                                <td key={d} className={`p-3 border border-slate-200 text-center whitespace-nowrap text-xs font-black ${color}`}>
                                  {status === '-' ? '-' : (status.length > 15 ? status.substring(0, 15)+'...' : status)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    )
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-sm">
                  {[{ label: 'Total Present', color: 'text-emerald-700', matches: (s: string) => s.startsWith('p') || s.includes('ప్రెసెంట్') || s.includes('హాజరు') || s.includes('✅') },
                    { label: 'Total Absent', color: 'text-rose-700', matches: (s: string) => s.startsWith('a') || s.includes('గైర్హాజరు') || s.includes('absent') },
                    { label: 'Total Leave', color: 'text-amber-700', matches: (s: string) => s.startsWith('l') || s.includes('సెలవు') || s.includes('leave') },
                    { label: 'Total Meeting', color: 'text-cyan-700', matches: (s: string) => s.startsWith('m') || s.includes('సమావేశం') || s.includes('meeting') },
                    { label: 'Total Training', color: 'text-amber-700', matches: (s: string) => s.startsWith('t') || s.includes('శిక్షణ') || s.includes('training') }
                  ].map((st, idx) => (
                    <tr key={idx}>
                      <td colSpan={4} className="p-3 border border-black text-right uppercase text-[#004085]">{st.label}</td>
                      {sortedDates.map(d => {
                        let count = 0;
                        filteredData.forEach(info => {
                           const s = String(info.attendance[d] || '').toLowerCase();
                           if (st.matches(s)) count++;
                        });
                        return (
                          <td key={d} className={`p-3 border border-black text-center ${st.color} w-[10px] h-[31.33px] text-base font-black`}>{count}</td>
                        );
                      })}
                    </tr>
                  ))}
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrainingCenter() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {['DSR Workflow', 'EPFO Registration', 'Aadhar Seeding Guide'].map(guide => (
          <div key={guide} className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-100">
            <span className="font-bold text-sm">📖 {guide}</span>
            <Play size={16} className="text-primary" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolCard({ icon: Icon, emoji, title, onClick }: { icon?: any, emoji?: string, title: string, onClick: () => void }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, translateY: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick} 
      className="mana-card"
    >
      {emoji ? (
        <div className="text-3xl mb-2">{emoji}</div>
      ) : (
        Icon && <Icon size={24} className="mx-auto text-primary" />
      )}
      <h4 className="font-bold mt-1 text-sm">{title}</h4>
    </motion.div>
  );
}

function DSRAnalyzer({ addToast, user }: { addToast: (s:string) => void, user: FirebaseUser | null }) {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [rawJson, setRawJson] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, dsr: 0, pending: 0, meeting: 0, training: 0, leave: 0, before901: 0, after900: 0 });
  const [mandalSummaries, setMandalSummaries] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const onUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      await loadHeavyModules();
      const dataBuffer = evt.target?.result as ArrayBuffer;
      let allRows: any[][] = [];
      
      try {
        const text = new window.TextDecoder('utf-8').decode(dataBuffer);
        if (text.includes('<html') || text.includes('<table') || text.includes('<style')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          const trs = doc.querySelectorAll('tr');
          if (trs.length > 0) {
            allRows = Array.from(trs).map(tr => 
              Array.from(tr.querySelectorAll('td, th')).map(td => td.textContent?.trim().replace(/\s+/g, ' ') || '')
            );
          }
        }
      } catch (e) {
        console.error("HTML fallback failed", e);
      }

      if (allRows.length === 0) {
        try {
          // Attempt standard Excel parsing
          const workbook = XLSX.read(dataBuffer, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        } catch (e) {
          console.error("XLSX parsing failed", e);
        }
      }

      if (allRows.length === 0) {
        addToast("క్షమించండి! ఫైల్ ఖాళీగా ఉంది లేదా చదవడం కుదరలేదు.");
        return;
      }

      setRawJson(allRows);

      // 1. ROBUST HEADER DETECTION
      let bestHeaderIdx = -1;
      let maxScore = 0;
      const mandalKeys = ["mandal", "block", "tehsil"];
      const gpKeys = ["panchayat", "gp name", "gram", "habitation", "village name"];
      
      for (let i = 0; i < Math.min(allRows.length, 100); i++) {
        const rowStrings = (allRows[i] || []).map(c => String(c || "").toLowerCase().trim());
        let score = 0;
        if (rowStrings.some(s => mandalKeys.some(k => s.includes(k)))) score += 3;
        if (rowStrings.some(s => gpKeys.some(k => s.includes(k)))) score += 3;
        if (rowStrings.some(s => s.includes("attendance") || s.includes("status"))) score += 1;
        
        if (score > maxScore) {
          maxScore = score;
          bestHeaderIdx = i;
        }
      }

      // Check if user's hint for row 4 (idx 3) should be used
      if (maxScore < 4 && allRows.length > 3) {
        const row4 = allRows[3]?.map(c => String(c || "").toLowerCase()) || [];
        if (row4.some(s => s.includes('mandal')) || row4.some(s => s.includes('panchayat'))) bestHeaderIdx = 3;
      }

      if (bestHeaderIdx === -1) {
        addToast("క్షమించండి! మీ ఫైల్‌లో 'Mandal Name' మరియు 'Panchayat Name' కాలమ్స్ దొరకలేదు.");
        return;
      }

      // Normalize Headers (check current and next row for merged headers)
      let headers = allRows[bestHeaderIdx].map(h => String(h || "").toLowerCase().trim());
      if (bestHeaderIdx + 1 < allRows.length) {
        const nextRow = allRows[bestHeaderIdx + 1].map(h => String(h || "").toLowerCase().trim());
        nextRow.forEach((val, idx) => {
          if (val && val.length > (headers[idx]?.length || 0)) headers[idx] = val;
        });
      }

      const getIdx = (keys: string[]) => headers.findIndex(h => keys.some(k => h.includes(k)));

      const mandalIdx = getIdx(mandalKeys);
      const gpIdx = getIdx(gpKeys);
      const attStatusIdx = getIdx(["first attendence status", "1st attend status", "attendance status"]);
      const attTimeIdx = getIdx(["first attendence datetime", "1st attend time", "attendance time"]);
      const dsrStatusIdx = getIdx(["dsr entry status", "dsr status", "dsr entry"]);
      const dsrTimeIdx = getIdx(["dsr submited", "dsr submitted", "dsr time"]);

      // Final dynamic fallbacks based on common layout
      const finalMandalIdx = mandalIdx !== -1 ? mandalIdx : 3;
      const finalGpIdx = gpIdx !== -1 ? gpIdx : 5;

      const processed: any[] = [];
      let present = 0, dsr = 0, pending = 0, meeting = 0, training = 0, leave = 0, before901 = 0, after900 = 0;
      const mandalStats = new Map<string, { total: number, onTime: number, late: number, pending: number, meeting: number, training: number, leave: number, dsrPending: number }>();

      allRows.slice(bestHeaderIdx + 1).forEach((r) => {
        const gpRaw = String(r[finalGpIdx] || "").trim();
        const mandalRaw = String(r[finalMandalIdx] || "UNKNOWN").trim().toUpperCase();
        
        if (!gpRaw || gpRaw.length < 2 || gpRaw.toLowerCase().includes('total') || /^\d+$/.test(gpRaw)) return;
        if (gpRaw.toLowerCase() === 'panchayat name') return;

        const attStatusRaw = String(r[attStatusIdx] || "").toLowerCase();
        const dsrStatusRaw = String(r[dsrStatusIdx] || "").toLowerCase();
        const dsrTimeStr = String(r[dsrTimeIdx] || "");

        const isP = attStatusRaw.includes("present") || attStatusRaw.startsWith("p") || attStatusRaw.includes("✅") || attStatusRaw.includes("ప్రెసెంట్") || attStatusRaw.includes("హాజరు");
        const isM = attStatusRaw.includes("meeting") || attStatusRaw.startsWith("m") || attStatusRaw.includes("సమావేశం");
        const isT = attStatusRaw.includes("training") || attStatusRaw.startsWith("t") || attStatusRaw.includes("శిక్షణ");
        const isL = attStatusRaw.includes("leave") || attStatusRaw.startsWith("l") || attStatusRaw.includes("సెలవు");
        const isD = dsrStatusRaw.includes("entered") || dsrStatusRaw.includes("yes") || dsrStatusRaw.includes("✅") || dsrStatusRaw.includes("uploaded");
        const attTimeStr = String(r[attTimeIdx] || "");

        // Time Check (10:30 AM)
        let isOnTime = false;
        let isLate = false;
        if (isD && dsrTimeStr) {
          const timeMatch = dsrTimeStr.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const min = parseInt(timeMatch[2]);
            const isPM = dsrTimeStr.toLowerCase().includes('pm');
            if (isPM && hour < 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;
            
            const totalMinutes = hour * 60 + min;
            if (totalMinutes <= (10 * 60 + 30)) isOnTime = true;
            else isLate = true;
          }
        }

        let isAttBefore901 = false;
        let isAttAfter900 = false;
        if (isP && attTimeStr) {
          const attTimeMatch = attTimeStr.match(/(\d{1,2}):(\d{2})/);
          if (attTimeMatch) {
            let hour = parseInt(attTimeMatch[1]);
            const min = parseInt(attTimeMatch[2]);
            const isPM = attTimeStr.toLowerCase().includes('pm');
            if (isPM && hour < 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;
            
            const totalMinutes = hour * 60 + min;
            if (totalMinutes <= (9 * 60)) isAttBefore901 = true;
            if (totalMinutes > (9 * 60)) isAttAfter900 = true;
          }
        }

        if (isP) {
          present++;
          if (isAttBefore901) before901++;
          if (isAttAfter900) after900++;
        }

        if (isM) meeting++;
        else if (isT) training++;
        else if (isL) leave++;
        else if (isD) dsr++;
        else pending++;
        
        // Aggregate Mandal Stats
        const currentM = mandalStats.get(mandalRaw) || { total: 0, onTime: 0, late: 0, pending: 0, meeting: 0, training: 0, leave: 0, dsrPending: 0 };
        currentM.total++;
        
        if (isM) currentM.meeting++;
        else if (isT) currentM.training++;
        else if (isL) currentM.leave++;
        else if (isD) {
          if (isOnTime) currentM.onTime++;
          else currentM.late++;
        } else {
          currentM.pending++;
          if (isP) currentM.dsrPending++;
        }
        
        mandalStats.set(mandalRaw, currentM);

        processed.push({
          mandal: mandalRaw,
          gp: gpRaw.toUpperCase(),
          attStatus: r[attStatusIdx] || (isP ? "Present" : isM ? "Meeting" : isT ? "Training" : isL ? "Leave" : "Absent"),
          attTime: r[attTimeIdx] || "-",
          dsrStatus: r[dsrStatusIdx] || (isD ? (isOnTime ? "Attendance in time" : "Late Attendance") : (isM ? "Meeting" : isT ? "Training" : isL ? "Leave" : "Pending")),
          dsrTime: dsrTimeStr || "-",
          isPresent: isP,
          isMeeting: isM,
          isTraining: isT,
          isLeave: isL,
          isEntered: isD,
          isOnTime,
          isLate,
          isAttBefore901,
          isAttAfter900
        });
      });

      if (processed.length === 0) {
        addToast("ప్రాసెస్ చేయబడింది, కానీ డేటా ఏమీ దొరకలేదు. ఫైల్ ఫార్మాట్ ఒకసారి చూడండి.");
        return;
      }

      setData(processed);
      setFilteredData(processed);
      setStats({ total: processed.length, present, dsr, pending, meeting, training, leave, before901, after900 });
      // @ts-ignore
      setMandalSummaries(Object.fromEntries(mandalStats));
      addToast(`విజయవంతంగా ప్రాసెస్ చేయబడింది! ${processed.length} గ్రామ పంచాయతీలు దొరికాయి. 🚀`);
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadMandalReport = async () => {
    await loadHeavyModules();
    if (Object.keys(mandalSummaries).length === 0) return;
    
    const exportData = Object.entries(mandalSummaries).map(([mandal, s]: [string, any]) => ({
      'Mandal Name': mandal,
      'Total GPs': s.total,
      'On Time (10:30 AM)': s.onTime,
      'Meeting': s.meeting,
      'Training': s.training,
      'Leave': s.leave,
      'Late Submission': s.late,
      'Pending': s.pending,
      'Success Rate (%)': Math.round(((s.onTime + s.meeting + s.training + s.leave) / s.total) * 100)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mandal Summary");
    XLSX.writeFile(wb, `Mandal_Summary_Report_${new Date().toLocaleDateString()}.xlsx`);
    addToast("మండల్ సమ్మరీ రిపోర్ట్ డౌన్లోడ్ అవుతోంది...");
  };

  const downloadFullReport = async () => {
    await loadHeavyModules();
    if (data.length === 0) return;
    
    const exportData = data.map(r => ({
      'Mandal': r.mandal,
      'GP Name': r.gp,
      'Attendance Status': r.attStatus,
      'Attendance Time': r.attTime,
      'DSR Status': r.isMeeting ? 'Meeting' : r.isTraining ? 'Training' : r.isLeave ? 'Leave' : (r.isOnTime ? 'Attendance in time' : r.isLate ? 'Late Attendance' : 'Pending'),
      'DSR Time': r.dsrTime
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GP Details");
    XLSX.writeFile(wb, `Full_Attendance_Report_${new Date().toLocaleDateString()}.xlsx`);
    addToast("పూర్తి రిపోర్ట్ డౌన్లోడ్ అవుతోంది...");
  };

  const downloadRawExcel = async () => {
    await loadHeavyModules();
    if (rawJson.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet(rawJson);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Raw Data");
    XLSX.writeFile(wb, `Original_Raw_File_${new Date().toLocaleDateString()}.xlsx`);
    addToast("ఒరిజినల్ Raw ఫైల్ (Excel) డౌన్లోడ్ అవుతోంది...");
  };

  const downloadRawPdf = async () => {
    await loadHeavyModules();
    if (rawJson.length === 0) return;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Simple logic to find header if it exists
    let headerIdx = 0;
    for(let i=0; i<Math.min(rawJson.length, 10); i++) {
        if (rawJson[i].some((c:any) => String(c).toLowerCase().includes('mandal') || String(c).toLowerCase().includes('panchayat'))) {
            headerIdx = i;
            break;
        }
    }
    
    const body = rawJson.slice(headerIdx);

    autoTable(doc, {
      body: body,
      styles: { fontSize: 7, font: 'helvetica' },
      margin: { top: 10 }
    });
    
    doc.save(`Original_Raw_File_${new Date().toLocaleDateString()}.pdf`);
    addToast("ఒరిజినల్ Raw ఫైల్ (PDF) డౌన్లోడ్ అవుతోంది...");
  };

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    let filtered = data.filter(r => 
      String(r.gp || "").toLowerCase().includes(term) || 
      String(r.mandal || "").toLowerCase().includes(term)
    );

    if (activeFilter === 'P') filtered = filtered.filter(r => r.isPresent);
    else if (activeFilter === 'D') filtered = filtered.filter(r => r.isEntered);
    else if (activeFilter === 'M') filtered = filtered.filter(r => r.isMeeting);
    else if (activeFilter === 'T') filtered = filtered.filter(r => r.isTraining);
    else if (activeFilter === 'L') filtered = filtered.filter(r => r.isLeave);
    else if (activeFilter === 'B9') filtered = filtered.filter(r => r.isAttBefore901);
    else if (activeFilter === 'A9') filtered = filtered.filter(r => r.isAttAfter900);
    else if (activeFilter === 'NE') filtered = filtered.filter(r => !r.isEntered && !r.isMeeting && !r.isTraining && !r.isLeave);

    setFilteredData(filtered);
  }, [searchTerm, activeFilter, data]);

  return (
    <div className="space-y-6">
      <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] text-center">
        <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-4">DSR Analytical Engine</h4>
        <input type="file" onChange={onUpload} className="hidden" id="dsr-up" />
        <label htmlFor="dsr-up" className="bg-primary text-white px-10 py-4 rounded-2xl font-black cursor-pointer shadow-xl hover:opacity-90 transition-all inline-block text-xs uppercase tracking-widest">
           Select DSR File
        </label>
      </div>

      {data.length > 0 && (!user || user.isAnonymous) && (
         <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl flex flex-col items-center justify-center text-center">
            <Lock className="w-16 h-16 text-slate-400 mb-4" />
            <h4 className="font-black text-2xl text-slate-800 mb-2">Full Access Required</h4>
            <p className="text-slate-500 max-w-md">The DSR file has been uploaded and processed successfully. Please log in to view the detailed analysis, stats, and download the reports.</p>
         </div>
      )}

      {data.length > 0 && user && !user.isAnonymous && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            <button aria-label="Filter Total" onClick={() => setActiveFilter(null)} className="text-left w-full"><StatCard label="Total" val={stats.total} color="blue" /></button>
            <button aria-label="Filter Present" onClick={() => setActiveFilter('P')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'P' ? 'ring-2 ring-emerald-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="Present" val={stats.present} color="emerald" /></button>
            <button title="ఉదయం 9:00 కంటే ముందు విధులకు హాజరైన వారి (Present) సంఖ్య." onClick={() => setActiveFilter('B9')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'B9' ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="Attendance in time" val={stats.before901} color="indigo" /></button>
            <button title="ఉదయం 9:01 తర్వాత విధులకు హాజరైన వారి (Present) సంఖ్య." onClick={() => setActiveFilter('A9')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'A9' ? 'ring-2 ring-rose-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="Late Attendance" val={stats.after900} color="rose" /></button>
            <button aria-label="Filter DSR" onClick={() => setActiveFilter('D')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'D' ? 'ring-2 ring-blue-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="DSR Reported" val={stats.dsr} color="emerald" /></button>
            <button aria-label="Filter No DSR" onClick={() => setActiveFilter('NE')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'NE' ? 'ring-2 ring-amber-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="DSR Not Entered" val={stats.pending} color="amber" /></button>
            <button aria-label="Filter Meeting" onClick={() => setActiveFilter('M')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'M' ? 'ring-2 ring-cyan-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="Meeting" val={stats.meeting} color="cyan" /></button>
            <button aria-label="Filter Training" onClick={() => setActiveFilter('T')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'T' ? 'ring-2 ring-amber-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="Training" val={stats.training} color="amber" /></button>
            <button aria-label="Filter Leave" onClick={() => setActiveFilter('L')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'L' ? 'ring-2 ring-slate-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="Leave" val={stats.leave} color="slate" /></button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-2">
             <button aria-label="Mandal Export"
               onClick={downloadMandalReport}
               className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm hover:bg-blue-100 hover:border-blue-200 active:scale-95 transition-all"
             >
               <Download size={14} /> Mandal Export
             </button>
             <button aria-label="GP Export"
               onClick={downloadFullReport}
               className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 border border-slate-200 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm hover:bg-slate-100 active:scale-95 transition-all"
             >
               <Download size={14} /> GP Export
             </button>
             <button aria-label="Raw Excel Download"
               onClick={downloadRawExcel}
               className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm hover:bg-emerald-100 hover:border-emerald-200 active:scale-95 transition-all"
             >
               <Download size={14} /> Raw Excel
             </button>
             <button aria-label="Raw PDF Download"
               onClick={downloadRawPdf}
               className="flex items-center justify-center gap-2 bg-rose-50 text-rose-700 border border-rose-100 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm hover:bg-rose-100 hover:border-rose-200 active:scale-95 transition-all"
             >
               <Download size={14} /> Raw PDF
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-[32px] border shadow-sm">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Overall Success</h4>
                  <span className="text-sm font-black text-emerald-600">
                    {stats.total > 0 ? Math.round(((stats.present + stats.meeting + stats.training + stats.leave) / stats.total) * 100) : 0}%
                  </span>
               </div>
               <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total > 0 ? ((stats.present + stats.meeting + stats.training + stats.leave) / stats.total) * 100 : 0}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
               </div>
               <div className="mt-3 flex flex-col gap-1">
                  <p className="text-[10px] text-slate-500 font-black uppercase">
                     Total Compliance: {stats.present + stats.meeting + stats.training + stats.leave} / {stats.total}
                  </p>
               </div>
            </div>

            <div className="lg:col-span-1 bg-white p-6 rounded-[32px] border shadow-sm">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">DSR Compliance</h4>
                  <span className="text-sm font-black text-blue-600">{stats.total > 0 ? Math.round((stats.dsr / stats.total) * 100) : 0}%</span>
               </div>
               <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total > 0 ? (stats.dsr / stats.total) * 100 : 0}%` }}
                    className="h-full bg-blue-500 rounded-full"
                  />
               </div>
               <p className="mt-3 text-[10px] text-slate-500 font-medium uppercase italic">
                  {stats.dsr} Present GPs reported DSR (out of {stats.total} total)
               </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-3 gap-4">
               <div className="bg-cyan-50/50 p-4 rounded-[24px] border border-cyan-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-cyan-600">
                      <Users size={14} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Meeting</span>
                    </div>
                    <div className="text-2xl font-black text-cyan-700">{stats.meeting}</div>
                  </div>
                  <p className="text-[8px] text-cyan-600 font-bold uppercase mt-2">DSR Not Required</p>
               </div>
               <div className="bg-amber-50/50 p-4 rounded-[24px] border border-amber-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-amber-600">
                      <GraduationCap size={14} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Training</span>
                    </div>
                    <div className="text-2xl font-black text-amber-700">{stats.training}</div>
                  </div>
                  <p className="text-[8px] text-amber-600 font-bold uppercase mt-2">DSR Not Required</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                      <Hash size={14} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Leave</span>
                    </div>
                    <div className="text-2xl font-black text-slate-700">{stats.leave}</div>
                  </div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase mt-2">DSR Not Required</p>
               </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Database size={14} /> Mandal-wise Summary Dashboard
              </h4>
              <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2">
                <Info size={12} className="text-emerald-600" />
                <span className="text-[9px] font-black text-emerald-700 uppercase">
                  Note: Total OnTime = OnTime + Meeting + Training + Leave
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(mandalSummaries).map(([mandal, mStats]: [string, any], mIdx) => (
                <button aria-label={`View mandal ${mandal}`}
                  key={`${mandal}_${mIdx}`}
                  onClick={() => setSearchTerm(mandal)}
                  className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="text-sm font-black text-primary truncate pr-2">{mandal}</h5>
                    <span className="bg-slate-50 text-[10px] font-black text-slate-400 px-2 py-1 rounded-lg uppercase">
                      {mStats.total} GPs
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    <div className="text-center">
                       <div className="text-[8px] font-black text-emerald-600 uppercase mb-0.5">OnTime</div>
                       <div className="text-[10px] font-black text-slate-700">{mStats.onTime}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[8px] font-black text-cyan-500 uppercase mb-0.5">Meet</div>
                       <div className="text-[10px] font-black text-slate-700">{mStats.meeting}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Leave</div>
                       <div className="text-[10px] font-black text-slate-700">{mStats.leave}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[8px] font-black text-rose-500 uppercase mb-0.5">Late</div>
                       <div className="text-[10px] font-black text-slate-700">{mStats.late}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[8px] font-black text-slate-300 uppercase mb-0.5">Pend</div>
                       <div className="text-[10px] font-black text-slate-700">{mStats.pending}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-1 h-1.5 rounded-full overflow-hidden bg-slate-50">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${((mStats.onTime + mStats.meeting + mStats.training + mStats.leave) / mStats.total) * 100}%` }} />
                    <div className="h-full bg-rose-400 transition-all" style={{ width: `${(mStats.late / mStats.total) * 100}%` }} />
                    <div className="h-full bg-slate-200 transition-all" style={{ width: `${(mStats.pending / mStats.total) * 100}%` }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none" placeholder="Search GP or Mandal..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            
            {activeFilter && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtering by:</span>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 ${
                  activeFilter === 'P' ? 'bg-emerald-100 text-emerald-700' :
                  activeFilter === 'D' ? 'bg-blue-100 text-blue-700' :
                  activeFilter === 'M' ? 'bg-cyan-100 text-cyan-700' :
                  activeFilter === 'T' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {activeFilter === 'P' ? 'Present' : 
                   activeFilter === 'D' ? 'DSR Reported' : 
                   activeFilter === 'NE' ? 'DSR Not Entered' : 
                   activeFilter === 'M' ? 'In Meeting' : 
                   activeFilter === 'T' ? 'In Training' : 'On Leave'}
                  <button aria-label="Clear filter" onClick={() => setActiveFilter(null)} className="hover:opacity-70"><XCircle size={12} /></button>
                </span>
                <button aria-label="Clear Filter" onClick={() => setActiveFilter(null)} className="text-[9px] font-bold text-primary hover:underline uppercase">Clear Filter</button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[32px] border shadow-xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="p-2 sm:p-4 text-[9px] sm:text-[10px]">Mandal / GP</th>
                        <th className="p-2 sm:p-4 text-center text-[9px] sm:text-[10px]">Attendance</th>
                        <th className="p-2 sm:p-4 text-center text-[9px] sm:text-[10px]">DSR Status</th>
                        <th className="p-2 sm:p-4 text-center text-[9px] sm:text-[10px]">Submitted</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {filteredData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                           <td className="p-2 sm:p-4">
                              <div className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase truncate max-w-[80px] sm:max-w-none">{row.mandal}</div>
                              <div className="text-xs sm:text-sm font-black text-primary uppercase truncate max-w-[120px] sm:max-w-none">{row.gp}</div>
                           </td>
                           <td className="p-2 sm:p-4 text-center">
                              <StatusCell status={row.isPresent ? (row.isAttBefore901 ? 'P-I' : row.isAttAfter900 ? 'P-L' : 'P') : row.isMeeting ? 'M' : row.isTraining ? 'T' : row.isLeave ? 'L' : 'A'} />
                              <div className="text-[8px] sm:text-[9px] text-slate-400 font-mono mt-1">{row.attTime || '-'}</div>
                           </td>
                           <td className="p-2 sm:p-4 text-center">
                              {/* Logic: Green if OnTime OR Meeting/Training/Leave. Red if Late. Amber if simply Not Entered (Present but no DSR) */}
                              <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase inline-block whitespace-nowrap ${
                                (row.isOnTime || row.isMeeting || row.isTraining || row.isLeave) 
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                  : row.isLate 
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}>
                                  {row.isMeeting ? 'Meeting' : row.isTraining ? 'Training' : row.isLeave ? 'Leave' : row.isOnTime ? 'DSR On Time' : row.isLate ? 'Late DSR Entry' : row.isEntered ? 'DSR Entered' : 'Not Entered'}
                              </span>
                           </td>
                           <td className="p-2 sm:p-4 text-center text-[8px] sm:text-[10px] font-mono text-slate-500">{row.dsrTime || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, isExpanded, toggleExpansion, addToast, isAdmin, onEdit }: { post: Post, isExpanded: boolean, toggleExpansion: () => void, addToast: (s:string) => void, isAdmin: boolean, onEdit: (p: Post) => void }) {
  const isOwner = Boolean((auth.currentUser && post.uid && auth.currentUser.uid === post.uid) || isAdmin);
  const postTime = getValidTime(post);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (showComments) {
      const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('time', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => handleFirestoreError(err, OperationType.LIST, `posts/${post.id}/comments`));
      return () => unsub();
    }
  }, [showComments, post.id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (requireLoginAlert()) return;
    
    setSubmittingComment(true);
    try {
      await addDoc(collection(db, 'posts', post.id, 'comments'), {
        text: newComment,
        time: Date.now(),
        uid: auth.currentUser!.uid,
        userName: auth.currentUser!.email?.split('@')[0] || "User",
      });
      setNewComment("");
      
      await updateDoc(doc(db, 'posts', post.id), {
        commentCount: increment(1)
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `posts/${post.id}/comments`);
      addToast("Error adding comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="post-card">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-primary font-black overflow-hidden border shadow-sm">
           {post.userPhoto ? <img src={post.userPhoto} alt={post.userName || "Author"} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="text-lg">{(post.userName || 'U').charAt(0).toUpperCase()}</div>}
        </div>
        <div className="flex-1">
           <div className="flex items-center gap-2">
              <h5 className="text-[17px] font-black text-primary leading-tight">{post.userName || 'Portal Member'}</h5>
              {post.uid === 'KGT2roF9bPTNhWIceHgWsJEnEnH3' && (
                 <span className="bg-blue-600 text-white text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                   <ShieldCheck size={10} /> Official Support
                 </span>
              )}
              {isAdmin && post.status === 'Deleted' && (
                 <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">Deleted Archive</span>
              )}
              {post.pinned && (
                 <span className="bg-amber-100 text-amber-700 text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1 border border-amber-200">
                   <Pin size={10} fill="currentColor" /> Pinned Post
                 </span>
              )}
           </div>
           <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase mt-1">
              <Clock size={12} />
              <span>{new Date(postTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span className="text-primary/70">{post.category || 'Update'}</span>
           </div>
        </div>
        <div className="flex gap-2">
           {isAdmin && (
              <button aria-label={post.pinned ? "Unpin Post" : "Pin Post"}
                onClick={async () => {
                  try {
                    await updateDoc(doc(db, 'posts', post.id), { 
                      pinned: !post.pinned 
                    });
                    addToast(post.pinned ? "Post Unpinned" : "Post Pinned Successfully 📍");
                  } catch (e: any) {
                    handleFirestoreError(e, OperationType.WRITE, `posts/${post.id}`);
                  }
                }}
                className={`p-1.5 transition-all rounded-lg ${post.pinned ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}
                title={post.pinned ? "Unpin Post" : "Pin Post"}
              >
                <Pin size={16} fill={post.pinned ? "currentColor" : "none"} />
              </button>
           )}
           {isOwner && (
              <>
                {isAdmin && <button onClick={() => onEdit(post)} className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-primary transition-all rounded-lg" title="Edit"><Edit3 size={16} /></button>}
                <button aria-label="Delete Post" onClick={async () => {
                  if (isAdmin) {
                    if (post.status === 'Deleted') {
                      const res = await Swal.fire({ 
                        title: 'Permanent Delete?', 
                        text: 'This post is already soft-deleted. Delete it permanently from the database?', 
                        icon: 'error', 
                        showCancelButton: true,
                        confirmButtonText: 'Delete Permanently',
                        confirmButtonColor: '#ef4444'
                      });
                      if (res.isConfirmed) {
                        try {
                          await updateDoc(doc(db, 'posts', post.id), { status: 'Deleted', deletedAt: Date.now() });
                          addToast("Moved to Trash");
                        } catch (err: any) {
                          addToast("Error: " + err.message);
                        }
                      }
                    } else {
                      const res = await Swal.fire({ 
                        title: 'Soft Delete?', 
                        text: 'Move this post to the Deleted archive?', 
                        icon: 'warning', 
                        showCancelButton: true,
                        confirmButtonText: 'Soft Delete'
                      });
                      if (res.isConfirmed) {
                        try {
                          await updateDoc(doc(db, 'posts', post.id), { 
                            status: 'Deleted', 
                            deletedAt: Date.now(),
                            deletedBy: auth.currentUser?.email 
                          });
                          addToast("Moved to archive");
                        } catch (err: any) {
                          addToast("Error: " + err.message);
                        }
                      }
                    }
                  } else {
                    const res = await Swal.fire({ title: 'Delete?', text: 'Move this post to recycle bin?', icon: 'warning', showCancelButton: true });
                    if (res.isConfirmed) {
                      try {
                        await updateDoc(doc(db, 'posts', post.id), { status: 'Deleted', deletedAt: Date.now() });
                        addToast("Moved to recycle bin");
                      } catch (err: any) {
                        addToast("Failed to delete post. " + (isAdmin ? err.message : "You can only delete posts within 1 hour of creation."));
                      }
                    }
                  }
                }} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-danger transition-all rounded-lg" title="Delete"><Trash2 size={16} /></button>
              </>
           )}
        </div>
      </div>
      
      <h4 className="post-title !mt-0">{post.title || 'Platform Update'}</h4>
      
      <div className={`post-body mb-4 ${isExpanded ? '' : 'line-clamp-4'} [&_pre]:bg-slate-800 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:text-rose-500 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:px-0 [&_pre_code]:py-0 [&_p]:mb-2 [&_a]:text-blue-600 [&_a]:underline`}>
        <ReactMarkdown remarkPlugins={[remarkBreaks]}>{post.content || (post as any).message || (post as any).text || (post as any).desc || ''}</ReactMarkdown>
      </div>

      {post.content && post.content.length > 200 && (
        <button aria-label={isExpanded ? 'View Less' : 'Read Post'} onClick={toggleExpansion} className="text-xs font-black text-primary uppercase underline underline-offset-4 mb-6 block">
          {isExpanded ? 'View Less' : 'Read Post'}
        </button>
      )}

      {post.mediaUrl && (
        <div className="mb-4">
          {post.mediaType?.startsWith('video') ? (
            <video src={post.mediaUrl} controls className="post-media" />
          ) : (
            <img src={post.mediaUrl} alt={post.title} className="post-media" />
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 justify-between items-center pt-6 border-t border-slate-100 mt-6">
         <div className="flex items-center gap-6">
            <button aria-label="Like Post"
             onClick={async () => {
               const userId = auth.currentUser?.uid;
               if (requireLoginAlert()) return;
               const likedBy = post.likedBy || [];
               if (likedBy.includes(userId)) {
                 await updateDoc(doc(db, 'posts', post.id), {
                   likes: increment(-1),
                   likedBy: likedBy.filter(id => id !== userId)
                 });
               } else {
                 await updateDoc(doc(db, 'posts', post.id), {
                   likes: increment(1),
                   likedBy: arrayUnion(userId)
                 });
               }
             }} 
             className="flex items-center gap-2 group"
           >
             <Heart size={20} className={`transition-transform group-hover:scale-125 ${post.likedBy?.includes(auth.currentUser?.uid || "") ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover:text-red-500'}`} />
             <span className="text-sm font-black text-slate-500 group-hover:text-primary">{post.likes || 0}</span>
           </button>

           <div className="flex items-center gap-2" title="Views">
              <Eye size={20} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-400">{post.views || 0}</span>
           </div>
           
           <button aria-label="Toggle Comments" onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 group text-slate-400 hover:text-primary" title="Comments">
              <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-black">{post.commentCount || 0}</span>
           </button>
         </div>

         <div className="flex items-center gap-3">
           <button 
             aria-label="Share Post"
             onClick={() => {
               const url = `${window.location.origin}${window.location.pathname}?postId=${post.id}`;
               navigator.clipboard.writeText(url);
               addToast("Link copied!");
             }}
             className="flex items-center gap-2 group text-slate-400 hover:text-primary hover:bg-slate-50 p-2 rounded-lg transition-all"
             title="Share Link"
           >
              <Share2 size={18} className="group-hover:scale-110 transition-transform" />
           </button>
           
           <Link to={`/?postId=${post.id}`} className="bg-primary text-white font-black uppercase text-xs px-5 py-2.5 rounded-xl hover:bg-primary-light transition-all shadow-sm">Read Post</Link>
         </div>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {auth.currentUser && !auth.currentUser.isAnonymous ? (
            <div className="flex gap-2 mb-4">
              <input 
                value={newComment} 
                onChange={e => setNewComment(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                placeholder="Write a comment..." 
                className="flex-1 text-sm bg-slate-50 p-2 rounded-xl border border-slate-200 outline-none focus:border-primary/30 m-0" 
              />
              <button 
                aria-label="Submit comment"
                disabled={submittingComment}
                onClick={handleAddComment} 
                className="bg-primary text-white p-2 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          ) : (
             <div className="text-center py-2 mb-4 bg-slate-50 rounded-xl">
               <p className="text-xs font-bold text-slate-500">Please login to comment.</p>
             </div>
          )}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {comments.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No comments yet</p>}
            {comments.map(c => (
              <div key={c.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold text-primary">{c.userName || 'User'}</span>
                   <span className="text-[10px] text-slate-400">{new Date(getValidTime(c)).toLocaleDateString()}</span>
                 </div>
                 <p className="text-sm text-slate-600">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PostForm({ addToast, onCancel, currentUserProfile, editingPost, isAdmin, isEditor }: { addToast: (s:string) => void, onCancel: () => void, currentUserProfile: UserProfile | null, editingPost: Post | null, isAdmin: boolean, isEditor: boolean }) {
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<{ url: string, type: string } | null>(
    editingPost ? (editingPost.mediaUrl ? { url: editingPost.mediaUrl, type: editingPost.mediaType || 'image/jpeg' } : null) : null
  );

  const onSubmit = async (e: any) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    const f = e.target;
    try {
      const title = f.title.value;
      const content = f.content.value;
      const category = f.category.value;

      const postData = {
        title: title,
        content: content,
        category: category,
        mediaUrl: media?.url || "",
        mediaType: media?.type || "",
      };

      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), {
          title: postData.title,
          content: postData.content,
          category: postData.category,
          mediaUrl: postData.mediaUrl,
          mediaType: postData.mediaType,
          lastEditedAt: Date.now(),
          lastEditedBy: auth.currentUser?.uid || 'system',
          lastEditedRole: isAdmin ? "admin" : "user",
          lastEditedName: currentUserProfile?.username || ""
        });
        await logUserActivity(`Edited Post: ${postData.title.slice(0, 20)}`);
        addToast("Update Saved!");
      } else {
        await addDoc(collection(db, "posts"), {
          title: title,
          content: content || "",
          category: category,
          subCategory: "", 
          mediaUrl: media?.url || "",
          mediaType: media?.type || "",
          likes: 0,
          likedBy: [],
          views: 0,
          commentCount: 0,
          comments: [],
          time: Date.now(),
          uid: auth.currentUser?.uid || 'system',
          userName: currentUserProfile?.username || auth.currentUser.displayName || "User",
          userPhoto: currentUserProfile?.photoURL || "",
          status: isAdmin ? 'Approved' : 'Pending'
        });
        await logUserActivity(`Published Post: ${title.slice(0, 20)}`);
        addToast("Post Published! " + (!isAdmin ? "Waiting for admin approval." : ""));
      }
      onCancel();
    } catch (err: any) { 
      handleFirestoreError(err, OperationType.WRITE, editingPost ? `posts/${editingPost.id}` : 'posts');
      addToast("Error: " + err.message); 
    }
    finally { setLoading(false); }
  };

  return (
    <motion.form 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      onSubmit={onSubmit} 
      className="bg-white p-6 rounded-3xl shadow-xl border-2 border-accent mb-8" 
      style={{ borderColor: '#fbbf24' }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-primary uppercase text-lg flex items-center gap-2">
          {editingPost ? '✏️ Edit Update' : '📝 New Update'}
        </h3>
        <button aria-label="Close edit modal" type="button" onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors font-black text-lg">✕</button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Title / Header</label>
          <input name="title" required defaultValue={editingPost?.title} placeholder="Enter catchy title..." className="w-full text-lg font-black text-primary p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-primary/20 outline-none transition-all" />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Category</label>
          <select name="category" defaultValue={editingPost?.category || "General"} className="w-full bg-slate-50 font-bold text-xs uppercase p-3 rounded-xl border-2 border-transparent focus:border-primary/20 outline-none cursor-pointer">
             <option value="Daily reports">📊 Daily Reports</option>
             <option value="Updates">📢 Updates</option>
             <option value="Election">🗳️ Election</option>
             <option value="General">📌 General</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Content Details</label>
          <textarea name="content" required defaultValue={editingPost?.content} placeholder="Write details here (Markdown supported)..." rows={5} className="w-full bg-slate-50 p-3 rounded-xl border-2 border-transparent focus:border-primary/20 outline-none text-sm font-medium leading-relaxed" />
        </div>
        
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Media Content</label>
          <div className="py-8 border-2 border-dashed rounded-2xl text-center cursor-pointer relative bg-slate-50 overflow-hidden transition-all hover:bg-slate-100 hover:border-primary/20 group">
             {media?.url ? (
               <div className="space-y-3 px-4">
                 <div className="relative inline-block">
                    {media.type.startsWith('video') ? (
                      <video src={media.url} className="h-32 w-full object-cover rounded-xl border shadow-sm" />
                    ) : (
                      <img src={media.url} alt="Uploaded media preview" loading="lazy" className="h-32 w-full object-cover rounded-xl border shadow-sm" />
                    )}
                    <button aria-label="Remove media"
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setMedia(null); }} 
                      className="absolute -top-2 -right-2 bg-danger text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                 </div>
                 <p className="text-[11px] font-black text-success uppercase">✓ Media Attached</p>
                 <p className="text-[10px] text-slate-400 font-bold">Click to replace or use button to remove</p>
               </div>
             ) : (
               <div className="space-y-2 py-4">
                 <div className="text-3xl">📷</div>
                 <div className="text-xs font-black text-slate-400 group-hover:text-primary transition-colors">Add Image or Video</div>
               </div>
             )}
             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" onChange={async (e) => {
               const f = e.target.files?.[0];
               if (f) {
                 const reader = new FileReader();
                 reader.onload = (ev) => setMedia({ url: ev.target?.result as string, type: f.type });
                 reader.readAsDataURL(f);
               }
             }} />
          </div>
        </div>
      </div>

      <button aria-label={editingPost ? 'Save Changes' : 'Publish Now'} disabled={loading} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg hover:bg-primary-light transition-all active:scale-95 mt-6 disabled:opacity-50" style={{ background: '#0d3b66' }}>
        {loading ? (editingPost ? 'SAVING... 🚀' : 'PUBLISHING... 🚀') : (editingPost ? 'SAVE CHANGES 🚀' : 'PUBLISH NOW 🚀')}
      </button>
    </motion.form>
  );
}

function MenuButton({ label, active, onClick, emoji, icon: Icon }: { label: string, active: boolean, onClick: () => void, emoji?: string, icon?: any }) {
  return (
    <motion.button 
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick} 
      className={`side-btn ${active ? 'active-tab' : 'hover:bg-slate-50'}`}
    >
      {emoji ? (
        <span className="side-btn-emoji">{emoji}</span>
      ) : (
        Icon && <Icon size={20} className={active ? 'text-white' : 'text-slate-500'} strokeWidth={active ? 2.5 : 2} />
      )}
      <span className="text-sm tracking-tight">{label}</span>
    </motion.button>
  );
}

function ChatSection({ messages, user, addToast, userProfile }: { messages: ChatMessage[], user: any, addToast: (s:string) => void, userProfile: UserProfile | null }) {
  const [msg, setMsg] = useState("");
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiHistory, setAiHistory] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, aiHistory]);

  const send = async () => {
    if (!msg.trim()) return;
    if (requireLoginAlert(user)) return;
    
    if (isAiMode) {
      const userText = msg.trim();
      setMsg("");
      setAiHistory(prev => [...prev, { role: 'user', text: userText }]);
      setIsAiTyping(true);
      try {
         const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
         const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
              ...aiHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
              { role: 'user', parts: [{ text: userText }] }
            ] as any,
            config: {
              systemInstruction: "You are a helpful AP Panchayat Secretary Assistant Bot. Respond clearly and concisely, limitlessly helping the user.",
            }
         });
         setAiHistory(prev => [...prev, { role: 'model', text: response.text || "No response received." }]);
      } catch (err) {
         console.error(err);
         addToast("AI Bot error");
      } finally {
         setIsAiTyping(false);
      }
      return;
    }

    try {
      await addDoc(collection(db, 'chat'), { 
        msg, 
        time: Date.now(), 
        uid: user.uid,
        userName: userProfile?.username || user.displayName || 'Portal User'
      });
      setMsg("");
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, 'chat');
      addToast("Error sending"); 
    }
  };

  return (
    <div className="bg-white rounded-3xl border shadow-sm flex flex-col h-[600px] overflow-hidden">
      <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
        <div className="font-black text-primary flex items-center gap-3">
           {isAiMode ? <Bot size={20}/> : <MessageCircle size={20}/>} 
           {isAiMode ? "AI ASSISTANT (NO LIMITS)" : "LIVE FEED"}
        </div>
        <button aria-label="Toggle AI Mode" onClick={() => setIsAiMode(!isAiMode)} className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isAiMode ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
          {isAiMode ? "Switch to Live" : "Chat with AI"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc] custom-scrollbar">
        <AnimatePresence initial={false}>
          {!isAiMode && messages.map(m => (
            <motion.div 
              key={m.id} 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${m.uid === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col max-w-[80%]">
                <span className={`text-[10px] font-black uppercase mb-1 px-1 ${m.uid === user?.uid ? 'text-right text-primary/40' : 'text-slate-400'}`}>
                  {m.userName || 'Portal User'}
                </span>
                <div className={`p-3 rounded-2xl text-sm font-medium shadow-sm ${m.uid === user?.uid ? 'bg-primary text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`} style={m.uid === user?.uid ? { background: '#0d3b66' } : {}}>
                  {m.msg}
                </div>
              </div>
            </motion.div>
          ))}
          {isAiMode && aiHistory.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col max-w-[80%]">
                <span className={`text-[10px] font-black uppercase mb-1 px-1 ${m.role === 'user' ? 'text-right text-primary/40' : 'text-amber-500'}`}>
                  {m.role === 'user' ? 'You' : 'AI Assistant'}
                </span>
                <div className={`p-3 rounded-2xl text-sm font-medium shadow-sm ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-amber-50 border-amber-200 border rounded-tl-none text-slate-800 markdown-body'}`} style={m.role === 'user' ? { background: '#0d3b66' } : {}}>
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {isAiMode && isAiTyping && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                 <div className="p-3 bg-amber-50 border-amber-200 border rounded-2xl rounded-tl-none font-bold text-slate-400 text-xs flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Thinking limitlessly...
                 </div>
             </motion.div>
          )}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>
      <div className="p-4 border-t flex gap-2">
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={isAiMode ? "Ask the AI assistant anything..." : "Type..."} className="mb-0 flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-primary/50 text-sm" />
        <button aria-label={isAiMode ? "Send to AI" : "Send message"} onClick={send} disabled={isAiTyping} className="bg-primary text-white p-3 rounded-xl disabled:opacity-50" style={{ background: '#0d3b66' }}><Send size={18}/></button>
      </div>
    </div>
  );
}

function KnowledgeHubSection() {
  const chapters = [
    { title: "PART I: Preliminary", content: "Definitions and basic rules of the TPRA 2018." },
    { title: "PART II: Gram Panchayat", content: "Section 6: Gram Sabha and Meetings. Section 32: Sarpanch powers." },
    { title: "PART VII: Penalties", content: "Point-to-point fines including ₹5,000 for building violations." }
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-primary">📚 TPRA 2018 Digital Guide</h2>
      <div className="grid gap-3">
        {chapters.map(c => (
          <details key={c.title} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <summary className="p-4 font-bold cursor-pointer hover:bg-slate-50">{c.title}</summary>
            <div className="p-4 text-sm text-slate-500 border-t bg-slate-50">{c.content}</div>
          </details>
        ))}
      </div>
    </div>
  );
}


function PRActHub({ user }: { user: any }) {
    if (!user || user.isAnonymous) {
        return (
           <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl flex flex-col items-center justify-center text-center mt-6">
              <Lock className="w-16 h-16 text-slate-400 mb-4" />
              <h4 className="font-black text-2xl text-slate-800 mb-2">Full Access Required</h4>
              <p className="text-slate-500 max-w-md">Please log in to access the PR Act Hub documents and contents.</p>
           </div>
        );
    }
    return <KnowledgeHubSection />;
}

// --- POST DETAIL MODULE ---

function PostDetail({ postId, onBack, isAdmin, addToast, userProfile }: { postId: string, onBack: () => void, isAdmin: boolean, addToast: (s:string) => void, userProfile: UserProfile | null }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      try {
        const docRef = doc(db, 'posts', postId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setPost({ id: snapshot.id, ...snapshot.data() } as Post);
          
          // Increment views
          updateDoc(docRef, { views: increment(1) }).catch(e => console.error(e));
        } else {
          addToast("Post not found");
        }
      } catch (err: any) {
        handleFirestoreError(err, OperationType.GET, `posts/${postId}`);
        addToast("Error loading post");
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center py-32 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <span className="font-bold text-slate-400">Loading update...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-32 space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
           <AlertTriangle size={32} />
        </div>
        <div>
          <h2 className="text-xl font-black text-primary">Post Not Found</h2>
          <p className="text-slate-500 font-medium">Sorry, we couldn't find that update. It may have been removed.</p>
        </div>
        <button aria-label="Return to Feed" onClick={onBack} className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-opacity-90 inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Return to Feed
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-10 rounded-[32px] shadow-sm border space-y-8">
       <button aria-label="Back to Feed" onClick={onBack} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-slate-500 hover:text-primary transition-colors font-bold text-sm w-fit group">
         <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Feed
       </button>
       
       <div className="space-y-6">
         <div className="flex items-center justify-between border-b pb-6">
           <div className="flex flex-wrap items-center gap-2">
             <span className="cat-tag bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">{post.category || 'Update'}</span>
             {post.subCategory && <span className="cat-tag sub-cat-tag bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">{post.subCategory}</span>}
           </div>
           <div className="flex items-center text-xs font-black text-slate-400 uppercase tracking-wider">
             <Clock size={14} className="mr-1.5" />
             {new Date(getValidTime(post)).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
           </div>
         </div>
         
         <h1 className="text-3xl md:text-5xl font-black text-primary leading-tight tracking-tight">{post.title}</h1>
         
         <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
           <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white border-2 border-white shadow-sm ring-2 ring-slate-50 overflow-hidden">
             {post.userPhoto ? (
               <img src={post.userPhoto} alt="Author" className="w-full h-full object-cover" />
             ) : (
               <User size={18} />
             )}
           </div>
           <div className="flex flex-col">
             <span>{post.userName || 'Admin'}</span>
             <span className="text-[10px] font-black text-slate-400 uppercase">Author</span>
           </div>
         </div>
         
         {post.mediaUrl && (
           <div className="mt-8 rounded-[24px] overflow-hidden border-4 border-slate-50 shadow-md">
             <img src={post.mediaUrl} alt="Post media" className="w-full object-cover max-h-[500px]" />
           </div>
         )}

         <div className="prose prose-slate prose-lg md:prose-xl max-w-none pt-4 text-slate-700 leading-relaxed font-serif whitespace-pre-wrap">
           <ReactMarkdown remarkPlugins={[remarkBreaks]}>{post.content}</ReactMarkdown>
         </div>
         
         <div className="flex justify-between items-center sm:mt-12 mt-8 pt-8 border-t-2 border-dashed border-slate-100">
            <div className="flex gap-6">
               <div className="flex items-center gap-2 text-primary bg-primary/5 px-4 py-2 rounded-xl">
                  <Heart size={20} className={post.likedBy?.includes(auth.currentUser?.uid || '') ? "fill-primary text-primary" : "text-primary"} />
                  <span className="font-black text-base">{post.likes || 0}</span> <span className="text-xs uppercase tracking-wider hidden sm:inline">Likes</span>
               </div>
               <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <Eye size={20} />
                  <span className="font-black text-base">{post.views || 0}</span> <span className="text-xs uppercase tracking-wider hidden sm:inline">Views</span>
               </div>
            </div>
            
            <button 
               aria-label="Share Post"
               onClick={() => {
                 navigator.clipboard.writeText(`${window.location.origin}/?postId=${post.id}`);
                 addToast("Link Copied!");
               }} 
               className="flex items-center gap-2 text-slate-500 hover:text-primary hover:bg-slate-50 px-4 py-2 rounded-xl transition-all"
            >
               <Share2 size={18} />
               <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Share</span>
            </button>
         </div>
       </div>

       <div className="pt-10 border-t mt-12 border-slate-100">
         <h3 className="text-2xl font-black text-primary mb-6 flex items-center gap-3">
           <MessageCircle size={24} className="text-accent" style={{ color: '#fbbf24' }}/> 
           Community Comments <span className="bg-slate-100 text-slate-500 text-sm py-1 px-3 rounded-full">{post.commentCount || 0}</span>
         </h3>
         <PostComments post={post} addToast={addToast} userProfile={userProfile} />
       </div>
    </motion.div>
  );
}

function PostComments({ post, addToast, userProfile }: { post: Post, addToast: (s:string) => void, userProfile: UserProfile | null }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('time', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `posts/${post.id}/comments`));
    return () => unsub();
  }, [post.id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (requireLoginAlert()) return;
    
    setSubmittingComment(true);
    try {
      await addDoc(collection(db, 'posts', post.id, 'comments'), {
        text: newComment,
        time: Date.now(),
        uid: auth.currentUser!.uid,
        userName: auth.currentUser!.email?.split('@')[0] || "User",
      });
      setNewComment("");
      
      await updateDoc(doc(db, 'posts', post.id), {
        commentCount: increment(1)
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `posts/${post.id}/comments`);
      addToast("Error adding comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200">
        <label className="block text-sm font-black text-primary mb-3">Add your perspective</label>
        {auth.currentUser && !auth.currentUser.isAnonymous ? (
           <div className="flex flex-col sm:flex-row gap-3">
             <input 
               value={newComment} 
               onChange={e => setNewComment(e.target.value)} 
               onKeyDown={e => e.key === 'Enter' && handleAddComment()}
               placeholder="Type your comment here..." 
               className="flex-1 text-base bg-white p-4 rounded-xl border-2 border-transparent focus:border-accent outline-none shadow-sm transition-all text-slate-700" 
             />
             <button aria-label="Post Comment"
               disabled={submittingComment || !newComment.trim()}
               onClick={handleAddComment} 
               className="bg-primary text-white py-4 px-8 rounded-xl font-black uppercase tracking-wider disabled:opacity-50 hover:bg-opacity-90 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
             >
               {submittingComment ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} 
               Post
             </button>
           </div>
        ) : (
           <div className="text-center py-4">
             <p className="text-sm font-bold text-slate-500">Please login to join the conversation and comment.</p>
           </div>
        )}
      </div>
      <div className="space-y-4">
        {comments.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[24px]">
            <MessageCircle size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-base text-slate-400 font-bold">No comments yet.</p>
            <p className="text-sm text-slate-400">Be the first to start the conversation!</p>
          </div>
        )}
        {comments.map(c => (
          <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-start">
             <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex-shrink-0 flex items-center justify-center text-slate-400 font-black border border-white shadow-sm mt-1">
               {(c.userName || 'U')[0].toUpperCase()}
             </div>
             <div className="flex-1">
               <div className="flex flex-row justify-between items-center sm:items-baseline mb-2">
                 <span className="text-[15px] font-black text-primary">{c.userName || 'User'}</span>
                 <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-md">
                   {new Date(getValidTime(c)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                 </span>
               </div>
               <p className="text-slate-700 leading-relaxed">{c.text}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthModal({ onClose, addToast, handleGoogleLogin }: { onClose: () => void, addToast: (s:string) => void, handleGoogleLogin: () => void }) {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [surname, setSurname] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [state, setState] = useState('Telangana');
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [designation, setDesignation] = useState('');

  const mandals = district ? TELANGANA_DATA[district] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    try {
      if (!isSignup) {
        await signInWithEmailAndPassword(auth, email, password);
        // dynamic greeting handled via profile listener
        onClose();
      } else {
        if (!username || !email || !password || !name || !surname || !mobile || !district || !mandal || !designation) {
          addToast("Please fill all required fields (*)");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          addToast("Passwords do not match");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          addToast("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        // Check username uniqueness
        const lowerUsername = username.toLowerCase().trim();
        const usernameDoc = await getDoc(doc(db, 'usernames', lowerUsername));
        if (usernameDoc.exists()) {
           addToast("Username already taken. Choose another.");
           setLoading(false);
           return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        await updateProfile(user, { displayName: username });

        // Reserve username
        await setDoc(doc(db, 'usernames', lowerUsername), { uid: user.uid });

        // Save Profile
        await setDoc(doc(db, 'users', user.uid), {
          surname,
          name,
          username,
          gender,
          state,
          district,
          mandal,
          village,
          designation,
          mobile,
          email,
          time: Date.now()
        });

        if (designation === 'Citizen') {
          Swal.fire({
            title: "సిటిజన్ గారికి నమస్కారం",
            text: "ప్రస్తుతం ఈ వేదిక Webportal సిటిజన్ సర్వీస్ ఇంకా అందుబాటులోకి రాలేదు. రాగానే మీ మొబైల్ నెంబర్ కి మెసేజ్ లేదా ఇమెయిల్ ద్వారా మీకు సమాచారం ఇవ్వడం జరుగుతుంది.",
            icon: "info",
            confirmButtonText: "సరే (OK)",
            confirmButtonColor: "#0d3b66"
          });
        } else {
          addToast("Account created successfully!");
        }
        onClose();
      }
    } catch (err: any) {
      addToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[280px] sm:max-w-xs bg-white rounded-[16px] shadow-2xl overflow-hidden flex flex-col max-h-[98vh]"
      >
        <div className="bg-[#0f2e4a] p-2 text-white text-center relative flex flex-col items-center">
          <button aria-label="Close auth modal" onClick={onClose} className="absolute top-2.5 right-2.5 text-white/60 hover:text-white transition-colors">
            <X size={14} />
          </button>
          
          <div className="mb-0.5">
            <EVAnimatedLogo size={24} />
          </div>
          
          <h2 className="text-lg font-black uppercase tracking-widest leading-none mb-0.5" style={{ color: '#fbe947', fontFamily: '"Arial Black", Impact, sans-serif' }}>
            E<span style={{ color: '#facc15' }}>-</span>VEDHIKA
          </h2>
          <p className="text-[7px] font-black text-white/50 uppercase tracking-[0.2em]">
            Access Your Portal
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 bg-white custom-scrollbar">
          <div className="mb-2 text-center">
             <h3 className="text-sm font-black text-[#0f2e4a] tracking-tight leading-none">{isSignup ? 'Create Account' : 'Welcome Back'}</h3>
             <p className="text-[8px] font-bold text-slate-400 mt-0.5">
               {isSignup ? 'Fill in your details to get started.' : 'Sign in with your credentials.'}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-1.5">
            {isSignup && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Surname *</label>
                    <input value={surname} onChange={e => setSurname(e.target.value)} placeholder="Surname" required className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Username / Display Name *</label>
                  <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Display name" required className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Gender</label>
                    <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors">
                       <option value="">Select Gender</option>
                       <option>Male</option>
                       <option>Female</option>
                       <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Mobile No *</label>
                    <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Phone" required className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">State</label>
                    <select value={state} onChange={e => setState(e.target.value)} className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors">
                       <option>Telangana</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">District *</label>
                    <select value={district} onChange={e => { setDistrict(e.target.value); setMandal(''); }} required className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors">
                       <option value="">Select District</option>
                       {Object.keys(TELANGANA_DATA).sort().map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                 <div className="grid grid-cols-2 gap-2">
                    <div>
                     <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Mandal *</label>
                     <select value={mandal} onChange={e => setMandal(e.target.value)} required className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" disabled={!district}>
                        <option value="">Select Mandal</option>
                        {mandals.map((m, idx) => <option key={`${m}_${idx}`} value={m}>{m}</option>)}
                     </select>
                   </div>
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Village / GP</label>
                    <input value={village} onChange={e => setVillage(e.target.value)} placeholder="Enter Village" className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Designation *</label>
                  <input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Type Designation" required className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" />
                </div>
              </>
            )}

            <div>
              <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Email Address *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="email@example.com" required className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" />
            </div>

            <div className={isSignup ? "grid grid-cols-2 gap-2" : ""}>
               <div>
                <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Password *</label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" required className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" />
              </div>
              {isSignup && (
                <div>
                  <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Confirm Password</label>
                  <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••" required className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" />
                </div>
              )}
            </div>

            <button aria-label={isSignup ? 'Register Now' : 'Sign In Now'}
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f2e4a] text-white py-1.5 rounded-[6px] font-black uppercase text-[9px] tracking-widest shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-px disabled:opacity-50 disabled:transform-none flex justify-center items-center gap-1.5"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={12} /> : (isSignup ? 'Register Now' : 'Sign In Now')}
            </button>
          </form>

          {!isSignup && (
            <>
              <div className="my-2 flex items-center gap-2">
                 <div className="flex-1 h-px bg-slate-100"></div>
                 <span className="text-[7px] font-black text-slate-300 uppercase">OR</span>
                 <div className="flex-1 h-px bg-slate-100"></div>
              </div>

              <button aria-label="Continue with Google"
                type="button"
                onClick={handleGoogleLogin}
                className="w-full border border-slate-200 py-1.5 rounded-[6px] font-black text-[#0f2e4a] text-[8px] uppercase flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm"
              >
                <svg width="12" height="12" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
            </>
          )}

          <div className="mt-3 text-center pb-1">
             <button aria-label={isSignup ? "Switch to Sign In" : "Switch to Sign Up"}
               onClick={() => setIsSignup(!isSignup)}
               className="text-[#0f2e4a] font-black text-[8px] uppercase underline underline-offset-2 hover:text-[#0a2034] transition-colors"
             >
               {isSignup ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SuggestionForm({ addToast, onCancel }: { addToast: (s: string) => void, onCancel: () => void }) {
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [mobile, setMobile] = useState('');
  const [category, setCategory] = useState('General Suggestion');
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (requireLoginAlert()) return;
    if (!name || !suggestion) {
      addToast("దయచేసి పేరు మరియు సూచన నింపండి");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "suggestions"), {
        name,
        village: village || 'Not specified',
        mobile: mobile || 'Not specified',
        category,
        suggestion: suggestion,
        text: suggestion,
        status: "pending",
        time: Date.now(),
        createdAt: Date.now()
      });
      await logUserActivity(`Submitted Suggestion: ${category}`);
      setSubmitted(true);
      addToast("మీ సూచన విజయవంతంగా పంపబడింది!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'suggestions');
      addToast("Error submitting suggestion");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-10 text-center space-y-6 bg-white rounded-[24px]">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
          <CheckCircle2 size={40} />
        </motion.div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter">విజయవంతంగా పంపబడింది!</h2>
        <p className="text-slate-500 font-bold">మీ సూచన మా దృష్టికి వచ్చింది. ధన్యవాదాలు.</p>
        
        <div className="gap-3 flex flex-col pt-4">
           <button aria-label="Send another suggestion" onClick={() => {
              setSubmitted(false);
              setName(''); setVillage(''); setMobile(''); setCategory('General Suggestion'); setSuggestion('');
           }} className="bg-[#a855f7] text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90">మరో సూచన పంపండి</button>
           <button aria-label="Go back" onClick={onCancel} className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200">తిరిగి వెళ్ళండి</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 overflow-hidden rounded-[24px] bg-white">
      <div className="bg-[#a855f7] p-8 text-white relative">
        <h2 className="text-2xl font-black tracking-tighter">Portal Feedback & Suggestions</h2>
        <p className="text-white/80 font-bold text-sm">మీ విలువైన సూచనలను ఇక్కడ తెలియజేయండి</p>
        <button aria-label="Close suggestion form" onClick={onCancel} className="absolute top-6 right-6 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors">
           <X size={20} />
        </button>
      </div>

      <div className="p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">మీ పేరు</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#a855f7]/50 font-bold text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">మొబైల్ నంబర్ (ఐచ్ఛికం)</label>
            <input value={mobile} onChange={e => setMobile(e.target.value)} maxLength={10} placeholder="Mobile Number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#a855f7]/50 font-bold text-slate-700" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">విలేజ్ / మండలం</label>
          <input value={village} onChange={e => setVillage(e.target.value)} placeholder="Village / Mandal" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#a855f7]/50 font-bold text-slate-700" />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">విభాగం</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#a855f7]/50 font-bold text-slate-700 appearance-none">
            <option value="General Suggestion">General Suggestion</option>
            <option value="App Improvement">App Improvement</option>
            <option value="Service Feedback">Service Feedback</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Request Feature">Request Feature</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">మీ సూచన</label>
          <textarea value={suggestion} onChange={e => setSuggestion(e.target.value)} placeholder="మీ సూచనను ఇక్కడ వ్రాయండి..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#a855f7]/50 min-h-[120px] font-bold text-slate-700" />
        </div>

        <div className="flex gap-4 pt-2">
          <button aria-label="Submit Suggestion" disabled={isSubmitting} onClick={handleSubmit} className="flex-1 bg-[#a855f7] text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]">
            {isSubmitting ? 'పంపిస్తున్నాము...' : 'Submit Suggestion'}
          </button>
        </div>
      </div>
    </div>
  );
}

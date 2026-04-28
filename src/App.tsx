/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bell, Menu, X, Home, Megaphone, FileText, Wheat, Vote, 
  Wallet, Building, MessageCircle, Handshake, Lightbulb, 
  AlertTriangle, Send, LogOut, ChevronDown, ChevronUp, Search,
  Eye, Heart, Share2, PlusCircle, Camera, User, Edit2, Save,
  Activity, Book, GraduationCap, BarChart3, Database, Download, Bot, MessageSquare,
  Trash2, Edit3, Settings, TrendingUp, Upload, Play, RefreshCw, Layers, Calendar, LayoutDashboard, ShieldAlert, Lock,
  Users, AlertOctagon, CheckCircle2, ClipboardList, Zap, Clock, ArrowLeft, Loader2, XCircle, ChevronRight, Flag, ShieldCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import * as XLSX from 'xlsx';
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

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
// testConnection();

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
  
  // We MUST throw or handle this so it shows up in the UI (we'll let the user know directly)
  if (lowerErr.includes('permission') || lowerErr.includes('insufficient')) {
      console.warn(`PERMISSION ERROR ON PATH: ${path}. User might need to update Firebase Security Rules for this collection.`);
      // Optional: if we had access to addToast here we would, but throwing it at least stops silent failures
      // that confuse debugging.
  }
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
  gender?: string;
  state?: string;
  district?: string;
  mandal?: string;
  village?: string;
  mobile?: string;
  email?: string;
  photoURL?: string;
  office?: string;
  bio?: string;
  role?: string;
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
  text?: string;
  suggestion?: string;
  category?: string;
  status: 'pending' | 'approved' | 'Deleted';
  time: number;
  uid?: string;
  resolvedAt?: number;
}

interface ProblemReport {
  id: string;
  msg: string;
  category?: string;
  status?: 'pending' | 'solved' | 'Deleted';
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
  padding: 25px;
  box-shadow: var(--card-shadow);
  margin-bottom: 25px;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}
.mana-card {
  background: #fff;
  border: 1.5px solid #f1f5f9;
  border-radius: 28px;
  padding: 35px 25px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
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

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const postIdFromUrl = searchParams.get('postId');
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'user'>('user');
  
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
  const [problemsGlobal, setProblemsGlobal] = useState<ProblemReport[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<{ id: number, msg: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showPostForm, setShowPostForm] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
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
      setPosts(pArr.sort((a, b) => (b.time || 0) - (a.time || 0)));
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
        setUserProfile({ id: snap.id, ...snap.data() } as UserProfile);
      } else {
        setUserProfile(null);
        setShowForcedProfileSetup(true);
      }
      setProfileLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
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
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      try {
        await addDoc(collection(db, 'security_logs'), {
           admin: result.user.email,
           action: `Google Login (${navigator.userAgent.substring(0, 50)}...)`,
           time: Date.now()
        });
      } catch (e) {
        // Silent fail for logging
      }
      
      addToast("Google Login Success!");
    } catch (err: any) {
      addToast("Login Failed: " + err.message);
    }
  };

  const triggerLogin = () => {
    Swal.fire({
      title: 'Login to E-Vedhika',
      html: `
        <div style="text-align: left; margin-bottom: 10px; font-weight: 800; font-size: 11px; color: #64748b; text-transform: uppercase;">Email Login</div>
        <input id="swal-input1" class="swal2-input" placeholder="Email" style="margin-top: 0;">
        <input id="swal-input2" type="password" class="swal2-input" placeholder="Password">
        <div style="margin: 15px 0; display: flex; align-items: center; gap: 10px;">
           <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
           <span style="font-size: 10px; font-weight: 800; color: #94a3b8;">OR</span>
           <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
        </div>
        <button id="google-login-btn" class="swal2-confirm swal2-styled" style="background-color: #ea4335; width: 100%; margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px; border-radius: 12px; font-weight: 800; text-transform: uppercase; font-size: 11px;">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white"/><path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="white"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="white"/></svg>
           Sign in with Google
        </button>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Sign In / Register',
      confirmButtonColor: '#0d3b66',
      customClass: {
        confirmButton: 'rounded-xl font-bold uppercase text-xs px-6 py-3',
        cancelButton: 'rounded-xl font-bold uppercase text-xs px-6 py-3'
      },
      didRender: () => {
         const googleBtn = document.getElementById('google-login-btn');
         if (googleBtn) {
           googleBtn.addEventListener('click', () => {
             Swal.clickConfirm();
             (window as any).isGoogleLogin = true;
           });
         }
      },
      preConfirm: () => {
        if ((window as any).isGoogleLogin) {
          delete (window as any).isGoogleLogin;
          return { method: 'google' };
        }
        const email = (document.getElementById('swal-input1') as HTMLInputElement).value;
        const password = (document.getElementById('swal-input2') as HTMLInputElement).value;
        if (!email || !password) {
          Swal.showValidationMessage('Please enter both email and password');
        }
        return { method: 'email', email, password };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
         if (result.value.method === 'google') {
           handleGoogleLogin();
         } else {
           try {
             await signInWithEmailAndPassword(auth, result.value.email, result.value.password);
             
             try { await addDoc(collection(db, 'security_logs'), { admin: result.value.email, action: `Email Login (${navigator.userAgent.substring(0, 50)}...)`, time: Date.now() }); } catch(e){}
             
             addToast("Welcome back!");
           } catch (err: any) {
             try {
               await createUserWithEmailAndPassword(auth, result.value.email, result.value.password);
               try { await addDoc(collection(db, 'security_logs'), { admin: result.value.email, action: `Account Registration (${navigator.userAgent.substring(0, 50)}...)`, time: Date.now() }); } catch(e){}
               addToast("Signed up successfully!");
             } catch (e: any) {
               addToast("Login failed");
             }
           }
         }
      }
    });
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
    if (!isEditor && p.status === 'Deleted') return false;
    const q = searchQuery.toLowerCase().trim();
    const tMatch = (p.title || "").toLowerCase().includes(q);
    const cMatch = (p.content || "").toLowerCase().includes(q);
    const searchOk = !q || tMatch || cMatch;
    if (currentFilter === 'All') return searchOk;
    return searchOk && (p.category === currentFilter || p.subCategory === currentFilter);
  });

  if (location.pathname === '/Evdka' && isEditor) {
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
                
                <button onClick={() => navigate('/')} className="mt-8 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest border border-slate-800 px-6 py-2 rounded-xl">Back to Portal</button>
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
                 users={[]} 
                 setAdminLocked={setAdminLocked} 
                 adminLocked={adminLocked} 
                 notifications={notifications} 
                 requests={requests} 
                 updates={updates}
                 userRole={userRole}
                 isDevEmail={isDevEmail}
                 onExit={() => navigate('/')}
              />
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

      <header className="sticky top-0 z-[1001] bg-[#0d3b66] border-b-4 border-[#fbbf24] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setCurrentTab('home'); setSidebarOpen(false); }}>
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#fbbf24] flex items-center justify-center p-1 group-hover:rotate-12 transition-transform">
              <div className="w-full h-full rounded-full bg-[#0d3b66] flex items-center justify-center text-white font-black text-sm">EV</div>
            </div>
            <div className="flex flex-col">
              <div className="bg-[#0077b6] px-3 py-1 rounded-t-md">
                <h1 className="text-2xl font-black italic tracking-tighter text-[#fbbf24] leading-none">E-VEDHIKA</h1>
              </div>
              <div className="bg-[#023e8a] px-3 py-0.5 rounded-b-md">
                <p className="text-[8px] font-black text-white uppercase tracking-wider">All Problems One Solution</p>
              </div>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="hidden md:flex items-center gap-3">
             {user && !user.isAnonymous ? (
               <div onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl border border-white/10 transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-[#fbbf24] flex items-center justify-center text-[#0d3b66] font-black text-xs">
                     {user.photoURL ? <img src={user.photoURL} className="w-full h-full rounded-full object-cover" /> : user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white text-xs font-bold">{userProfile?.username || "Guest"}</span>
               </div>
             ) : (
               <button onClick={triggerLogin} className="bg-[#fbbf24] text-[#0d3b66] px-6 py-2 rounded-xl font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all">
                  Join Portal
               </button>
             )}
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-[#dc2626] text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest animate-pulse">Hot Updates</div>
          <div className="hidden sm:block text-[11px] font-bold text-slate-500 max-w-md truncate">
             {updates.length > 0 ? updates[0].text : 'Empowering local governance through digital innovation...'}
          </div>
        </div>
        <div className="text-[11px] font-black text-[#0d3b66] uppercase tracking-widest italic">Empowering</div>
      </div>

      <nav className="sticky top-0 z-[1000] bg-white shadow-sm px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <button className="bg-[#0d3b66] text-white p-2.5 rounded-lg shadow-md hover:opacity-90 transition-all" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 text-slate-400 hover:text-[#0d3b66] hover:bg-slate-50 rounded-xl transition-all relative">
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">{unreadCount}</span>
            )}
          </button>
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
              <button 
                onClick={() => setSidebarOpen(false)}
                className="absolute top-2 right-2 p-3 bg-slate-100 text-slate-500 hover:text-primary rounded-full transition-all active:scale-90 z-[1200] shadow-sm flex items-center justify-center hover:bg-white border border-slate-200"
                title="Close sidebar"
              >
                <X size={20} strokeWidth={3} />
              </button>
            )}
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-4">Navigations</h3>
            <MenuButton label="Home" emoji="🏠" active={currentTab === 'home'} onClick={() => {setCurrentTab('home'); setCurrentFilter('All'); setSidebarOpen(false);}} />
            <MenuButton label="🏛️ Mana Panchayath" emoji="📊" active={currentTab === 'workspace'} onClick={() => {setCurrentTab('workspace'); setSidebarOpen(false);}} />
            <MenuButton label="Schemes info and govt" emoji="📢" active={currentTab === 'schemes'} onClick={() => {setCurrentTab('schemes'); setSidebarOpen(false);}} />
            <MenuButton label="Live Chat" emoji="💬" active={currentTab === 'chat'} onClick={() => {setCurrentTab('chat'); setSidebarOpen(false);}} />
            <MenuButton label="Union Corner" emoji="🤝" active={currentTab === 'union'} onClick={() => {setCurrentTab('union'); setSidebarOpen(false);}} />
            <MenuButton label="Public suggestions & Feedback" emoji="💡" active={currentTab === 'suggestions'} onClick={() => {setCurrentTab('suggestions'); setSidebarOpen(false);}} />
          </div>
        </aside>

        <main className="flex-1 w-full h-full overflow-y-auto custom-scrollbar p-4 lg:p-8">
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="section-card card-blue !p-6">
                      <span className="text-[11px] font-black text-slate-400 uppercase">Live Updates</span>
                      <h2 className="text-3xl font-black text-primary mt-2">{posts.length}</h2>
                    </div>
                    <div className="section-card !border-t-danger !p-6 cursor-pointer hover:bg-red-50 transition-colors" onClick={() => { setCurrentTab('problems'); setSidebarOpen(false); }}>
                      <span className="text-[11px] font-black text-slate-400 uppercase">Pending Issues</span>
                      <h2 className="text-3xl font-black text-danger mt-2">{problemsGlobal.filter(p => p.status !== 'solved').length}</h2>
                    </div>
                    <div className="section-card card-gold !p-6 !bg-primary overflow-hidden relative">
                      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                      <div className="mt-2">
                        {user && !user.isAnonymous ? (
                           <div className="flex justify-between items-center">
                             <span className="text-sm font-black text-white">Active session</span>
                             <button onClick={() => signOut(auth)} className="text-xs bg-red-500 text-white px-4 py-1.5 rounded-full font-black uppercase shadow-md">Logout</button>
                           </div>
                        ) : (
                          <div className="space-y-2">
                            <button onClick={triggerLogin} className="w-full bg-accent text-primary py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-white transition-all shadow-md">
                               Login / Create Account
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-6 rounded-[32px] shadow-sm border border-slate-100">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-6">
                       <div className="flex-1">
                          {user && !user.isAnonymous ? (
                            <h3 className="text-xl font-black text-primary uppercase tracking-tighter">📝 Portal Updates</h3>
                          ) : (
                            <div className="flex items-center gap-3 flex-1 border border-slate-200 rounded-3xl px-6 py-4 bg-slate-50 shadow-sm focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                               <Search size={24} className="text-slate-400 shrink-0" />
                               <input 
                                 type="text" 
                                 placeholder="Search latest news, reports or notices..." 
                                 className="!bg-transparent !border-none !p-0 !m-0 focus:!ring-0 text-[18px] w-full font-bold text-primary placeholder:text-slate-400"
                                 value={searchQuery}
                                 onChange={(e) => setSearchQuery(e.target.value)}
                               />
                               {searchQuery && (
                                 <button onClick={() => setSearchQuery('')} className="text-slate-300 hover:text-danger hover:scale-110 transition-all">
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
                      <button 
                        onClick={() => { setEditingPost(null); setShowPostForm(true); }}
                        className="w-full bg-slate-50 border-2 border-dashed border-slate-200 p-6 sm:p-8 rounded-[28px] text-slate-400 font-bold hover:bg-slate-100 hover:border-primary/20 transition-all flex flex-col items-center gap-3"
                      >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border shadow-sm text-primary">
                          <PlusCircle size={24} />
                        </div>
                        <span>Compose an official update...</span>
                      </button>
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

                    {showSuggestionForm && (
                      <div className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-[24px] shadow-2xl custom-scrollbar relative">
                           <SuggestionForm addToast={addToast} onCancel={() => setShowSuggestionForm(false)} />
                        </div>
                      </div>
                    )}

                    {selectedSuggestion && (
                      <div className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedSuggestion(null)}>
                        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-[24px] shadow-2xl p-6 relative" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setSelectedSuggestion(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                            <X size={16} />
                          </button>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-black text-xl">
                              👤
                            </div>
                            <div>
                              <h3 className="font-black text-slate-800 leading-tight">{selectedSuggestion.name || 'Portal User'}</h3>
                              <p className="text-xs font-bold text-slate-400">
                                {new Date(selectedSuggestion.time || Date.now()).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <h4 className="text-[10px] font-black text-[#a855f7] uppercase tracking-widest mb-2">{selectedSuggestion.category || 'General'}</h4>
                             <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                               {selectedSuggestion.text || selectedSuggestion.suggestion || (selectedSuggestion as any).msg || (selectedSuggestion as any).content}
                             </p>
                          </div>
                        </div>
                      </div>
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

            {currentTab === 'union' && (
              <motion.div key="union" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="section-card flex flex-col items-center justify-center py-24 text-center bg-slate-50 border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">🚧</span>
                  </div>
                  <h2 className="text-3xl font-black text-primary mb-3">Coming Soon</h2>
                  <p className="text-slate-500 font-bold max-w-md">
                    Union Corner is under development.
                  </p>
                </div>
              </motion.div>
            )}

            {currentTab === 'suggestions' && (() => {
              const visibleSuggestions = isAdmin ? suggestions : suggestions.filter(s => s.status?.toLowerCase() === 'approved');
              const hasPending = suggestions.length > visibleSuggestions.length;
              return (
              <motion.div key="suggestions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="section-card card-gold">
                  <h2 className="text-2xl font-black text-primary mb-6">💡 Community Voice</h2>
                  <div className="bg-slate-50 rounded-2xl p-4 max-h-[600px] overflow-y-auto mb-6 custom-scrollbar">
                    {visibleSuggestions.length > 0 ? (
                      <div className="space-y-6">
                        {Array.from(new Set(visibleSuggestions.map(s => s.category || 'General'))).map(category => (
                          <div key={category}>
                             <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">{category}</h4>
                             <div className="space-y-3">
                               {visibleSuggestions.filter(s => (s.category || 'General') === category).map(s => (
                                 <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-[#a855f7]">
                                   <div className="flex justify-between items-center mb-2">
                                     <span className="text-[10px] font-black text-[#a855f7] uppercase block">👤 {s.name || 'Portal User'}</span>
                                     <span className="text-[10px] text-slate-400 font-bold">
                                       {new Date(s.time || Date.now()).toLocaleDateString()}
                                       {isAdmin && s.status?.toLowerCase() !== 'approved' && (
                                          <span className="ml-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[8px] uppercase">{s.status || 'pending'}</span>
                                       )}
                                       {isAdmin && s.status?.toLowerCase() === 'approved' && (
                                          <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[8px] uppercase">Approved</span>
                                       )}
                                     </span>
                                   </div>
                                   <p className="text-sm font-medium text-slate-700">
                                     {(s.text || s.suggestion || (s as any).msg || (s as any).content || '').length > 200 ? `${(s.text || s.suggestion || (s as any).msg || (s as any).content || '').substring(0, 200)}...` : (s.text || s.suggestion || (s as any).msg || (s as any).content || '')}
                                     {(s.text || s.suggestion || (s as any).msg || (s as any).content || '').length > 200 && (
                                       <span onClick={() => setSelectedSuggestion(s)} className="text-xs font-bold text-[#a855f7] ml-2 cursor-pointer hover:underline">Read more</span>
                                     )}
                                   </p>
                                 </div>
                               ))}
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="font-bold text-slate-400">No approved public suggestions shared yet.</p>
                        {!isAdmin && hasPending && (
                           <p className="text-xs text-amber-500 mt-2 font-bold animate-pulse">
                             There are {hasPending} pending suggestions. Please log in as Admin to review them.
                           </p>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { 
                    setShowSuggestionForm(true); 
                  }} className="w-full bg-[#a855f7] text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90 transition-all active:scale-95">
                    📝 Submit New Suggestion
                  </button>
                </div>
              </motion.div>
              );
            })()}

            {currentTab === 'problems' && (
              <motion.div key="problems" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setCurrentTab('home')} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
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
                       if (!user || user.isAnonymous) return addToast("Please login to report issues");
                       try {
                         await addDoc(collection(db, 'problems'), {
                           msg,
                           category: cat,
                           status: 'pending',
                           time: Date.now(),
                           uid: user.uid
                         });
                         addToast("Problem reported successfully!");
                         target.reset();
                       } catch(err) { handleFirestoreError(err, OperationType.WRITE, 'problems'); }
                     }} className="space-y-4">
                       <input name="category" placeholder="Category (e.g. Aadhar, Water, Tax)" required className="bg-white" />
                       <textarea name="message" placeholder="Explain your problem in detail..." required rows={3} className="bg-white" />
                       <button className="w-full bg-danger text-white py-3 rounded-xl font-black shadow-md hover:opacity-90">Submit Report</button>
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
  const [saving, setSaving] = useState(false);

  const mandals = district ? TELANGANA_DATA[district] || [] : [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!username || !name || !surname || !mobile || !district || !mandal) {
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
        mobile,
        email,
        photoURL,
        time: userProfile?.time || Date.now()
      }, { merge: true });
      addToast("Profile updated successfully!");
      if (onComplete) onComplete();
      onClose();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      addToast("Failed to update profile: " + err.message);
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
          <button onClick={onClose} className="absolute top-6 right-6 bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20}/>
          </button>
        )}
        
        <div className="text-center mb-6">
           <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">Profile Setup</h2>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mt-1">
             {isForced ? "Complete your identity to continue" : "Update your portal credentials"}
           </p>
        </div>
        
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-[20px] overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center relative group">
              {photoURL ? <img src={photoURL} alt="Preview" className="w-full h-full object-cover" /> : <User size={30} className="text-slate-300" />}
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
                  {mandals.map(m => <option key={m}>{m}</option>)}
               </select>
             </div>
             <div>
               <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Village / GP</label>
               <input value={village} onChange={e => setVillage(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" placeholder="Village" />
             </div>
          </div>

          <div className="flex gap-3 mt-4">
            {!isForced && (
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >
                Cancel
              </button>
            )}
            {isForced && (
              <button 
                type="button" 
                onClick={onExitForced} 
                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >
                Exit to Home
              </button>
            )}
            <button 
             disabled={saving}
             className="flex-[2] bg-primary text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AdminPanel({ addToast, posts, problems, suggestions, users, setAdminLocked, adminLocked, notifications, requests, updates, userRole, onExit, onNewPost, onEditPost, isDevEmail }: any) {
  const isAdmin = userRole === 'admin' || isDevEmail;
  const isEditor = userRole === 'admin' || userRole === 'editor' || isDevEmail;
  const [activeSubTab, setActiveSubTab] = useState('dash');
  const [reportsType, setReportsType] = useState<'issues' | 'posts'>('posts');
  const [reportsFilter, setReportsFilter] = useState<'All' | 'Pending' | 'Approved' | 'Flagged'>('Pending');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allProblems, setAllProblems] = useState<ProblemReport[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  useEffect(() => {
    if (!isEditor) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const uList: UserProfile[] = [];
      snap.forEach(d => uList.push({ id: d.id, ...(d.data() as any) }));
      setAllUsers(uList);
    }, (err) => {
      setPermissionError("Access to user database restricted.");
      handleFirestoreError(err, OperationType.LIST, 'users');
    });

    const unsubProblems = onSnapshot(collection(db, 'problems'), (snap) => {
      const pList: ProblemReport[] = [];
      snap.forEach(d => pList.push({ id: d.id, ...(d.data() as any) }));
      setAllProblems(pList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'problems'));

    let unsubLogs = () => {};
    if (isAdmin) {
      unsubLogs = onSnapshot(query(collection(db, 'security_logs'), orderBy('time', 'desc'), limit(20)), (snap) => {
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
      unsubUsers();
      unsubProblems();
      unsubLogs();
    };
  }, [isEditor, isAdmin]);

  const deleteUser = async (id: string) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      addToast("User deleted");
    } catch (err) { handleFirestoreError(err, OperationType.DELETE, `users/${id}`); }
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
                if (target.value === '1234') {
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
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
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
              <button className="lg:hidden text-white/50 hover:text-white" onClick={() => setAdminMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {[
                { id: 'dash', label: 'Analytics Dashboard', icon: <Activity size={18}/> },
                { id: 'reports', label: 'Posts & Issues', icon: <AlertOctagon size={18}/> },
                { id: 'suggestions', label: 'Suggestions', icon: <PlusCircle size={18}/> },
                { id: 'users', label: 'User Profiles', icon: <Users size={18}/> },
                { id: 'updates', label: 'Flash News', icon: <Zap size={18}/> },
                { id: 'logs', label: 'Security Logs', icon: <ShieldAlert size={18}/> },
                { id: 'settings', label: 'System Config', icon: <Settings size={18}/> }
              ].filter(t => isAdmin || ['dash', 'reports', 'suggestions', 'updates'].includes(t.id)).map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => { setActiveSubTab(tab.id); setAdminMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
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

            <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
              <button onClick={onExit} className="w-full flex items-center gap-3 p-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                <LogOut size={18} />
                Exit to Portal
              </button>
              <button onClick={() => setAdminLocked(true)} className="w-full flex items-center gap-3 p-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-400/10 transition-all">
                <Lock size={18} />
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

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 lg:p-10 bg-white overflow-y-auto custom-scrollbar flex flex-col relative w-full h-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-100 !bg-transparent !h-auto !p-0 !border-none">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors" onClick={() => setAdminMenuOpen(true)}>
              <span className="block w-5 h-0.5 bg-current mb-1"></span>
              <span className="block w-5 h-0.5 bg-current mb-1"></span>
              <span className="block w-5 h-0.5 bg-current"></span>
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-primary uppercase tracking-tighter">
                {activeSubTab === 'dash' && '📊 Dashboard'}
                {activeSubTab === 'reports' && '🚩 Posts & Issues'}
                {activeSubTab === 'users' && '👥 User Access'}
                {activeSubTab === 'logs' && '🛡️ Security Audits'}
                {activeSubTab === 'settings' && '⚙️ System Settings'}
                {activeSubTab === 'suggestions' && '💡 Suggestions'}
                {activeSubTab === 'updates' && '⚡ Flash News'}
              </h1>
              <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status: Active Service Layer</p>
            </div>
          </div>
        </header>

        {activeSubTab === 'dash' && (
          <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div className="section-card card-blue !p-8 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50/50 to-white">
              <div>
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm group-hover:scale-110 transition-transform"><Users size={28} /></div>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">Registry Index</h3>
                 <p className="text-5xl font-black text-blue-900 tracking-tighter leading-none">{allUsers.length}</p>
                 <p className="text-[10px] font-bold text-blue-600/60 mt-2 uppercase">Total Enrolled Citizens</p>
              </div>
              <div className="mt-8 pt-6 border-t border-blue-100/50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Activity Level</span>
                <span className="text-blue-600 flex items-center gap-1.5"><Activity size={12}/> High</span>
              </div>
            </div>

            <div className="section-card card-gold !p-8 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-amber-50/50 to-white">
              <div>
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-600 mb-6 shadow-sm group-hover:scale-110 transition-transform"><MessageSquare size={28} /></div>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">Curation Queue</h3>
                 <p className="text-5xl font-black text-amber-900 tracking-tighter leading-none">{posts.filter(p => !p.status || p.status === 'pending').length + suggestions.filter(s => s.status?.toLowerCase() === 'pending').length}</p>
                 <p className="text-[10px] font-bold text-amber-600/60 mt-2 uppercase">Awaiting Moderation</p>
              </div>
              <div className="mt-8 pt-6 border-t border-amber-100/50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Response Rate</span>
                <span className="text-amber-600 flex items-center gap-1.5"><Zap size={12}/> 94.2%</span>
              </div>
            </div>

            <div className="section-card card-danger !p-8 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-rose-50/50 to-white">
              <div>
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-rose-600 mb-6 shadow-sm group-hover:scale-110 transition-transform"><AlertTriangle size={28} /></div>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">Issue Tracker</h3>
                 <p className="text-5xl font-black text-rose-900 tracking-tighter leading-none">{allProblems.filter(p => p.status !== 'solved').length}</p>
                 <p className="text-[10px] font-bold text-rose-600/60 mt-2 uppercase">Open Support Tickets</p>
              </div>
              <div className="mt-8 pt-6 border-t border-rose-100/50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Severity Metric</span>
                <span className="text-rose-600 flex items-center gap-1.5"><ShieldAlert size={12}/> Moderate</span>
              </div>
            </div>
          </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-full">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                  <h4 className="text-sm font-black text-primary uppercase tracking-tight">Resolution Analytics</h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Resolved Cases</span>
                  </div>
                </div>
                <div className="flex-1 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Pending', count: allProblems.filter(p => p.status !== 'solved').length },
                      { name: 'Solved', count: allProblems.filter(p => p.status === 'solved').length }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 800, fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[32px] shadow-lg text-white flex flex-col justify-center relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10 space-y-6">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                     <ShieldCheck size={28} className="text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter leading-tight">System Status<br/><span className="text-blue-400">Optimal</span></h3>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed">
                    Platform is active and monitoring data integrity. {suggestions.filter(s => s.status?.toLowerCase() === 'pending').length} suggestions pending review.
                  </p>
                  <button onClick={() => setActiveSubTab('reports')} className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all font-black rounded-xl text-[11px] uppercase tracking-wider backdrop-blur-sm border border-white/10">
                    Review Pending
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeSubTab === 'reports' || activeSubTab === 'suggestions') && (
           <div className="space-y-6">
              {activeSubTab === 'reports' && (
                <div className="flex items-center gap-3 p-1.5 bg-slate-50 rounded-2xl w-fit mb-4">
                  {['posts', 'issues'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setReportsType(type as any)}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportsType === type ? 'bg-white shadow-sm text-primary' : 'hover:bg-slate-200/50 text-slate-400'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 p-1.5 bg-slate-50 rounded-2xl w-fit mb-8">
                 {['All', 'Pending', 'Approved', 'Flagged'].map(filter => (
                   <button 
                     key={filter}
                     onClick={() => setReportsFilter(filter as any)}
                     className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportsFilter === filter ? 'bg-white shadow-sm text-primary' : 'hover:bg-slate-200/50 text-slate-400'}`}
                   >
                     {filter}
                   </button>
                 ))}
                 <button className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 ml-4 animate-pulse">✨ AI AUTO SCAN</button>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b-2 border-slate-100">
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 shrink-0 whitespace-nowrap">ID</th>
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 shrink-0 min-w-[200px]">Details & Context</th>
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Received Date</th>
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-4 whitespace-nowrap">Action Pipeline</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {(activeSubTab === 'reports' ? (reportsType === 'posts' ? posts : allProblems) : suggestions).filter(item => {
                         if (reportsFilter === 'All') return true;
                         if (reportsFilter === 'Pending') return !item.status || item.status.toLowerCase() === 'pending';
                         if (reportsFilter === 'Approved') return item.status?.toLowerCase() === 'approved' || item.status?.toLowerCase() === 'solved';
                         if (reportsFilter === 'Flagged') return item.status?.toLowerCase() === 'flagged';
                         return true;
                       }).map((item: any, idx) => (
                         <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="py-6 pl-4">
                               <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500">
                                  #{idx + 1}
                               </div>
                            </td>
                            <td className="py-6 pl-4 max-w-md">
                               <h5 className="font-black text-primary text-sm mb-1 leading-tight flex items-center gap-2">
                                  {item.title || item.category || item.name || 'Support Ticket'}
                                  {activeSubTab === 'suggestions' && <span className="text-[8px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Suggestion</span>}
                                </h5>
                               <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                                  "{item.msg || item.content || item.text || item.suggestion}"
                               </p>
                               <div className="flex gap-4 mt-3">
                                 <span className="text-[9px] font-black text-indigo-500 uppercase flex items-center gap-1">
                                    <Activity size={10}/> STATUS: {(item.status || 'ACTIVE').toUpperCase()}
                                 </span>
                                 <span className="text-[9px] font-black text-slate-400 flex items-center gap-1">
                                    <User size={10}/> {item.userName || item.name || 'Portal User'} 
                                    <span className="text-slate-300 ml-1">({typeof item.uid === 'string' ? item.uid.substring(0, 5) : 'ADMIN'})</span>
                                 </span>
                               </div>
                            </td>
                            <td className="py-6">
                               <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                 item.status === 'solved' || item.status === 'Approved' || item.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                               }`}>
                                  {item.status || 'Active'}
                               </span>
                            </td>
                            <td className="py-6">
                               <div className="flex items-center gap-2 text-slate-400">
                                  <Clock size={12}/>
                                  <span className="text-[10px] font-black tracking-tighter">{item.time ? new Date(item.time).toLocaleDateString() : 'N/A'}</span>
                               </div>
                            </td>
                            <td className="py-6 text-right pr-4">
                                <div className="flex justify-end gap-2">
                                  <button title="Approve" onClick={async () => {
                                    if (activeSubTab === 'reports' && reportsType === 'posts') {
                                        try { await updateDoc(doc(db, 'posts', item.id), { status: 'Approved' }); addToast("Post Approved"); } catch(e: any) { addToast("Error: " + e.message); handleFirestoreError(e, OperationType.UPDATE, `posts/${item.id}`); }
                                    } else if (activeSubTab === 'suggestions') {
                                        try { await updateDoc(doc(db, 'suggestions', item.id), { status: 'approved' }); addToast("Suggestion Approved"); } catch(e: any) { addToast("Error: " + e.message); handleFirestoreError(e, OperationType.UPDATE, `suggestions/${item.id}`); }
                                    } else {
                                        resolveProblem(item);
                                    }
                                  }} className="p-2 bg-green-50 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all"><CheckCircle2 size={16}/></button>

                                  <button title="Mark Pending" onClick={async () => {
                                     try {
                                       if (activeSubTab === 'reports' && reportsType === 'posts') {
                                           await updateDoc(doc(db, 'posts', item.id), { status: 'pending' }); addToast("Pending"); 
                                       } else if (activeSubTab === 'suggestions') {
                                           await updateDoc(doc(db, 'suggestions', item.id), { status: 'pending' }); addToast("Pending"); 
                                       } else {
                                           await updateDoc(doc(db, 'problems', item.id), { status: 'pending' }); addToast("Pending"); 
                                       }
                                     } catch(e) {}
                                   }} className="p-2 bg-amber-50 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-white transition-all"><Clock size={16}/></button>

                                  <button title="Modify" onClick={() => {
                                    if (activeSubTab === 'reports' && reportsType === 'posts') {
                                        onEditPost(item);
                                    } else {
                                        addToast("Modifying is only direct for posts right now");
                                    }
                                  }} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><Edit3 size={16}/></button>

                                  <button title="Delete" onClick={async () => {
                                    if (activeSubTab === 'reports' && reportsType === 'posts') {
                                        if (item.status === 'Deleted') {
                                            const res = await Swal.fire({
                                                title: 'Permanent Delete?',
                                                text: 'Delete this post permanently from Firestore?',
                                                icon: 'error',
                                                showCancelButton: true,
                                                confirmButtonText: 'Yes, Hard Delete',
                                                confirmButtonColor: '#ef4444'
                                            });
                                            if (res.isConfirmed) {
                                                try {
                                                    await deleteDoc(doc(db, 'posts', item.id));
                                                    addToast("Permanently Deleted");
                                                } catch (e: any) {
                                                    addToast("Error: " + e.message);
                                                }
                                            }
                                        } else {
                                            const res = await Swal.fire({
                                                title: 'Soft Delete?',
                                                text: 'Archive this post? (Soft Delete)',
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonText: 'Yes, Move to Archive'
                                            });
                                            if (res.isConfirmed) {
                                                try {
                                                    await updateDoc(doc(db, 'posts', item.id), { 
                                                        status: 'Deleted',
                                                        deletedAt: Date.now(),
                                                        deletedBy: auth.currentUser?.email
                                                    });
                                                    addToast("Moved to Archive");
                                                } catch (e: any) {
                                                    addToast("Error: " + e.message);
                                                }
                                            }
                                        }
                                    } else if (activeSubTab === 'suggestions') {
                                        try { await deleteDoc(doc(db, 'suggestions', item.id)); addToast("Suggestion Deleted"); } catch(e: any) { addToast("Error: " + e.message); handleFirestoreError(e, OperationType.DELETE, `suggestions/${item.id}`); }
                                    } else {
                                        try { await deleteDoc(doc(db, 'problems', item.id)); addToast("Problem Deleted"); } catch(e: any) { addToast("Error: " + e.message); handleFirestoreError(e, OperationType.DELETE, `problems/${item.id}`); }
                                    }
                                  }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeSubTab === 'users' && (
           <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {allUsers.map(u => (
                   <motion.div 
                     layout
                     key={u.id}
                     className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 relative overflow-hidden group"
                   >
                     <div className="absolute top-0 right-0 p-4">
                        <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                     </div>
                     <div className="flex items-start gap-4 mb-6 pt-2">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden">
                           {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <User size={24} className="text-slate-300" />}
                        </div>
                        <div>
                           <h4 className="font-black text-primary text-sm mb-1">{u.name} {u.surname}</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">@{u.username}</p>
                        </div>
                     </div>
                     
                     <div className="space-y-4">
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
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location: {u.village || 'Undefined'}</div>
                           <button onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)} className="text-[10px] font-black text-blue-500 uppercase hover:underline">View Full File</button>
                        </div>
                        {expandedUser === u.id && (
                           <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">
                              <div><span className="text-slate-400 block mb-1">Gender</span>{u.gender || 'N/A'}</div>
                              <div><span className="text-slate-400 block mb-1">Mobile</span>{u.mobile || 'N/A'}</div>
                              <div><span className="text-slate-400 block mb-1">Email</span>{u.email || 'N/A'}</div>
                              <div><span className="text-slate-400 block mb-1">State</span>{u.state || 'N/A'}</div>
                              <div><span className="text-slate-400 block mb-1">District</span>{u.district || 'N/A'}</div>
                              <div><span className="text-slate-400 block mb-1">Mandal</span>{u.mandal || 'N/A'}</div>
                              <div><span className="text-slate-400 block mb-1">Office</span>{u.office || 'N/A'}</div>
                              <div className="col-span-2"><span className="text-slate-400 block mb-1">Bio</span><span className="normal-case text-slate-600 line-clamp-3 leading-relaxed">{u.bio || 'N/A'}</span></div>
                           </div>
                        )}
                     </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        )}

        {activeSubTab === 'updates' && (
          <div className="space-y-10">
            <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 shadow-inner">
               <h4 className="text-sm font-black text-primary uppercase mb-6 flex items-center gap-2">
                  <Zap size={18} className="text-amber-500" /> Broadcast New Flash Update
               </h4>
               <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = e.target as any;
                    const text = f.text.value;
                    if(!text) return;
                    try {
                      await addDoc(collection(db, 'updates'), { text, time: Date.now() });
                      f.reset();
                      addToast("Global Update Transmitted");
                    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'updates'); }
                  }}
                  className="flex flex-col sm:flex-row gap-4"
               >
                  <input name="text" placeholder="Type the breaking news here..." className="flex-1 !mb-0 p-4 rounded-2xl border-slate-200 focus:border-blue-500 shadow-md" />
                  <button className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">Transmit</button>
               </form>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Active Transmissions</h4>
               <div className="grid gap-4">
                  {updates.map(u => (
                    <div key={u.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <p className="text-sm font-bold text-slate-700">{u.text}</p>
                       </div>
                       <button 
                         onClick={async () => {
                           await deleteDoc(doc(db, 'updates', u.id));
                           addToast("Transmission Terminated");
                         }}
                         className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeSubTab === 'logs' && (
           <div className="space-y-6">
              <div className="bg-slate-900 rounded-3xl p-2 overflow-hidden shadow-2xl">
                 <table className="w-full text-left text-white/80 border-collapse">
                    <thead className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 bg-white/5">
                       <tr>
                          <th className="p-5 font-black">Audit ID</th>
                          <th className="p-5 font-black">Admin Identity</th>
                          <th className="p-5 font-black">Interaction Event</th>
                          <th className="p-5 font-black">Timestamp</th>
                          <th className="p-5 font-black">System Response</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px] font-medium">
                       {logsError ? (
                         <tr><td colSpan={5} className="p-20 text-center text-white/20 font-black uppercase tracking-widest">Access Restricted to Global Security Layer</td></tr>
                       ) : (
                         logs.map(log => (
                           <tr key={log.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-5 font-mono text-blue-400">#{log.id?.substring(0,6)}</td>
                              <td className="p-5">{log.admin || 'System Admin'}</td>
                              <td className="p-5">
                                 <span className="px-2 py-1 bg-white/5 rounded-md border border-white/10 uppercase text-[9px] font-black">{log.action || 'Event'}</span>
                              </td>
                              <td className="p-5 text-white/40">{new Date(log.time).toLocaleString()}</td>
                              <td className="p-5 text-green-500">AUTHORIZED</td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
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
                       <input type="password" placeholder="••••" className="w-full !mb-0 bg-white border-slate-200 rounded-2xl p-4 font-black text-xl text-center tracking-[1em]" defaultValue="1234" maxLength={4} />
                    </div>

                    <button className="w-full py-5 bg-primary text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all">
                       Sync Global Configuration
                    </button>
                 </div>
              </div>

              <div className="space-y-8">
                 <div>
                    <h4 className="text-xl font-black text-primary mb-2">Data Integrity</h4>
                    <p className="text-xs text-slate-400 font-medium tracking-tight">Backup and recovery protocols</p>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4">
                    <button className="p-6 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-between group hover:border-green-500 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-50 text-green-500 rounded-2xl group-hover:bg-green-500 group-hover:text-white transition-all"><Download size={24}/></div>
                          <div className="text-left">
                             <h5 className="font-black text-primary text-sm uppercase">Full Snapshot</h5>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Generate database backup</p>
                          </div>
                       </div>
                       <ChevronRight size={18} className="text-slate-300" />
                    </button>

                    <button className="p-6 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-between group hover:border-amber-500 transition-all">
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

                 <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                    <h5 className="text-[11px] font-black text-red-600 uppercase flex items-center gap-2 mb-2">
                       <ShieldAlert size={14} /> Danger Zone
                    </h5>
                    <p className="text-[10px] text-red-700/60 font-bold uppercase mb-4 leading-relaxed">
                       Permanent system resets and partition wipes can only be executed via the Secure Root Shell.
                    </p>
                    <button className="px-6 py-2.5 bg-red-600 text-white font-black text-[10px] rounded-xl uppercase tracking-widest shadow-lg shadow-red-600/20">Wipe Interaction Cache</button>
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
    blue: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: Users },
    red: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: AlertOctagon },
    green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: CheckCircle2 },
    amber: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: ClipboardList },
    purple: { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8', icon: Zap }
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

function DigitalWorkspaceSection({ addToast, user }: { addToast: (s:string) => void, user: FirebaseUser | null }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-[16px] shadow-2xl border-t-[8px] border-[#0d3b66] relative overflow-hidden">
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center border-b border-slate-100 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-2xl text-[#0d3b66]">
            <Building size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mana Panchayath</h2>
            <p className="text-sm font-bold text-slate-400">Technical Workspace for PR Officers</p>
          </div>
        </div>
        {activeTool && (
          <button 
            onClick={() => setActiveTool(null)} 
            className="px-6 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0d3b66] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
          >
            <div className="bg-[#0d3b66] text-white p-1 rounded-md">
               <ArrowLeft size={10} />
            </div>
            Back to Tools
          </button>
        )}
      </div>
      
      <div className="p-6 sm:p-10">
        {!activeTool && (
          <div className="mana-grid">
            <ToolCard emoji="📈" title="DSR Analyzer" onClick={() => setActiveTool('dsr')} />
            <ToolCard emoji="🗓️" title="Multi-Day Attendance" onClick={() => setActiveTool('multi')} />
            <ToolCard emoji="🎓" title="Digital Training" onClick={() => setActiveTool('training')} />
            <ToolCard emoji="📂" title="Forms Hub" onClick={() => setActiveTool('forms')} />
          </div>
        )}

        {activeTool && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mt-4">
            {activeTool === 'dsr' && <DSRAnalyzer addToast={addToast} user={user} />}
            {activeTool === 'training' && <TrainingCenter />}
            {activeTool === 'multi' && <MultiDayAnalyzer addToast={addToast} user={user} />}
            {activeTool === 'forms' && <FormsHub addToast={addToast} user={user} />}
          </motion.div>
        )}
      </div>
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
    if (!user) return addToast("Please login to upload forms.");
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
        <button 
          onClick={() => {
            if (!user) return addToast("Please login to share a new form.");
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
                <button disabled={submitting} onClick={handleUpload} className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 text-sm transition-colors">
                   {submitting ? 'Sharing...' : 'Publish Form'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <button onClick={() => addToast("Starting download...")} className="p-2 bg-slate-50 hover:bg-primary hover:text-white text-slate-600 rounded-xl transition-all">
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
    </div>
  );
}

function MultiDayAnalyzer({ addToast, user }: { addToast: (s:string) => void, user: FirebaseUser | null }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold">Multi-Day Growth Analyzer</h3>
      <div className="p-6 border-2 border-dashed rounded-2xl text-center bg-slate-50">
        <p className="text-sm text-slate-500">Upload folder or multiple files to generate attendance Heatmap</p>
        <button onClick={() => {
           if (!user) {
              addToast("Please login to upload and view full Multi-Day data.");
              return;
           }
           addToast("Pro Feature: Multi-file scanning requires bulk permissions.")
        }} className="mt-4 bg-primary text-white px-6 py-2 rounded-xl font-bold">Open Bulk Selector</button>
      </div>
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
  const [rawJson, setRawJson] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, dsr: 0 });
  const [viewMode, setViewMode] = useState<'processed' | 'raw'>('processed');

  const onUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt: any) => {
      const ab = evt.target?.result;
      
      // Attempt to decode the buffer to check for HTML strings
      let content = "";
      try {
        const decoder = new TextDecoder('utf-8');
        content = decoder.decode(ab);
      } catch (e) {
        console.error("Text decoding failed", e);
      }

      let json: any[] = [];
      if (content.includes('<table') || content.includes('<div') || content.includes('<html>')) {
        // It's likely an HTML table saved as .xls/xlsx
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        // Find the table that actually contains data headers
        const tables = tempDiv.querySelectorAll('table');
        let targetTable: HTMLTableElement | null = null;
        
        for (let i = 0; i < tables.length; i++) {
          if (tables[i].textContent?.toLowerCase().includes('panchayat name')) {
            targetTable = tables[i] as HTMLTableElement;
            break;
          }
        }

        if (targetTable) {
          const tableWs = XLSX.utils.table_to_sheet(targetTable);
          json = XLSX.utils.sheet_to_json(tableWs, { header: 1 });
        } else if (tables.length > 0) {
          // Fallback to the largest table if header not found
          let maxRows = 0;
          let bestTable = tables[0];
          tables.forEach(t => {
             if (t.rows.length > maxRows) {
               maxRows = t.rows.length;
               bestTable = t;
             }
          });
          const tableWs = XLSX.utils.table_to_sheet(bestTable);
          json = XLSX.utils.sheet_to_json(tableWs, { header: 1 });
        } else {
          const wb = XLSX.read(ab, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          json = XLSX.utils.sheet_to_json(ws, { header: 1 });
        }
      } else {
        const wb = XLSX.read(ab, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        json = XLSX.utils.sheet_to_json(ws, { header: 1 });
      }
      
      setRawJson(json);
      const rows: any[] = [];
      let present = 0, dsr = 0;
      
      // Find headers dynamically
      let dataStartIndex = 0;
      let mandalIdx = 3, gpIdx = 5, attIdx = 7, dsrIdx = 11;

      for (let i = 0; i < Math.min(20, json.length); i++) {
        const r = json[i] as any[];
        if (!r || !Array.isArray(r)) continue;
        const line = r.join(' ').toLowerCase();
        if (line.includes('panchayat name') || line.includes('gram panchayat')) {
          dataStartIndex = i + 1;
          mandalIdx = r.findIndex(c => String(c).toLowerCase().includes('mandal name')) ;
          if (mandalIdx === -1) mandalIdx = 3;
          
          gpIdx = r.findIndex(c => String(c).toLowerCase().includes('panchayat name')) ;
          if (gpIdx === -1) gpIdx = 5;
          
          attIdx = r.findIndex(c => {
            const val = String(c).toLowerCase();
            return val.includes('attendance status') || val.includes('attendence status') || val.includes('attendance') || val.includes('attendence');
          });
          if (attIdx === -1) attIdx = 7;
          
          dsrIdx = r.findIndex(c => {
             const val = String(c).toLowerCase();
             return val.includes('dsr entry status') || val.includes('dsr entry') || val.includes('dsr');
          });
          if (dsrIdx === -1) dsrIdx = 11;
          break;
        }
      }

      json.slice(dataStartIndex).forEach((r: any) => {
        if (!r || !r[gpIdx]) return;
        const statusStr = String(r[attIdx] || "").toLowerCase();
        const dsrStr = String(r[dsrIdx] || "").toLowerCase();
        const isPresent = statusStr.includes('present');
        const isEntered = dsrStr.includes('entered') || dsrStr.includes('yes');
        
        if (isPresent) present++;
        if (isEntered) dsr++;
        
        rows.push({
          mandal: r[mandalIdx],
          gp: r[gpIdx],
          att: isPresent ? "P" : "A",
          dsr: isEntered ? "✅" : "❌"
        });
      });
      setData(rows);
      setStats({ total: rows.length, present, dsr });
      
      if (rows.length === 0 && json.length > 0) {
        addToast("File loaded, but rows couldn't be parsed. Checking Raw Preview...");
        setViewMode('raw');
        setData([{ _is_dummy: true }]); 
      } else {
        addToast("DSR File Processed! 🚀");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const hasData = data.length > 0 && !(data.length === 1 && data[0]._is_dummy);

  return (
    <div className="space-y-6">
      <div className="p-12 sm:p-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[40px] text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-100/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10">
          <div className="w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner text-slate-400">
            <Upload size={40} strokeWidth={1.5} />
          </div>
          <h4 className="text-lg font-black text-[#0d3b66] uppercase tracking-[0.1em] mb-2">Upload Daily DSR Raw File</h4>
          <p className="text-xs font-bold text-slate-400 mb-10 uppercase tracking-widest">Excel Format (.xlsx / .csv) from Portal</p>
          <input type="file" onChange={onUpload} className="hidden" id="dsrUp" />
          <label 
            htmlFor="dsrUp" 
            className="bg-[#0f3460] text-white px-12 py-5 rounded-2xl font-black cursor-pointer shadow-2xl hover:bg-[#16213e] hover:-translate-y-1 transition-all inline-block text-[11px] uppercase tracking-widest active:scale-95"
          >
             Browse Files
          </label>
        </div>
      </div>

      {(data.length > 0 || rawJson.length > 0) && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
               <button 
                 onClick={() => setViewMode('processed')} 
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'processed' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Processed Data
               </button>
               <button 
                 onClick={() => setViewMode('raw')} 
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'raw' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Raw File Preview
               </button>
            </div>
            {(data.length > 0) && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                 <span className={`w-2 h-2 rounded-full ${hasData ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></span>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   {hasData ? 'Valid Data detected' : 'Check File Format'}
                 </span>
              </div>
            )}
          </div>

          {!user ? (
             <div className="p-8 bg-amber-50 text-amber-700 rounded-[32px] border border-amber-200 text-center">
                 <Lock className="mx-auto mb-4 opacity-50" size={40} />
                 <h4 className="text-lg font-black uppercase tracking-tighter mb-2">Access Synchronization Required</h4>
                 <p className="text-xs font-medium leading-relaxed max-w-sm mx-auto">
                    The raw data has been parsed successfully but viewing detailed analytics requires an active office session. Please login to decrypt the GP records.
                 </p>
                 <button onClick={() => window.scrollTo(0, 0)} className="mt-6 px-8 py-3 bg-amber-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-600/20">Login to Unlock</button>
             </div>
          ) : (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {viewMode === 'processed' ? (
                  <>
                    {hasData ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <StatCard label="Total Staff" val={stats.total} color="blue" />
                          <StatCard label="Physical Presence" val={stats.present} color="green" />
                          <StatCard label="DSR Compliance" val={stats.dsr} color="amber" />
                        </div>

                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-100/40 overflow-hidden">
                          <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  <th className="p-6">Mandal</th>
                                  <th className="p-6">Gram Panchayat</th>
                                  <th className="p-6">Attendance</th>
                                  <th className="p-6">DSR Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {data.filter(r => !r._is_dummy).map((row, i) => (
                                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-6 text-xs font-bold text-slate-500">{row.mandal}</td>
                                    <td className="p-6 text-sm font-black text-primary uppercase tracking-tight">{row.gp}</td>
                                    <td className="p-6">
                                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${row.att === 'P' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {row.att === 'P' ? 'Present' : 'Absent'}
                                      </span>
                                    </td>
                                    <td className="p-6 text-xl">{row.dsr}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-12 text-center bg-white rounded-[32px] border border-slate-100">
                         <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                           <AlertOctagon size={32} />
                         </div>
                         <h4 className="text-xl font-black text-primary tracking-tight">Processing Anomaly</h4>
                         <p className="text-sm font-bold text-slate-400 mt-2">We couldn't extract structure from this file format. Please check "Raw File Preview" to verify headers.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-slate-900 rounded-[32px] p-8 overflow-hidden shadow-2xl relative">
                    <div className="flex items-center justify-between mb-6">
                       <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Source Code: Raw Excel Buffer</h4>
                       <span className="text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <code className="bg-white/10 px-2 py-1 rounded">UTF-8</code> DECRYPTED
                       </span>
                    </div>
                    <div className="max-h-[500px] overflow-auto custom-scrollbar-dark font-mono text-xs leading-relaxed text-blue-400/80">
                         <table className="w-full text-left">
                           <tbody>
                             {rawJson.map((row, idx) => (
                               <tr key={idx} className="hover:bg-white/5 border-b border-white/5">
                                 <td className="p-2 text-white/20 select-none w-8">{idx + 1}</td>
                                 {Array.isArray(row) ? row.map((cell, cidx) => (
                                   <td key={cidx} className="p-3 whitespace-nowrap min-w-[120px] text-[11px] border-r border-white/5 last:border-0">
                                     {typeof cell === 'string' && (cell.includes('<') || cell.includes('>')) 
                                       ? cell.replace(/<[^>]*>?/gm, '').trim() 
                                       : String(cell)}
                                   </td>
                                 )) : <td className="p-3" colSpan={20}>{JSON.stringify(row)}</td>}
                               </tr>
                             ))}
                           </tbody>
                         </table>
                    </div>
                  </div>
                )}
             </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, isExpanded, toggleExpansion, addToast, isAdmin, onEdit }: { post: Post, isExpanded: boolean, toggleExpansion: () => void, addToast: (s:string) => void, isAdmin: boolean, onEdit: (p: Post) => void }) {
  const isOwner = auth.currentUser?.uid === post.uid || isAdmin;
  const postTime = post.time || (post as any).createdAt || 0;
  
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
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      addToast("Login to comment");
      return;
    }
    
    setSubmittingComment(true);
    try {
      await addDoc(collection(db, 'posts', post.id, 'comments'), {
        text: newComment,
        time: Date.now(),
        uid: auth.currentUser.uid,
        userName: auth.currentUser.email?.split('@')[0] || "User",
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
           {post.userPhoto ? <img src={post.userPhoto} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="text-lg">{(post.userName || 'U').charAt(0).toUpperCase()}</div>}
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
           </div>
           <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase mt-1">
              <Clock size={12} />
              <span>{new Date(postTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span className="text-primary/70">{post.category || 'Update'}</span>
           </div>
        </div>
        <div className="flex gap-2">
           {isOwner && (
              <>
                <button onClick={() => onEdit(post)} className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-primary transition-all rounded-lg" title="Edit"><Edit3 size={16} /></button>
                <button onClick={async () => {
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
                          await deleteDoc(doc(db, 'posts', post.id));
                          addToast("Permanently Deleted");
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
                    const res = await Swal.fire({ title: 'Delete?', text: 'Delete this post permanently?', icon: 'warning', showCancelButton: true });
                    if (res.isConfirmed) {
                      try {
                        await deleteDoc(doc(db, 'posts', post.id));
                        addToast("Deleted successfully");
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
      
      <div className={`post-body mb-4 ${isExpanded ? '' : 'line-clamp-4'} whitespace-pre-wrap`}>
        <ReactMarkdown remarkPlugins={[remarkBreaks]}>{post.content || (post as any).message || (post as any).text || (post as any).desc || ''}</ReactMarkdown>
      </div>

      {post.content && post.content.length > 200 && (
        <button onClick={toggleExpansion} className="text-xs font-black text-primary uppercase underline underline-offset-4 mb-6 block">
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
           <button 
             onClick={async () => {
               const userId = auth.currentUser?.uid;
               if (!userId || auth.currentUser?.isAnonymous) return addToast("Login to like");
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
           
           <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 group text-slate-400 hover:text-primary" title="Comments">
              <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-black">{post.commentCount || 0}</span>
           </button>
         </div>

         <div className="flex items-center gap-3">
           <button 
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
                   <span className="text-[10px] text-slate-400">{new Date(c.time).toLocaleDateString()}</span>
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

          lastEditedAt: Date.now(),
          lastEditedBy: auth.currentUser?.uid || 'system',
          lastEditedRole: isAdmin ? "admin" : "user",
          lastEditedName: currentUserProfile?.username || ""
        });
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
          status: 'Active' 
        });
        addToast("Post Published!");
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
        <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors font-black text-lg">✕</button>
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
                      <img src={media.url} className="h-32 w-full object-cover rounded-xl border shadow-sm" />
                    )}
                    <button 
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

      <button disabled={loading} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg hover:bg-primary-light transition-all active:scale-95 mt-6 disabled:opacity-50" style={{ background: '#0d3b66' }}>
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!msg.trim()) return;
    if (!user || user.isAnonymous) return addToast("Login to chat");
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
      <div className="p-4 border-b bg-slate-50 font-black text-primary flex items-center gap-3"><MessageCircle size={20}/> LIVE FEED</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc] custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map(m => (
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
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>
      <div className="p-4 border-t flex gap-2">
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type..." className="mb-0" />
        <button onClick={send} className="bg-primary text-white p-3 rounded-xl" style={{ background: '#0d3b66' }}><Send size={18}/></button>
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

function SuggestionForm({ addToast, onCancel }: { addToast: (s: string) => void, onCancel: () => void }) {
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [mobile, setMobile] = useState('');
  const [category, setCategory] = useState('General Suggestion');
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
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
           <button onClick={() => {
              setSubmitted(false);
              setName(''); setVillage(''); setMobile(''); setCategory('General Suggestion'); setSuggestion('');
           }} className="bg-[#a855f7] text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90">మరో సూచన పంపండి</button>
           <button onClick={onCancel} className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200">తిరిగి వెళ్ళండి</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 overflow-hidden rounded-[24px] bg-white">
      <div className="bg-[#a855f7] p-8 text-white relative">
        <h2 className="text-2xl font-black tracking-tighter">Portal Feedback & Suggestions</h2>
        <p className="text-white/80 font-bold text-sm">మీ విలువైన సూచనలను ఇక్కడ తెలియజేయండి</p>
        <button onClick={onCancel} className="absolute top-6 right-6 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors">
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
          <button disabled={isSubmitting} onClick={handleSubmit} className="flex-1 bg-[#a855f7] text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]">
            {isSubmitting ? 'పంపిస్తున్నాము...' : 'Submit Suggestion'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PRActHub() {
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
        <button onClick={onBack} className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-opacity-90 inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Return to Feed
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-10 rounded-[32px] shadow-sm border space-y-8">
       <button onClick={onBack} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-slate-500 hover:text-primary transition-colors font-bold text-sm w-fit group">
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
             {new Date(post.time || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      addToast("Login to comment");
      return;
    }
    
    setSubmittingComment(true);
    try {
      await addDoc(collection(db, 'posts', post.id, 'comments'), {
        text: newComment,
        time: Date.now(),
        uid: auth.currentUser.uid,
        userName: auth.currentUser.email?.split('@')[0] || "User",
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
             <button 
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
                   {new Date(c.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

  const mandals = district ? TELANGANA_DATA[district] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    try {
      if (!isSignup) {
        await signInWithEmailAndPassword(auth, email, password);
        addToast("Welcome back!");
        onClose();
      } else {
        if (!username || !email || !password || !name || !surname || !mobile || !district || !mandal) {
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
          mobile,
          email,
          time: Date.now()
        });

        addToast("Account created successfully!");
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
        className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-primary p-6 text-white text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white"><X size={24} /></button>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
             <Bot size={28} className="text-accent" style={{ color: '#fbbf24' }} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">E-VEDHIKA</h2>
          <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mt-1">
             {isSignup ? 'Create User Login' : 'Access Your Portal'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="mb-6">
             <h3 className="text-xl font-black text-primary tracking-tight">{isSignup ? 'New Account Registration' : 'Welcome Back'}</h3>
             <p className="text-sm font-bold text-slate-400 mt-1">
               {isSignup ? 'Fill in your details to get started.' : 'Sign in with your credentials.'}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">Surname *</label>
                    <input value={surname} onChange={e => setSurname(e.target.value)} placeholder="Surname" required className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 p-3 rounded-xl outline-none font-bold text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 p-3 rounded-xl outline-none font-bold text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">Username / Display Name *</label>
                  <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Display name" required className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 p-3 rounded-xl outline-none font-bold text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">Gender</label>
                    <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 p-3 rounded-xl outline-none font-bold text-sm">
                       <option value="">Select Gender</option>
                       <option>Male</option>
                       <option>Female</option>
                       <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">Mobile No *</label>
                    <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Phone" required className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 p-3 rounded-xl outline-none font-bold text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">State</label>
                    <select value={state} onChange={e => setState(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 p-3 rounded-xl outline-none font-bold text-sm">
                       <option>Telangana</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">District *</label>
                    <select value={district} onChange={e => { setDistrict(e.target.value); setMandal(''); }} required className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 p-3 rounded-xl outline-none font-bold text-sm">
                       <option value="">Select District</option>
                       {Object.keys(TELANGANA_DATA).sort().map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">Mandal *</label>
                    <select value={mandal} onChange={e => setMandal(e.target.value)} required className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 p-3 rounded-xl outline-none font-bold text-sm" disabled={!district}>
                       <option value="">Select Mandal</option>
                       {mandals.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">Village / GP</label>
                    <input value={village} onChange={e => setVillage(e.target.value)} placeholder="Enter Village" className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 p-3 rounded-xl outline-none font-bold text-sm" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">Email Address *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="email@example.com" required className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 p-3 rounded-xl outline-none font-bold text-sm" />
            </div>

            <div className={isSignup ? "grid grid-cols-2 gap-4" : ""}>
               <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">Password *</label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" required className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 p-3 rounded-xl outline-none font-bold text-sm" />
              </div>
              {isSignup && (
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">Confirm Password</label>
                  <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••" required className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 p-3 rounded-xl outline-none font-bold text-sm" />
                </div>
              )}
            </div>

            <button 
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : (isSignup ? 'Create Account' : 'Sign In Now')}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
             <div className="flex-1 h-px bg-slate-100"></div>
             <span className="text-[10px] font-black text-slate-300 uppercase">OR</span>
             <div className="flex-1 h-px bg-slate-100"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full border-2 border-slate-100 py-3.5 rounded-xl font-black text-primary text-xs uppercase flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div className="mt-8 text-center pb-4">
             <button 
               onClick={() => setIsSignup(!isSignup)}
               className="text-primary font-black text-xs uppercase underline underline-offset-4 hover:text-accent transition-colors"
             >
               {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

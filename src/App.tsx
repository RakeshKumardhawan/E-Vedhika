/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Bell, Menu, X, Home, Megaphone, FileText, Wheat, Vote, 
  Wallet, Building, MessageCircle, Handshake, Lightbulb, 
  AlertTriangle, Send, LogOut, ChevronDown, ChevronUp, Search,
  Eye, Heart, Share2, PlusCircle, Camera, User, Edit2, Save,
  Activity, Book, GraduationCap, BarChart3, Database, Download, Bot, Sparkles, MessageSquare,
  Trash2, Edit3, Settings, TrendingUp, Upload, Play, RefreshCw, Layers, Calendar, LayoutDashboard, ShieldAlert, Lock,
  Users, AlertOctagon, CheckCircle2, ClipboardList, Zap, Clock, ArrowLeft, Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { 
  onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut, signInAnonymously,
  GoogleAuthProvider, signInWithPopup
} from 'firebase/auth';
import { 
  collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDocs,
  increment, arrayUnion, query, orderBy, limit, setDoc, getDoc, where,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from "./firebase";

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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (errInfo.error.toLowerCase().includes('permission')) {
    // We use setTimeout to throw so it doesn't interrupt the current SDK call stack,
    // avoiding "INTERNAL ASSERTION FAILED: Unexpected state" but still triggering
    // the system's diagnostic alerts.
    setTimeout(() => {
      throw new Error(JSON.stringify(errInfo));
    }, 100);
  }
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
  photoURL?: string;
  village?: string;
  office?: string;
  bio?: string;
  role?: string;
  email?: string;
  time: number;
}

interface Suggestion {
  id: string;
  name: string;
  text: string;
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
  padding: 12px 15px;
  margin-bottom: 8px;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const postIdFromUrl = searchParams.get('postId');

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'user'>('user');
  const isAdmin = userRole === 'admin';
  const isEditor = userRole === 'admin' || userRole === 'editor';
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [adminLocked, setAdminLocked] = useState(true);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [currentAdminPin, setCurrentAdminPin] = useState('1234');
  
  // Body scroll lock for sidebar
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 900) {
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

  // Auth and Data Listeners
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setUserProfile(null);
        setUserRole('user');
      }
    });

    // Public Listeners
    const unsubUpdates = onSnapshot(collection(db, 'updates'), (snap) => {
      const uArr: Update[] = [];
      snap.forEach(d => uArr.push({ id: d.id, ...(d.data() as any) } as Update));
      setUpdates(uArr);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'updates'));

    const unsubSuggestions = onSnapshot(query(collection(db, 'suggestions'), orderBy('time', 'desc')), (snap) => {
      const sArr: Suggestion[] = [];
      snap.forEach(d => sArr.push({ id: d.id, ...(d.data() as any) } as Suggestion));
      setSuggestions(sArr);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'suggestions'));

    const unsubPosts = onSnapshot(query(collection(db, 'posts')), (snap) => {
      const pArr: Post[] = [];
      snap.forEach((d) => {
          const data = d.data() as any;
          if (data.status !== 'Deleted' || isEditor) {
              pArr.push({ id: d.id, ...data } as Post);
          }
      });
      setPosts(pArr.sort((a, b) => (b.time || 0) - (a.time || 0)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'posts'));

    return () => {
      unsubAuth();
      unsubUpdates();
      unsubSuggestions();
      unsubPosts();
    };
  }, [isEditor]);

  // Authenticated-Only Listeners
  useEffect(() => {
    if (!user) return;

    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setUserProfile({ id: snap.id, ...snap.data() } as UserProfile);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

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

    const unsubChat = onSnapshot(query(collection(db, 'chat')), (snap) => {
      const cArr: ChatMessage[] = [];
      snap.forEach((d) => cArr.push({ id: d.id, ...(d.data() as any) } as ChatMessage));
      cArr.sort((a, b) => (a.time || 0) - (b.time || 0));
      setChatMessages(cArr.slice(-50));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'chat'));

    const problemsQuery = isEditor
      ? query(collection(db, 'problems'), orderBy('time', 'desc'))
      : query(collection(db, 'problems'), where('uid', '==', user.uid));

    const unsubProblems = onSnapshot(problemsQuery, (snap) => {
      const pArr: ProblemReport[] = [];
      snap.forEach(d => pArr.push({ id: d.id, ...(d.data() as any) } as ProblemReport));
      setProblemsGlobal(pArr);
    }, (err) => {
      console.warn("Problems listener issue:", err.message);
    });

    // Requests visibility: Admins see all, users see their own
    const requestsQuery = isEditor 
      ? query(collection(db, 'requests'), orderBy('time', 'desc'))
      : query(collection(db, 'requests'), where('uid', '==', user.uid));

    const unsubRequests = onSnapshot(requestsQuery, (snap) => {
      const rArr: RequestData[] = [];
      snap.forEach(d => rArr.push({ id: d.id, ...(d.data() as any) } as RequestData));
      setRequests(rArr);
    }, (err) => {
      // Graceful error for restricted collections
      console.warn("Requests listener issue:", err.message);
    });

    const unsub1 = onSnapshot(query(collection(db, 'notifications'), where('uid', '==', user.uid), orderBy('time', 'desc'), limit(50)), (snap) => {
      const nArr: Notification[] = [];
      snap.forEach(d => nArr.push({ id: d.id, ...(d.data() as any) } as Notification));
      setNotifications(prev => {
        const merged = [...prev.filter(n => n.uid === 'all'), ...nArr].sort((a, b) => b.time - a.time).slice(0, 50);
        setUnreadCount(merged.filter(n => !n.read).length);
        return merged;
      });
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

    const unsub2 = onSnapshot(query(collection(db, 'notifications'), where('uid', '==', 'all'), orderBy('time', 'desc'), limit(50)), (snap) => {
      const nArr: Notification[] = [];
      snap.forEach(d => nArr.push({ id: d.id, ...(d.data() as any) } as Notification));
      setNotifications(prev => {
        const merged = [...prev.filter(n => n.uid !== 'all'), ...nArr].sort((a, b) => b.time - a.time).slice(0, 50);
        setUnreadCount(merged.filter(n => !n.read).length);
        return merged;
      });
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

    return () => {
      unsubProfile();
      unsubAdminCheck();
      unsubChat();
      unsubProblems();
      unsubRequests();
      unsub1();
      unsub2();
    };
  }, [user, isEditor]);

  const addToast = (msg: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as any;
    const email = target.email.value;
    const pass = target.password.value;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      addToast("Welcome back!");
    } catch (err: any) {
      try {
        await createUserWithEmailAndPassword(auth, email, pass);
        addToast("Account created!");
      } catch (innerErr: any) {
        addToast("Login Failed: " + (innerErr.message || "Unknown error"));
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await setDoc(doc(db, 'users', result.user.uid), { 
        username: result.user.displayName || result.user.email?.split('@')[0],
        time: Date.now()
      }, { merge: true });
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
      confirmButtonText: 'Sign In with Email',
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
             addToast("Welcome back!");
           } catch (err: any) {
             try {
               await createUserWithEmailAndPassword(auth, result.value.email, result.value.password);
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
    const q = searchQuery.toLowerCase().trim();
    const tMatch = (p.title || "").toLowerCase().includes(q);
    const cMatch = (p.content || "").toLowerCase().includes(q);
    const searchOk = !q || tMatch || cMatch;
    if (currentFilter === 'All') return searchOk;
    return searchOk && (p.category === currentFilter || p.subCategory === currentFilter);
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-[#f8fafc] to-slate-100 text-slate-800 flex flex-col font-sans selection:bg-accent/20 selection:text-primary scroll-smooth antialiased">
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

      <header className="sticky top-0 z-[1001]" style={{ background: 'var(--primary)', height: 'var(--header-h)', borderBottom: '3px solid var(--accent)', display: 'flex', alignItems: 'center', padding: '0 4%' }}>
        <div className="brand-wrapper cursor-pointer" onClick={() => setCurrentTab('home')}>
          {/* Logo Section */}
          <div className="logo-container" id="evLogo">
            <svg viewBox="0 0 64 64" width="40" height="40">
              <g className="logo-ring" id="mainLogoRing">
                <circle cx="32" cy="32" r="29" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="5 8"/>
              </g>
              <circle cx="32" cy="32" r="24" fill="#0d3b66"/>
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700" fontFamily="Segoe UI, sans-serif" className="ev-logo-text">EV</text>
            </svg>
          </div>
          {/* Website Name Section */}
          <div>
            <h2 className="brand-title">E-VEDHIKA</h2>
            <p className="sub-tagline">all problems one solution</p>
          </div>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-5">
          {user && !user.isAnonymous && (
             <div onClick={() => setShowProfileModal(true)} className="hidden sm:flex items-center gap-3 bg-gradient-to-r from-[#174b7c] to-transparent pl-1.5 pr-5 py-1.5 rounded-[16px] border border-accent/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(250,204,21,0.25)] hover:border-accent/60 transition-all duration-300 relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/10 to-accent/0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-[#d97706] flex items-center justify-center text-primary font-black text-lg shadow-inner border-[2px] border-white/20 relative z-10 shadow-[0_0_10px_rgba(250,204,21,0.5)] overflow-hidden">
                   {user?.photoURL ? (
                     <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     <User size={18} className="text-primary" />
                   )}
                </div>
                <div className="flex flex-col justify-center relative z-10">
                  <span className="text-white text-[12px] font-black tracking-wide leading-tight drop-shadow-sm">{userProfile?.username || "Panchayat Member"}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981] animate-pulse"></span>
                    <span className="text-accent text-[9px] font-bold uppercase tracking-[0.15em] drop-shadow-sm">{isAdmin ? 'System Admin' : isEditor ? 'Editor' : 'Active User'}</span>
                  </div>
                </div>
             </div>
          )}
        </div>
      </header>

      <div className="latest-bar overflow-hidden">
        <div className="latest-label">HOT UPDATES</div>
        <div className="latest-text flex-1">
          <span>
            {updates.length > 0 
              ? updates.map(u => u.text || (u as any).msg || (u as any).update).join('  •  ') 
              : 'Empowering local governance through digital innovation... Telangana PR Portal is now live for all panchayats...'}
          </span>
        </div>
      </div>

      <nav className="nav-trigger-bar sticky top-0 z-[1000]">
        <div className="trigger-left">
          <button className="menu-toggle lg:hidden shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <div 
            className="notif-bell"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notif-badge" style={{ display: 'flex' }}>
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
           {searchQuery === '' && <Search size={18} className="text-slate-400" />}
           {(!user || user.isAnonymous) && (
             <button onClick={triggerLogin} className="bg-primary text-white px-4 py-1.5 rounded-lg text-[11px] font-black uppercase shadow-sm">Login / Create account</button>
           )}
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
            className="fixed inset-0 bg-black/40 z-[1050] md:hidden"
          />
        )}
      </AnimatePresence>

      <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <aside className={`sidebar ${sidebarOpen ? 'z-[1100]' : ''}`}>
          <div className="sidebar-inner relative">
            {sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(false)}
                className="md:hidden absolute top-0 right-0 p-2 text-slate-400 hover:text-primary transition-colors"
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
            
            <div className="pt-6">
              <MenuButton label="Public suggestions & Feedback" emoji="💡" active={currentTab === 'suggestions'} onClick={() => {setCurrentTab('suggestions'); setSidebarOpen(false);}} />
              {isEditor && (
                <div className="pt-6">
                  <MenuButton label={isAdmin ? "Admin Panel" : "Editor Config"} emoji="🛡️" active={currentTab === 'admin'} onClick={() => {setCurrentTab('admin'); setSidebarOpen(false);}} />
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="content-area min-w-0">
          {postIdFromUrl ? (
            <PostDetail 
               postId={postIdFromUrl} 
               onBack={() => {
                 searchParams.delete('postId');
                 setSearchParams(searchParams);
               }} 
               isAdmin={isAdmin}
               addToast={addToast}
            />
          ) : (
            <AnimatePresence mode="wait">
              {currentTab === 'home' && (
                <motion.div key="home" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="section-card card-blue !p-6">
                      <span className="text-[11px] font-black text-slate-400 uppercase">Live Updates</span>
                      <h2 className="text-3xl font-black text-primary mt-2">{posts.length}</h2>
                    </div>
                    <div className="section-card !border-t-danger !p-6 cursor-pointer hover:bg-red-50 transition-colors" onClick={() => setCurrentTab('problems')}>
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
                            <button onClick={triggerLogin} className="w-full bg-accent text-primary py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-white transition-all shadow-md">Login / Create account</button>
                            <button onClick={handleGoogleLogin} className="w-full bg-[#ea4335] text-white py-2 rounded-xl font-black text-[10px] uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2">
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white"/><path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="white"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="white"/></svg>
                               Google Login
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                       <div>
                         <h3 className="text-xl font-black text-primary">📝 Portal Updates</h3>
                         <p className="text-xs font-bold text-slate-400 mt-1">Publish news, reports or notices for the community</p>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => setSearchQuery('')} className={`p-2 rounded-lg ${searchQuery === '' ? 'bg-slate-100 text-primary' : 'text-slate-300'}`}><Layers size={18}/></button>
                          <Search size={18} className="text-slate-300 mt-2" />
                       </div>
                    </div>

                    {user && !user.isAnonymous && (
                      <button 
                        onClick={() => { setEditingPost(null); setShowPostForm(true); }}
                        className="w-full bg-slate-50 border-2 border-dashed border-slate-200 p-10 rounded-[28px] text-slate-400 font-bold hover:bg-slate-100 hover:border-primary/20 transition-all flex flex-col items-center gap-3"
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
                           <PostForm addToast={addToast} onCancel={() => { setShowPostForm(false); setEditingPost(null); }} currentUserProfile={userProfile} editingPost={editingPost} />
                        </div>
                      </div>
                    )}

                    {showProfileModal && (
                      <EditProfileModal onClose={() => setShowProfileModal(false)} user={user} userProfile={userProfile} addToast={addToast} />
                    )}

                    {showSuggestionForm && (
                      <div className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-[24px] shadow-2xl custom-scrollbar relative">
                           <SuggestionForm addToast={addToast} onCancel={() => setShowSuggestionForm(false)} />
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
                            onEdit={(p) => { setEditingPost(p); setShowPostForm(false); }} 
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

            {currentTab === 'workspace' && (
              <motion.div key="workspace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <DigitalWorkspaceSection addToast={addToast} />
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
                          <a href={s.link} target="_blank" rel="noreferrer" className="scheme-link-btn hover:opacity-90 transition-opacity">Visit Official Website</a>
                        </div>
                      ))}
                    </div>
                 </div>
              </motion.div>
            )}

            {currentTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ChatSection messages={chatMessages} user={user} addToast={addToast} />
              </motion.div>
            )}

            {currentTab === 'union' && (
              <motion.div key="union" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="section-card card-blue">
                  <h2 className="text-2xl font-black text-primary mb-6">🤝 Union Updates & Notices</h2>
                  <div className="space-y-4">
                     {filteredPosts.filter(p => p.category === 'Updates').length > 0 ? (
                       filteredPosts.filter(p => p.category === 'Updates').map(upd => (
                         <div key={upd.id} className="p-5 bg-slate-50 rounded-2xl border-l-4 border-success">
                            <h4 className="font-black text-primary">{upd.title}</h4>
                            <p className="text-sm font-medium text-slate-600 mt-2">{upd.content}</p>
                         </div>
                       ))
                     ) : (
                       <p className="text-center text-slate-400 font-bold py-10">No specific union notices available.</p>
                     )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentTab === 'suggestions' && (
              <motion.div key="suggestions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="section-card card-gold">
                  <h2 className="text-2xl font-black text-primary mb-6">💡 Community Voice</h2>
                  <div className="bg-slate-50 rounded-2xl p-4 max-h-[400px] overflow-y-auto mb-6 custom-scrollbar">
                    {suggestions.length > 0 ? (
                      suggestions.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-[#a855f7] mb-3 last:mb-0">
                          <span className="text-[10px] font-black text-[#a855f7] uppercase mb-1 block">👤 {s.name || 'Anonymous Platform User'}</span>
                          <p className="text-sm font-medium text-slate-700">{s.text || (s as any).suggestion || (s as any).msg}</p>
                        </div>
                      ))
                    ) : <p className="text-center font-bold text-slate-400 py-10">No public suggestions shared yet.</p>}
                  </div>
                  <button onClick={() => { setShowSuggestionForm(true); }} className="w-full bg-[#a855f7] text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90 transition-all active:scale-95">
                    📝 Submit New Suggestion
                  </button>
                </div>
              </motion.div>
            )}

            {currentTab === 'problems' && (
              <motion.div key="problems" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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

            {currentTab === 'admin' && isEditor && (
              <motion.div key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {adminLocked ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Lock size={48} className="text-accent mb-4 animate-bounce" />
                    <h2 className="text-xl font-black text-primary mb-6">ADMIN CONSOLE LOCKED</h2>
                    <input 
                      type="password" 
                      placeholder="ENTER PIN"
                      className="pin-input w-48 text-center"
                      maxLength={4}
                      value={adminPinInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAdminPinInput(v);
                        if (v === currentAdminPin) { 
                          setAdminLocked(false);
                          addToast("Access Granted");
                        }
                      }}
                    />
                  </div>
                ) : (
                  <AdminPanel 
                    addToast={addToast} 
                    problems={problemsGlobal} 
                    suggestions={suggestions} 
                    users={[]} 
                    setAdminLocked={setAdminLocked} 
                    adminLocked={adminLocked} 
                    notifications={notifications} 
                    requests={requests} 
                    updates={updates}
                    userRole={userRole}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}

function EditProfileModal({ onClose, user, userProfile, addToast }: { onClose: () => void, user: any, userProfile: UserProfile | null, addToast: (s:string) => void }) {
  const [username, setUsername] = useState(userProfile?.username || user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || user?.photoURL || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        username,
        photoURL,
        time: userProfile ? undefined : Date.now()
      }, { merge: true });
      addToast("Profile updated successfully!");
      onClose();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      addToast("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button>
        <h2 className="text-2xl font-black text-primary mb-6">Edit Profile</h2>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center">
              {photoURL ? <img src={photoURL} alt="Preview" className="w-full h-full object-cover" /> : <User size={40} className="text-slate-300" />}
            </div>
          </div>
          
          <div>
            <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} required className="w-full border p-3 rounded-xl focus:border-primary outline-none" placeholder="Enter username" />
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Photo URL (Optional)</label>
            <input value={photoURL} onChange={e => setPhotoURL(e.target.value)} className="w-full border p-3 rounded-xl focus:border-primary outline-none" placeholder="https://example.com/photo.jpg" />
            <p className="text-[10px] text-slate-400 mt-1">Paste a URL of an image to use as your avatar.</p>
          </div>
          
          <button type="submit" disabled={saving} className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase mt-4 hover:bg-opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminPanel({ addToast, problems, suggestions, users, setAdminLocked, adminLocked, notifications, requests, updates, userRole }: { addToast: (s: string) => void, problems: ProblemReport[], suggestions: Suggestion[], users: UserProfile[], setAdminLocked: (b: boolean) => void, adminLocked: boolean, notifications: Notification[], requests: RequestData[], updates: Update[], userRole: 'admin' | 'editor' | 'user' }) {
  const isAdmin = userRole === 'admin';
  const isEditor = userRole === 'admin' || userRole === 'editor';
  const [activeSubTab, setActiveSubTab] = useState('dash');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allProblems, setAllProblems] = useState<ProblemReport[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState(false);

  useEffect(() => {
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

    const unsubLogs = onSnapshot(query(collection(db, 'security_logs'), orderBy('time', 'desc'), limit(20)), (snap) => {
      const lList: any[] = [];
      snap.forEach(d => lList.push({ id: d.id, ...d.data() }));
      setLogs(lList);
      setLogsError(false);
    }, (err) => {
      setLogsError(true);
      handleFirestoreError(err, OperationType.LIST, 'security_logs');
    });

    return () => {
      unsubUsers();
      unsubProblems();
      unsubLogs();
    };
  }, []);

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

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-primary">Control Center ⚙️</h2>
        <button onClick={() => setAdminLocked(true)} className="bg-slate-100 p-2 rounded-xl"><Lock size={18} /></button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
        {['dash', 'users', 'reports', 'suggestions', 'updates', 'trash', 'logs', 'alerts', 'settings']
          .filter(t => isAdmin || ['dash', 'reports', 'suggestions', 'updates', 'alerts'].includes(t))
          .map(t => (
          <button 
            key={t} 
            onClick={() => setActiveSubTab(t)} 
            className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap ${
              activeSubTab === t 
                ? 'bg-primary text-white shadow-[0_4px_12px_rgba(13,59,102,0.3)]' 
                : 'bg-white text-slate-500 border border-slate-200 hover:border-primary/30 hover:text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeSubTab === 'dash' && (
        <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      >
         <StatCard label="Total Users" val={allUsers.length} color="blue" />
         <StatCard label="Active Issues" val={allProblems.filter(p => p.status === 'pending').length} color="amber" />
         <StatCard label="Resolved" val={allProblems.filter(p => p.status === 'solved').length} color="green" />
         <StatCard label="Suggestions" val={suggestions.length} color="purple" />
         <StatCard label="Hot Updates" val={updates.length} color="red" />
      </motion.div>
          
          <div className="w-full h-[300px] min-h-[300px] bg-white p-4 rounded-2xl shadow-sm border">
             <h3 className="text-xs font-black text-slate-400 uppercase mb-4">Issues Trend</h3>
             <ResponsiveContainer width="100%" height="80%" debounce={1}>
                <BarChart data={[
                  { name: 'Pending', count: allProblems.filter(p => p.status === 'pending').length },
                  { name: 'Solved', count: allProblems.filter(p => p.status === 'solved').length }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="count" fill="#0d3b66" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {permissionError ? (
            <div className="p-10 text-center text-slate-400 font-bold">{permissionError}</div>
          ) : (
            allUsers.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-primary">{u.username}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      u.role === 'admin' ? 'bg-red-100 text-red-600' : 
                      u.role === 'stateunion' ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {u.role || 'user'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{u.email || 'No email'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Village: {u.village || 'N/A'} | Office: {u.office || 'N/A'}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <select 
                    value={u.role || 'user'}
                    onChange={async (e) => {
                      try {
                        await updateDoc(doc(db, 'users', u.id), { role: e.target.value });
                        addToast("Role Updated");
                      } catch (err) { handleFirestoreError(err, OperationType.WRITE, `users/${u.id}`); }
                    }}
                    className="bg-slate-50 border text-[10px] font-bold rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    <option value="user">USER</option>
                    <option value="stateunion">STATE UNION</option>
                    <option value="editor">EDITOR</option>
                    <option value="admin">ADMIN</option>
                    <option value="suspended">SUSPENDED</option>
                  </select>
                  <button 
                    onClick={() => deleteUser(u.id)}
                    className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === 'updates' && (
        <div className="space-y-4">
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const f = e.target as any;
              const text = f.text.value;
              if(!text) return;
              try {
                await addDoc(collection(db, 'updates'), { text, time: Date.now() });
                f.reset();
                addToast("Update Published");
              } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'updates'); }
            }}
            className="bg-white p-4 rounded-2xl shadow-sm border space-y-3"
          >
            <h3 className="text-xs font-black text-slate-400 uppercase">Publish Flash Update</h3>
            <div className="flex gap-2">
              <input name="text" placeholder="Type hot update news..." className="flex-1 rounded-xl border p-3 text-sm" />
              <button className="bg-primary text-white px-6 rounded-xl font-black text-sm">POST</button>
            </div>
          </form>

          <div className="space-y-2">
            {updates.map(u => (
              <div key={u.id} className="bg-white p-3 rounded-xl border flex justify-between items-center group">
                <p className="text-xs font-medium text-slate-700">{u.text}</p>
                <button 
                  onClick={async () => {
                    await deleteDoc(doc(db, 'updates', u.id));
                    addToast("Deleted");
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-500 p-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'trash' && (
        <div className="space-y-4 text-center py-10">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Trash2 size={32} />
          </div>
          <p className="text-slate-400 text-sm font-medium">Recycle Bin is currently empty.</p>
        </div>
      )}

      {activeSubTab === 'suggestions' && (
        <div className="space-y-4">
          {suggestions.length === 0 && <div className="p-10 text-center text-slate-400 font-bold">No suggestions found</div>}
          {suggestions.map(s => (
            <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-primary uppercase">{s.name}</span>
                  <span className="text-[9px] text-slate-400 font-bold">• {s.time ? new Date(s.time).toLocaleDateString() : 'N/A'}</span>
                </div>
                <p className="text-sm font-medium text-slate-700">{s.text || (s as any).suggestion}</p>
                <div className="mt-2 flex gap-2">
                   <span className="text-[9px] bg-white border px-2 py-0.5 rounded-full font-bold text-slate-500">{ (s as any).village || 'No Village' }</span>
                   <span className="text-[9px] bg-white border px-2 py-0.5 rounded-full font-bold text-slate-500">{ (s as any).mobile || 'No Mobile' }</span>
                </div>
              </div>
              <button 
                onClick={async () => {
                  if(!window.confirm("Delete suggestion?")) return;
                  try {
                    await deleteDoc(doc(db, 'suggestions', s.id));
                    addToast("Suggestion Deleted");
                  } catch(err) { handleFirestoreError(err, OperationType.DELETE, `suggestions/${s.id}`); }
                }}
                className="text-red-400 p-2 hover:bg-red-50 rounded-full transition-colors"
                title="Delete Suggestion"
              >
                 <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <h4 className="font-black text-primary">Maintenance Mode</h4>
                <p className="text-xs text-slate-400">Lock the site for everyone except admins</p>
              </div>
              <button className="bg-slate-200 w-12 h-6 rounded-full relative">
                 <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></span>
              </button>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase">Admin Access PIN</label>
               <input type="password" placeholder="••••" className="w-full rounded-xl border p-3 text-center text-xl font-black tracking-widest" defaultValue="1234" maxLength={4} />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase">Contact Information</label>
               <input placeholder="support@evedhika.org" className="w-full rounded-xl border p-3 text-sm" />
            </div>

            <button className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg">SAVE CONFIGURATION</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button className="bg-green-600 text-white p-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-green-700">
               <Download size={16} /> DOWNLOAD BACKUP
             </button>
             <button className="bg-amber-600 text-white p-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-amber-700">
               <Upload size={16} /> RESTORE BACKUP
             </button>
          </div>
        </div>
      )}

      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          {allProblems.length === 0 && <div className="p-10 text-center text-slate-400 font-bold">No reports found</div>}
          {allProblems.map(p => (
            <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border flex justify-between items-start">
              <div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${p.status === 'solved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
                <p className="mt-2 font-medium">{p.msg}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(p.time).toLocaleString()}</p>
              </div>
              {p.status === 'pending' && <button onClick={() => resolveProblem(p)} className="bg-primary text-white text-[10px] px-3 py-1.5 rounded-lg font-bold">SOLVE</button>}
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'logs' && (
         <div className="space-y-2">
            {logsError ? (
               <div className="p-10 text-center text-slate-400 font-bold">Access restricted to Security Logs</div>
            ) : (
               <>
                 {logs.length === 0 && <div className="p-10 text-center text-slate-400 font-bold">No logs available</div>}
                 {logs.map(log => (
                   <div key={log.id} className="p-2 text-[11px] border-b flex justify-between">
                     <span>{log.action || log.msg || 'Action logged'}</span>
                     <span className="text-slate-400">{new Date(log.time).toLocaleTimeString()}</span>
                   </div>
                 ))}
               </>
            )}
         </div>
      )}

      {activeSubTab === 'alerts' && (
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            const f = e.target as any;
            const uid = f.uid.value;
            const title = f.title.value;
            const message = f.message.value;
            if(!uid || !title || !message) return addToast("Fill all fields");
            try {
              await addDoc(collection(db, 'notifications'), {
                uid, title, message, read: false, time: Date.now(), type: 'manual'
              });
              addToast("Notification Sent!");
              f.reset();
            } catch(err: any) { 
              handleFirestoreError(err, OperationType.WRITE, 'notifications');
              addToast("Error sending notification"); 
            }
          }}
          className="space-y-4"
        >
          <h3 className="font-black text-primary">Send Manual Notification</h3>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400">TARGET UID (User ID or 'all')</label>
            <input name="uid" placeholder="User ID / all" className="w-full rounded-xl border p-3 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400">TITLE</label>
            <input name="title" placeholder="Announcement Title" className="w-full rounded-xl border p-3 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400">MESSAGE</label>
            <textarea name="message" placeholder="Type notification message here..." className="w-full rounded-xl border p-3 text-sm h-32" />
          </div>
          <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg">BROADCAST ALERT</button>
        </form>
      )}
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

function DigitalWorkspaceSection({ addToast }: { addToast: (s:string) => void }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <div className="section-card card-blue">
      <h2 className="text-xl font-black mb-2 flex items-center gap-3">🏛️ Mana Panchayath</h2>
      <p className="text-xs text-slate-500 mb-6">Technical Workspace for PR Officers</p>
      
      <div className="mana-grid">
        <ToolCard emoji="📈" title="DSR Analyzer" onClick={() => setActiveTool('dsr')} />
        <ToolCard emoji="🗓️" title="Multi-Day Attendance" onClick={() => setActiveTool('multi')} />
        <ToolCard emoji="🎓" title="Digital Training" onClick={() => setActiveTool('training')} />
        <ToolCard emoji="📂" title="Forms Hub" onClick={() => setActiveTool('forms')} />
      </div>

      <div className="mt-8 pt-8 border-t">
        {activeTool === 'dsr' && <DSRAnalyzer addToast={addToast} />}
        {activeTool === 'training' && <TrainingCenter />}
        {activeTool === 'multi' && <MultiDayAnalyzer addToast={addToast} />}
        {!activeTool && <div className="p-10 text-center text-slate-400 italic">Select a tool to begin...</div>}
      </div>
    </div>
  );
}

function MultiDayAnalyzer({ addToast }: { addToast: (s:string) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold">Multi-Day Growth Analyzer</h3>
      <div className="p-6 border-2 border-dashed rounded-2xl text-center bg-slate-50">
        <p className="text-sm text-slate-500">Upload folder or multiple files to generate attendance Heatmap</p>
        <button onClick={() => addToast("Pro Feature: Multi-file scanning requires bulk permissions.")} className="mt-4 bg-primary text-white px-6 py-2 rounded-xl font-bold">Open Bulk Selector</button>
      </div>
    </div>
  );
}

function TrainingCenter() {
  return (
    <div className="space-y-4">
      <SmartAssistant 
        title="Digital Training AI Bot"
        placeholder="How do I upload a DSR?"
        icon={GraduationCap}
        systemInstruction="You are a training assistant for Panchayat Raj. Help users with DSR, EPFO, and Aadhar data entry workflows."
      />
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

function DSRAnalyzer({ addToast }: { addToast: (s:string) => void }) {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, dsr: 0 });

  const onUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const ab = evt.target?.result;
      const wb = XLSX.read(ab, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      const rows: any[] = [];
      let present = 0, dsr = 0;
      json.slice(2).forEach((r: any) => {
        if (!r[1]) return;
        const isPresent = String(r[3] || "").toLowerCase().includes('present');
        const isEntered = String(r[5] || "").toLowerCase().includes('entered');
        if (isPresent) present++;
        if (isEntered) dsr++;
        rows.push({
          id: r[0], gp: r[2], mandal: r[1],
          att: isPresent ? "P" : "A",
          dsr: isEntered ? "✅" : "❌"
        });
      });
      setData(rows);
      setStats({ total: rows.length, present, dsr });
      addToast("DSR File Processed! 🚀");
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-50 border-2 border-dashed rounded-3xl text-center">
        <Upload className="mx-auto mb-4 text-slate-400" size={40} />
        <p className="text-sm font-bold text-slate-600 mb-4">Drop Daily DSR Excel here</p>
        <input type="file" onChange={onUpload} className="hidden" id="dsrUp" />
        <label htmlFor="dsrUp" className="bg-primary text-white px-8 py-3 rounded-2xl font-black cursor-pointer shadow-md inline-block">CHOOSE FILE</label>
      </div>

      {data.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total" val={stats.total} color="blue" />
            <StatCard label="Present" val={stats.present} color="green" />
            <StatCard label="Entries" val={stats.dsr} color="amber" />
          </div>

          <div className="table-responsive bg-white rounded-2xl border shadow-sm">
            <table className="text-[12px]">
              <thead className="bg-slate-50">
                <tr><th>Mandal</th><th>Gram Panchayat</th><th>Att</th><th>DSR</th></tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td>{row.mandal}</td>
                    <td className="font-bold text-primary">{row.gp}</td>
                    <td className={row.att === 'P' ? 'text-success font-black' : 'text-danger font-black'}>{row.att}</td>
                    <td className="text-lg">{row.dsr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      });
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
      <div className="post-meta">
        <div>
          <span className="cat-tag">{post.category || 'Update'}</span>
          {post.subCategory && <span className="cat-tag sub-cat-tag">{post.subCategory}</span>}
        </div>
        <div className="flex gap-3 items-center">
          {isOwner && (
             <>
               <button onClick={() => onEdit(post)} className="text-slate-400 hover:text-primary transition-colors text-lg" title="Edit">✏️</button>
               <button onClick={async () => {
                 const res = await Swal.fire({ title: 'Delete?', text: 'Move to recycle bin?', icon: 'warning', showCancelButton: true });
                 if (res.isConfirmed) {
                   await updateDoc(doc(db, 'posts', post.id), { status: 'Deleted' });
                   addToast("Deleted successfully");
                 }
               }} className="text-slate-400 hover:text-danger transition-colors text-lg" title="Delete">🗑️</button>
             </>
          )}
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{new Date(postTime).toLocaleDateString()}</span>
        </div>
      </div>
      
      <h4 className="post-title">{post.title || 'Platform Update'}</h4>
      
      <div className={`post-body mb-4 ${isExpanded ? '' : 'line-clamp-4'}`}>
        <ReactMarkdown>{post.content || (post as any).message || (post as any).text || (post as any).desc || ''}</ReactMarkdown>
      </div>

      {post.content && post.content.length > 200 && (
        <button onClick={toggleExpansion} className="text-xs font-black text-primary uppercase underline underline-offset-4 mb-6 block">
          {isExpanded ? 'View Less' : 'View Full Text'}
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

      <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
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
           <span className="text-lg group-hover:scale-125 transition-transform">{post.likedBy?.includes(auth.currentUser?.uid || "") ? '❤️' : '🤍'}</span>
           <span className="text-sm font-black text-slate-500 group-hover:text-primary">{post.likes || 0}</span>
         </button>

         <div className="flex items-center gap-2">
            <span className="text-lg">👁️</span>
            <span className="text-[11px] font-bold text-slate-400">{post.views || 0}</span>
         </div>
         
         <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 group text-slate-500 hover:text-primary">
            <MessageCircle size={18} />
            <span className="text-sm font-black">{post.commentCount || 0}</span>
         </button>

         <button 
           onClick={() => {
             const url = `${window.location.origin}${window.location.pathname}?postId=${post.id}`;
             navigator.clipboard.writeText(url);
             addToast("Link copied!");
           }}
           className="flex items-center gap-1 group text-primary"
         >
            <span className="text-[11px] font-black uppercase">Share 🔗</span>
         </button>
         
         <Link to={`/?postId=${post.id}`} className="bg-primary text-white font-black uppercase text-[10px] sm:text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl">Read Full Story</Link>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-100">
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

function PostForm({ addToast, onCancel, currentUserProfile, editingPost }: { addToast: (s:string) => void, onCancel: () => void, currentUserProfile: UserProfile | null, editingPost: Post | null }) {
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
      const postData = {
        title: f.title.value,
        content: f.content.value,
        category: f.category.value,
        mediaUrl: media?.url || "",
        mediaType: media?.type || "",
      };

      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), {
          ...postData,
          updatedAt: Date.now()
        });
        addToast("Update Saved!");
      } else {
        await addDoc(collection(db, 'posts'), {
          ...postData,
          likes: 0, likedBy: [], views: 0, comments: [], commentCount: 0,
          time: Date.now(),
          uid: auth.currentUser.uid,
          userName: currentUserProfile?.username || "Portal User",
          userPhoto: currentUserProfile?.photoURL || auth.currentUser.photoURL || undefined,
          status: 'Approved'
        });
        addToast("Update Published!");
      }
      onCancel();
    } catch (err: any) { 
      handleFirestoreError(err, OperationType.WRITE, 'posts');
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

function ChatSection({ messages, user, addToast }: { messages: ChatMessage[], user: any, addToast: (s:string) => void }) {
  const [msg, setMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!msg.trim()) return;
    if (!user || user.isAnonymous) return addToast("Login to chat");
    try {
      await addDoc(collection(db, 'chat'), { msg, time: Date.now(), uid: user.uid });
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
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm ${m.uid === user?.uid ? 'bg-primary text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`} style={m.uid === user?.uid ? { background: '#0d3b66' } : {}}>
                {m.msg}
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
      <SmartAssistant title="Act Assistant" icon={Book} placeholder="Ask about Section 32..." systemInstruction="You search the Telangana Panchayat Raj Act 2018. If users ask about sections, give precise answers based on the act." />
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

function SmartAssistant({ systemInstruction, placeholder, title, icon: Icon }: { systemInstruction: string, placeholder: string, title: string, icon: any }) {
  const [queryVal, setQueryVal] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!queryVal.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: queryVal }] }],
        config: { 
          systemInstruction: String(systemInstruction)
        }
      });
      setAnswer(response.text || "I couldn't find an answer. Please try again.");
    } catch (err) {
      console.error(err);
      setAnswer("Assistant unavailable. Please check API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent opacity-5 blur-3xl rounded-full -mr-16 -mt-16"></div>
      <div className="flex items-center gap-3 font-black text-accent text-lg" style={{ color: '#fbbf24' }}>
        <Icon size={24} strokeWidth={2.5} /> {title}
      </div>
      <div className="flex gap-2 relative z-10">
        <input 
          value={queryVal} 
          onChange={e => setQueryVal(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder={placeholder} 
          className="bg-slate-800 border-2 border-slate-700/50 text-white text-sm placeholder:text-slate-500 mb-0 focus:border-accent transition-colors" 
        />
        <button onClick={ask} disabled={loading} className="bg-accent text-slate-900 px-6 rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-[0_0_20px_rgba(251,191,36,0.3)]" style={{ background: '#fbbf24' }}>
          {loading ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </div>
      {answer && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] text-slate-200 leading-relaxed pt-4 border-t border-white/10">
           <ReactMarkdown>{answer}</ReactMarkdown>
        </motion.div>
      )}
    </div>
  );
}

function SuggestionForm({ addToast, onCancel }: { addToast: (s:string) => void, onCancel: () => void }) {
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [mobile, setMobile] = useState('');
  const [category, setCategory] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if(!name || !village || !mobile || !category || !suggestion) {
      addToast("దయచేసి అన్ని వివరాలు నింపండి");
      return;
    }

    if(!/^[0-9]{10}$/.test(mobile)){
      addToast("10 digit mobile number enter cheyandi");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "suggestions"), {
        name,
        village,
        mobile,
        category,
        suggestion: suggestion,
        text: suggestion,
        status: "pending",
        time: Date.now(),
        createdAt: Date.now()
      });
      setSubmitted(true);
      addToast("Successfully sumitted!");
    } catch(err) {
      handleFirestoreError(err, OperationType.WRITE, 'suggestions');
      addToast("Error submitting suggestion");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-10 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-black text-primary">✅ Submitted Successfully</h2>
        <p className="text-slate-500 font-bold">మీ సూచన నమోదు చేయబడింది</p>
        
        <div className="gap-3 flex flex-col pt-4">
           <button onClick={() => {
              setSubmitted(false);
              setName(''); setVillage(''); setMobile(''); setCategory(''); setSuggestion('');
           }} className="bg-primary text-white p-3 rounded-xl font-bold">Add More Suggestions</button>
           <button onClick={onCancel} className="bg-[#0d3b66] text-white p-3 rounded-xl font-bold">Go to Main Website</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-black text-primary">e-Vedhika Suggestion Portal</h2>
         <button onClick={onCancel} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-700">
           <X size={20} />
         </button>
      </div>
      <p className="text-sm font-bold text-slate-500 mb-6">మీ సూచనలు నమోదు చేయండి</p>
      
      <div className="space-y-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="మీ పేరు" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary/50" />
        <input value={village} onChange={e => setVillage(e.target.value)} placeholder="జిల్లా / మండలం" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary/50" />
        <input value={mobile} onChange={e => setMobile(e.target.value)} maxLength={10} placeholder="మొబైల్ నంబర్" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary/50" />
        
        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary/50">
          <option value="">విభాగం ఎంచుకోండి</option>
          <option value="Home">Home</option>
          <option value="Latest News">Latest News</option>
          <option value="Services">Services</option>
          <option value="Public Suggestions">Public Suggestions</option>
          <option value="Discussion Forum">Discussion Forum</option>
          <option value="User Login">User Login</option>
          <option value="FAQ">FAQ</option>
          <option value="Search">Search</option>
          <option value="Union Updates">Union Updates</option>
        </select>

        <textarea value={suggestion} onChange={e => setSuggestion(e.target.value)} placeholder="మీ సూచన" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary/50 min-h-[120px]" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button disabled={isSubmitting} onClick={handleSubmit} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold disabled:opacity-50">Submit</button>
        <button onClick={onCancel} className="flex-1 bg-[#0d3b66] text-white py-4 rounded-xl font-bold">Back to Website</button>
      </div>
    </div>
  );
}

function PRActHub() {
    return <KnowledgeHubSection />;
}

// --- POST DETAIL MODULE ---

function PostDetail({ postId, onBack, isAdmin, addToast }: { postId: string, onBack: () => void, isAdmin: boolean, addToast: (s:string) => void }) {
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
             <span>{post.userName || 'Portal User'}</span>
             <span className="text-[10px] font-black text-slate-400 uppercase">Author</span>
           </div>
         </div>
         
         {post.mediaUrl && (
           <div className="mt-8 rounded-[24px] overflow-hidden border-4 border-slate-50 shadow-md">
             <img src={post.mediaUrl} alt="Post media" className="w-full object-cover max-h-[500px]" />
           </div>
         )}

         <div className="prose prose-slate prose-lg md:prose-xl max-w-none pt-4 text-slate-700 leading-relaxed font-serif">
           <ReactMarkdown>{post.content}</ReactMarkdown>
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
         <PostComments post={post} addToast={addToast} />
       </div>
    </motion.div>
  );
}

function PostComments({ post, addToast }: { post: Post, addToast: (s:string) => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('time', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
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

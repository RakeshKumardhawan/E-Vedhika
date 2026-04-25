/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Menu, X, Home, Megaphone, FileText, Wheat, Vote, 
  Wallet, Building, MessageCircle, Handshake, Lightbulb, 
  AlertTriangle, Send, LogOut, ChevronDown, ChevronUp, Search,
  Eye, Heart, Share2, PlusCircle, Camera, User, Edit2, Save,
  Activity, Book, GraduationCap, BarChart3, Database, Download, Bot, Sparkles, MessageSquare,
  Trash2, Edit3, Settings, TrendingUp, Upload, Play, RefreshCw, Layers, Calendar, LayoutDashboard, ShieldAlert, Lock
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
  likedBy?: string[];
  userName?: string;
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
  village?: string;
  office?: string;
  bio?: string;
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
  --info: #0ea5e9;
  --bg-light: #f8fafc;
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  --header-height: 65px;
  --nav-bar-height: 50px;
}

.brand-title {
  font-size: 28px;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #facc15 0%, #fff 30%, #38bdf8 50%, #fff 70%, #facc15 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shineText 5s linear infinite;
}

@keyframes shineText { 
  0% { background-position: 0% center; } 
  100% { background-position: 200% center; } 
}

.latest-bar { 
  background: #fff; 
  padding: 8px 4%; 
  display: flex; 
  align-items: center; 
  border-bottom: 1px solid #e2e8f0;
}

.latest-text span { 
  display: inline-block; 
  white-space: nowrap; 
  animation: scrollLeft 25s linear infinite; 
}

@keyframes scrollLeft { 
  from { transform: translateX(100%); } 
  to { transform: translateX(-100%); } 
}

.sidebar {
  width: 0;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar-open .sidebar {
  width: 250px;
}

.side-btn { 
  display: flex; align-items: center; width: 100%; padding: 12px 15px; 
  background: transparent; color: #64748b; border-radius: 10px; cursor: pointer; 
  transition: all 0.2s ease; border: none; text-align: left; gap: 10px;
}

.active-tab { 
  background: #f1f5f9 !important; 
  color: var(--primary) !important; 
  font-weight: 700 !important;
}

.lock-screen { 
  position: fixed; inset: 0; background: rgba(13, 59, 102, 0.98); 
  z-index: 10000; display: flex; flex-direction: column; 
  align-items: center; justify-content: center; backdrop-filter: blur(8px); 
}

.pin-input { 
  background: #fff; border: 2px solid var(--accent); border-radius: 12px; 
  padding: 15px; font-size: 24px; font-weight: 900; width: 200px; 
  text-align: center; letter-spacing: 8px; outline: none; 
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mana-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.mana-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.mana-card:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
  border-color: var(--primary);
}

.mana-card h4 {
  margin: 10px 0 0 0;
  font-size: 13px;
  color: var(--primary);
}

.post-tag {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.post-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: opacity 0.2s;
}

.post-action-btn:hover {
  opacity: 0.7;
}

.table-responsive { width: 100%; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: left; }
`;

function cleanStringData(val: any) {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [currentFilter, setCurrentFilter] = useState('All');
  const [posts, setPosts] = useState<Post[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [updates, setUpdates] = useState<string[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [problemsGlobal, setProblemsGlobal] = useState<ProblemReport[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<{ id: number, msg: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showPostForm, setShowPostForm] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [adminLocked, setAdminLocked] = useState(true);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [currentAdminPin, setCurrentAdminPin] = useState('1234');

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
        setIsAdmin(false);
        signInAnonymously(auth).catch(err => handleFirestoreError(err, OperationType.WRITE, 'auth'));
      }
    });

    // Public Listeners
    const unsubUpdates = onSnapshot(collection(db, 'updates'), (snap) => {
      const uArr: string[] = [];
      snap.forEach(d => uArr.push((d.data() as any).text));
      setUpdates(uArr);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'updates'));

    const unsubSuggestions = onSnapshot(collection(db, 'suggestions'), (snap) => {
      const sArr: Suggestion[] = [];
      snap.forEach(d => sArr.push({ id: d.id, ...(d.data() as any) } as Suggestion));
      setSuggestions(sArr);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'suggestions'));

    const unsubPosts = onSnapshot(query(collection(db, 'posts')), (snap) => {
      const pArr: Post[] = [];
      snap.forEach((d) => {
          const data = d.data() as any;
          if (data.status !== 'Deleted' || isAdmin) {
              pArr.push({ id: d.id, ...data } as Post);
          }
      });
      setPosts(pArr.sort((a, b) => (b.time || 0) - (a.time || 0)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'posts'));

    return () => {
      unsubAuth();
      unsubUpdates();
      unsubSuggestions();
      unsubPosts();
    };
  }, [isAdmin]);

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
      setIsAdmin(snap.exists() || isDevEmail);
    }, (err) => handleFirestoreError(err, OperationType.GET, `admins/${user.uid}`));

    const unsubChat = onSnapshot(query(collection(db, 'chat')), (snap) => {
      const cArr: ChatMessage[] = [];
      snap.forEach((d) => cArr.push({ id: d.id, ...(d.data() as any) } as ChatMessage));
      cArr.sort((a, b) => (a.time || 0) - (b.time || 0));
      setChatMessages(cArr.slice(-50));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'chat'));

    const problemsQuery = isAdmin
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
    const requestsQuery = isAdmin 
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

    const unsubNotifications = onSnapshot(query(collection(db, 'notifications'), where('uid', 'in', [user.uid, 'all']), orderBy('time', 'desc'), limit(50)), (snap) => {
      const nArr: Notification[] = [];
      snap.forEach(d => nArr.push({ id: d.id, ...(d.data() as any) } as Notification));
      setNotifications(nArr);
      setUnreadCount(nArr.filter(n => !n.read).length);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'notifications'));

    return () => {
      unsubProfile();
      unsubAdminCheck();
      unsubChat();
      unsubProblems();
      unsubRequests();
      unsubNotifications();
    };
  }, [user, isAdmin]);

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
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

      <header className="bg-primary h-[65px] px-6 flex items-center border-b-4 border-accent shadow-lg sticky top-0 z-[1001]" style={{ background: '#0d3b66', borderColor: '#fbbf24' }}>
        <div className="flex-1 flex items-center gap-4 cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="text-white" />
          <div className="flex flex-col">
            <h1 className="brand-title font-black text-2xl leading-none">E-VEDHIKA</h1>
            <p className="text-[10px] font-bold text-accent opacity-90" style={{ color: '#fbbf24' }}>PR & RD TECHNICAL PORTAL</p>
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          <div 
            className="relative cursor-pointer p-2 hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={24} className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0d3b66]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute top-[50px] right-0 w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[1005] overflow-hidden"
              >
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                  <h3 className="font-black text-primary">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={async () => {
                        const batch: any = [];
                        notifications.filter(n => !n.read).forEach(n => {
                          batch.push(updateDoc(doc(db, 'notifications', n.id), { read: true }));
                        });
                        await Promise.all(batch);
                      }}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-sm">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-4 border-b hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}
                        onClick={async () => {
                          if (!n.read) await updateDoc(doc(db, 'notifications', n.id), { read: true });
                          setShowNotifications(false);
                          // Handle link if needed
                        }}
                      >
                        <div className="flex gap-3">
                          <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${n.read ? 'bg-slate-200' : 'bg-primary'}`}></div>
                          <div>
                            <p className="text-xs font-black text-primary mb-1">{n.title}</p>
                            <p className="text-[11px] text-slate-600 leading-normal">{n.message}</p>
                            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase">{new Date(n.time).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="latest-bar h-8 overflow-hidden bg-white border-b flex items-center">
        <div className="bg-red-600 text-white text-[10px] font-black px-3 h-full flex items-center z-10">NEWS</div>
        <div className="latest-text flex-1">
          <span className="text-xs font-bold text-primary">
            {updates.length > 0 ? updates.join(' 🔥 ') : 'Welcome to E-Vedhika Portal... Stay tuned for daily updates...'}
          </span>
        </div>
      </div>

      <div className={`flex flex-1 ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <aside className="sidebar bg-white border-r flex-shrink-0 sticky top-[97px] h-[calc(100vh-97px)]">
          <div className="w-[250px] p-4 space-y-2">
            <MenuButton label="Home" icon={Home} active={currentTab === 'home' && currentFilter === 'All'} onClick={() => { setCurrentTab('home'); setCurrentFilter('All'); setSidebarOpen(false); }} />
            <MenuButton label="Mana Panchayath" icon={LayoutDashboard} active={currentTab === 'workspace'} onClick={() => { setCurrentTab('workspace'); setSidebarOpen(false); }} />
            <MenuButton label="Live Chat" icon={MessageSquare} active={currentTab === 'chat'} onClick={() => { setCurrentTab('chat'); setSidebarOpen(false); }} />
            <MenuButton label="Knowledge Hub" icon={Book} active={currentTab === 'repo'} onClick={() => { setCurrentTab('repo'); setSidebarOpen(false); }} />
            <MenuButton label="Suggestions" icon={Lightbulb} active={currentTab === 'suggestions'} onClick={() => { setCurrentTab('suggestions'); setSidebarOpen(false); }} />
            {isAdmin && <MenuButton label="Admin Console" icon={ShieldAlert} active={currentTab === 'admin'} onClick={() => { setCurrentTab('admin'); setSidebarOpen(false); }} />}
          </div>
        </aside>

        <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
          {currentTab === 'home' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center justify-between">
                {user && !user.isAnonymous ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold flex items-center gap-2">👤 {userProfile?.username || "Member"}</span>
                    <button onClick={() => signOut(auth)} className="text-red-600 font-bold text-sm">Logout</button>
                  </div>
                ) : (
                  <div className="flex gap-4 w-full">
                     <form onSubmit={handleLogin} className="flex gap-2 flex-1">
                        <input name="email" type="email" placeholder="Email" className="mb-0 py-1" />
                        <input name="password" type="password" placeholder="Pass" className="mb-0 py-1" />
                        <button className="bg-primary text-white px-4 rounded-xl font-bold text-sm" style={{ background: '#0d3b66' }}>Go</button>
                     </form>
                     <button onClick={handleGoogleLogin} className="bg-red-500 text-white px-4 rounded-xl font-black">G</button>
                  </div>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search updates..." 
                  className="pl-12 pr-4 py-4 rounded-2xl border-none shadow-sm focus:ring-2 ring-primary"
                />
              </div>

              {user && !user.isAnonymous && (
                <button 
                  onClick={() => setShowPostForm(!showPostForm)}
                  className="w-full h-[55px] bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg"
                  style={{ background: '#0d3b66' }}
                >
                  <PlusCircle /> Create Update
                </button>
              )}

              {showPostForm && <PostForm addToast={addToast} onCancel={() => setShowPostForm(false)} currentUserProfile={userProfile} />}

              <div className="space-y-6">
                {filteredPosts.map(post => (
                  <PostCard key={post.id} post={post} isExpanded={expandedPosts.has(post.id)} toggleExpansion={() => togglePostExpansion(post.id)} addToast={addToast} isAdmin={isAdmin} />
                ))}
              </div>
            </div>
          )}

          {currentTab === 'chat' && <ChatSection messages={chatMessages} user={user} addToast={addToast} />}
          
          {currentTab === 'workspace' && <DigitalWorkspaceSection addToast={addToast} />}

          {currentTab === 'repo' && <KnowledgeHubSection />}

          {currentTab === 'suggestions' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border">
               <h2 className="text-xl font-black mb-6 flex items-center gap-3">💡 Suggestions Hub</h2>
               <div id="suggestionBox" className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
                 {suggestions.map(s => (
                   <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border-l-4 border-accent" style={{ borderColor: '#fbbf24' }}>
                     <b className="text-primary">{s.name || 'User'}:</b> {s.text || (s as any).suggestion || (s as any).msg}
                   </div>
                 ))}
               </div>
            </div>
          )}

          {currentTab === 'admin' && isAdmin && (
            <>
              {adminLocked ? (
                <div className="lock-screen">
                  <Lock size={48} color="#fbbf24" className="mb-6 animate-pulse" />
                  <h2 className="text-white text-2xl font-black mb-6">ADMIN CONSOLE LOCKED</h2>
                  <input 
                    type="password" 
                    className="pin-input" 
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
                <AdminSection addToast={addToast} lockSession={() => setAdminLocked(true)} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function AdminSection({ addToast, lockSession }: { addToast: (s: string) => void, lockSession: () => void }) {
  const [activeSubTab, setActiveSubTab] = useState('dash');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allProblems, setAllProblems] = useState<ProblemReport[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const uList: UserProfile[] = [];
      snap.forEach(d => uList.push({ id: d.id, ...(d.data() as any) }));
      setUsers(uList);
    }, (err) => {
      setPermissionError("Access to user database restricted.");
      handleFirestoreError(err, OperationType.GET, 'users');
    });

    const unsubProblems = onSnapshot(collection(db, 'problems'), (snap) => {
      const pList: ProblemReport[] = [];
      snap.forEach(d => pList.push({ id: d.id, ...(d.data() as any) }));
      setAllProblems(pList);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'problems'));

    const unsubLogs = onSnapshot(query(collection(db, 'security_logs'), orderBy('time', 'desc'), limit(20)), (snap) => {
      const lList: any[] = [];
      snap.forEach(d => lList.push({ id: d.id, ...d.data() }));
      setLogs(lList);
      setLogsError(false);
    }, (err) => {
      setLogsError(true);
      handleFirestoreError(err, OperationType.GET, 'security_logs');
    });

    return () => {
      unsubUsers();
      unsubProblems();
      unsubLogs();
    };
  }, []);

  const resolveProblem = async (problem: ProblemReport) => {
    try {
      await updateDoc(doc(db, 'problems', problem.id), { status: 'solved', resolvedAt: Date.now() });
      
      // Send notification to user
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
        <button onClick={lockSession} className="bg-slate-100 p-2 rounded-xl"><Lock size={18} /></button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['dash', 'users', 'reports', 'logs', 'alerts'].map(t => (
          <button key={t} onClick={() => setActiveSubTab(t)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${activeSubTab === t ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeSubTab === 'dash' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Users" val={users.length} color="blue" />
            <StatCard label="Pending" val={allProblems.filter(p => p.status === 'pending').length} color="red" />
            <StatCard label="Resolved" val={allProblems.filter(p => p.status === 'solved').length} color="green" />
            <StatCard label="Reports" val={allProblems.length} color="amber" />
          </div>
          <div className="w-full h-[300px] min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%" debounce={1}>
                <BarChart data={[
                  { name: 'Pending', count: allProblems.filter(p => p.status === 'pending').length },
                  { name: 'Solved', count: allProblems.filter(p => p.status === 'solved').length }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="count" fill="#0d3b66" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="table-responsive">
          {permissionError ? (
            <div className="p-10 text-center text-slate-400 font-bold">{permissionError}</div>
          ) : (
            <table className="text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th>Username</th>
                  <th>Village</th>
                  <th>UID</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="font-bold">{u.username}</td>
                    <td>{u.village || 'N/A'}</td>
                    <td className="text-[10px] text-slate-400">{u.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
  const colors: any = { blue: '#f0f9ff', red: '#fef2f2', green: '#f0fdf4', amber: '#fffbeb' };
  const text: any = { blue: '#0369a1', red: '#991b1b', green: '#166534', amber: '#92400e' };
  return (
    <div className="p-4 rounded-2xl border" style={{ background: colors[color] }}>
      <div className="text-[10px] font-bold uppercase opacity-60" style={{ color: text[color] }}>{label}</div>
      <div className="text-2xl font-black" style={{ color: text[color] }}>{val}</div>
    </div>
  );
}

function DigitalWorkspaceSection({ addToast }: { addToast: (s:string) => void }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border">
      <h2 className="text-xl font-black mb-2 flex items-center gap-3">🏛️ Mana Panchayath</h2>
      <p className="text-xs text-slate-500 mb-6">Technical Workspace for PR Officers</p>
      
      <div className="mana-grid">
        <ToolCard icon={BarChart3} title="DSR Analyzer" onClick={() => setActiveTool('dsr')} />
        <ToolCard icon={Layers} title="Multi-Day Attendance" onClick={() => setActiveTool('multi')} />
        <ToolCard icon={GraduationCap} title="Digital Training" onClick={() => setActiveTool('training')} />
        <ToolCard icon={Database} title="Forms Hub" onClick={() => setActiveTool('forms')} />
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

function ToolCard({ icon: Icon, title, onClick }: { icon: any, title: string, onClick: () => void }) {
  return (
    <div onClick={onClick} className="mana-card">
      <Icon size={32} className="mx-auto text-primary" />
      <h4 className="font-bold mt-3">{title}</h4>
    </div>
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
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50 p-4 rounded-2xl text-center">
              <div className="text-[10px] font-black text-blue-800">TOTAL</div>
              <div className="text-xl font-black text-blue-900">{stats.total}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl text-center">
              <div className="text-[10px] font-black text-green-800">PRESENT</div>
              <div className="text-xl font-black text-green-900">{stats.present}</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl text-center">
              <div className="text-[10px] font-black text-amber-800">ENTRIES</div>
              <div className="text-xl font-black text-amber-900">{stats.dsr}</div>
            </div>
          </div>

          <div className="table-responsive bg-white rounded-2xl border">
            <table className="text-[12px]">
              <thead className="bg-slate-50">
                <tr><th>Mandal</th><th>Gram Panchayat</th><th>Att</th><th>DSR</th></tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td>{row.mandal}</td>
                    <td className="font-bold">{row.gp}</td>
                    <td className={row.att === 'P' ? 'text-green-600' : 'text-red-600'}>{row.att}</td>
                    <td>{row.dsr}</td>
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

function PostCard({ post, isExpanded, toggleExpansion, addToast, isAdmin }: { post: Post, isExpanded: boolean, toggleExpansion: () => void, addToast: (s:string) => void, isAdmin: boolean }) {
  const isOwner = auth.currentUser?.uid === post.uid || isAdmin;

  const handleLike = async () => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) return addToast("Join to interact!");
    if (post.likedBy?.includes(auth.currentUser.uid)) return;
    try {
      await updateDoc(doc(db, 'posts', post.id), { 
        likes: increment(1),
        likedBy: arrayUnion(auth.currentUser.uid)
      });
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, `posts/${post.id}`); }
  };

  const deletePost = async () => {
    const res = await Swal.fire({ title: 'Delete?', text: 'Move to recycle bin?', icon: 'warning', showCancelButton: true });
    if (res.isConfirmed) {
      try {
        await updateDoc(doc(db, 'posts', post.id), { status: 'Deleted' });
        addToast("Trash moved");
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `posts/${post.id}`);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border overflow-hidden">
      {post.mediaUrl && (
        <div className="aspect-video bg-slate-100 border-b overflow-hidden flex items-center justify-center">
           {post.mediaType?.includes('video') ? <video src={post.mediaUrl} controls className="w-full h-full" /> : <img src={post.mediaUrl} className="w-full h-full object-cover" />}
        </div>
      )}
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
           <div className="flex gap-2">
              <span className="post-tag bg-primary text-white" style={{ background: '#0d3b66' }}>{post.category}</span>
              {isAdmin && post.uid === auth.currentUser?.uid && <span className="post-tag bg-green-100 text-green-700 border border-green-200">✓ Official</span>}
           </div>
           {isOwner && (
             <div className="flex gap-1">
                <button onClick={deletePost} className="p-2 text-red-500"><Trash2 size={16}/></button>
             </div>
           )}
        </div>
        
        <h3 className="text-xl font-bold">{post.title}</h3>
        <div className="text-[11px] text-slate-400 flex items-center gap-2 font-bold">
           <User size={12} /> {post.userName || 'Member'} • {new Date(post.time).toLocaleDateString()}
        </div>

        <div className={`text-slate-600 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {post.content.length > 150 && (
          <button onClick={toggleExpansion} className="text-xs font-black text-primary underline">
            {isExpanded ? 'Show Less' : 'Read More'}
          </button>
        )}

        <div className="pt-4 border-t flex justify-between items-center">
           <div className="flex gap-4">
              <button onClick={handleLike} className="post-action-btn" style={{ color: post.likedBy?.includes(auth.currentUser?.uid || "") ? '#ef4444' : '#64748b' }}>
                <Heart size={18} fill={post.likedBy?.includes(auth.currentUser?.uid || "") ? '#ef4444' : 'none'} /> {post.likes}
              </button>
              <div className="post-action-btn text-slate-400"><Eye size={18} /> {post.views}</div>
           </div>
           <button onClick={() => { navigator.clipboard.writeText(window.location.href); addToast("Link copied!"); }} className="text-primary"><Share2 size={18} /></button>
        </div>
      </div>
    </motion.div>
  );
}

function PostForm({ addToast, onCancel, currentUserProfile }: { addToast: (s:string) => void, onCancel: () => void, currentUserProfile: UserProfile | null }) {
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<{ url: string, type: string } | null>(null);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    const f = e.target;
    try {
      await addDoc(collection(db, 'posts'), {
        title: f.title.value,
        content: f.content.value,
        category: f.category.value,
        mediaUrl: media?.url || "",
        mediaType: media?.type || "",
        likes: 0, likedBy: [], views: 0, comments: [],
        time: Date.now(),
        uid: auth.currentUser.uid,
        userName: currentUserProfile?.username || "Portal User",
        status: 'Approved'
      });
      addToast("Update Published!");
      onCancel();
    } catch (err: any) { 
      handleFirestoreError(err, OperationType.WRITE, 'posts');
      addToast("Error: " + err.message); 
    }
    finally { setLoading(false); }
  };

  return (
    <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onSubmit={onSubmit} className="bg-white p-6 rounded-3xl shadow-xl border-2 border-accent" style={{ borderColor: '#fbbf24' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-primary">NEW UPDATE</h3>
        <button type="button" onClick={onCancel} className="text-slate-400"><X /></button>
      </div>
      <input name="title" required placeholder="Header..." className="text-lg font-bold" />
      <select name="category" className="bg-slate-50 font-bold text-xs uppercase letter-spacing-1">
         <option value="Daily reports">📊 Daily Reports</option>
         <option value="Updates">📢 Updates</option>
         <option value="Election">🗳️ Election</option>
         <option value="General">📌 General</option>
      </select>
      <textarea name="content" required placeholder="Write details (Markdown allowed)..." rows={4} />
      
      <div className="py-4 border-2 border-dashed rounded-xl text-center mb-4 cursor-pointer relative bg-slate-50 overflow-hidden">
         {media ? <div className="text-xs font-bold text-green-600">✓ Media Loaded</div> : <div className="text-xs font-bold text-slate-400">Add Image/Video</div>}
         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" onChange={async (e) => {
           const f = e.target.files?.[0];
           if (f) {
             const reader = new FileReader();
             reader.onload = (ev) => setMedia({ url: ev.target?.result as string, type: f.type });
             reader.readAsDataURL(f);
           }
         }} />
      </div>

      <button disabled={loading} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg" style={{ background: '#0d3b66' }}>
        {loading ? 'PUBLISHING...' : 'PUBLISH NOW'}
      </button>
    </motion.form>
  );
}

function MenuButton({ label, active, onClick, icon: Icon }: { label: string, active: boolean, onClick: () => void, icon: any }) {
  return (
    <button onClick={onClick} className={`side-btn ${active ? 'active-tab' : ''}`}>
      <Icon size={18} className={active ? 'text-primary' : 'text-slate-400'} />
      <span className="text-sm">{label}</span>
    </button>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.uid === user?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm ${m.uid === user?.uid ? 'bg-primary text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`} style={m.uid === user?.uid ? { background: '#0d3b66' } : {}}>
              {m.msg}
            </div>
          </div>
        ))}
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
    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
      <div className="flex items-center gap-3 font-bold text-accent" style={{ color: '#fbbf24' }}>
        <Icon size={20} /> {title}
      </div>
      <div className="flex gap-2">
        <input 
          value={queryVal} 
          onChange={e => setQueryVal(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder={placeholder} 
          className="bg-slate-800 border-none text-white text-sm placeholder:text-slate-500 mb-0" 
        />
        <button onClick={ask} disabled={loading} className="bg-accent text-slate-900 px-4 rounded-xl font-black" style={{ background: '#fbbf24' }}>
          {loading ? '...' : <Send size={18} />}
        </button>
      </div>
      {answer && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
           <ReactMarkdown>{answer}</ReactMarkdown>
        </motion.div>
      )}
    </div>
  );
}

function PRActHub() {
    return <KnowledgeHubSection />;
}

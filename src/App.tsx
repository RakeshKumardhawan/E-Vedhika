/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { useSearchParams, Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import { Helmet } from 'react-helmet-async';
import { ManaBot } from './components/ManaBot';

const PollsScreen = lazy(() => import('./pages/PollsScreen'));

import { 
  Bell, Menu, X, Home, Megaphone, FileText, Wheat, Vote, 
  Wallet, Building, MessageCircle, Handshake, Lightbulb, 
  AlertTriangle, Send, LogOut, ChevronDown, ChevronUp, Search, Filter, AlertCircle,
  Eye, Heart, Share2, PlusCircle, Camera, User, Edit2, Save,
  Activity, Book, GraduationCap, BarChart3, Database, Download, Bot, MessageSquare,
  Trash2, Edit3, Settings, TrendingUp, Upload, Play, RefreshCw, Layers, Calendar, LayoutDashboard, ShieldAlert, Lock, Shield, Pin, Bold, Italic, Type, Link2, List,
  Users, AlertOctagon, CheckCircle2, CheckCircle, ClipboardList, Zap, Clock, ArrowLeft, ArrowRight, ArrowUpRight, Loader2, XCircle, ChevronRight, Flag, ShieldCheck, Info, Hash, EyeOff, Rocket, Mail, RotateCcw, MapPin, Plus, Mic, ExternalLink, Target
} from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { GosAndFormatsPublic, GosAndFormatsAdmin } from './GosAndFormats';
// Lazy loaded modules
let XLSX: any = null;
let jsPDF: any = null;
let autoTable: any = null;

export const loadHeavyModules = async () => {
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
  increment, arrayUnion, arrayRemove, query, orderBy, limit, setDoc, getDoc, where,
  getDocFromServer
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from "../firebase";
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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  return (
    <div className="logo-pro relative" style={{ width: size, height: size }}>
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
export interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  categories?: string[];
  subCategory?: string;
  tags?: string[];
  websiteName?: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaName?: string;
  likes: number;
  views: number;
  comments: Comment[];
  commentCount?: number;
  likedBy?: string[];
  viewedBy?: string[];
  userName?: string;
  userPhoto?: string;
  time: number;
  uid: string;
  status?: string;
  pinned?: boolean;
  isAdminPost?: boolean;
}

export interface Comment {
  user: string;
  msg: string;
  time: number;
}

export interface UserProfile {
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
  theme?: 'light' | 'dark';
  notifications?: boolean;
  time: number;
}

const DEFAULT_DISTRICTS_DATA: Record<string, string[]> = {
  "Adilabad": ["Adilabad","Bazarhathnoor","Bela","Bheempur","Bhoraj","Boath","Gadiguda","Gudihathnur","Ichoda","Inderavelly","Jainad","Mavala","Narnoor","Neradigonda","Sirikonda","Sathnala","Sonala","Talamadugu","Tamsi","Utnur"],
  "Bhadradri Kothagudem": ["Allapalli","Annapureddypalli","Aswapuram","Aswaraopeta","Bhadrachalam","Burgampadu","Chandrugonda","Cherla","Chunchupalli","Dammapeta","Dummugudem","Gundala","Julurpad","Karakagudem","Laxmidevipalli","Manuguru","Mulakalapalle","Palawancha","Pinapaka","Sujathanagar","Tekulapalle","Yellandu"],
  "Hanumakonda": ["Atmakur","Bheemadevarpalle","Damera","Dharmasagar","Elkathurthi","Hasanparthy","Inavolue","Kamalapur","Nadikuda","Parkal","Shayampet","Velair"],
  "Hyderabad": ["Amberpet", "Asifnagar", "Bahadurpura", "Bandra", "Charminar", "Golconda", "Himayatnagar", "Khairatabad", "Marredpally", "Musheerabad", "Nampally", "Saidabad", "Secunderabad", "Shaikpet", "Tirumalagiri", "Ameerpet"],
  "Jagtial": ["Bheemaram","Bheerpur","Buggaram","Dharmapuri","Endapalli","Gollapalle","Ibrahimpatnam","Jagitial Rural","Jagtial","Kathlapur","Kodimial","Korutla","Mallapur","Mallial","Medipalle","Metpalle","Pegadapalle","Raikal","Sarangapur","Velgatoor"],
  "Jangaon": ["Bachannapeta","Chilpur","Devaruppula","Ghanpur(Stn)","Jangaon","Kodakandla","Lingala Ghanpur","Narmetta","Palakurthi","Raghunatha Palle","Tharigoppula","Zaffergadh"],
  "Jayashankar Bhupalpally": ["Bhupalpally", "Chityal", "Ghanpur (Mulug)", "Kataram", "Mahadevpur", "Malharrao", "Mogullapally", "Mutharam (Mahadevpur)", "Palimela", "Regonda", "Tekumatla"],
  "Jogulamba Gadwal": ["Alampur", "Dharur", "Gadwal", "Ghattu", "Ieeja", "Itikyal", "Maldakal", "Manopad", "Rajoli", "Undavelly", "Waddepalle", "Kaloor Timmanadoddi"],
  "Kamareddy": ["Banswada", "Bhiknoor", "Birkur", "Domakonda", "Farooqnagar", "Gandhari", "Jukkal", "Kamareddy", "Lingampet", "Machareddy", "Madnoor", "Nizamsagar", "Pitlam", "Sadashivanagar", "Yellareddy", "Nasrullabad", "Tadwai", "Bhimgal", "Ramareddy", "Rajampet", "Bibipet", "Pedda Kodapgal", "Dongli", "Gudam", "Palvancha"],
  "Karimnagar": ["Chigurumamidi","Choppadandi","Ellandhakunta","Gangadhara","Ganneruvaram","Huzurabad","Jammikunta","Karimnagar","Kothapally","Manakondur","Ramadugu","Shankarapatnam","Thimmapur","V Saidapur","Veenavanka"],
  "Khammam": ["Bonakal","Chinthakani","Enkuru","Kalluru","Kamepalle","Khammam Rural","Konijerla","Kusumanchi","Madhira","Mudigonda","Nelakondapalle","Penuballi","Raghunadhapalem","Sathupalle","Singareni","Thallada","Thirumalayapalem","Vemsoor","Wyra","Yerrupalem"],
  "Komaram Bheem Asifabad": ["Asifabad", "Bejjur", "Chintalamanepally", "Dahegaon", "Jainoor", "Kagaznagar", "Kerameri", "Kouthala", "Penchikalpet", "Rebbena", "Sirpur (T)", "Sirpur (U)", "Tiryani", "Wankidi"],
  "Mahabubabad": ["Bayyaram", "Dornakal", "Gangaram", "Garla", "Gudur", "Kothaguda", "Kuravi", "Mahabubabad", "Maripeda", "Narsimhulapet", "Peddavangara", "Thorrur", "Kessamudram", "Nellikudur", "Danthalapalle", "Seerole"],
  "Mahabubnagar": ["Addakal","Balanagar","Bhoothpur","Chinna Chinta Kunta","Devarkadara","Gandeed","Hanwada","Jadcherla","Koilkonda","Koukuntla","Mahbubnagar","Midjil","Mohammadabad","Moosapet","Nawabpet","Rajapur"],
  "Mancherial": ["Bellampalle","Bheemaram","Bheemini","Chennur","Dandepalle","Hajipur","Jaipur","Jannaram","Kannepally","Kasipet","Kotapalle","Luxettipet","Mandamarri","Nennal","Tandur","Vemanpalle"],
  "Medak": ["Alladurg","Chegunta","Chilpiched","Havelighanpur","Kowdipalle","Kulcharam","Manoharabad","Masaipet","Medak","Narsapur","Narsingi","Nizampet","Papannapet","Ramayampet","Regode","Shankarampet (A)","Shankarampet (R)","Shivampet","Tekmal","Tupran","Yeldurthy"],
  "Medchal-Malkajgiri": ["Alwal", "Balanagar", "Dundigal Gandimaisamma", "Ghatkesar", "Kapra", "Keesara", "Kukatpally", "Malkajgiri", "Medchal", "Medipally", "Qutubullapur", "Shamirpet", "Uppal", "Bolarum", "Chengicherla"],
  "Mulugu": ["Eturnagaram", "Govindaraopet", "Mangapet", "Mulugu", "SS Tadvai", "Vazeed", "Venkatapuram", "Kannaigudem", "Tadvai"],
  "Nagarkurnool": ["Achampet", "Amrabad", "Balmoor", "Bijinapalle", "Charakonda", "Kalwakurthy", "Kodair", "Kollapur", "Lingal", "Nagarkurnool", "Padara", "Peddakothapalle", "Pentlavelli", "Tadoor", "Telkapalle", "Thimmajipet", "Uppununthala", "Urkonda", "Vangoor"],
  "Nalgonda": ["Adavidevulapally","Anumula","Chandam Pet","Chandur","Chintha Palle","Chityala","Dameracherla","Devarakonda","Gattuppal","Gudipally","Gundla Palle","Gurrampode","Kangal","Kattangoor","Kethepalle","Kondamallepally","Madugulapally","Marri Guda","Miryalaguda","Munugode","Nakrekal","Nalgonda","Nampalle","Narketpalle","Neredugomma","Nidamanur","Pedda Adiserlapalle","Peddavura","Saligouraram","Thipparthi","Thirumalagiri sagar","Thripuraram","Vemulapalle"],
  "Narayanpet": ["Damaragidda", "Dhanwada", "Kosgi", "Krishna", "Maddur", "Maganoor", "Makthal", "Marikal", "Narayanpet", "Utkoor", "Narva"],
  "Nirmal": ["Basar", "Bhainsa", "Dilawarpur", "Kaddampeddur", "Khanapur", "Kuntala", "Lokeshwaram", "Mamda", "Mudhole", "Nirmal", "Nirmal Rural", "Pemdhal", "Sarangapur", "Soan", "Tanur", "Dasturabad", "Pembarthi"],
  "Nizamabad": ["Aloor","Armur","Balkonda","Bheemgal","Bodhan","Chandur","Dhar Palle","Dich Palle","Donkeshwar","Indalwai","Jakranpalle","Kammar Palle","Kotgiri","Makloor","Mendora","Mortad","Mosara","Mugpal","Mupkal","Nandipet","Navipet","Nizamabad","Pothangal","Ranjal","Rudrur","Saloora","Sirkonda","Varni","Velpur","Yeda Palle","Yergatla"],
  "Peddapalli": ["Anthergoam", "Dharmaram", "Eligaid", "Julapalli", "Kamanpur", "Manthani", "Mutharam (Manthani)", "Odela", "Palakurthy", "Peddapalli", "Ramagiri", "Ramagundam", "Srirampur", "Sulthanabad"],
  "Rajanna Sircilla": ["Boinpalle", "Chandurthi", "Ellanthakunta", "Gambhiraopet", "Konaraopeta", "Mustabad", "Sircilla", "Vemulawada", "Vemulawada Rural", "Yellareddy Peth", "Thangallapalli"],
  "Rangareddy": ["Abdullapurmet", "Amangal", "Balapur", "Chevella", "Farooqnagar", "Gandipet", "Hayathnagar", "Ibrahimpatnam", "Jillelaguda", "Kadthal", "Kondurg", "Kothur", "Madgul", "Maheshwaram", "Manchal", "Moinabad", "Nandigama", "Rajendranagar", "Saroornagar", "Serilingampally", "Shabad", "Shamshabad", "Shankarpalle", "Talakondapalle", "Yacharam"],
  "Sangareddy": ["Ameenpur","Andole","Chowtakur","Gummadidala","Hathnoora","Jharasangam","Jinnaram","Kalher","Kandi","Kangti","Kohir","Kondapur","Manoor","Mogadampally","Munpalle","Nagalgidda","Narayankhed","Nizampet","Nyalkal","Patancheru","Pulkal","Raikode","Sadasivpet","Sangareddy","Sirgapur","Vatpally","Zahirabad"],
  "Siddipet": ["AkbarpetNA Bhoompally","Akkannapeta","Bejjanki","Cheriyal","Chinna Kodur","Dhoolmitta","Doultabad","Dubbak","Gajwel","Husnabad","Jagdevpur","Koheda","Komuravelli","Kondapak","Kukunoorpally","Maddur","Markook","Mirdoddi","Mulug","Nanganur","Narayanaraopet","Raipole","Siddipet","Siddipet Rural","Thoguta","Wargal"],
  "Suryapet": ["Atmakur (S)", "Chilkur", "Chinthapalem", "Garidepally", "Huzurnagar", "Jajireddygudem", "Kodad", "Maddirala", "Mattampally", "Mellachervu", "Mothey", "Munagala", "Nadigudem", "Neredcherla", "Nuthankal", "Palakeedu", "Penpahad", "Suryapet", "Thirumalagiri", "Tungaturthi"],
  "Vikarabad": ["Basheerabad", "Bommraspet", "Dharur", "Doma", "Kodangal", "Kotepally", "Kulkacherla", "Marpalle", "Mominpet", "Nawabpet", "Pargi", "Peddemul", "Pudur", "Tandur", "Vikarabad", "Yelal"],
  "Wanaparthy": ["Amarchinta", "Atmakur", "Chinnambavi", "Ghanpur", "Gopalpeta", "Khila Ghanpur", "Kothakota", "Madanapur", "Pangal", "Pebbair", "Peddamandadi", "Revally", "Srirangapur", "Veepangandla", "Wanaparthy"],
  "Warangal": ["Chennaraopet","Duggondi","Geesugonda","Khanapur","Nallabelly","Narsampet","Nekkonda","Parvathagiri","Raiparthy","Sangem","Wardhannapet"],
  "Yadadri Bhuvanagiri": ["Addagudur", "Alair", "Atmakur (M)", "Bibinagar", "Bhudan Pochampally", "Bhuvanagiri", "Bommalaramaram", "Choutuppal", "Gundala", "Motakondur", "Mothkur", "Narayanapur", "Rajapet", "Ramannapet", "Turkapally", "Valigonda", "Yadagirigutta"]
};

export interface Suggestion {
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

export interface ProblemReport {
  id: string;
  msg: string;
  category?: string;
  status?: 'pending' | 'solved' | 'resolved' | 'Deleted';
  time: number;
  uid: string;
  resolvedAt?: number;
  isAnonymous?: boolean;
  wantsWhatsAppUpdates?: boolean;
}

export interface ChatMessage {
  id: string;
  msg: string;
  time: number;
  uid: string;
  userName?: string;
}

export interface RequestData {
  id: string;
  msg: string;
  time: number;
  uid: string;
}

export interface Update {
  id: string;
  text: string;
  time: number;
  status?: string;
  type?: string;
  visibility?: string;
}

export interface Notification {
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

export function getValidTime(obj: any): number {
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

export const triggerNotification = (title: string, body: string) => {
  playNotificationSound();
  
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            reg.showNotification(title, {
              body,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png'
            } as any);
          } else {
            new Notification(title, { body, icon: '/pwa-192x192.png' });
          }
        });
      } else {
        new Notification(title, { body, icon: '/pwa-192x192.png' });
      }
    } catch(e) {}
  }
};

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

export const formatPostTitle = (title: string | undefined | null) => {
  if (!title) return '';
  return title.replace(/🛑🚀/g, '🛑\n🚀').replace(/🛑 🚀/g, '🛑\n🚀');
};

export const SYSTEM_UPDATES = [
  {
    id: 'update-v1.4.9-analytics-render',
    isSystemElement: true,
    version: 'v1.4.9',
    title: '11/05/2026: అడ్వాన్స్డ్ సర్వర్ ఆప్టిమైజేషన్స్ & SEO',
    badge: 'NEW',
    text: 'వెబ్‌సైట్ పర్ఫార్మన్స్ కోసం ఈ రోజు ఈ క్రింది అప్‌డేట్స్ చేయబడ్డాయి:\n\n1. 📊 గూగుల్ అనలిటిక్స్ (Google Analytics) ఇంటిగ్రేషన్ చేయడం జరిగింది.\n2. 🛡 రేట్ లిమిటింగ్ (Rate Limiting) ద్వారా స్పామ్ ఎటాక్స్ నివారించి, సర్వర్ ఎల్లప్పుడూ ఆన్‌లో ఉండేలా (No Server Sleep) రక్షణ కల్పించాము.\n3. 🔍 డైనమిక్ SEO (React Helmet) కలపడం వల్ల సోషల్ మీడియాలో పోస్ట్ షేర్ చేస్తే పోస్ట్ అప్డేట్ వస్తుంది.\n4. 🔔 పుష్ నోటిఫికేషన్స్ సెట్టింగ్స్‌లో కొత్త ఫీచర్ ద్వారా పాతదానిని డిస్టర్బ్ చేయకుండా మొబైల్/డెస్క్‌టాప్ డైరెక్ట్ పుష్ అలర్ట్స్ ఆప్షన్ యాడ్ చేసాం.\n5. 🔗 ప్రతి ఒక సెక్షన్‌కి (ఉదా. Chat, Polls, Directory) డైరెక్ట్ షేర్ లింక్ జనరేట్ అయ్యేలా అప్డేట్ చేయబడింది. పైన ఉన్న షేర్ ఐకాన్ ద్వారా లింక్ కాపీ చేసుకోవచ్చు.',
    time: new Date('2026-05-11T12:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.4.8',
    isSystemElement: true,
    version: 'v1.4.8',
    title: '10/05/2026: సిస్టమ్ అప్‌డేట్స్ & అనలిటిక్స్ ఫీచర్స్',
    badge: 'DAILY UPDATE',
    text: 'నేటి సిస్టమ్ అప్‌డేట్స్‌లో భాగంగా పోర్టల్‌లో ఈ క్రింది మార్పులు చేసాము:\n\n1. 💎 **టెక్స్ట్ ఫార్మాటింగ్ టూల్‌బార్**: ఇప్పుడు మీరు పోస్ట్‌లను వ్రాసేటప్పుడు వర్డ్ ఫైల్ లాగా బోల్డ్, ఇటాలిక్ మరియు లైన్ బ్రేక్స్ ఉపయోగించవచ్చు.\n2. 🎨 **UI అప్‌డేట్స్**: కస్టమ్ లోగో, మొబైల్ హోమ్ స్క్రీన్ ఐకాన్ మరియు ఫెవికాన్ కలపబడ్డాయి.\n3. 📊 **అడ్మిన్ అనలిటిక్స్**: అడ్మిన్‌లకి మాత్రమే, పోస్ట్‌లో Views లేదా Likes కౌంట్ మీద క్లిక్ చేస్తే చూసిన/లైక్ చేసిన వారి లిస్ట్ వస్తుంది.\n4. 📖 **పోస్ట్ రీడింగ్ UX**: "Read Post" మీద క్లిక్ చేస్తే ఆ పోస్ట్ ఫుల్ వ్యూ వస్తుంది, మరియు "Back to Feed" బటన్ యాడ్ చేసాం.\n5. 🚀 **నావిగేషన్**: ఎగువన ఉన్న "EV" లోగో మీద క్లిక్ చేస్తే ఏ పేజీ నుంచి అయినా నేరుగా హోమ్ పేజీకి వస్తారు.\n6. 🔗 **సోషల్ షేరింగ్**: పోస్ట్‌లను షేర్ చేసినప్పుడు సరైన థంబ్‌నెయిల్ మరియు టైటిల్‌తో "ప్రివ్యూ" వచ్చేలా ఫిక్స్ చేసాము.\n7. ⚡ **స్పీడ్ & ఆప్టిమైజేషన్ (NEW)**: యూజర్ల కోరిక మేరకు అన్ని సెక్షన్స్‌ని ఒకే ఫైల్‌లో బల్క్‌గా ఉంచకుండా.. ఏ సెక్షన్ మీద ఐతే క్లిక్ చేస్తారో ఆ ఫైల్‌ మాత్రమే లోడ్ అయ్యేలా "Code Splitting (Lazy Loading)" టెక్నాలజీ ద్వారా వెబ్‌సైట్ మరియు సర్వర్ భారాన్ని తగ్గించాము.',
    time: new Date('2026-05-10T23:59:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.7.2',
    isSystemElement: true,
    version: 'v1.7.2',
    title: '09/05/2026: కేటగిరీల పునరుద్ధరణ (Restoration)',
    badge: 'BUGFIX',
    text: 'యూజర్ కోరిక మేరకు అన్ని పోస్ట్ కేటగిరీలను యథావిధిగా పునరుద్ధరించడం జరిగింది. అల్లాగే Admin Panel లో ఏర్పడిన Firestore Update ఎర్రర్‌ను ఫిక్స్ చేశాము.',
    time: new Date('2026-05-09T18:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.7.1',
    isSystemElement: true,
    version: 'v1.7.1',
    title: '09/05/2026: కేటగిరీల జాబితా క్లీనప్',
    badge: 'UPDATE',
    text: 'పోస్ట్ కేటగిరీల జాబితా నుండి అనవసరమైన అంశాలను తొలగించడం జరిగింది మరియు Useful Information కేటగిరీని అప్డేట్ చేసాము.',
    time: new Date('2026-05-09T17:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.7.0',
    isSystemElement: true,
    version: 'v1.7.0',
    title: '09/05/2026: హాష్‌ట్యాగ్స్ & వ్యూస్ అప్డేట్',
    badge: 'NEW',
    text: 'పోస్ట్ కంటెంట్‌లోని #hashtags ఆటోమేటిక్‌గా ట్యాగ్స్‌గా మారుతాయి. వ్యూస్ కౌంట్ ఒక యూజర్ కి ఒకసారి మాత్రమే లెక్కించబడుతుంది.',
    time: new Date('2026-05-09T16:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.6.2',
    isSystemElement: true,
    version: 'v1.6.2',
    title: '09/05/2026: మల్టీ-కేటగిరీ సపోర్ట్',
    badge: 'NEW',
    text: 'ఇకపై ఒక పోస్ట్ కి 3 కేటగిరీల వరకు ఎంచుకోవచ్చు. కేటగిరీల జాబితాను క్లీనప్ చేయడం జరిగింది.',
    time: new Date('2026-05-09T15:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.6.1',
    isSystemElement: true,
    version: 'v1.6.1',
    title: '09/05/2026: కేటగిరీలకు ఐకాన్స్ జోడింపు',
    badge: 'NEW',
    text: 'కేటగిరీలకు ఐకాన్స్ (Emojis) జోడించడం జరిగింది మరియు మరిన్ని ఇష్యూ రిపోర్టింగ్ కేటగిరీలను అందుబాటులోకి తెచ్చాం.',
    time: new Date('2026-05-09T14:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.4.6',
    isSystemElement: true,
    version: 'v1.4.6',
    title: '08/05/2026: సింగిల్ చాట్ బాట్ (ManaBot) సింప్లిఫికేషన్',
    badge: 'UPDATE',
    text: 'యూజర్స్ కి కన్ఫ్యూజన్ లేకుండా లైవ్ చాట్ లో ఉన్న ఏఐ బాట్ ని మరియు వర్క్ స్పేస్ లో ఉన్న ట్రైనింగ్ బాట్ ని తీసేసి.. అన్నిటికీ కలిపి కేవలం ఒకే ఒక పవర్ఫుల్ చాట్ బాట్ "E-VEDHIKA Assistant" ని మాత్రమే ఉంచాము. PR Act సెర్చ్ లోని బాట్ ఐకాన్‌ను కూడా మార్చాము.',
    time: new Date('2026-05-08T12:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.4.4',
    isSystemElement: true,
    version: 'v1.4.4',
    title: 'మే 08, 2026: PR Act Hub ఫీచర్స్',
    badge: 'NEW',
    text: 'మన పంచాయతీ సెక్షన్‌లోని PR Act Hub లో కొత్త సెర్చ్ ఫీచర్, క్విక్ జంప్ లింక్స్ మరియు ఒరిజినల్ PDF డౌన్‌లోడ్ చేసుకునే అవకాశం యాడ్ చేయడం జరిగింది.',
    time: new Date('2026-05-08T11:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.4.1',
    isSystemElement: true,
    version: 'v1.4.1',
    title: 'మే 08, 2026: వెబ్సైట్ విజిటర్ కౌంట్ అప్డేట్',
    badge: 'HOTFIX',
    text: 'గతంలో పోర్టల్ ని సందర్శించిన వారి సంఖ్య సరిగ్గా చూపించట్లేదు , ఇప్పుడు ఒరిజినల్ కౌంట్ కనిపించేలా విజిటర్ కౌంటర్ ని ఫిక్స్ చెయ్యడం జరిగింది.',
    time: new Date('2026-05-08T10:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.4.0',
    isSystemElement: true,
    version: 'v1.4.0',
    text: (
      <div className="text-left space-y-4">
        <div className="flex items-center gap-3">
          <kbd className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">v1.4.0</kbd>
          <p className="font-bold text-slate-800 text-lg flex items-center gap-2">మే 06, 2026: స్మార్ట్ అప్డేట్స్</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex gap-4 items-start">
            <kbd className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">NEW UI</kbd>
            <span className="text-sm text-slate-600 leading-relaxed"><strong>Applications, Formats & GOs:</strong> యూజర్స్ అందరు తమకు కావాల్సిన గవర్నమెంట్ అప్లికేషన్లు, ఫార్మాట్‌లు మరియు GOస్‌ను అప్లోడ్ (పబ్లిక్ అప్లోడ్) చేసుకుని ఇతరులకు షేర్ చేసుకునే మరియు సులభంగా వెతుక్కునే సదుపాయం.</span>
          </div>
          <div className="flex gap-4 items-start">
            <kbd className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">NEW PWA</kbd>
            <span className="text-sm text-slate-600 leading-relaxed"><strong>ఆటో-అప్డేట్ ఫీచర్ (Auto-Update Notifier):</strong> యాప్ లో ఎప్పటికప్పుడు కొత్త ఫీచర్స్ వచ్చిన వెంటనే స్క్రీన్ మీద పాపప్ ద్వారా తెలిసేలా స్మార్ట్ అలర్ట్ సిస్టమ్ జోడించాం.</span>
          </div>
        </div>
      </div>
    ),
    time: new Date('2026-05-06T10:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.3.0',
    isSystemElement: true,
    version: 'v1.3.0',
    text: (
      <div className="text-left space-y-4">
        <div className="flex items-center gap-3">
          <kbd className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">v1.3.0</kbd>
          <p className="font-bold text-slate-800 text-lg flex items-center gap-2">మే 01, 2026: డాక్యుమెంట్స్</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex gap-4 items-start">
            <kbd className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">PROFILE</kbd>
            <span className="text-sm text-slate-600 leading-relaxed"><strong>మై యాక్టివిటీ & రిపోర్ట్స్ (My Activity):</strong> యూజర్స్ తమ సొంత ప్రొఫైల్, వాళ్ళు పెట్టిన పోస్ట్‌లు మరియు పనుల గురించి రిపోర్ట్స్ చూసుకునే సెక్షన్ రడీ చేసాం.</span>
          </div>
          <div className="flex gap-4 items-start">
            <kbd className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">OFFLINE</kbd>
            <span className="text-sm text-slate-600 leading-relaxed"><strong>PWA యాప్ & ఆఫ్‌లైన్ సపోర్ట్:</strong> మొబైల్ లో ఒక యాప్ లా ఇన్స్టాల్ చేసుకునే అవకాశం మరియు ఇంటర్నెట్ లేనప్పుడు కూడా చూసిన డేటా చదువుకోగలిగే ఆఫ్‌లైన్ సపోర్ట్.</span>
          </div>
        </div>
      </div>
    ),
    time: new Date('2026-05-01T10:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.2.0',
    isSystemElement: true,
    version: 'v1.2.0',
    text: (
      <div className="text-left space-y-4">
        <div className="flex items-center gap-3">
          <kbd className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">v1.2.0</kbd>
          <p className="font-bold text-slate-800 text-lg flex items-center gap-2">ఏప్రిల్ 20, 2026: పర్సనలైజేషన్</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex gap-4 items-start">
            <kbd className="bg-purple-50 text-purple-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">CHAT</kbd>
            <span className="text-sm text-slate-600 leading-relaxed"><strong>లైవ్ చాట్ (Live Chat):</strong> యూజర్ల మధ్యన రియల్ టైం డిస్కషన్స్ మరియు ముఖ్యమైన విషయాల పంచుకోవడానికి పబ్లిక్ లైవ్ చాట్ గ్రూప్స్ ప్రారంభం.</span>
          </div>
          <div className="flex gap-4 items-start">
            <kbd className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">UNION</kbd>
            <span className="text-sm text-slate-600 leading-relaxed"><strong>యూనియన్ కార్నర్ (Union Corner):</strong> వివిధ ఎంప్లాయ్ యూనియన్స్ మరియు సంఘాల సమాచారం త్వరగా అందరికీ చేరేలా ఒక స్పెషల్ వాయిస్ బోర్డ్.</span>
          </div>
        </div>
      </div>
    ),
    time: new Date('2026-04-20T10:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'update-v1.0.1',
    isSystemElement: true,
    version: 'v1.0.1',
    text: (
      <div className="text-left space-y-4">
        <div className="flex items-center gap-3">
          <kbd className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">v1.0.1</kbd>
          <p className="font-bold text-slate-800 text-lg flex items-center gap-2">ఏప్రిల్ 15, 2026: కమ్యూనికేషన్</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex gap-4 items-start">
            <kbd className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">FEEDBACK</kbd>
            <span className="text-sm text-slate-600 leading-relaxed"><strong>సజెషన్స్ & ఫీడ్బ్యాక్ (Public Suggestions):</strong> ఎవరైనా సరే ఏమైనా కొత్త సజెషన్స్ ఇవ్వడానికి, లేదా కంప్లైంట్ ఇవ్వడానికి లైవ్ పబ్లిక్ సెక్షన్ మరియు ఓటింగ్ సిస్టమ్ జోడింపు.</span>
          </div>
        </div>
      </div>
    ),
    time: new Date('2026-04-15T10:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  },
  {
    id: 'foundation',
    isSystemElement: true,
    version: 'v1.0.0',
    text: (
      <div className="text-left space-y-4">
        <div className="flex items-center gap-3">
          <kbd className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">v1.0.0</kbd>
          <p className="font-bold text-slate-700 text-lg">ఏప్రిల్ 11, 2026: ఎలక్ట్రానిక్ వేదికకు నాంది. పబ్లిక్ ఎంగేజ్మెంట్ !</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-600 text-sm leading-relaxed">పంచాయతీ ఆపరేటర్ల మరియు ఉద్యోగుల డిజిటల్ అవసరాలకోసం మా కు వచ్చిన అమూల్యమైన ఆలోచనలతో ఎలక్ట్రానిక్ వేదికకు నాంది. గూగుల్ **Gemini** మరియు **Chat GPT** కృత్రిమ మేధస్సుల సహాయంతో ఈ పోర్టల్‌ తొలి విడుదల మరియు పబ్లిక్ ఆర్టికల్స్ సిస్టం ప్రారంభించాము.</p>
        </div>
      </div>
    ),
    time: new Date('2026-04-11T14:00:00Z').getTime(),
    type: 'changelog',
    status: 'Approved'
  }
];

export const handleShare = async (title: string, text: string, url: string, onSuccess?: () => void) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      if (error && error.name !== 'AbortError') {
        navigator.clipboard.writeText(url);
        if (onSuccess) onSuccess();
      }
    }
  } else {
    navigator.clipboard.writeText(url);
    if (onSuccess) onSuccess();
  }
};

if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
  ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID);
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }
  }, [location]);

  const [searchParams, setSearchParams] = useSearchParams();
  const postIdFromUrl = searchParams.get('postId');
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'user'>('user');
  const hasGreetedRef = useRef(false);

  const isDevEmail = user?.email?.toLowerCase() === 'rakeshkumardhawan123@gmail.com';
  const isAdmin = userRole === 'admin' || isDevEmail;
  const isEditor = userRole === 'admin' || userRole === 'editor' || isDevEmail;
  
  useEffect(() => {
    // Background prefetch for lazy loaded sections
    const prefetchAll = async () => {
      try {
        const prefetchPromises = [
          import('./pages/WorkspaceScreen'),
          import('./pages/AdminPanelScreen'),
          import('./pages/MyActivity'),
          import('./pages/ChatScreen'),
          import('./pages/KnowledgeHubScreen'),
          import('./pages/DirectoryScreen'),
          import('./pages/FormsHubScreen'),
          import('./pages/PollsScreen')
        ];
        // Suppress individual errors during background prefetch
        prefetchPromises.forEach(p => p.catch(() => {}));
      } catch (e) {}
    };
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => setTimeout(prefetchAll, 2000));
    } else {
      setTimeout(prefetchAll, 3000);
    }
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "denied" && Notification.permission !== "granted") {
      try {
        Notification.requestPermission();
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (userProfile?.theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [userProfile?.theme]);

  useEffect(() => {
    // Suppress benign Vite WebSocket error logs that confuse the user
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const msg = args[0];
      const isBenignError = typeof msg === 'string' && (
        msg.includes('WebSocket') || 
        msg.includes('vite') || 
        msg.includes('web-socket') ||
        msg.includes('closed without opened') ||
        msg.includes('connection failed') ||
        msg.includes('@firebase/firestore') ||
        msg.includes('WebChannelConnection')
      );
      
      // Check for error objects as well
      const isBenignErrorObject = msg instanceof Error && (
        msg.message.includes('WebSocket') ||
        msg.message.includes('closed without opened') ||
        msg.message.includes('vite') ||
        msg.message.includes('@firebase/firestore')
      );

      if (isBenignError || isBenignErrorObject) {
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const msg = args[0];
      if (typeof msg === 'string' && (
        msg.includes('WebSocket') || 
        msg.includes('vite') ||
        msg.includes('closed without opened') ||
        msg.includes('@firebase/firestore') ||
        msg.includes('WebChannelConnection')
      )) {
        return;
      }
      originalWarn.apply(console, args);
    };
    
    // Also suppress unhandled rejections related to the websocket
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const isBenign = 
        (reason && reason.message && (
          reason.message.includes('WebSocket') || 
          reason.message.includes('closed without opened')
        )) ||
        (typeof reason === 'string' && (
           reason.includes('WebSocket') || 
           reason.includes('closed without opened')
        ));

      if (isBenign) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const tabFromUrl = searchParams.get('tab');
  const [currentTab, setCurrentTab] = useState(tabFromUrl || 'home');

  // Sync tab with URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== currentTab) {
      setCurrentTab(tab);
    }
  }, [searchParams]);

  const changeTab = (newTab: string) => {
    setCurrentTab(newTab);
    const newParams = new URLSearchParams(searchParams);
    if (newTab === 'home') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', newTab);
    }
    setSearchParams(newParams);
  };
  
  const [activeInternalUrl, setActiveInternalUrl] = useState<string | null>(null);
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
  const [problemIsAnonymous, setProblemIsAnonymous] = useState(false);
  const [problemWantsWhatsApp, setProblemWantsWhatsApp] = useState(true);
  const [problemMessage, setProblemMessage] = useState("");
  const [isRecordingProblem, setIsRecordingProblem] = useState(false);
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
  const [districtsData, setDistrictsData] = useState<Record<string, string[]>>(DEFAULT_DISTRICTS_DATA);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'locations'), (snap) => {
      if (snap.exists() && snap.data().data) {
         setDistrictsData(snap.data().data);
      }
    });
    return () => unsub();
  }, []);
  
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
  const allUpdates = useMemo(() => {
    const merged = new Map<string, any>();
    SYSTEM_UPDATES.forEach(u => merged.set(u.id, { ...u, isSystem: true }));
    updates.forEach(u => {
      const existing = merged.get(u.id);
      merged.set(u.id, { ...existing, ...u, isSystem: !!existing });
    });
    return Array.from(merged.values());
  }, [updates]);

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
    // Visitor Count logic
    const unsubVisits = onSnapshot(doc(db, 'settings', 'site_stats'), (snap) => {
      if (snap.exists()) {
        setVisitorCount(snap.data().visitCount || 0);
      }
    });

    if (!sessionStorage.getItem('site_visited')) {
      sessionStorage.setItem('site_visited', 'true');
      const statsRef = doc(db, 'settings', 'site_stats');
      updateDoc(statsRef, { visitCount: increment(1) }).catch(async (e) => {
        if (e.code === 'not-found') {
          await setDoc(statsRef, { visitCount: 1 });
        }
      });
    }

    let initialUpdatesLoadedLocal = false;
    const unsubUpdates = onSnapshot(collection(db, 'updates'), (snap) => {
      const uArr: Update[] = [];
      snap.forEach(d => uArr.push({ id: d.id, ...(d.data() as any) } as Update));
      setUpdates(uArr);
      
      if (!initialUpdatesLoadedLocal) {
        initialUpdatesLoadedLocal = true;
      } else {
        const addedChanges = snap.docChanges().filter(change => change.type === 'added');
        if (addedChanges.length > 0) {
          const newUpdate = addedChanges[0].doc.data() as any;
          triggerNotification("New Flash Update!", newUpdate.title || newUpdate.msg || newUpdate.text || "Check out the latest update.");
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'updates'));
    
    const unsubSuggestions = onSnapshot(collection(db, 'suggestions'), (snap) => {
      const sArr: Suggestion[] = [];
      snap.forEach(d => sArr.push({ id: d.id, ...(d.data() as any) } as Suggestion));
      setSuggestions(sArr.sort((a, b) => (b.time || 0) - (a.time || 0)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'suggestions'));

    let initialPostsLoadedLocal = false;
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

      if (!initialPostsLoadedLocal) {
        initialPostsLoadedLocal = true;
      } else {
        const addedChanges = snap.docChanges().filter(change => change.type === 'added');
        if (addedChanges.length > 0) {
          const newPost = addedChanges[0].doc.data() as any;
          triggerNotification(`New Post: ${newPost.title || 'Platform Update'}`, newPost.content || "A new post has been published on E-Vedhika.");
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'posts'));

    return () => {
      unsubVisits();
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
        
        // Force profile setup only if basic details are missing to avoid annoying existing users
        if (!p.name && !p.username) {
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

    let initialNotificationsLoadedLocal = false;
    const unsub1 = onSnapshot(query(collection(db, 'notifications'), where('uid', 'in', [user.uid, 'all'])), (snap) => {
      const nArr: Notification[] = [];
      snap.forEach(d => nArr.push({ id: d.id, ...(d.data() as any) } as Notification));
      setNotifications(nArr.sort((a, b) => b.time - a.time).slice(0, 50));
      setUnreadCount(nArr.filter(n => n.uid === 'all' ? !(n as any).readBy?.includes(user?.uid) : !n.read).length);
      
      if (!initialNotificationsLoadedLocal) {
        initialNotificationsLoadedLocal = true;
      } else {
        const addedChanges = snap.docChanges().filter(change => change.type === 'added');
        if (addedChanges.length > 0) {
          const newNotif = addedChanges[0].doc.data() as any;
          triggerNotification(newNotif.title || "New Notification", newNotif.message || newNotif.msg || "You have a new notification");
        }
      }
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
      const post = posts.find(p => p.id === id);
      const userId = auth.currentUser?.uid;
      if (post && userId && !post.viewedBy?.includes(userId)) {
        try {
          await updateDoc(doc(db, 'posts', id), { 
            views: increment(1),
            viewedBy: arrayUnion(userId)
          });
        } catch (err) { console.error(err); }
      }
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
    return searchOk && (p.category === currentFilter || p.subCategory === currentFilter || p.categories?.includes(currentFilter));
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
                 updates={allUpdates}
                 userRole={userRole}
                 isDevEmail={isDevEmail}
                 currentAdminPin={currentAdminPin}
                 setCurrentAdminPin={setCurrentAdminPin}
                 users={allUsers}
                 user={user}
                 onExit={() => navigate('/')}
                 districtsData={districtsData}
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


  const handleRecordProblem = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast("Your browser does not support voice to text capability.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'te-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecordingProblem(true);
      addToast("🎤 రికార్డింగ్ ప్రారంభమైంది (Recording started)...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setProblemMessage(prev => prev ? prev + " " + transcript : transcript);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      addToast("రికార్డింగ్‌లో సమస్య ఏర్పడింది (Error recording). ");
      setIsRecordingProblem(false);
    };

    recognition.onend = () => {
      setIsRecordingProblem(false);
    };

    recognition.start();
  };


  const getTabMeta = () => {
    switch(currentTab) {
      case 'workspace': return { title: 'Mana Panchayath | E-Vedhika', desc: 'Workspace and Dashboard for E-Vedhika members.' };
      case 'chat': return { title: 'Live Chat | E-Vedhika', desc: 'Join the real-time discussion with your colleagues on E-Vedhika.' };
      case 'union': return { title: 'Union Corner & Polls | E-Vedhika', desc: 'Participate in polls, voice your opinions, and see union updates.' };
      case 'changelog': return { title: 'What\'s New! | E-Vedhika', desc: 'See the latest feature updates and releases for E-Vedhika platform.' };
      case 'suggestions': return { title: 'Public Suggestions | E-Vedhika', desc: 'Drop your valuable feedback and ideas directly to the admin panel.' };
      case 'gos_formats': return { title: 'GOs & Formats | E-Vedhika', desc: 'Download official forms, applications, and GO documents easily.' };
      case 'directory': return { title: 'Employees Directory | E-Vedhika', desc: 'Find information and contact details of state employees.' };
      case 'knowledge': return { title: 'Knowledge Hub | E-Vedhika', desc: 'Access study materials, service rules, test answers, and manuals.' };
      case 'emergency': return { title: 'Emergency Contacts | E-Vedhika', desc: 'Important emergency phone numbers and help links for immediate assistance.' };
      case 'my_activity': return { title: 'My Activity | E-Vedhika', desc: 'Track your personal suggestions, queries, and reports.' };
      case 'admin': return { title: 'Admin Panel | E-Vedhika', desc: 'Manage E-Vedhika platform content, users, and reports.' };
      case 'home':
      default: return { title: 'E-Vedhika | The Digital Panchayat', desc: 'Connect, share, and collaborate with your colleagues natively on E-Vedhika.' };
    }
  };

  const meta = getTabMeta();

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.desc} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.desc} />
      </Helmet>
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
                System Security Layer • E-VEDHIKA
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-[1001] shadow-2xl bg-[#103052] border-b-[3px] border-accent flex items-center">
        <div className="brand-wrapper cursor-pointer flex items-center gap-2 sm:gap-4 shrink-0" onClick={() => { changeTab('home'); setSidebarOpen(false); if (searchParams.has('postId')) { searchParams.delete('postId'); setSearchParams(searchParams); } }}>
          {/* లోగో HTML స్ట్రక్చర్ */}
          <div className="logo-pro cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-200 shrink-0">
            {/* యానిమేటెడ్ పార్టికల్స్ */}
            <div className="logo-particles">
              <span></span>
              <span></span>
              <span></span>
            </div>
            
            {/* SVG లోగో */}
            <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12 shrink-0">
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
          <div className="flex flex-col justify-center translate-y-[-1px] shrink min-w-0">
            <h2 className="brand-title text-lg sm:text-[20px] lg:text-[24px] truncate" style={{ 
              color: '#fbe947', 
              background: 'none',
              WebkitTextFillColor: 'initial',
              WebkitBackgroundClip: 'initial',
              filter: 'none',
              animation: 'none',
              fontWeight: '900',
              letterSpacing: '1px',
              fontFamily: '"Arial Black", Impact, sans-serif',
              lineHeight: '1.2',
             }}>E<span style={{color: '#facc15'}}>-</span>VEDHIKA</h2>
            <div className="flex items-center">
              <span className="whitespace-nowrap truncate" style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#94a3b8', textTransform: 'uppercase' }}>
                all problems one solution
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-2 sm:gap-5">
          <div className="flex flex-col items-center justify-center mr-2 sm:mr-4 shrink-0" title="Total Website Visits">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#94a3b8] mb-[2px]">Visits</span>
            <span className="text-[11px] font-mono font-black text-[#60a5fa] bg-[#0f2e4a] px-2 py-0.5 rounded-md border border-[#1e40af]/30 shadow-inner">
              {visitorCount !== null ? (visitorCount + 12345).toLocaleString() : '-----'}
            </span>
          </div>

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

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            aria-label="Share Link"
            title="Copy link to this section"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              addToast("Link copied to clipboard!");
            }}
            className="p-2 sm:p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95 flex items-center justify-center -mr-2"
          >
            <Share2 size={18} />
          </button>
          
          <div 
            className="notif-bell p-2 sm:p-2.5 cursor-pointer -mr-2"
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
                        {notifications.map(n => {
                          const isUnread = n.uid === 'all' ? !(n as any).readBy?.includes(user?.uid) : !n.read;
                          return (
                          <div 
                            key={n.id} 
                            onClick={async () => {
                              if (isUnread) {
                                try {
                                  if (n.uid === 'all') {
                                    await updateDoc(doc(db, 'notifications', n.id), { readBy: arrayUnion(user?.uid) });
                                  } else {
                                    await updateDoc(doc(db, 'notifications', n.id), { read: true });
                                  }
                                } catch(e) {}
                              }
                              if ((n as any).postId) {
                                setSearchParams({ postId: (n as any).postId });
                              }
                              setShowNotifications(false);
                            }}
                            className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${isUnread ? 'bg-blue-50/30' : ''}`}
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
                          );
                        })}
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
            <MenuButton label="Home" emoji="🏠" active={currentTab === 'home' && !postIdFromUrl} onClick={() => {
               changeTab('home'); 
               setCurrentFilter('All'); 
               setSidebarOpen(false);
               if (searchParams.has('postId')) { searchParams.delete('postId'); setSearchParams(searchParams); }
            }} />
            <MenuButton label="🏛️ Mana Panchayath" emoji="📊" active={currentTab === 'workspace'} onClick={() => {changeTab('workspace'); setSidebarOpen(false);}} />
            <MenuButton label="Live Chat" emoji="💬" active={currentTab === 'chat'} onClick={() => {changeTab('chat'); setSidebarOpen(false);}} />
            <MenuButton label="Union Corner & Polls" emoji="🤝" active={currentTab === 'union'} onClick={() => {changeTab('union'); setSidebarOpen(false);}} />
            <MenuButton label="What's New! 🚀" emoji="✨" active={currentTab === 'changelog'} onClick={() => {changeTab('changelog'); setSidebarOpen(false);}} />
            <MenuButton label="💡 Public suggestions & Feedback" emoji="💡" active={currentTab === 'suggestions'} onClick={() => {changeTab('suggestions'); setSidebarOpen(false);}} />
            <MenuButton label="📑 Applications, Formats & GOs" emoji="📑" active={currentTab === 'gos_formats'} onClick={() => {changeTab('gos_formats'); setSidebarOpen(false);}} />
            <MenuButton label="🚨 Emergency Contacts" emoji="🚨" active={currentTab === 'emergency'} onClick={() => {changeTab('emergency'); setSidebarOpen(false);}} />
            <MenuButton label="👤 My Activity & Reports" emoji="📋" active={currentTab === 'my_activity'} onClick={() => {
               if(!user) {
                  requireLoginAlert();
               } else {
                  changeTab('my_activity'); 
                  setSidebarOpen(false);
               }
            }} />
            <MenuButton label="🔗 Useful Information" emoji="🔗" active={currentTab === 'useful_links'} onClick={() => {
               changeTab('useful_links');
               setSidebarOpen(false);
            }} />

            
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
               allUsers={allUsers}
            />
          ) : (
            <AnimatePresence mode="wait">
              {currentTab === 'home' && (
                <motion.div key="home" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 sm:space-y-6">

                  <AdBanner />

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
                        className="w-full mt-6 bg-slate-50 border-2 border-dashed border-slate-200 p-6 sm:p-8 rounded-[28px] text-slate-400 font-bold hover:bg-slate-100 hover:border-primary/20 transition-all flex flex-col items-center gap-3"
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
                      {filteredPosts.flatMap((post, index) => {
                        const items = [
                          <motion.div key={post.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                            <PostCard 
                              post={post} 
                              isExpanded={expandedPosts.has(post.id)} 
                              toggleExpansion={() => togglePostExpansion(post.id)} 
                              addToast={addToast} 
                              isAdmin={isEditor} 
                              onEdit={(p) => { setEditingPost(p); setShowPostForm(true); }} 
                              allUsers={allUsers}
                            />
                          </motion.div>
                        ];
                        if ((index + 1) % 5 === 0) {
                          items.push(
                            <motion.div key={`ad-${post.id}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                              <AdBanner />
                            </motion.div>
                          );
                        }
                        return items;
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            
            {currentTab === 'workspace' && (
              <motion.div key="workspace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AdBanner />
                <DigitalWorkspaceSection addToast={addToast} user={user} />
              </motion.div>
            )}

            {currentTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Loading Live Chat...</div>}>
                  <ChatSection messages={chatMessages} user={user} addToast={addToast} userProfile={userProfile} />
                </Suspense>
              </motion.div>
            )}

            {currentTab === 'union' && (
              <motion.div key="union" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex justify-between items-center mb-4">
                  <button aria-label="Back to Dashboard" onClick={() => changeTab('home')} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                    <ArrowLeft size={16} /> Back to Dashboard
                  </button>
                </div>
                <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Loading Polls...</div>}>
                  <PollsScreen user={user} addToast={addToast} />
                </Suspense>
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

                   {allUpdates.filter(u => u.type === 'changelog' && u.status?.toLowerCase() !== 'deleted').sort((a: any, b: any) => (b.time || 0) - (a.time || 0)).map((u: any, i) => (
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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2">
                               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                 <h3 className="text-sm sm:text-base font-black text-slate-800">
                                   {u.version ? `Update ${u.version}` : (u.id === 'foundation' ? 'Foundation Launch' : (u.isAutoPost ? 'Community Notice' : 'System Update'))}
                                 </h3>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md w-max">
                                   {new Date(getValidTime(u)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                 </span>
                               </div>
                               <button 
                                 onClick={() => {
                                   const textToShare = u.title ? `${u.version ? u.version + ' ' : ''}${u.title}\n\n${u.text}` : u.text;
                                   handleShare('E-Vedhika Update', typeof textToShare === 'string' ? textToShare : 'Check out this update on E-Vedhika', window.location.origin, () => addToast("Link copied!"));
                                 }}
                                 className="hidden sm:flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-lg hover:bg-slate-50 shrink-0"
                                 title="Share Update"
                               >
                                 <Share2 size={16} />
                               </button>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow w-full overflow-hidden">
                               {(u.version || u.title || u.badge) ? (
                                  <div className="text-left space-y-4">
                                    {(u.version || u.title) && (
                                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        {u.version && <kbd className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">{u.version}</kbd>}
                                        {u.title && <p className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">{u.title}</p>}
                                      </div>
                                    )}
                                    <div className="bg-slate-50 sm:bg-white p-4 sm:p-5 rounded-2xl sm:border border-slate-100 sm:shadow-sm space-y-4 w-full">
                                      <div className="flex gap-3 sm:gap-4 items-start w-full">
                                        {u.badge && <kbd className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">{u.badge}</kbd>}
                                        <span className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap flex-1">{u.text}</span>
                                      </div>
                                    </div>
                                  </div>
                               ) : (
                                  <div className="text-[14px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {u.text}
                                  </div>
                               )}
                            </div>
                         </div>
                      </motion.div>
                   ))}
                </div>
              </motion.div>
            ) }

            {currentTab === 'emergency' && (
              <motion.div key="emergency" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[60vh]">
                  <div className="border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-xl sm:text-2xl font-black text-rose-600 flex flex-row items-center flex-wrap gap-2">
                       <span>🚨 Emergency & Helpline Contacts</span>
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">అత్యవసర ఫోన్ నంబర్లు</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                       { name: 'Police (పోలీస్)', number: '100', icon: '🚓', color: 'blue' },
                       { name: 'Ambulance (అంబులెన్స్)', number: '108', icon: '🚑', color: 'rose' },
                       { name: 'Fire (అగ్నిమాపక దళం)', number: '101', icon: '🚒', color: 'red' },
                       { name: 'Women Helpline (మహిళల హెల్ప్‌లైన్)', number: '1091', icon: '🛡️', color: 'purple' },
                       { name: 'Child Helpline (ఛైల్డ్ హెల్ప్‌లైన్)', number: '1098', icon: '👶', color: 'amber' },
                       { name: 'Cyber Crime (సైబర్ క్రైమ్)', number: '1930', icon: '💻', color: 'indigo' },
                       { name: 'Anti-Corruption (అవినీతి నిరోధక)', number: '14400', icon: '⚖️', color: 'slate' },
                       { name: 'Farmers Helpline (రైతుల హెల్ప్‌లైన్)', number: '155251', icon: '🌾', color: 'green' },
                       { name: 'Disha Helpline (దిశ)', number: '181', icon: '👩', color: 'pink' }
                    ].map((contact, i) => (
                      <div key={i} className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-rose-200 hover:shadow-md transition-all">
                         <div className="flex items-center gap-4">
                            <div className="text-3xl lg:text-4xl group-hover:scale-110 transition-transform">{contact.icon}</div>
                            <div>
                               <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-tight">{contact.name}</div>
                               <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tighter mt-1">{contact.number}</div>
                            </div>
                         </div>
                         <a href={`tel:${contact.number}`} className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500 hover:bg-green-500 hover:text-white transition-colors border border-green-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                         </a>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentTab === 'suggestions' && (
              <motion.div key="suggestions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AdBanner />
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
                                <p className="text-[13px] text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{s.msg || s.suggestion}</p>
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
                        const mobile = target.mobile ? target.mobile.value.trim() : '';
                        const category = target.category.value;
                        const suggestion = target.suggestion.value.trim();

                        if (!name || !village || !category || !suggestion || (userProfile?.gender !== 'Female' && !mobile)) {
                          return addToast("దయచేసి అన్ని వివరాలు నింపండి (Please fill all fields)");
                        }

                        if (mobile && !/^[0-9]{10}$/.test(mobile)) {
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
                          if (target.mobile) target.mobile.value = userProfile?.mobile || '';
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
                           {userProfile?.gender !== 'Female' && (
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
                           )}
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

            {currentTab === 'gos_formats' && (
              <motion.div key="gos_formats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <GosAndFormatsPublic user={user} addToast={addToast} isAdmin={isAdmin} />
              </motion.div>
            )}

            {currentTab === 'useful_links' && (
              <motion.div key="useful_links" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="section-card card-indigo">
                  <h2 className="text-2xl font-black text-indigo-900 mb-6 flex items-center gap-2">
                    <ExternalLink size={24} className="text-indigo-600" /> Useful Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: 'ePanchayat Home', desc: 'Panchayat Raj & Rural Development Home', url: 'https://epanchayat.telangana.gov.in/', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                      { name: 'Online Tax Collection Report R 2.1 House Tax DCB', desc: 'Property Tax Payment & Search Portal', url: 'https://epanchayat.telangana.gov.in/epmis/epmisPRHTAXDCBLive.jsp', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                      { name: 'UBD Portal', desc: 'Urban Building Department Telangana', url: 'https://ubd.telangana.gov.in/', color: 'bg-rose-50 text-rose-700 border-rose-100' },
                      { name: 'UBD MIS Total Status', desc: 'Urban Building Department Total Status Report', url: 'https://ubdmis.telangana.gov.in/ubdmisTGTotalStatus.do?rlb_type=3&pstcode=35&style=bluetheme', color: 'bg-pink-50 text-pink-700 border-pink-100' },
                      { name: 'TSEC-Te Poll login', desc: 'State Election Commission Login', url: 'https://tsec.telangana.gov.in/', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                      { name: 'eGramSwaraj', desc: 'Simplified Work Based Accounting System', url: 'https://egramswaraj.gov.in/', color: 'bg-orange-50 text-orange-700 border-orange-100' },
                      { name: 'PFMS Portal', desc: 'Public Financial Management System', url: 'https://pfms.nic.in/', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                      { name: 'AuditOnline Portal', desc: 'Online Audit for Panchayati Raj', url: 'https://auditonline.gov.in/', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                      { name: 'LGdirectory Portal', desc: 'Local Government Directory Services', url: 'https://lgdirectory.gov.in/', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
                      { name: 'GPDP Portal', desc: 'ఇది MPDO/ MPO లోగిన్స్ ద్వార GPDP కోసం గ్రామా సభ తాయారు చేసే సైట్', url: 'https://gpdp.nic.in/', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                      { name: 'Panchayat Awards Portal', desc: 'National Panchayat Awards System', url: 'https://panchayataward.gov.in/', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                      { name: 'DARPG Awards Portal', desc: 'Administrative Reforms Awards Portal', url: 'https://da-awards.gov.in/', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                      { name: 'DARPG Reports', desc: 'Committee Recommendation Status Reports', url: 'https://reports.darpg.gov.in/', color: 'bg-slate-50 text-slate-700 border-slate-100' },
                      { name: 'Panchayat Nirnay Portal', desc: 'ఇది మనమ GPDP కోసం Theams సెలెక్ట్ చేసుకునే వెబ్సైటు', url: 'https://meetingonline.gov.in/homepage/official-login', color: 'bg-orange-50 text-orange-700 border-orange-100' }
                    ].map(link => (
                      <a 
                        key={link.name} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`p-5 rounded-3xl border transition-all hover:scale-[1.02] active:scale-95 flex flex-col gap-2 shadow-sm ${link.color}`}
                      >
                        <h4 className="font-black uppercase tracking-tight text-[11px] leading-tight flex-1">{link.name}</h4>
                        <p className="text-[10px] font-bold opacity-80 leading-relaxed">{link.desc}</p>
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest leading-none">
                          Visit Portal <ArrowUpRight size={14} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentTab === 'my_activity' && (
              <motion.div key="my_activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Loading My Activity...</div>}>
                  <MyActivity 
                    user={user} 
                    userProfile={userProfile} 
                    problems={problemsGlobal} 
                    suggestions={approvedSuggestions} 
                    posts={posts} 
                  />
                </Suspense>
              </motion.div>
            )}



            {currentTab === 'problems' && (
              <motion.div key="problems" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex justify-between items-center mb-4">
                  <button aria-label="Back to Dashboard" onClick={() => changeTab('home')} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
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
                       if (requireLoginAlert(user)) return;
                       try {
                         await addDoc(collection(db, 'problems'), {
                           msg: problemMessage,
                           category: cat,
                           status: 'pending',
                           time: Date.now(),
                           uid: user.uid,
                           isAnonymous: problemIsAnonymous,
                           wantsWhatsAppUpdates: problemWantsWhatsApp
                         });
                         await logUserActivity(`Reported Problem: ${cat}`);
                         addToast("Problem reported successfully!" + (problemWantsWhatsApp ? " You will receive SMS/WhatsApp updates." : ""));
                         target.reset();
                         setProblemMessage("");
                         setProblemIsAnonymous(false);
                         setProblemWantsWhatsApp(true);
                       } catch(err) { handleFirestoreError(err, OperationType.WRITE, 'problems'); }
                     }} className="space-y-4">
                       <input name="category" placeholder="Category (e.g. Aadhar, Water, Tax)" required className="bg-white w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-danger/20" />
                       <div className="relative">
                         <textarea 
                           name="message" 
                           placeholder="Explain your problem in detail (or use voice to text)..." 
                           required 
                           rows={3} 
                           className="bg-white w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-danger/20" 
                           value={problemMessage}
                           onChange={e => setProblemMessage(e.target.value)}
                         />
                         <button 
                           type="button" 
                           onClick={handleRecordProblem}
                           className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${isRecordingProblem ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                           title="Voice to text"
                         >
                           <Mic size={18} />
                         </button>
                       </div>
                       
                       <div className="flex flex-col sm:flex-row gap-4 mt-2">
                         <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none">
                            <input type="checkbox" checked={problemIsAnonymous} onChange={e => setProblemIsAnonymous(e.target.checked)} className="w-4 h-4 rounded text-danger focus:ring-danger" />
                            Anonymous Reporting (పేరు బయటపెట్టకుండా)
                         </label>
                         <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none">
                            <input type="checkbox" checked={problemWantsWhatsApp} onChange={e => setProblemWantsWhatsApp(e.target.checked)} className="w-4 h-4 rounded text-green-600 focus:ring-green-600" />
                            Get updates on WhatsApp/SMS
                         </label>
                       </div>

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

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                          <span className="text-xs font-bold text-slate-400">
                             {p.isAnonymous ? "Anonymous User" : "Citizen"}
                          </span>
                          <button 
                            onClick={() => {
                               const shareText = `Please support this issue in our village app:\nCategory: ${p.category}\nProblem: ${p.msg}`;
                               if (navigator.share) {
                                 navigator.share({ title: 'Important Issue', text: shareText }).catch(console.error);
                               } else {
                                 window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                               }
                            }}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors uppercase tracking-widest"
                          >
                            <Share2 size={14} /> Share Issue
                          </button>
                        </div>
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
                        districtsData={districtsData}
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
                          changeTab('home');
                        }}
                        user={user} 
                        userProfile={userProfile} 
                        addToast={addToast}
                        isForced={showForcedProfileSetup}
                        onComplete={() => setShowForcedProfileSetup(false)}
                        districtsData={districtsData}
                      />
                    )}
      </main>
      <ManaBot currentTab={currentTab} userName={userProfile?.name} />
    </div>
  </div>
  </>
);
}

function EditProfileModal({ onClose, onExitForced, user, userProfile, addToast, isForced, onComplete, districtsData }: { onClose: () => void, onExitForced?: () => void, user: any, userProfile: UserProfile | null, addToast: (s:string) => void, isForced?: boolean, onComplete?: () => void, districtsData: Record<string, string[]> }) {
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
  const [theme, setTheme] = useState<'light'|'dark'>(userProfile?.theme || 'light');
  const [notifications, setNotifications] = useState(userProfile?.notifications ?? true);
  const [saving, setSaving] = useState(false);

  const mandals = district ? districtsData[district] || [] : [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!username || !name || !surname || (gender !== 'Female' && !mobile)) {
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
        theme,
        notifications,
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
               <select value={gender} onChange={e => {
                  setGender(e.target.value);
                  if (e.target.value === 'Female') setMobile('');
               }} className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs">
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
               </select>
             </div>
             {gender !== 'Female' && (
             <div>
               <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Mobile No *</label>
               <input value={mobile} onChange={e => setMobile(e.target.value)} required className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" placeholder="Mobile Number" />
             </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">State</label>
               <select className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl outline-none font-bold text-xs cursor-not-allowed" disabled>
                  <option>Telangana</option>
               </select>
             </div>
             <div>
               <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">District</label>
               <select value={district} onChange={e => { setDistrict(e.target.value); setMandal(''); }} className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs">
                  <option value="">Select District</option>
                  {Object.keys(districtsData).sort().map(d => <option key={d}>{d}</option>)}
               </select>
             </div>
          </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Mandal</label>
                   <select value={mandal} onChange={e => setMandal(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" disabled={!district}>
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
            <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Designation</label>
            <input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Type Designation (e.g. e-Panchayat, MPO)" className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" />
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">Office Address</label>
            <input value={office} onChange={e => setOffice(e.target.value)} placeholder="Office location / Building" className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                 <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[10px] font-black uppercase text-slate-600">Dark Theme</span>
                    <input type="checkbox" checked={theme === 'dark'} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} className="w-4 h-4 accent-primary" />
                 </label>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                 <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[10px] font-black uppercase text-slate-600">Notifications</span>
                    <input title="In-App Notifications" type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} className="w-4 h-4 accent-primary" />
                 </label>
             </div>
             <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-500 rounded-bl-full opacity-10 group-hover:opacity-20 transition-all"></div>
                 <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[10px] font-black uppercase text-indigo-700">Push Alerts</span>
                    <input title="Desktop/Mobile Push Notifications" type="checkbox" onChange={(e) => {
                         if (e.target.checked && "Notification" in window) {
                             window.Notification.requestPermission();
                         }
                    }} defaultChecked={"Notification" in window && window.Notification.permission === "granted"} className="w-4 h-4 accent-indigo-600" />
                 </label>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                 <label className="flex items-center justify-between cursor-pointer opacity-60">
                    <span className="text-[10px] font-black uppercase text-slate-600">Email Alerts</span>
                    <input type="checkbox" disabled className="w-4 h-4 accent-primary cursor-not-allowed" />
                 </label>
             </div>
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

export function LocationManager({ districtsData, addToast }: { districtsData: Record<string, string[]>, addToast: (s: string) => void }) {
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
  const [newDistrict, setNewDistrict] = useState('');
  const [newMandalMap, setNewMandalMap] = useState<Record<string, string>>({});

  const writeData = async (data: Record<string, string[]>) => {
    try {
      await setDoc(doc(db, 'settings', 'locations'), { data, updatedAt: Date.now() }, { merge: true });
      addToast("Locations successfully updated.");
    } catch (e: any) {
      addToast("Error updating locations");
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h4 className="text-2xl font-black text-primary mb-1">Location Management</h4>
            <p className="text-xs text-slate-400 font-medium tracking-tight">Add or remove districts and mandals available in the system dropdowns.</p>
         </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
         <div className="flex-1">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Add New District</h5>
            <input value={newDistrict} onChange={e => setNewDistrict(e.target.value)} placeholder="e.g. Medchal-Malkajgiri" className="w-full bg-white border-none p-4 rounded-2xl outline-none font-bold text-sm shadow-sm" />
         </div>
         <div className="flex items-end">
            <button aria-label="Add District" onClick={() => {
              if(!newDistrict) return;
              if (districtsData[newDistrict.trim()]) { addToast("District already exists"); return; }
              const updated = { ...districtsData, [newDistrict.trim()]: [] };
              writeData(updated);
              setNewDistrict('');
            }} className="h-[52px] px-6 bg-[#0f2e4a] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-colors shadow-lg active:scale-95 flex items-center justify-center">
              Add District
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {Object.keys(districtsData).sort().map(d => (
            <div key={d} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col group">
               <div className="p-5 flex items-center justify-between bg-slate-50/50 group-hover:bg-slate-50 transition-colors">
                  <h3 className="font-black text-[#0f2e4a] flex items-center gap-2">
                     <MapPin size={16} className="text-blue-500" />
                     {d}
                  </h3>
                  <div className="flex gap-2">
                     <button aria-label="Toggle Expand" onClick={() => setExpandedDistrict(expandedDistrict === d ? null : d)} className="p-2 text-slate-400 hover:text-[#0f2e4a] hover:bg-slate-200/50 rounded-xl transition-colors">
                       <ChevronRight size={18} className={`transition-transform ${expandedDistrict === d ? 'rotate-90' : ''}`} />
                     </button>
                     <button aria-label="Delete District" onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${d} and all its mandals?`)) {
                           const updated = { ...districtsData };
                           delete updated[d];
                           writeData(updated);
                        }
                     }} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={16} />
                     </button>
                  </div>
               </div>
               
               {expandedDistrict === d && (
                 <div className="p-5 border-t border-slate-100 bg-white">
                    <div className="flex gap-2 mb-4">
                       <input 
                         value={newMandalMap[d] || ''} 
                         onChange={e => setNewMandalMap({ ...newMandalMap, [d]: e.target.value })} 
                         placeholder="New Mandal Name" 
                         className="flex-1 bg-slate-50 border border-slate-200 outline-none p-3 rounded-xl font-bold text-xs" 
                         onKeyDown={e => {
                           if (e.key === 'Enter') {
                             const m = newMandalMap[d]?.trim();
                             if(m) {
                               const updated = { ...districtsData, [d]: [...(districtsData[d]||[]).filter(x => x!==m), m].sort() };
                               writeData(updated);
                               setNewMandalMap({...newMandalMap, [d]: ''});
                             }
                           }
                         }}
                       />
                       <button aria-label="Add Mandal" onClick={() => {
                          const m = newMandalMap[d]?.trim();
                          if(m) {
                            const updated = { ...districtsData, [d]: [...(districtsData[d]||[]).filter(x => x!==m), m].sort() };
                            writeData(updated);
                            setNewMandalMap({...newMandalMap, [d]: ''});
                          }
                       }} className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold transition-colors">
                         <Plus size={16} />
                       </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                       {districtsData[d].map((m: string) => (
                         <div key={m} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600">{m}</span>
                            <button aria-label="Delete Mandal" onClick={() => {
                               const updated = { ...districtsData, [d]: districtsData[d].filter((x: string) => x !== m) };
                               writeData(updated);
                            }} className="text-slate-300 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-0.5 rounded-full">
                               <X size={12} />
                            </button>
                         </div>
                       ))}
                       {districtsData[d].length === 0 && (
                          <div className="w-full p-4 text-center text-xs font-bold text-slate-300 border-2 border-dashed border-slate-100 rounded-xl">No mandals added yet.</div>
                       )}
                    </div>
                 </div>
               )}
            </div>
         ))}
      </div>
    </div>
  );
}

const MyActivity = lazy(() => import('./pages/MyActivity'));


const AdminPanel = lazy(() => import("./pages/AdminPanelScreen"));


const DigitalWorkspaceSection = lazy(() => import("./pages/WorkspaceScreen"));

function AdBanner({ slotId = "5641797386" }: { slotId?: string }) {
  // Ads hidden as requested
  return null;
}

function UsersListModal({ title, uids, allUsers, onClose }: { title: string, uids: string[], allUsers: UserProfile[], onClose: () => void }) {
  const usersList = uids.map(uid => allUsers.find(u => u.id === uid) || { id: uid, username: 'Unknown User', name: '', surname: '', designation: '' } as any);

  return (
    <div className="fixed inset-0 z-[4000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm max-h-[80vh] overflow-y-auto bg-white rounded-3xl shadow-2xl custom-scrollbar p-6 relative">
         <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
            <X size={16} />
         </button>
         <h3 className="font-black text-primary text-xl mb-4 uppercase tracking-widest">{title} <span className="text-slate-400 text-sm">({uids.length})</span></h3>
         <div className="space-y-3">
            {usersList.length === 0 && <p className="text-slate-400 text-xs font-bold text-center py-4 uppercase">No users found</p>}
            {usersList.map((u, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center uppercase overflow-hidden text-xs">
                       {(u as any).photoURL ? <img src={(u as any).photoURL} alt="" /> : (u.username?.[0] || 'U')}
                    </div>
                    <div>
                       <h4 className="text-xs font-black text-slate-800 leading-tight">{(u.name && u.surname) ? `${u.name} ${u.surname}` : u.username}</h4>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{u.designation || 'User'}</p>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}

function PostCard({ post, isExpanded, toggleExpansion, addToast, isAdmin, onEdit, allUsers }: { post: Post, isExpanded: boolean, toggleExpansion: () => void, addToast: (s:string) => void, isAdmin: boolean, onEdit: (p: Post) => void, allUsers: UserProfile[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isOwner = Boolean((auth.currentUser && post.uid && auth.currentUser.uid === post.uid) || isAdmin);
  const postTime = getValidTime(post);
  
  const [showComments, setShowComments] = useState(false);
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (showComments) {
      const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('time', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const fetchedComments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setComments(fetchedComments);
        setCommentsLoaded(true);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `posts/${post.id}/comments`));
      return () => unsub();
    }
  }, [showComments, post.id]);

  return (
    <motion.div layout className="post-card">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-primary font-black overflow-hidden border shadow-sm">
           {post.userPhoto ? <img src={post.userPhoto} alt={post.userName || "Author"} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="text-lg">{(post.userName || 'U').charAt(0).toUpperCase()}</div>}
        </div>
        <div className="flex-1">
           <div className="flex items-center gap-2">
              <h5 className="text-[17px] font-black text-primary leading-tight">{post.userName || 'Portal Member'}</h5>
              {(post.isAdminPost) && (
                 <span className="bg-blue-600 text-white text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                   <ShieldCheck size={10} /> Official
                 </span>
              )}
           </div>
           <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase mt-1">
              <Clock size={12} />
              <span>{new Date(postTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span className="text-primary/70">{post.categories && post.categories.length > 0 ? post.categories.join(", ") : (post.category || 'Update')}</span>
           </div>
        </div>
        
        <div className="flex gap-2">
           {isOwner && (
              <>
                {isAdmin && <button onClick={() => onEdit(post)} className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-primary transition-all rounded-lg" title="Edit"><Edit3 size={16} /></button>}
                <button aria-label="Delete Post" onClick={async () => {
                  const res = await Swal.fire({ title: 'Delete?', text: 'Move this post to recycle bin?', icon: 'warning', showCancelButton: true });
                  if (res.isConfirmed) {
                    try {
                      await updateDoc(doc(db, 'posts', post.id), { status: 'Deleted', deletedAt: Date.now() });
                      addToast("Moved to recycle bin");
                    } catch (err: any) {
                      addToast("Failed to delete post. " + err.message);
                    }
                  }
                }} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-danger transition-all rounded-lg" title="Delete"><Trash2 size={16} /></button>
              </>
           )}
        </div>
      </div>
      
      <h4 className="post-title !mt-0 whitespace-pre-wrap">{formatPostTitle(post.title) || 'Platform Update'}</h4>
      
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-200/50">
              <Hash size={10} strokeWidth={3} /> {tag}
            </span>
          ))}
        </div>
      )}

      <div className={`post-body mb-4 whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-4'} [&_pre]:bg-slate-800 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:text-rose-500 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:px-0 [&_pre_code]:py-0 [&_p]:mb-2 [&_a]:text-blue-600 [&_a]:underline`}>
        <ReactMarkdown remarkPlugins={[remarkBreaks]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>{post.content || ''}</ReactMarkdown>
      </div>

      {post.content && post.content.length > 200 && !isExpanded && (
        <button aria-label="Read Post" onClick={() => setSearchParams({ postId: post.id })} className="text-xs font-black text-primary uppercase underline underline-offset-4 mb-4 block hover:text-blue-600 transition-colors">
          Read Post
        </button>
      )}

      {post.websiteName && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between mb-4 group hover:bg-blue-100/50 transition-colors">
           <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-wider">
              <div className="w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center">
                <ExternalLink size={12} strokeWidth={3} />
              </div>
              {post.websiteName} Issue / Problem
           </div>
           <Target size={14} className="text-primary/40 group-hover:text-primary transition-colors" />
        </div>
      )}

      {post.mediaUrl && (
        <div className="mb-4">
          {post.mediaType?.startsWith('video') ? (
            <video src={post.mediaUrl} controls className="post-media" />
          ) : post.mediaType?.startsWith('image') ? (
            <img src={post.mediaUrl} alt={post.title} className="post-media" loading="lazy" />
          ) : (
            <a href={post.mediaUrl} download={post.mediaName || 'Document'} target="_blank" rel="noreferrer" className="flex items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-primary/30 transition-colors w-full group">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex flex-shrink-0 items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-slate-800 text-sm truncate">{post.mediaName || 'Attached Document'}</h5>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">Download File</p>
              </div>
              <Download size={20} className="text-slate-400 group-hover:text-primary transition-colors ml-4" />
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 justify-between items-center pt-6 border-t border-slate-100 mt-6">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button aria-label="Like Post"
                onClick={async (e) => {
                  e.stopPropagation();
                  const userId = auth.currentUser?.uid;
                  if (requireLoginAlert()) return;
                  const likedBy = post.likedBy || [];
                  try {
                    if (likedBy.includes(userId)) {
                      await updateDoc(doc(db, 'posts', post.id), {
                        likes: increment(-1),
                        likedBy: arrayRemove(userId)
                      });
                    } else {
                      await updateDoc(doc(db, 'posts', post.id), {
                        likes: increment(1),
                        likedBy: arrayUnion(userId)
                      });
                    }
                  } catch (err: any) {
                    addToast("Error updating like: " + err.message);
                  }
                }} 
                className={`flex items-center gap-2 p-2 rounded-xl transition-all ${post.likedBy?.includes(auth.currentUser?.uid || '') ? 'bg-rose-50 text-rose-500' : 'hover:bg-slate-50 text-slate-400'}`}
              >
                <Heart size={18} fill={post.likedBy?.includes(auth.currentUser?.uid || '') ? 'currentColor' : 'none'} />
                <span onClick={(e) => { if (isAdmin && post.likes > 0) { e.stopPropagation(); setShowLikesModal(true); } }} className={`text-sm font-black ${isAdmin && post.likes > 0 ? "hover:underline cursor-pointer" : ""}`}>{post.likes || 0}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
               <div className="flex items-center gap-2 p-2 text-slate-400 cursor-pointer hover:bg-slate-50 rounded-xl transition-all" onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}>
                  <MessageSquare size={18} />
                  <span className="text-sm font-black">{post.commentCount || 0}</span>
               </div>
            </div>

            <div className="flex items-center gap-2">
               <div onClick={(e) => { if (isAdmin && post.views > 0) { e.stopPropagation(); setShowViewsModal(true); } }} className={`flex items-center gap-2 p-2 text-slate-400 rounded-xl transition-all ${isAdmin && post.views > 0 ? "cursor-pointer hover:bg-slate-50" : ""}`}>
                  <Eye size={18} />
                  <span className={`text-sm font-black ${isAdmin && post.views > 0 ? "hover:underline cursor-pointer" : ""}`}>{post.views || 0}</span>
               </div>
            </div>
         </div>

         <button aria-label="Share Post" onClick={(e) => { 
            e.stopPropagation(); 
            const url = `${window.location.origin}/?postId=${post.id}`;
            handleShare(post.title || 'Shared Post', 'Check out this post on E-Vedhika', url, () => addToast("Link Copied!"));
         }} className="flex items-center gap-2 p-2 px-4 rounded-xl text-primary font-black text-xs uppercase bg-slate-50 hover:bg-primary hover:text-white transition-all">
            <Share2 size={16} strokeWidth={2.5} />
            <span>Share</span>
         </button>
      </div>

      {showComments && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="space-y-4 mb-4">
            {comments.map(c => (
              <div key={c.id} className="text-sm bg-slate-50 p-3 rounded-2xl">
                <span className="font-black text-primary mr-2 uppercase text-[10px]">{c.userName}:</span>
                <span className="text-slate-600">{c.text}</span>
              </div>
            ))}
            {comments.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">No comments yet</p>}
          </div>
          <div className="flex gap-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-slate-50 px-4 py-2 rounded-xl text-sm border-2 border-transparent focus:border-primary/20 outline-none" />
            <button onClick={async () => {
              if (!newComment.trim() || requireLoginAlert()) return;
              try {
                await addDoc(collection(db, 'posts', post.id, 'comments'), {
                  text: newComment,
                  time: Date.now(),
                  uid: auth.currentUser!.uid,
                  userName: auth.currentUser!.displayName || "User"
                });
                await updateDoc(doc(db, 'posts', post.id), { commentCount: increment(1) });
                setNewComment("");
              } catch (e: any) { addToast("Error: " + e.message); }
            }} className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">SEND</button>
          </div>
        </div>
      )}
      
      {showLikesModal && <UsersListModal title="Liked By" uids={post.likedBy || []} allUsers={allUsers} onClose={() => setShowLikesModal(false)} />}
      {showViewsModal && <UsersListModal title="Viewed By" uids={post.viewedBy || []} allUsers={allUsers} onClose={() => setShowViewsModal(false)} />}
    </motion.div>
  );
}

function PostForm({ addToast, onCancel, currentUserProfile, editingPost, isAdmin, isEditor }: { addToast: (s:string) => void, onCancel: () => void, currentUserProfile: UserProfile | null, editingPost: Post | null, isAdmin: boolean, isEditor: boolean }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(editingPost?.title || "");
  const [content, setContent] = useState(editingPost?.content || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    editingPost?.categories ? editingPost.categories : (editingPost?.category ? [editingPost.category] : ["📌 General"])
  );
  const [tags, setTags] = useState(editingPost?.tags?.join(", ") || "");
  const [websiteName, setWebsiteName] = useState(editingPost?.websiteName || "");
  const [media, setMedia] = useState<{ url: string, type: string, name?: string } | null>(
    editingPost ? (editingPost.mediaUrl ? { url: editingPost.mediaUrl, type: editingPost.mediaType || 'image/jpeg', name: editingPost.mediaName } : null) : null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapText = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    const newContent = before + prefix + (selection || "text") + suffix + after;
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const CATEGORIES = [
    "📌 General",
    "📊 Daily Reports",
    "📢 Updates",
    "🗳️ Election",
    "🏛️ Mana Panchayath",
    "💬 Live Chat",
    "🤝 Union Corner",
    "✨ Platform Updates",
    "💡 Suggestions & Feedback",
    "📑 Applications & GOs",
    "🚨 Emergency Contacts",
    "🔗 Useful Information",
    "🏠 ePanchayat Home Issue",
    "💰 Online Tax Collection Issue",
    "📂 UBD Portal Issue",
    "📉 UBD MIS Status Issue",
    "🗳️ TSEC Poll Login Issue",
    "🛠️ eGramSwaraj Issue"
  ];

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      if (selectedCategories.length < 3) {
        setSelectedCategories([...selectedCategories, cat]);
      } else {
        addToast("You can select up to 3 categories only.");
      }
    }
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (selectedCategories.length === 0) {
      addToast("Please select at least one category.");
      return;
    }
    setLoading(true);
    try {
      const extractedHashtags = content.match(/#(\w+)/g)?.map(tag => tag.substring(1)) || [];
      const manualTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
      const finalTags = Array.from(new Set([...manualTags, ...extractedHashtags]));

      const postData = {
        title,
        content,
        category: selectedCategories[0],
        categories: selectedCategories,
        tags: finalTags,
        websiteName,
        mediaUrl: media?.url || "",
        mediaType: media?.type || "",
        mediaName: media?.name || "",
      };

      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), {
          ...postData,
          lastEditedAt: Date.now()
        });
        addToast("Update Saved!");
      } else {
        await addDoc(collection(db, "posts"), {
          ...postData,
          subCategory: "", 
          likes: 0,
          likedBy: [],
          views: 0,
          commentCount: 0,
          comments: [],
          time: Date.now(),
          uid: auth.currentUser.uid,
          userName: isEditor ? "Admin" : (currentUserProfile?.username || auth.currentUser.displayName || "User"),
          userPhoto: isEditor ? "" : (currentUserProfile?.photoURL || ""),
          isAdminPost: isEditor,
          status: isEditor ? 'Approved' : 'Pending'
        });
        addToast("Post Published! " + (!isAdmin ? "Waiting for admin approval." : ""));
      }
      onCancel();
    } catch (err: any) { 
      handleFirestoreError(err, OperationType.WRITE, editingPost ? `posts/${editingPost.id}` : 'posts');
      addToast("Error: " + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <motion.form 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onSubmit={onSubmit}
      className="bg-white p-6 rounded-3xl shadow-xl border-2 border-accent mb-8" style={{ borderColor: '#fbbf24' }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-primary uppercase text-lg flex items-center gap-2">
          {editingPost ? '✏️ Edit Update' : '📝 New Update'}
        </h3>
        <button aria-label="Close edit modal" type="button" onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors font-black text-lg">✕</button>
      </div>

      <div className="space-y-4 text-left">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Title / Header</label>
          <input name="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter catchy title..." className="w-full text-lg font-black text-primary p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-primary/20 outline-none transition-all" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-full">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Categories (Select up to 3)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                    selectedCategories.includes(cat)
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Website Name (Optional)</label>
            <input name="websiteName" value={websiteName} onChange={(e) => setWebsiteName(e.target.value)} placeholder="e.g. ePanchayat" className="w-full bg-slate-50 text-xs font-bold p-3 rounded-xl border-2 border-transparent focus:border-primary/20 outline-none transition-all" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Tags (Comma separated)</label>
          <input name="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. help, important, notice" className="w-full bg-slate-50 text-xs font-bold p-3 rounded-xl border-2 border-transparent focus:border-primary/20 outline-none transition-all" />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Content Details</label>
          <div className="flex flex-wrap items-center gap-1 mb-0 bg-slate-100 p-1.5 rounded-t-2xl border-x-2 border-t-2 border-slate-200">
            <button type="button" onClick={() => wrapText('**', '**')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary" title="బొల్డ్ (Bold)"><Bold size={16}/></button>
            <button type="button" onClick={() => wrapText('*', '*')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary" title="ఇటాలిక్ (Italic)"><Italic size={16}/></button>
            <button type="button" onClick={() => wrapText('# ', '')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary" title="పెద్ద ఫాంట్ (Heading 1)"><Type size={16}/></button>
            <button type="button" onClick={() => wrapText('## ', '')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary" title="చిన్న ఫాంట్ (Heading 2)"><Type size={14}/></button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button type="button" onClick={() => wrapText('- ', '')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary" title="లిస్ట్ (Bullet List)"><List size={16}/></button>
            <button type="button" onClick={() => wrapText('[', '](url)')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary" title="లింక్ (Link)"><Link2 size={16}/></button>
            <button type="button" onClick={() => setContent(content + '\n---\n')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary text-[10px] font-black" title="లైన్ (Divider)">LINE</button>
          </div>
          <textarea
            ref={textareaRef}
            name="content" required value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="Write details here (Markdown supported)..." 
            rows={8} 
            className="w-full bg-slate-50 p-3 rounded-b-2xl border-2 border-t-0 border-slate-200 focus:border-primary/20 outline-none text-sm font-medium leading-relaxed" 
          />
        </div>
        
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Media Content (Max 5MB)</label>
          <div className="py-8 border-2 border-dashed rounded-2xl text-center cursor-pointer relative bg-slate-50 overflow-hidden transition-all hover:bg-slate-100 hover:border-primary/20 group">
             {media?.url ? (
               <div className="space-y-3 px-4">
                 <div className="relative inline-block w-full max-w-sm">
                    {media.type.startsWith('video') ? (
                       <video src={media.url} className="h-32 w-full object-cover rounded-xl border shadow-sm" />
                    ) : media.type.startsWith('image') ? (
                       <img src={media.url} alt="Uploaded media preview" loading="lazy" className="h-32 w-full object-cover rounded-xl border shadow-sm" />
                    ) : (
                       <div className="h-32 w-full bg-slate-100 flex flex-col items-center justify-center rounded-xl border shadow-sm p-4">
                        <FileText size={32} className="text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-600 truncate w-full px-4">{media.name || 'document'}</span>
                       </div>
                    )}
                    <button aria-label="Remove media"
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setMedia(null); }} 
                      className="absolute -top-2 -right-2 bg-danger text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform z-10"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                 </div>
                 <p className="text-[11px] font-black text-success uppercase">✓ Media Attached</p>
               </div>
             ) : (
               <div className="space-y-2 py-4">
                 <div className="text-3xl tracking-tighter"><Upload size={28} className="mx-auto text-primary" /></div>
                 <div className="text-xs font-black text-slate-400 group-hover:text-primary transition-colors uppercase tracking-widest">Add Attachment (&lt; 5MB)</div>
                 <p className="text-[10px] text-slate-300 font-bold">Image, Video or Document</p>
               </div>
             )}
             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="*/*" onChange={async (e) => {
               const f = e.target.files?.[0];
               if (f) {
                 if (f.size > 5 * 1024 * 1024) {
                   addToast("File is too large! Please select a file smaller than 5MB.");
                   e.target.value = '';
                   return;
                 }
                 const reader = new FileReader();
                 reader.onload = (ev) => setMedia({ url: ev.target?.result as string, type: f.type || 'application/octet-stream', name: f.name });
                 reader.readAsDataURL(f);
               }
             }} />
          </div>
        </div>
      </div>

      <button aria-label={editingPost ? 'Save Changes' : 'Publish Now'} disabled={loading} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg hover:bg-primary-light transition-all active:scale-95 mt-6 disabled:opacity-50 uppercase tracking-widest" style={{ background: '#0d3b66' }}>
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

const ChatSection = lazy(() => import('./pages/ChatScreen'));


const KnowledgeHubSection = lazy(() => import("./pages/KnowledgeHubScreen").then(m => ({ default: m.KnowledgeHubSection })));
const PRActHub = lazy(() => import("./pages/KnowledgeHubScreen").then(m => ({ default: m.PRActHub })));

// --- POST DETAIL MODULE ---

function PostDetail({ postId, onBack, isAdmin, addToast, userProfile, allUsers }: { postId: string, onBack: () => void, isAdmin: boolean, addToast: (s:string) => void, userProfile: UserProfile | null, allUsers: UserProfile[] }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showViewsModal, setShowViewsModal] = useState(false);

  useEffect(() => {
    let isInitial = true;
    const docRef = doc(db, 'posts', postId);
    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setPost({ id: snapshot.id, ...snapshot.data() } as Post);
        if (isInitial) {
          isInitial = false;
          const data = snapshot.data();
          const uid = auth.currentUser?.uid;
          if (uid && data && !data.viewedBy?.includes(uid)) {
            const updateData: any = { 
              views: increment(1),
              viewedBy: arrayUnion(uid)
            };
            updateDoc(docRef, updateData).catch(e => console.error(e));
          }
          setLoading(false);
        }
      } else {
        if (isInitial) addToast("Post not found");
        setLoading(false);
      }
    }, (err) => {
        handleFirestoreError(err, OperationType.GET, `posts/${postId}`);
        if(isInitial) { addToast("Error loading post"); setLoading(false); }
    });
    return () => unsub();
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
         
         <h1 className="text-3xl md:text-5xl font-black text-primary leading-tight tracking-tight whitespace-pre-wrap">{formatPostTitle(post.title)}</h1>
         
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
             {post.mediaType?.startsWith('video') ? (
               <video src={post.mediaUrl} controls className="w-full max-h-[500px]" />
             ) : post.mediaType?.startsWith('image') ? (
               <img src={post.mediaUrl} alt="Post media" className="w-full object-cover max-h-[500px]" />
             ) : (
               <a href={post.mediaUrl} download={post.mediaName || 'Document'} target="_blank" rel="noreferrer" className="flex items-center p-6 bg-slate-50 hover:bg-slate-100 transition-colors w-full group">
                 <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex flex-shrink-0 items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                   <FileText size={32} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h5 className="font-black text-slate-800 text-lg truncate">{post.mediaName || 'Attached Document'}</h5>
                   <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mt-2">Download File</p>
                 </div>
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-primary group-hover:shadow-md transition-all">
                   <Download size={24} />
                 </div>
               </a>
             )}
           </div>
         )}

         <div className="prose prose-slate prose-lg md:prose-xl max-w-none pt-4 text-slate-700 leading-relaxed font-serif whitespace-pre-wrap">
           <ReactMarkdown remarkPlugins={[remarkBreaks]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>{post.content}</ReactMarkdown>
         </div>
         
         <div className="flex justify-between items-center sm:mt-12 mt-8 pt-8 border-t-2 border-dashed border-slate-100">
            <div className="flex gap-6">
               <button onClick={async (e) => {
                 const userId = auth.currentUser?.uid;
                 if (!userId) { addToast("Please login first"); return; }
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
               }} className="flex items-center gap-2 text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors cursor-pointer group">
                  <Heart size={20} className={post.likedBy?.includes(auth.currentUser?.uid || '') ? "fill-primary text-primary" : "text-primary group-hover:scale-110 transition-transform"} />
                  <span onClick={(e) => { if (isAdmin && post.likes > 0) { e.stopPropagation(); setShowLikesModal(true); } }} className={`font-black text-base ${isAdmin && post.likes > 0 ? "hover:underline cursor-pointer" : ""}`}>{post.likes || 0}</span> <span className="text-xs uppercase tracking-wider hidden sm:inline">Likes</span>
               </button>
               <button onClick={() => { if (isAdmin && post.views > 0) setShowViewsModal(true); }} className={`flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 transition-colors ${isAdmin && post.views > 0 ? "hover:bg-slate-100 cursor-pointer" : "cursor-default"}`}>
                  <Eye size={20} />
                  <span className={`font-black text-base ${isAdmin && post.views > 0 ? "hover:underline" : ""}`}>{post.views || 0}</span> <span className="text-xs uppercase tracking-wider hidden sm:inline">Views</span>
               </button>
            </div>
            
            <button 
               aria-label="Share Post"
               onClick={() => {
                 const url = `${window.location.origin}/?postId=${post.id}`;
                 handleShare(post.title || 'Shared Post', 'Check out this post on E-Vedhika', url, () => addToast("Link Copied!"));
               }} 
               className="flex items-center gap-2 text-slate-500 hover:text-primary hover:bg-slate-50 px-4 py-2 rounded-xl transition-all"
            >
               <Share2 size={18} />
               <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Share</span>
            </button>
         </div>
       </div>

       <div className="pt-10 border-t mt-12 border-slate-100">
         <PostComments post={post} addToast={addToast} userProfile={userProfile} isAdmin={isAdmin} allUsers={allUsers} />
       </div>
       {showLikesModal && <UsersListModal title="Liked By" uids={post.likedBy || []} allUsers={allUsers} onClose={() => setShowLikesModal(false)} />}
       {showViewsModal && <UsersListModal title="Viewed By" uids={post.viewedBy || []} allUsers={allUsers} onClose={() => setShowViewsModal(false)} />}
    </motion.div>
  );
}

function PostComments({ post, addToast, userProfile, isAdmin, allUsers }: { post: Post, addToast: (s:string) => void, userProfile: UserProfile | null, isAdmin: boolean, allUsers: UserProfile[] }) {
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showLikesModalFor, setShowLikesModalFor] = useState<{ id: string, uids: string[] } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('time', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const fetchedComments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setComments(fetchedComments);
      setCommentsLoaded(true);
      if (post.commentCount !== fetchedComments.length) {
          updateDoc(doc(db, 'posts', post.id), { commentCount: fetchedComments.length }).catch(() => {});
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, `posts/${post.id}/comments`));
    return () => unsub();
  }, [post.id, post.commentCount]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (requireLoginAlert()) return;
    
    setSubmittingComment(true);
    try {
      await addDoc(collection(db, 'posts', post.id, 'comments'), {
        text: newComment,
        time: Date.now(),
        uid: auth.currentUser!.uid,
        userName: isAdmin ? "Admin" : (auth.currentUser!.displayName || auth.currentUser!.email?.split('@')[0] || "User"),
        isAdminComment: isAdmin,
        likes: [],
        edited: false
      });
      setNewComment("");
      
      await updateDoc(doc(db, 'posts', post.id), {
        commentCount: increment(1)
      });
    } catch (e: any) {
      console.error(e);
      addToast("Error: " + (e.message || String(e)));
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-black text-primary mb-6 flex items-center gap-3">
        <MessageCircle size={24} className="text-accent" style={{ color: '#fbbf24' }}/> 
        Community Comments <span className="bg-slate-100 text-slate-500 text-sm py-1 px-3 rounded-full">{commentsLoaded ? comments.length : (post.commentCount || 0)}</span>
      </h3>
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
                 <div className="flex items-center gap-2">
                   <span className="text-[15px] font-black text-primary">{c.userName && !c.userName.includes('@') ? c.userName : 'User'}</span>
                   {(c.isAdminComment || c.uid === 'KGT2roF9bPTNhWIceHgWsJEnEnH3') && (
                     <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest flex items-center gap-0.5 shadow-sm">
                       <ShieldCheck size={8} /> Official
                     </span>
                   )}
                 </div>
                 <div className="flex items-center gap-1">
                   <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-md">
                     {new Date(getValidTime(c)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                   </span>
                   {(auth.currentUser?.uid === c.uid || isAdmin) && (
                     <button onClick={async () => {
                       try {
                         await deleteDoc(doc(db, 'posts', post.id, 'comments', c.id));
                         await updateDoc(doc(db, 'posts', post.id), {
                           commentCount: increment(-1)
                         });
                       } catch(err) { console.error(err); }
                     }} className="text-slate-400 hover:text-red-500">
                       <Trash2 size={12} />
                     </button>
                   )}
                 </div>
               </div>
               <p className="text-slate-700 leading-relaxed">{c.text}</p>
               <div className="flex items-center gap-2 mt-2">
                 <button onClick={() => {
                      const likes = c.likes || [];
                      const uid = auth.currentUser!.uid;
                      if (!uid) { addToast("Please login first"); return; }
                      if (likes.includes(uid)) {
                        updateDoc(doc(db, 'posts', post.id, 'comments', c.id), { likes: arrayRemove(uid) });
                      } else {
                        updateDoc(doc(db, 'posts', post.id, 'comments', c.id), { likes: arrayUnion(uid) });
                      }
                 }} className={`text-xs flex items-center gap-1 ${c.likes?.includes(auth.currentUser?.uid) ? 'text-red-500 hover:text-slate-400' : 'text-slate-400 hover:text-red-500'} group transition-colors p-1 -ml-1 rounded-md`}>
                    <Heart size={12} fill={c.likes?.includes(auth.currentUser?.uid) ? "currentColor" : "none"} className="group-hover:scale-125 transition-transform" />
                 </button>
                 <button onClick={() => setShowLikesModalFor({ id: c.id, uids: c.likes || [] })} className="text-xs font-black text-slate-400 hover:text-primary transition-colors">
                    {c.likes?.length || 0}
                 </button>
               </div>
             </div>
          </div>
        ))}
      </div>
      {showLikesModalFor && <UsersListModal title="Comment Liked By" uids={showLikesModalFor.uids} allUsers={allUsers} onClose={() => setShowLikesModalFor(null)} />}
    </div>
  );
}

function AuthModal({ onClose, addToast, handleGoogleLogin, districtsData }: { onClose: () => void, addToast: (s:string) => void, handleGoogleLogin: () => void, districtsData: Record<string, string[]> }) {
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

  const mandals = district ? districtsData[district] || [] : [];

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
        if (!username || !email || !password || !name || !surname || (gender !== 'Female' && !mobile)) {
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
                    <select value={gender} onChange={e => {
                        setGender(e.target.value);
                        if (e.target.value === 'Female') setMobile('');
                    }} className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors">
                       <option value="">Select Gender</option>
                       <option>Male</option>
                       <option>Female</option>
                       <option>Other</option>
                    </select>
                  </div>
                  {gender !== 'Female' && (
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Mobile No *</label>
                    <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Phone" required className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" />
                  </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">State</label>
                    <select value={state} onChange={e => setState(e.target.value)} className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors">
                       <option>Telangana</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">District</label>
                    <select value={district} onChange={e => { setDistrict(e.target.value); setMandal(''); }} className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors">
                       <option value="">Select District</option>
                       {Object.keys(districtsData).sort().map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                 <div className="grid grid-cols-2 gap-2">
                    <div>
                     <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Mandal</label>
                     <select value={mandal} onChange={e => setMandal(e.target.value)} className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" disabled={!district}>
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
                  <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">Designation</label>
                  <input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Type Designation" className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors" />
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

// PollsScreen removed to /src/pages/PollsScreen.tsx


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

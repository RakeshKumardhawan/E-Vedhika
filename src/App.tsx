/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  useSearchParams,
  Link,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ManaBot } from "./components/ManaBot";
import {
  Bell,
  Menu,
  X,
  Home,
  Megaphone,
  FileText,
  Wheat,
  Vote,
  Wallet,
  Building,
  MessageCircle,
  Handshake,
  Lightbulb,
  AlertTriangle,
  Send,
  LogOut,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  AlertCircle,
  Eye,
  Heart,
  Share2,
  PlusCircle,
  Camera,
  User,
  Edit2,
  Save,
  Activity,
  Book,
  GraduationCap,
  BarChart3,
  Database,
  Download,
  Bot,
  MessageSquare,
  Trash2,
  Edit3,
  Settings,
  TrendingUp,
  Upload,
  Play,
  RefreshCw,
  Layers,
  Calendar,
  LayoutDashboard,
  ShieldAlert,
  Lock,
  Shield,
  Pin,
  Bold,
  Italic,
  Type,
  Link2,
  List,
  Users,
  AlertOctagon,
  CheckCircle2,
  CheckCircle,
  ClipboardList,
  Zap,
  Clock,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  XCircle,
  ChevronRight,
  Flag,
  ShieldCheck,
  Info,
  Hash,
  EyeOff,
  Rocket,
  Mail,
  RotateCcw,
  MapPin,
  Plus,
  Mic,
  ExternalLink,
  Target,
  HardDrive,
} from "lucide-react";
import Swal from "sweetalert2";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
// Joyride removed
import { GosAndFormatsPublic, GosAndFormatsAdmin } from "./GosAndFormats";
// Lazy loaded modules
let XLSX: any = null;
let jsPDF: any = null;
let autoTable: any = null;

const loadHeavyModules = async () => {
  if (!XLSX) XLSX = await import("xlsx");
  if (!jsPDF) {
    const j = await import("jspdf");
    jsPDF = j.default || j.jsPDF;
  }
  if (!autoTable) {
    const a = await import("jspdf-autotable");
    autoTable = a.default;
  }
};
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  increment,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  limit,
  setDoc,
  getDoc,
  where,
  getDocFromServer,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { auth, db, storage } from "../firebase";
import { GoogleGenAI } from "@google/genai";

async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error("Firebase connection check: Client is offline");
      // We don't want to spam alerts on every page load, but we can log it.
    }
  }
}
testConnection();

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
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
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  const lowerErr = errInfo.error.toLowerCase();

  // Show the error in the console
  console.error("Firestore Error: ", JSON.stringify(errInfo));

  if (lowerErr.includes("permission") || lowerErr.includes("insufficient")) {
    console.warn(
      `PERMISSION ERROR ON PATH: ${path}. User might need to update Firebase Security Rules for this collection.`,
    );
  }

  // We MUST throw or handle this so it shows up in the UI (we'll let the user know directly)
  throw new Error(JSON.stringify(errInfo));
}

export function getFriendlyError(err: any): string {
  let msg = err.message || String(err);
  try {
    const parsed = JSON.parse(msg);
    if (parsed.error) msg = parsed.error;
  } catch (e) {
    // Not a JSON string
  }
  
  if (msg.includes("Missing or insufficient permissions")) {
    return "మీకు ఈ యాక్షన్‌ని చేయడానికి పర్మిషన్ లేదు / You don't have permission to perform this action.";
  }
  if (msg.includes("offline") || msg.includes("network-request-failed") || msg.includes("Failed to get document because the client is offline")) {
    return "ఇంటర్నెట్ కనెక్షన్ లేదు. దయచేసి నెట్‌వర్క్ చెక్ చేయండి / No internet connection. Please check your network.";
  }
  if (msg.includes("Quota exceeded")) {
    return "సిస్టమ్ పరిమితి దాటింది. దయచేసి రేపు మళ్ళీ ప్రయత్నించండి / Quota exceeded. Please try again tomorrow.";
  }
  if (msg.includes("invalid-credential") || msg.includes("user-not-found") || msg.includes("wrong-password")) {
    return "లాగిన్ వివరాలు తప్పు. దయచేసి సరియైన లాగిన్ వివరాలు ప్రయత్నించండి / Invalid credentials. Please try again.";
  }
  if (msg.includes("popup-closed-by-user") || msg.includes("cancelled-popup-request")) {
    return "లాగిన్ విండో మూసివేయబడింది. దయచేసి మళ్ళీ ప్రయత్నించండి / The login popup was closed before completion.";
  }
  return msg;
}

const logUserActivity = async (actionDesc: string) => {
  if (!auth.currentUser) return;
  try {
    const userDisplay =
      auth.currentUser.email ||
      auth.currentUser.displayName ||
      auth.currentUser.uid ||
      "Registered User";
    await addDoc(collection(db, "security_logs"), {
      admin: userDisplay,
      action: actionDesc,
      time: Date.now(),
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
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="modal-ringG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>

        <circle
          className="logo-ring"
          cx="32"
          cy="32"
          r="29"
          fill="none"
          stroke="url(#modal-ringG)"
          strokeWidth="2.5"
          strokeDasharray="10 5"
        />
        <circle cx="32" cy="32" r="25" fill="url(#modal-g)" />
        <circle cx="32" cy="32" r="21" fill="#0d3b66" />
        <text
          x="50%"
          y="54%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#fff"
          fontSize="18"
          fontWeight="900"
          fontFamily="Segoe UI"
        >
          EV
        </text>
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
      confirmButtonColor: "#0d3b66",
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
  theme?: "light" | "dark" | "system";
  notifications?: boolean;
  time: number;
}

const DEFAULT_DISTRICTS_DATA: Record<string, string[]> = {
  Adilabad: [
    "Adilabad",
    "Bazarhathnoor",
    "Bela",
    "Bheempur",
    "Bhoraj",
    "Boath",
    "Gadiguda",
    "Gudihathnur",
    "Ichoda",
    "Inderavelly",
    "Jainad",
    "Mavala",
    "Narnoor",
    "Neradigonda",
    "Sirikonda",
    "Sathnala",
    "Sonala",
    "Talamadugu",
    "Tamsi",
    "Utnur",
  ],
  "Bhadradri Kothagudem": [
    "Allapalli",
    "Annapureddypalli",
    "Aswapuram",
    "Aswaraopeta",
    "Bhadrachalam",
    "Burgampadu",
    "Chandrugonda",
    "Cherla",
    "Chunchupalli",
    "Dammapeta",
    "Dummugudem",
    "Gundala",
    "Julurpad",
    "Karakagudem",
    "Laxmidevipalli",
    "Manuguru",
    "Mulakalapalle",
    "Palawancha",
    "Pinapaka",
    "Sujathanagar",
    "Tekulapalle",
    "Yellandu",
  ],
  Hanumakonda: [
    "Atmakur",
    "Bheemadevarpalle",
    "Damera",
    "Dharmasagar",
    "Elkathurthi",
    "Hasanparthy",
    "Inavolue",
    "Kamalapur",
    "Nadikuda",
    "Parkal",
    "Shayampet",
    "Velair",
  ],
  Hyderabad: [
    "Amberpet",
    "Asifnagar",
    "Bahadurpura",
    "Bandra",
    "Charminar",
    "Golconda",
    "Himayatnagar",
    "Khairatabad",
    "Marredpally",
    "Musheerabad",
    "Nampally",
    "Saidabad",
    "Secunderabad",
    "Shaikpet",
    "Tirumalagiri",
    "Ameerpet",
  ],
  Jagtial: [
    "Bheemaram",
    "Bheerpur",
    "Buggaram",
    "Dharmapuri",
    "Endapalli",
    "Gollapalle",
    "Ibrahimpatnam",
    "Jagitial Rural",
    "Jagtial",
    "Kathlapur",
    "Kodimial",
    "Korutla",
    "Mallapur",
    "Mallial",
    "Medipalle",
    "Metpalle",
    "Pegadapalle",
    "Raikal",
    "Sarangapur",
    "Velgatoor",
  ],
  Jangaon: [
    "Bachannapeta",
    "Chilpur",
    "Devaruppula",
    "Ghanpur(Stn)",
    "Jangaon",
    "Kodakandla",
    "Lingala Ghanpur",
    "Narmetta",
    "Palakurthi",
    "Raghunatha Palle",
    "Tharigoppula",
    "Zaffergadh",
  ],
  "Jayashankar Bhupalpally": [
    "Bhupalpally",
    "Chityal",
    "Ghanpur (Mulug)",
    "Kataram",
    "Mahadevpur",
    "Malharrao",
    "Mogullapally",
    "Mutharam (Mahadevpur)",
    "Palimela",
    "Regonda",
    "Tekumatla",
  ],
  "Jogulamba Gadwal": [
    "Alampur",
    "Dharur",
    "Gadwal",
    "Ghattu",
    "Ieeja",
    "Itikyal",
    "Maldakal",
    "Manopad",
    "Rajoli",
    "Undavelly",
    "Waddepalle",
    "Kaloor Timmanadoddi",
  ],
  Kamareddy: [
    "Banswada",
    "Bhiknoor",
    "Birkur",
    "Domakonda",
    "Farooqnagar",
    "Gandhari",
    "Jukkal",
    "Kamareddy",
    "Lingampet",
    "Machareddy",
    "Madnoor",
    "Nizamsagar",
    "Pitlam",
    "Sadashivanagar",
    "Yellareddy",
    "Nasrullabad",
    "Tadwai",
    "Bhimgal",
    "Ramareddy",
    "Rajampet",
    "Bibipet",
    "Pedda Kodapgal",
    "Dongli",
    "Gudam",
    "Palvancha",
  ],
  Karimnagar: [
    "Chigurumamidi",
    "Choppadandi",
    "Ellandhakunta",
    "Gangadhara",
    "Ganneruvaram",
    "Huzurabad",
    "Jammikunta",
    "Karimnagar",
    "Kothapally",
    "Manakondur",
    "Ramadugu",
    "Shankarapatnam",
    "Thimmapur",
    "V Saidapur",
    "Veenavanka",
  ],
  Khammam: [
    "Bonakal",
    "Chinthakani",
    "Enkuru",
    "Kalluru",
    "Kamepalle",
    "Khammam Rural",
    "Konijerla",
    "Kusumanchi",
    "Madhira",
    "Mudigonda",
    "Nelakondapalle",
    "Penuballi",
    "Raghunadhapalem",
    "Sathupalle",
    "Singareni",
    "Thallada",
    "Thirumalayapalem",
    "Vemsoor",
    "Wyra",
    "Yerrupalem",
  ],
  "Komaram Bheem Asifabad": [
    "Asifabad",
    "Bejjur",
    "Chintalamanepally",
    "Dahegaon",
    "Jainoor",
    "Kagaznagar",
    "Kerameri",
    "Kouthala",
    "Penchikalpet",
    "Rebbena",
    "Sirpur (T)",
    "Sirpur (U)",
    "Tiryani",
    "Wankidi",
  ],
  Mahabubabad: [
    "Bayyaram",
    "Dornakal",
    "Gangaram",
    "Garla",
    "Gudur",
    "Kothaguda",
    "Kuravi",
    "Mahabubabad",
    "Maripeda",
    "Narsimhulapet",
    "Peddavangara",
    "Thorrur",
    "Kessamudram",
    "Nellikudur",
    "Danthalapalle",
    "Seerole",
  ],
  Mahabubnagar: [
    "Addakal",
    "Balanagar",
    "Bhoothpur",
    "Chinna Chinta Kunta",
    "Devarkadara",
    "Gandeed",
    "Hanwada",
    "Jadcherla",
    "Koilkonda",
    "Koukuntla",
    "Mahbubnagar",
    "Midjil",
    "Mohammadabad",
    "Moosapet",
    "Nawabpet",
    "Rajapur",
  ],
  Mancherial: [
    "Bellampalle",
    "Bheemaram",
    "Bheemini",
    "Chennur",
    "Dandepalle",
    "Hajipur",
    "Jaipur",
    "Jannaram",
    "Kannepally",
    "Kasipet",
    "Kotapalle",
    "Luxettipet",
    "Mandamarri",
    "Nennal",
    "Tandur",
    "Vemanpalle",
  ],
  Medak: [
    "Alladurg",
    "Chegunta",
    "Chilpiched",
    "Havelighanpur",
    "Kowdipalle",
    "Kulcharam",
    "Manoharabad",
    "Masaipet",
    "Medak",
    "Narsapur",
    "Narsingi",
    "Nizampet",
    "Papannapet",
    "Ramayampet",
    "Regode",
    "Shankarampet (A)",
    "Shankarampet (R)",
    "Shivampet",
    "Tekmal",
    "Tupran",
    "Yeldurthy",
  ],
  "Medchal-Malkajgiri": [
    "Alwal",
    "Balanagar",
    "Dundigal Gandimaisamma",
    "Ghatkesar",
    "Kapra",
    "Keesara",
    "Kukatpally",
    "Malkajgiri",
    "Medchal",
    "Medipally",
    "Qutubullapur",
    "Shamirpet",
    "Uppal",
    "Bolarum",
    "Chengicherla",
  ],
  Mulugu: [
    "Eturnagaram",
    "Govindaraopet",
    "Mangapet",
    "Mulugu",
    "SS Tadvai",
    "Vazeed",
    "Venkatapuram",
    "Kannaigudem",
    "Tadvai",
  ],
  Nagarkurnool: [
    "Achampet",
    "Amrabad",
    "Balmoor",
    "Bijinapalle",
    "Charakonda",
    "Kalwakurthy",
    "Kodair",
    "Kollapur",
    "Lingal",
    "Nagarkurnool",
    "Padara",
    "Peddakothapalle",
    "Pentlavelli",
    "Tadoor",
    "Telkapalle",
    "Thimmajipet",
    "Uppununthala",
    "Urkonda",
    "Vangoor",
  ],
  Nalgonda: [
    "Adavidevulapally",
    "Anumula",
    "Chandam Pet",
    "Chandur",
    "Chintha Palle",
    "Chityala",
    "Dameracherla",
    "Devarakonda",
    "Gattuppal",
    "Gudipally",
    "Gundla Palle",
    "Gurrampode",
    "Kangal",
    "Kattangoor",
    "Kethepalle",
    "Kondamallepally",
    "Madugulapally",
    "Marri Guda",
    "Miryalaguda",
    "Munugode",
    "Nakrekal",
    "Nalgonda",
    "Nampalle",
    "Narketpalle",
    "Neredugomma",
    "Nidamanur",
    "Pedda Adiserlapalle",
    "Peddavura",
    "Saligouraram",
    "Thipparthi",
    "Thirumalagiri sagar",
    "Thripuraram",
    "Vemulapalle",
  ],
  Narayanpet: [
    "Damaragidda",
    "Dhanwada",
    "Kosgi",
    "Krishna",
    "Maddur",
    "Maganoor",
    "Makthal",
    "Marikal",
    "Narayanpet",
    "Utkoor",
    "Narva",
  ],
  Nirmal: [
    "Basar",
    "Bhainsa",
    "Dilawarpur",
    "Kaddampeddur",
    "Khanapur",
    "Kuntala",
    "Lokeshwaram",
    "Mamda",
    "Mudhole",
    "Nirmal",
    "Nirmal Rural",
    "Pemdhal",
    "Sarangapur",
    "Soan",
    "Tanur",
    "Dasturabad",
    "Pembarthi",
  ],
  Nizamabad: [
    "Aloor",
    "Armur",
    "Balkonda",
    "Bheemgal",
    "Bodhan",
    "Chandur",
    "Dhar Palle",
    "Dich Palle",
    "Donkeshwar",
    "Indalwai",
    "Jakranpalle",
    "Kammar Palle",
    "Kotgiri",
    "Makloor",
    "Mendora",
    "Mortad",
    "Mosara",
    "Mugpal",
    "Mupkal",
    "Nandipet",
    "Navipet",
    "Nizamabad",
    "Pothangal",
    "Ranjal",
    "Rudrur",
    "Saloora",
    "Sirkonda",
    "Varni",
    "Velpur",
    "Yeda Palle",
    "Yergatla",
  ],
  Peddapalli: [
    "Anthergoam",
    "Dharmaram",
    "Eligaid",
    "Julapalli",
    "Kamanpur",
    "Manthani",
    "Mutharam (Manthani)",
    "Odela",
    "Palakurthy",
    "Peddapalli",
    "Ramagiri",
    "Ramagundam",
    "Srirampur",
    "Sulthanabad",
  ],
  "Rajanna Sircilla": [
    "Boinpalle",
    "Chandurthi",
    "Ellanthakunta",
    "Gambhiraopet",
    "Konaraopeta",
    "Mustabad",
    "Sircilla",
    "Vemulawada",
    "Vemulawada Rural",
    "Yellareddy Peth",
    "Thangallapalli",
  ],
  Rangareddy: [
    "Abdullapurmet",
    "Amangal",
    "Balapur",
    "Chevella",
    "Farooqnagar",
    "Gandipet",
    "Hayathnagar",
    "Ibrahimpatnam",
    "Jillelaguda",
    "Kadthal",
    "Kondurg",
    "Kothur",
    "Madgul",
    "Maheshwaram",
    "Manchal",
    "Moinabad",
    "Nandigama",
    "Rajendranagar",
    "Saroornagar",
    "Serilingampally",
    "Shabad",
    "Shamshabad",
    "Shankarpalle",
    "Talakondapalle",
    "Yacharam",
  ],
  Sangareddy: [
    "Ameenpur",
    "Andole",
    "Chowtakur",
    "Gummadidala",
    "Hathnoora",
    "Jharasangam",
    "Jinnaram",
    "Kalher",
    "Kandi",
    "Kangti",
    "Kohir",
    "Kondapur",
    "Manoor",
    "Mogadampally",
    "Munpalle",
    "Nagalgidda",
    "Narayankhed",
    "Nizampet",
    "Nyalkal",
    "Patancheru",
    "Pulkal",
    "Raikode",
    "Sadasivpet",
    "Sangareddy",
    "Sirgapur",
    "Vatpally",
    "Zahirabad",
  ],
  Siddipet: [
    "AkbarpetNA Bhoompally",
    "Akkannapeta",
    "Bejjanki",
    "Cheriyal",
    "Chinna Kodur",
    "Dhoolmitta",
    "Doultabad",
    "Dubbak",
    "Gajwel",
    "Husnabad",
    "Jagdevpur",
    "Koheda",
    "Komuravelli",
    "Kondapak",
    "Kukunoorpally",
    "Maddur",
    "Markook",
    "Mirdoddi",
    "Mulug",
    "Nanganur",
    "Narayanaraopet",
    "Raipole",
    "Siddipet",
    "Siddipet Rural",
    "Thoguta",
    "Wargal",
  ],
  Suryapet: [
    "Atmakur (S)",
    "Chilkur",
    "Chinthapalem",
    "Garidepally",
    "Huzurnagar",
    "Jajireddygudem",
    "Kodad",
    "Maddirala",
    "Mattampally",
    "Mellachervu",
    "Mothey",
    "Munagala",
    "Nadigudem",
    "Neredcherla",
    "Nuthankal",
    "Palakeedu",
    "Penpahad",
    "Suryapet",
    "Thirumalagiri",
    "Tungaturthi",
  ],
  Vikarabad: [
    "Basheerabad",
    "Bommraspet",
    "Dharur",
    "Doma",
    "Kodangal",
    "Kotepally",
    "Kulkacherla",
    "Marpalle",
    "Mominpet",
    "Nawabpet",
    "Pargi",
    "Peddemul",
    "Pudur",
    "Tandur",
    "Vikarabad",
    "Yelal",
  ],
  Wanaparthy: [
    "Amarchinta",
    "Atmakur",
    "Chinnambavi",
    "Ghanpur",
    "Gopalpeta",
    "Khila Ghanpur",
    "Kothakota",
    "Madanapur",
    "Pangal",
    "Pebbair",
    "Peddamandadi",
    "Revally",
    "Srirangapur",
    "Veepangandla",
    "Wanaparthy",
  ],
  Warangal: [
    "Chennaraopet",
    "Duggondi",
    "Geesugonda",
    "Khanapur",
    "Nallabelly",
    "Narsampet",
    "Nekkonda",
    "Parvathagiri",
    "Raiparthy",
    "Sangem",
    "Wardhannapet",
  ],
  "Yadadri Bhuvanagiri": [
    "Addagudur",
    "Alair",
    "Atmakur (M)",
    "Bibinagar",
    "Bhudan Pochampally",
    "Bhuvanagiri",
    "Bommalaramaram",
    "Choutuppal",
    "Gundala",
    "Motakondur",
    "Mothkur",
    "Narayanapur",
    "Rajapet",
    "Ramannapet",
    "Turkapally",
    "Valigonda",
    "Yadagirigutta",
  ],
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
  status?: "pending" | "solved" | "resolved" | "Deleted";
  time: number;
  uid: string;
  resolvedAt?: number;
  isAnonymous?: boolean;
  wantsWhatsAppUpdates?: boolean;
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
  visibility?: string;
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
    if (typeof obj.time === "number") return obj.time;
    if (obj.time.seconds) return obj.time.seconds * 1000;
  }
  if (obj.createdAt) {
    if (typeof obj.createdAt === "number") return obj.createdAt;
    if (obj.createdAt.seconds) return obj.createdAt.seconds * 1000;
  }
  if (obj.timestamp) {
    if (typeof obj.timestamp === "number") return obj.timestamp;
    if (obj.timestamp.seconds) return obj.timestamp.seconds * 1000;
  }
  if (obj.date) {
    if (typeof obj.date === "string" || typeof obj.date === "number") {
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
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            reg.showNotification(title, {
              body,
              icon: "/pwa-192x192.png",
              badge: "/pwa-192x192.png",
            } as any);
          } else {
            new Notification(title, { body, icon: "/pwa-192x192.png" });
          }
        });
      } else {
        new Notification(title, { body, icon: "/pwa-192x192.png" });
      }
    } catch (e) {}
  }
};

let globalAudioContext: AudioContext | null = null;

export const playNotificationSound = () => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!globalAudioContext) {
      globalAudioContext = new AudioContextClass();
    }

    if (globalAudioContext.state === "suspended") {
      globalAudioContext.resume().catch(() => {});
    }

    const playNote = (freq: number, startTime: number, duration: number) => {
      if (!globalAudioContext) return;
      const oscillator = globalAudioContext.createOscillator();
      const gainNode = globalAudioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        freq,
        globalAudioContext.currentTime + startTime,
      );

      gainNode.gain.setValueAtTime(
        0,
        globalAudioContext.currentTime + startTime,
      );
      gainNode.gain.linearRampToValueAtTime(
        0.5,
        globalAudioContext.currentTime + startTime + 0.05,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        globalAudioContext.currentTime + startTime + duration,
      );

      oscillator.connect(gainNode);
      gainNode.connect(globalAudioContext.destination);

      oscillator.start(globalAudioContext.currentTime + startTime);
      oscillator.stop(globalAudioContext.currentTime + startTime + duration);
    };

    playNote(1318.51, 0, 0.4);
    playNote(1760.0, 0.15, 0.6);
  } catch (e) {
    console.error("Audio playback error:", e);
  }
};

const formatPostTitle = (title: string | undefined | null) => {
  if (!title) return "";
  return title.replace(/🛑🚀/g, "🛑\n🚀").replace(/🛑 🚀/g, "🛑\n🚀");
};

export const SYSTEM_UPDATES = [
  {
    id: `update-v1.5.4`,
    isSystemElement: true,
    version: "v1.5.4",
    title: "16/05/2026: సిస్టమ్ అప్‌డేట్ వెరిఫికేషన్",
    badge: "LATEST",
    text: "1. ✅ **అప్‌డేట్ వెరిఫికేషన్**: వెబ్‌సైట్ అప్‌డేట్ అయిన ప్రతిసారీ మీకు తెలియజేయడానికి 'Last Updated' స్టేటస్ జోడించబడింది.\n2. 🕒 **లైవ్ అప్‌డేట్స్**: అడ్మిన్ ప్యానెల్ మరియు సైడ్‌బార్‌లో ఇప్పుడు మీరు అప్లికేషన్ యొక్క తాజా వెర్షన్ మరియు సమయాన్ని చూడవచ్చు.\n3. 🛠️ **బగ్ ఫిక్సెస్**: పోస్ట్ ఫార్మ్ మరియు రిపోర్ట్స్ ఫిల్టర్లలో ఉన్న చిన్న సమస్యలను పరిష్కరించాము.",
    time: Date.now(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: `update-v1.5.3`,
    isSystemElement: true,
    version: "v1.5.3",
    title: "12/05/2026: పెర్ఫార్మెన్స్ బూస్ట్ & ఆటో రికవరీ స్పీడప్",
    badge: "PERFORMANCE",
    text: "1. ⚡ **స్పీడ్ బూస్ట్**: సిస్టమ్ లోడింగ్ సమయాన్ని మరియు ఏఐ బాట్ స్పందన సమయాన్ని తగ్గించాము.\n2. 🤖 **ఫాస్ట్ రికవరీ**: ఏవైనా ఎర్రర్స్ వస్తే సిస్టమ్ ఇప్పుడు మునుపటి కంటే రెండు రెట్లు వేగంగా రీస్టార్ట్ అవుతుంది.\n3. 🎨 **రిఫ్రెష్డ్ లుక్**: రికవరీ స్క్రీన్‌ను మరింత అందంగా మరియు స్పష్టంగా అప్‌డేట్ చేశాము.\n4. 🛡️ **స్టెబిలిటీ ప్యాచ్**: హోమ్ పేజీ లోడింగ్ లో వచ్చే చిన్న చిన్న ఇబ్బందులను తొలగించాము.",
    time: Date.now(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: `update-v1.5.2`,
    isSystemElement: true,
    version: "v1.5.2",
    title: "12/05/2026: అల్టిమేట్ పేజీ బిల్డర్ (Dynamic Layouts)",
    badge: "HUGE UPDATE",
    text: "1. 🏗️ **డైనమిక్ సెక్షన్స్**: ఇప్పుడు మీరు హోమ్ పేజీ సెక్షన్స్ ని అడ్మిన్ ప్యానెల్ నుండి క్రియేట్, ఎడిట్, డిలీట్ మరియు రీ-ఆర్డర్ చేయవచ్చు.\n2. 👁️ **లైవ్ ప్రివ్యూ**: మార్పులు చేసేటప్పుడే అవి ఎలా ఉంటాయో అడ్మిన్ ప్యానెల్ లోనే చూడవచ్చు.\n3. ☁️ **రియల్-టైమ్ సింక్**: మీరు 'Publish' చేసిన వెంటనే మార్పులు సేవ్ అయి అందరికీ కనిపిస్తాయి.\n4. 🙈 **హైడ్/షో**: ఏదైనా సెక్షన్‌ను డిలీట్ చేయకుండానే తాత్కాలికంగా దాచిపెట్టవచ్చు.",
    time: Date.now(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: `update-v1.5.0`,
    isSystemElement: true,
    version: "v1.5.0",
    title: "12/05/2026: బాట్ విజిబిలిటీ & పేజీ బిల్డర్ వెర్షన్ 2.0",
    badge: "MAJOR UPDATE",
    text: "1. 🤖 **AI బాట్ ఫిక్స్**: ఏఐ బాట్ (ManaBot) కనిపించని సమస్యను పరిష్కరించాము. ఇప్పుడు అది అన్ని డివైజ్‌లలో స్పష్టంగా కనిపిస్తుంది.\n2. 🏗️ **ఫంక్షనల్ పేజీ బిల్డర్**: పేజీ బిల్డర్‌లో ఇప్పుడు మీరు ఎలిమెంట్స్ ని యాడ్ చేయడం మరియు వాటిని తొలగించడం చేయవచ్చు. ఇది ఇప్పుడు సంపూర్ణంగా పనిచేస్తుంది.\n3. 🛡️ **ఎర్రర్ హ్యాండ్లింగ్**: సిస్టమ్ లో వచ్చే ఎర్రర్స్ ని ఇప్పుడు మీరు తెలుగులో సులభంగా అర్థం చేసుకునేలా అప్‌డేట్ చేశాము.",
    time: Date.now(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: `update-v1.4.9`,
    isSystemElement: true,
    version: "v1.4.9",
    title: "11/05/2026: సిస్టమ్ రికవరీ బాట్ & పేజీ బిల్డర్",
    badge: "NEW FEATURES",
    text: "1. 🤖 **సిస్టమ్ రికవరీ బాట్**: ఎర్రర్స్ వస్తే ఆటోమాటిక్ గా క్లియర్ చేసి వెబ్‌సైట్‌ను మళ్లీ రన్ చేయడానికి రికవరీ బాట్ అనుసంధానించబడింది.\n2. 🏗️ **పేజీ బిల్డర్**: అడ్మిన్ ప్యానెల్‌లో కొత్తగా పేజీలను క్రియేట్ చేయడానికి మరియు డిజైన్ చేయడానికి Page Builder ఆప్షన్ తీసుకురాబడింది.\n3. 🖼️ **PWA లోగో అప్‌డేట్**: బ్రౌజర్ క్యాచెను పక్కనపెట్టి కొత్త PWA లోగో వెంటనే యూజర్లకు కనబడేలా వెర్షన్ అప్‌డేట్ చేసాం.",
    time: 1778500200000,
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.4.8",
    isSystemElement: true,
    version: "v1.4.8",
    title: "10/05/2026: సిస్టమ్ అప్‌డేట్స్ & అనలిటిక్స్ ఫీచర్స్",
    badge: "DAILY UPDATE",
    text: 'నేటి సిస్టమ్ అప్‌డేట్స్‌లో భాగంగా పోర్టల్‌లో ఈ క్రింది మార్పులు చేసాము:\n\n1. 💎 **టెక్స్ట్ ఫార్మాటింగ్ టూల్‌బార్**: ఇప్పుడు మీరు పోస్ట్‌లను వ్రాసేటప్పుడు వర్డ్ ఫైల్ లాగా బోల్డ్, ఇటాలిక్ మరియు లైన్ బ్రేక్స్ ఉపయోగించవచ్చు.\n2. 🎨 **UI అప్‌డేట్స్**: కస్టమ్ లోగో, మొబైల్ హోమ్ స్క్రీన్ ఐకాన్ మరియు ఫెవికాన్ కలపబడ్డాయి.\n3. 📊 **అడ్మిన్ అనలిటిక్స్**: అడ్మిన్‌లకి మాత్రమే, పోస్ట్‌లో Views లేదా Likes కౌంట్ మీద క్లిక్ చేస్తే చూసిన/లైక్ చేసిన వారి లిస్ట్ వస్తుంది.\n4. 📖 **పోస్ట్ రీడింగ్ UX**: "Read Post" మీద క్లిక్ చేస్తే ఆ పోస్ట్ ఫుల్ వ్యూ వస్తుంది, మరియు "Back to Feed" బటన్ యాడ్ చేసాం.\n5. 🚀 **నావిగేషన్**: ఎగువన ఉన్న "EV" లోగో మీద క్లిక్ చేస్తే ఏ పేజీ నుంచి అయినా నేరుగా హోమ్ పేజీకి వస్తారు.\n6. 🔗 **సోషల్ షేరింగ్**: పోస్ట్‌లను షేర్ చేసినప్పుడు సరైన థంబ్‌నెయిల్ మరియు టైటిల్‌తో "ప్రివ్యూ" (OG Image & Tags) వచ్చేలా ఫిక్స్ చేసాము.',
    time: new Date("2026-05-10T23:59:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.7.2",
    isSystemElement: true,
    version: "v1.7.2",
    title: "09/05/2026: కేటగిరీల పునరుద్ధరణ (Restoration)",
    badge: "BUGFIX",
    text: "యూజర్ కోరిక మేరకు అన్ని పోస్ట్ కేటగిరీలను యథావిధిగా పునరుద్ధరించడం జరిగింది. అల్లాగే Admin Panel లో ఏర్పడిన Firestore Update ఎర్రర్‌ను ఫిక్స్ చేశాము.",
    time: new Date("2026-05-09T18:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.7.1",
    isSystemElement: true,
    version: "v1.7.1",
    title: "09/05/2026: కేటగిరీల జాబితా క్లీనప్",
    badge: "UPDATE",
    text: "పోస్ట్ కేటగిరీల జాబితా నుండి అనవసరమైన అంశాలను తొలగించడం జరిగింది మరియు Useful Information కేటగిరీని అప్డేట్ చేసాము.",
    time: new Date("2026-05-09T17:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.7.0",
    isSystemElement: true,
    version: "v1.7.0",
    title: "09/05/2026: హాష్‌ట్యాగ్స్ & వ్యూస్ అప్డేట్",
    badge: "NEW",
    text: "పోస్ట్ కంటెంట్‌లోని #hashtags ఆటోమేటిక్‌గా ట్యాగ్స్‌గా మారుతాయి. వ్యూస్ కౌంట్ ఒక యూజర్ కి ఒకసారి మాత్రమే లెక్కించబడుతుంది.",
    time: new Date("2026-05-09T16:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.6.2",
    isSystemElement: true,
    version: "v1.6.2",
    title: "09/05/2026: మల్టీ-కేటగిరీ సపోర్ట్",
    badge: "NEW",
    text: "ఇకపై ఒక పోస్ట్ కి 3 కేటగిరీల వరకు ఎంచుకోవచ్చు. కేటగిరీల జాబితాను క్లీనప్ చేయడం జరిగింది.",
    time: new Date("2026-05-09T15:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.6.1",
    isSystemElement: true,
    version: "v1.6.1",
    title: "09/05/2026: కేటగిరీలకు ఐకాన్స్ జోడింపు",
    badge: "NEW",
    text: "కేటగిరీలకు ఐకాన్స్ (Emojis) జోడించడం జరిగింది మరియు మరిన్ని ఇష్యూ రిపోర్టింగ్ కేటగిరీలను అందుబాటులోకి తెచ్చాం.",
    time: new Date("2026-05-09T14:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.4.6",
    isSystemElement: true,
    version: "v1.4.6",
    title: "08/05/2026: సింగిల్ చాట్ బాట్ (ManaBot) సింప్లిఫికేషన్",
    badge: "UPDATE",
    text: 'యూజర్స్ కి కన్ఫ్యూజన్ లేకుండా లైవ్ చాట్ లో ఉన్న ఏఐ బాట్ ని మరియు వర్క్ స్పేస్ లో ఉన్న ట్రైనింగ్ బాట్ ని తీసేసి.. అన్నిటికీ కలిపి కేవలం ఒకే ఒక పవర్ఫుల్ చాట్ బాట్ "E-VEDHIKA Assistant" ని మాత్రమే ఉంచాము. PR Act సెర్చ్ లోని బాట్ ఐకాన్‌ను కూడా మార్చాము.',
    time: new Date("2026-05-08T12:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.4.4",
    isSystemElement: true,
    version: "v1.4.4",
    title: "మే 08, 2026: PR Act Hub ఫీచర్స్",
    badge: "NEW",
    text: "మన పంచాయతీ సెక్షన్‌లోని PR Act Hub లో కొత్త సెర్చ్ ఫీచర్, క్విక్ జంప్ లింక్స్ మరియు ఒరిజినల్ PDF డౌన్‌లోడ్ చేసుకునే అవకాశం యాడ్ చేయడం జరిగింది.",
    time: new Date("2026-05-08T11:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.4.1",
    isSystemElement: true,
    version: "v1.4.1",
    title: "మే 08, 2026: వెబ్సైట్ విజిటర్ కౌంట్ అప్డేట్",
    badge: "HOTFIX",
    text: "గతంలో పోర్టల్ ని సందర్శించిన వారి సంఖ్య సరిగ్గా చూపించట్లేదు , ఇప్పుడు ఒరిజినల్ కౌంట్ కనిపించేలా విజిటర్ కౌంటర్ ని ఫిక్స్ చెయ్యడం జరిగింది.",
    time: new Date("2026-05-08T10:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.4.0",
    isSystemElement: true,
    version: "v1.4.0",
    text: (
      <div className="text-left space-y-4">
        <div className="flex items-center gap-3">
          <kbd className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">
            v1.4.0
          </kbd>
          <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
            మే 06, 2026: స్మార్ట్ అప్డేట్స్
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex gap-4 items-start">
            <kbd className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">
              NEW UI
            </kbd>
            <span className="text-sm text-slate-600 leading-relaxed">
              <strong>Applications, Formats & GOs:</strong> యూజర్స్ అందరు తమకు
              కావాల్సిన గవర్నమెంట్ అప్లికేషన్లు, ఫార్మాట్‌లు మరియు GOస్‌ను
              అప్లోడ్ (పబ్లిక్ అప్లోడ్) చేసుకుని ఇతరులకు షేర్ చేసుకునే మరియు
              సులభంగా వెతుక్కునే సదుపాయం.
            </span>
          </div>
          <div className="flex gap-4 items-start">
            <kbd className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">
              NEW PWA
            </kbd>
            <span className="text-sm text-slate-600 leading-relaxed">
              <strong>ఆటో-అప్డేట్ ఫీచర్ (Auto-Update Notifier):</strong> యాప్ లో
              ఎప్పటికప్పుడు కొత్త ఫీచర్స్ వచ్చిన వెంటనే స్క్రీన్ మీద పాపప్
              ద్వారా తెలిసేలా స్మార్ట్ అలర్ట్ సిస్టమ్ జోడించాం.
            </span>
          </div>
        </div>
      </div>
    ),
    time: new Date("2026-05-06T10:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.3.0",
    isSystemElement: true,
    version: "v1.3.0",
    text: (
      <div className="text-left space-y-4">
        <div className="flex items-center gap-3">
          <kbd className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">
            v1.3.0
          </kbd>
          <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
            మే 01, 2026: డాక్యుమెంట్స్
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex gap-4 items-start">
            <kbd className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">
              PROFILE
            </kbd>
            <span className="text-sm text-slate-600 leading-relaxed">
              <strong>మై యాక్టివిటీ & రిపోర్ట్స్ (My Activity):</strong> యూజర్స్
              తమ సొంత ప్రొఫైల్, వాళ్ళు పెట్టిన పోస్ట్‌లు మరియు పనుల గురించి
              రిపోర్ట్స్ చూసుకునే సెక్షన్ రడీ చేసాం.
            </span>
          </div>
          <div className="flex gap-4 items-start">
            <kbd className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">
              OFFLINE
            </kbd>
            <span className="text-sm text-slate-600 leading-relaxed">
              <strong>PWA యాప్ & ఆఫ్‌లైన్ సపోర్ట్:</strong> మొబైల్ లో ఒక యాప్ లా
              ఇన్స్టాల్ చేసుకునే అవకాశం మరియు ఇంటర్నెట్ లేనప్పుడు కూడా చూసిన
              డేటా చదువుకోగలిగే ఆఫ్‌లైన్ సపోర్ట్.
            </span>
          </div>
        </div>
      </div>
    ),
    time: new Date("2026-05-01T10:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.2.0",
    isSystemElement: true,
    version: "v1.2.0",
    text: (
      <div className="text-left space-y-4">
        <div className="flex items-center gap-3">
          <kbd className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">
            v1.2.0
          </kbd>
          <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
            ఏప్రిల్ 20, 2026: పర్సనలైజేషన్
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex gap-4 items-start">
            <kbd className="bg-purple-50 text-purple-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">
              CHAT
            </kbd>
            <span className="text-sm text-slate-600 leading-relaxed">
              <strong>లైవ్ చాట్ (Live Chat):</strong> యూజర్ల మధ్యన రియల్ టైం
              డిస్కషన్స్ మరియు ముఖ్యమైన విషయాల పంచుకోవడానికి పబ్లిక్ లైవ్ చాట్
              గ్రూప్స్ ప్రారంభం.
            </span>
          </div>
          <div className="flex gap-4 items-start">
            <kbd className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">
              UNION
            </kbd>
            <span className="text-sm text-slate-600 leading-relaxed">
              <strong>యూనియన్ కార్నర్ (Union Corner):</strong> వివిధ ఎంప్లాయ్
              యూనియన్స్ మరియు సంఘాల సమాచారం త్వరగా అందరికీ చేరేలా ఒక స్పెషల్
              వాయిస్ బోర్డ్.
            </span>
          </div>
        </div>
      </div>
    ),
    time: new Date("2026-04-20T10:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "update-v1.0.1",
    isSystemElement: true,
    version: "v1.0.1",
    text: (
      <div className="text-left space-y-4">
        <div className="flex items-center gap-3">
          <kbd className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">
            v1.0.1
          </kbd>
          <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
            ఏప్రిల్ 15, 2026: కమ్యూనికేషన్
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex gap-4 items-start">
            <kbd className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">
              FEEDBACK
            </kbd>
            <span className="text-sm text-slate-600 leading-relaxed">
              <strong>సజెషన్స్ & ఫీడ్బ్యాక్ (Public Suggestions):</strong>{" "}
              ఎవరైనా సరే ఏమైనా కొత్త సజెషన్స్ ఇవ్వడానికి, లేదా కంప్లైంట్
              ఇవ్వడానికి లైవ్ పబ్లిక్ సెక్షన్ మరియు ఓటింగ్ సిస్టమ్ జోడింపు.
            </span>
          </div>
        </div>
      </div>
    ),
    time: new Date("2026-04-15T10:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
  {
    id: "foundation",
    isSystemElement: true,
    version: "v1.0.0",
    text: (
      <div className="text-left space-y-4">
        <div className="flex items-center gap-3">
          <kbd className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">
            v1.0.0
          </kbd>
          <p className="font-bold text-slate-700 text-lg">
            ఏప్రిల్ 11, 2026: ఎలక్ట్రానిక్ వేదికకు నాంది. పబ్లిక్ ఎంగేజ్మెంట్ !
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-600 text-sm leading-relaxed">
            పంచాయతీ ఆపరేటర్ల మరియు ఉద్యోగుల డిజిటల్ అవసరాలకోసం మా కు వచ్చిన
            అమూల్యమైన ఆలోచనలతో ఎలక్ట్రానిక్ వేదికకు నాంది. గూగుల్ **Gemini**
            మరియు **Chat GPT** కృత్రిమ మేధస్సుల సహాయంతో ఈ పోర్టల్‌ తొలి విడుదల
            మరియు పబ్లిక్ ఆర్టికల్స్ సిస్టం ప్రారంభించాము.
          </p>
        </div>
      </div>
    ),
    time: new Date("2026-04-11T14:00:00Z").getTime(),
    type: "changelog",
    status: "Approved",
  },
];

export const handleShare = async (
  title: string,
  text: string,
  url: string,
  onSuccess?: () => void,
  mediaUrl?: string,
  mediaType?: string
) => {
  let filesToShare: File[] | undefined = undefined;

  if (mediaUrl && mediaType?.startsWith("image") && navigator.canShare) {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const ext = mediaType.split("/")[1] || "jpeg";
      const file = new File([blob], `shared_media.${ext}`, { type: blob.type || "image/jpeg" });
      if (navigator.canShare({ files: [file] })) {
        filesToShare = [file];
      }
    } catch (err) {
      console.warn("Could not prepare media for sharing", err);
    }
  }

  if (navigator.share) {
    try {
      const shareData: any = { title, text, url };
      if (filesToShare && filesToShare.length > 0) {
        shareData.files = filesToShare;
      }
      await navigator.share(shareData);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      if (error && error.name !== "AbortError") {
        navigator.clipboard.writeText(url);
        if (onSuccess) onSuccess();
      }
    }
  } else {
    navigator.clipboard.writeText(url);
    if (onSuccess) onSuccess();
  }
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const postIdFromUrl = searchParams.get("postId");
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "editor" | "user">("user");
  const hasGreetedRef = useRef(false);

  const isDevEmail =
    user?.email?.toLowerCase() === "rakeshkumardhawan123@gmail.com";
  const isAdmin = userRole === "admin" || isDevEmail;
  const isEditor = userRole === "admin" || userRole === "editor" || isDevEmail;

  useEffect(() => {
    if (
      "Notification" in window &&
      Notification.permission !== "denied" &&
      Notification.permission !== "granted"
    ) {
      try {
        Notification.requestPermission();
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const applyTheme = (themeValue: string | undefined) => {
      if (themeValue === "dark") {
        document.body.classList.add("dark-theme");
      } else if (themeValue === "light") {
        document.body.classList.remove("dark-theme");
      } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.body.classList.add("dark-theme");
        } else {
          document.body.classList.remove("dark-theme");
        }
      }
    };

    applyTheme(userProfile?.theme);

    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (!userProfile?.theme || userProfile?.theme === "system") {
        applyTheme("system");
      }
    };
    if (matcher.addEventListener) {
      matcher.addEventListener('change', listener);
      return () => matcher.removeEventListener('change', listener);
    }
  }, [userProfile?.theme]);

  useEffect(() => {
    // Suppress benign Vite WebSocket error logs that confuse the user
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const msg = args[0];
      const isBenignError =
        typeof msg === "string" &&
        (msg.includes("WebSocket") ||
          msg.includes("vite") ||
          msg.includes("web-socket") ||
          msg.includes("closed without opened") ||
          msg.includes("connection failed") ||
          msg.includes("@firebase/firestore") ||
          msg.includes("WebChannelConnection"));

      // Check for error objects as well
      const isBenignErrorObject =
        msg instanceof Error &&
        (msg.message.includes("WebSocket") ||
          msg.message.includes("closed without opened") ||
          msg.message.includes("vite") ||
          msg.message.includes("@firebase/firestore"));

      if (isBenignError || isBenignErrorObject) {
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const msg = args[0];
      if (
        typeof msg === "string" &&
        (msg.includes("WebSocket") ||
          msg.includes("vite") ||
          msg.includes("closed without opened") ||
          msg.includes("@firebase/firestore") ||
          msg.includes("WebChannelConnection"))
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    // Also suppress unhandled rejections related to the websocket
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const isBenign =
        (reason &&
          reason.message &&
          (reason.message.includes("WebSocket") ||
            reason.message.includes("closed without opened"))) ||
        (typeof reason === "string" &&
          (reason.includes("WebSocket") ||
            reason.includes("closed without opened")));

      if (isBenign) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  const [siteConfig, setSiteConfig] = useState<any>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const tabFromUrl = searchParams.get("tab");
  const [currentTab, setCurrentTab] = useState(tabFromUrl || "home");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_settings", "home_page"), (snap) => {
      if (snap.exists()) {
        setSiteConfig(snap.data());
      }
    });
    return () => unsub();
  }, []);

  // Sync tab with URL query parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tab !== currentTab) {
      setCurrentTab(tab);
    }
  }, [searchParams, currentTab]);
  const [activeInternalUrl, setActiveInternalUrl] = useState<string | null>(
    null,
  );
  const [currentFilter, setCurrentFilter] = useState("All");
  const [posts, setPosts] = useState<Post[]>([]);

  // Correct sticky header height coordination
  const headerHeight = "72px";
  const tickerHeight = "44px";
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const approvedSuggestions = suggestions.filter(
    (s) => s.status === "Approved" || s.status === "approved",
  );
  const [problemsGlobal, setProblemsGlobal] = useState<ProblemReport[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [visiblePostsCount, setVisiblePostsCount] = useState(20);
  const [visibleUpdatesCount, setVisibleUpdatesCount] = useState(20);
  const [visibleProblemsCount, setVisibleProblemsCount] = useState(20);
  const [visibleSuggestionsCount, setVisibleSuggestionsCount] = useState(20);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showPostForm, setShowPostForm] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
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
      console.log("App was installed");
      setShowInstallButton(false);
      addToast("యాప్ విజయవంతంగా ఇన్‌స్టాల్ చేయబడింది!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
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
  const [districtsData, setDistrictsData] = useState<Record<string, string[]>>(
    DEFAULT_DISTRICTS_DATA,
  );

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "locations"), (snap) => {
      if (snap.exists() && snap.data().data) {
        setDistrictsData(snap.data().data);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (
      currentTab === "suggestions" &&
      !sessionStorage.getItem("sawSuggestionAlert")
    ) {
      Swal.fire({
        title: "e-Vedhika Suggestion Portal",
        text: "Welcome to e-Vedhika Suggestion Portal! మీ సూచనలను ఇక్కడ నమోదు చేయండి.",
        icon: "info",
        confirmButtonColor: "#0d3b66",
        confirmButtonText: "సరే (OK)",
      });
      sessionStorage.setItem("sawSuggestionAlert", "true");
    }
  }, [currentTab]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const uArr: UserProfile[] = [];
        snap.forEach((d) =>
          uArr.push({ id: d.id, ...d.data() } as UserProfile),
        );
        setAllUsers(uArr.sort((a, b) => (b.time || 0) - (a.time || 0)));
      },
      (e) => console.error("Users List Error:", e),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    let interval: any;
    if (
      currentTab === "suggestions" &&
      approvedSuggestions.length > 0 &&
      !isSuggestionsHovered
    ) {
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const allUpdates = useMemo(() => {
    const merged = new Map<string, any>();
    SYSTEM_UPDATES.forEach((u) => merged.set(u.id, { ...u, isSystem: true }));
    updates.forEach((u) => {
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
  const [adminPinInput, setAdminPinInput] = useState("");
  const [currentAdminPin, setCurrentAdminPin] = useState("1234");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "admin_config"));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.pin) setCurrentAdminPin(data.pin);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
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
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        // If clicking on the menu toggle button, don't close it immediately
        // to avoid toggling states conflicting (often handled via stopPropagation, but good to be safe)
        const target = event.target as Element;
        if (!target.closest(".menu-toggle")) {
          setSidebarOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [sidebarOpen]);

  // Body scroll lock for sidebar
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [sidebarOpen]);

  // Styles Injection
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = APP_STYLES;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setUserProfile(null);
        setUserRole("user");
        hasGreetedRef.current = false;
      }
    });
    return () => unsubAuth();
  }, []);

  // Public Listeners
  useEffect(() => {
    // Visitor Count logic
    const unsubVisits = onSnapshot(
      doc(db, "settings", "site_stats"),
      (snap) => {
        if (snap.exists()) {
          setVisitorCount(snap.data().visitCount || 0);
        }
      },
    );

    if (!sessionStorage.getItem("site_visited")) {
      sessionStorage.setItem("site_visited", "true");
      const statsRef = doc(db, "settings", "site_stats");
      updateDoc(statsRef, { visitCount: increment(1) }).catch(async (e) => {
        if (e.code === "not-found") {
          await setDoc(statsRef, { visitCount: 1 });
        }
      });
    }

    let initialUpdatesLoadedLocal = false;
    const unsubUpdates = onSnapshot(
      collection(db, "updates"),
      (snap) => {
        const uArr: Update[] = [];
        snap.forEach((d) =>
          uArr.push({ id: d.id, ...(d.data() as any) } as Update),
        );
        setUpdates(uArr);

        if (!initialUpdatesLoadedLocal) {
          initialUpdatesLoadedLocal = true;
        } else {
          const addedChanges = snap
            .docChanges()
            .filter((change) => change.type === "added");
          if (addedChanges.length > 0) {
            const newUpdate = addedChanges[0].doc.data() as any;
            triggerNotification(
              "New Flash Update!",
              newUpdate.title ||
                newUpdate.msg ||
                newUpdate.text ||
                "Check out the latest update.",
            );
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "updates"),
    );

    const unsubSuggestions = onSnapshot(
      collection(db, "suggestions"),
      (snap) => {
        const sArr: Suggestion[] = [];
        snap.forEach((d) =>
          sArr.push({ id: d.id, ...(d.data() as any) } as Suggestion),
        );
        setSuggestions(sArr.sort((a, b) => (b.time || 0) - (a.time || 0)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "suggestions"),
    );

    let initialPostsLoadedLocal = false;
    const unsubPosts = onSnapshot(
      query(collection(db, "posts")),
      (snap) => {
        const pArr: Post[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          pArr.push({ id: d.id, ...data } as Post);
        });
        // We store all posts and filter 'Deleted' out in render if not editor
        setPosts(
          pArr.sort((a, b) => {
            const pinSort = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
            if (pinSort !== 0) return pinSort;
            return (b.time || 0) - (a.time || 0);
          }),
        );

        if (!initialPostsLoadedLocal) {
          initialPostsLoadedLocal = true;
        } else {
          const addedChanges = snap
            .docChanges()
            .filter((change) => change.type === "added");
          if (addedChanges.length > 0) {
            const newPost = addedChanges[0].doc.data() as any;
            triggerNotification(
              `New Post: ${newPost.title || "Platform Update"}`,
              newPost.content || "A new post has been published on E-Vedhika.",
            );
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "posts"),
    );

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

    const unsubProfile = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          const p = { id: snap.id, ...snap.data() } as UserProfile;
          setUserProfile(p);

          // Force profile setup only if basic details are missing to avoid annoying existing users
          if (!p.name && !p.username) {
            setShowForcedProfileSetup(true);
          } else {
            setShowForcedProfileSetup(false);
            // Show greeting on first load
            if (p.status === "Approved" && !hasGreetedRef.current) {
              hasGreetedRef.current = true;
              const honorific = p.gender === "Female" ? "Madam" : "Sir";
              addToast(`Welcome to E-vedhika website, ${honorific}!`);
            }
          }
        } else {
          setUserProfile(null);
          setShowForcedProfileSetup(true);
        }
        setProfileLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        if (err.message.includes("offline")) {
          addToast(
            "Network Error: Firestore is offline. Please check your connection.",
          );
        }
        setProfileLoading(false);
      },
    );

    const unsubAdminCheck = onSnapshot(
      doc(db, "admins", user.uid),
      (snap) => {
        const isDevEmail =
          user.email?.toLowerCase() === "rakeshkumardhawan123@gmail.com";
        if (isDevEmail) {
          setUserRole("admin");
        } else if (snap.exists()) {
          const data = snap.data();
          setUserRole(data?.role || "admin");
        } else {
          setUserRole("user");
        }
      },
      (err) =>
        handleFirestoreError(err, OperationType.GET, `admins/${user.uid}`),
    );

    const unsubChat = onSnapshot(
      collection(db, "chat"),
      (snap) => {
        const cArr: ChatMessage[] = [];
        snap.forEach((d) =>
          cArr.push({ id: d.id, ...(d.data() as any) } as ChatMessage),
        );
        setChatMessages(
          cArr.sort((a, b) => (a.time || 0) - (b.time || 0)).slice(-50),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "chat"),
    );

    const problemsQuery =
      userRole === "admin" || userRole === "editor"
        ? collection(db, "problems")
        : query(collection(db, "problems"), where("uid", "==", user.uid));

    const unsubProblems = onSnapshot(
      problemsQuery,
      (snap) => {
        const pArr: ProblemReport[] = [];
        snap.forEach((d) =>
          pArr.push({ id: d.id, ...(d.data() as any) } as ProblemReport),
        );
        setProblemsGlobal(pArr.sort((a, b) => (b.time || 0) - (a.time || 0)));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, "problems");
      },
    );

    // Requests visibility: Admins see all, users see their own
    const requestsQuery =
      userRole === "admin" || userRole === "editor"
        ? collection(db, "requests")
        : query(collection(db, "requests"), where("uid", "==", user.uid));

    const unsubRequests = onSnapshot(
      requestsQuery,
      (snap) => {
        const rArr: RequestData[] = [];
        snap.forEach((d) =>
          rArr.push({ id: d.id, ...(d.data() as any) } as RequestData),
        );
        setRequests(rArr.sort((a, b) => (b.time || 0) - (a.time || 0)));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, "requests");
      },
    );

    let initialNotificationsLoadedLocal = false;
    const unsub1 = onSnapshot(
      query(
        collection(db, "notifications"),
        where("uid", "in", [user.uid, "all"]),
      ),
      (snap) => {
        const nArr: Notification[] = [];
        snap.forEach((d) =>
          nArr.push({ id: d.id, ...(d.data() as any) } as Notification),
        );
        setNotifications(nArr.sort((a, b) => b.time - a.time).slice(0, 50));
        setUnreadCount(
          nArr.filter((n) =>
            n.uid === "all" ? !(n as any).readBy?.includes(user?.uid) : !n.read,
          ).length,
        );

        if (!initialNotificationsLoadedLocal) {
          initialNotificationsLoadedLocal = true;
        } else {
          const addedChanges = snap
            .docChanges()
            .filter((change) => change.type === "added");
          if (addedChanges.length > 0) {
            const newNotif = addedChanges[0].doc.data() as any;
            triggerNotification(
              newNotif.title || "New Notification",
              newNotif.message || newNotif.msg || "You have a new notification",
            );
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "notifications"),
    );

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
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleGoogleLogin = async () => {
    addToast("Google లాగిన్ కోసం పాపప్ ఓపెన్ అవుతోంది...");

    // Warning timeout if it takes too long
    const slowLoginWarning = setTimeout(() => {
      addToast(
        "ఇక్కడ లాగిన్ ఆలస్యం అవుతుంది. దయచేసి యాప్‌ను కొత్త ట్యాబ్‌లో ఓపెన్ చేసి లాగిన్ అవ్వండి (పైన కుడివైపు బాణం గుర్తు ↗). అప్పుడు త్వరగా అవుతుంది.",
      );
    }, 4000);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      clearTimeout(slowLoginWarning);

      try {
        const docRef = doc(db, "users", result.user.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, {
            name: result.user.displayName || "System User",
            email: result.user.email,
            photoURL: result.user.photoURL,
            gender: "",
            designation: "",
            time: Date.now(),
          });
        }
      } catch (e) {
        // Silent fail
      }

      setShowAuthModal(false);

      try {
        const isAdminEmail = [
          "rakeshkumardhawan123@gmail.com",
          "mpo.kasipett@gmail.com",
        ].includes(result.user.email || "");
        await addDoc(collection(db, "security_logs"), {
          [isAdminEmail ? "admin" : "userEmail"]: result.user.email,
          action: `Google Login (${navigator.userAgent.substring(0, 50)}...)`,
          time: Date.now(),
        });
      } catch (e) {
        // Silent fail for logging
      }

      // dynamic greeting handled via profile listener
    } catch (err: any) {
      clearTimeout(slowLoginWarning);
      if (
        err.code === "auth/cancelled-popup-request" ||
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/popup-blocked"
      ) {
        addToast(
          "Login Failed: Popup closed or blocked. Try opening the app in a new tab (arrow on top right) if this persists.",
        );
      } else {
        addToast(getFriendlyError(err));
      }
    }
  };

  const triggerLogin = () => {
    setShowAuthModal(true);
  };

  const togglePostExpansion = async (id: string) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    if (!expandedPosts.has(id)) {
      const post = posts.find((p) => p.id === id);
      const userId = auth.currentUser?.uid;
      if (post && userId && !post.viewedBy?.includes(userId)) {
        try {
          await updateDoc(doc(db, "posts", id), {
            views: increment(1),
            viewedBy: arrayUnion(userId),
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (p.status === "Deleted") return false;

    // Normal users shouldn't see unapproved posts (unless it's their own)
    const pStatus = (p.status || "").toLowerCase();
    if (
      !isAdmin &&
      !["approved", "active"].includes(pStatus) &&
      p.uid !== user?.uid
    )
      return false;

    const q = searchQuery.toLowerCase().trim();
    const tMatch = (p.title || "").toLowerCase().includes(q);
    const cMatch = (p.content || "").toLowerCase().includes(q);
    const searchOk = !q || tMatch || cMatch;
    if (currentFilter === "All") return searchOk;
    return (
      searchOk &&
      (p.category === currentFilter ||
        p.subCategory === currentFilter ||
        p.categories?.includes(currentFilter))
    );
  });

  if (location.pathname.endsWith("/Evdka")) {
    if (!isEditor) {
      return (
        <div className="h-[100dvh] overflow-hidden bg-slate-950 font-sans selection:bg-accent/20 selection:text-primary antialiased flex flex-col justify-center items-center p-4">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed top-4 right-4 z-[9999] bg-primary text-white px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-3"
                style={{ background: "#0d3b66" }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full bg-accent"
                  style={{ background: "#fbbf24" }}
                ></div>
                {t.msg}
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="text-center relative z-10 w-full max-w-sm">
            <h1 className="text-3xl font-black mb-4 text-white uppercase tracking-tighter">
              System Admin
            </h1>
            {!user ? (
              <div className="bg-slate-900 border-2 border-slate-800 p-8 rounded-3xl w-full shadow-2xl">
                <p className="text-slate-400 font-bold mb-6 text-sm">
                  Please identify yourself to access the administration console.
                </p>
                <button
                  aria-label="Verify Identity with Google"
                  onClick={handleGoogleLogin}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  Google Identity Verification
                </button>
                <button
                  aria-label="Return to Public Portal"
                  onClick={() => navigate("/")}
                  className="mt-8 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest border border-slate-800 px-6 py-2 rounded-xl"
                >
                  Return to Public Portal
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 border-2 border-red-900/50 p-8 rounded-3xl w-full shadow-2xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                  <Lock size={32} className="text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-red-400 mb-2 uppercase">
                  Access Denied
                </h2>
                <p className="text-slate-400 text-xs font-bold mb-6">
                  Your account ({user.email}) does not have administrative
                  privileges.
                </p>
                <button
                  aria-label="Sign out"
                  onClick={() => auth.signOut()}
                  className="w-full border border-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all text-xs mb-3 uppercase tracking-wider"
                >
                  Sign Out
                </button>
                <button
                  aria-label="Return to Public Portal"
                  onClick={() => navigate("/")}
                  className="w-full text-slate-500 hover:text-slate-300 transition-colors text-[10px] uppercase tracking-widest font-bold"
                >
                  Return to Public Portal
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="h-[100dvh] overflow-hidden bg-slate-950 font-sans selection:bg-accent/20 selection:text-primary antialiased">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-4 right-4 z-[9999] bg-primary text-white px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-3"
              style={{ background: "#0d3b66" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full bg-accent"
                style={{ background: "#fbbf24" }}
              ></div>
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
              <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">
                Admin Session Locked
              </h2>
              <p className="text-slate-400 font-bold mb-8 uppercase text-xs tracking-widest">
                Restricted Access Level: 1
              </p>

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
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-4">
                  Security PIN required to view sensitive data
                </p>
              </div>

              <button
                aria-label="Back to Portal"
                onClick={() => navigate("/")}
                className="mt-8 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest border border-slate-800 px-6 py-2 rounded-xl"
              >
                Back to Portal
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="h-screen w-full">
            <AdminPanel
              posts={posts}
              addToast={addToast}
              onNewPost={() => setShowPostForm(true)}
              onEditPost={(post) => {
                setEditingPost(post);
                setShowPostForm(true);
              }}
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
              onExit={() => navigate("/")}
              districtsData={districtsData}
              currentTab={currentTab}
              userProfile={userProfile}
            />
          </div>
        )}

        {(showPostForm || editingPost) && (
          <div className="fixed inset-0 z-[3000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl custom-scrollbar">
              <PostForm
                key={editingPost?.id || "new"}
                addToast={addToast}
                onCancel={() => {
                  setShowPostForm(false);
                  setEditingPost(null);
                }}
                currentUserProfile={userProfile}
                editingPost={editingPost}
                isAdmin={isAdmin}
                isEditor={isEditor}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleRecordProblem = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast("Your browser does not support voice to text capability.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "te-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecordingProblem(true);
      addToast("🎤 రికార్డింగ్ ప్రారంభమైంది (Recording started)...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setProblemMessage((prev) =>
        prev ? prev + " " + transcript : transcript,
      );
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

  return (
    <div className="h-[100dvh] overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-[#f8fafc] to-slate-100 text-slate-800 flex flex-col font-sans selection:bg-accent/20 selection:text-primary antialiased">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-[9999] bg-primary text-white px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-3"
            style={{ background: "#0d3b66" }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full bg-accent"
              style={{ background: "#fbbf24" }}
            ></div>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {userProfile?.role === "suspended" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm"
          >
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8 border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
              <ShieldAlert size={48} className="text-red-500 animate-pulse" />
            </div>
            <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">
              Access Restricted
            </h1>
            <p className="text-red-400 font-black mb-6 uppercase text-xs tracking-[0.2em] bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
              Security Suspension Active
            </p>
            <p className="text-slate-400 max-w-sm text-base font-medium leading-relaxed mb-10">
              మీ ఖాతా భద్రతా కారణాల దృష్ట్యా తాత్కాలికంగా నిలిపివేయబడింది.
              దయచేసి అడ్మినిస్ట్రేటర్‌ను సంప్రదించండి.
            </p>
            <button
              aria-label="Sign out and exit portal"
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
        <div
          className="brand-wrapper cursor-pointer flex items-center gap-1.5 sm:gap-4 min-w-0"
          onClick={() => {
            setCurrentTab("home");
            setSidebarOpen(false);
            if (searchParams.has("postId")) {
              searchParams.delete("postId");
              setSearchParams(searchParams);
            }
          }}
        >
          {/* లోగో HTML స్ట్రక్చర్ */}
          <div className="logo-pro cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-200 shrink-0">
            {/* యానిమేటెడ్ పార్టికల్స్ */}
            <div className="logo-particles">
              <span></span>
              <span></span>
              <span></span>
            </div>

            {/* SVG లోగో */}
            <svg
              viewBox="0 0 64 64"
              className="w-[36px] h-[36px] sm:w-12 sm:h-12 shrink-0"
            >
              <defs>
                {/* కలర్ గ్రేడియంట్స్ */}
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
                <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>

              {/* బయటి రింగ్ */}
              <circle
                className="logo-ring"
                cx="32"
                cy="32"
                r="29"
                fill="none"
                stroke="url(#ringG)"
                strokeWidth="2.5"
                strokeDasharray="10 5"
              />

              {/* లోపలి సర్కిల్స్ */}
              <circle cx="32" cy="32" r="25" fill="url(#g)" />
              <circle cx="32" cy="32" r="21" fill="#0d3b66" />

              {/* EV టెక్స్ట్ */}
              <text
                x="50%"
                y="54%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="#fff"
                fontSize="18"
                fontWeight="900"
                fontFamily="Segoe UI"
              >
                EV
              </text>
            </svg>
          </div>
          {/* Website Name Section */}
          <div className="flex flex-col justify-center translate-y-[-1px] shrink min-w-0">
            <h2
              className="brand-title text-[15px] sm:text-[18px] md:text-[20px] lg:text-[24px] whitespace-nowrap overflow-hidden text-ellipsis"
              style={{
                color: "#fbe947",
                background: "none",
                WebkitTextFillColor: "initial",
                WebkitBackgroundClip: "initial",
                filter: "none",
                animation: "none",
                fontWeight: "900",
                letterSpacing: "1px",
                fontFamily: '"Arial Black", Impact, sans-serif',
                lineHeight: "1.2",
              }}
            >
              E<span style={{ color: "#facc15" }}>-</span>VEDHIKA
            </h2>
            <div className="flex items-center">
              <span
                className="whitespace-nowrap overflow-hidden text-ellipsis text-[7px] sm:text-[9px] md:text-[11px]"
                style={{
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                }}
              >
                all problems one solution
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-end sm:justify-center px-1 sm:px-4">
          {/* Search bar removed from header */}
        </div>

        <div className="flex items-center gap-1 sm:gap-5">
          <div
            className="hidden sm:flex flex-col items-center justify-center mr-2 sm:mr-4 shrink-0"
            title="Total Website Visits"
          >
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#94a3b8] mb-[2px]">
              Visits
            </span>
            <span className="text-[11px] font-mono font-black text-[#60a5fa] bg-[#0f2e4a] px-2 py-0.5 rounded-md border border-[#1e40af]/30 shadow-inner">
              {visitorCount !== null
                ? (visitorCount + 12345).toLocaleString()
                : "-----"}
            </span>
          </div>

          <div className="relative">
            <div
              className="p-1 sm:p-2 cursor-pointer text-white/80 hover:text-white transition-colors mr-0 sm:mr-3 rounded-full hover:bg-white/10"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
              {unreadCount > 0 && (
                <span className="notif-badge" style={{ display: "flex", top: 0, right: 0 }}>
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
                  className="absolute top-12 right-0 w-[280px] sm:w-[320px] bg-white rounded-3xl shadow-2xl border border-slate-100 z-[2000] overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest">
                      Signal Inbox
                    </h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-danger"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-slate-50">
                        {notifications.map((n) => {
                          const isUnread =
                            n.uid === "all"
                              ? !(n as any).readBy?.includes(user?.uid)
                              : !n.read;
                          return (
                            <div
                              key={n.id}
                              onClick={async () => {
                                if (isUnread) {
                                  try {
                                    if (n.uid === "all") {
                                      await updateDoc(
                                        doc(db, "notifications", n.id),
                                        { readBy: arrayUnion(user?.uid) },
                                      );
                                    } else {
                                      await updateDoc(
                                        doc(db, "notifications", n.id),
                                        { read: true },
                                      );
                                    }
                                  } catch (e) {}
                                }
                                if ((n as any).postId) {
                                  setSearchParams({ postId: (n as any).postId });
                                }
                                setShowNotifications(false);
                              }}
                              className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${isUnread ? "bg-blue-50/30" : ""}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span
                                  className={`text-[9px] font-black uppercase tracking-wider ${n.type === "flash_update" ? "text-amber-500" : "text-primary"}`}
                                >
                                  {n.type?.replace("_", " ")}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400">
                                  {new Date(n.time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-slate-800 leading-tight mb-1">
                                {n.title}
                              </h4>
                              <p className="text-[10px] font-medium text-slate-500 line-clamp-2">
                                {n.message}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-10 text-center">
                        <Zap size={24} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          No active signals
                        </p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={async () => {
                        const unread = notifications.filter((n) => !n.read);
                        try {
                          await Promise.all(
                            unread.map((n) =>
                              updateDoc(doc(db, "notifications", n.id), {
                                read: true,
                              }),
                            ),
                          );
                          addToast("Marked all as read");
                        } catch (e) {}
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

          {user && !user.isAnonymous ? (
            <div className="relative" ref={dropdownRef} id="profile-dropdown-btn">
              <div
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#174b7c] to-transparent pl-1.5 pr-2 sm:pr-5 py-1.5 rounded-[16px] border border-accent/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(250,204,21,0.25)] hover:border-accent/60 transition-all duration-300 relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/10 to-accent/0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-gradient-to-br from-accent to-[#d97706] flex items-center justify-center text-primary font-black text-lg shadow-inner border-[2px] border-white/20 relative z-10 shadow-[0_0_10px_rgba(250,204,21,0.5)] overflow-hidden">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User
                      size={16}
                      className="text-primary sm:w-[18px] sm:h-[18px]"
                    />
                  )}
                </div>
                <div className="hidden sm:flex flex-col justify-center relative z-10">
                  <span className="text-white text-[12px] font-black tracking-wide leading-tight drop-shadow-sm">
                    {userProfile?.username || "Panchayat Member"}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981] animate-pulse"></span>
                    <span className="text-accent text-[9px] font-bold uppercase tracking-[0.15em] drop-shadow-sm">
                      {isAdmin
                        ? "System Admin"
                        : isEditor
                          ? "Editor"
                          : "Active User"}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  className={`hidden sm:block text-accent/50 group-hover:text-accent transition-transform duration-300 relative z-10 ${showProfileDropdown ? "rotate-180" : ""}`}
                />
              </div>

              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[2000] p-2"
                  >
                    <button
                      aria-label="Edit Profile"
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-blue-50 transition-colors rounded-xl group text-left"
                    >
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <User size={18} />
                      </div>
                      Edit Profile
                    </button>
                    <div className="h-px bg-slate-100 my-1 mx-2" />
                    <button
                      aria-label="Logout"
                      onClick={() => {
                        auth.signOut();
                        setShowProfileDropdown(false);
                      }}
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
            <button
              aria-label="Sign In"
              onClick={triggerLogin}
              className="bg-[#fbbf24] text-[#0f2e4a] px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-[8px] sm:rounded-[12px] font-black text-[9px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-[#fbbf24]/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#fbbf24]/30 hover:bg-[#fcd34d] transition-all active:scale-[0.96] flex items-center gap-1 sm:gap-2 border border-[#fbbf24]/30 shrink-0"
            >
              <User size={14} className="text-[#0f2e4a] w-[14px] h-[14px]" />
              <span className="whitespace-nowrap hidden min-[360px]:inline">Sign In</span>
            </button>
          )}
        </div>
      </header>

      <div className="latest-bar overflow-hidden">
        <div className="latest-label whitespace-nowrap shrink-0 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
          Latest Updates
        </div>
        <div className="latest-text flex-1">
          <span>
            {(() => {
              const visibleUpdates = updates.filter(
                (u) =>
                  (u.type === "flash" || (!u.type && !u.status)) &&
                  u.status !== "hidden" &&
                  u.status?.toLowerCase() !== "deleted",
              );
              return visibleUpdates.length > 0
                ? visibleUpdates
                    .map((u) => u.text || (u as any).msg || (u as any).update)
                    .join("  •  ")
                : "🔥 Welcome to E-Vedhika Portal... 🔥 • 🔥 The E-Vedhika Portal is now live – Empowering Governance with Digital Excellence.. 🔥";
            })()}
          </span>
        </div>
      </div>

      <nav className="nav-trigger-bar sticky z-[1000]">
        <div className="trigger-left">
          <button
            aria-label="Toggle Menu"
            className="menu-toggle shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className="flex-1 flex items-center h-full pl-3 sm:pl-6 w-full min-w-0">
          {currentTab === "home" && (
            <div className="flex items-center gap-2 sm:gap-3 w-full h-[40px] sm:h-[44px] bg-slate-50 hover:bg-slate-100 focus-within:!bg-white focus-within:ring-4 focus-within:ring-primary/10 border-slate-200 focus-within:border-primary/40 border shadow-sm rounded-xl sm:rounded-2xl px-4 sm:px-5 transition-all group">
              <Search size={18} className="text-slate-400 group-focus-within:text-primary shrink-0" />
              <input
                type="text"
                placeholder="Search reports, notices, GOs and formats..."
                className="bg-transparent border-none focus:ring-0 text-[13px] sm:text-[15px] font-bold text-slate-700 placeholder:text-slate-400 outline-none"
                style={{
                  paddingTop: "10px",
                  paddingBottom: "10px",
                  marginBottom: "0px",
                  paddingRight: "0px",
                  paddingLeft: "0px",
                  width: "100%",
                  height: "40.4844px"
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  aria-label="Clear Search"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-300 hover:text-rose-500 transition-colors shrink-0 outline-none"
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>
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
            className="fixed inset-0 bg-black/40 z-[1050]"
          />
        )}
      </AnimatePresence>

      <div className={`main-layout ${sidebarOpen ? "sidebar-open" : ""}`}>
        <aside
          ref={sidebarRef}
          className={`sidebar ${sidebarOpen ? "z-[1100]" : ""}`}
        >
          <div
            className="sidebar-inner relative"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSidebarOpen(false);
            }}
          >
            {sidebarOpen && (
              <button
                aria-label="Close sidebar"
                onClick={() => setSidebarOpen(false)}
                className="absolute right-2 p-2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                style={{ top: "calc(8px + env(safe-area-inset-top))" }}
                title="Close sidebar"
              >
                <X size={20} />
              </button>
            )}
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-4">
              Navigations
            </h3>
            <MenuButton
              label="Home"
              emoji="🏠"
              tourId="menu-home"
              active={currentTab === "home" && !postIdFromUrl}
              onClick={() => {
                setCurrentTab("home");
                setCurrentFilter("All");
                setSidebarOpen(false);
                if (searchParams.has("postId")) {
                  searchParams.delete("postId");
                  setSearchParams(searchParams);
                }
              }}
            />
            <MenuButton
              label="🏛️ Mana Panchayath"
              emoji="📊"
              tourId="menu-mana-panchayath"
              active={currentTab === "workspace"}
              onClick={() => {
                setCurrentTab("workspace");
                setSidebarOpen(false);
              }}
            />
            <div className="flex flex-col gap-1 mb-2 p-2 bg-blue-50/30 rounded-[16px] border border-blue-100/50">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/80 mb-1 ml-2">Priority Services</span>
              <MenuButton
                label="🚨 Emergency Contacts"
                emoji="🚨"
                tourId="menu-emergency"
                active={currentTab === "emergency"}
                onClick={() => {
                  setCurrentTab("emergency");
                  setSidebarOpen(false);
                }}
              />
              <MenuButton
                label="👤 My Activity & Reports"
                emoji="📋"
                tourId="menu-my-activity"
                active={currentTab === "my_activity"}
                onClick={() => {
                  if (!user) {
                    requireLoginAlert();
                  } else {
                    setCurrentTab("my_activity");
                    setSidebarOpen(false);
                  }
                }}
              />
            </div>

            <MenuButton
              label="Live Chat"
              emoji="💬"
              tourId="menu-live-chat"
              active={currentTab === "chat"}
              onClick={() => {
                setCurrentTab("chat");
                setSidebarOpen(false);
              }}
            />
            <MenuButton
              label="Union Corner & Polls"
              emoji="🤝"
              tourId="menu-union-corner"
              active={currentTab === "union"}
              onClick={() => {
                setCurrentTab("union");
                setSidebarOpen(false);
              }}
            />
            <MenuButton
              label="What's New! 🚀"
              emoji="✨"
              tourId="menu-whats-new"
              active={currentTab === "changelog"}
              onClick={() => {
                setCurrentTab("changelog");
                setSidebarOpen(false);
              }}
            />
            <MenuButton
              label="💡 Public suggestions & Feedback"
              emoji="💡"
              tourId="menu-suggestions"
              active={currentTab === "suggestions"}
              onClick={() => {
                setCurrentTab("suggestions");
                setSidebarOpen(false);
              }}
            />
            <MenuButton
              label="📑 Applications, Formats & GOs"
              emoji="📑"
              tourId="menu-applications"
              active={currentTab === "gos_formats"}
              onClick={() => {
                setCurrentTab("gos_formats");
                setSidebarOpen(false);
              }}
            />
            <MenuButton
              label="🔗 Useful Information"
              emoji="🔗"
              tourId="menu-useful-info"
              active={currentTab === "useful_links"}
              onClick={() => {
                setCurrentTab("useful_links");
                setSidebarOpen(false);
              }}
            />
            <MenuButton
              label="📄 Excel A4 Print"
              emoji="📄"
              tourId="menu-excel-print"
              active={currentTab === "excel_print"}
              onClick={() => {
                setCurrentTab("excel_print");
                setSidebarOpen(false);
              }}
            />

            {showInstallButton && (
              <div className="mt-8 px-4">
                <button
                  aria-label="Install App"
                  onClick={handleInstallClick}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between group hover:shadow-lg transition-all active:scale-95 border border-blue-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Download size={20} className="text-white" />
                    </div>
                    <div className="flex flex-col items-start translate-y-[-1px]">
                      <span className="text-[14px] font-black leading-tight tracking-tight">
                        యాప్ ఇన్‌స్టాల్
                      </span>
                      <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest opacity-80">
                        Install App
                      </span>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <PlusCircle size={14} />
                  </div>
                </button>
              </div>
            )}

            {isAdmin || isEditor ? (
              <MenuButton
                label="Admin Panel"
                emoji="⚙️"
                tourId="menu-admin-panel"
                active={false}
                onClick={() => {
                  navigate("/Evdka");
                  setSidebarOpen(false);
                }}
              />
            ) : null}

            <div className="mt-8 pt-8 pb-4 px-4 text-center border-t border-slate-100/50">
              <div className="inline-flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    Last Update
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 mt-1">
                  Version {SYSTEM_UPDATES[0]?.version} • {new Date(SYSTEM_UPDATES[0]?.time).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {new Date(SYSTEM_UPDATES[0]?.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main
          className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar p-3 sm:p-6 lg:p-8"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
        >
          {postIdFromUrl ? (
            <PostDetail
              postId={postIdFromUrl}
              onBack={() => {
                searchParams.delete("postId");
                setSearchParams(searchParams);
              }}
              isAdmin={isAdmin}
              addToast={addToast}
              userProfile={userProfile}
              allUsers={allUsers}
              onEdit={(p) => {
                setEditingPost(p);
                setShowPostForm(true);
              }}
            />
          ) : (
            <AnimatePresence mode="wait">
              {currentTab === "home" && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="space-y-12 pb-20">
                    {(siteConfig?.elements && siteConfig.elements.length > 0 ? siteConfig.elements : DEFAULT_HOME_ELEMENTS).filter((el: any) => !el.hidden).map((el: any) => {
                      let sizeClass = "w-full";
                      if (el.size === "small") sizeClass = "max-w-2xl w-full mx-auto";
                      else if (el.size === "medium") sizeClass = "max-w-4xl w-full mx-auto";
                      else if (el.size === "large") sizeClass = "max-w-6xl w-full mx-auto";

                      return (
                      <motion.section
                        key={el.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={sizeClass}
                      >
                        {el.type === "Hero Section" && (
                          <div 
                            className={`bg-gradient-to-br from-${el.color || "blue"}-600 to-${el.color || "blue"}-800 rounded-[24px] sm:rounded-[48px] p-8 sm:p-16 text-white relative overflow-hidden shadow-2xl w-full min-h-[300px] flex flex-col justify-center`}
                          >
                            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                              <Zap size={240} />
                            </div>
                            <div className="relative z-10 max-w-2xl space-y-6">
                              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-tight drop-shadow-lg">
                                {el.title || "Welcome to E-Vedhika"}
                              </h1>
                              <p className="text-lg sm:text-xl text-white/80 font-medium leading-relaxed">
                                {el.content || "Empowering citizens through digital transparency and direct access to government services."}
                              </p>
                              <div className="flex flex-wrap gap-4 pt-4">
                                <button
                                  onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: "smooth" })}
                                  className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                                >
                                  Learn More
                                </button>
                                <button
                                  onClick={() => setCurrentTab("suggestions")}
                                  className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                                >
                                  Contact Us
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {el.type === "Post Grid" && (
                          <div className="space-y-8">
                            <div className="flex items-center justify-between px-2">
                              <div>
                                <h2 className="text-3xl font-black tracking-tighter text-slate-800">
                                  {el.title || "Recent Updates"}
                                </h2>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">
                                  Official Broadcasts & News
                                </p>
                              </div>
                              <Link to="?tab=reports" className="text-blue-600 font-black text-sm hover:underline">View All</Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {filteredPosts.slice(0, 4).map((post: any) => (
                                  <PostCard
                                    key={post.id}
                                    post={post}
                                    isExpanded={false}
                                    toggleExpansion={() => {}}
                                    addToast={addToast}
                                    isAdmin={isEditor}
                                    onEdit={(p) => {
                                      setEditingPost(p);
                                      setShowPostForm(true);
                                    }}
                                    allUsers={allUsers}
                                  />
                              ))}
                            </div>
                          </div>
                        )}

                        {el.type === "Feature Cards" && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                                <div className={`w-14 h-14 bg-${el.color || "blue"}-50 rounded-2xl flex items-center justify-center text-${el.color || "blue"}-600 mb-6 group-hover:scale-110 transition-transform`}>
                                  {i === 1 ? <Shield size={28} /> : i === 2 ? <Zap size={28} /> : <Users size={28} />}
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-3">Feature {i}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed text-sm">
                                  Detailed description for this amazing feature that helps the community thrive through digital connectivity.
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {el.type === "Contact Banner" && (
                          <div className={`bg-slate-900 p-12 rounded-[48px] text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5`}>
                            <div className="space-y-3 text-center md:text-left">
                              <h2 className="text-3xl font-black tracking-tight">{el.title || "Have a suggestion?"}</h2>
                              <p className="text-slate-400 font-medium max-w-md">{el.content || "Your feedback helps us build a better digital ecosystem for everyone."}</p>
                            </div>
                            <button onClick={() => setCurrentTab("suggestions")} className="px-10 py-5 bg-blue-600 rounded-[20px] font-black uppercase tracking-widest hover:scale-105 shadow-2xl shadow-blue-600/30 transition-all">
                              Submit Feedback
                            </button>
                          </div>
                        )}
                        
                        {el.type === "Important Links" && (
                          <div className={`p-8 sm:p-12 bg-${el.color || "slate"}-50 border border-slate-100 rounded-[32px]`}>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">{el.title || "Important Links"}</h3>
                            <p className="text-slate-500 mb-8">{el.content || "Quick access to essential portal resources."}</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              {[1, 2, 3, 4].map(i => (
                                 <a key={i} href="#" className={`p-5 bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:border-${el.color || "blue"}-400 hover:shadow-md hover:-translate-y-1 transition-all group`}>
                                   <div className={`w-14 h-14 rounded-[16px] bg-${el.color || "slate"}-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform text-${el.color || "slate"}-600`}>
                                     <ExternalLink size={24} />
                                   </div>
                                   <span className="text-sm font-bold text-slate-700">Service Portal {i}</span>
                                 </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {el.type === "Stats Highlight" && (
                          <div className={`py-8 sm:py-12 bg-white rounded-[40px]`}>
                             <div className="text-center max-w-2xl mx-auto mb-10 px-4">
                               <h3 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-800 mb-3">{el.title || "By The Numbers"}</h3>
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
                               {[
                                 { v: "15,200+", l: "Citizens Covered" },
                                 { v: "98%", l: "Resolution Rate" },
                                 { v: "24/7", l: "Digital Access" },
                                 { v: "500+", l: "Daily Visitors" }
                               ].map((stat, i) => (
                                 <div key={i} className={`p-6 bg-${el.color || "blue"}-50 rounded-[32px] text-center border border-white shadow-sm hover:shadow-lg transition-all`}>
                                   <h4 className={`text-3xl sm:text-4xl font-black text-${el.color || "blue"}-600 mb-1`}>{stat.v}</h4>
                                   <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.l}</p>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}

                        {el.type === "FAQ Section" && (
                          <div className="p-8 sm:p-12 bg-white border border-slate-100 shadow-sm rounded-[40px] max-w-4xl mx-auto">
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 text-center mb-4">{el.title || "Frequently Asked Questions"}</h3>
                            <p className="text-center text-slate-500 mb-10 max-w-xl mx-auto">{el.content || "Find answers to the most common queries about the e-Vedhika platform and digital services."}</p>
                            <div className="space-y-4">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 hover:bg-slate-100/80 transition-colors">
                                  <div className="flex justify-between items-center w-full text-left">
                                    <h4 className="text-base sm:text-lg font-bold text-slate-800">How do I access service {i} digitally?</h4>
                                    <ChevronDown className="text-slate-400 shrink-0" size={20} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {el.type === "Alert Notice" && (
                          <div className={`p-6 sm:p-8 bg-${el.color || "amber"}-50 border-l-8 border-${el.color || "amber"}-500 rounded-3xl flex items-start gap-4 shadow-sm`}>
                            <div className={`text-${el.color || "amber"}-600 bg-white p-3 rounded-2xl shadow-sm shrink-0`}>
                              <AlertTriangle size={24} />
                            </div>
                            <div>
                              <h4 className={`text-lg sm:text-xl font-black text-${el.color || "amber"}-800 mb-2`}>{el.title || "ముఖ్య గమనిక (Important Notice)"}</h4>
                              <p className={`text-${el.color || "amber"}-700/80 font-bold whitespace-pre-wrap leading-relaxed`}>{el.content || "దయచేసి గమనించగలరు... (Please note this important update...)"}</p>
                            </div>
                          </div>
                        )}

                        {el.type === "Quote / Testimonial" && (
                          <div className="p-8 sm:p-12 bg-slate-900 rounded-[40px] text-center shadow-xl relative overflow-hidden">
                            <div className="absolute opacity-10 blur-xl top-0 left-1/4 w-1/2 h-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                            <h3 className="text-2xl sm:text-3xl font-black tracking-tighter text-white mb-2 relative z-10">{el.title || "Inspiring Quote"}</h3>
                            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full mb-8 relative z-10"></div>
                            <p className="text-lg sm:text-2xl font-medium text-slate-300 italic mb-8 relative z-10 mx-auto max-w-3xl leading-relaxed">
                              "{el.content || "Empowerment comes through information, and transparency is the key to progress."}"
                            </p>
                          </div>
                        )}

                        {el.type === "Upcoming Events" && (
                          <div className={`p-8 sm:p-12 bg-white border border-slate-100 shadow-sm rounded-[40px] max-w-5xl mx-auto`}>
                             <div className="flex justify-between items-center mb-8">
                               <h3 className="text-2xl sm:text-3xl font-black text-slate-800">{el.title || "రాబోయే కార్యక్రమాలు (Upcoming Events)"}</h3>
                               <button className="text-primary font-bold hover:underline hidden sm:block">View All</button>
                             </div>
                             <div className="space-y-4">
                               {[1, 2].map((i) => (
                                 <div key={i} className="flex flex-col sm:flex-row gap-4 sm:gap-6 bg-slate-50 p-4 sm:p-6 rounded-[24px] hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                                   <div className="bg-white rounded-2xl p-4 text-center min-w-[100px] shadow-sm border border-slate-100 flex flex-col justify-center">
                                      <span className="text-danger font-black text-xs uppercase tracking-widest leading-none">NOV</span>
                                      <span className="text-3xl font-black text-slate-800 mt-1">{i + 14}</span>
                                   </div>
                                   <div className="flex-1 flex flex-col justify-center">
                                     <h4 className="text-lg sm:text-xl font-bold text-slate-800">{el.content ? el.content.split('|')[0] : "గ్రామ సభ (Gram Sabha)"}</h4>
                                     <p className="text-slate-500 font-medium text-sm mt-1">{el.content && el.content.includes('|') ? el.content.split('|')[1] : "Panchayat Office, 10:00 AM"}</p>
                                   </div>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}

                        {el.type === "Gallery Grid" && (
                          <div className="max-w-6xl mx-auto bg-white p-6 sm:p-10 rounded-[40px] shadow-sm border border-slate-100">
                             <div className="text-center mb-8">
                               <h3 className="text-2xl sm:text-3xl font-black text-slate-800">{el.title || "గ్యాలరీ (Gallery)"}</h3>
                               <p className="text-slate-500 mt-2">{el.content || "Images of past events and development activities."}</p>
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                               <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden group relative">
                                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                   <span className="text-white font-bold">Event 1</span>
                                 </div>
                               </div>
                               <div className="aspect-square col-span-2 row-span-2 bg-slate-200 rounded-3xl overflow-hidden group relative">
                                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">Main Highlight</div>
                               </div>
                               <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden group relative"></div>
                               <div className="aspect-square bg-slate-200 rounded-3xl overflow-hidden group relative"></div>
                               <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden group relative"></div>
                             </div>
                          </div>
                        )}

                        {el.type === "Services Directory" && (
                          <div className={`p-8 sm:p-12 bg-gradient-to-br from-${el.color || "blue"}-50 to-white border border-slate-100 shadow-sm rounded-[40px]`}>
                             <div className="mb-10 text-center">
                               <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">{el.title || "సేవలు (Services)"}</h3>
                               <p className="text-slate-500">{el.content || "Quickly find the services you need."}</p>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                               {[1, 2, 3, 4, 5, 6].map(i => (
                                 <div key={i} className="flex items-start gap-4 p-5 bg-white rounded-[24px] shadow-sm border border-slate-100 hover:shadow-md transition-all">
                                   <div className={`w-12 h-12 bg-${el.color || "blue"}-50 text-${el.color || "blue"}-600 rounded-2xl flex items-center justify-center shrink-0`}>
                                     <Layers size={20} />
                                   </div>
                                   <div>
                                     <h4 className="text-base font-bold text-slate-800 mb-1">Service Name {i}</h4>
                                     <p className="text-xs text-slate-400">Description of the service and requirements.</p>
                                   </div>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}

                        {el.type === "Profiles / Staff" && (
                          <div className="py-12 bg-slate-50 rounded-[40px] border border-slate-100 mb-8">
                            <h3 className="text-2xl sm:text-3xl font-black text-center text-slate-800 mb-10">{el.title || "నాయకులు / అధికారులు"}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4 md:px-12">
                               {[1, 2, 3].map(i => (
                                 <div key={i} className="bg-white p-6 rounded-[32px] text-center shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all">
                                   <div className="w-24 h-24 mx-auto bg-slate-200 rounded-full mb-4 overflow-hidden border-4 border-slate-50 shadow-sm">
                                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 8}`} alt="Profile" className="w-full h-full object-cover" />
                                   </div>
                                   <h4 className="text-lg font-bold text-slate-800">Person Name</h4>
                                   <p className="text-sm font-bold text-slate-500 mb-2">{el.content || "Designation"}</p>
                                 </div>
                               ))}
                            </div>
                          </div>
                        )}

                        {el.type === "Video Showcase" && (
                          <div className={`p-8 sm:p-12 bg-${el.color || "slate"}-900 rounded-[40px] text-white shadow-xl mb-8`}>
                             <div className="flex justify-between items-center mb-8">
                               <h3 className="text-2xl sm:text-3xl font-black">{el.title || "వీడియోలు (Video Highlights)"}</h3>
                               <button className="bg-white/10 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/20 transition hidden sm:block">అన్ని చూడండి</button>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-800 aspect-video rounded-3xl flex items-center justify-center relative group cursor-pointer overflow-hidden border border-white/10 shadow-lg">
                                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition"></div>
                                   <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10 group-hover:scale-110 transition shadow-xl">
                                     <Play size={24} fill="currentColor" />
                                   </div>
                                </div>
                                <div className="flex flex-col gap-4 justify-between">
                                  {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white/5 p-3 sm:p-4 rounded-[24px] flex gap-4 items-center group cursor-pointer border border-white/5 hover:border-white/20 hover:bg-white/10 transition">
                                       <div className="aspect-video w-20 sm:w-28 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                                          <Play size={12} className="text-white/50 group-hover:text-white transition" fill="currentColor" />
                                       </div>
                                       <div>
                                         <h4 className="font-bold text-sm sm:text-base line-clamp-2">{el.content || "గ్రామ సభ సమావేశం ముఖ్యాంశాలు"}</h4>
                                         <p className="text-xs text-white/50 mt-1 font-medium">{i} days ago</p>
                                       </div>
                                    </div>
                                  ))}
                                </div>
                             </div>
                          </div>
                        )}

                        {el.type === "Document Downloads" && (
                          <div className={`p-8 sm:p-12 bg-white border border-${el.color || "blue"}-100 shadow-sm rounded-[40px] relative overflow-hidden mb-8`}>
                             <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">{el.title || "ముఖ్యమైన పత్రాలు (Documents)"}</h3>
                             <p className="text-slate-500 mb-8">{el.content || "Download necessary applications and government orders."}</p>
                             <div className="space-y-4">
                               {[1, 2, 3].map(i => (
                                 <div key={i} className="flex items-center justify-between p-4 sm:p-5 bg-slate-50 rounded-[24px] hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 group">
                                   <div className="flex items-center gap-4">
                                     <div className={`w-12 h-12 bg-${el.color || "blue"}-100 text-${el.color || "blue"}-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner`}>
                                       <FileText size={20} />
                                     </div>
                                     <div>
                                       <h4 className="font-bold text-slate-800 text-sm sm:text-base">Document_Format_Template_{i}.pdf</h4>
                                       <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-0.5 rounded-md shadow-sm border border-slate-100">PDF</span>
                                          <span className="text-xs font-bold text-slate-400">2.4 MB</span>
                                       </div>
                                     </div>
                                   </div>
                                   <button className={`w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-[16px] flex items-center justify-center shadow-sm border border-slate-200 text-slate-400 group-hover:text-white group-hover:bg-${el.color || "blue"}-600 transition-colors`}>
                                     <Download size={18} />
                                   </button>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}

                        {/* Fallback for undefined types */}
                        {!["Hero Section", "Post Grid", "Feature Cards", "Contact Banner", "E-Vedhika Core Feed", "Important Links", "Stats Highlight", "FAQ Section", "Alert Notice", "Quote / Testimonial", "Upcoming Events", "Gallery Grid", "Services Directory", "Profiles / Staff", "Video Showcase", "Document Downloads"].includes(el.type) && (
                          <div className="p-10 bg-white border-2 border-dashed border-slate-200 rounded-[40px] text-center">
                            <h3 className="text-xl font-black text-slate-400">{el.title || el.type}</h3>
                            <p className="text-slate-400 mt-2">{el.content || "Dynamic content section."}</p>
                          </div>
                        )}
                        
                        {el.type === "E-Vedhika Core Feed" && (
                          <>
                            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 sm:p-8 mb-8 flex flex-col gap-4">
                              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                                <div className="flex-1 w-full">
                                  <h3 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tighter text-center sm:text-left">
                                    {el.title || "📝 Updates"}
                                  </h3>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (!user) requireLoginAlert();
                                  else setShowPostForm(true);
                                }}
                                className="px-6 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all text-xs sm:text-sm w-full flex items-center justify-center gap-2 shrink-0"
                              >
                                <PlusCircle size={18} /> Public Post
                              </button>
                            </div>
                            <div className="space-y-10">
                              <AnimatePresence mode="popLayout">
                                {filteredPosts.slice(0, visiblePostsCount).flatMap((post, index) => {
                                  const renderIndex = index; // Optional: cap stagger delay if needed
                                  const items = [
                                    <motion.div
                                      key={post.id}
                                      initial={{ opacity: 0, y: 30 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: Math.min(renderIndex * 0.05, 0.5) }}
                                    >
                                      <PostCard
                                        post={post}
                                        isExpanded={expandedPosts.has(post.id)}
                                        toggleExpansion={() =>
                                          togglePostExpansion(post.id)
                                        }
                                        addToast={addToast}
                                        isAdmin={isEditor}
                                        onEdit={(p) => {
                                          setEditingPost(p);
                                          setShowPostForm(true);
                                        }}
                                        allUsers={allUsers}
                                      />
                                    </motion.div>,
                                  ];
                                  if ((index + 1) % 5 === 0) {
                                    items.push(
                                      <motion.div
                                        key={`ad-${post.id}`}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(renderIndex * 0.05, 0.5) }}
                                      >
                                        <AdBanner />
                                      </motion.div>,
                                    );
                                  }
                                  return items;
                                })}
                              </AnimatePresence>
                              
                              {filteredPosts.length > visiblePostsCount && (
                                <div className="pt-8 text-center">
                                  <button
                                    onClick={() => setVisiblePostsCount(prev => prev + 20)}
                                    className="px-8 py-3 bg-slate-50 text-slate-600 rounded-xl font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 hover:text-primary transition-all active:scale-95"
                                  >
                                    Load More Posts
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </motion.section>
                      );
                    })}

                    {(!siteConfig || !siteConfig.elements || siteConfig.elements.length === 0) && (
                      <div className="text-center py-20 text-slate-400 font-bold">
                        Home page layout is empty.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentTab === "workspace" && (
                <motion.div
                  key="workspace"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <AdBanner />
                  <DigitalWorkspaceSection addToast={addToast} user={user} />
                </motion.div>
              )}

              {currentTab === "chat" && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ChatSection
                    messages={chatMessages}
                    user={user}
                    addToast={addToast}
                    userProfile={userProfile}
                  />
                </motion.div>
              )}

              {currentTab === "union" && (
                <motion.div
                  key="union"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <button
                      aria-label="Back to Dashboard"
                      onClick={() => setCurrentTab("home")}
                      className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
                    >
                      <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                  </div>
                  <PollsScreen user={user} addToast={addToast} />
                </motion.div>
              )}

              {currentTab === "changelog" && (
                <motion.div
                  key="changelog"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-4xl mx-auto py-12"
                >
                  <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-3 bg-blue-50 px-6 py-2 rounded-full border border-blue-100 mb-4">
                      <Rocket
                        size={16}
                        className="text-blue-500 animate-bounce"
                      />
                      <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                        Platform Evolution • Latest: {SYSTEM_UPDATES[0]?.version}
                      </span>
                    </div>
                    <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-4">
                      E-Vedhika Journey
                    </h2>
                    <p className="text-slate-500 font-bold max-w-lg mx-auto">
                      Tracking the digital transformation and feature
                      deployments of the master portal.
                    </p>
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] mt-4">
                      Last Update Applied: {new Date(SYSTEM_UPDATES[0]?.time).toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} (IST)
                    </p>
                  </div>

                  <div className="relative space-y-12">
                    {/* Vertical Line */}
                    <div className="absolute left-7 lg:left-10 top-0 bottom-0 w-px bg-slate-200 z-0" />

                    {allUpdates
                      .filter(
                        (u) =>
                          u.type === "changelog" &&
                          u.status?.toLowerCase() !== "deleted",
                      )
                      .sort((a: any, b: any) => (b.time || 0) - (a.time || 0))
                      .slice(0, visibleUpdatesCount)
                      .map((u: any, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: Math.min(i * 0.1, 0.5) }}
                          key={u.id || i}
                          className="relative flex gap-6 z-10 pl-2 lg:pl-4"
                        >
                          <div
                            className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 ${u.isAutoPost ? "bg-indigo-50" : "bg-blue-50"}`}
                          >
                            {u.isAutoPost ? (
                              <PlusCircle
                                size={16}
                                className="text-indigo-500"
                              />
                            ) : (
                              <Zap size={16} className="text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 pt-2 lg:pt-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <h3 className="text-sm sm:text-base font-black text-slate-800">
                                  {u.version
                                    ? `Update ${u.version}`
                                    : u.id === "foundation"
                                      ? "Foundation Launch"
                                      : u.isAutoPost
                                        ? "Community Notice"
                                        : "System Update"}
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md w-max">
                                  {new Date(getValidTime(u)).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  const textToShare = u.title
                                    ? `${u.version ? u.version + " " : ""}${u.title}\n\n${u.text}`
                                    : u.text;
                                  handleShare(
                                    "E-Vedhika Update",
                                    typeof textToShare === "string"
                                      ? textToShare
                                      : "Check out this update on E-Vedhika",
                                    window.location.origin,
                                    () => addToast("Link copied!"),
                                  );
                                }}
                                className="hidden sm:flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-lg hover:bg-slate-50 shrink-0"
                                title="Share Update"
                              >
                                <Share2 size={16} />
                              </button>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow w-full overflow-hidden">
                              {u.version || u.title || u.badge ? (
                                <div className="text-left space-y-4">
                                  {(u.version || u.title) && (
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                      {u.version && (
                                        <kbd className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-black uppercase tracking-widest">
                                          {u.version}
                                        </kbd>
                                      )}
                                      {u.title && (
                                        <p className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                                          {u.title}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  <div className="bg-slate-50 sm:bg-white p-4 sm:p-5 rounded-2xl sm:border border-slate-100 sm:shadow-sm space-y-4 w-full">
                                    <div className="flex gap-3 sm:gap-4 items-start w-full">
                                      {u.badge && (
                                        <kbd className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-[10px] font-black uppercase mt-0.5 whitespace-nowrap">
                                          {u.badge}
                                        </kbd>
                                      )}
                                      <span className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap flex-1">
                                        {u.text}
                                      </span>
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
                    {allUpdates.filter(
                      (u) =>
                        u.type === "changelog" &&
                        u.status?.toLowerCase() !== "deleted",
                    ).length > visibleUpdatesCount && (
                      <div className="pt-8 text-center relative z-10 pl-2 lg:pl-4">
                        <button
                          onClick={() => setVisibleUpdatesCount((prev) => prev + 20)}
                          className="px-8 py-3 bg-slate-50 text-slate-600 rounded-xl font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 hover:text-primary transition-all active:scale-95"
                        >
                          Load More Updates
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentTab === "emergency" && (
                <motion.div
                  key="emergency"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[60vh]">
                    <div className="border-b border-slate-100 pb-4 mb-6">
                      <h2 className="text-xl sm:text-2xl font-black text-rose-600 flex flex-row items-center flex-wrap gap-2">
                        <span>🚨 Emergency & Helpline Contacts</span>
                      </h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        అత్యవసర ఫోన్ నంబర్లు
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        {
                          name: "Police (పోలీస్)",
                          number: "100",
                          icon: "🚓",
                          color: "blue",
                        },
                        {
                          name: "Ambulance (అంబులెన్స్)",
                          number: "108",
                          icon: "🚑",
                          color: "rose",
                        },
                        {
                          name: "Fire (అగ్నిమాపక దళం)",
                          number: "101",
                          icon: "🚒",
                          color: "red",
                        },
                        {
                          name: "Women Helpline (మహిళల హెల్ప్‌లైన్)",
                          number: "1091",
                          icon: "🛡️",
                          color: "purple",
                        },
                        {
                          name: "Child Helpline (ఛైల్డ్ హెల్ప్‌లైన్)",
                          number: "1098",
                          icon: "👶",
                          color: "amber",
                        },
                        {
                          name: "Cyber Crime (సైబర్ క్రైమ్)",
                          number: "1930",
                          icon: "💻",
                          color: "indigo",
                        },
                        {
                          name: "Anti-Corruption (అవినీతి నిరోధక)",
                          number: "14400",
                          icon: "⚖️",
                          color: "slate",
                        },
                        {
                          name: "Farmers Helpline (రైతుల హెల్ప్‌లైన్)",
                          number: "155251",
                          icon: "🌾",
                          color: "green",
                        },
                        {
                          name: "Disha Helpline (దిశ)",
                          number: "181",
                          icon: "👩",
                          color: "pink",
                        },
                      ].map((contact, i) => (
                        <div
                          key={i}
                          className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-rose-200 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-3xl lg:text-4xl group-hover:scale-110 transition-transform">
                              {contact.icon}
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-tight">
                                {contact.name}
                              </div>
                              <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tighter mt-1">
                                {contact.number}
                              </div>
                            </div>
                          </div>
                          <a
                            href={`tel:${contact.number}`}
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500 hover:bg-green-500 hover:text-white transition-colors border border-green-100"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentTab === "suggestions" && (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <AdBanner />
                  <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
                    <div className="border-b border-slate-100 pb-4 mb-6">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex flex-row items-center flex-wrap gap-2">
                        <Lightbulb className="text-amber-500 shrink-0" />
                        <span>e-Vedhika Suggestion Portal</span>
                      </h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        మీ సూచనలు మాకు ఎంతో ముఖ్యం
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="bg-[#f8fafc] rounded-2xl border border-slate-200 p-6 relative overflow-hidden">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                              Latest Suggestions
                            </h3>
                          </div>
                          <div
                            ref={suggestionsScrollRef}
                            onMouseEnter={() => setIsSuggestionsHovered(true)}
                            onMouseLeave={() => setIsSuggestionsHovered(false)}
                            className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2"
                          >
                            {approvedSuggestions.length > 0 ? (
                              [...approvedSuggestions]
                                .sort(
                                  (a, b) => getValidTime(b) - getValidTime(a),
                                )
                                .slice(0, visibleSuggestionsCount)
                                .map((s) => (
                                  <motion.div
                                    key={s.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{
                                      opacity: 1,
                                      y: 0,
                                      boxShadow: [
                                        "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                                        "0 0 8px 0 rgba(59, 130, 246, 0.2)",
                                        "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                                      ],
                                    }}
                                    transition={{
                                      boxShadow: {
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                      },
                                    }}
                                    className="bg-white p-3 rounded-xl border border-slate-100 hover:border-blue-300 transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-50">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[9px] font-black text-slate-400">
                                          {(s.name ||
                                            s.author ||
                                            "U")[0].toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-slate-700 leading-tight">
                                            {s.name || s.author || "Unknown"}
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
                                          {new Date(
                                            getValidTime(s),
                                          ).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                          })}
                                        </div>
                                        <div className="text-[8px] opacity-70">
                                          {new Date(
                                            getValidTime(s),
                                          ).toLocaleTimeString("en-IN", {
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-[13px] text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                      {s.msg || s.suggestion}
                                    </p>
                                  </motion.div>
                                ))
                            ) : (
                              <div className="text-center py-20 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                No submissions yet
                              </div>
                            )}
                            {approvedSuggestions.length > visibleSuggestionsCount && (
                              <div className="pt-4 text-center pb-4">
                                <button
                                  onClick={() => setVisibleSuggestionsCount(prev => prev + 20)}
                                  className="px-6 py-2 bg-slate-50 text-slate-600 rounded-xl font-black uppercase text-xs tracking-widest border border-slate-100 hover:bg-slate-100 hover:text-blue-500 transition-all active:scale-95"
                                >
                                  Load More Suggestions
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="relative bg-white p-5 sm:p-8 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col h-full">
                        {(!user || user?.isAnonymous) && (
                          <div
                            className="absolute inset-0 z-10 cursor-pointer bg-transparent rounded-3xl"
                            onClick={async () => {
                              const res = await Swal.fire({
                                title: "లాగిన్ అవసరం",
                                text: "మీరు లాగిన్ అయ్యాక ఏదైనా Suggestion & Feedback ఇవ్వచ్చు. మీరు లాగిన్ అవుతారా?",
                                icon: "info",
                                showCancelButton: true,
                                confirmButtonText: "లాగిన్ అవ్వండి",
                                cancelButtonText: "వద్దు",
                                confirmButtonColor: "#4f46e5",
                              });
                              if (res.isConfirmed) {
                                setShowAuthModal(true);
                              }
                            }}
                          />
                        )}
                        <div
                          className={
                            !user || user?.isAnonymous
                              ? "opacity-30 pointer-events-none"
                              : ""
                          }
                        >
                          <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">
                            Submit Suggestion & Feedback
                          </h3>
                          <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-tight mb-6">
                            మీ అమూల్యమైన సూచనలను ఇక్కడ నమోదు చేయండి
                          </p>

                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const target = e.target as any;
                              const name = target.name.value.trim();
                              const village = target.village.value.trim();
                              const mobile = target.mobile
                                ? target.mobile.value.trim()
                                : "";
                              const category = target.category.value;
                              const suggestion = target.suggestion.value.trim();

                              if (
                                !name ||
                                !village ||
                                !category ||
                                !suggestion ||
                                (userProfile?.gender !== "Female" && !mobile)
                              ) {
                                return addToast(
                                  "దయచేసి అన్ని వివరాలు నింపండి (Please fill all fields)",
                                );
                              }

                              if (mobile && !/^[0-9]{10}$/.test(mobile)) {
                                return addToast(
                                  "దయచేసి 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి",
                                );
                              }

                              try {
                                await addDoc(collection(db, "suggestions"), {
                                  name,
                                  village,
                                  mobile,
                                  category,
                                  suggestion,
                                  time: Date.now(),
                                  status: "pending",
                                  uid: user?.uid || "anonymous",
                                });
                                await logUserActivity(
                                  `Submitted Suggestion: ${category}`,
                                );
                                target.name.value = userProfile
                                  ? `${userProfile.name || ""} ${userProfile.surname || ""}`.trim()
                                  : "";
                                target.village.value = userProfile
                                  ? `${userProfile.mandal || ""} / ${userProfile.district || ""}`
                                      .trim()
                                      .replace(/^ \/ | \/ $/g, "")
                                  : "";
                                if (target.mobile)
                                  target.mobile.value =
                                    userProfile?.mobile || "";
                                target.category.value = "";
                                target.suggestion.value = "";

                                Swal.fire({
                                  title: "✅ సక్సెస్!",
                                  text: "మీ సూచన విజయవంతంగా నమోదు చేయబడింది.",
                                  icon: "success",
                                  confirmButtonColor: "#0d3b66",
                                });
                              } catch (error) {
                                handleFirestoreError(
                                  error,
                                  OperationType.CREATE,
                                  "suggestions",
                                );
                                addToast("సబ్మిట్ చేయడంలో లోపం కలిగింది.");
                              }
                            }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                  మీ పేరు (Name)
                                </label>
                                <input
                                  name="name"
                                  type="text"
                                  defaultValue={
                                    userProfile
                                      ? `${userProfile.name || ""} ${userProfile.surname || ""}`.trim()
                                      : ""
                                  }
                                  placeholder="Enter your name"
                                  className="w-full bg-slate-50 border-slate-100 rounded-xl p-3 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20"
                                  required
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                  జిల్లా / మండలం (Area)
                                </label>
                                <input
                                  name="village"
                                  type="text"
                                  defaultValue={
                                    userProfile
                                      ? `${userProfile.mandal || ""} / ${userProfile.district || ""}`
                                          .trim()
                                          .replace(/^ \/ | \/ $/g, "")
                                      : ""
                                  }
                                  placeholder="District / Mandal"
                                  className="w-full bg-slate-50 border-slate-100 rounded-xl p-3 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {userProfile?.gender !== "Female" && (
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                    మొబైల్ నంబర్ (Mobile)
                                  </label>
                                  <input
                                    name="mobile"
                                    type="tel"
                                    defaultValue={userProfile?.mobile || ""}
                                    maxLength={10}
                                    placeholder="10 Digit Number"
                                    className="w-full bg-slate-50 border-slate-100 rounded-xl p-3 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    required
                                  />
                                </div>
                              )}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                  విభాగం (Category)
                                </label>
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
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                మీ సూచన (Suggestion)
                              </label>
                              <textarea
                                name="suggestion"
                                placeholder="మీ సూచన ఇక్కడ టైప్ చేయండి..."
                                rows={4}
                                className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                required
                              ></textarea>
                            </div>

                            <button
                              aria-label="Submit Entry"
                              type="submit"
                              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                            >
                              Submit Entry
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentTab === "gos_formats" && (
                <motion.div
                  key="gos_formats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <GosAndFormatsPublic
                    user={user}
                    addToast={addToast}
                    isAdmin={isAdmin}
                  />
                </motion.div>
              )}

              {currentTab === "useful_links" && (
                <motion.div
                  key="useful_links"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="section-card card-indigo">
                    <h2 className="text-2xl font-black text-indigo-900 mb-6 flex items-center gap-2">
                      <ExternalLink size={24} className="text-indigo-600" />{" "}
                      Useful Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          name: "ePanchayat Home",
                          desc: "Panchayat Raj & Rural Development Home",
                          url: "https://epanchayat.telangana.gov.in/",
                          color:
                            "bg-emerald-50 text-emerald-700 border-emerald-100",
                        },
                        {
                          name: "Online Tax Collection Report R 2.1 House Tax DCB",
                          desc: "Property Tax Payment & Search Portal",
                          url: "https://epanchayat.telangana.gov.in/epmis/epmisPRHTAXDCBLive.jsp",
                          color: "bg-blue-50 text-blue-700 border-blue-100",
                        },
                        {
                          name: "UBD Portal",
                          desc: "Urban Building Department Telangana",
                          url: "https://ubd.telangana.gov.in/",
                          color: "bg-rose-50 text-rose-700 border-rose-100",
                        },
                        {
                          name: "UBD MIS Total Status",
                          desc: "Urban Building Department Total Status Report",
                          url: "https://ubdmis.telangana.gov.in/ubdmisTGTotalStatus.do?rlb_type=3&pstcode=35&style=bluetheme",
                          color: "bg-pink-50 text-pink-700 border-pink-100",
                        },
                        {
                          name: "TSEC-Te Poll login",
                          desc: "State Election Commission Login",
                          url: "https://tsec.telangana.gov.in/",
                          color:
                            "bg-indigo-50 text-indigo-700 border-indigo-100",
                        },
                        {
                          name: "eGramSwaraj",
                          desc: "Simplified Work Based Accounting System",
                          url: "https://egramswaraj.gov.in/",
                          color:
                            "bg-orange-50 text-orange-700 border-orange-100",
                        },
                        {
                          name: "PFMS Portal",
                          desc: "Public Financial Management System",
                          url: "https://pfms.nic.in/",
                          color:
                            "bg-purple-50 text-purple-700 border-purple-100",
                        },
                        {
                          name: "AuditOnline Portal",
                          desc: "Online Audit for Panchayati Raj",
                          url: "https://auditonline.gov.in/",
                          color:
                            "bg-indigo-50 text-indigo-700 border-indigo-100",
                        },
                        {
                          name: "LGdirectory Portal",
                          desc: "Local Government Directory Services",
                          url: "https://lgdirectory.gov.in/",
                          color: "bg-cyan-50 text-cyan-700 border-cyan-100",
                        },
                        {
                          name: "GPDP Portal",
                          desc: "ఇది MPDO/ MPO లోగిన్స్ ద్వార GPDP కోసం గ్రామా సభ తాయారు చేసే సైట్",
                          url: "https://gpdp.nic.in/",
                          color: "bg-amber-50 text-amber-700 border-amber-100",
                        },
                        {
                          name: "Panchayat Awards Portal",
                          desc: "National Panchayat Awards System",
                          url: "https://panchayataward.gov.in/",
                          color:
                            "bg-emerald-50 text-emerald-700 border-emerald-100",
                        },
                        {
                          name: "DARPG Awards Portal",
                          desc: "Administrative Reforms Awards Portal",
                          url: "https://da-awards.gov.in/",
                          color: "bg-blue-50 text-blue-700 border-blue-100",
                        },
                        {
                          name: "DARPG Reports",
                          desc: "Committee Recommendation Status Reports",
                          url: "https://reports.darpg.gov.in/",
                          color: "bg-slate-50 text-slate-700 border-slate-100",
                        },
                        {
                          name: "Panchayat Nirnay Portal",
                          desc: "ఇది మనమ GPDP కోసం Theams సెలెక్ట్ చేసుకునే వెబ్సైటు",
                          url: "https://meetingonline.gov.in/homepage/official-login",
                          color:
                            "bg-orange-50 text-orange-700 border-orange-100",
                        },
                      ].map((link) => (
                        <a
                          key={link.name}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-5 rounded-3xl border transition-all hover:scale-[1.02] active:scale-95 flex flex-col gap-2 shadow-sm ${link.color}`}
                        >
                          <h4 className="font-black uppercase tracking-tight text-[11px] leading-tight flex-1">
                            {link.name}
                          </h4>
                          <p className="text-[10px] font-bold opacity-80 leading-relaxed">
                            {link.desc}
                          </p>
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest leading-none">
                            Visit Portal <ArrowUpRight size={14} />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentTab === "excel_print" && (
                <motion.div
                  key="excel_print"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ExcelPrinterTool />
                </motion.div>
              )}

              {currentTab === "my_activity" && (
                <motion.div
                  key="my_activity"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <MyActivity
                    user={user}
                    userProfile={userProfile}
                    problems={problemsGlobal}
                    suggestions={approvedSuggestions}
                    posts={posts}
                  />
                </motion.div>
              )}

              {currentTab === "problems" && (
                <motion.div
                  key="problems"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <button
                      aria-label="Back to Dashboard"
                      onClick={() => setCurrentTab("home")}
                      className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
                    >
                      <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                  </div>
                  <div className="section-card card-gold !border-t-danger">
                    <h2 className="text-2xl font-black text-primary mb-6">
                      🚩 Report an Issue
                    </h2>
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mb-8">
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const target = e.target as any;
                          const cat = target.category.value;
                          if (requireLoginAlert(user)) return;
                          try {
                            await addDoc(collection(db, "problems"), {
                              msg: problemMessage,
                              category: cat,
                              status: "pending",
                              time: Date.now(),
                              uid: user.uid,
                              userEmail: user.email || "",
                              userName: userProfile?.name || user.displayName || "Portal User",
                              isAnonymous: problemIsAnonymous,
                              wantsWhatsAppUpdates: problemWantsWhatsApp,
                            });
                            await logUserActivity(`Reported Problem: ${cat}`);
                            addToast(
                              "Problem reported successfully!" +
                                (problemWantsWhatsApp
                                  ? " You will receive SMS/WhatsApp updates."
                                  : ""),
                            );
                            target.reset();
                            setProblemMessage("");
                            setProblemIsAnonymous(false);
                            setProblemWantsWhatsApp(true);
                          } catch (err) {
                            handleFirestoreError(
                              err,
                              OperationType.WRITE,
                              "problems",
                            );
                          }
                        }}
                        className="space-y-4"
                      >
                        <input
                          name="category"
                          placeholder="Category (e.g. Aadhar, Water, Tax)"
                          required
                          className="bg-white w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-danger/20"
                        />
                        <div className="relative">
                          <textarea
                            name="message"
                            placeholder="Explain your problem in detail (or use voice to text)..."
                            required
                            rows={3}
                            className="bg-white w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-danger/20"
                            value={problemMessage}
                            onChange={(e) => setProblemMessage(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={handleRecordProblem}
                            className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${isRecordingProblem ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                            title="Voice to text"
                          >
                            <Mic size={18} />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mt-2">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={problemIsAnonymous}
                              onChange={(e) =>
                                setProblemIsAnonymous(e.target.checked)
                              }
                              className="w-4 h-4 rounded text-danger focus:ring-danger"
                            />
                            Anonymous Reporting (పేరు బయటపెట్టకుండా)
                          </label>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={problemWantsWhatsApp}
                              onChange={(e) =>
                                setProblemWantsWhatsApp(e.target.checked)
                              }
                              className="w-4 h-4 rounded text-green-600 focus:ring-green-600"
                            />
                            Get updates on WhatsApp/SMS
                          </label>
                        </div>

                        <button
                          aria-label="Submit Report"
                          className="w-full bg-danger text-white py-3 rounded-xl font-black shadow-md hover:opacity-90"
                        >
                          Submit Report
                        </button>
                      </form>
                    </div>
                    <div className="space-y-4">
                      {problemsGlobal.slice(0, visibleProblemsCount).map((p) => (
                        <div
                          key={p.id}
                          className="p-4 bg-white border border-slate-200 rounded-2xl border-l-4 border-danger"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black text-danger uppercase tracking-widest">
                              {p.category}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.status === "solved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                            >
                              {p.status?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-700">
                            {p.msg}
                          </p>

                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-400">
                              {p.isAnonymous ? "Anonymous User" : "Citizen"}
                            </span>
                            <button
                              onClick={() => {
                                const shareText = `Please support this issue in our village app:\nCategory: ${p.category}\nProblem: ${p.msg}`;
                                if (navigator.share) {
                                  navigator
                                    .share({
                                      title: "Important Issue",
                                      text: shareText,
                                    })
                                    .catch(console.error);
                                } else {
                                  window.open(
                                    `https://wa.me/?text=${encodeURIComponent(shareText)}`,
                                    "_blank",
                                  );
                                }
                              }}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors uppercase tracking-widest"
                            >
                              <Share2 size={14} /> Share Issue
                            </button>
                          </div>
                        </div>
                      ))}
                      {problemsGlobal.length > visibleProblemsCount && (
                        <div className="pt-4 text-center pb-4">
                          <button
                            onClick={() => setVisibleProblemsCount(prev => prev + 20)}
                            className="px-8 py-3 bg-slate-50 text-slate-600 rounded-xl font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 hover:text-danger transition-all active:scale-95"
                          >
                            Load More Issues
                          </button>
                        </div>
                      )}
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
                <PostForm
                  key={editingPost?.id || "new"}
                  addToast={addToast}
                  onCancel={() => {
                    setShowPostForm(false);
                    setEditingPost(null);
                  }}
                  currentUserProfile={userProfile}
                  editingPost={editingPost}
                  isAdmin={isAdmin}
                  isEditor={isEditor}
                />
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
                <SuggestionForm
                  addToast={addToast}
                  onCancel={() => setShowSuggestionForm(false)}
                />
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
                setCurrentTab("home");
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
      </div>
      <ManaBot currentTab={currentTab} userName={userProfile?.name} />
    </div>
  );
}

function EditProfileModal({
  onClose,
  onExitForced,
  user,
  userProfile,
  addToast,
  isForced,
  onComplete,
  districtsData,
}: {
  onClose: () => void;
  onExitForced?: () => void;
  user: any;
  userProfile: UserProfile | null;
  addToast: (s: string) => void;
  isForced?: boolean;
  onComplete?: () => void;
  districtsData: Record<string, string[]>;
}) {
  const [surname, setSurname] = useState(userProfile?.surname || "");
  const [name, setName] = useState(userProfile?.name || "");
  const [username, setUsername] = useState(
    userProfile?.username || user?.displayName || "",
  );
  const [gender, setGender] = useState(userProfile?.gender || "");
  const [state, setState] = useState(userProfile?.state || "Telangana");
  const [district, setDistrict] = useState(userProfile?.district || "");
  const [mandal, setMandal] = useState(userProfile?.mandal || "");
  const [village, setVillage] = useState(userProfile?.village || "");
  const [mobile, setMobile] = useState(userProfile?.mobile || "");
  const [email, setEmail] = useState(userProfile?.email || user?.email || "");
  const [photoURL, setPhotoURL] = useState(
    userProfile?.photoURL || user?.photoURL || "",
  );
  const [designation, setDesignation] = useState(
    userProfile?.designation || "",
  );
  const [office, setOffice] = useState(userProfile?.office || "");
  const [theme, setTheme] = useState<"light" | "dark" | "system">(
    userProfile?.theme || "system",
  );
  const [notifications, setNotifications] = useState(
    userProfile?.notifications ?? true,
  );
  const [saving, setSaving] = useState(false);

  const mandals = district ? districtsData[district] || [] : [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!username || !name || !surname || (gender !== "Female" && !mobile)) {
      addToast("Please fill all required fields (*)");
      return;
    }
    setSaving(true);
    try {
      // Check if username changed and is unique
      if (username !== userProfile?.username) {
        const lowerUsername = username.toLowerCase().trim();
        const usernameDoc = await getDoc(doc(db, "usernames", lowerUsername));
        if (usernameDoc.exists() && usernameDoc.data().uid !== user.uid) {
          addToast("Username already taken. Please choose another.");
          setSaving(false);
          return;
        }

        // Remove old username if exists
        if (userProfile?.username) {
          await deleteDoc(
            doc(db, "usernames", userProfile.username.toLowerCase().trim()),
          );
        }

        // Reserve new username
        await setDoc(doc(db, "usernames", lowerUsername), { uid: user.uid });
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
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
          time: userProfile?.time || Date.now(),
        },
        { merge: true },
      );

      if (designation === "Citizen") {
        Swal.fire({
          title: "సిటిజన్ గారికి నమస్కారం",
          text: "ప్రస్తుతం ఈ వేదిక Webportal సిటిజన్ సర్వీస్ ఇంకా అందుబాటులోకి రాలేదు. రాగానే మీ మొబైల్ నెంబర్ కి మెసేజ్ లేదా ఇమెయిల్ ద్వారా మీకు సమాచారం ఇవ్వడం జరుగుతుంది.",
          icon: "info",
          confirmButtonText: "సరే (OK)",
          confirmButtonColor: "#0d3b66",
        });
      } else {
        addToast("Profile updated successfully!");
      }

      if (onComplete) onComplete();
      onClose();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      if (err.message.includes("offline")) {
        addToast(
          "Error: Connection lost. Please check your internet or refresh the page.",
        );
      } else {
        addToast(getFriendlyError(err));
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
          <button
            aria-label="Close profile modal"
            onClick={onClose}
            className="absolute top-6 right-6 bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">
            Profile Setup
          </h2>
          <div className="flex justify-center mt-1">
            <p className="bg-accent text-primary px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.12em] shadow-sm">
              {isForced
                ? "Complete your identity to continue"
                : "Update your portal credentials & Workplace Details"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-[20px] overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center relative group">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User size={30} className="text-slate-300" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera size={16} className="text-white" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">
                Surname *
              </label>
              <input
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
                className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs"
                placeholder="Surname"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">
                Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs"
                placeholder="Name"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">
              Display Name / Username *
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs"
              placeholder="Username"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  if (e.target.value === "Female") setMobile("");
                }}
                className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs"
              >
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            {gender !== "Female" && (
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">
                  Mobile No *
                </label>
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs"
                  placeholder="Mobile Number"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">
                State
              </label>
              <select
                className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl outline-none font-bold text-xs cursor-not-allowed"
                disabled
              >
                <option>Telangana</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">
                District
              </label>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setMandal("");
                }}
                className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs"
              >
                <option value="">Select District</option>
                {Object.keys(districtsData)
                  .sort()
                  .map((d) => (
                    <option key={d}>{d}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">
                Mandal
              </label>
              <select
                value={mandal}
                onChange={(e) => setMandal(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs"
                disabled={!district}
              >
                <option value="">Select Mandal</option>
                {mandals.map((m, idx) => (
                  <option key={`${m}_${idx}`} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">
                Village / GP
              </label>
              <input
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs"
                placeholder="Village"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">
              Designation
            </label>
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Type Designation (e.g. e-Panchayat, MPO)"
              className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block ml-1 tracking-wider">
              Office Address
            </label>
            <input
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              placeholder="Office location / Building"
              className="w-full bg-slate-50 border-2 border-transparent p-2 rounded-xl focus:border-primary/20 outline-none font-bold text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[10px] font-black uppercase text-slate-600">
                  Theme
                </span>
                <select
                  value={theme}
                  onChange={(e) =>
                    setTheme(e.target.value as "light" | "dark" | "system")
                  }
                  className="bg-transparent text-right font-bold text-[10px] outline-none cursor-pointer"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[10px] font-black uppercase text-slate-600">
                  Notifications
                </span>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            {!isForced && (
              <>
                <button
                  aria-label="Cancel"
                  type="button"
                  onClick={onClose}
                  className="flex-1 min-w-[120px] bg-slate-100 text-slate-600 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  aria-label="Logout"
                  type="button"
                  onClick={() => {
                    auth.signOut();
                    onClose();
                  }}
                  className="flex-1 min-w-[120px] bg-red-50 text-red-600 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-100 transition-all active:scale-95 border border-red-200 flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            )}
            {isForced && (
              <button
                aria-label="Exit to Home"
                type="button"
                onClick={onExitForced}
                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >
                Exit to Home
              </button>
            )}
            <button
              aria-label="Save Profile Changes"
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase text-sm tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-3"
              style={{ background: "#0d3b66" }}
            >
              {saving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Save Profile Changes"
              )}
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
      <p className="text-sm font-black text-slate-800">
        {time.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>
      <p className="text-[14px] font-mono font-black text-slate-600 tracking-wider">
        {time.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </p>
    </div>
  );
}

function LocationManager({
  districtsData,
  addToast,
}: {
  districtsData: Record<string, string[]>;
  addToast: (s: string) => void;
}) {
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
  const [newDistrict, setNewDistrict] = useState("");
  const [newMandalMap, setNewMandalMap] = useState<Record<string, string>>({});

  const writeData = async (data: Record<string, string[]>) => {
    try {
      await setDoc(
        doc(db, "settings", "locations"),
        { data, updatedAt: Date.now() },
        { merge: true },
      );
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
          <h4 className="text-2xl font-black text-primary mb-1">
            Location Management
          </h4>
          <p className="text-xs text-slate-400 font-medium tracking-tight">
            Add or remove districts and mandals available in the system
            dropdowns.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
        <div className="flex-1">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">
            Add New District
          </h5>
          <input
            value={newDistrict}
            onChange={(e) => setNewDistrict(e.target.value)}
            placeholder="e.g. Medchal-Malkajgiri"
            className="w-full bg-white border-none p-4 rounded-2xl outline-none font-bold text-sm shadow-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            aria-label="Add District"
            onClick={() => {
              if (!newDistrict) return;
              if (districtsData[newDistrict.trim()]) {
                addToast("District already exists");
                return;
              }
              const updated = { ...districtsData, [newDistrict.trim()]: [] };
              writeData(updated);
              setNewDistrict("");
            }}
            className="h-[52px] px-6 bg-[#0f2e4a] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-colors shadow-lg active:scale-95 flex items-center justify-center"
          >
            Add District
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(districtsData)
          .sort()
          .map((d) => (
            <div
              key={d}
              className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col group"
            >
              <div className="p-5 flex items-center justify-between bg-slate-50/50 group-hover:bg-slate-50 transition-colors">
                <h3 className="font-black text-[#0f2e4a] flex items-center gap-2">
                  <MapPin size={16} className="text-blue-500" />
                  {d}
                </h3>
                <div className="flex gap-2">
                  <button
                    aria-label="Toggle Expand"
                    onClick={() =>
                      setExpandedDistrict(expandedDistrict === d ? null : d)
                    }
                    className="p-2 text-slate-400 hover:text-[#0f2e4a] hover:bg-slate-200/50 rounded-xl transition-colors"
                  >
                    <ChevronRight
                      size={18}
                      className={`transition-transform ${expandedDistrict === d ? "rotate-90" : ""}`}
                    />
                  </button>
                  <button
                    aria-label="Delete District"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to delete ${d} and all its mandals?`,
                        )
                      ) {
                        const updated = { ...districtsData };
                        delete updated[d];
                        writeData(updated);
                      }
                    }}
                    className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {expandedDistrict === d && (
                <div className="p-5 border-t border-slate-100 bg-white">
                  <div className="flex gap-2 mb-4">
                    <input
                      value={newMandalMap[d] || ""}
                      onChange={(e) =>
                        setNewMandalMap({
                          ...newMandalMap,
                          [d]: e.target.value,
                        })
                      }
                      placeholder="New Mandal Name"
                      className="flex-1 bg-slate-50 border border-slate-200 outline-none p-3 rounded-xl font-bold text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const m = newMandalMap[d]?.trim();
                          if (m) {
                            const updated = {
                              ...districtsData,
                              [d]: [
                                ...(districtsData[d] || []).filter(
                                  (x) => x !== m,
                                ),
                                m,
                              ].sort(),
                            };
                            writeData(updated);
                            setNewMandalMap({ ...newMandalMap, [d]: "" });
                          }
                        }
                      }}
                    />
                    <button
                      aria-label="Add Mandal"
                      onClick={() => {
                        const m = newMandalMap[d]?.trim();
                        if (m) {
                          const updated = {
                            ...districtsData,
                            [d]: [
                              ...(districtsData[d] || []).filter(
                                (x) => x !== m,
                              ),
                              m,
                            ].sort(),
                          };
                          writeData(updated);
                          setNewMandalMap({ ...newMandalMap, [d]: "" });
                        }
                      }}
                      className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {districtsData[d].map((m: string) => (
                      <div
                        key={m}
                        className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2"
                      >
                        <span className="text-xs font-bold text-slate-600">
                          {m}
                        </span>
                        <button
                          aria-label="Delete Mandal"
                          onClick={() => {
                            const updated = {
                              ...districtsData,
                              [d]: districtsData[d].filter(
                                (x: string) => x !== m,
                              ),
                            };
                            writeData(updated);
                          }}
                          className="text-slate-300 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-0.5 rounded-full"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {districtsData[d].length === 0 && (
                      <div className="w-full p-4 text-center text-xs font-bold text-slate-300 border-2 border-dashed border-slate-100 rounded-xl">
                        No mandals added yet.
                      </div>
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

function MyActivity({ user, userProfile, problems, suggestions, posts }: any) {
  const [activeTab, setActiveTab] = useState<"problems" | "suggestions">(
    "problems",
  );

  const myProblems = problems.filter(
    (p: any) => p.userId === user?.uid || p.authorId === user?.uid,
  );
  const mySuggestions = suggestions.filter(
    (s: any) =>
      s.authorId === user?.uid || s.userId === user?.uid || s.uid === user?.uid,
  );

  return (
    <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[60vh]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary flex items-center gap-2 mb-2">
            <span className="text-3xl">📋</span> My Activity & Reports
          </h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">
            Track the status of your submitted issues and feedback
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-100 pb-2 overflow-x-auto custom-scrollbar">
        <button
          aria-label="My Problems"
          onClick={() => setActiveTab("problems")}
          className={`py-2 px-4 font-black text-sm uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "problems" ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-600"}`}
        >
          My Problems ({myProblems.length})
        </button>
        <button
          aria-label="My Suggestions"
          onClick={() => setActiveTab("suggestions")}
          className={`py-2 px-4 font-black text-sm uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "suggestions" ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-600"}`}
        >
          My Suggestions ({mySuggestions.length})
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === "problems" &&
          (myProblems.length > 0 ? (
            myProblems.map((p: any) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
                      {p.category}
                    </span>
                    <span
                      className={`px-3 text-[10px] font-black uppercase tracking-widest py-1 rounded-full ${p.status === "resolved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {p.status || "Pending"}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 mt-2">
                    {p.title || p.desc?.substring(0, 50)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {p.desc}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2">
                    Submitted on:{" "}
                    {new Date(p.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center font-bold text-slate-400">
              No problems reported yet.
            </div>
          ))}

        {activeTab === "suggestions" &&
          (mySuggestions.length > 0 ? (
            mySuggestions.map((s: any) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 text-[10px] font-black uppercase tracking-widest py-1 rounded-full ${s.status === "approved" || s.status === "resolved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {s.status === "approved" || s.status === "resolved"
                        ? "Published"
                        : s.status || "Under Review"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-2">
                    {s.text || s.msg || s.suggestion}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2">
                    Submitted on:{" "}
                    {new Date(
                      s.time || s.createdAt || Date.now(),
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center font-bold text-slate-400">
              No suggestions submitted yet.
            </div>
          ))}
      </div>
    </div>
  );
}

export const DEFAULT_HOME_ELEMENTS = [
  {
    id: 1,
    type: "E-Vedhika Core Feed",
    title: "📝 Updates",
    content: "Search latest news, reports or notices...",
    color: "blue",
    hidden: false,
  },
  {
    id: 2,
    type: "Hero Section",
    title: "Welcome to E-Vedhika",
    content: "Empowering citizens through digital transparency and direct access to government services.",
    color: "blue",
    hidden: true,
  },
  {
    id: 3,
    type: "Post Grid",
    title: "Recent Updates",
    content: "Official Broadcasts & News",
    color: "blue",
    hidden: true,
  },
  {
    id: 4,
    type: "Feature Cards",
    color: "indigo",
    hidden: true,
  },
  {
    id: 5,
    type: "Contact Banner",
    title: "Have a suggestion?",
    content: "Your feedback helps us build a better digital ecosystem for everyone.",
    color: "slate",
    hidden: true,
  }
];

function AdminPanel({
  addToast,
  posts,
  problems,
  suggestions,
  users,
  user,
  setAdminLocked,
  adminLocked,
  notifications,
  requests,
  updates,
  userRole,
  onExit,
  onNewPost,
  onEditPost,
  isDevEmail,
  currentAdminPin,
  setCurrentAdminPin,
  districtsData,
  currentTab,
  userProfile,
}: any) {
  const isAdmin = userRole === "admin" || isDevEmail;
  const isEditor = userRole === "admin" || userRole === "editor" || isDevEmail;
  const [activeSubTab, setActiveSubTab] = useState("dash");
  const [builderElements, setBuilderElements] = useState<any[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editingElementId, setEditingElementId] = useState<number | null>(null);

  useEffect(() => {
    if (!isEditor) return;
    const unsub = onSnapshot(doc(db, "site_settings", "home_page"), (snap) => {
      if (snap.exists() && snap.data().elements && snap.data().elements.length > 0) {
        setBuilderElements(snap.data().elements);
      } else {
        setBuilderElements(DEFAULT_HOME_ELEMENTS);
      }
    });
    return () => unsub();
  }, [isEditor]);

  const handlePublish = async () => {
    try {
      await setDoc(doc(db, "site_settings", "home_page"), {
        elements: builderElements,
        updatedAt: Date.now(),
        updatedBy: user?.email || "Admin",
      });
      addToast("Page Published Successfully! Changes are now live.");
    } catch (err) {
      addToast("Failed to publish page: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const moveElement = (index: number, direction: "up" | "down") => {
    const newElements = [...builderElements];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newElements.length) return;
    [newElements[index], newElements[targetIndex]] = [
      newElements[targetIndex],
      newElements[index],
    ];
    setBuilderElements(newElements);
  };

  const updateElementProps = (id: number, props: any) => {
    setBuilderElements(
      builderElements.map((el) => (el.id === id ? { ...el, ...props } : el)),
    );
  };
  const [visibleUsersCount, setVisibleUsersCount] = useState(20);
  const [usersFilter, setUsersFilter] = useState<"All" | "Deleted">("All");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [trashTab, setTrashTab] = useState<
    "posts" | "problems" | "suggestions" | "users" | "updates" | "gos_formats"
  >("posts");
  const [userViewMode, setUserViewMode] = useState<"access" | "directory">(
    "access",
  );
  const [showPin, setShowPin] = useState(false);
  const [logType, setLogType] = useState<"admin" | "public">("admin");
  const [logActionFilter, setLogActionFilter] = useState("");
  const [logAdminFilter, setLogAdminFilter] = useState("");
  const [logSearchTerm, setLogSearchTerm] = useState("");

  const exportLogsToCSV = () => {
    const filteredLogs = logs.filter((log) => {
      const isCorrectType = logType === "admin" ? !!log.admin : !log.admin;
      const matchesAction =
        logActionFilter === "" ||
        (log.action || "")
          .toLowerCase()
          .includes(logActionFilter.toLowerCase());
      const matchesAdmin =
        logAdminFilter === "" ||
        (log.admin || log.userEmail || log.userId || "")
          .toLowerCase()
          .includes(logAdminFilter.toLowerCase());
      return isCorrectType && matchesAction && matchesAdmin;
    });

    if (filteredLogs.length === 0) {
      addToast("No logs to export");
      return;
    }

    const headers = ["Trace ID", "Subject", "Action", "Time", "Status"];
    const rows = filteredLogs.map((log) => [
      log.id || "",
      log.admin || log.userEmail || log.userId || "Anonymous",
      log.action || "System Event",
      new Date(getValidTime(log)).toLocaleString(),
      "Verified",
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows
        .map((e) =>
          e
            .map(String)
            .map((s) => `"${s.replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security_logs_${logType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Logs exported as CSV");
  };

  const [reportsType, setReportsType] = useState<"issues" | "posts">("posts");
  const [reportsFilter, setReportsFilter] = useState<
    "All" | "Pending" | "Approved" | "Flagged" | "Resolved" | "Deleted"
  >("All");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [allProblems, setAllProblems] = useState<ProblemReport[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleBulkApprove = async () => {
    let col =
      activeSubTab === "suggestions"
        ? "suggestions"
        : reportsType === "posts"
          ? "posts"
          : "problems";
    for (const id of selectedItems) {
      try {
        await updateDoc(doc(db, col, id), {
          status:
            col === "posts" || col === "suggestions"
              ? col === "suggestions"
                ? "approved"
                : "Approved"
              : "solved",
        });
      } catch (e) {}
    }
    setSelectedItems([]);
    addToast(`Bulk Approved ${selectedItems.length} items`);
  };

  const handleRestartServer = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (let reg of regs) {
          await reg.update();
        }
      }
      const res = await fetch("/api/admin/restart", { method: "POST" });
      if (res.ok) {
        addToast(
          "Server restarting & Apps Cache cleared! Reloading...",
        );
        setTimeout(() => window.location.reload(), 1500);
      } else {
        addToast("Refreshing local PWA caches...");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      addToast("Refreshing local PWA caches...");
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleBulkDelete = async () => {
    let col =
      activeSubTab === "suggestions"
        ? "suggestions"
        : reportsType === "posts"
          ? "posts"
          : "problems";
    const res = await Swal.fire({
      title: "Delete Selected?",
      text: `Are you sure you want to delete ${selectedItems.length} items?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
    });
    if (res.isConfirmed) {
      for (const id of selectedItems) {
        try {
          await updateDoc(doc(db, col, id), {
            status: "Deleted",
            deletedAt: Date.now(),
          });
        } catch (e) {}
      }
      setSelectedItems([]);
      addToast(`Bulk Deleted ${selectedItems.length} items`);
    }
  };

  useEffect(() => {
    if (!isEditor) return;

    const unsubProblems = onSnapshot(
      collection(db, "problems"),
      (snap) => {
        const pList: ProblemReport[] = [];
        snap.forEach((d) => pList.push({ id: d.id, ...(d.data() as any) }));
        setAllProblems(pList);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "problems"),
    );

    let unsubLogs = () => {};
    if (isAdmin) {
      unsubLogs = onSnapshot(
        query(
          collection(db, "security_logs"),
          orderBy("time", "desc"),
          limit(100),
        ),
        (snap) => {
          const lList: any[] = [];
          snap.forEach((d) => lList.push({ id: d.id, ...d.data() }));
          setLogs(lList);
          setLogsError(false);
        },
        (err) => {
          setLogsError(true);
          handleFirestoreError(err, OperationType.LIST, "security_logs");
        },
      );
    }

    return () => {
      unsubProblems();
      unsubLogs();
    };
  }, [isEditor, isAdmin]);

  const deleteUser = async (id: string) => {
    const res = await Swal.fire({
      title: "Move to Trash?",
      text: "This user will be marked as deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Trash It",
    });
    if (!res.isConfirmed) return;
    try {
      await updateDoc(doc(db, "users", id), { isDeleted: true });
      addToast("User moved to trash");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
  };

  const resolveProblem = async (problem: ProblemReport) => {
    try {
      await updateDoc(doc(db, "problems", problem.id), {
        status: "solved",
        resolvedAt: Date.now(),
      });

      await addDoc(collection(db, "notifications"), {
        uid: problem.uid,
        title: "Issue Resolved",
        message: `Your reported issue "${problem.msg.substring(0, 30)}..." has been resolved.`,
        type: "problem_resolved",
        read: false,
        time: Date.now(),
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
          <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">
            Admin Session Locked
          </h2>
          <p className="text-slate-400 font-bold mb-8 uppercase text-xs tracking-widest">
            Restricted Access Level: 1
          </p>

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
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-4">
              Security PIN required to view sensitive data
            </p>
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
            className={`w-full lg:w-64 bg-white text-slate-800 p-6 shrink-0 flex flex-col absolute lg:relative z-50 h-full lg:h-auto border-r border-slate-100 ${adminMenuOpen ? "fixed inset-y-0 left-0 max-w-[280px]" : "hidden lg:flex"}`}
          >
            <div className="flex items-center justify-between mb-0 pb-0 border-b border-slate-100 text-[13px] leading-[18px]">
              <div className="flex items-center gap-3">
                <div className="logo-pro logo-pro-glow relative">
                  <div className="logo-particles">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <svg viewBox="0 0 64 64" width="36" height="36">
                    <defs>
                      <linearGradient id="adminG" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="32"
                      cy="32"
                      r="29"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      className="text-white/20 logo-ring"
                    />
                    <circle cx="32" cy="32" r="28" fill="url(#adminG)" />
                    <circle cx="32" cy="32" r="24" fill="#0d3b66" />
                    <text
                      x="50%"
                      y="54%"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="18"
                      fontWeight="900"
                    >
                      EV
                    </text>
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight leading-none mb-1">
                    E-VEDHIKA
                  </h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Global Admin
                  </p>
                </div>
              </div>
              <button
                aria-label="Close menu"
                className="lg:hidden text-slate-400 hover:text-slate-600"
                onClick={() => setAdminMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {[
                {
                  id: "dash",
                  label: "Analytics Dashboard",
                  icon: <Activity size={18} />,
                },
                {
                  id: "reports",
                  label: "Posts & Issues",
                  icon: <AlertOctagon size={18} />,
                },
                {
                  id: "builder",
                  label: "Page Builder",
                  icon: <Layers size={18} />,
                },
                {
                  id: "suggestions",
                  label: "Suggestions & Feedback",
                  icon: <PlusCircle size={18} />,
                },
                {
                  id: "gos_formats",
                  label: "Applications, Formats & GOs",
                  icon: <FileText size={18} />,
                },
                {
                  id: "users",
                  label: "User Access & Directory",
                  icon: <Users size={18} />,
                },
                {
                  id: "trash",
                  label: "Recycle Bin",
                  icon: <Trash2 size={18} />,
                },
                { id: "updates", label: "Flash News", icon: <Zap size={18} /> },
                {
                  id: "changelog",
                  label: "What's New",
                  icon: <Info size={18} />,
                },
                {
                  id: "ai",
                  label: "Admin AI Bot",
                  icon: <Bot size={18} />,
                },
                {
                  id: "logs",
                  label: "Security Logs",
                  icon: <ShieldAlert size={18} />,
                },
                {
                  id: "settings",
                  label: "System Config",
                  icon: <Settings size={18} />,
                },
                {
                  id: "locations",
                  label: "Manage Locations",
                  icon: <MapPin size={18} />,
                },
              ]
                .filter(
                  (t) =>
                    isAdmin ||
                    [
                      "dash",
                      "reports",
                      "builder",
                      "suggestions",
                      "trash",
                      "updates",
                    ].includes(t.id),
                )
                .map((tab) => (
                  <button
                    aria-label={tab.label}
                    key={tab.id}
                    onClick={() => {
                      setActiveSubTab(tab.id);
                      setAdminMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 lg:p-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                      activeSubTab === tab.id
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
            </nav>

            <div className="mt-auto pt-0 border-t border-slate-100 space-y-1.5">
              <button
                aria-label="Exit to Portal"
                onClick={onExit}
                className="w-full flex items-center gap-3 p-2.5 lg:p-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
              >
                <LogOut size={16} />
                Exit to Portal
              </button>
              <button
                aria-label="Lock Session"
                onClick={() => setAdminLocked(true)}
                className="w-full flex items-center gap-3 p-2.5 lg:p-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-400/10 transition-all"
              >
                <Lock size={16} />
                Lock Session
              </button>
              {isAdmin && (
                <button
                  aria-label="Restart Server"
                  onClick={handleRestartServer}
                  className="w-full flex items-center gap-3 p-2.5 lg:p-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <RefreshCw size={16} />
                  Restart Server
                </button>
              )}
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

      <main
        className="flex-1 p-2 lg:p-6 bg-slate-50 overflow-y-auto custom-scrollbar flex flex-col relative w-full h-full"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 !bg-transparent !h-auto !p-0">
          <div className="flex items-center gap-4">
            <button
              aria-label="Open Admin Menu"
              className="lg:hidden p-2 bg-white text-slate-600 rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
              onClick={() => setAdminMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                {activeSubTab === "dash" && "📊 Dashboard Hub"}
                {activeSubTab === "reports" && "🚩 Posts & Issues"}
                {activeSubTab === "gos_formats" &&
                  "📑 Applications, Formats & GOs Management"}
                {activeSubTab === "users" && "👥 User Access & Directory"}
                {activeSubTab === "trash" && "🗑️ Recycle Bin System"}
                {activeSubTab === "builder" && "🏗️ E-Vedhika Page Builder"}
                {activeSubTab === "logs" && "🛡️ Security Audits"}
                {activeSubTab === "settings" && "⚙️ System Settings"}
                {activeSubTab === "locations" && "🗺️ Location Management"}
                {activeSubTab === "suggestions" && "💡 Suggestions & Feedback"}
                {activeSubTab === "updates" && "⚡ Flash News"}
                {activeSubTab === "changelog" && "🚀 What's New Management"}
                {activeSubTab === "ai" && "🤖 Admin AI Assistant"}
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 ml-1">
                Administration & Monitoring Terminal • <span className="text-blue-500">v{SYSTEM_UPDATES[0]?.version} • {new Date(SYSTEM_UPDATES[0]?.time).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {new Date(SYSTEM_UPDATES[0]?.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(activeSubTab === "reports" || activeSubTab === "dash") && (
              <button
                aria-label="Create New Post"
                onClick={onNewPost}
                className="px-6 py-3 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                <PlusCircle size={18} /> Create New Post
              </button>
            )}
            <ClockWidget />
          </div>
        </header>

        {activeSubTab === "dash" && (
          <div className="space-y-8 pb-20">
            {/* Unified Stat Cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
            >
              {[
                {
                  label: "Citizens Enrolled",
                  value: users.filter(
                    (u) => !(u.isDeleted || u.role === "deleted"),
                  ).length,
                  icon: <Users size={20} className="sm:w-6 sm:h-6" />,
                  color: "blue",
                },
                {
                  label: "Unresolved Issues",
                  value: allProblems.filter(
                    (p) =>
                      !p.status ||
                      !["solved", "resolved", "deleted"].includes(
                        (p.status || "").toLowerCase(),
                      ),
                  ).length,
                  icon: <AlertTriangle size={20} className="sm:w-6 sm:h-6" />,
                  color: "rose",
                },
                {
                  label: "Pending Curation",
                  value: posts.filter(
                    (p) =>
                      !p.status || (p.status || "").toLowerCase() === "pending",
                  ).length,
                  icon: <Megaphone size={20} className="sm:w-6 sm:h-6" />,
                  color: "amber",
                },
                {
                  label: "Flash Broadcasts",
                  value: updates.filter(
                    (u) =>
                      (u.type === "flash" || !u.type) &&
                      u.status?.toLowerCase() !== "deleted",
                  ).length,
                  icon: <Zap size={20} className="sm:w-6 sm:h-6" />,
                  color: "emerald",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (stat.label === "Citizens Enrolled")
                      setActiveSubTab("users");
                    else if (stat.label === "Unresolved Issues") {
                      setActiveSubTab("reports");
                      setReportsType("issues");
                    } else if (stat.label === "Pending Curation") {
                      setActiveSubTab("reports");
                      setReportsType("posts");
                    } else if (stat.label === "Flash Broadcasts")
                      setActiveSubTab("updates");
                  }}
                  className="bg-white p-3 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 group hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-2xl flex shrink-0 items-center justify-center bg-slate-50 text-slate-600 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight sm:leading-none mb-1 sm:mb-1 truncate">
                      {stat.label}
                    </p>
                    <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tighter">
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all w-full overflow-hidden">
                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-4">
                  Users per District
                </h4>
                <div className="h-64 min-h-[256px] w-full relative">
                  <ResponsiveContainer
                    width="99%"
                    height="100%"
                    minWidth={100}
                    minHeight={200}
                  >
                    <BarChart
                      data={Object.entries(
                        users
                          .filter((u) => !u.isDeleted)
                          .reduce((acc: any, curr: any) => {
                            const d = curr.district || "Unknown";
                            acc[d] = (acc[d] || 0) + 1;
                            return acc;
                          }, {}),
                      ).map(([name, value]) => ({ name, value }))}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#f1f5f9" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#0891b2"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all w-full overflow-hidden">
                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-4">
                  Post Status Overview
                </h4>
                <div className="h-64 min-h-[256px] w-full relative">
                  <ResponsiveContainer
                    width="99%"
                    height="100%"
                    minWidth={100}
                    minHeight={200}
                  >
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          posts
                            .filter((p) => !p.isDeleted)
                            .reduce((acc: any, curr: any) => {
                              const s = curr.status || "pending";
                              acc[s] = (acc[s] || 0) + 1;
                              return acc;
                            }, {}),
                        ).map(([name, value]) => ({
                          name: name.charAt(0).toUpperCase() + name.slice(1),
                          value,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {Object.entries(
                          posts
                            .filter((p) => !p.isDeleted)
                            .reduce((acc: any, curr: any) => {
                              const s = curr.status || "pending";
                              acc[s] = (acc[s] || 0) + 1;
                              return acc;
                            }, {}),
                        ).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                "#10b981",
                                "#f59e0b",
                                "#3b82f6",
                                "#ef4444",
                                "#6366f1",
                              ][index % 5]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeSubTab === "reports" || activeSubTab === "suggestions") && (
          <div className="space-y-8 pb-20">
            {activeSubTab === "reports" && (
              <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 mb-6">
                {["posts", "issues"].map((type) => (
                  <button
                    aria-label={type}
                    key={type}
                    onClick={() => setReportsType(type as any)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportsType === type ? "bg-white text-blue-600 shadow-sm scale-105" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {type === "posts"
                      ? "🚩 Community Posts"
                      : "⚠️ Citizen Issues"}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  aria-label="Export Reports"
                  onClick={async () => {
                    addToast("Generating Export Data...");
                    if (!XLSX) await loadHeavyModules();
                    const isPosts =
                      activeSubTab === "reports"
                        ? reportsType === "posts"
                        : false;
                    const ds =
                      activeSubTab === "suggestions"
                        ? suggestions
                        : isPosts
                          ? posts
                          : problems;
                    const exportData = ds.map((item: any) => ({
                      Title: item.title || item.type || "",
                      Description: item.desc || item.text || "",
                      Category: item.category || "",
                      Status: item.status || "pending",
                      District: item.district || "",
                      Mandal: item.mandal || "",
                      Panchayat: item.panchayat || "",
                      Author: item.authorName || "",
                      Date: item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "",
                    }));
                    const ws = XLSX.utils.json_to_sheet(exportData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Reports");
                    XLSX.writeFile(wb, "reports_export.xlsx");
                    addToast("Export complete.");
                  }}
                  className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border bg-green-50 border-green-100 text-green-700 hover:bg-green-600 hover:text-white flex items-center gap-2 shadow-sm"
                >
                  <Download size={14} /> Export XLS
                </button>
                {["All", "Approved", "Pending", "Resolved", "Deleted"].map(
                  (f) => (
                    <button
                      aria-label={f}
                      key={f}
                      onClick={() => setReportsFilter(f as any)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${reportsFilter === f ? "bg-indigo-900 border-indigo-900 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"}`}
                    >
                      {f}
                    </button>
                  ),
                )}
                {reportsFilter === "Deleted" && (
                  <button
                    aria-label="Empty Trash"
                    onClick={async () => {
                      const res = await Swal.fire({
                        title: "Empty Trash?",
                        text: "This will permanently delete all items in the trash. This action cannot be undone.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#ef4444",
                        confirmButtonText: "Yes, Empty Trash",
                      });
                      if (res.isConfirmed) {
                        const col =
                          activeSubTab === "reports"
                            ? reportsType === "posts"
                              ? "posts"
                              : "problems"
                            : "suggestions";
                        const list =
                          activeSubTab === "reports"
                            ? reportsType === "posts"
                              ? posts
                              : allProblems
                            : suggestions;
                        const deletedItems = list.filter(
                          (i) => (i.status || "").toLowerCase() === "deleted",
                        );
                        try {
                          await Promise.all(
                            deletedItems.map((item: any) =>
                              deleteDoc(doc(db, col, item.id)),
                            ),
                          );
                          addToast(
                            `Permanently deleted ${deletedItems.length} items`,
                          );
                        } catch (e: any) {
                          addToast("Error: " + e.message);
                        }
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
                    <th className="pb-4 pl-8 font-black">
                      Context & Interaction
                    </th>
                    <th className="pb-4 font-black">Status & Identification</th>
                    <th className="pb-4 text-right pr-8 font-black">
                      Administrative Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="space-y-4">
                  {(activeSubTab === "reports"
                    ? reportsType === "posts"
                      ? posts
                      : allProblems
                    : suggestions
                  )
                    .filter((item) => {
                      if (reportsFilter === "All")
                        return (item.status || "").toLowerCase() !== "deleted";
                      if (reportsFilter === "Pending")
                        return (
                          !item.status ||
                          (item.status || "").toLowerCase() === "pending"
                        );
                      return (
                        (item.status || "").toLowerCase() ===
                        reportsFilter.toLowerCase()
                      );
                    })
                    .map((item, idx) => (
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={item.id}
                        className={`group bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all border border-slate-100 ${activeSubTab === "suggestions" ? "border-l-4 border-l-amber-400 bg-amber-50/10" : ""}`}
                      >
                        <td className="py-4 pl-6">
                          <div className="flex items-center gap-4 mb-3">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${
                                activeSubTab === "suggestions"
                                  ? "bg-amber-100 text-amber-600"
                                  : reportsType === "posts"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-rose-100 text-rose-600"
                              }`}
                            >
                              {item.photoURL ? (
                                <img
                                  src={item.photoURL}
                                  alt="Profile"
                                  className="w-full h-full object-cover rounded-2xl"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />
                              ) : item.isAdminPost || item.userName === "Admin" ? (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                                  <ShieldCheck size={20} />
                                </div>
                              ) : (
                                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                                  <User size={18} />
                                </div>
                              )}
                            </div>
                            <div>
                              <h5 className="font-black text-slate-800 text-[15px] leading-tight mb-1">
                                {item.userName || item.name || "Portal User"}
                              </h5>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2">
                                <Mail size={10} />{" "}
                                {item.isAdminPost || item.userName === "Admin" ? (
                                  item.userEmail || "Portal Admin"
                                ) : (
                                  item.userEmail ||
                                  item.userId ||
                                  item.uid ||
                                  "Citizen Entry"
                                )}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`p-5 rounded-2xl border ${activeSubTab === "suggestions" ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"}`}
                          >
                            {item.title && (
                              <h4 className="text-sm font-black text-slate-800 mb-2 whitespace-pre-wrap">
                                {formatPostTitle(item.title)}
                              </h4>
                            )}
                            {activeSubTab === "reports" &&
                            reportsType === "posts" ? (
                              <div className="text-[12px] text-slate-700 font-medium leading-relaxed whitespace-pre-wrap [&_pre]:bg-slate-800 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:text-rose-500 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:px-0 [&_pre_code]:py-0 [&_p]:mb-2 [&_a]:text-blue-600 [&_a]:underline">
                                <ReactMarkdown
                                  remarkPlugins={[remarkBreaks]}
                                  rehypePlugins={[rehypeRaw]}
                                >
                                  {item.content || ""}
                                </ReactMarkdown>
                                <div className="mt-6 pt-4 border-t border-slate-200">
                                  <details className="group">
                                    <summary className="cursor-pointer text-sm font-black text-primary flex items-center gap-2 select-none mb-2">
                                      <MessageCircle size={16} />
                                      <span>
                                        Manage Comments (
                                        {item.commentCount || 0})
                                      </span>
                                    </summary>
                                    <div className="pt-4 bg-white/50 rounded-xl p-4">
                                      <PostComments
                                        post={item}
                                        addToast={addToast}
                                        userProfile={null}
                                        isAdmin={isAdmin}
                                        allUsers={users}
                                      />
                                    </div>
                                  </details>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[12px] text-slate-700 font-bold leading-relaxed italic whitespace-pre-wrap">
                                "
                                {item.msg ||
                                  item.content ||
                                  item.text ||
                                  item.problem ||
                                  item.suggestion}
                                "
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-6">
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                  item.status === "Approved" ||
                                  item.status === "Resolved" ||
                                  item.status === "solved" ||
                                  item.status === "approved"
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                    : item.status === "flagged"
                                      ? "bg-rose-50 border-rose-100 text-rose-600"
                                      : "bg-amber-50 border-amber-100 text-amber-600"
                                }`}
                              >
                                {item.status || "Processing"}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 flex-wrap max-w-xs">
                                <Hash size={12} className="flex-shrink-0" />{" "}
                                {item.categories && item.categories.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {item.categories.map((c: string, i: number) => (
                                      <span key={i} className={i > 0 ? "before:content-[','] before:mr-1" : ""}>
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  item.category ||
                                  (activeSubTab === "suggestions"
                                    ? "SUUCHANA (SUGGESTION)"
                                    : "GENERAL")
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5 text-slate-400 pl-2">
                              <Clock size={14} />
                              <span className="text-[11px] font-black uppercase tracking-tighter">
                                {new Date(
                                  getValidTime(item),
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right pr-6">
                          <div className="flex justify-end items-center gap-2">
                            <select
                              value={(item.status || "pending").toLowerCase()}
                              onChange={async (e) => {
                                try {
                                  const col =
                                    activeSubTab === "reports"
                                      ? reportsType === "posts"
                                        ? "posts"
                                        : "problems"
                                      : "suggestions";
                                  await updateDoc(doc(db, col, item.id), {
                                    status:
                                      e.target.value.charAt(0).toUpperCase() +
                                      e.target.value.slice(1),
                                  });
                                  addToast("Status Updated");
                                } catch (err: any) {
                                  addToast(getFriendlyError(err));
                                }
                              }}
                              className="bg-slate-50 border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest p-2 pr-8 rounded-xl focus:border-blue-500 outline-none w-auto min-w-[150px] shadow-sm cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="flagged">Flagged</option>
                              <option value="resolved">Resolved</option>
                              <option value="deleted">Deleted (Trash)</option>
                            </select>

                            <button
                              aria-label="Edit Post"
                              onClick={() => {
                                if (
                                  activeSubTab === "reports" &&
                                  reportsType === "posts"
                                ) {
                                  onEditPost(item);
                                } else {
                                  Swal.fire({
                                    title: "Quick Signal Override",
                                    input: "textarea",
                                    inputLabel: "Modify Public Message",
                                    inputValue:
                                      item.msg ||
                                      item.content ||
                                      item.text ||
                                      item.problem ||
                                      item.suggestion,
                                    showCancelButton: true,
                                    confirmButtonColor: "#2563eb",
                                  }).then(async (res) => {
                                    if (res.isConfirmed && res.value) {
                                      const col =
                                        activeSubTab === "reports"
                                          ? reportsType === "posts"
                                            ? "posts"
                                            : "problems"
                                          : "suggestions";
                                      const field = item.msg
                                        ? "msg"
                                        : item.problem
                                          ? "problem"
                                          : item.content
                                            ? "content"
                                            : "text";
                                      await updateDoc(doc(db, col, item.id), {
                                        [field]: res.value,
                                      });
                                      addToast("Signal Synchronized");
                                    }
                                  });
                                }
                              }}
                              className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="Edit Content"
                            >
                              <Edit3 size={18} />
                            </button>

                            {item.status?.toLowerCase() === "deleted" ? (
                              <div className="flex items-center gap-2">
                                <button
                                  aria-label="Restore"
                                  onClick={async () => {
                                    try {
                                      const col =
                                        activeSubTab === "reports"
                                          ? reportsType === "posts"
                                            ? "posts"
                                            : "problems"
                                          : "suggestions";
                                      await updateDoc(doc(db, col, item.id), {
                                        status: "Pending",
                                      });
                                      addToast("Restored from Trash");
                                    } catch (err: any) {
                                      addToast(getFriendlyError(err));
                                    }
                                  }}
                                  className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm text-xs font-bold gap-2"
                                  title="Restore Item"
                                >
                                  <RotateCcw size={14} /> Restore
                                </button>

                                <button
                                  aria-label="Permanently Delete"
                                  onClick={async () => {
                                    const res = await Swal.fire({
                                      title: "Permanently Delete?",
                                      text: "This action cannot be undone.",
                                      icon: "error",
                                      showCancelButton: true,
                                      confirmButtonColor: "#ef4444",
                                      confirmButtonText:
                                        "Yes, Delete Permanently",
                                    });
                                    if (res.isConfirmed) {
                                      try {
                                        const col =
                                          activeSubTab === "reports"
                                            ? reportsType === "posts"
                                              ? "posts"
                                              : "problems"
                                            : "suggestions";
                                        await deleteDoc(doc(db, col, item.id));
                                        addToast("Permanently Deleted");
                                      } catch (err: any) {
                                        addToast(getFriendlyError(err));
                                      }
                                    }
                                  }}
                                  className="px-3 py-2 bg-red-100 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm text-xs font-bold gap-2"
                                  title="Permanently Delete"
                                >
                                  <Trash2 size={14} /> Permanently Delete
                                </button>
                              </div>
                            ) : (
                              <button
                                aria-label="Trash Item"
                                onClick={async () => {
                                  const res = await Swal.fire({
                                    title: "Move to Trash?",
                                    text: "This item will be marked as deleted.",
                                    icon: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#ef4444",
                                    confirmButtonText: "Yes, Trash",
                                  });
                                  if (res.isConfirmed) {
                                    try {
                                      const col =
                                        activeSubTab === "reports"
                                          ? reportsType === "posts"
                                            ? "posts"
                                            : "problems"
                                          : "suggestions";
                                      await updateDoc(doc(db, col, item.id), {
                                        status: "Deleted",
                                      });
                                      addToast("Moved to Trash");
                                    } catch (err: any) {
                                      addToast(getFriendlyError(err));
                                    }
                                  }
                                }}
                                className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                title="Move to Trash"
                              >
                                <Trash2 size={18} />
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
        {activeSubTab === "gos_formats" && (
          <div className="space-y-12 pb-20">
            <GosAndFormatsAdmin
              user={user}
              addToast={addToast}
              isAdmin={isAdmin}
            />
          </div>
        )}
        {activeSubTab === "users" && (
          <div className="space-y-12 pb-20">
            <div className="pt-8 text-left">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 bg-white rounded-[32px] shadow-sm border border-slate-100">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    🛡️ Access Control
                  </h3>
                  <p className="text-sm font-bold text-slate-500 mt-1">
                    Manage user roles, visibility and suspensions.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Search by name, email, role..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2.5 rounded-2xl text-xs border border-slate-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      aria-label="Export Data"
                      onClick={async () => {
                        addToast("Generating Export Data...");
                        if (!XLSX) await loadHeavyModules();
                        const exportData = users.map((u: any) => ({
                          Name: u.name || "",
                          Email: u.email || "",
                          Surname: u.surname || "",
                          Phone: u.mobile || "",
                          District: u.district || "",
                          Mandal: u.mandal || "",
                          Village: u.panchayat || "",
                          Designation: u.designation || "",
                          Role: u.role || "user",
                          Status: u.isDeleted ? "Deleted" : "Active",
                          Joined: u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "",
                        }));
                        const ws = XLSX.utils.json_to_sheet(exportData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Users");
                        XLSX.writeFile(wb, "users_export.xlsx");
                        addToast("Export complete.");
                      }}
                      className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border bg-green-50 border-green-100 text-green-700 hover:bg-green-600 hover:text-white flex items-center gap-2 shadow-sm"
                    >
                      <Download size={14} /> Export XLS
                    </button>
                    <button
                      aria-label="All Users"
                      onClick={() => setUsersFilter("All")}
                      className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${usersFilter === "All" ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"}`}
                    >
                      All Users
                    </button>
                    <button
                      aria-label="Deleted Users"
                      onClick={() => setUsersFilter("Deleted")}
                      className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${usersFilter === "Deleted" ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20 scale-105" : "bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100 hover:border-rose-200"}`}
                    >
                      Deleted (Trash)
                    </button>

                    {usersFilter === "Deleted" && (
                      <button
                        aria-label="Empty User Trash"
                        onClick={async () => {
                          const res = await Swal.fire({
                            title: "Empty Trash?",
                            text: "This will permanently delete all users in the trash. This action cannot be undone.",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#ef4444",
                            confirmButtonText: "Yes, Empty Trash",
                          });
                          if (res.isConfirmed) {
                            const deletedUsers = users.filter(
                              (u) => u.isDeleted || u.role === "deleted",
                            );
                            try {
                              await Promise.all(
                                deletedUsers.map((u) =>
                                  deleteDoc(doc(db, "users", u.id)),
                                ),
                              );
                              addToast(
                                `Permanently deleted ${deletedUsers.length} users`,
                              );
                            } catch (e: any) {
                              addToast("Error: " + e.message);
                            }
                          }
                        }}
                        className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border bg-red-50 border-red-100 text-red-600 hover:bg-red-600 hover:text-white flex items-center gap-2 shadow-sm"
                      >
                        <Trash2 size={14} /> Empty Trash
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users
                  .filter((u) => {
                    const isMatchFilter =
                      usersFilter === "Deleted"
                        ? u.isDeleted || u.role === "deleted"
                        : !u.isDeleted && u.role !== "deleted";
                    if (!isMatchFilter) return false;
                    if (!userSearchTerm) return true;
                    const term = userSearchTerm.toLowerCase();
                    return (
                      (u.username || "").toLowerCase().includes(term) ||
                      (u.email || "").toLowerCase().includes(term) ||
                      (u.role || "").toLowerCase().includes(term) ||
                      (u.id || "").toLowerCase().includes(term)
                    );
                  })
                  .sort((a, b) => (b.time || 0) - (a.time || 0))
                  .slice(0, visibleUsersCount)
                  .map((u) => (
                    <motion.div
                      layout
                      key={u.id}
                      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-4 flex gap-2">
                        {usersFilter === "Deleted" ? (
                          <>
                            <button
                              aria-label="Restore Settings"
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, "users", u.id), {
                                    isDeleted: false,
                                    role:
                                      u.role === "deleted" ? "user" : u.role,
                                  });
                                  addToast("User restored from trash");
                                } catch (err: any) {
                                  addToast(getFriendlyError(err));
                                }
                              }}
                              className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                              title="Restore User"
                            >
                              <RotateCcw size={16} /> Restore
                            </button>
                            <button
                              aria-label="Permanently Delete User"
                              onClick={async () => {
                                const res = await Swal.fire({
                                  title: "Permanently Delete User?",
                                  text: "This action cannot be undone.",
                                  icon: "error",
                                  showCancelButton: true,
                                  confirmButtonColor: "#ef4444",
                                  confirmButtonText: "Yes, Delete Permanently",
                                });
                                if (res.isConfirmed) {
                                  try {
                                    await deleteDoc(doc(db, "users", u.id));
                                    addToast("User permanently deleted");
                                  } catch (err: any) {
                                    addToast(getFriendlyError(err));
                                  }
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
                            <button
                              aria-label={
                                u.role === "suspended"
                                  ? "Unblock User"
                                  : "Block User"
                              }
                              onClick={async () => {
                                try {
                                  const nextRole =
                                    u.role === "suspended"
                                      ? "user"
                                      : "suspended";
                                  await updateDoc(doc(db, "users", u.id), {
                                    role: nextRole,
                                  });
                                  addToast(
                                    nextRole === "suspended"
                                      ? "User Access Restricted"
                                      : "User Access Restored",
                                  );

                                  await addDoc(
                                    collection(db, "security_logs"),
                                    {
                                      admin:
                                        auth.currentUser?.email || "System",
                                      action: `${nextRole === "suspended" ? "Blocked" : "Unblocked"} User: ${u.email || u.id}`,
                                      time: Date.now(),
                                    },
                                  );
                                } catch (e: any) {
                                  addToast(e.message);
                                }
                              }}
                              title={
                                u.role === "suspended"
                                  ? "Unblock User"
                                  : "Block User"
                              }
                              className={`p-2 rounded-lg transition-colors ${u.role === "suspended" ? "text-red-500 bg-red-50 animate-pulse" : "text-slate-300 hover:text-red-500 hover:bg-red-50"}`}
                            >
                              <ShieldAlert size={16} />
                            </button>
                            <button
                              aria-label={
                                u.hidden ? "Show Profile" : "Hide Profile"
                              }
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, "users", u.id), {
                                    hidden: !u.hidden,
                                  });
                                  addToast(
                                    u.hidden
                                      ? "Profile Restored"
                                      : "Profile Hidden",
                                  );
                                } catch (e: any) {
                                  addToast(e.message);
                                }
                              }}
                              title={u.hidden ? "Show Profile" : "Hide Profile"}
                              className={`p-2 rounded-lg transition-colors ${u.hidden ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-blue-500 hover:bg-slate-50"}`}
                            >
                              {u.hidden ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                            <button
                              aria-label="Delete user"
                              onClick={() => deleteUser(u.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Move to Trash"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex items-start gap-4 mb-6 pt-2">
                        <div
                          className={`w-14 h-14 bg-slate-100 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden border-2 shadow-sm transition-all ${u.role === "suspended" ? "grayscale border-red-200 scale-95" : "border-white"}`}
                        >
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.name || "User"}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User size={24} className="text-slate-300" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-primary text-sm mb-1 flex items-center gap-2">
                            {u.name || u.surname
                              ? `${u.name || ""} ${u.surname || ""}`.trim()
                              : u.email
                                ? u.email.split("@")[0]
                                : "Unknown User"}
                            {u.hidden && (
                              <span className="bg-amber-100 text-amber-600 text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black">
                                Hidden
                              </span>
                            )}
                            {u.role === "suspended" && (
                              <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black animate-pulse">
                                Blocked
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {u.username ? `@${u.username}` : u.email || u.id}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <span>Registered</span>
                          <span className="text-slate-600 tracking-normal font-bold normal-case">
                            {u.time
                              ? new Date(u.time).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <span>Access Level</span>
                          <span
                            className={`px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
                          >
                            {u.role || "User"}
                          </span>
                        </div>
                        <select
                          value={u.role || "user"}
                          onChange={async (e) => {
                            try {
                              await updateDoc(doc(db, "users", u.id), {
                                role: e.target.value,
                              });
                              addToast("Role Authorization Updated");
                            } catch (err) {
                              handleFirestoreError(
                                err,
                                OperationType.WRITE,
                                `users/${u.id}`,
                              );
                            }
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
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                              Profile Visibility
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                              {u.hidden
                                ? "Hidden from Directory"
                                : "Visible to Public"}
                            </span>
                          </div>
                          <button
                            aria-label="Toggle Profile Visibility"
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, "users", u.id), {
                                  hidden: !u.hidden,
                                });
                                addToast(
                                  u.hidden
                                    ? "Profile Restored to Directory"
                                    : "Profile Hidden from Directory",
                                );
                              } catch (e: any) {
                                addToast(e.message);
                              }
                            }}
                            className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${u.hidden ? "bg-slate-200" : "bg-emerald-500 shadow-lg shadow-emerald-500/20"}`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${u.hidden ? "translate-x-0" : "translate-x-6"}`}
                            />
                          </button>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Location:{" "}
                            {u.mandal
                              ? `${u.mandal}, ${u.district}`
                              : u.village || "Undefined"}
                          </div>
                          <button
                            aria-label="View Full File"
                            onClick={() =>
                              setExpandedUser(
                                expandedUser === u.id ? null : u.id,
                              )
                            }
                            className="text-[10px] font-black text-blue-500 uppercase hover:underline"
                          >
                            View Full File
                          </button>
                        </div>
                        {expandedUser === u.id && (
                          <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">
                            <div>
                              <span className="text-slate-400 block mb-1">
                                Gender
                              </span>
                              {u.gender || "N/A"}
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-1">
                                Mobile
                              </span>
                              {u.mobile || "N/A"}
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-1">
                                Email
                              </span>
                              {u.email || "N/A"}
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-1">
                                State
                              </span>
                              {u.state || "N/A"}
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-1">
                                District
                              </span>
                              {u.district || "N/A"}
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-1">
                                Mandal
                              </span>
                              {u.mandal || "N/A"}
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400 block mb-1">
                                Village/Town
                              </span>
                              {u.village || "N/A"}
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-1">
                                Office
                              </span>
                              {u.office ||
                                u.village ||
                                (u.mandal ? `${u.mandal} Office` : "N/A")}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "builder" && (
          <div className="space-y-6 pb-20">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Layers size={200} />
              </div>
              <div className="relative z-10 space-y-3">
                <h2 className="text-3xl font-black tracking-tighter drop-shadow-md">
                  E-Vedhika Page Builder
                </h2>
                <p className="text-blue-100 max-w-xl font-medium leading-relaxed">
                  Drag and drop UI components, define custom sections, and
                  deploy new portal views dynamically without editing code. All changes preview live on the right.
                </p>
              </div>
              <div className="relative z-10 shrink-0 flex gap-3">
                <button
                  onClick={() => setBuilderElements(DEFAULT_HOME_ELEMENTS)}
                  className="px-6 py-3.5 bg-blue-500/20 text-white rounded-xl font-black border border-white/20 uppercase tracking-widest hover:bg-blue-500/30 transition-all flex items-center gap-2"
                >
                  <RotateCcw size={18} /> Reset
                </button>
                <button
                  onClick={handlePublish}
                  className="px-8 py-3.5 bg-white text-blue-600 rounded-xl font-black uppercase tracking-widest shadow-[0_8px_16px_rgba(0,0,0,0.15)] hover:scale-105 hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  <Rocket size={18} /> Publish Page
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Elements Palette */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm sticky top-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-2">
                    UI Elements
                  </h4>
                  <div className="space-y-2">
                    {[
                      "E-Vedhika Core Feed",
                      "Hero Section",
                      "Post Grid",
                      "Feature Cards",
                      "Form Builder",
                      "Contact Banner",
                      "Important Links",
                      "Stats Highlight",
                      "FAQ Section",
                      "Alert Notice",
                      "Quote / Testimonial",
                      "Upcoming Events",
                      "Gallery Grid",
                      "Services Directory",
                      "Profiles / Staff",
                      "Video Showcase",
                      "Document Downloads"
                    ].map((el) => (
                      <div
                        key={el}
                        onClick={() => {
                          const newEl = {
                            id: Date.now(),
                            type: el,
                            title: "",
                            content: "",
                            color: "blue",
                            hidden: false,
                          };
                          setBuilderElements([...builderElements, newEl]);
                          addToast(`${el} added to canvas`);
                          setEditingElementId(newEl.id);
                        }}
                        className="p-3 bg-slate-50 border border-slate-100 text-slate-600 font-bold rounded-2xl cursor-pointer hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all flex justify-between items-center group shadow-sm"
                      >
                        <span>{el}</span>
                        <PlusCircle
                          size={16}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor List */}
              <div className="lg:col-span-1 border-r border-slate-200/60 pr-4 lg:max-h-[800px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-6 ml-2">
                  <Layers className="text-slate-400" size={18} />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Layout Sequence</h3>
                </div>
                {builderElements.length === 0 ? (
                  <div className="mt-10 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center text-slate-300 mx-auto mb-4">
                      <Layers size={24} />
                    </div>
                    <p className="text-slate-400 text-xs font-bold leading-relaxed px-4">
                      Select elements from the panel to start building your page interface.
                    </p>
                  </div>
                ) : (
                  <Reorder.Group axis="y" values={builderElements} onReorder={setBuilderElements} className="space-y-4">
                    {builderElements.map((el, index) => (
                      <Reorder.Item
                        value={el}
                        key={el.id}
                        className={`group relative p-4 bg-white border cursor-grab active:cursor-grabbing ${el.hidden ? "opacity-50 grayscale border-slate-100 bg-slate-50" : "border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]"} rounded-3xl text-left hover:border-blue-400 transition-colors ${editingElementId === el.id ? "ring-2 ring-blue-500/20 border-blue-400" : ""}`}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${el.hidden ? "bg-slate-200 text-slate-500" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                              {el.type} {el.hidden && "- Hidden"}
                            </span>
                            <div className="flex items-center text-slate-300">
                              <span className="text-[10px] uppercase font-bold tracking-widest mr-1 opacity-0 group-hover:opacity-100 transition-opacity">Drag</span>
                              <Layers size={14} />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => updateElementProps(el.id, { hidden: !el.hidden })}
                              className={`flex-1 flex justify-center p-2 rounded-xl border border-transparent transition-colors ${el.hidden ? "text-amber-500 bg-amber-50" : "text-slate-400 bg-slate-50 hover:text-amber-500 hover:bg-amber-50"}`}
                               title="Toggle Visibility"
                            >
                              {el.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => setEditingElementId(editingElementId === el.id ? null : el.id)}
                              className={`flex-1 flex justify-center p-2 rounded-xl border transition-colors ${editingElementId === el.id ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 border-transparent text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}
                              title="Settings"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => {
                                setBuilderElements(builderElements.filter((e) => e.id !== el.id));
                                addToast(`${el.type} deleted successfully.`);
                              }}
                              className="flex-1 flex justify-center p-2 text-slate-400 bg-slate-50 rounded-xl hover:text-rose-500 hover:bg-rose-50 transition-colors"
                              title="Delete Area"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {editingElementId === el.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 cursor-auto">
                                <div>
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Title</label>
                                  <input type="text" value={el.title || ""} onChange={(e) => updateElementProps(el.id, { title: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" placeholder="Section Title..." />
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Theme Color</label>
                                    <select value={el.color || "blue"} onChange={(e) => updateElementProps(el.id, { color: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs appearance-none">
                                      <option value="blue">Blue Signature</option>
                                      <option value="indigo">Indigo Royal</option>
                                      <option value="emerald">Emerald Success</option>
                                      <option value="rose">Rose Alert</option>
                                      <option value="amber">Amber Attention</option>
                                      <option value="slate">Dark Slate</option>
                                    </select>
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Layout Size</label>
                                    <select value={el.size || "full"} onChange={(e) => updateElementProps(el.id, { size: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs appearance-none">
                                      <option value="small">Small</option>
                                      <option value="medium">Medium</option>
                                      <option value="large">Large</option>
                                      <option value="full">Full Width</option>
                                    </select>
                                  </div>
                                </div>
                                {el.type !== "Post Grid" && el.type !== "Feature Cards" && el.type !== "Stats Highlight" && (
                                  <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Content / Desc</label>
                                    <textarea value={el.content || ""} onChange={(e) => updateElementProps(el.id, { content: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs min-h-[80px] custom-scrollbar" placeholder="Description..." />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>

              {/* Live Preview Pane */}
              <div className="lg:col-span-2">
                <div className="bg-slate-100 rounded-[32px] sm:rounded-[48px] p-2 sm:p-4 border-[6px] sm:border-[12px] border-slate-800 shadow-2xl relative h-[700px] flex flex-col pointer-events-none opacity-90">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-5 sm:h-7 bg-slate-800 rounded-b-2xl z-20 flex justify-center items-end pb-1.5 sm:pb-2">
                    <div className="w-12 sm:w-16 h-1 sm:h-1.5 bg-slate-700 rounded-full" />
                  </div>
                  
                  <div className="mb-4 sm:mb-6 pt-4 sm:pt-6 pb-2 sm:pb-4 flex items-center justify-center  z-10 bg-slate-100 rounded-t-[20px] sm:rounded-t-[32px]">
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm flex items-center gap-2">
                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Canvas Render
                    </span>
                  </div>
                  
                  <div className="bg-white/50 flex-1 overflow-y-auto custom-scrollbar rounded-2xl sm:rounded-3xl p-3 sm:p-6 pb-20 space-y-6 sm:space-y-12">
                    {builderElements.filter(el => !el.hidden).length === 0 ? (
                      <div className="py-20 text-center text-slate-300 font-bold italic text-sm">
                        No sections added. Canvas is empty.
                      </div>
                    ) : (
                      builderElements.filter((el) => !el.hidden).map((el) => {
                        let sizeClass = "max-w-full";
                        if (el.size === "small") sizeClass = "max-w-sm mx-auto";
                        else if (el.size === "medium") sizeClass = "max-w-md mx-auto";
                        else if (el.size === "large") sizeClass = "max-w-2xl mx-auto";

                        return (
                        <div key={el.id} className={`relative ${sizeClass} w-full`}>
                          {el.type === "Hero Section" && (
                            <div className={`bg-gradient-to-br from-${el.color || "blue"}-600 to-${el.color || "blue"}-800 p-6 sm:p-12 rounded-[24px] sm:rounded-[40px] text-white overflow-hidden shadow-xl`}>
                              <div className="relative z-10 space-y-4">
                                <h1 className="text-2xl sm:text-4xl font-black tracking-tighter leading-tight drop-shadow-md">
                                  {el.title || "Welcome to E-Vedhika"}
                                </h1>
                                <p className="text-xs sm:text-sm text-white/80 font-medium leading-relaxed max-w-sm">
                                  {el.content || "Empowering citizens through digital transparency."}
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                  <div className="px-4 py-2 sm:px-6 sm:py-3 bg-white text-blue-600 rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px]">
                                    Learn More
                                  </div>
                                  <div className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] border border-white/20">
                                    Contact Us
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {el.type === "Post Grid" && (
                            <div className="space-y-4">
                              <div>
                                <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-slate-800">
                                  {el.title || "Recent Updates"}
                                </h2>
                                <p className="text-slate-500 font-bold uppercase text-[8px] sm:text-[9px] tracking-[0.2em]">
                                  Official Broadcasts & News
                                </p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[1, 2].map((i) => (
                                  <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-slate-100" />
                                      <div className="h-3 w-16 bg-slate-100 rounded" />
                                    </div>
                                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                                    <div className="h-3 w-full bg-slate-100 rounded" />
                                    <div className="h-3 w-5/6 bg-slate-100 rounded" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {el.type === "Feature Cards" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm">
                                  <div className={`w-10 h-10 bg-${el.color || "blue"}-50 rounded-xl flex items-center justify-center text-${el.color || "blue"}-600 mb-4`}>
                                    <Zap size={20} />
                                  </div>
                                  <h3 className="text-base font-black text-slate-800 mb-2">Feature {i}</h3>
                                  <p className="text-slate-500 text-xs">Detailed description of this feature...</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {el.type === "Contact Banner" && (
                            <div className="bg-slate-900 p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-6">
                              <div className="space-y-2 text-center md:text-left">
                                <h2 className="text-xl sm:text-2xl font-black">{el.title || "Contact Us"}</h2>
                                <p className="text-slate-400 text-xs sm:text-sm">{el.content || "Reach out to our support team."}</p>
                              </div>
                              <div className="px-6 py-3 bg-blue-600 rounded-xl font-black uppercase text-[10px] tracking-widest text-center">
                                Submit Feedback
                              </div>
                            </div>
                          )}
                          
                          {el.type === "Important Links" && (
                            <div className={`p-6 sm:p-8 bg-${el.color || "slate"}-50 border border-slate-100 rounded-[24px]`}>
                              <h3 className="text-lg font-black text-slate-800 mb-2">{el.title || "Important Links"}</h3>
                              <p className="text-slate-500 text-xs mb-6 max-w-sm line-clamp-2">{el.content || "Quick access to essential portal resources."}</p>
                              <div className="grid grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map(i => (
                                   <div key={i} className={`p-4 bg-white rounded-[16px] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center`}>
                                     <div className={`w-10 h-10 rounded-[12px] bg-${el.color || "slate"}-100 flex items-center justify-center mb-2 text-${el.color || "slate"}-600`}>
                                       <ExternalLink size={16} />
                                     </div>
                                     <span className="text-[10px] font-bold text-slate-700">Link {i}</span>
                                   </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {el.type === "Stats Highlight" && (
                            <div className={`py-8 bg-white rounded-[24px]`}>
                               <div className="text-center mb-6">
                                 <h3 className="text-lg font-black tracking-tighter text-slate-800 mb-1">{el.title || "By The Numbers"}</h3>
                               </div>
                               <div className="grid grid-cols-2 gap-4 px-2">
                                 {[
                                   { v: "15K+", l: "Citizens" },
                                   { v: "98%", l: "Success" }
                                 ].map((stat, i) => (
                                   <div key={i} className={`p-4 bg-${el.color || "blue"}-50 rounded-[20px] text-center shadow-sm`}>
                                     <h4 className={`text-xl font-black text-${el.color || "blue"}-600 mb-1`}>{stat.v}</h4>
                                     <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{stat.l}</p>
                                   </div>
                                 ))}
                               </div>
                            </div>
                          )}

                          {el.type === "FAQ Section" && (
                            <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-[24px]">
                              <h3 className="text-lg font-black text-slate-800 text-center mb-2">{el.title || "FAQ"}</h3>
                              <p className="text-center text-slate-500 text-[10px] mb-6 line-clamp-2">{el.content || "Common queries and answers."}</p>
                              <div className="space-y-2">
                                {[1, 2].map(i => (
                                  <div key={i} className="p-4 bg-slate-50 rounded-[16px] border border-slate-100">
                                    <div className="flex justify-between items-center w-full text-left">
                                      <h4 className="text-[11px] font-bold text-slate-800">Dummy question {i}?</h4>
                                      <ChevronDown className="text-slate-400 shrink-0" size={12} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {el.type === "Alert Notice" && (
                            <div className={`p-4 bg-${el.color || "amber"}-50 border-l-4 border-${el.color || "amber"}-500 rounded-[16px] flex items-start gap-3 shadow-sm`}>
                              <div className={`text-${el.color || "amber"}-600 bg-white p-2 rounded-xl shadow-sm shrink-0`}>
                                <AlertTriangle size={16} />
                              </div>
                              <div>
                                <h4 className={`text-xs font-black text-${el.color || "amber"}-800 mb-1`}>{el.title || "ముఖ్య గమనిక"}</h4>
                                <p className={`text-[10px] text-${el.color || "amber"}-700/80 font-bold whitespace-pre-wrap leading-relaxed`}>{el.content || "దయచేసి గమనించగలరు..."}</p>
                              </div>
                            </div>
                          )}

                          {el.type === "Quote / Testimonial" && (
                            <div className="p-6 bg-slate-900 rounded-[24px] text-center shadow-xl relative overflow-hidden">
                              <h3 className="text-lg font-black tracking-tighter text-white mb-2 relative z-10">{el.title || "Quote"}</h3>
                              <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full mb-4 relative z-10"></div>
                              <p className="text-[11px] font-medium text-slate-300 italic mb-2 relative z-10 mx-auto leading-relaxed line-clamp-3">
                                "{el.content || "Empowerment comes through information..."}"
                              </p>
                            </div>
                          )}
                          
                          {el.type === "Upcoming Events" && (
                            <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-[24px]">
                               <h3 className="text-lg font-black text-slate-800 mb-4">{el.title || "రాబోయే కార్యక్రమాలు"}</h3>
                               <div className="space-y-3">
                                 {[1, 2].map(i => (
                                   <div key={i} className="flex gap-4 bg-slate-50 p-3 rounded-[16px]">
                                      <div className="bg-white rounded-xl p-2 text-center min-w-[60px] shadow-sm">
                                        <span className="text-danger font-black text-[10px] uppercase block">NOV</span>
                                        <span className="text-lg font-black text-slate-800">{i + 14}</span>
                                      </div>
                                      <div className="flex-1 flex flex-col justify-center">
                                        <h4 className="text-sm font-bold text-slate-800">{el.content ? el.content.split('|')[0] : "గ్రామ సభ"}</h4>
                                      </div>
                                   </div>
                                 ))}
                               </div>
                            </div>
                          )}

                          {el.type === "Gallery Grid" && (
                            <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-[24px]">
                               <h3 className="text-lg font-black text-slate-800 mb-2">{el.title || "గ్యాలరీ"}</h3>
                               <div className="grid grid-cols-3 gap-2">
                                 {[1, 2, 3].map(i => (
                                    <div key={i} className="aspect-square bg-slate-100 rounded-xl"></div>
                                 ))}
                               </div>
                            </div>
                          )}

                          {el.type === "Services Directory" && (
                            <div className={`p-6 bg-${el.color || "blue"}-50 border border-slate-100 shadow-sm rounded-[24px]`}>
                               <h3 className="text-lg font-black text-slate-800 mb-4">{el.title || "సేవలు"}</h3>
                               <div className="grid grid-cols-2 gap-3">
                                 {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex gap-2 p-3 bg-white rounded-[16px] shadow-sm items-center">
                                       <div className={`w-8 h-8 rounded-xl bg-${el.color || "blue"}-50 flex items-center justify-center shrink-0`}>
                                         <Layers size={14} className={`text-${el.color || "blue"}-600`} />
                                       </div>
                                       <div className="h-2 bg-slate-100 w-full rounded"></div>
                                    </div>
                                 ))}
                               </div>
                            </div>
                          )}
                          
                          {el.type === "Profiles / Staff" && (
                            <div className="p-6 bg-slate-50 border border-slate-100 shadow-sm rounded-[24px]">
                               <h3 className="text-lg font-black text-slate-800 text-center mb-4">{el.title || "నాయకులు / అధికారులు"}</h3>
                               <div className="grid grid-cols-3 gap-2">
                                 {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-3 rounded-[16px] text-center shadow-sm">
                                      <div className="w-10 h-10 mx-auto bg-slate-200 rounded-full mb-2"></div>
                                      <div className="h-2 bg-slate-200 w-full mb-1"></div>
                                      <div className="h-2 bg-slate-100 w-2/3 mx-auto"></div>
                                    </div>
                                 ))}
                               </div>
                            </div>
                          )}

                          {el.type === "Video Showcase" && (
                            <div className="p-6 bg-slate-900 border border-slate-800 shadow-sm rounded-[24px]">
                               <h3 className="text-lg font-black text-white mb-2">{el.title || "వీడియోలు"}</h3>
                               <div className="aspect-video bg-slate-800 rounded-xl flex items-center justify-center">
                                 <Play className="text-white/30" size={24} />
                               </div>
                            </div>
                          )}

                          {el.type === "Document Downloads" && (
                            <div className={`p-6 bg-white border border-${el.color || "blue"}-100 shadow-sm rounded-[24px]`}>
                               <h3 className="text-lg font-black text-slate-800 mb-2">{el.title || "ముఖ్యమైన పత్రాలు"}</h3>
                               <div className="space-y-2">
                                 {[1, 2].map(i => (
                                    <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                       <div className="flex items-center gap-2">
                                          <FileText size={14} className={`text-${el.color || "blue"}-500`} />
                                          <div className="h-2 bg-slate-200 w-20"></div>
                                       </div>
                                       <Download size={14} className="text-slate-400" />
                                    </div>
                                 ))}
                               </div>
                            </div>
                          )}

                          {/* Fallback for form builder or anything else */}
                          {!["Hero Section", "Post Grid", "Feature Cards", "Contact Banner", "E-Vedhika Core Feed", "Important Links", "Stats Highlight", "FAQ Section", "Alert Notice", "Quote / Testimonial", "Upcoming Events", "Gallery Grid", "Services Directory", "Profiles / Staff", "Video Showcase", "Document Downloads"].includes(el.type) && (
                            <div className="p-8 bg-white border-2 border-dashed border-slate-200 rounded-[32px] text-center">
                              <h3 className="text-base font-black text-slate-400">{el.title || el.type}</h3>
                              <p className="text-slate-400 mt-2 text-xs">{el.content || "Dynamic layout element."}</p>
                            </div>
                          )}
                          
                          {el.type === "E-Vedhika Core Feed" && (
                            <div className="space-y-4">
                              <div className="h-16 bg-slate-100 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center p-4">
                                <Search className="text-slate-300 w-5 h-5 mr-3" />
                                <div className="h-3 bg-slate-200 rounded w-1/2" />
                              </div>
                              <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                  <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-slate-100" />
                                      <div className="h-3 bg-slate-200 rounded w-32" />
                                    </div>
                                    <div className="h-16 bg-slate-50 rounded-2xl border flex items-center justify-center text-slate-300 text-xs">
                                      Post Content Preview
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  </div>
                </div>
              </div>
            </div>
          </div>
      )}

        {activeSubTab === "trash" && (
          <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <Trash2 className="text-rose-500" />
                  Recycle Bin System
                </h3>
                <p className="text-sm font-bold text-slate-500 mt-1">
                  Manage and permanently drop deleted resources.
                </p>
              </div>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner overflow-x-auto whitespace-nowrap scrollbar-hide">
                {(
                  [
                    "posts",
                    "problems",
                    "suggestions",
                    "users",
                    "updates",
                  ] as const
                ).map((tab) => (
                  <button
                    aria-label={tab}
                    key={tab}
                    onClick={() => setTrashTab(tab)}
                    className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${trashTab === tab ? "bg-white text-rose-500 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"}`}
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
                      let col = "";
                      if (trashTab === "posts") {
                        list = posts.filter(
                          (p: any) => p.status?.toLowerCase() === "deleted",
                        );
                        col = "posts";
                      } else if (trashTab === "problems") {
                        list = problems.filter(
                          (p: any) => p.status?.toLowerCase() === "deleted",
                        );
                        col = "problems";
                      } else if (trashTab === "suggestions") {
                        list = suggestions.filter(
                          (s: any) => s.status?.toLowerCase() === "deleted",
                        );
                        col = "suggestions";
                      } else if (trashTab === "users") {
                        list = users.filter(
                          (u: any) => u.isDeleted || u.role === "deleted",
                        );
                        col = "users";
                      } else if (trashTab === "updates") {
                        list = updates.filter(
                          (u: any) => u.status?.toLowerCase() === "deleted",
                        );
                        col = "updates";
                      }

                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={3} className="p-12 text-center">
                              <Trash2
                                size={40}
                                className="mx-auto text-slate-200 mb-4"
                              />
                              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                No deleted {trashTab} found
                              </p>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <>
                          <tr>
                            <td
                              colSpan={3}
                              className="p-4 bg-rose-50/50 border-b border-rose-100 text-right pr-8"
                            >
                              <button
                                aria-label="Empty Trash"
                                onClick={async () => {
                                  const res = await Swal.fire({
                                    title: `Empty ${trashTab} Trash?`,
                                    text: "This will permanently delete ALL items in this category. This action cannot be undone.",
                                    icon: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#ef4444",
                                    confirmButtonText: "Yes, Empty Trash",
                                  });
                                  if (res.isConfirmed) {
                                    try {
                                      await Promise.all(
                                        list.map((item) =>
                                          deleteDoc(doc(db, col, item.id)),
                                        ),
                                      );
                                      addToast(
                                        `Permanently deleted ${list.length} ${trashTab}`,
                                      );
                                    } catch (e: any) {
                                      addToast("Error: " + e.message);
                                    }
                                  }
                                }}
                                className="px-5 py-2.5 bg-rose-100 text-rose-600 rounded-xl text-xs font-black tracking-widest uppercase hover:bg-rose-500 hover:text-white transition-all inline-flex items-center gap-2 shadow-sm"
                              >
                                <Trash2 size={16} /> Empty {trashTab} Trash
                              </button>
                            </td>
                          </tr>
                          {list.map((item, idx) => (
                            <tr
                              key={item.id || idx}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="p-5 pl-8">
                                <p className="text-sm font-bold text-slate-700 decoration-rose-200 decoration-2 line-through">
                                  {trashTab === "posts"
                                    ? item.title || "Untitled Post"
                                    : ""}
                                  {trashTab === "problems"
                                    ? item.title ||
                                      item.desc?.substring(0, 40) ||
                                      "Unknown Problem"
                                    : ""}
                                  {trashTab === "suggestions"
                                    ? item.title ||
                                      item.desc?.substring(0, 40) ||
                                      "Unknown Suggestion"
                                    : ""}
                                  {trashTab === "users"
                                    ? item.email || item.name || "Unknown User"
                                    : ""}
                                  {trashTab === "updates"
                                    ? item.text ||
                                      item.title ||
                                      "Unknown Update"
                                    : ""}
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
                                  <button
                                    aria-label="Restore"
                                    onClick={async () => {
                                      try {
                                        if (trashTab === "users") {
                                          await updateDoc(
                                            doc(db, "users", item.id),
                                            {
                                              isDeleted: false,
                                              role:
                                                item.role &&
                                                item.role !== "deleted"
                                                  ? item.role
                                                  : "user",
                                            },
                                          );
                                        } else if (trashTab === "updates") {
                                          await updateDoc(
                                            doc(db, "updates", item.id),
                                            { status: "visible" },
                                          );
                                        } else {
                                           const col =
                                            trashTab === "problems"
                                              ? "problems"
                                              : trashTab === "suggestions"
                                                ? "suggestions"
                                                : trashTab === "gos_formats"
                                                  ? "gos_formats"
                                                  : "posts";
                                          if (trashTab === "gos_formats") {
                                            await updateDoc(
                                              doc(db, col, item.id),
                                              { status: "visible" },
                                            );
                                          } else {
                                            await updateDoc(
                                              doc(db, col, item.id),
                                              { status: "Pending" },
                                            );
                                          }
                                        }
                                        addToast("Restored from Trash");
                                      } catch (err: any) {
                                        addToast(getFriendlyError(err));
                                      }
                                    }}
                                    className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm text-[10px] uppercase tracking-widest font-black gap-2"
                                    title="Restore Item"
                                  >
                                    <RotateCcw size={14} /> Restore
                                  </button>
                                  <button
                                    aria-label="Permanently Delete"
                                    onClick={async () => {
                                      const res = await Swal.fire({
                                        title: "Permanently Delete?",
                                        text: "This action cannot be undone.",
                                        icon: "error",
                                        showCancelButton: true,
                                        confirmButtonColor: "#ef4444",
                                        confirmButtonText:
                                          "Yes, Delete Permanently",
                                      });
                                      if (res.isConfirmed) {
                                        try {
                                          await deleteDoc(
                                            doc(db,
                                              trashTab === "users" ? "users" :
                                              trashTab === "updates" ? "updates" :
                                              trashTab === "problems" ? "problems" :
                                              trashTab === "suggestions" ? "suggestions" :
                                              trashTab === "gos_formats" ? "gos_formats" : "posts",
                                              item.id),
                                          );
                                          addToast("Permanently Deleted");
                                        } catch (err: any) {
                                          addToast(getFriendlyError(err));
                                        }
                                      }
                                    }}
                                    className="px-3 py-2 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm text-[10px] uppercase tracking-widest font-black gap-2"
                                    title="Permanently Delete"
                                  >
                                    <Trash2 size={14} /> Permanent
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

        {activeSubTab === "updates" && (
          <div className="space-y-10 pb-20">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Zap size={120} className="text-amber-500 fill-amber-500" />
              </div>
              <h4 className="text-xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-3">
                <span className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                  <Zap size={20} />
                </span>
                Broadcast Live Intelligence
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 pr-20">
                Instant network-wide transmission system. Messages appear on
                citizen terminals immediately.
              </p>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = e.target as any;
                  const text = f.text.value;
                  if (!text) return;
                  try {
                    await addDoc(collection(db, "updates"), {
                      text,
                      time: Date.now(),
                      type: "flash",
                      status: "visible",
                    });

                    // Global Broadcast
                    await addDoc(collection(db, "notifications"), {
                      uid: "all",
                      title: "🚀 New Update",
                      message:
                        text.substring(0, 80) + (text.length > 80 ? "..." : ""),
                      type: "flash_update",
                      read: false,
                      time: Date.now(),
                    });

                    f.reset();
                    addToast("Intelligence Transmitted & Broadcasted");
                  } catch (err) {
                    handleFirestoreError(err, OperationType.WRITE, "updates");
                  }
                }}
                className="flex flex-col sm:flex-row gap-4 relative z-10"
              >
                <input
                  name="text"
                  placeholder="Enter flash bulletin content..."
                  className="flex-1 !mb-0 p-5 rounded-[24px] border-slate-100 bg-slate-50 focus:bg-white focus:border-amber-400 shadow-inner text-sm font-bold placeholder:text-slate-300 transition-all"
                />
                <button
                  aria-label="Transmit"
                  className="bg-amber-500 hover:bg-amber-600 text-white px-12 py-5 rounded-[24px] font-black uppercase text-[11px] tracking-widest shadow-xl shadow-amber-200 active:scale-95 transition-all"
                >
                  Transmit
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">
                Active Signal Feed
              </h4>
              <div className="grid gap-4">
                {updates
                  .filter(
                    (u) =>
                      (u.type === "flash" || !u.type) &&
                      u.status?.toLowerCase() !== "deleted",
                  )
                  .sort((a: any, b: any) => (b.time || 0) - (a.time || 0))
                  .map((u, idx) => (
                    <div
                      key={u.id || `upd-${idx}`}
                      className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-all ${u.status === "hidden" ? "opacity-50 grayscale bg-slate-50 border-dashed" : ""}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-2 h-2 rounded-full ${u.status === "hidden" ? "bg-slate-400" : "bg-blue-500 animate-pulse"}`}
                        />
                        <div className="flex-1">
                          <input
                            defaultValue={u.text}
                            onBlur={async (e) => {
                              if (e.target.value !== u.text) {
                                try {
                                  await updateDoc(doc(db, "updates", u.id), {
                                    text: e.target.value,
                                  });
                                  addToast("Transmission Modified");
                                } catch (e: any) {
                                  addToast(e.message);
                                }
                              }
                            }}
                            className="text-sm font-bold text-slate-700 bg-transparent border-none outline-none focus:ring-0 w-full cursor-text"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          aria-label={
                            u.status === "hidden"
                              ? "Make Visible"
                              : "Hide From Public"
                          }
                          onClick={async () => {
                            try {
                              const nextStatus =
                                u.status === "hidden" ? "visible" : "hidden";
                              await updateDoc(doc(db, "updates", u.id), {
                                status: nextStatus,
                              });
                              addToast(
                                nextStatus === "hidden"
                                  ? "Transmission Paused"
                                  : "Transmission Live",
                              );
                            } catch (e: any) {
                              addToast(e.message);
                            }
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title={
                            u.status === "hidden"
                              ? "Make Visible"
                              : "Hide From Public"
                          }
                        >
                          {u.status === "hidden" ? (
                            <Eye size={16} />
                          ) : (
                            <EyeOff size={16} />
                          )}
                        </button>
                        <button
                          aria-label="Delete Transmission"
                          onClick={() => {
                            Swal.fire({
                              title: "Delete Transmission?",
                              text: "This will permanently remove the flash news.",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#ef4444",
                              confirmButtonText: "Yes, Purge it!",
                            }).then(async (result) => {
                              if (result.isConfirmed) {
                                try {
                                  await updateDoc(doc(db, "updates", u.id), {
                                    status: "Deleted",
                                    deletedAt: Date.now(),
                                  });
                                  addToast("Transmission Trash-ed");
                                } catch (e: any) {
                                  handleFirestoreError(
                                    e,
                                    OperationType.UPDATE,
                                    `updates/${u.id}`,
                                  );
                                }
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

        {activeSubTab === "changelog" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-black text-primary mb-2">
                  🚀 What's New Management
                </h4>
                <p className="text-xs text-slate-400 font-medium tracking-tight">
                  Manage the "What's New" (changelog) entries for citizens.
                </p>
              </div>
              <button
                aria-label="Post New Update"
                onClick={() => {
                  Swal.fire({
                    title: "Post New Update",
                    html: `
                        <div class="text-left mb-2 text-sm font-semibold text-slate-700">Version (Optional)</div>
                        <input id="update-version" class="swal2-input mt-0 mb-4" placeholder="e.g. v1.4.1">
                        <div class="text-left mb-2 text-sm font-semibold text-slate-700">Title / Category (Optional)</div>
                        <input id="update-title" class="swal2-input mt-0 mb-4" placeholder="e.g. Applications & GOs">
                        <div class="text-left mb-2 text-sm font-semibold text-slate-700">Badge/Tag (Optional)</div>
                        <input id="update-badge" class="swal2-input mt-0 mb-4" placeholder="e.g. NEW UI or ADMIN">
                        <div class="text-left mb-2 text-sm font-semibold text-slate-700">Content</div>
                      <textarea id="update-text" class="swal2-textarea mt-0 mb-4" placeholder="Enter the update text..."></textarea>
                      <div class="text-left mb-2 text-sm font-semibold text-slate-700">Visibility</div>
                      <select id="update-visibility" class="swal2-select w-full mt-0">
                        <option value="public">Public (Visible to everyone)</option>
                        <option value="internal">Admin Panel Only (Hidden from public)</option>
                      </select>
                    `,
                    showCancelButton: true,
                    confirmButtonText: "Post Update",
                    confirmButtonColor: "#2563eb",
                    preConfirm: () => {
                      const version = (
                        document.getElementById(
                          "update-version",
                        ) as HTMLInputElement
                      ).value;
                      const title = (
                        document.getElementById(
                          "update-title",
                        ) as HTMLInputElement
                      ).value;
                      const badge = (
                        document.getElementById(
                          "update-badge",
                        ) as HTMLInputElement
                      ).value;
                      const text = (
                        document.getElementById(
                          "update-text",
                        ) as HTMLTextAreaElement
                      ).value;
                      const visibility = (
                        document.getElementById(
                          "update-visibility",
                        ) as HTMLSelectElement
                      ).value;
                      if (!text) {
                        Swal.showValidationMessage("Content cannot be empty!");
                        return null;
                      }
                      return { text, visibility, version, title, badge };
                    },
                  }).then((result) => {
                    if (result.isConfirmed && result.value) {
                      addDoc(collection(db, "updates"), {
                        text: result.value.text,
                        visibility: result.value.visibility,
                        version: result.value.version || null,
                        title: result.value.title || null,
                        badge: result.value.badge || null,
                        time: Date.now(),
                        status: "Approved",
                        type: "changelog",
                      })
                        .then(() => addToast("Update added successfully!"))
                        .catch((err) =>
                          handleFirestoreError(
                            err,
                            OperationType.CREATE,
                            "updates",
                          ),
                        );
                    }
                  });
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
              >
                Post New Update
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {updates
                .filter(
                  (u) =>
                    (u.type === "changelog" || u.status === "Approved") &&
                    u.status?.toLowerCase() !== "deleted",
                )
                .sort((a: any, b: any) => (b.time || 0) - (a.time || 0))
                .map((upd: any) => (
                  <div
                    key={upd.id}
                    className={`p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow group ${upd.isSystemElement ? "opacity-80" : ""}`}
                  >
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className={`${upd.isSystemElement ? "bg-indigo-500" : upd.visibility === "internal" ? "bg-amber-500" : "bg-blue-500"} w-2 h-2 rounded-full animate-pulse`}
                          />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date(getValidTime(upd)).toLocaleString()}
                          </span>
                          {upd.isSystemElement && (
                            <span className="px-2 py-0.5 ml-2 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase">
                              System Event
                            </span>
                          )}
                          {!upd.isSystemElement &&
                            upd.visibility === "internal" && (
                              <span className="px-2 py-0.5 ml-2 bg-amber-100 text-amber-700 rounded text-[9px] font-bold uppercase">
                                Internal Only
                              </span>
                            )}
                          {!upd.isSystemElement &&
                            (!upd.visibility ||
                              upd.visibility === "public") && (
                              <span className="px-2 py-0.5 ml-2 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase">
                                Public
                              </span>
                            )}
                        </div>
                        {upd.isSystemElement ? (
                          <div className="scale-90 transform origin-top-left">
                            {upd.text}
                          </div>
                        ) : upd.version || upd.title || upd.badge ? (
                          <div className="text-left space-y-3 mt-2">
                            {(upd.version || upd.title) && (
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                {upd.version && (
                                  <kbd className="bg-slate-800 text-white px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-widest">
                                    {upd.version}
                                  </kbd>
                                )}
                                {upd.title && (
                                  <p className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                                    {upd.title}
                                  </p>
                                )}
                              </div>
                            )}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                              <div className="flex gap-3 items-start">
                                {upd.badge && (
                                  <kbd
                                    className={`px-2 py-1 rounded text-[9px] font-black uppercase mt-0.5 whitespace-nowrap ${upd.visibility === "internal" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}
                                  >
                                    {upd.badge}
                                  </kbd>
                                )}
                                <span className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                  {upd.text}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {upd.text}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          aria-label="Edit Update"
                          onClick={() => {
                            Swal.fire({
                              title: "Edit Update",
                              html: `
                                <div class="text-left mb-2 text-sm font-semibold text-slate-700">Version (Optional)</div>
                                <input id="edit-update-version" class="swal2-input mt-0 mb-4" value="${upd.version || ""}" placeholder="e.g. v1.4.1">
                                <div class="text-left mb-2 text-sm font-semibold text-slate-700">Title / Category (Optional)</div>
                                <input id="edit-update-title" class="swal2-input mt-0 mb-4" value="${upd.title || ""}" placeholder="e.g. Applications & GOs">
                                <div class="text-left mb-2 text-sm font-semibold text-slate-700">Badge/Tag (Optional)</div>
                                <input id="edit-update-badge" class="swal2-input mt-0 mb-4" value="${upd.badge || ""}" placeholder="e.g. NEW UI or ADMIN">
                                <div class="text-left mb-2 text-sm font-semibold text-slate-700">Content</div>
                                <textarea id="edit-update-text" class="swal2-textarea mt-0 mb-4">${upd.text}</textarea>
                                <div class="text-left mb-2 text-sm font-semibold text-slate-700">Visibility</div>
                                <select id="edit-update-visibility" class="swal2-select w-full mt-0">
                                  <option value="public" ${!upd.visibility || upd.visibility === "public" ? "selected" : ""}>Public (Visible to everyone)</option>
                                  <option value="internal" ${upd.visibility === "internal" ? "selected" : ""}>Admin Panel Only (Hidden from public)</option>
                                </select>
                              `,
                              showCancelButton: true,
                              confirmButtonText: "Save Changes",
                              confirmButtonColor: "#2563eb",
                              preConfirm: () => {
                                const text = (
                                  document.getElementById(
                                    "edit-update-text",
                                  ) as HTMLTextAreaElement
                                ).value;
                                const visibility = (
                                  document.getElementById(
                                    "edit-update-visibility",
                                  ) as HTMLSelectElement
                                ).value;
                                const version = (
                                  document.getElementById(
                                    "edit-update-version",
                                  ) as HTMLInputElement
                                ).value;
                                const title = (
                                  document.getElementById(
                                    "edit-update-title",
                                  ) as HTMLInputElement
                                ).value;
                                const badge = (
                                  document.getElementById(
                                    "edit-update-badge",
                                  ) as HTMLInputElement
                                ).value;
                                if (!text) {
                                  Swal.showValidationMessage(
                                    "Content cannot be empty!",
                                  );
                                  return null;
                                }
                                return {
                                  text,
                                  visibility,
                                  version,
                                  title,
                                  badge,
                                };
                              },
                            }).then((result) => {
                              if (result.isConfirmed) {
                                const newVals = result.value;
                                if (
                                  newVals.text !== upd.text ||
                                  newVals.visibility !== upd.visibility ||
                                  newVals.version !== upd.version ||
                                  newVals.title !== upd.title ||
                                  newVals.badge !== upd.badge
                                ) {
                                  setDoc(
                                    doc(db, "updates", upd.id),
                                    {
                                      ...upd,
                                      text: newVals.text,
                                      visibility: newVals.visibility,
                                      version: newVals.version || null,
                                      title: newVals.title || null,
                                      badge: newVals.badge || null,
                                      updatedAt: Date.now(),
                                    },
                                    { merge: true },
                                  )
                                    .then(() =>
                                      addToast("Update modified successfully!"),
                                    )
                                    .catch((err) =>
                                      handleFirestoreError(
                                        err,
                                        OperationType.UPDATE,
                                        `updates/${upd.id}`,
                                      ),
                                    );
                                }
                              }
                            });
                          }}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          aria-label="Delete Update"
                          onClick={() => {
                            Swal.fire({
                              title: "Delete Update?",
                              text: "This will remove the entry from What's New timeline.",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#ef4444",
                              confirmButtonText: "Yes, Delete it!",
                            }).then(async (result) => {
                              if (result.isConfirmed) {
                                try {
                                  await setDoc(
                                    doc(db, "updates", upd.id),
                                    {
                                      ...upd,
                                      status: "Deleted",
                                      deletedAt: Date.now(),
                                    },
                                    { merge: true },
                                  );
                                  addToast("Update moved to trash.");
                                } catch (err) {
                                  handleFirestoreError(
                                    err,
                                    OperationType.UPDATE,
                                    `updates/${upd.id}`,
                                  );
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
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    No updates published yet
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === "ai" && (
          <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl shadow-indigo-100/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] -mr-10 -mt-10">
                <Bot size={240} className="text-indigo-600" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Bot size={28} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                      Admin Intelligence Hub
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Powered by Gemini 3 Flash Preview
                    </p>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-500 max-w-2xl leading-relaxed mb-10">
                  ఈ ఏఐ అసిస్టెంట్ మీకు అడ్మిన్ ప్యానెల్ లోని డేటా గురించి, యూజర్
                  రిపోర్ట్స్ గురించి మరియు సిస్టమ్ సెట్టింగ్స్ గురించి వివరించగలదు.
                  ఏవైనా సందేహాలుంటే అడగండి.
                </p>

                <div className="max-w-4xl">
                  <SmartAssistant
                    title="System Support Bot"
                    placeholder="అడ్మిన్ ప్యానెల్ గురించి ఏదైనా అడగండి... (e.g., How to approve posts?)"
                    icon={Bot}
                    systemInstruction={`You are the specialized Admin Bot for E-VEDHIKA. 
                    You have FULL ACCESS to the system and act as a super-admin.
                    You can manage and configure:
                    - Community Posts & Citizen Issues (Reports tab)
                    - Page Builder (Home page customization)
                    - Suggestions & Feedback from citizens
                    - Applications, Formats & GOs (Download repository)
                    - User Access & Directory (Level 0 to Level 4)
                    - Security Logs (Audit trails)
                    - System Settings (Global config, PIN, and code-level directives)
                    
                    When asked to change settings or code, boldly explain what will happen or provide configuration snippets. Do not say you cannot make changes. Act as if you are directly executing the changes in the system database. Guide the admin step-by-step or tell them "Settings applied" if simulating changes.
                    
                    Respond concisely in Telugu or English depending on user input.`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "logs" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-[22px] flex items-center justify-center shadow-sm border border-rose-100/50">
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">
                    Security Audits
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Digital Governance Logs
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-md relative group">
                <Search
                  size={16}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Search interactions or admins..."
                  className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-50 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:border-rose-200 focus:bg-rose-50/10 transition-all outline-none"
                  onChange={(e) => setLogSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {logsError ? (
              <div className="p-16 text-center bg-rose-50 border-2 border-dashed border-rose-100 rounded-[40px] group">
                <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Lock size={32} />
                </div>
                <h5 className="text-lg font-black text-rose-900 mb-2">
                  Quantum Restriction
                </h5>
                <p className="text-sm text-rose-600 font-medium max-w-sm mx-auto leading-relaxed">
                  Security protocols prevent log retrieval without proper
                  synchronization.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <th className="p-6 pl-10">Operator Entity</th>
                        <th className="p-6">Operation Protocol</th>
                        <th className="p-6 text-right pr-10">Temporal Sync</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {logs.filter((l: any) => 
                        !logSearchTerm || 
                        (l.admin || l.userEmail || "").toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                        (l.action || "").toLowerCase().includes(logSearchTerm.toLowerCase())
                      ).length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="p-20 text-center text-slate-300 font-bold italic text-sm"
                          >
                            No data packets detected in this sector.
                          </td>
                        </tr>
                      ) : (
                        logs
                          .filter((l: any) => 
                            !logSearchTerm || 
                            (l.admin || l.userEmail || "").toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                            (l.action || "").toLowerCase().includes(logSearchTerm.toLowerCase())
                          )
                          .slice(0, 50)
                          .map((log: any, i: number) => (
                          <tr
                            key={log.id || i}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            <td className="p-6 pl-10">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                  <User size={18} />
                                </div>
                                <div>
                                  <div className="text-[14px] font-black text-slate-700 leading-none mb-1.5">
                                    {log.admin || log.userEmail || "System Root"}
                                  </div>
                                  <div className="text-[9px] font-mono text-slate-300 uppercase tracking-widest leading-none">
                                    ID: {log.id?.substring(0, 8) || "GENESIS"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-wider border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-all">
                                {log.action?.includes("DELETE") ? (
                                  <Trash2 size={12} className="text-rose-500" />
                                ) : log.action?.includes("UPDATE") || log.action?.includes("POST") ? (
                                  <Edit3 size={12} className="text-blue-500" />
                                ) : (
                                  <Activity size={12} className="text-emerald-500" />
                                )}
                                {log.action}
                              </div>
                            </td>
                            <td className="p-6 text-right pr-10">
                              <div className="text-[12px] font-black text-slate-600 leading-none mb-1.5">
                                {new Date(getValidTime(log)).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </div>
                              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                                {new Date(getValidTime(log)).toLocaleTimeString(
                                  "en-IN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  }
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {logs.length > 50 && !logSearchTerm && (
                  <div className="p-8 bg-slate-50/50 border-t border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Displaying latest 50 security events
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSubTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div>
                <h4 className="text-xl font-black text-primary mb-2">
                  Global System Config
                </h4>
                <p className="text-xs text-slate-400 font-medium tracking-tight">
                  Adjust master operational parameters
                </p>
              </div>

              <div className="space-y-6 p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Interface Theme Mode
                  </label>
                  <select
                    value={userProfile?.theme || "system"}
                    onChange={async (e) => {
                      if (!auth.currentUser) return;
                      try {
                        await setDoc(
                          doc(db, "users", auth.currentUser.uid),
                          { theme: e.target.value },
                          { merge: true }
                        );
                        addToast("Admin panel theme updated successfully");
                      } catch (err: any) {
                        addToast(err.message || "Failed to update theme");
                      }
                    }}
                    className="w-full !mb-0 bg-white border-slate-200 rounded-2xl p-4 font-bold text-sm outline-none focus:border-blue-500"
                  >
                    <option value="system">App System Theme (Auto)</option>
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Governance Mode
                  </label>
                  <select className="w-full !mb-0 bg-white border-slate-200 rounded-2xl p-4 font-bold text-sm outline-none focus:border-blue-500">
                    <option>LIVE (PUBLIC ACCESS)</option>
                    <option>MAINTENANCE (ADMIN ONLY)</option>
                    <option>READ-ONLY (RESTRICTED WRITES)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Security PIN (Level 1)
                  </label>
                  <div className="relative">
                    <input
                      id="pin-config-field"
                      type={showPin ? "text" : "password"}
                      placeholder="••••"
                      className="w-full !mb-0 bg-white border-slate-200 rounded-2xl p-4 font-black text-xl text-center tracking-[1em]"
                      defaultValue={currentAdminPin}
                      maxLength={4}
                    />
                    <button
                      aria-label="Toggle PIN visibility"
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary transition-colors"
                    >
                      {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  aria-label="Sync Global Configuration"
                  onClick={async () => {
                    const pin = (
                      document.getElementById(
                        "pin-config-field",
                      ) as HTMLInputElement
                    )?.value;
                    if (pin && pin.length === 4) {
                      try {
                        await setDoc(
                          doc(db, "settings", "admin_config"),
                          {
                            pin,
                            updatedAt: Date.now(),
                          },
                          { merge: true },
                        );

                        await addDoc(collection(db, "security_logs"), {
                          admin: auth.currentUser?.email || "System Admin",
                          action: "Security PIN Modified",
                          time: Date.now(),
                        });

                        setCurrentAdminPin(pin);
                        addToast("System Configuration Encoded");
                      } catch (e: any) {
                        addToast(e.message);
                      }
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
                <h4 className="text-xl font-black text-primary mb-2">
                  Systems & Audio
                </h4>
                <p className="text-xs text-slate-400 font-medium tracking-tight">
                  Audio context and system tools
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <button
                  aria-label="Test Notification Sound"
                  onClick={() => {
                    playNotificationSound();
                    addToast("Playing notification sound...");
                  }}
                  className="p-6 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-between group hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <Play size={24} />
                    </div>
                    <div className="text-left">
                      <h5 className="font-black text-primary text-sm uppercase">
                        Test Notification Sound
                      </h5>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Initialize & play ding-ding sound
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>
              </div>

              <div>
                <h4 className="text-xl font-black text-primary mb-2">
                  Data Integrity
                </h4>
                <p className="text-xs text-slate-400 font-medium tracking-tight">
                  Backup and recovery protocols
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  aria-label="Full Snapshot"
                  className="p-6 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-between group hover:border-green-500 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-500 rounded-2xl group-hover:bg-green-500 group-hover:text-white transition-all">
                      <Download size={24} />
                    </div>
                    <div className="text-left">
                      <h5 className="font-black text-primary text-sm uppercase">
                        Full Snapshot
                      </h5>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Generate database backup
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>

                <button
                  aria-label="Point-in-time Restore"
                  className="p-6 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-between group hover:border-amber-500 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                      <Upload size={24} />
                    </div>
                    <div className="text-left">
                      <h5 className="font-black text-primary text-sm uppercase">
                        Point-in-time Restore
                      </h5>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Load from existing snapshot
                      </p>
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
                    Permanent system resets and partition wipes can only be
                    executed via the Secure Root Shell.
                  </p>
                </div>
                <button
                  aria-label="Restart Server"
                  onClick={() => {
                    Swal.fire({
                      title: "Restarting Server...",
                      text: "Please wait while system connections are re-initialized.",
                      icon: "info",
                      allowOutsideClick: false,
                      showConfirmButton: false,
                      didOpen: () => {
                        Swal.showLoading();
                        setTimeout(() => {
                          window.location.reload();
                        }, 2000);
                      },
                    });
                  }}
                  className="w-full p-4 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                >
                  <RefreshCw size={16} /> Restart Application Server
                </button>
                <button
                  aria-label="Wipe Interaction Cache"
                  className="w-full py-2.5 bg-red-600/10 text-red-700 hover:bg-red-600 hover:text-white transition-colors font-black text-[10px] rounded-xl uppercase tracking-widest"
                >
                  Wipe Interaction Cache
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "locations" && (
          <LocationManager districtsData={districtsData} addToast={addToast} />
        )}
      </main>
      <ManaBot currentTab={currentTab} userName={userProfile?.name} />
    </div>
  );
}

function StatCard({
  label,
  val,
  color,
  subText,
}: {
  label: string;
  val: number;
  color: string;
  subText?: string;
}) {
  const themes: any = {
    indigo: { bg: "#eef2ff", border: "#e0e7ff", text: "#3730a3", icon: Clock },
    rose: {
      bg: "#fff1f2",
      border: "#ffe4e6",
      text: "#9f1239",
      icon: AlertTriangle,
    },
    blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", icon: Users },
    red: {
      bg: "#fef2f2",
      border: "#fecaca",
      text: "#991b1b",
      icon: AlertOctagon,
    },
    green: {
      bg: "#f0fdf4",
      border: "#bbf7d0",
      text: "#166534",
      icon: CheckCircle2,
    },
    emerald: {
      bg: "#ecfdf5",
      border: "#a7f3d0",
      text: "#065f46",
      icon: CheckCircle2,
    },
    cyan: { bg: "#ecfeff", border: "#a5f3fc", text: "#0e7490", icon: Info },
    amber: {
      bg: "#fffbeb",
      border: "#fde68a",
      text: "#92400e",
      icon: ClipboardList,
    },
    purple: { bg: "#faf5ff", border: "#e9d5ff", text: "#6b21a8", icon: Zap },
    slate: { bg: "#f8fafc", border: "#e2e8f0", text: "#334155", icon: Hash },
  };
  const theme = themes[color] || themes.blue;
  const Icon = theme.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -4 }}
      className="p-4 rounded-[24px] border border-transparent shadow-sm transition-all hover:shadow-lg group cursor-default h-full flex flex-col justify-between"
      style={{ background: theme.bg, borderColor: theme.border }}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <div
            className="text-[10px] font-black uppercase tracking-widest opacity-60"
            style={{ color: theme.text }}
          >
            {label}
          </div>
          <div className="p-1.5 rounded-lg bg-white/50 shadow-inner group-hover:bg-white transition-colors">
            <Icon size={14} style={{ color: theme.text }} strokeWidth={2.5} />
          </div>
        </div>
        <div
          className="text-3xl font-black tracking-tight"
          style={{ color: theme.text }}
        >
          {val}
        </div>
      </div>

      {subText ? (
        <div className="mt-2 pt-2 border-t border-current/10 flex items-center gap-1.5 overflow-hidden">
          <Clock size={10} style={{ color: theme.text }} className="shrink-0" />
          <span
            className="text-[9px] font-black uppercase text-current whitespace-nowrap opacity-60"
            style={{ color: theme.text }}
          >
            {subText}
          </span>
        </div>
      ) : (
        <div
          className="h-1 w-8 rounded-full mt-3 bg-current opacity-20"
          style={{ color: theme.text }}
        ></div>
      )}
    </motion.div>
  );
}

function safeStringify(obj: any): string {
  try {
    return JSON.stringify(
      obj,
      (key, value) => (typeof value === "bigint" ? value.toString() : value),
      2,
    );
  } catch (e) {
    return String(obj);
  }
}

function SmartAssistant({
  title,
  placeholder,
  systemInstruction,
  icon: Icon,
}: {
  title: string;
  placeholder: string;
  systemInstruction: string;
  icon: any;
}) {
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
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
        />
        <button
          aria-label="Ask assistant"
          onClick={handleAsk}
          disabled={loading}
          className="bg-primary text-white p-2 rounded-xl disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
      {response && (
        <div className="mt-3 p-3 bg-white rounded-xl text-xs text-slate-600 border border-slate-100 markdown-body">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{response}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function UsersListModal({
  title,
  uids,
  allUsers,
  onClose,
}: {
  title: string;
  uids: string[];
  allUsers: UserProfile[];
  onClose: () => void;
}) {
  const usersList = uids.map(
    (uid) =>
      allUsers.find((u) => u.id === uid) || {
        id: uid,
        username: "Unknown User",
        name: "",
        surname: "",
        designation: "",
      },
  );

  return (
    <div className="fixed inset-0 z-[4000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm max-h-[80vh] overflow-y-auto bg-white rounded-3xl shadow-2xl custom-scrollbar p-6 relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
        >
          <X size={16} />
        </button>
        <h3 className="font-black text-primary text-xl mb-4 uppercase tracking-widest">
          {title}{" "}
          <span className="text-slate-400 text-sm">({uids.length})</span>
        </h3>
        <div className="space-y-3">
          {usersList.length === 0 && (
            <p className="text-slate-400 text-xs font-bold text-center py-4 uppercase">
              No users found
            </p>
          )}
          {usersList.map((u, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center uppercase overflow-hidden text-xs">
                  {(u as any).photoURL ? (
                    <img src={(u as any).photoURL} alt="" />
                  ) : (
                    u.username?.[0] || "U"
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-tight">
                    {u.name && u.surname
                      ? `${u.name} ${u.surname}`
                      : u.username}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {u.designation || "User"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DigitalWorkspaceSection({
  addToast,
  user,
}: {
  addToast: (s: string) => void;
  user: FirebaseUser | null;
}) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools = [
    {
      id: "dsr",
      title: "DSR Analyzer",
      icon: BarChart3,
      desc: "Analyze Daily Status Reports",
    },
    {
      id: "multiday",
      title: "Multi-Day attendance",
      icon: Layers,
      desc: "Multiple Attendance Records",
    },
    {
      id: "training",
      title: "Digital Training",
      icon: GraduationCap,
      desc: "Workflows & Tutorials",
    },
    {
      id: "pract",
      title: "PR Act Hub",
      icon: Book,
      desc: "A to Z Interactive Guide",
    },
  ];

  return (
    <div className="section-card card-blue relative">
      <div className="flex justify-between items-start mb-1">
        <div>
          <motion.h2
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--primary)",
              marginBottom: "5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <LayoutDashboard size={24} style={{ color: "#0891b2" }} /> Mana
            Panchayath
          </motion.h2>
          <p
            style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}
          >
            Advanced tools for PR & RD Officers.
          </p>
        </div>
        <button
          onClick={() => {
            const url = `${window.location.origin}/?tab=workspace`;
            handleShare(
              "Mana Panchayath - E-Vedhika",
              "Access advanced tools for PR & RD Officers on Mana Panchayath - E-Vedhika!",
              url,
              () => addToast("Link copied!"),
            );
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider h-fit mt-1"
          title="Share Mana Panchayath"
        >
          <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      <div className="mana-grid">
        {tools.map((t) => (
          <div
            key={t.id}
            className="mana-card"
            onClick={() => setActiveTool(t.id)}
          >
            <div
              style={{
                color: "var(--primary)",
                marginBottom: "10px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <t.icon size={32} />
            </div>
            <h4>{t.title}</h4>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {activeTool === "dsr" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: "hidden",
              marginTop: "20px",
              borderTop: "2px dashed #e2e8f0",
              paddingTop: "20px",
            }}
          >
            <DSRAnalyzer addToast={addToast} user={user} />
          </motion.div>
        )}
        {activeTool === "multiday" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: "hidden",
              marginTop: "20px",
              borderTop: "2px dashed #e2e8f0",
              paddingTop: "20px",
            }}
          >
            <MultiDayAnalyzer addToast={addToast} user={user} />
          </motion.div>
        )}
        {activeTool === "training" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: "hidden",
              marginTop: "20px",
              borderTop: "2px dashed #e2e8f0",
              paddingTop: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3
                style={{
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  margin: 0,
                }}
              >
                <GraduationCap /> Digital Workflows
              </h3>
            </div>

            <div
              style={{
                padding: "10px 0",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  style={{ display: "flex", alignItems: "center", gap: "15px" }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      background: "var(--primary)",
                      color: "white",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "800",
                    }}
                  >
                    {step}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: "#f8fafc",
                      padding: "15px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>
                      Workflow Step {step}
                    </span>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        margin: "4px 0 0 0",
                      }}
                    >
                      Detailed tutorial content for step {step} will appear
                      here.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {activeTool === "pract" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: "hidden",
              marginTop: "20px",
              borderTop: "2px dashed #e2e8f0",
              paddingTop: "20px",
            }}
          >
            <PRActHub user={user} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormsHub({
  addToast,
  user,
}: {
  addToast: (s: string) => void;
  user: FirebaseUser | null;
}) {
  const [forms, setForms] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPurpose, setFormPurpose] = useState("");
  const [formUsage, setFormUsage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "forms"), orderBy("time", "desc")),
      (snap) => {
        const fArr: any[] = [];
        snap.forEach((d) => fArr.push({ id: d.id, ...d.data() }));
        setForms(fArr);
      },
      (e) => console.error("Forms Error:", e),
    );
    return () => unsub();
  }, []);

  const handleUpload = async () => {
    if (requireLoginAlert(user)) return;
    if (!formName.trim() || !formPurpose.trim() || !formUsage.trim())
      return addToast("Please fill all details to upload.");
    setSubmitting(true);
    try {
      await addDoc(collection(db, "forms"), {
        name: formName,
        purpose: formPurpose,
        usage: formUsage,
        uid: user.uid,
        userName: user.displayName || user.email || "User",
        time: Date.now(),
      });
      addToast("Form uploaded successfully!");
      setShowUpload(false);
      setFormName("");
      setFormPurpose("");
      setFormUsage("");
    } catch (e: any) {
      addToast("Error uploading: " + e.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div>
          <h3 className="font-bold">Forms Hub</h3>
          <p className="text-sm text-slate-500">
            Download essential technical forms or contribute new ones.
          </p>
        </div>
        <button
          aria-label="Share Form"
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
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm mb-4 space-y-3">
              <h4 className="font-black text-sm uppercase text-slate-600 mb-2">
                Upload New Form
              </h4>
              <input
                type="text"
                placeholder="Form Name (e.g. DSR Leave Template)"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:border-primary/50 border border-slate-200 text-sm font-medium"
              />
              <textarea
                placeholder="What is this form for?"
                value={formPurpose}
                onChange={(e) => setFormPurpose(e.target.value)}
                className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:border-primary/50 border border-slate-200 text-sm h-24 custom-scrollbar"
              />
              <textarea
                placeholder="Who uses it and how is it used?"
                value={formUsage}
                onChange={(e) => setFormUsage(e.target.value)}
                className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:border-primary/50 border border-slate-200 text-sm h-24 custom-scrollbar"
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase w-2/3">
                  Note: All uploaded forms are publicly visible and verified by
                  Admin.
                </p>
                <button
                  aria-label="Publish Form"
                  disabled={submitting}
                  onClick={handleUpload}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 text-sm transition-colors"
                >
                  {submitting ? "Sharing..." : "Publish Form"}
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
          forms.map((f) => (
            <div
              key={f.id}
              className="p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-shadow group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center font-black">
                    📄
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 leading-tight">
                      {f.name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      By {f.userName}
                    </p>
                  </div>
                </div>
                <button
                  aria-label="Download form"
                  onClick={() => addToast("Starting download...")}
                  className="p-2 bg-slate-50 hover:bg-primary hover:text-white text-slate-600 rounded-xl transition-all"
                >
                  <Download size={18} />
                </button>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                    Purpose
                  </span>
                  <p className="text-xs text-slate-600 font-medium">
                    {f.purpose}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    Usage Guide
                  </span>
                  <p className="text-xs text-slate-600 font-medium">
                    {f.usage}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DirectorySection({ allUsers }: { allUsers: UserProfile[] }) {
  const [q, setQ] = useState("");
  const [distFilter, setDistFilter] = useState("");
  const [mandalFilter, setMandalFilter] = useState("");

  const districts = [
    ...new Set(allUsers.map((u) => u.district).filter(Boolean)),
  ].sort() as string[];
  const mandals = distFilter
    ? ([
        ...new Set(
          allUsers
            .filter((u) => u.district === distFilter)
            .map((u) => u.mandal)
            .filter(Boolean),
        ),
      ].sort() as string[])
    : [];

  const filtered = allUsers.filter((u) => {
    const term = q.toLowerCase();
    const matchesSearch =
      (u.name || "").toLowerCase().includes(term) ||
      (u.surname || "").toLowerCase().includes(term) ||
      (u.designation || "").toLowerCase().includes(term);

    const matchesDist = !distFilter || u.district === distFilter;
    const matchesMandal = !mandalFilter || u.mandal === mandalFilter;

    return matchesSearch && matchesDist && matchesMandal;
  });

  return (
    <div className="space-y-6">
      <div className="section-card card-blue !p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Users size={100} />
        </div>
        <h2 className="text-3xl font-black text-primary mb-2 flex items-center gap-3">
          👥 సభ్యుల డైరెక్టరీ{" "}
          <span className="text-slate-400 text-sm font-bold">
            (Member Directory)
          </span>
        </h2>
        <p className="text-sm font-bold text-slate-500">
          పంచాయతీ రాజ్ మరియు గ్రామీణాభివృద్ధి అధికారుల వివరాలు.
        </p>

        <div className="mt-8 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 flex items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/20 shadow-inner w-full">
            <Search size={20} className="text-slate-400" />
            <input
              type="text"
              placeholder="పేరు లేదా పోస్ట్ ద్వారా వెతకండి (Search by name or post...)"
              className="!bg-transparent !border-none !p-0 !m-0 focus:!ring-0 text-sm w-full font-bold text-primary placeholder:text-slate-400"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={distFilter}
              onChange={(e) => {
                setDistFilter(e.target.value);
                setMandalFilter("");
              }}
              className="bg-white px-4 py-3 rounded-2xl border border-slate-200 text-[11px] font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary/20 transition-all min-w-[140px]"
            >
              <option value="">అన్ని జిల్లాలు (All Districts)</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={mandalFilter}
              onChange={(e) => setMandalFilter(e.target.value)}
              disabled={!distFilter}
              className="bg-white px-4 py-3 rounded-2xl border border-slate-200 text-[11px] font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary/20 transition-all min-w-[140px] disabled:opacity-50"
            >
              <option value="">మండలం వారీగా (Mandal Wise)</option>
              {mandals.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map((u) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={u.id}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-primary/20 transition-all flex flex-col h-full"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-white shadow-md overflow-hidden shrink-0">
                  {u.photoURL ? (
                    <img
                      src={u.photoURL}
                      alt={u.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User size={30} className="m-auto mt-3 text-slate-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-primary text-base truncate leading-tight">
                    {u.name || u.surname
                      ? `${u.name || ""} ${u.surname || ""}`.trim()
                      : "Active Member"}
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {u.designation || "PR Officer"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                      Active Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <Building size={16} className="text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      Workplace
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">
                      {u.office ||
                        u.village ||
                        (u.mandal ? `${u.mandal} Office` : "General Office")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <Flag size={16} className="text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      Jurisdiction
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">
                      {u.mandal
                        ? `${u.mandal}, ${u.district}`
                        : u.district || "Undefined Area"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    Contact
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {u.mobile
                      ? `+91 ${u.mobile.substring(0, 5)}...`
                      : "Not Public"}
                  </span>
                </div>
                <button
                  aria-label="View Card"
                  onClick={() => {
                    Swal.fire({
                      title: `<div class="font-black text-primary p-2">${u.name || ""} ${u.surname || ""}</div>`,
                      html: `
                      <div class="text-left space-y-4 p-4">
                        <div class="grid grid-cols-2 gap-4 mt-6">
                          <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                             <span class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Mandal</span>
                             <span class="text-xs font-bold text-primary">${u.mandal || "N/A"}</span>
                          </div>
                          <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                             <span class="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Village</span>
                             <span class="text-xs font-bold text-primary">${u.village || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    `,
                      confirmButtonText: "Great!",
                      confirmButtonColor: "#0d3b66",
                      customClass: {
                        popup: "rounded-[32px] border-none",
                        confirmButton:
                          "rounded-2xl px-10 py-3 font-black uppercase text-xs",
                      },
                    });
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95"
                >
                  View Card
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-slate-300" />
            </div>
            <h3 className="font-black text-slate-400 uppercase tracking-widest">
              No Members Found
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}
function StatusCell({ status }: { status: string }) {
  if (status === "P-I")
    return (
      <span
        className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-200"
        title="Present (Intime: <= 9:00 AM)"
      >
        ✅ Attendance in time
      </span>
    );
  if (status === "P-L")
    return (
      <span
        className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black border border-orange-200"
        title="Present (Late: > 9:00 AM)"
      >
        ⚠️ Late Attendance
      </span>
    );
  if (status === "P")
    return (
      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-200">
        ✅ PRESENT
      </span>
    );
  if (status === "A")
    return (
      <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black border border-rose-200">
        ❌ ABSENT
      </span>
    );
  if (status === "M")
    return (
      <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-[10px] font-black border border-cyan-200">
        🤝 MEETING
      </span>
    );
  if (status === "T")
    return (
      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black border border-amber-200">
        🎓 TRAINING
      </span>
    );
  if (status === "L")
    return (
      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-black border border-slate-200">
        🏠 LEAVE
      </span>
    );
  return <span className="text-slate-300 font-bold">-</span>;
}

function MultiDayAnalyzer({
  addToast,
  user,
}: {
  addToast: (s: string) => void;
  user: any;
}) {
  const [aggregatedData, setAggregatedData] = useState<
    Map<
      string,
      {
        gp: string;
        mandal: string;
        district: string;
        division: string;
        mandalLgd: string;
        panchayatLgd: string;
        attendance: Record<string, string>;
        times: Record<string, string>;
        dsr: Record<string, boolean>;
      }
    >
  >(new Map());
  const [allDates, setAllDates] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mandalFilter, setMandalFilter] = useState("All");
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [parserDebug, setParserDebug] = useState<
    {
      file: string;
      sheet: string;
      date: string;
      gpColIdx: number;
      gpColName: string;
      statusColIdx: number;
      statusColName: string;
      rowsFound: number;
      datesFound: number;
    }[]
  >([]);
  const [showDebug, setShowDebug] = useState(false);
  const [expandedMandals, setExpandedMandals] = useState<Set<string>>(
    new Set(),
  );
  const [showStats, setShowStats] = useState(true);

  const toggleMandal = (m: string) => {
    const next = new Set(expandedMandals);
    if (next.has(m)) next.delete(m);
    else next.add(m);
    setExpandedMandals(next);
  };

  const toggleAllMandals = (expand: boolean) => {
    if (expand) {
      const mandals = Array.from(
        new Set(Array.from(aggregatedData.values()).map((v) => v.mandal)),
      );
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
        let sheetsToProcess: { sheetName: string; rows: any[][] }[] = [];

        try {
          let text = new window.TextDecoder("utf-8").decode(dataBuffer);
          let isHtml = false;

          if (
            !text.toLowerCase().includes("<tr") &&
            !text.toLowerCase().includes("<table")
          ) {
            const utf16Text = new window.TextDecoder("utf-16le").decode(
              dataBuffer,
            );
            if (
              utf16Text.toLowerCase().includes("<tr") ||
              utf16Text.toLowerCase().includes("<table")
            ) {
              text = utf16Text;
              isHtml = true;
            }
          } else {
            isHtml = true;
          }

          if (isHtml) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const trs = doc.querySelectorAll("tr");
            const rows = Array.from(trs).map((tr) =>
              Array.from(tr.querySelectorAll("th, td")).map((td) => {
                let val = td.textContent?.trim().replace(/\s+/g, " ") || "";
                if (
                  val.includes("</th>") ||
                  val.includes("</td>") ||
                  val.includes("<th") ||
                  val.includes("<td")
                ) {
                  // Clean up if tags leaked into textContent
                  val = val.replace(/<\/?[^>]+(>|$)/g, "").trim();
                }
                return val;
              }),
            );
            if (rows.length > 0) {
              // Check if it's a "one column" row that actually has tags in it (meaning querySelectorAll failed)
              const firstRow = rows[0];
              if (
                firstRow.length === 1 &&
                (firstRow[0].includes("<tr") || firstRow[0].includes("<td"))
              ) {
                // Simple regex fallback for badly malformed HTML
                const betterRows = text
                  .split(/<\/tr>/i)
                  .map((trStr) => {
                    return trStr
                      .split(/<\/td>|<\/th>/i)
                      .map((tdStr) => {
                        return tdStr.replace(/<\/?[^>]+(>|$)/g, "").trim();
                      })
                      .filter((c) => c !== "");
                  })
                  .filter((r) => r.length > 0);
                if (betterRows.length > 0) {
                  sheetsToProcess.push({
                    sheetName: "HTML_REGEX_" + file.name,
                    rows: betterRows,
                  });
                } else {
                  sheetsToProcess.push({
                    sheetName: "HTML_" + file.name,
                    rows,
                  });
                }
              } else {
                sheetsToProcess.push({ sheetName: "HTML_" + file.name, rows });
              }
            }
          } else {
            const workbook = XLSX.read(dataBuffer, { type: "array" });
            for (const sheetName of workbook.SheetNames) {
              const rows: any[][] = XLSX.utils.sheet_to_json(
                workbook.Sheets[sheetName],
                { header: 1, defval: "", raw: false },
              ) as any[][];
              if (rows.length > 0) sheetsToProcess.push({ sheetName, rows });
            }
          }
        } catch (e) {
          console.error("File parsing failed for", file.name, e);
          // Fallback to basic XLSX if something threw error
          if (sheetsToProcess.length === 0) {
            try {
              const workbook = XLSX.read(dataBuffer, { type: "array" });
              for (const sheetName of workbook.SheetNames) {
                const rows: any[][] = XLSX.utils.sheet_to_json(
                  workbook.Sheets[sheetName],
                  { header: 1, defval: "", raw: false },
                ) as any[][];
                if (rows.length > 0) sheetsToProcess.push({ sheetName, rows });
              }
            } catch (e2) {
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
          let gpCol = -1,
            mandalCol = -1,
            districtCol = -1,
            divisionCol = -1,
            mLgdCol = -1,
            pLgdCol = -1;
          let dataStartCol = -1;

          for (let r = 0; r < Math.min(rows.length, 50); r++) {
            const row = rows[r];
            if (!row || !Array.isArray(row)) continue;
            const rStr = row.map((c) =>
              String(c || "")
                .toLowerCase()
                .replace(/\s+/g, " "),
            );

            if (
              rStr.some(
                (c) =>
                  c.includes("panchayat") ||
                  c.includes("gp ") ||
                  c.includes("gram"),
              )
            ) {
              headerRowIdx = r;
              gpCol = rStr.findIndex(
                (c) =>
                  (c.includes("panchayat") ||
                    c.includes("gp ") ||
                    c.includes("gram")) &&
                  !c.includes("lgd"),
              );
              mandalCol = rStr.findIndex(
                (c) =>
                  (c.includes("mandal") || c.includes("block")) &&
                  !c.includes("lgd"),
              );
              districtCol = rStr.findIndex((c) => c.includes("district"));
              divisionCol = rStr.findIndex((c) => c.includes("division"));
              mLgdCol = rStr.findIndex((c) => c.includes("mandal lgd"));
              pLgdCol = rStr.findIndex((c) => c.includes("panchayat lgd"));

              if (gpCol === -1)
                gpCol = rStr.findIndex((c) => c.includes("name"));
              if (gpCol === -1) gpCol = 0; // Fallback to first column

              // Find first column likely to be attendance data
              dataStartCol =
                Math.max(
                  gpCol,
                  pLgdCol,
                  mLgdCol,
                  mandalCol,
                  districtCol,
                  divisionCol,
                ) + 1;
              break;
            }
          }

          const dbgIdx = debugLogs.length;
          debugLogs.push({
            file: file.name,
            sheet: sheetName,
            date: "N/A",
            gpColIdx: gpCol,
            gpColName:
              headerRowIdx >= 0
                ? String(rows[headerRowIdx]?.[gpCol] || "N/A")
                : "No Header",
            statusColIdx: -1,
            statusColName: "N/A",
            rowsFound: 0,
            datesFound: 0,
          });

          if (headerRowIdx === -1) {
            console.log("No header found in", file.name, sheetName);
            console.log("First few rows:", rows.slice(0, 10));
            continue;
          }

          console.log(
            `[${file.name}] Header Row at ${headerRowIdx}:`,
            rows[headerRowIdx],
          );
          console.log(`[${file.name}] Data Row 1:`, rows[headerRowIdx + 1]);
          let curDistrict = "Unknown",
            curDivision = "Unknown",
            curMandal = "Unknown",
            curMLgd = "-";
          let rowsAdded = 0;

          for (let r = headerRowIdx + 1; r < rows.length; r++) {
            const row = rows[r];
            if (!row || !Array.isArray(row)) continue;

            const gpNameRaw = String(row[gpCol] || "").trim();
            // Skip sub-headers or empty GP rows
            if (
              !gpNameRaw ||
              gpNameRaw.toLowerCase().includes("total") ||
              gpNameRaw.toLowerCase().includes("attendance")
            )
              continue;

            updatedRawRows.push([file.name, sheetName, ...row]);

            if (districtCol !== -1 && String(row[districtCol] || "").trim())
              curDistrict = String(row[districtCol]).trim();
            if (divisionCol !== -1 && String(row[divisionCol] || "").trim())
              curDivision = String(row[divisionCol]).trim();
            if (mandalCol !== -1 && String(row[mandalCol] || "").trim())
              curMandal = String(row[mandalCol]).trim();
            if (mLgdCol !== -1 && String(row[mLgdCol] || "").trim())
              curMLgd = String(row[mLgdCol]).trim();

            const pLgd =
              pLgdCol !== -1 ? String(row[pLgdCol] || "").trim() : "-";
            const key = `${curMandal.toUpperCase()}_${gpNameRaw.toUpperCase()}`;

            if (!newAggregated.has(key)) {
              newAggregated.set(key, {
                gp: gpNameRaw,
                mandal: curMandal,
                district: curDistrict,
                division: curDivision,
                mandalLgd: curMLgd,
                panchayatLgd: pLgd,
                attendance: {},
                times: {},
                dsr: {},
              });
            }
            const entry = newAggregated.get(key)!;

            // HORIZONTAL MULTI-DAY SCAN (Government Portal Format)
            const headers = rows[headerRowIdx] || [];
            for (let c = 0; c < row.length; c++) {
              if (
                c === gpCol ||
                c === mandalCol ||
                c === districtCol ||
                c === mLgdCol ||
                c === pLgdCol
              )
                continue;

              const val = String(row[c] || "").trim();
              const headerVal = String(headers[c] || "").trim();

              const dateRegex =
                /(\d{1,4}[-./ ]+\d{1,4}[-./ ]+\d{2,4}|\d{1,4}[-./ ]+[A-Za-z]{3,10}[-./ ]+\d{2,4})/i;

              const dateMatch = val.match(dateRegex);
              if (dateMatch && val.includes(":")) {
                const dateKey = dateMatch[0]
                  .replace(/\//g, "-")
                  .replace(/\./g, "-");
                datesFound.add(dateKey);

                if (!entry.times[dateKey]) {
                  entry.times[dateKey] = val;
                }

                // Status is usually the column immediately to the left of the time column
                if (c > 0 && !entry.attendance[dateKey]) {
                  const statusVal = String(row[c - 1] || "").trim();
                  if (
                    statusVal &&
                    statusVal.length < 50 &&
                    !statusVal.includes(":") &&
                    !statusVal.includes("202")
                  ) {
                    entry.attendance[dateKey] = statusVal;
                  }
                }
              } else if (val && !val.includes(":") && !val.includes("202")) {
                // Check if current or previous column header has a date (Alternative horizontal format)
                const hMatch = headerVal.match(dateRegex);
                if (hMatch) {
                  const dKey = hMatch[0]
                    .replace(/\//g, "-")
                    .replace(/\./g, "-");
                  datesFound.add(dKey);
                  entry.attendance[dKey] = val;
                }
                if (c > 0) {
                  const prevHMatch = String(headers[c - 1] || "").match(
                    dateRegex,
                  );
                  if (prevHMatch) {
                    const dKey = prevHMatch[0]
                      .replace(/\//g, "-")
                      .replace(/\./g, "-");
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
    XLSX.writeFile(
      wb,
      `MultiDay_Combined_Raw_${new Date().toLocaleDateString()}.xlsx`,
    );
    addToast("మొత్తం కలిపిన Raw డేటా డౌన్లోడ్ అవుతోంది...");
  };

  const downloadRawPdf = async () => {
    await loadHeavyModules();
    if (rawRows.length === 0) return;
    const doc = new jsPDF("l", "mm", "a4");
    autoTable(doc, {
      body: rawRows.slice(0, 500), // Limit for PDF safety
      styles: { fontSize: 5 },
      margin: { top: 10 },
    });
    doc.save(`MultiDay_Combined_Raw_${new Date().toLocaleDateString()}.pdf`);
  };

  const downloadMandalSummary = async () => {
    await loadHeavyModules();
    if (aggregatedData.size === 0) return;
    const mandalSummary = new Map<string, { total: number; present: number }>();
    filteredData.forEach((info) => {
      const m = info.mandal;
      if (!mandalSummary.has(m)) mandalSummary.set(m, { total: 0, present: 0 });
      const s = mandalSummary.get(m)!;
      allDates.forEach((d) => {
        s.total++;
        const attStr = String(info.attendance[d] || "").toLowerCase();
        if (
          attStr.startsWith("p") ||
          attStr.includes("ప్రెసెంట్") ||
          attStr.includes("హాజరు")
        )
          s.present++;
      });
    });
    const exportData = Array.from(mandalSummary.entries()).map(([m, s]) => ({
      Mandal: m,
      "Total Checks": s.total,
      "Present Count": s.present,
      "Avg Attendance %":
        s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mandal Summary");
    XLSX.writeFile(
      wb,
      `MultiDay_Mandal_Summary_${new Date().toLocaleDateString()}.xlsx`,
    );
    addToast("మండల్ అటెండెన్స్ సమ్మరీ డౌన్లోడ్ అవుతోంది...");
  };

  const downloadGPSummary = async () => {
    await loadHeavyModules();
    if (aggregatedData.size === 0) return;
    const aoa: any[][] = [];

    // Row 1
    const row1 = ["Telangana State"];
    for (let i = 0; i < allDates.length * 2 + 3; i++) row1.push("");
    aoa.push(row1);

    // Row 2
    const reportDate = allDates[0]
      ? new Date(allDates[0].split("-").reverse().join("-")).toLocaleDateString(
          "en-GB",
          { day: "2-digit", month: "short", year: "numeric" },
        )
      : "";
    const row2 = [`Report On Attendance Status & DSR Raw Data ${reportDate}`];
    for (let i = 0; i < allDates.length * 2 + 3; i++) row2.push("");
    aoa.push(row2);

    // Row 3 (Status heading)
    const row3 = ["", "", "", ""];
    row3.push("Attendace Status");
    for (let i = 0; i < allDates.length * 2 - 1; i++) row3.push("");
    aoa.push(row3);

    // Row 4 (Headers)
    const row4 = ["S.No", "District Name", "Mandal Name", "Panchayat Name"];
    allDates.forEach((d) => {
      row4.push(`First Attendance Status (${d})`);
    });
    aoa.push(row4);

    // Data rows
    filteredData.forEach((info, idx) => {
      const row = [idx + 1, info.district, info.mandal, info.gp];
      allDates.forEach((d) => {
        const s = info.attendance[d] || "-";
        row.push(s);
      });
      aoa.push(row);
    });

    // Summary Rows
    const statuses = [
      {
        label: "Total Present",
        matches: (s: string) =>
          s.startsWith("p") ||
          s.includes("ప్రెసెంట్") ||
          s.includes("హాజరు") ||
          s.includes("✅"),
      },
      {
        label: "Total Absent",
        matches: (s: string) =>
          s.startsWith("a") || s.includes("గైర్హాజరు") || s.includes("absent"),
      },
      {
        label: "Total Leave",
        matches: (s: string) =>
          s.startsWith("l") || s.includes("సెలవు") || s.includes("leave"),
      },
      {
        label: "Total Meeting",
        matches: (s: string) =>
          s.startsWith("m") || s.includes("సమావేశం") || s.includes("meeting"),
      },
      {
        label: "Total Training",
        matches: (s: string) =>
          s.startsWith("t") || s.includes("శిక్షణ") || s.includes("training"),
      },
    ];

    statuses.forEach((st) => {
      const row: (string | number)[] = ["", "", "", st.label];
      allDates.forEach((d) => {
        let count = 0;
        filteredData.forEach((info) => {
          const s = String(info.attendance[d] || "").toLowerCase();
          if (st.matches(s)) count++;
        });
        row.push(count);
      });
      aoa.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Merge cells for headers
    const totalCols = allDates.length + 4;
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // Telangana State
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }, // Report Title
      { s: { r: 2, c: 4 }, e: { r: 2, c: totalCols - 1 } }, // Attendace Status
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GP Comparative");
    XLSX.writeFile(
      wb,
      `MultiDay_GP_Comparative_${new Date().toLocaleDateString()}.xlsx`,
    );
    addToast("GP వైజ్ కంపారిటివ్ రిపోర్ట్ డౌన్లోడ్ అవుతోంది...");
  };

  const downloadMultiPdf = async () => {
    await loadHeavyModules();
    if (aggregatedData.size === 0) return;
    const doc = new jsPDF("l", "mm", "a4");
    const head = [
      [
        "S.No",
        "District",
        "Mandal",
        "Panchayat Name",
        ...allDates.map((d) => `Attendance\n${d}`),
      ],
    ];
    const body = filteredData.map((info, idx) => [
      idx + 1,
      info.district,
      info.mandal,
      info.gp,
      ...allDates.map((d) => info.attendance[d] || "-"),
    ]);
    autoTable(doc, {
      head: head,
      body: body,
      styles: { fontSize: 5 },
      theme: "grid",
    });
    doc.save(`MultiDay_Comparative_${new Date().toLocaleDateString()}.pdf`);
  };

  const mandals = Array.from(
    new Set(Array.from(aggregatedData.values()).map((info) => info.mandal)),
  ).sort();
  const filteredData = Array.from(aggregatedData.values())
    .filter((info) => {
      const target =
        `${info.gp} ${info.mandal} ${info.district} ${info.division}`.toUpperCase();
      const matchesSearch = target.includes(searchTerm.toUpperCase());
      const matchesMandal =
        mandalFilter === "All" || info.mandal === mandalFilter;
      return matchesSearch && matchesMandal;
    })
    .sort((a, b) => {
      const mIdA = (a.mandal || "").toUpperCase();
      const mIdB = (b.mandal || "").toUpperCase();
      if (mIdA !== mIdB) return mIdA.localeCompare(mIdB);
      return (a.gp || "")
        .toUpperCase()
        .localeCompare((b.gp || "").toUpperCase());
    });

  const totalGPCount = filteredData.length;
  const groupedByMandal: Record<string, typeof filteredData> = {};
  filteredData.forEach((item) => {
    const mKey = (item.mandal || "UNKNOWN").toUpperCase();
    if (!groupedByMandal[mKey]) groupedByMandal[mKey] = [];
    groupedByMandal[mKey].push(item);
  });
  const mandalList = Object.keys(groupedByMandal).sort();

  const gpIndexMap = new Map<string, number>();
  filteredData.forEach((item, idx) => {
    gpIndexMap.set(
      `${(item.mandal || "").toUpperCase()}_${(item.gp || "").toUpperCase()}`,
      idx + 1,
    );
  });

  const sortedDates = [...allDates].sort((a, b) => {
    const parse = (s: string) => {
      const parts = s.split("-");
      if (parts.length === 3)
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
      return 0;
    };
    return parse(a) - parse(b);
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-dashed border-slate-200 text-center">
        <h3 className="font-black text-primary uppercase text-sm tracking-widest mb-4">
          Multi-Day Comparative Hub
        </h3>
        <input
          type="file"
          multiple
          onChange={onUpload}
          className="hidden"
          id="multi-up"
        />
        <label
          htmlFor="multi-up"
          className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase cursor-pointer hover:scale-105 transition-transform inline-flex items-center gap-2"
        >
          {isAnalyzing ? (
            <RefreshCw className="animate-spin" size={14} />
          ) : (
            <Upload size={14} />
          )}{" "}
          {aggregatedData.size > 0
            ? "Upload More Reports"
            : "Upload Multiple Daily Reports"}
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
          <div className="text-white font-bold mb-2 uppercase tracking-widest text-xs">
            Parser Analysis History
          </div>
          {parserDebug.map((d, i) => (
            <div key={i} className="border-b border-white/5 pb-2">
              <span className="text-blue-400 font-bold">
                [{d.file} / {d.sheet}]
              </span>
              <br />
              Header Row: {d.gpColName !== "No Header" ? "Found" : "Missing"} |
              GP Col Name: {d.gpColName} | GPs Parsed: {d.rowsFound}
              <br />
              <span
                className={
                  d.datesFound > 0 ? "text-emerald-400" : "text-rose-400"
                }
              >
                Report Dates Found: {d.datesFound}
              </span>
            </div>
          ))}
        </div>
      )}

      {aggregatedData.size > 0 && allDates.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <h4 className="font-black text-xl mb-2">No Dates Detected</h4>
          <p className="text-sm">
            We successfully found the Gram Panchayats in your report, but we
            could not find any attendance dates. Please ensure the columns
            contain dates in standard format (e.g., DD/MM/YYYY, DD-MMM-YYYY).
            Check the debug panel for more info.
          </p>
        </div>
      )}

      {aggregatedData.size > 0 &&
        allDates.length > 0 &&
        (!user || user.isAnonymous) && (
          <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl flex flex-col items-center justify-center text-center">
            <Lock className="w-16 h-16 text-slate-400 mb-4" />
            <h4 className="font-black text-2xl text-slate-800 mb-2">
              Full Access Required
            </h4>
            <p className="text-slate-500 max-w-md">
              The file has been uploaded and processed successfully. Please log
              in to view the detailed table, analysis, and download the
              PDF/Excel reports.
            </p>
          </div>
        )}

      {aggregatedData.size > 0 &&
        allDates.length > 0 &&
        user &&
        !user.isAnonymous && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end px-2">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block ml-1 tracking-widest">
                  Global Search
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    className="w-full bg-white border pl-10 p-3 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all border-slate-300"
                    placeholder="Search District, Mandal, GP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block ml-1 tracking-widest">
                  Filter by Mandal
                </label>
                <select
                  className="w-full bg-white border p-3 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all border-slate-300"
                  value={mandalFilter}
                  onChange={(e) => setMandalFilter(e.target.value)}
                >
                  <option value="All">All Mandals</option>
                  {mandals.map((m, idx) => (
                    <option key={`${m}_${idx}`} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  aria-label="Expand All Mandals"
                  onClick={() => toggleAllMandals(true)}
                  className="bg-primary/10 text-primary px-4 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-primary/20 transition-colors border border-primary/20"
                >
                  Expand All
                </button>
                <button
                  aria-label="Collapse All Mandals"
                  onClick={() => toggleAllMandals(false)}
                  className="bg-slate-100 text-slate-600 px-4 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  Collapse All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-[24px] border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1">
                    Gram Panchayats
                  </div>
                  <div className="text-2xl font-black text-slate-800">
                    {totalGPCount}
                  </div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-[24px] border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1">
                    Report Dates
                  </div>
                  <div className="text-2xl font-black text-slate-800">
                    {sortedDates.length}
                  </div>
                </div>
              </div>
              <div className="col-span-2 flex gap-3">
                <button
                  aria-label="Download Mandal Summary"
                  onClick={downloadMandalSummary}
                  className="flex-1 bg-white border border-slate-100 p-5 rounded-[24px] text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1">
                    <BarChart3 size={18} />
                  </div>
                  Mandal Summary (XL)
                </button>
                <button
                  aria-label="Download GP Comparative"
                  onClick={downloadGPSummary}
                  className="flex-1 bg-white border border-slate-100 p-5 rounded-[24px] text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1">
                    <Database size={18} />
                  </div>
                  GP Comparative (XL)
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-[24px] shadow-2xl overflow-hidden border-slate-100 ring-1 ring-slate-900/5">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-indigo-600 text-white font-bold text-xs text-left">
                      <th className="p-3 border border-indigo-700 w-12 text-sm text-center">
                        S.No
                      </th>
                      <th className="p-3 border border-indigo-700 text-sm min-w-[120px]">
                        District Name
                      </th>
                      <th className="p-3 border border-indigo-700 min-w-[120px] text-sm">
                        Mandal Name
                      </th>
                      <th className="p-3 border border-indigo-700 min-w-[150px] text-sm">
                        Panchayat Name
                      </th>
                      {sortedDates.map((d) => (
                        <th
                          key={d}
                          className="p-3 border border-indigo-700 min-w-[120px] text-center text-sm"
                        >
                          Attendance ({d})
                        </th>
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
                              {isEx ? (
                                <ChevronDown size={16} className="mx-auto" />
                              ) : (
                                <ChevronRight size={16} className="mx-auto" />
                              )}
                            </td>
                            <td
                              colSpan={sortedDates.length + 3}
                              className="p-3 border border-slate-200 font-black text-slate-700 uppercase text-xs flex items-center gap-3"
                            >
                              <span>{mName}</span>
                              <span className="text-[10px] bg-white text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 shadow-sm">
                                {items.length} GPs
                              </span>
                            </td>
                          </tr>
                          {isEx &&
                            items.map((info) => (
                              <tr
                                key={`${(info.mandal || "").toUpperCase()}_${(info.gp || "").toUpperCase()}`}
                                className="hover:bg-indigo-50/50 text-slate-700 border-b border-slate-100 group transition-colors"
                              >
                                <td className="p-3 border border-slate-200 text-center font-medium bg-slate-50 text-slate-400 group-hover:text-indigo-600 text-xs">
                                  {gpIndexMap.get(
                                    `${(info.mandal || "").toUpperCase()}_${(info.gp || "").toUpperCase()}`,
                                  )}
                                </td>
                                <td className="p-3 border border-slate-200 uppercase text-xs font-bold text-slate-500">
                                  {info.district}
                                </td>
                                <td className="p-3 border border-slate-200 uppercase bg-slate-50/50 text-xs font-black text-slate-600">
                                  {info.mandal}
                                </td>
                                <td className="p-3 border border-slate-200 font-black text-slate-800 bg-white text-sm">
                                  {info.gp}
                                </td>
                                {sortedDates.map((d) => {
                                  const status = info.attendance[d] || "-";
                                  const time = info.times[d] || "-";
                                  const statusLower = status.toLowerCase();
                                  let color = "text-slate-400";
                                  if (
                                    statusLower.includes("present") ||
                                    statusLower === "p"
                                  )
                                    color = "text-emerald-700 font-bold";
                                  else if (
                                    statusLower.includes("absent") ||
                                    statusLower === "a"
                                  )
                                    color = "text-rose-700 font-bold";
                                  else if (statusLower.includes("leave"))
                                    color = "text-amber-700 font-bold";
                                  else if (statusLower !== "-")
                                    color = "text-blue-700 font-bold";

                                  return (
                                    <td
                                      key={d}
                                      className={`p-3 border border-slate-200 text-center whitespace-nowrap text-xs font-black ${color}`}
                                    >
                                      {status === "-"
                                        ? "-"
                                        : status.length > 15
                                          ? status.substring(0, 15) + "..."
                                          : status}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-sm">
                    {[
                      {
                        label: "Total Present",
                        color: "text-emerald-700",
                        matches: (s: string) =>
                          s.startsWith("p") ||
                          s.includes("ప్రెసెంట్") ||
                          s.includes("హాజరు") ||
                          s.includes("✅"),
                      },
                      {
                        label: "Total Absent",
                        color: "text-rose-700",
                        matches: (s: string) =>
                          s.startsWith("a") ||
                          s.includes("గైర్హాజరు") ||
                          s.includes("absent"),
                      },
                      {
                        label: "Total Leave",
                        color: "text-amber-700",
                        matches: (s: string) =>
                          s.startsWith("l") ||
                          s.includes("సెలవు") ||
                          s.includes("leave"),
                      },
                      {
                        label: "Total Meeting",
                        color: "text-cyan-700",
                        matches: (s: string) =>
                          s.startsWith("m") ||
                          s.includes("సమావేశం") ||
                          s.includes("meeting"),
                      },
                      {
                        label: "Total Training",
                        color: "text-amber-700",
                        matches: (s: string) =>
                          s.startsWith("t") ||
                          s.includes("శిక్షణ") ||
                          s.includes("training"),
                      },
                    ].map((st, idx) => (
                      <tr key={idx}>
                        <td
                          colSpan={4}
                          className="p-3 border border-black text-right uppercase text-[#004085]"
                        >
                          {st.label}
                        </td>
                        {sortedDates.map((d) => {
                          let count = 0;
                          filteredData.forEach((info) => {
                            const s = String(
                              info.attendance[d] || "",
                            ).toLowerCase();
                            if (st.matches(s)) count++;
                          });
                          return (
                            <td
                              key={d}
                              className={`p-3 border border-black text-center ${st.color} w-[10px] h-[31.33px] text-base font-black`}
                            >
                              {count}
                            </td>
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
        {["DSR Workflow", "EPFO Registration", "Aadhar Seeding Guide"].map(
          (guide) => (
            <div
              key={guide}
              className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-100"
            >
              <span className="font-bold text-sm">📖 {guide}</span>
              <Play size={16} className="text-primary" />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function ToolCard({
  icon: Icon,
  emoji,
  title,
  onClick,
}: {
  icon?: any;
  emoji?: string;
  title: string;
  onClick: () => void;
}) {
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

function DSRAnalyzer({
  addToast,
  user,
}: {
  addToast: (s: string) => void;
  user: FirebaseUser | null;
}) {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [rawJson, setRawJson] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    dsr: 0,
    pending: 0,
    meeting: 0,
    training: 0,
    leave: 0,
    before901: 0,
    after900: 0,
  });
  const [mandalSummaries, setMandalSummaries] = useState<Record<string, any>>(
    {},
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString(),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const onUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress(10);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setUploadProgress(30);
        await loadHeavyModules();
        setUploadProgress(50);
        const dataBuffer = evt.target?.result as ArrayBuffer;
        let allRows: any[][] = [];

        try {
          const text = new window.TextDecoder("utf-8").decode(dataBuffer);
          if (
            text.includes("<html") ||
            text.includes("<table") ||
            text.includes("<style")
          ) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const trs = doc.querySelectorAll("tr");
            if (trs.length > 0) {
              allRows = Array.from(trs).map((tr) =>
                Array.from(tr.querySelectorAll("td, th")).map(
                  (td) => td.textContent?.trim().replace(/\s+/g, " ") || "",
                ),
              );
            }
          }
        } catch (e) {
          console.error("HTML fallback failed", e);
        }

        if (allRows.length === 0) {
          try {
            // Attempt standard Excel parsing
            const workbook = XLSX.read(dataBuffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            allRows = XLSX.utils.sheet_to_json(sheet, {
              header: 1,
              defval: "",
            });
          } catch (e) {
            console.error("XLSX parsing failed", e);
          }
        }

        if (allRows.length === 0) {
          setIsProcessing(false);
          setUploadProgress(0);
          addToast("క్షమించండి! ఫైల్ ఖాళీగా ఉంది లేదా చదవడం కుదరలేదు.");
          return;
        }
        setUploadProgress(70);

        setRawJson(allRows);

        // 1. ROBUST HEADER DETECTION
        let bestHeaderIdx = -1;
        let maxScore = 0;
        const mandalKeys = ["mandal", "block", "tehsil"];
        const gpKeys = [
          "panchayat",
          "gp name",
          "gram",
          "habitation",
          "village name",
        ];

        for (let i = 0; i < Math.min(allRows.length, 100); i++) {
          const rowStrings = (allRows[i] || []).map((c) =>
            String(c || "")
              .toLowerCase()
              .trim(),
          );
          let score = 0;
          if (rowStrings.some((s) => mandalKeys.some((k) => s.includes(k))))
            score += 3;
          if (rowStrings.some((s) => gpKeys.some((k) => s.includes(k))))
            score += 3;
          if (
            rowStrings.some(
              (s) => s.includes("attendance") || s.includes("status"),
            )
          )
            score += 1;

          if (score > maxScore) {
            maxScore = score;
            bestHeaderIdx = i;
          }
        }

        // Check if user's hint for row 4 (idx 3) should be used
        if (maxScore < 4 && allRows.length > 3) {
          const row4 =
            allRows[3]?.map((c) => String(c || "").toLowerCase()) || [];
          if (
            row4.some((s) => s.includes("mandal")) ||
            row4.some((s) => s.includes("panchayat"))
          )
            bestHeaderIdx = 3;
        }

        if (bestHeaderIdx === -1) {
          setIsProcessing(false);
          setUploadProgress(0);
          addToast(
            "క్షమించండి! మీ ఫైల్‌లో 'Mandal Name' మరియు 'Panchayat Name' కాలమ్స్ దొరకలేదు.",
          );
          return;
        }

        // Normalize Headers (check current and next row for merged headers)
        let headers = allRows[bestHeaderIdx].map((h) =>
          String(h || "")
            .toLowerCase()
            .trim(),
        );
        if (bestHeaderIdx + 1 < allRows.length) {
          const nextRow = allRows[bestHeaderIdx + 1].map((h) =>
            String(h || "")
              .toLowerCase()
              .trim(),
          );
          nextRow.forEach((val, idx) => {
            if (val && val.length > (headers[idx]?.length || 0))
              headers[idx] = val;
          });
        }

        const getIdx = (keys: string[]) =>
          headers.findIndex((h) => keys.some((k) => h.includes(k)));

        const mandalIdx = getIdx(mandalKeys);
        const gpIdx = getIdx(gpKeys);
        const attStatusIdx = getIdx([
          "first attendence status",
          "1st attend status",
          "attendance status",
        ]);
        const attTimeIdx = getIdx([
          "first attendence datetime",
          "1st attend time",
          "attendance time",
        ]);
        const dsrStatusIdx = getIdx([
          "dsr entry status",
          "dsr status",
          "dsr entry",
        ]);
        const dsrTimeIdx = getIdx([
          "dsr submited",
          "dsr submitted",
          "dsr time",
        ]);

        // Final dynamic fallbacks based on common layout
        const finalMandalIdx = mandalIdx !== -1 ? mandalIdx : 3;
        const finalGpIdx = gpIdx !== -1 ? gpIdx : 5;

        const processed: any[] = [];
        let present = 0,
          dsr = 0,
          pending = 0,
          meeting = 0,
          training = 0,
          leave = 0,
          before901 = 0,
          after900 = 0;
        const mandalStats = new Map<
          string,
          {
            total: number;
            onTime: number;
            late: number;
            pending: number;
            meeting: number;
            training: number;
            leave: number;
            dsrPending: number;
          }
        >();

        allRows.slice(bestHeaderIdx + 1).forEach((r) => {
          const gpRaw = String(r[finalGpIdx] || "").trim();
          const mandalRaw = String(r[finalMandalIdx] || "UNKNOWN")
            .trim()
            .toUpperCase();

          if (
            !gpRaw ||
            gpRaw.length < 2 ||
            gpRaw.toLowerCase().includes("total") ||
            /^\d+$/.test(gpRaw)
          )
            return;
          if (gpRaw.toLowerCase() === "panchayat name") return;

          const attStatusRaw = String(r[attStatusIdx] || "").toLowerCase();
          const dsrStatusRaw = String(r[dsrStatusIdx] || "").toLowerCase();
          const dsrTimeStr = String(r[dsrTimeIdx] || "");

          const isP =
            attStatusRaw.includes("present") ||
            attStatusRaw.startsWith("p") ||
            attStatusRaw.includes("✅") ||
            attStatusRaw.includes("ప్రెసెంట్") ||
            attStatusRaw.includes("హాజరు");
          const isM =
            attStatusRaw.includes("meeting") ||
            attStatusRaw.startsWith("m") ||
            attStatusRaw.includes("సమావేశం");
          const isT =
            attStatusRaw.includes("training") ||
            attStatusRaw.startsWith("t") ||
            attStatusRaw.includes("శిక్షణ");
          const isL =
            attStatusRaw.includes("leave") ||
            attStatusRaw.startsWith("l") ||
            attStatusRaw.includes("సెలవు");
          const isD =
            (dsrStatusRaw.includes("entered") &&
              !dsrStatusRaw.includes("not")) ||
            dsrStatusRaw.includes("yes") ||
            dsrStatusRaw.includes("✅") ||
            dsrStatusRaw.includes("uploaded") ||
            (dsrTimeStr && dsrTimeStr.length > 3 && dsrTimeStr.includes(":"));
          const attTimeStr = String(r[attTimeIdx] || "");

          // Time Check (10:30 AM)
          let isOnTime = false;
          let isLate = false;
          if (isD && dsrTimeStr) {
            const timeMatch = dsrTimeStr.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              let hour = parseInt(timeMatch[1]);
              const min = parseInt(timeMatch[2]);
              const isPM = dsrTimeStr.toLowerCase().includes("pm");
              if (isPM && hour < 12) hour += 12;
              if (!isPM && hour === 12) hour = 0;

              const totalMinutes = hour * 60 + min;
              if (totalMinutes <= 10 * 60 + 30) isOnTime = true;
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
              const isPM = attTimeStr.toLowerCase().includes("pm");
              if (isPM && hour < 12) hour += 12;
              if (!isPM && hour === 12) hour = 0;

              const totalMinutes = hour * 60 + min;
              if (totalMinutes <= 9 * 60) isAttBefore901 = true;
              if (totalMinutes > 9 * 60) isAttAfter900 = true;
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

          // Count DSR vs Pending
          if (isD) dsr++;
          else if (!isM && !isT && !isL) pending++;

          // Aggregate Mandal Stats
          const currentM = mandalStats.get(mandalRaw) || {
            total: 0,
            onTime: 0,
            late: 0,
            pending: 0,
            meeting: 0,
            training: 0,
            leave: 0,
            dsrPending: 0,
          };
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
            attStatus:
              r[attStatusIdx] ||
              (isP
                ? "Present"
                : isM
                  ? "Meeting"
                  : isT
                    ? "Training"
                    : isL
                      ? "Leave"
                      : "Absent"),
            attTime: r[attTimeIdx] || "-",
            dsrStatus:
              r[dsrStatusIdx] ||
              (isD
                ? isOnTime
                  ? "Attendance in time"
                  : "Late Attendance"
                : isM
                  ? "Meeting"
                  : isT
                    ? "Training"
                    : isL
                      ? "Leave"
                      : "Pending"),
            dsrTime: dsrTimeStr || "-",
            isPresent: isP,
            isMeeting: isM,
            isTraining: isT,
            isLeave: isL,
            isEntered: isD,
            isOnTime,
            isLate,
            isAttBefore901,
            isAttAfter900,
          });
        });

        if (processed.length === 0) {
          setIsProcessing(false);
          setUploadProgress(0);
          addToast(
            "ప్రాసెస్ చేయబడింది, కానీ డేటా ఏమీ దొరకలేదు. ఫైల్ ఫార్మార్ట్ ఒకసారి చూడండి.",
          );
          return;
        }

        setData(processed);
        setFilteredData(processed);
        setStats({
          total: processed.length,
          present,
          dsr,
          pending,
          meeting,
          training,
          leave,
          before901,
          after900,
        });
        // @ts-ignore
        setMandalSummaries(Object.fromEntries(mandalStats));
        setLastUpdateTime(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
        setUploadProgress(100);
        setTimeout(() => {
          setIsProcessing(false);
          setUploadProgress(0);
        }, 500);
        addToast(
          `విజయవంతంగా ప్రాసెస్ చేయబడింది! ${processed.length} గ్రామ పంచాయతీలు దొరికాయి. 🚀`,
        );
      } catch (err) {
        console.error("DSR Processing Error:", err);
        setIsProcessing(false);
        setUploadProgress(0);
        addToast(
          "ఫైల్ ప్రాసెస్ చేయడంలో లోపం సంభవించింది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
        );
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setUploadProgress(0);
      addToast("ఫైల్ చదవడంలో లోపం సంభవించింది.");
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadMandalReport = async () => {
    await loadHeavyModules();
    if (Object.keys(mandalSummaries).length === 0) return;

    const exportData = Object.entries(mandalSummaries).map(
      ([mandal, s]: [string, any]) => ({
        "Mandal Name": mandal,
        "Total GPs": s.total,
        "On Time (10:30 AM)": s.onTime,
        Meeting: s.meeting,
        Training: s.training,
        Leave: s.leave,
        "Late Submission": s.late,
        Pending: s.pending,
        "Success Rate (%)": Math.round(
          ((s.onTime + s.meeting + s.training + s.leave) / s.total) * 100,
        ),
      }),
    );

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mandal Summary");
    XLSX.writeFile(
      wb,
      `Mandal_Summary_Report_${new Date().toLocaleDateString()}.xlsx`,
    );
    addToast("మండల్ సమ్మరీ రిపోర్ట్ డౌన్లోడ్ అవుతోంది...");
  };

  const downloadFullReport = async () => {
    await loadHeavyModules();
    if (data.length === 0) return;

    const exportData = data.map((r) => ({
      Mandal: r.mandal,
      "GP Name": r.gp,
      "Attendance Status": r.attStatus,
      "Attendance Time": r.attTime,
      "DSR Status": r.isMeeting
        ? "Meeting"
        : r.isTraining
          ? "Training"
          : r.isLeave
            ? "Leave"
            : r.isOnTime
              ? "Attendance in time"
              : r.isLate
                ? "Late Attendance"
                : "Pending",
      "DSR Time": r.dsrTime,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GP Details");
    XLSX.writeFile(
      wb,
      `Full_Attendance_Report_${new Date().toLocaleDateString()}.xlsx`,
    );
    addToast("పూర్తి రిపోర్ట్ డౌన్లోడ్ అవుతోంది...");
  };

  const downloadRawExcel = async () => {
    await loadHeavyModules();
    if (rawJson.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet(rawJson);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Raw Data");
    XLSX.writeFile(
      wb,
      `Original_Raw_File_${new Date().toLocaleDateString()}.xlsx`,
    );
    addToast("ఒరిజినల్ Raw ఫైల్ (Excel) డౌన్లోడ్ అవుతోంది...");
  };

  const downloadRawPdf = async () => {
    await loadHeavyModules();
    if (rawJson.length === 0) return;
    const doc = new jsPDF("l", "mm", "a4");

    // Simple logic to find header if it exists
    let headerIdx = 0;
    for (let i = 0; i < Math.min(rawJson.length, 10); i++) {
      if (
        rawJson[i].some(
          (c: any) =>
            String(c).toLowerCase().includes("mandal") ||
            String(c).toLowerCase().includes("panchayat"),
        )
      ) {
        headerIdx = i;
        break;
      }
    }

    const body = rawJson.slice(headerIdx);

    autoTable(doc, {
      body: body,
      styles: { fontSize: 7, font: "helvetica" },
      margin: { top: 10 },
    });

    doc.save(`Original_Raw_File_${new Date().toLocaleDateString()}.pdf`);
    addToast("ఒరిజినల్ Raw ఫైల్ (PDF) డౌన్లోడ్ అవుతోంది...");
  };

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    let filtered = data.filter(
      (r) =>
        String(r.gp || "")
          .toLowerCase()
          .includes(term) ||
        String(r.mandal || "")
          .toLowerCase()
          .includes(term),
    );

    if (activeFilter === "P") filtered = filtered.filter((r) => r.isPresent);
    else if (activeFilter === "D")
      filtered = filtered.filter((r) => r.isEntered);
    else if (activeFilter === "M")
      filtered = filtered.filter((r) => r.isMeeting);
    else if (activeFilter === "T")
      filtered = filtered.filter((r) => r.isTraining);
    else if (activeFilter === "L") filtered = filtered.filter((r) => r.isLeave);
    else if (activeFilter === "B9")
      filtered = filtered.filter((r) => r.isAttBefore901);
    else if (activeFilter === "A9")
      filtered = filtered.filter((r) => r.isAttAfter900);
    else if (activeFilter === "NE")
      filtered = filtered.filter(
        (r) => !r.isEntered && !r.isMeeting && !r.isTraining && !r.isLeave,
      );

    setFilteredData(filtered);
  }, [searchTerm, activeFilter, data]);

  return (
    <div className="space-y-6">
      <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] text-center relative overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
            <div className="w-64">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                  Processing DSR...
                </span>
                <span className="text-[10px] font-black text-primary">
                  {uploadProgress}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          </div>
        )}
        <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-4">
          DSR Analytical Engine
        </h4>
        <input
          type="file"
          onChange={onUpload}
          className="hidden"
          id="dsr-up"
          disabled={isProcessing}
        />
        <label
          htmlFor="dsr-up"
          className={`bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl transition-all inline-block text-xs uppercase tracking-widest ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90 active:scale-95"}`}
        >
          {isProcessing ? "Processing..." : "Select DSR File"}
        </label>
      </div>

      {data.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            <button
              aria-label="Filter Total"
              onClick={() => setActiveFilter(null)}
              className="text-left w-full"
            >
              <StatCard label="TOTAL" val={stats.total} color="blue" />
            </button>
            <button
              aria-label="Filter Present"
              onClick={() => setActiveFilter("P")}
              className={`text-left w-full transition-transform active:scale-95 ${activeFilter === "P" ? "ring-2 ring-emerald-500 ring-offset-2 rounded-2xl" : ""}`}
            >
              <StatCard label="PRESENT" val={stats.present} color="emerald" />
            </button>
            <button
              title="ఉదయం 9:00 కంటే ముందు విధులకు హాజరైన వారి (Present) సంఖ్య."
              onClick={() => setActiveFilter("B9")}
              className={`text-left w-full transition-transform active:scale-95 ${activeFilter === "B9" ? "ring-2 ring-indigo-500 ring-offset-2 rounded-2xl" : ""}`}
            >
              <StatCard label="ON TIME" val={stats.before901} color="indigo" />
            </button>
            <button
              title="ఉదయం 9:01 తర్వాత విధులకు హాజరైన వారి (Present) సంఖ్య."
              onClick={() => setActiveFilter("A9")}
              className={`text-left w-full transition-transform active:scale-95 ${activeFilter === "A9" ? "ring-2 ring-rose-500 ring-offset-2 rounded-2xl" : ""}`}
            >
              <StatCard label="LATE ATT" val={stats.after900} color="rose" />
            </button>
            <button
              aria-label="Filter DSR"
              onClick={() => setActiveFilter("D")}
              className={`text-left w-full transition-transform active:scale-95 ${activeFilter === "D" ? "ring-2 ring-blue-500 ring-offset-2 rounded-2xl" : ""}`}
            >
              <StatCard label="DSR REP" val={stats.dsr} color="emerald" />
            </button>
            <button
              aria-label="Filter No DSR"
              onClick={() => setActiveFilter("NE")}
              className={`text-left w-full transition-transform active:scale-95 ${activeFilter === "NE" ? "ring-2 ring-amber-500 ring-offset-2 rounded-2xl" : ""}`}
            >
              <StatCard
                label="NO DSR"
                val={stats.pending}
                color="amber"
                subText={stats.pending > 0 ? `LIVE: ${currentTime}` : undefined}
              />
            </button>
            <button
              aria-label="Filter Meeting"
              onClick={() => setActiveFilter("M")}
              className={`text-left w-full transition-transform active:scale-95 ${activeFilter === "M" ? "ring-2 ring-cyan-500 ring-offset-2 rounded-2xl" : ""}`}
            >
              <StatCard label="MEETING" val={stats.meeting} color="cyan" />
            </button>
            <button
              aria-label="Filter Training"
              onClick={() => setActiveFilter("T")}
              className={`text-left w-full transition-transform active:scale-95 ${activeFilter === "T" ? "ring-2 ring-amber-500 ring-offset-2 rounded-2xl" : ""}`}
            >
              <StatCard label="TRAINING" val={stats.training} color="amber" />
            </button>
            <button
              aria-label="Filter Leave"
              onClick={() => setActiveFilter("L")}
              className={`text-left w-full transition-transform active:scale-95 ${activeFilter === "L" ? "ring-2 ring-slate-500 ring-offset-2 rounded-2xl" : ""}`}
            >
              <StatCard label="LEAVE" val={stats.leave} color="slate" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-2">
            <button
              aria-label="Mandal Export"
              onClick={downloadMandalReport}
              className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm hover:bg-blue-100 hover:border-blue-200 active:scale-95 transition-all"
            >
              <Download size={14} /> Mandal Export
            </button>
            <button
              aria-label="GP Export"
              onClick={downloadFullReport}
              className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 border border-slate-200 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm hover:bg-slate-100 active:scale-95 transition-all"
            >
              <Download size={14} /> GP Export
            </button>
            <button
              aria-label="Raw Excel Download"
              onClick={downloadRawExcel}
              className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm hover:bg-emerald-100 hover:border-emerald-200 active:scale-95 transition-all"
            >
              <Download size={14} /> Raw Excel
            </button>
            <button
              aria-label="Raw PDF Download"
              onClick={downloadRawPdf}
              className="flex items-center justify-center gap-2 bg-rose-50 text-rose-700 border border-rose-100 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm hover:bg-rose-100 hover:border-rose-200 active:scale-95 transition-all"
            >
              <Download size={14} /> Raw PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-[32px] border shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Overall Success
                </h4>
                <span className="text-sm font-black text-emerald-600">
                  {stats.total > 0
                    ? Math.round(
                        ((stats.present +
                          stats.meeting +
                          stats.training +
                          stats.leave) /
                          stats.total) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${stats.total > 0 ? ((stats.present + stats.meeting + stats.training + stats.leave) / stats.total) * 100 : 0}%`,
                  }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
              <div className="mt-3 flex flex-col gap-1">
                <p className="text-[10px] text-slate-500 font-black uppercase">
                  Total Compliance:{" "}
                  {stats.present + stats.meeting + stats.training + stats.leave}{" "}
                  / {stats.total}
                </p>
              </div>
            </div>

            <div className="lg:col-span-1 bg-white p-6 rounded-[32px] border shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  DSR Compliance
                </h4>
                <span className="text-sm font-black text-blue-600">
                  {stats.total > 0
                    ? Math.round((stats.dsr / stats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${stats.total > 0 ? (stats.dsr / stats.total) * 100 : 0}%`,
                  }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
              <p className="mt-3 text-[10px] text-slate-500 font-medium uppercase italic">
                {stats.dsr} Present GPs reported DSR (out of {stats.total}{" "}
                total)
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-3 gap-4">
              <div className="bg-cyan-50/50 p-4 rounded-[24px] border border-cyan-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-cyan-600">
                    <Users size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Meeting
                    </span>
                  </div>
                  <div className="text-2xl font-black text-cyan-700">
                    {stats.meeting}
                  </div>
                </div>
                <p className="text-[8px] text-cyan-600 font-bold uppercase mt-2">
                  DSR Not Required
                </p>
              </div>
              <div className="bg-amber-50/50 p-4 rounded-[24px] border border-amber-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-amber-600">
                    <GraduationCap size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Training
                    </span>
                  </div>
                  <div className="text-2xl font-black text-amber-700">
                    {stats.training}
                  </div>
                </div>
                <p className="text-[8px] text-amber-600 font-bold uppercase mt-2">
                  DSR Not Required
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <Hash size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Leave
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-700">
                    {stats.leave}
                  </div>
                </div>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-2">
                  DSR Not Required
                </p>
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
              {Object.entries(mandalSummaries).map(
                ([mandal, mStats]: [string, any], mIdx) => (
                  <button
                    aria-label={`View mandal ${mandal}`}
                    key={`${mandal}_${mIdx}`}
                    onClick={() => setSearchTerm(mandal)}
                    className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="text-sm font-black text-primary truncate pr-2">
                        {mandal}
                      </h5>
                      <span className="bg-slate-50 text-[10px] font-black text-slate-400 px-2 py-1 rounded-lg uppercase">
                        {mStats.total} GPs
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      <div className="text-center">
                        <div className="text-[8px] font-black text-emerald-600 uppercase mb-0.5">
                          OnTime
                        </div>
                        <div className="text-[10px] font-black text-slate-700">
                          {mStats.onTime}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] font-black text-cyan-500 uppercase mb-0.5">
                          Meet
                        </div>
                        <div className="text-[10px] font-black text-slate-700">
                          {mStats.meeting}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] font-black text-slate-500 uppercase mb-0.5">
                          Leave
                        </div>
                        <div className="text-[10px] font-black text-slate-700">
                          {mStats.leave}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] font-black text-rose-500 uppercase mb-0.5">
                          Late
                        </div>
                        <div className="text-[10px] font-black text-slate-700">
                          {mStats.late}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] font-black text-slate-300 uppercase mb-0.5">
                          Pend
                        </div>
                        <div className="text-[10px] font-black text-slate-700">
                          {mStats.pending}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-1 h-1.5 rounded-full overflow-hidden bg-slate-50">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{
                          width: `${((mStats.onTime + mStats.meeting + mStats.training + mStats.leave) / mStats.total) * 100}%`,
                        }}
                      />
                      <div
                        className="h-full bg-rose-400 transition-all"
                        style={{
                          width: `${(mStats.late / mStats.total) * 100}%`,
                        }}
                      />
                      <div
                        className="h-full bg-slate-200 transition-all"
                        style={{
                          width: `${(mStats.pending / mStats.total) * 100}%`,
                        }}
                      />
                    </div>
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="relative space-y-4">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none"
                placeholder="Search GP or Mandal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {activeFilter && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Filtering by:
                </span>
                <span
                  className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 ${
                    activeFilter === "P"
                      ? "bg-emerald-100 text-emerald-700"
                      : activeFilter === "D"
                        ? "bg-blue-100 text-blue-700"
                        : activeFilter === "M"
                          ? "bg-cyan-100 text-cyan-700"
                          : activeFilter === "T"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {activeFilter === "P"
                    ? "Present"
                    : activeFilter === "D"
                      ? "DSR Reported"
                      : activeFilter === "NE"
                        ? "DSR Not Entered"
                        : activeFilter === "M"
                          ? "In Meeting"
                          : activeFilter === "T"
                            ? "In Training"
                            : "On Leave"}
                  <button
                    aria-label="Clear filter"
                    onClick={() => setActiveFilter(null)}
                    className="hover:opacity-70"
                  >
                    <XCircle size={12} />
                  </button>
                </span>
                <button
                  aria-label="Clear Filter"
                  onClick={() => setActiveFilter(null)}
                  className="text-[9px] font-bold text-primary hover:underline uppercase"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[32px] border shadow-xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-2 sm:p-4 text-[9px] sm:text-[10px]">
                      Mandal / GP
                    </th>
                    <th className="p-2 sm:p-4 text-center text-[9px] sm:text-[10px]">
                      Attendance
                    </th>
                    <th className="p-2 sm:p-4 text-center text-[9px] sm:text-[10px]">
                      DSR Status
                    </th>
                    <th className="p-2 sm:p-4 text-center text-[9px] sm:text-[10px]">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <td className="p-2 sm:p-4">
                        <div className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase truncate max-w-[80px] sm:max-w-none">
                          {row.mandal}
                        </div>
                        <div className="text-xs sm:text-sm font-black text-primary uppercase truncate max-w-[120px] sm:max-w-none">
                          {row.gp}
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 text-center">
                        <StatusCell
                          status={
                            row.isPresent
                              ? row.isAttBefore901
                                ? "P-I"
                                : row.isAttAfter900
                                  ? "P-L"
                                  : "P"
                              : row.isMeeting
                                ? "M"
                                : row.isTraining
                                  ? "T"
                                  : row.isLeave
                                    ? "L"
                                    : "A"
                          }
                        />
                        <div className="text-[8px] sm:text-[9px] text-slate-400 font-mono mt-1">
                          {row.attTime || "-"}
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 text-center">
                        {/* Logic: Green if OnTime OR Meeting/Training/Leave. Red if Late. Amber if simply Not Entered (Present but no DSR) */}
                        <span
                          className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase inline-block whitespace-nowrap ${
                            row.isOnTime ||
                            row.isMeeting ||
                            row.isTraining ||
                            row.isLeave
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : row.isLate
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {row.isMeeting
                            ? "Meeting"
                            : row.isTraining
                              ? "Training"
                              : row.isLeave
                                ? "Leave"
                                : row.isOnTime
                                  ? "DSR On Time"
                                  : row.isLate
                                    ? "Late DSR Entry"
                                    : row.isEntered
                                      ? "DSR Entered"
                                      : "Not Entered"}
                        </span>
                      </td>
                      <td className="p-2 sm:p-4 text-center text-[8px] sm:text-[10px] font-mono text-slate-500">
                        {row.dsrTime || "-"}
                      </td>
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

function AdBanner({ slotId = "5641797386" }: { slotId?: string }) {
  // Ads hidden as requested
  return null;
}

function PostCard({
  post,
  isExpanded,
  toggleExpansion,
  addToast,
  isAdmin,
  onEdit,
  allUsers,
}: {
  post: Post;
  isExpanded: boolean;
  toggleExpansion: () => void;
  addToast: (s: string) => void;
  isAdmin: boolean;
  onEdit: (p: Post) => void;
  allUsers: UserProfile[];
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isOwner = Boolean(
    (auth.currentUser && post.uid && auth.currentUser.uid === post.uid) ||
    isAdmin,
  );
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
      const q = query(
        collection(db, "posts", post.id, "comments"),
        orderBy("time", "desc"),
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const fetchedComments = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setComments(fetchedComments);
          setCommentsLoaded(true);
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `posts/${post.id}/comments`,
          ),
      );
      return () => unsub();
    }
  }, [showComments, post.id]);

  return (
    <motion.div layout className="post-card">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-primary font-black overflow-hidden border shadow-sm">
          {post.userPhoto ? (
            <img
              src={post.userPhoto}
              alt={post.userName || "Author"}
              loading="lazy"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-lg">
              {(post.userName || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h5 className="text-[17px] font-black text-primary leading-tight">
              {post.userName || "Portal Member"}
            </h5>
            {post.isAdminPost && (
              <span className="bg-blue-600 text-white text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                <ShieldCheck size={10} /> Official
              </span>
            )}
            {post.pinned && (
              <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] uppercase font-black tracking-widest border border-amber-100">
                <Pin size={10} fill="currentColor" /> Pinned
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase mt-1">
            <Clock size={12} />
            <span>
              {new Date(postTime).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span>•</span>
            <span className="text-primary/70">
              {post.categories && post.categories.length > 0
                ? post.categories.join(", ")
                : post.category || "Update"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {isOwner && (
            <>
                {isAdmin && (
                  <button
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, "posts", post.id), {
                          pinned: !post.pinned,
                        });
                        addToast(post.pinned ? "Post Unpinned" : "Post Pinned");
                      } catch (err) {
                        handleFirestoreError(err, OperationType.UPDATE, `posts/${post.id}`);
                      }
                    }}
                    className={`p-1.5 hover:bg-slate-50 transition-all rounded-lg ${post.pinned ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`}
                    title={post.pinned ? "Unpin Post" : "Pin Post"}
                  >
                    <Pin size={16} fill={post.pinned ? "currentColor" : "none"} />
                  </button>
                )}
                <button
                  onClick={() => onEdit(post)}
                  className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-primary transition-all rounded-lg"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
              <button
                aria-label="Delete Post"
                onClick={async () => {
                  const res = await Swal.fire({
                    title: "Delete?",
                    text: "Move this post to recycle bin?",
                    icon: "warning",
                    showCancelButton: true,
                  });
                  if (res.isConfirmed) {
                    try {
                      await updateDoc(doc(db, "posts", post.id), {
                        status: "Deleted",
                        deletedAt: Date.now(),
                      });
                      addToast("Moved to recycle bin");
                    } catch (err: any) {
                      addToast(getFriendlyError(err));
                    }
                  }
                }}
                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-danger transition-all rounded-lg"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <h4 className="post-title !mt-0 whitespace-pre-wrap">
        {formatPostTitle(post.title) || "Platform Update"}
      </h4>

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-200/50"
            >
              <Hash size={10} strokeWidth={3} /> {tag}
            </span>
          ))}
        </div>
      )}

      <div
        className={`post-body mb-4 whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-4"} [&_pre]:bg-slate-800 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:text-rose-500 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:px-0 [&_pre_code]:py-0 [&_p]:mb-2 [&_a]:text-blue-600 [&_a]:underline`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkBreaks]}
          rehypePlugins={[rehypeRaw]}
        >
          {post.content || ""}
        </ReactMarkdown>
      </div>

      {post.content && post.content.length > 200 && !isExpanded && (
        <button
          aria-label="Read Post"
          onClick={() => setSearchParams({ postId: post.id })}
          className="text-xs font-black text-primary uppercase underline underline-offset-4 mb-4 block hover:text-blue-600 transition-colors"
        >
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
          <Target
            size={14}
            className="text-primary/40 group-hover:text-primary transition-colors"
          />
        </div>
      )}

      {post.mediaUrl && (
        <div className="mb-4">
          {post.mediaType?.startsWith("video") ? (
            <video src={post.mediaUrl} controls className="post-media" />
          ) : post.mediaType?.startsWith("image") ? (
            <img
              src={post.mediaUrl}
              alt={post.title}
              className="post-media"
              loading="lazy"
            />
          ) : post.mediaType?.startsWith("audio") ? (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 truncate">
                {post.mediaName || "Audio Attachment"}
              </p>
              <audio src={post.mediaUrl} controls className="w-full" />
            </div>
          ) : post.mediaType === "link" ? (
            <a
              href={post.mediaUrl.startsWith("http") ? post.mediaUrl : `https://${post.mediaUrl}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center p-4 bg-blue-50/50 border border-blue-100 rounded-2xl hover:bg-blue-50 transition-colors w-full group"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex flex-shrink-0 items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Link2 size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-slate-800 text-sm truncate">
                  {post.mediaName || "External Link"}
                </h5>
                <p className="text-xs text-slate-500 truncate mt-0.5" dir="ltr">
                  {post.mediaUrl}
                </p>
              </div>
            </a>
          ) : (
            <a
              href={post.mediaUrl}
              download={post.mediaName || "Document"}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-primary/30 transition-colors w-full group"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex flex-shrink-0 items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-slate-800 text-sm truncate">
                  {post.mediaName || "Attached Document"}
                </h5>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">
                  Download File
                </p>
              </div>
              <Download
                size={20}
                className="text-slate-400 group-hover:text-primary transition-colors ml-4"
              />
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 justify-between items-center pt-6 border-t border-slate-100 mt-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button
              aria-label="Like Post"
              onClick={async (e) => {
                e.stopPropagation();
                const userId = auth.currentUser?.uid;
                if (requireLoginAlert()) return;
                const likedBy = post.likedBy || [];
                try {
                  if (likedBy.includes(userId)) {
                    await updateDoc(doc(db, "posts", post.id), {
                      likes: increment(-1),
                      likedBy: arrayRemove(userId),
                    });
                  } else {
                    await updateDoc(doc(db, "posts", post.id), {
                      likes: increment(1),
                      likedBy: arrayUnion(userId),
                    });
                  }
                } catch (err: any) {
                  addToast(getFriendlyError(err));
                }
              }}
              className={`flex items-center gap-2 p-2 rounded-xl transition-all ${post.likedBy?.includes(auth.currentUser?.uid || "") ? "bg-rose-50 text-rose-500" : "hover:bg-slate-50 text-slate-400"}`}
            >
              <Heart
                size={18}
                fill={
                  post.likedBy?.includes(auth.currentUser?.uid || "")
                    ? "currentColor"
                    : "none"
                }
              />
              <span
                onClick={(e) => {
                  if (isAdmin && post.likes > 0) {
                    e.stopPropagation();
                    setShowLikesModal(true);
                  }
                }}
                className={`text-sm font-black ${isAdmin && post.likes > 0 ? "hover:underline cursor-pointer" : ""}`}
              >
                {post.likes || 0}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 p-2 text-slate-400 cursor-pointer hover:bg-slate-50 rounded-xl transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
            >
              <MessageSquare size={18} />
              <span className="text-sm font-black">
                {post.commentCount || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              onClick={(e) => {
                if (isAdmin && post.views > 0) {
                  e.stopPropagation();
                  setShowViewsModal(true);
                }
              }}
              className={`flex items-center gap-2 p-2 text-slate-400 rounded-xl transition-all ${isAdmin && post.views > 0 ? "cursor-pointer hover:bg-slate-50" : ""}`}
            >
              <Eye size={18} />
              <span
                className={`text-sm font-black ${isAdmin && post.views > 0 ? "hover:underline cursor-pointer" : ""}`}
              >
                {post.views || 0}
              </span>
            </div>
          </div>
        </div>

        <button
          aria-label="Share Post"
          onClick={(e) => {
            e.stopPropagation();
            const url = `${window.location.origin}/?postId=${post.id}`;
            const plainContent = post.content ? post.content.replace(/<[^>]*>?/gm, '').replace(/[#*`]/g, '').substring(0, 100) + '...' : "";
            const shareText = plainContent ? `${plainContent}\n\nRead more on E-Vedhika:` : "Check out this post on E-Vedhika:";
            handleShare(
              post.title || "E-Vedhika Post",
              shareText,
              url,
              () => addToast("Link Copied!"),
              post.mediaUrl,
              post.mediaType
            );
          }}
          className="flex items-center gap-2 p-2 px-4 rounded-xl text-primary font-black text-xs uppercase bg-slate-50 hover:bg-primary hover:text-white transition-all"
        >
          <Share2 size={16} strokeWidth={2.5} />
          <span>Share</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="space-y-4 mb-4">
            {comments.map((c) => (
              <div key={c.id} className="text-sm bg-slate-50 p-3 rounded-2xl">
                <span className="font-black text-primary mr-2 uppercase text-[10px]">
                  {c.userName}:
                </span>
                <span className="text-slate-600">{c.text}</span>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-2">
                No comments yet
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-slate-50 px-4 py-2 rounded-xl text-sm border-2 border-transparent focus:border-primary/20 outline-none"
            />
            <button
              onClick={async () => {
                if (!newComment.trim() || requireLoginAlert()) return;
                try {
                  await addDoc(collection(db, "posts", post.id, "comments"), {
                    text: newComment,
                    time: Date.now(),
                    uid: auth.currentUser!.uid,
                    userName: auth.currentUser!.displayName || "User",
                  });
                  await updateDoc(doc(db, "posts", post.id), {
                    commentCount: increment(1),
                  });
                  setNewComment("");
                } catch (e: any) {
                  addToast("Error: " + e.message);
                }
              }}
              className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              SEND
            </button>
          </div>
        </div>
      )}

      {showLikesModal && (
        <UsersListModal
          title="Liked By"
          uids={post.likedBy || []}
          allUsers={allUsers}
          onClose={() => setShowLikesModal(false)}
        />
      )}
      {showViewsModal && (
        <UsersListModal
          title="Viewed By"
          uids={post.viewedBy || []}
          allUsers={allUsers}
          onClose={() => setShowViewsModal(false)}
        />
      )}
    </motion.div>
  );
}

function PostForm({
  addToast,
  onCancel,
  currentUserProfile,
  editingPost,
  isAdmin,
  isEditor,
}: {
  addToast: (s: string) => void;
  onCancel: () => void;
  currentUserProfile: UserProfile | null;
  editingPost: Post | null;
  isAdmin: boolean;
  isEditor: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [title, setTitle] = useState(editingPost?.title || "");
  const [content, setContent] = useState(editingPost?.content || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const raw = editingPost?.categories
      ? editingPost.categories
      : editingPost?.category
        ? [editingPost.category]
        : ["📌 General"];
    // Map old names to new names for consistency in UI selection
    return raw.map(cat => {
      if (cat === "🚀 Portal Update") return "🚀 Updates";
      return cat;
    });
  });
  const [tags, setTags] = useState(editingPost?.tags?.join(", ") || "");
  const [websiteName, setWebsiteName] = useState(
    editingPost?.websiteName || "",
  );
  const [media, setMedia] = useState<{
    url: string;
    type: string;
    name?: string;
  } | null>(
    editingPost
      ? editingPost.mediaUrl
        ? {
            url: editingPost.mediaUrl,
            type: editingPost.mediaType || "image/jpeg",
            name: editingPost.mediaName,
          }
        : null
      : null,
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
    "🚀 Updates",
    "📊 Daily Reports",
    "🗳️ Election",
    "🏛️ Mana Panchayath",
    "💡 Suggestions & Feedback",
    "📑 Applications & GOs",
    "🔗 Useful Information",
    "🏠 ePanchayat Issue",
    "💰 Online Tax Collection Issue",
    "📂 Ubd Portal Issue",
    "🗳️ TSEC Poll Issue",
    "🛠️ eGramSwaraj doubts",
  ];

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      if (selectedCategories.length < 5) {
        setSelectedCategories([...selectedCategories, cat]);
      } else {
        addToast("You can select up to 5 categories only.");
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
      const extractedHashtags =
        content.match(/#(\w+)/g)?.map((tag) => tag.substring(1)) || [];
      const manualTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");
      const finalTags = Array.from(
        new Set([...manualTags, ...extractedHashtags]),
      );

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

      // Firestore document size limit check (1MB)
      const estimatedSize = JSON.stringify(postData).length;
      if (estimatedSize > 950000) { // Safety margin
        addToast("Post content or media is too large for the portal. Please reduce image size or text content.");
        setLoading(false);
        return;
      }

      if (editingPost) {
        await updateDoc(doc(db, "posts", editingPost.id), {
          ...postData,
          lastEditedAt: Date.now(),
        });
        addToast("Update Saved!");
      } else {
        const docRef = await addDoc(collection(db, "posts"), {
          ...postData,
          subCategory: "",
          likes: 0,
          likedBy: [],
          views: 0,
          commentCount: 0,
          comments: [],
          time: Date.now(),
          createdAt: Date.now(),
          uid: auth.currentUser.uid,
          userEmail: auth.currentUser.email || "",
          userName: isEditor
            ? "Admin"
            : currentUserProfile?.username ||
              auth.currentUser.displayName ||
              "User",
          userPhoto: isEditor ? "" : currentUserProfile?.photoURL || "",
          isAdminPost: isEditor,
          status: isEditor ? "Approved" : "Pending",
        });

        const hasUpdateTag = finalTags.some((tag) =>
          ["update", "updates", "అప్డేట్"].includes(tag.toLowerCase()),
        ) || selectedCategories.some((cat) => 
          cat.toLowerCase().includes("update") || cat.toLowerCase().includes("అప్డేట్")
        );

        if (hasUpdateTag) {
          await addDoc(collection(db, "notifications"), {
            uid: "all",
            type: "post",
            text: `New update: ${title}`,
            time: Date.now(),
            read: false,
            readBy: [],
            postId: docRef.id
          });
        }

        addToast(
          "Post Published! " + (!isAdmin ? "Waiting for admin approval." : ""),
        );
      }
      onCancel();
    } catch (err: any) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        editingPost ? `posts/${editingPost.id}` : "posts",
      );
      addToast(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onSubmit={onSubmit}
      className="bg-white p-6 rounded-3xl shadow-xl border-2 border-accent mb-8"
      style={{ borderColor: "#fbbf24" }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-primary uppercase text-lg flex items-center gap-2">
          {editingPost ? "✏️ Edit Update" : "📝 New Update"}
        </h3>
        <button
          aria-label="Close edit modal"
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors font-black text-lg"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 text-left">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
            Title / Header
          </label>
          <input
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter catchy title..."
            className="w-full text-lg font-black text-primary p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-primary/20 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-full">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
              Categories (Select up to 5)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                    selectedCategories.includes(cat)
                      ? "bg-primary text-white border-primary shadow-md"
                      : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
              Website Name (Optional)
            </label>
            <input
              name="websiteName"
              value={websiteName}
              onChange={(e) => setWebsiteName(e.target.value)}
              placeholder="e.g. ePanchayat"
              className="w-full bg-slate-50 text-xs font-bold p-3 rounded-xl border-2 border-transparent focus:border-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
            Tags (Comma separated)
          </label>
          <input
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. help, important, notice"
            className="w-full bg-slate-50 text-xs font-bold p-3 rounded-xl border-2 border-transparent focus:border-primary/20 outline-none transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between ml-1 mb-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Content Details
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowMarkdownPreview(false)}
                className={`text-[10px] font-black uppercase px-3 py-1 rounded-full transition-colors ${!showMarkdownPreview ? "bg-primary text-white" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setShowMarkdownPreview(true)}
                className={`text-[10px] font-black uppercase px-3 py-1 rounded-full transition-colors ${showMarkdownPreview ? "bg-primary text-white" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
              >
                Preview
              </button>
            </div>
          </div>

          {!showMarkdownPreview ? (
            <>
              <div className="flex flex-wrap items-center gap-1 mb-0 bg-slate-100 p-1.5 rounded-t-2xl border-x-2 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => wrapText("**", "**")}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary"
                  title="Bold"
                >
                  <Bold size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => wrapText("*", "*")}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary"
                  title="Italic"
                >
                  <Italic size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => wrapText("# ", "")}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary"
                  title="Heading 1"
                >
                  <Type size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => wrapText("## ", "")}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary"
                  title="Heading 2"
                >
                  <Type size={14} />
                </button>
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                <button
                  type="button"
                  onClick={() => wrapText("- ", "")}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary"
                  title="Bullet List"
                >
                  <List size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => wrapText("[", "](url)")}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary"
                  title="Link"
                >
                  <Link2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setContent(content + "\n---\n")}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 hover:text-primary text-[10px] font-black"
                  title="Divider"
                >
                  LINE
                </button>
              </div>
              <textarea
                ref={textareaRef}
                name="content"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write details here (Markdown supported)..."
                rows={8}
                className="w-full bg-slate-50 p-3 rounded-b-2xl border-2 border-t-0 border-slate-200 focus:border-primary/20 outline-none text-sm font-medium leading-relaxed"
              />
            </>
          ) : (
            <div className="w-full bg-white p-6 rounded-2xl border-2 border-slate-200 min-h-[300px] overflow-y-auto">
              {/* Full Post Preview */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {currentUserProfile?.photoURL ? (
                    <img src={currentUserProfile.photoURL} alt="Author" className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                      {currentUserProfile?.name?.charAt(0) || currentUserProfile?.username?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{currentUserProfile?.name || currentUserProfile?.username || "You"}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Just now (Preview)</p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">{selectedCategories[0] || "General"}</span>
                  </span>
                </div>
              </div>

              <h4 className="post-title !mt-0 whitespace-pre-wrap">
                {formatPostTitle(title) || "Post Title Preview"}
              </h4>

              {tags && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tags.split(",").map((tag, i) => tag.trim() && (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-200/50">
                      <Hash size={10} strokeWidth={3} /> {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="post-body mb-4 whitespace-pre-wrap [&_pre]:bg-slate-800 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:text-rose-500 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:px-0 [&_pre_code]:py-0 [&_p]:mb-2 [&_a]:text-blue-600 [&_a]:underline">
                {content.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                    {content}
                  </ReactMarkdown>
                ) : (
                  <span className="text-slate-400 italic">No content to preview...</span>
                )}
              </div>

              {websiteName && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between mb-4 group">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-wider">
                    <div className="w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center">
                      <ExternalLink size={12} strokeWidth={3} />
                    </div>
                    {websiteName}
                  </div>
                </div>
              )}

              {media?.url && (
                <div className="mb-4">
                  {media.type?.startsWith("video") ? (
                    <video src={media.url} controls className="post-media" />
                  ) : media.type?.startsWith("image") ? (
                    <img src={media.url} alt="Media preview" className="post-media" loading="lazy" />
                  ) : media.type?.startsWith("audio") ? (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 truncate">
                        {media.name || "Audio Attachment"}
                      </p>
                      <audio src={media.url} controls className="w-full" />
                    </div>
                  ) : media.type === "link" ? (
                    <div className="flex items-center p-4 bg-blue-50/50 border border-blue-100 rounded-2xl w-full">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex flex-shrink-0 items-center justify-center mr-4">
                        <Link2 size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate mb-1">
                          {media.name || "External Link"}
                        </h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                          {media.url}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl w-full">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex flex-shrink-0 items-center justify-center mr-4">
                        <FileText size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate mb-1">
                          {media.name || "Document Attached"}
                        </h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Document Upload
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
            Media Content
          </label>
          <div className="p-4 border-2 border-dashed rounded-2xl relative bg-slate-50 transition-all hover:bg-slate-100 hover:border-primary/20">
            {media?.url ? (
              <div className="space-y-3 px-4 py-4 text-center">
                <div className="relative inline-block w-full max-w-sm">
                  {media.type.startsWith("video") ? (
                    <video
                      src={media.url}
                      className="h-32 w-full object-cover rounded-xl border shadow-sm"
                    />
                  ) : media.type.startsWith("image") ? (
                    <img
                      src={media.url}
                      alt="Uploaded media preview"
                      loading="lazy"
                      className="h-32 w-full object-cover rounded-xl border shadow-sm"
                    />
                  ) : media.type.startsWith("audio") ? (
                    <div className="h-32 w-full bg-slate-50 flex flex-col items-center justify-center rounded-xl border shadow-sm p-4">
                      <span className="text-xs font-bold text-slate-600 truncate w-full px-4 mb-2">
                        {media.name || "audio file"}
                      </span>
                      <audio src={media.url} controls className="w-full max-w-xs" />
                    </div>
                  ) : (
                    <div className="h-32 w-full bg-slate-100 flex flex-col items-center justify-center rounded-xl border shadow-sm p-4">
                      <FileText size={32} className="text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-600 truncate w-full px-4">
                        {media.name || "document"}
                      </span>
                    </div>
                  )}
                  <button
                    aria-label="Remove media"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMedia(null);
                    }}
                    className="absolute -top-2 -right-2 bg-danger text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform z-10"
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
                </div>
                <p className="text-[11px] font-black text-success uppercase">
                  ✓ Media Attached
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="text-[11px] sm:text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-6">
                  Upload Attachment From
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full px-2 max-w-lg">
                  {/* Local Device */}
                  <div className="relative group/btn cursor-pointer bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-primary/50 transition-all flex flex-col items-center gap-2">
                    <HardDrive size={24} className="text-slate-400 group-hover/btn:text-primary transition-colors" />
                    <span className="text-[10px] font-bold text-slate-500 group-hover/btn:text-primary text-center uppercase tracking-wider">Local Device</span>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="*/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (f.type.startsWith("image/")) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement("canvas");
                                let width = img.width;
                                let height = img.height;
                                const MAX_SIZE = 800; // Reduced max dimension
                                if (width > height && width > MAX_SIZE) {
                                  height *= MAX_SIZE / width;
                                  width = MAX_SIZE;
                                } else if (height > MAX_SIZE) {
                                  width *= MAX_SIZE / height;
                                  height = MAX_SIZE;
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext("2d");
                                ctx?.drawImage(img, 0, 0, width, height);
                                // Lowered quality to 0.5 to stay well under Firestore limits
                                const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.5);
                                
                                if (compressedDataUrl.length > 800000) {
                                  addToast("Image is still too large after compression. Please use a smaller photo.");
                                  return;
                                }

                                setMedia({
                                  url: compressedDataUrl,
                                  type: "image/jpeg",
                                  name: f.name,
                                });
                              };
                              img.src = ev.target?.result as string;
                            };
                            reader.readAsDataURL(f);
                          } else {
                            // Non-image files (videos, docs, etc)
                            if (f.size > 700 * 1024) {
                              addToast("Non-image files must be under 700KB for direct portal storage.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const dataUrl = ev.target?.result as string;
                              if (dataUrl.length > 900000) {
                                addToast("Encoded file is too large for the portal.");
                                return;
                              }
                              setMedia({
                                url: dataUrl,
                                type: f.type || "application/octet-stream",
                                name: f.name,
                              });
                            };
                            reader.readAsDataURL(f);
                          }
                        }
                      }}
                    />
                  </div>
                  
                  {/* Links */}
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt("Enter link/URL:");
                      if (url) {
                        try {
                          const u = new URL(url);
                          const host = u.hostname.toLowerCase();
                          let linkName = 'External Link';
                          if (host.includes('youtube.com') || host.includes('youtu.be')) linkName = 'YouTube Video';
                          else if (host.includes('drive.google.com')) linkName = 'Google Drive File';
                          else if (host.includes('facebook.com')) linkName = 'Facebook Link';
                          else if (host.includes('twitter.com') || host.includes('x.com')) linkName = 'X/Twitter Link';
                          else if (host.includes('instagram.com')) linkName = 'Instagram Link';
                          else if (host.includes('tsec.gov.in')) linkName = 'TSEC Portal Link';
                          else if (host.includes('epanchayat.telangana.gov.in')) linkName = 'ePanchayat Link';
                          else if (host.includes('ubd.telangana.gov.in')) linkName = 'UBD Portal Link';
                          else if (host.includes('egramswaraj.gov.in')) linkName = 'eGramSwaraj Link';
                          else linkName = host;
                          setMedia({ url, type: "link", name: linkName });
                        } catch(e) {
                          setMedia({ url, type: "link", name: "External Link" });
                        }
                      }
                    }}
                    className="group/btn cursor-pointer bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-blue-500/50 transition-all flex flex-col items-center gap-2"
                  >
                    <Link2 size={24} className="text-slate-400 group-hover/btn:text-blue-500 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-500 group-hover/btn:text-blue-500 text-center uppercase tracking-wider">Links</span>
                  </button>
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold text-center mt-6">
                  Autosized for optimized upload. All formats supported.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        aria-label={editingPost ? "Save Changes" : "Publish Now"}
        disabled={loading}
        className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg hover:bg-primary-light transition-all active:scale-95 mt-6 disabled:opacity-50 uppercase tracking-widest"
        style={{ background: "#0d3b66" }}
      >
        {loading
          ? editingPost
            ? "SAVING... 🚀"
            : "PUBLISHING... 🚀"
          : editingPost
            ? "SAVE CHANGES 🚀"
            : "PUBLISH NOW 🚀"}
      </button>
    </motion.form>
  );
}

function MenuButton({
  label,
  active,
  onClick,
  emoji,
  icon: Icon,
  tourId,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  emoji?: string;
  icon?: any;
  tourId?: string;
}) {
  return (
    <motion.button
      id={tourId || `nav-menu-${label.replace(/[^a-zA-Z0-9]/g, '-')}`}
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`side-btn ${active ? "active-tab" : "hover:bg-slate-50"}`}
    >
      {emoji ? (
        <span className="side-btn-emoji">{emoji}</span>
      ) : (
        Icon && (
          <Icon
            size={20}
            className={active ? "text-white" : "text-slate-500"}
            strokeWidth={active ? 2.5 : 2}
          />
        )
      )}
      <span className="text-sm tracking-tight">{label}</span>
    </motion.button>
  );
}

function ChatSection({
  messages,
  user,
  addToast,
  userProfile,
}: {
  messages: ChatMessage[];
  user: any;
  addToast: (s: string) => void;
  userProfile: UserProfile | null;
}) {
  const [msg, setMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!msg.trim()) return;
    if (requireLoginAlert(user)) return;

    try {
      await addDoc(collection(db, "chat"), {
        msg,
        time: Date.now(),
        uid: user.uid,
        userName: userProfile?.username || user.displayName || "Portal User",
      });
      setMsg("");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "chat");
      addToast("Error sending");
    }
  };

  return (
    <div className="bg-white rounded-3xl border shadow-sm flex flex-col h-[600px] overflow-hidden">
      <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
        <div className="font-black text-primary flex items-center gap-3">
          <MessageCircle size={20} />
          LIVE FEED
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc] custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${m.uid === user?.uid ? "justify-end" : "justify-start"}`}
            >
              <div className="flex flex-col max-w-[80%]">
                <span
                  className={`text-[10px] font-black uppercase mb-1 px-1 ${m.uid === user?.uid ? "text-right text-primary/40" : "text-slate-400"}`}
                >
                  {m.userName || "Portal User"}
                </span>
                <div
                  className={`p-3 rounded-2xl text-sm font-medium shadow-sm whitespace-pre-wrap ${m.uid === user?.uid ? "bg-primary text-white rounded-tr-none" : "bg-white border rounded-tl-none"}`}
                  style={m.uid === user?.uid ? { background: "#0d3b66" } : {}}
                >
                  {m.msg}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>
      <div className="p-4 border-t flex gap-2">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type..."
          className="mb-0 flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-primary/50 text-sm"
        />
        <button
          aria-label="Send message"
          onClick={send}
          className="bg-primary text-white p-3 rounded-xl"
          style={{ background: "#0d3b66" }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

import { PR_ACT_DB, PRSection } from "./data/prActData";
import { ExcelPrinterTool } from "./ExcelPrinterTool";

function KnowledgeHubSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isolatedSection, setIsolatedSection] = useState<PRSection | null>(
    null,
  );

  // Advanced NLP Search Logic
  const getFilteredData = () => {
    if (!searchTerm.trim()) return PR_ACT_DB;

    const term = searchTerm.toLowerCase().trim();

    // Exact Number Catch: If user typed only a number (e.g., "114", "37")
    const isExactNumber = /^\d+$/.test(term);
    if (isExactNumber) {
      const exactMatch = PR_ACT_DB.filter(
        (s: PRSection) => s.number === term && s.type === "section",
      );
      if (exactMatch.length > 0) return exactMatch;
    }

    // Fuzzy NLP Search
    // Remove vowels, spaces and special chars for a forgiving "sound/root" search
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .replace(/[\s\(\)\[\]\{\}\.,!?'"అఆఇఈఉఊఎఏఐఒఓఔఅంఅఃa-zA-Z]/g, "");
    const isTelugu = /[\u0C00-\u0C7F]/.test(term);

    return PR_ACT_DB.filter((c: PRSection) => {
      // 1. Direct includes match
      if (
        c.title.toLowerCase().includes(term) ||
        c.content.toLowerCase().includes(term) ||
        c.keywords.some((k: string) => k.toLowerCase().includes(term)) ||
        (c.practical_use && c.practical_use.toLowerCase().includes(term))
      ) {
        return true;
      }

      // 2. Advanced: If it's telugu, try stripped matching (forgiving typos)
      if (isTelugu) {
        const normTerm = normalize(term);
        if (normTerm.length > 2) {
          const normTitle = normalize(c.title);
          const normContent = normalize(c.content);
          if (normTitle.includes(normTerm) || normContent.includes(normTerm))
            return true;
        }
      }

      return false;
    });
  };

  const filteredData = getFilteredData();

  if (isolatedSection) {
    return (
      <div className="fixed inset-0 z-[10000] bg-slate-50 flex flex-col h-[100dvh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-indigo-600 p-6 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsolatedSection(null)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-black text-white capitalize tracking-wide">
              {isolatedSection.type === "section"
                ? `సెక్షన్ ${isolatedSection.number}`
                : `షెడ్యూల్ ${isolatedSection.number}`}
            </h2>
          </div>
          <div className="bg-amber-400 px-3 py-1 rounded-full text-indigo-900 text-[10px] font-black uppercase tracking-wider">
            Isolated View
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar pb-24">
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <span className="text-indigo-600 font-bold text-xs uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full mb-3 inline-block">
                {isolatedSection.type === "section"
                  ? "TPRA 2018 SECTION"
                  : "TPRA 2018 SCHEDULE"}
              </span>
              <h1 className="text-2xl md:text-4xl font-black text-slate-800 leading-tight">
                {isolatedSection.title}
              </h1>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50">
              <h3 className="flex items-center gap-2 font-black text-slate-400 uppercase text-sm tracking-widest mb-4">
                <FileText size={16} /> లీగల్ టెక్స్ట్ (Legal Text)
              </h3>
              <p className="text-slate-700 leading-relaxed font-semibold text-lg">
                {isolatedSection.content}
              </p>
            </div>

            {isolatedSection.practical_use && (
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 md:p-8 rounded-[32px] border border-amber-200 shadow-lg shadow-amber-900/5">
                <h3 className="flex items-center gap-2 font-black text-amber-600 uppercase text-sm tracking-widest mb-4">
                  <AlertCircle size={16} /> రియల్ లైఫ్ రిఫరెన్స్ (Real-Life
                  Reference)
                </h3>
                <p className="text-amber-900 leading-relaxed font-bold">
                  {isolatedSection.practical_use}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 p-6 sm:p-8 rounded-[32px] text-white shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

        <div className="relative z-10">
          <div className="bg-white/10 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20 backdrop-blur-sm">
            Offline Law Book App
          </div>
          <h2 className="text-2xl sm:text-4xl font-black flex items-center gap-3 mb-2 leading-tight">
            <Book size={32} className="text-yellow-400 shrink-0" /> TS PR Act
            2018 <br className="sm:hidden" />
            పాకెట్ గైడ్
          </h2>
          <p className="text-indigo-100 text-xs sm:text-sm font-bold uppercase tracking-widest mb-8 max-w-lg opacity-90 leading-relaxed">
            290 సెక్షన్లు, 8 షెడ్యూల్స్ - అడ్వాన్స్డ్ స్మార్ట్ సెర్చ్ తో
            కచ్చితమైన డేటా మీ అరచేతిలో. ఏదీ కలపకుండా దేనికదే విడివిడిగా
            (Individual Sections) ఒరిజినల్ డేటాతో.
          </p>

          <div className="max-w-xl">
            <div className="relative flex items-center group/search">
              <input
                type="text"
                placeholder="ఉదా: 114 లేదా నాలా లేదా అక్రమ కట్టడాలు..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-slate-800 placeholder:text-slate-400 pl-6 pr-16 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-yellow-400/30 transition-all font-black text-sm sm:text-base border-2 border-transparent focus:border-yellow-400 shadow-2xl"
              />
              {!searchTerm && (
                <div className="absolute right-4 bg-indigo-500 p-2 rounded-xl text-yellow-300 pointer-events-none">
                  <Bot size={20} />
                </div>
              )}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 text-slate-400 hover:text-indigo-600 transition-colors p-2"
                >
                  <XCircle size={20} />
                </button>
              )}
            </div>
            <p className="text-indigo-200 text-[10px] font-semibold mt-3 ml-2">
              💡 గమనిక: బ్రాకెట్లు, స్పెల్లింగ్ మిస్టేక్స్ ఉన్నా సరి చేసి
              ఒరిజినల్ సెక్షన్ తీస్తుంది.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {["114", "73", "140", "కార్యదర్శి", "పన్ను"].map((tag) => (
          <button
            key={tag}
            onClick={() => setSearchTerm(tag)}
            className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-bold bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Search size={24} />
            </div>
            <p className="text-lg">
              మీరు వెతుకుతున్న "{searchTerm}" సంబంధించిన సెక్షన్ దొరకలేదు.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              దయచేసి నంబర్ లేదా సరైన పదాన్ని ప్రయత్నించండి.
            </p>
          </div>
        ) : (
          filteredData.map((c: PRSection) => (
            <div
              key={c.id}
              className="group bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start gap-6">
                {/* Badge Section */}
                <div className="shrink-0">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                      {c.type === "section" ? "SEC" : "SCH"}
                    </span>
                    <span className="text-2xl font-black">{c.number}</span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-800 text-lg sm:text-xl mb-3 leading-tight group-hover:text-indigo-700 transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-sm font-semibold text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {c.content}
                  </p>

                  {c.practical_use && (
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-3 mb-4">
                      <AlertCircle
                        size={16}
                        className="text-amber-500 shrink-0 mt-0.5"
                      />
                      <p className="text-xs font-bold text-amber-800 leading-relaxed max-w-prose line-clamp-2">
                        {c.practical_use}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setIsolatedSection(c)}
                    className="w-full sm:w-auto mt-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-indigo-100"
                  >
                    ఈ సెక్షన్ మాత్రమే ఓపెన్ చెయ్ 🚀
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!searchTerm && (
        <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[32px] mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h4 className="font-black text-sm uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} /> 100% Individual View
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium max-w-xl">
                పై డేటా అంతా కచ్చితమైన ఒరిజినల్ సెక్షన్ నంబర్లతో పొందుపరచబడింది.
                ఇందులో డమ్మీ కంటెంట్ లేకుండా, రియల్ లైఫ్ లో వాడుకునేలా పక్కాగా
                స్ప్లిట్ చేయబడింది.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PRActHub({ user }: { user: any }) {
  return <KnowledgeHubSection />;
}

// --- POST DETAIL MODULE ---

function PostDetail({
  postId,
  onBack,
  isAdmin,
  addToast,
  userProfile,
  allUsers,
  onEdit,
}: {
  postId: string;
  onBack: () => void;
  isAdmin: boolean;
  addToast: (s: string) => void;
  userProfile: UserProfile | null;
  allUsers: UserProfile[];
  onEdit: (p: Post) => void;
}) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showViewsModal, setShowViewsModal] = useState(false);
  const isOwner = Boolean(
    (auth.currentUser && post?.uid && auth.currentUser.uid === post.uid) ||
    isAdmin,
  );

  useEffect(() => {
    let isInitial = true;
    const docRef = doc(db, "posts", postId);
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPost({ id: snapshot.id, ...snapshot.data() } as Post);
          if (isInitial) {
            isInitial = false;
            const data = snapshot.data();
            const uid = auth.currentUser?.uid;
            if (uid && data && !data.viewedBy?.includes(uid)) {
              const updateData: any = {
                views: increment(1),
                viewedBy: arrayUnion(uid),
              };
              updateDoc(docRef, updateData).catch((e) => console.error(e));
            }
            setLoading(false);
          }
        } else {
          if (isInitial) addToast("Post not found");
          setLoading(false);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `posts/${postId}`);
        if (isInitial) {
          addToast("Error loading post");
          setLoading(false);
        }
      },
    );
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
          <p className="text-slate-500 font-medium">
            Sorry, we couldn't find that update. It may have been removed.
          </p>
        </div>
        <button
          aria-label="Return to Feed"
          onClick={onBack}
          className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-opacity-90 inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Return to Feed
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 md:p-10 rounded-[32px] shadow-sm border space-y-8"
    >
      <div className="flex items-center justify-between gap-4">
        <button
          aria-label="Back to Feed"
          onClick={onBack}
          className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-slate-500 hover:text-primary transition-colors font-bold text-sm w-fit group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />{" "}
          Back to Feed
        </button>

        {isOwner && (
          <button
            aria-label="Edit Post"
            onClick={() => onEdit(post)}
            className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors font-bold text-sm group"
          >
            <Edit3 size={16} className="group-hover:scale-110 transition-transform" />
            Edit Update
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-6">
          <div className="flex flex-wrap items-center gap-2">
            {post.categories && post.categories.length > 0 ? (
              post.categories.map((cat, idx) => (
                <span
                  key={idx}
                  className="cat-tag bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                >
                  {cat}
                </span>
              ))
            ) : (
              <span className="cat-tag bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                {post.category || "Update"}
              </span>
            )}
            {post.subCategory && (
              <span className="cat-tag sub-cat-tag bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                {post.subCategory}
              </span>
            )}
          </div>
          <div className="flex items-center text-xs font-black text-slate-400 uppercase tracking-wider">
            <Clock size={14} className="mr-1.5" />
            {new Date(getValidTime(post)).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-primary leading-tight tracking-tight whitespace-pre-wrap">
          {formatPostTitle(post.title)}
        </h1>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100 flex items-center gap-1.5"
              >
                <Hash size={12} className="text-primary/50" /> {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white border-2 border-white shadow-sm ring-2 ring-slate-50 overflow-hidden">
            {post.userPhoto ? (
              <img
                src={post.userPhoto}
                alt="Author"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="flex flex-col">
            <span>{post.userName || "Admin"}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Author
            </span>
          </div>
        </div>

        {post.mediaUrl && (
          <div className="mt-8 rounded-[24px] overflow-hidden border-4 border-slate-50 shadow-md">
            {post.mediaType?.startsWith("video") ? (
              <video
                src={post.mediaUrl}
                controls
                className="w-full max-h-[500px]"
              />
            ) : post.mediaType?.startsWith("image") ? (
              <img
                src={post.mediaUrl}
                alt="Post media"
                className="w-full object-cover max-h-[500px]"
              />
            ) : post.mediaType?.startsWith("audio") ? (
              <div className="bg-white p-6">
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 truncate">
                  {post.mediaName || "Audio Attachment"}
                </p>
                <audio src={post.mediaUrl} controls className="w-full" />
              </div>
            ) : post.mediaType === "link" ? (
              <a
                href={post.mediaUrl.startsWith("http") ? post.mediaUrl : `https://${post.mediaUrl}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center p-6 bg-blue-50/50 hover:bg-blue-50 transition-colors w-full group"
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex flex-shrink-0 items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                  <Link2 size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-black text-slate-800 text-lg truncate">
                    {post.mediaName || "External Link"}
                  </h5>
                  <p className="text-sm text-slate-500 truncate mt-1 break-all" dir="ltr">
                    {post.mediaUrl}
                  </p>
                </div>
              </a>
            ) : (
              <a
                href={post.mediaUrl}
                download={post.mediaName || "Document"}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center p-6 bg-slate-50 hover:bg-slate-100 transition-colors w-full group"
              >
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex flex-shrink-0 items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                  <FileText size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-black text-slate-800 text-lg truncate">
                    {post.mediaName || "Attached Document"}
                  </h5>
                  <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mt-2">
                    Download File
                  </p>
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-primary group-hover:shadow-md transition-all">
                  <Download size={24} />
                </div>
              </a>
            )}
          </div>
        )}

        <div className="prose prose-slate prose-lg md:prose-xl max-w-none pt-4 text-slate-700 leading-relaxed font-serif whitespace-pre-wrap">
          <ReactMarkdown
            remarkPlugins={[remarkBreaks]}
            rehypePlugins={[rehypeRaw]}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        <div className="flex justify-between items-center sm:mt-12 mt-8 pt-8 border-t-2 border-dashed border-slate-100">
          <div className="flex gap-6">
            <button
              onClick={async (e) => {
                const userId = auth.currentUser?.uid;
                if (!userId) {
                  addToast("Please login first");
                  return;
                }
                const likedBy = post.likedBy || [];
                if (likedBy.includes(userId)) {
                  await updateDoc(doc(db, "posts", post.id), {
                    likes: increment(-1),
                    likedBy: likedBy.filter((id) => id !== userId),
                  });
                } else {
                  await updateDoc(doc(db, "posts", post.id), {
                    likes: increment(1),
                    likedBy: arrayUnion(userId),
                  });
                }
              }}
              className="flex items-center gap-2 text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors cursor-pointer group"
            >
              <Heart
                size={20}
                className={
                  post.likedBy?.includes(auth.currentUser?.uid || "")
                    ? "fill-primary text-primary"
                    : "text-primary group-hover:scale-110 transition-transform"
                }
              />
              <span
                onClick={(e) => {
                  if (isAdmin && post.likes > 0) {
                    e.stopPropagation();
                    setShowLikesModal(true);
                  }
                }}
                className={`font-black text-base ${isAdmin && post.likes > 0 ? "hover:underline cursor-pointer" : ""}`}
              >
                {post.likes || 0}
              </span>{" "}
              <span className="text-xs uppercase tracking-wider hidden sm:inline">
                Likes
              </span>
            </button>
            <button
              onClick={() => {
                if (isAdmin && post.views > 0) setShowViewsModal(true);
              }}
              className={`flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 transition-colors ${isAdmin && post.views > 0 ? "hover:bg-slate-100 cursor-pointer" : "cursor-default"}`}
            >
              <Eye size={20} />
              <span
                className={`font-black text-base ${isAdmin && post.views > 0 ? "hover:underline" : ""}`}
              >
                {post.views || 0}
              </span>{" "}
              <span className="text-xs uppercase tracking-wider hidden sm:inline">
                Views
              </span>
            </button>
          </div>

          <button
            aria-label="Share Post"
            onClick={() => {
              const url = `${window.location.origin}/?postId=${post.id}`;
              const plainContent = post.content ? post.content.replace(/<[^>]*>?/gm, '').replace(/[#*`]/g, '').substring(0, 100) + '...' : "";
              const shareText = plainContent ? `${plainContent}\n\nRead more on E-Vedhika:` : "Check out this post on E-Vedhika:";
              handleShare(
                post.title || "E-Vedhika Post",
                shareText,
                url,
                () => addToast("Link Copied!"),
                post.mediaUrl,
                post.mediaType
              );
            }}
            className="flex items-center gap-2 text-slate-500 hover:text-primary hover:bg-slate-50 px-4 py-2 rounded-xl transition-all"
          >
            <Share2 size={18} />
            <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
              Share
            </span>
          </button>
        </div>
      </div>

      <div className="pt-10 border-t mt-12 border-slate-100">
        <PostComments
          post={post}
          addToast={addToast}
          userProfile={userProfile}
          isAdmin={isAdmin}
          allUsers={allUsers}
        />
      </div>
      {showLikesModal && (
        <UsersListModal
          title="Liked By"
          uids={post.likedBy || []}
          allUsers={allUsers}
          onClose={() => setShowLikesModal(false)}
        />
      )}
      {showViewsModal && (
        <UsersListModal
          title="Viewed By"
          uids={post.viewedBy || []}
          allUsers={allUsers}
          onClose={() => setShowViewsModal(false)}
        />
      )}
    </motion.div>
  );
}

function PostComments({
  post,
  addToast,
  userProfile,
  isAdmin,
  allUsers,
}: {
  post: Post;
  addToast: (s: string) => void;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  allUsers: UserProfile[];
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showLikesModalFor, setShowLikesModalFor] = useState<{
    id: string;
    uids: string[];
  } | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "posts", post.id, "comments"),
      orderBy("time", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const fetchedComments = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setComments(fetchedComments);
        setCommentsLoaded(true);
        if (post.commentCount !== fetchedComments.length) {
          updateDoc(doc(db, "posts", post.id), {
            commentCount: fetchedComments.length,
          }).catch(() => {});
        }
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          `posts/${post.id}/comments`,
        ),
    );
    return () => unsub();
  }, [post.id, post.commentCount]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (requireLoginAlert()) return;

    setSubmittingComment(true);
    try {
      await addDoc(collection(db, "posts", post.id, "comments"), {
        text: newComment,
        time: Date.now(),
        uid: auth.currentUser!.uid,
        userName: isAdmin
          ? "Admin"
          : auth.currentUser!.displayName ||
            auth.currentUser!.email?.split("@")[0] ||
            "User",
        isAdminComment: isAdmin,
        likes: [],
        edited: false,
      });
      setNewComment("");

      await updateDoc(doc(db, "posts", post.id), {
        commentCount: increment(1),
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
        <MessageCircle
          size={24}
          className="text-accent"
          style={{ color: "#fbbf24" }}
        />
        Community Comments{" "}
        <span className="bg-slate-100 text-slate-500 text-sm py-1 px-3 rounded-full">
          {commentsLoaded ? comments.length : post.commentCount || 0}
        </span>
      </h3>
      <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200">
        <label className="block text-sm font-black text-primary mb-3">
          Add your perspective
        </label>
        {auth.currentUser && !auth.currentUser.isAnonymous ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Type your comment here..."
              className="flex-1 text-base bg-white p-4 rounded-xl border-2 border-transparent focus:border-accent outline-none shadow-sm transition-all text-slate-700"
            />
            <button
              aria-label="Post Comment"
              disabled={submittingComment || !newComment.trim()}
              onClick={handleAddComment}
              className="bg-primary text-white py-4 px-8 rounded-xl font-black uppercase tracking-wider disabled:opacity-50 hover:bg-opacity-90 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              {submittingComment ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              Post
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm font-bold text-slate-500">
              Please login to join the conversation and comment.
            </p>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {comments.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[24px]">
            <MessageCircle size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-base text-slate-400 font-bold">
              No comments yet.
            </p>
            <p className="text-sm text-slate-400">
              Be the first to start the conversation!
            </p>
          </div>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-start"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex-shrink-0 flex items-center justify-center text-slate-400 font-black border border-white shadow-sm mt-1">
              {(c.userName || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex flex-row justify-between items-center sm:items-baseline mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-black text-primary">
                    {c.userName && !c.userName.includes("@")
                      ? c.userName
                      : "User"}
                  </span>
                  {(c.isAdminComment ||
                    c.uid === "KGT2roF9bPTNhWIceHgWsJEnEnH3") && (
                    <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest flex items-center gap-0.5 shadow-sm">
                      <ShieldCheck size={8} /> Official
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-md">
                    {new Date(getValidTime(c)).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {(auth.currentUser?.uid === c.uid || isAdmin) && (
                    <button
                      onClick={async () => {
                        try {
                          await deleteDoc(
                            doc(db, "posts", post.id, "comments", c.id),
                          );
                          await updateDoc(doc(db, "posts", post.id), {
                            commentCount: increment(-1),
                          });
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed">{c.text}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => {
                    const likes = c.likes || [];
                    const uid = auth.currentUser!.uid;
                    if (!uid) {
                      addToast("Please login first");
                      return;
                    }
                    if (likes.includes(uid)) {
                      updateDoc(doc(db, "posts", post.id, "comments", c.id), {
                        likes: arrayRemove(uid),
                      });
                    } else {
                      updateDoc(doc(db, "posts", post.id, "comments", c.id), {
                        likes: arrayUnion(uid),
                      });
                    }
                  }}
                  className={`text-xs flex items-center gap-1 ${c.likes?.includes(auth.currentUser?.uid) ? "text-red-500 hover:text-slate-400" : "text-slate-400 hover:text-red-500"} group transition-colors p-1 -ml-1 rounded-md`}
                >
                  <Heart
                    size={12}
                    fill={
                      c.likes?.includes(auth.currentUser?.uid)
                        ? "currentColor"
                        : "none"
                    }
                    className="group-hover:scale-125 transition-transform"
                  />
                </button>
                <button
                  onClick={() =>
                    setShowLikesModalFor({ id: c.id, uids: c.likes || [] })
                  }
                  className="text-xs font-black text-slate-400 hover:text-primary transition-colors"
                >
                  {c.likes?.length || 0}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showLikesModalFor && (
        <UsersListModal
          title="Comment Liked By"
          uids={showLikesModalFor.uids}
          allUsers={allUsers}
          onClose={() => setShowLikesModalFor(null)}
        />
      )}
    </div>
  );
}

function AuthModal({
  onClose,
  addToast,
  handleGoogleLogin,
  districtsData,
}: {
  onClose: () => void;
  addToast: (s: string) => void;
  handleGoogleLogin: () => void;
  districtsData: Record<string, string[]>;
}) {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [surname, setSurname] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [state, setState] = useState("Telangana");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [village, setVillage] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [designation, setDesignation] = useState("");

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
        if (
          !username ||
          !email ||
          !password ||
          !name ||
          !surname ||
          (gender !== "Female" && !mobile)
        ) {
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
        const usernameDoc = await getDoc(doc(db, "usernames", lowerUsername));
        if (usernameDoc.exists()) {
          addToast("Username already taken. Choose another.");
          setLoading(false);
          return;
        }

        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = cred.user;
        await updateProfile(user, { displayName: username });

        // Reserve username
        await setDoc(doc(db, "usernames", lowerUsername), { uid: user.uid });

        // Save Profile
        await setDoc(doc(db, "users", user.uid), {
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
          time: Date.now(),
        });

        if (designation === "Citizen") {
          Swal.fire({
            title: "సిటిజన్ గారికి నమస్కారం",
            text: "ప్రస్తుతం ఈ వేదిక Webportal సిటిజన్ సర్వీస్ ఇంకా అందుబాటులోకి రాలేదు. రాగానే మీ మొబైల్ నెంబర్ కి మెసేజ్ లేదా ఇమెయిల్ ద్వారా మీకు సమాచారం ఇవ్వడం జరుగుతుంది.",
            icon: "info",
            confirmButtonText: "సరే (OK)",
            confirmButtonColor: "#0d3b66",
          });
        } else {
          addToast("Account created successfully!");
        }
        onClose();
      }
    } catch (err: any) {
      addToast(getFriendlyError(err));
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
          <button
            aria-label="Close auth modal"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 text-white/60 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>

          <div className="mb-0.5">
            <EVAnimatedLogo size={24} />
          </div>

          <h2
            className="text-lg font-black uppercase tracking-widest leading-none mb-0.5"
            style={{
              color: "#fbe947",
              fontFamily: '"Arial Black", Impact, sans-serif',
            }}
          >
            E<span style={{ color: "#facc15" }}>-</span>VEDHIKA
          </h2>
          <p className="text-[7px] font-black text-white/50 uppercase tracking-[0.2em]">
            Access Your Portal
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 bg-white custom-scrollbar">
          <div className="mb-2 text-center">
            <h3 className="text-sm font-black text-[#0f2e4a] tracking-tight leading-none">
              {isSignup ? "Create Account" : "Welcome Back"}
            </h3>
            <p className="text-[8px] font-bold text-slate-400 mt-0.5">
              {isSignup
                ? "Fill in your details to get started."
                : "Sign in with your credentials."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-1.5">
            {isSignup && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                      Surname *
                    </label>
                    <input
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder="Surname"
                      required
                      className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                      Name *
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      required
                      className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                    Username / Display Name *
                  </label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Display name"
                    required
                    className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => {
                        setGender(e.target.value);
                        if (e.target.value === "Female") setMobile("");
                      }}
                      className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
                    >
                      <option value="">Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  {gender !== "Female" && (
                    <div>
                      <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                        Mobile No *
                      </label>
                      <input
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="Phone"
                        required
                        className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                      State
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
                    >
                      <option>Telangana</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                      District
                    </label>
                    <select
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        setMandal("");
                      }}
                      className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
                    >
                      <option value="">Select District</option>
                      {Object.keys(districtsData)
                        .sort()
                        .map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                      Mandal
                    </label>
                    <select
                      value={mandal}
                      onChange={(e) => setMandal(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
                      disabled={!district}
                    >
                      <option value="">Select Mandal</option>
                      {mandals.map((m, idx) => (
                        <option key={`${m}_${idx}`} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                      Village / GP
                    </label>
                    <input
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="Enter Village"
                      className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                    Designation
                  </label>
                  <input
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Type Designation"
                    className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                Email Address *
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="email@example.com"
                required
                className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
              />
            </div>

            <div className={isSignup ? "grid grid-cols-2 gap-2" : ""}>
              <div>
                <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                  Password *
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
                />
              </div>
              {isSignup && (
                <div>
                  <label className="text-[8px] font-black text-[#0f2e4a] uppercase mb-0.5 block tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    required
                    className="w-full bg-white border border-slate-200 focus:border-[#0f2e4a]/30 px-2 py-1.5 rounded-lg outline-none font-bold text-[10px] text-slate-700 transition-colors"
                  />
                </div>
              )}
            </div>

            <button
              aria-label={isSignup ? "Register Now" : "Sign In Now"}
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f2e4a] text-white py-1.5 rounded-[6px] font-black uppercase text-[9px] tracking-widest shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-px disabled:opacity-50 disabled:transform-none flex justify-center items-center gap-1.5"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" size={12} />
              ) : isSignup ? (
                "Register Now"
              ) : (
                "Sign In Now"
              )}
            </button>
          </form>

          {!isSignup && (
            <>
              <div className="my-2 flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-100"></div>
                <span className="text-[7px] font-black text-slate-300 uppercase">
                  OR
                </span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>

              <button
                aria-label="Continue with Google"
                type="button"
                onClick={handleGoogleLogin}
                className="w-full border border-slate-200 py-1.5 rounded-[6px] font-black text-[#0f2e4a] text-[8px] uppercase flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm"
              >
                <svg width="12" height="12" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          <div className="mt-3 text-center pb-1">
            <button
              aria-label={isSignup ? "Switch to Sign In" : "Switch to Sign Up"}
              onClick={() => setIsSignup(!isSignup)}
              className="text-[#0f2e4a] font-black text-[8px] uppercase underline underline-offset-2 hover:text-[#0a2034] transition-colors"
            >
              {isSignup
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PollsScreen({
  user,
  addToast,
}: {
  user: any;
  addToast: (msg: string) => void;
}) {
  const [polls, setPolls] = useState<any[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "polls"), orderBy("createdAt", "desc")),
      (snap) => {
        setPolls(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching polls:", error);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return addToast("లాగిన్ అవసరం (Login required)");
    if (!newPollQuestion.trim() || newPollOptions.some((opt) => !opt.trim()))
      return addToast("అన్ని వివరాలు నింపండి (Fill all fields)");

    try {
      await addDoc(collection(db, "polls"), {
        question: newPollQuestion,
        options: newPollOptions.map((opt) => ({ text: opt, votes: 0 })),
        votedBy: {},
        createdBy: user.uid,
        createdAt: Date.now(),
      });
      setNewPollQuestion("");
      setNewPollOptions(["", ""]);
      addToast("పోల్ విజయవంతంగా సృష్టించబడింది (Poll created)");
    } catch (err: any) {
      addToast(getFriendlyError(err));
    }
  };

  const handleVote = async (
    pollId: string,
    optionIndex: number,
    currentPoll: any,
  ) => {
    if (!user) return addToast("లాగిన్ అవసరం (Login required)");
    if (currentPoll.votedBy[user.uid] !== undefined)
      return addToast("మీరు ఇప్పటికే ఓటు వేశారు (Already voted)");

    try {
      const pollRef = doc(db, "polls", pollId);
      const newOptions = [...currentPoll.options];
      newOptions[optionIndex].votes += 1;

      await updateDoc(pollRef, {
        options: newOptions,
        [`votedBy.${user.uid}`]: optionIndex,
      });
      addToast("మీ ఓటు నమోదైంది (Vote recorded)");
    } catch (err: any) {
      addToast(getFriendlyError(err));
    }
  };

  return (
    <div className="space-y-6">
      <AdBanner />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
          <Vote size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            ప్రజాభిప్రాయ సేకరణ (Polls)
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Village Voting & Opinions
          </p>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Plus size={16} className="text-primary" /> కొత్త పోల్ సృష్టించండి
          (Create Poll)
        </h3>
        <form onSubmit={handleCreatePoll} className="space-y-4">
          <input
            type="text"
            value={newPollQuestion}
            onChange={(e) => setNewPollQuestion(e.target.value)}
            placeholder="ప్రశ్న (ఉదా: ముందుగా ఏ పని చేయాలి? పార్క్ లేదా రోడ్డు?)"
            className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 text-sm font-bold placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
          <div className="space-y-2">
            {newPollOptions.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...newPollOptions];
                    newOpts[i] = e.target.value;
                    setNewPollOptions(newOpts);
                  }}
                  placeholder={`ఆప్షన్ (Option) ${i + 1}`}
                  className="flex-1 bg-slate-50 border-slate-100 rounded-2xl p-4 text-sm font-bold placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
                {i >= 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setNewPollOptions(
                        newPollOptions.filter((_, idx) => idx !== i),
                      )
                    }
                    className="p-4 text-slate-400 hover:text-danger bg-slate-50 rounded-2xl transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setNewPollOptions([...newPollOptions, ""])}
            className="text-[10px] font-black text-primary hover:text-blue-700 transition-colors flex items-center gap-1 uppercase tracking-widest pl-1 mt-2"
          >
            <Plus size={14} /> యాడ్ ఆప్షన్ (Add Option)
          </button>
          <button
            type="submit"
            className="w-full mt-4 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform uppercase tracking-widest text-sm"
          >
            పబ్లిష్ చేయండి (Publish Poll)
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 mx-auto border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-bold">
            ఇంకా ఎటువంటి పోల్స్ లేవు (No polls yet)
          </div>
        ) : (
          polls.map((poll) => {
            const totalVotes = poll.options.reduce(
              (acc: number, opt: any) => acc + opt.votes,
              0,
            );
            const userVotedIndex = user ? poll.votedBy[user.uid] : undefined;

            return (
              <div
                key={poll.id}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-bl-xl font-black">
                  {totalVotes} Votes
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 mb-4 mt-2 pr-12">
                  {poll.question}
                </h3>
                <div className="space-y-3">
                  {poll.options.map((opt: any, i: number) => {
                    const percent =
                      totalVotes > 0
                        ? Math.round((opt.votes / totalVotes) * 100)
                        : 0;
                    const isSelected = userVotedIndex === i;
                    return (
                      <button
                        key={i}
                        onClick={() => handleVote(poll.id, i, poll)}
                        disabled={userVotedIndex !== undefined}
                        className={`w-full relative overflow-hidden rounded-xl border text-left transition-all ${userVotedIndex !== undefined ? (isSelected ? "border-primary bg-blue-50/50" : "border-slate-100 bg-slate-50 opacity-70") : "border-slate-100 bg-white hover:border-primary/50 hover:bg-slate-50"}`}
                      >
                        <div
                          className={`absolute top-0 left-0 bottom-0 transition-all duration-1000 ${isSelected ? "bg-blue-100" : "bg-slate-200/50"}`}
                          style={{ width: `${percent}%` }}
                        />
                        <div className="relative p-4 flex justify-between items-center z-10">
                          <span
                            className={`text-sm font-bold ${isSelected ? "text-primary" : "text-slate-700"}`}
                          >
                            {opt.text}
                          </span>
                          {userVotedIndex !== undefined && (
                            <span
                              className={`text-xs font-black ${isSelected ? "text-primary" : "text-slate-400"}`}
                            >
                              {percent}%
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wider">
                  <span className="uppercase">
                    Created:{" "}
                    {new Date(poll.createdAt).toLocaleDateString("en-IN")}
                  </span>
                  <button
                    onClick={() => {
                      const shareText = `దయచేసి ఈ పోల్ లో పాల్గొనండి:\n*${poll.question}*\n\nమా గ్రామం యాప్ లో ఓటు వేయడానికి కింది లింక్ ద్వారా వెళ్ళండి:\n${window.location.origin}`;
                      if (navigator.share) {
                        navigator
                          .share({ title: "Vote in Poll", text: shareText })
                          .catch(console.error);
                      } else {
                        window.open(
                          `https://wa.me/?text=${encodeURIComponent(shareText)}`,
                          "_blank",
                        );
                      }
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors uppercase tracking-widest"
                  >
                    <Share2 size={14} /> Share Poll
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SuggestionForm({
  addToast,
  onCancel,
}: {
  addToast: (s: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [mobile, setMobile] = useState("");
  const [category, setCategory] = useState("General Suggestion");
  const [suggestion, setSuggestion] = useState("");
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
        userEmail: auth.currentUser?.email || "",
        userId: auth.currentUser?.uid || "",
        village: village || "Not specified",
        mobile: mobile || "Not specified",
        category,
        suggestion: suggestion,
        text: suggestion,
        status: "pending",
        time: Date.now(),
        createdAt: Date.now(),
      });
      await logUserActivity(`Submitted Suggestion: ${category}`);
      setSubmitted(true);
      addToast("మీ సూచన విజయవంతంగా పంపబడింది!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "suggestions");
      addToast("Error submitting suggestion");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-10 text-center space-y-6 bg-white rounded-[24px]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner"
        >
          <CheckCircle2 size={40} />
        </motion.div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
          విజయవంతంగా పంపబడింది!
        </h2>
        <p className="text-slate-500 font-bold">
          మీ సూచన మా దృష్టికి వచ్చింది. ధన్యవాదాలు.
        </p>

        <div className="gap-3 flex flex-col pt-4">
          <button
            aria-label="Send another suggestion"
            onClick={() => {
              setSubmitted(false);
              setName("");
              setVillage("");
              setMobile("");
              setCategory("General Suggestion");
              setSuggestion("");
            }}
            className="bg-[#a855f7] text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90"
          >
            మరో సూచన పంపండి
          </button>
          <button
            aria-label="Go back"
            onClick={onCancel}
            className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200"
          >
            తిరిగి వెళ్ళండి
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 overflow-hidden rounded-[24px] bg-white">
      <div className="bg-[#a855f7] p-8 text-white relative">
        <h2 className="text-2xl font-black tracking-tighter">
          Portal Feedback & Suggestions
        </h2>
        <p className="text-white/80 font-bold text-sm">
          మీ విలువైన సూచనలను ఇక్కడ తెలియజేయండి
        </p>
        <button
          aria-label="Close suggestion form"
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              మీ పేరు
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Name"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#a855f7]/50 font-bold text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              మొబైల్ నంబర్ (ఐచ్ఛికం)
            </label>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              maxLength={10}
              placeholder="Mobile Number"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#a855f7]/50 font-bold text-slate-700"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            విలేజ్ / మండలం
          </label>
          <input
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="Village / Mandal"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#a855f7]/50 font-bold text-slate-700"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            విభాగం
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#a855f7]/50 font-bold text-slate-700 appearance-none"
          >
            <option value="General Suggestion">General Suggestion</option>
            <option value="App Improvement">App Improvement</option>
            <option value="Service Feedback">Service Feedback</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Request Feature">Request Feature</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            మీ సూచన
          </label>
          <textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="మీ సూచనను ఇక్కడ వ్రాయండి..."
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#a855f7]/50 min-h-[120px] font-bold text-slate-700"
          />
        </div>

        <div className="flex gap-4 pt-2">
          <button
            aria-label="Submit Suggestion"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="flex-1 bg-[#a855f7] text-white py-4 rounded-2xl font-black shadow-lg hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? "పంపిస్తున్నాము..." : "Submit Suggestion"}
          </button>
        </div>
      </div>
    </div>
  );
}

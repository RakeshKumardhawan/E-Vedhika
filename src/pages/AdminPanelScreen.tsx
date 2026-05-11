import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, MapPin, Search, Download, Trash2, ArrowLeft, Loader2, Send } from 'lucide-react';
import { AlertCircle, FileText, CheckCircle2, MessageSquare, AlertOctagon, Info, Flag, Building, User, Users, ClipboardList, Clock, Zap, Hash, X, Activity, PlusCircle, LogOut, Lock, RefreshCw, ShieldAlert, Settings, Menu, AlertTriangle, Megaphone, RotateCcw, Edit3, EyeOff, Eye, ChevronRight, Upload, Calendar, Database, ChevronDown, Bot } from 'lucide-react';
import Swal from 'sweetalert2';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { collection, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy, limit, addDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { UserProfile, handleFirestoreError, OperationType, LocationManager, getValidTime, formatPostTitle, playNotificationSound } from '../App';
import { GosAndFormatsAdmin } from '../GosAndFormats';
import { BarChart, XAxis, YAxis, Tooltip as RechartsTooltip, Bar, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

let XLSX: any = null;
let jsPDF: any = null;
let autoTable: any = null;

const loadHeavyModulesAdmin = async () => {
  if (!XLSX) XLSX = await import('xlsx');
  if (!jsPDF) {
    const j = await import('jspdf');
    jsPDF = j.default;
  }
  if (!autoTable) {
    const a = await import('jspdf-autotable');
    autoTable = a.default;
  }
};

export default function AdminPanel({ addToast, posts, problems, suggestions, users, user, setAdminLocked, adminLocked, notifications, requests, updates, userRole, onExit, onNewPost, onEditPost, isDevEmail, currentAdminPin, setCurrentAdminPin, districtsData }: any) {
  const isAdmin = userRole === 'admin' || isDevEmail;
  const isEditor = userRole === 'admin' || userRole === 'editor' || isDevEmail;
  const [activeSubTab, setActiveSubTab] = useState('dash');
  const [usersFilter, setUsersFilter] = useState<'All' | 'Deleted'>('All');
  const [userSearchTerm, setUserSearchTerm] = useState('');
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

  const handleRestartServer = async () => {
    try {
      const res = await fetch('/api/admin/restart', { method: 'POST' });
      if (res.ok) {
        addToast("Application server is restarting in the background. It will be back shortly.");
      } else {
        addToast("Failed to restart server.");
      }
    } catch(err) {
      addToast("Failed to initiate restart sequence.");
    }
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
                { id: 'gos_formats', label: 'Applications, Formats & GOs', icon: <FileText size={18}/> },
                { id: 'users', label: 'User Access & Directory', icon: <Users size={18}/> },
                { id: 'errors', label: 'App Errors (Auto-Bot)', icon: <AlertCircle size={18}/> },
                { id: 'trash', label: 'Recycle Bin', icon: <Trash2 size={18}/> },
                { id: 'updates', label: 'Flash News', icon: <Zap size={18}/> },
                { id: 'changelog', label: "What's New", icon: <Info size={18}/> },
                { id: 'logs', label: 'Security Logs', icon: <ShieldAlert size={18}/> },
                { id: 'settings', label: 'System Config', icon: <Settings size={18}/> },
                { id: 'locations', label: 'Manage Locations', icon: <MapPin size={18}/> }
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
              {isAdmin && (
                <button aria-label="Restart Server" onClick={handleRestartServer} className="w-full flex items-center gap-3 p-2.5 lg:p-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-400/10 transition-all">
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
                {activeSubTab === 'gos_formats' && '📑 Applications, Formats & GOs Management'}
                {activeSubTab === 'users' && '👥 User Access & Directory'}
                {activeSubTab === 'trash' && '🗑️ Recycle Bin System'}
                {activeSubTab === 'logs' && '🛡️ Security Audits'}
                {activeSubTab === 'settings' && '⚙️ System Settings'}
                {activeSubTab === 'locations' && '🗺️ Location Management'}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-4">Users per District</h4>
                <div className="h-64 min-h-[256px]">
                   <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={Object.entries(users.filter(u => !u.isDeleted).reduce((acc: any, curr: any) => { const d = curr.district || 'Unknown'; acc[d] = (acc[d] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value }))}>
                         <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                         <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                         <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                         <Bar dataKey="value" fill="#0891b2" radius={[6, 6, 0, 0]} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-4">Post Status Overview</h4>
                <div className="h-64 min-h-[256px]">
                   <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                         <Pie 
                            data={Object.entries(posts.filter(p => !p.isDeleted).reduce((acc: any, curr: any) => { const s = curr.status || 'pending'; acc[s] = (acc[s] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name: name.charAt(0).toUpperCase()+name.slice(1), value }))} 
                            dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}
                         >
                            {
                              Object.entries(posts.filter(p => !p.isDeleted).reduce((acc: any, curr: any) => { const s = curr.status || 'pending'; acc[s] = (acc[s] || 0) + 1; return acc; }, {})).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#6366f1'][index % 5]} />
                              ))
                            }
                         </Pie>
                         <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>

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
                   <button aria-label="Export Reports" onClick={async () => {
                       addToast("Generating Export Data...");
                       if (!XLSX) await loadHeavyModulesAdmin();
                       const isPosts = activeSubTab === 'reports' ? reportsType === 'posts' : false;
                       const ds = activeSubTab === 'suggestions' ? suggestions : (isPosts ? posts : problems);
                       const exportData = ds.map((item: any) => ({
                           Title: item.title || item.type || '',
                           Description: item.desc || item.text || '',
                           Category: item.category || '',
                           Status: item.status || 'pending',
                           District: item.district || '',
                           Mandal: item.mandal || '',
                           Panchayat: item.panchayat || '',
                           Author: item.authorName || '',
                           Date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''
                       }));
                       const ws = XLSX.utils.json_to_sheet(exportData);
                       const wb = XLSX.utils.book_new();
                       XLSX.utils.book_append_sheet(wb, ws, "Reports");
                       XLSX.writeFile(wb, "reports_export.xlsx");
                       addToast("Export complete.");
                   }} className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border bg-green-50 border-green-100 text-green-700 hover:bg-green-600 hover:text-white flex items-center gap-2 shadow-sm">
                     <Download size={14} /> Export XLS
                   </button>
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
                                      {item.title && <h4 className="text-sm font-black text-slate-800 mb-2 whitespace-pre-wrap">{formatPostTitle(item.title)}</h4>}
                                      {activeSubTab === 'reports' && reportsType === 'posts' ? (
                                        <div className="text-[12px] text-slate-700 font-medium leading-relaxed whitespace-pre-wrap [&_pre]:bg-slate-800 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:text-rose-500 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:px-0 [&_pre_code]:py-0 [&_p]:mb-2 [&_a]:text-blue-600 [&_a]:underline">
                                          <ReactMarkdown remarkPlugins={[remarkBreaks]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>{item.content || ""}</ReactMarkdown>
                                          <div className="mt-6 pt-4 border-t border-slate-200">
                                            <details className="group">
                                              <summary className="cursor-pointer text-sm font-black text-primary flex items-center gap-2 select-none mb-2">
                                                <MessageCircle size={16} /> 
                                                <span>Manage Comments ({item.commentCount || 0})</span>
                                              </summary>
                                              <div className="pt-4 bg-white/50 rounded-xl p-4">
                                                <PostComments post={item} addToast={addToast} userProfile={null} isAdmin={isAdmin} allUsers={users} />
                                              </div>
                                            </details>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-[12px] text-slate-700 font-bold leading-relaxed italic whitespace-pre-wrap">
                                          "{item.msg || item.content || item.text || item.problem || item.suggestion}"
                                        </p>
                                      )}
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
        {activeSubTab === 'gos_formats' && (
           <div className="space-y-12 pb-20">
              <GosAndFormatsAdmin user={user} addToast={addToast} isAdmin={isAdmin} />
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search by name, email, role..." 
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2.5 rounded-2xl text-xs border border-slate-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button aria-label="Export Data" onClick={async () => {
                          addToast("Generating Export Data...");
                          if (!XLSX) await loadHeavyModulesAdmin();
                          const exportData = users.map((u: any) => ({
                              Name: u.name || '',
                              Email: u.email || '',
                              Surname: u.surname || '',
                              Phone: u.mobile || '',
                              District: u.district || '',
                              Mandal: u.mandal || '',
                              Village: u.panchayat || '',
                              Designation: u.designation || '',
                              Role: u.role || 'user',
                              Status: u.isDeleted ? 'Deleted' : 'Active',
                              Joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''
                          }));
                          const ws = XLSX.utils.json_to_sheet(exportData);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Users");
                          XLSX.writeFile(wb, "users_export.xlsx");
                          addToast("Export complete.");
                      }} className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border bg-green-50 border-green-100 text-green-700 hover:bg-green-600 hover:text-white flex items-center gap-2 shadow-sm">
                        <Download size={14} /> Export XLS
                      </button>
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {users.filter(u => {
                      const isMatchFilter = usersFilter === 'Deleted' ? (u.isDeleted || u.role === 'deleted') : (!u.isDeleted && u.role !== 'deleted');
                      if (!isMatchFilter) return false;
                      if (!userSearchTerm) return true;
                      const term = userSearchTerm.toLowerCase();
                      return (u.username || '').toLowerCase().includes(term) || 
                             (u.email || '').toLowerCase().includes(term) || 
                             (u.role || '').toLowerCase().includes(term) ||
                             (u.id || '').toLowerCase().includes(term);
                   }).sort((a, b) => (b.time || 0) - (a.time || 0)).map(u => (
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
                                                          await updateDoc(doc(db, 'users', item.id), { isDeleted: false, role: (item.role && item.role !== 'deleted') ? item.role : 'user' });
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
                    confirmButtonText: 'Post Update',
                    confirmButtonColor: '#2563eb',
                    preConfirm: () => {
                      const version = (document.getElementById('update-version') as HTMLInputElement).value;
                      const title = (document.getElementById('update-title') as HTMLInputElement).value;
                      const badge = (document.getElementById('update-badge') as HTMLInputElement).value;
                      const text = (document.getElementById('update-text') as HTMLTextAreaElement).value;
                      const visibility = (document.getElementById('update-visibility') as HTMLSelectElement).value;
                      if (!text) {
                        Swal.showValidationMessage('Content cannot be empty!');
                        return null;
                      }
                      return { text, visibility, version, title, badge };
                    }
                  }).then((result) => {
                    if (result.isConfirmed && result.value) {
                      addDoc(collection(db, 'updates'), {
                        text: result.value.text,
                        visibility: result.value.visibility,
                        version: result.value.version || null,
                        title: result.value.title || null,
                        badge: result.value.badge || null,
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
                {updates.filter(u => (u.type === 'changelog' || u.status === 'Approved') && u.status?.toLowerCase() !== 'deleted').sort((a:any, b:any) => (b.time || 0) - (a.time || 0)).map((upd: any) => (
                  <div key={upd.id} className={`p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow group ${upd.isSystemElement ? 'opacity-80' : ''}`}>
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`${upd.isSystemElement ? 'bg-indigo-500' : (upd.visibility === 'internal' ? 'bg-amber-500' : 'bg-blue-500')} w-2 h-2 rounded-full animate-pulse`} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date(getValidTime(upd)).toLocaleString()}
                          </span>
                          {upd.isSystemElement && (
                             <span className="px-2 py-0.5 ml-2 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase">System Event</span>
                          )}
                          {!upd.isSystemElement && upd.visibility === 'internal' && (
                             <span className="px-2 py-0.5 ml-2 bg-amber-100 text-amber-700 rounded text-[9px] font-bold uppercase">Internal Only</span>
                          )}
                          {!upd.isSystemElement && (!upd.visibility || upd.visibility === 'public') && (
                             <span className="px-2 py-0.5 ml-2 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase">Public</span>
                          )}
                        </div>
                        {upd.isSystemElement ? (
                          <div className="scale-90 transform origin-top-left">
                            {upd.text}
                          </div>
                        ) : (upd.version || upd.title || upd.badge) ? (
                          <div className="text-left space-y-3 mt-2">
                            {(upd.version || upd.title) && (
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                {upd.version && <kbd className="bg-slate-800 text-white px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-widest">{upd.version}</kbd>}
                                {upd.title && <p className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">{upd.title}</p>}
                              </div>
                            )}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                              <div className="flex gap-3 items-start">
                                {upd.badge && <kbd className={`px-2 py-1 rounded text-[9px] font-black uppercase mt-0.5 whitespace-nowrap ${upd.visibility === 'internal' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{upd.badge}</kbd>}
                                <span className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{upd.text}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">{upd.text}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button aria-label="Edit Update"
                          onClick={() => {
                            Swal.fire({
                              title: 'Edit Update',
                              html: `
                                <div class="text-left mb-2 text-sm font-semibold text-slate-700">Version (Optional)</div>
                                <input id="edit-update-version" class="swal2-input mt-0 mb-4" value="${upd.version || ''}" placeholder="e.g. v1.4.1">
                                <div class="text-left mb-2 text-sm font-semibold text-slate-700">Title / Category (Optional)</div>
                                <input id="edit-update-title" class="swal2-input mt-0 mb-4" value="${upd.title || ''}" placeholder="e.g. Applications & GOs">
                                <div class="text-left mb-2 text-sm font-semibold text-slate-700">Badge/Tag (Optional)</div>
                                <input id="edit-update-badge" class="swal2-input mt-0 mb-4" value="${upd.badge || ''}" placeholder="e.g. NEW UI or ADMIN">
                                <div class="text-left mb-2 text-sm font-semibold text-slate-700">Content</div>
                                <textarea id="edit-update-text" class="swal2-textarea mt-0 mb-4">${upd.text}</textarea>
                                <div class="text-left mb-2 text-sm font-semibold text-slate-700">Visibility</div>
                                <select id="edit-update-visibility" class="swal2-select w-full mt-0">
                                  <option value="public" ${(!upd.visibility || upd.visibility === 'public') ? 'selected' : ''}>Public (Visible to everyone)</option>
                                  <option value="internal" ${(upd.visibility === 'internal') ? 'selected' : ''}>Admin Panel Only (Hidden from public)</option>
                                </select>
                              `,
                              showCancelButton: true,
                              confirmButtonText: 'Save Changes',
                              confirmButtonColor: '#2563eb',
                              preConfirm: () => {
                                const text = (document.getElementById('edit-update-text') as HTMLTextAreaElement).value;
                                const visibility = (document.getElementById('edit-update-visibility') as HTMLSelectElement).value;
                                const version = (document.getElementById('edit-update-version') as HTMLInputElement).value;
                                const title = (document.getElementById('edit-update-title') as HTMLInputElement).value;
                                const badge = (document.getElementById('edit-update-badge') as HTMLInputElement).value;
                                if (!text) {
                                  Swal.showValidationMessage('Content cannot be empty!');
                                  return null;
                                }
                                return { text, visibility, version, title, badge };
                              }
                            }).then((result) => {
                              if (result.isConfirmed) {
                                const newVals = result.value;
                                if (newVals.text !== upd.text || newVals.visibility !== upd.visibility || newVals.version !== upd.version || newVals.title !== upd.title || newVals.badge !== upd.badge) {
                                  setDoc(doc(db, 'updates', upd.id), { 
                                    ...upd,
                                    text: newVals.text, 
                                    visibility: newVals.visibility,
                                    version: newVals.version || null,
                                    title: newVals.title || null,
                                    badge: newVals.badge || null,
                                    updatedAt: Date.now()
                                  }, { merge: true })
                                  .then(() => addToast("Update modified successfully!"))
                                  .catch(err => handleFirestoreError(err, OperationType.UPDATE, `updates/${upd.id}`));
                                }
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
                                  await setDoc(doc(db, 'updates', upd.id), { ...upd, status: 'Deleted', deletedAt: Date.now() }, { merge: true });
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

        {activeSubTab === 'locations' && (
           <LocationManager districtsData={districtsData} addToast={addToast} />
        )}

        {activeSubTab === 'errors' && (
           <ErrorsHub isAdmin={isAdmin} />
        )}
      </main>
    </div>
  );
}

function ErrorsHub({ isAdmin }: { isAdmin: boolean }) {
  const [errors, setErrors] = useState<any[]>([]);
  
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(query(collection(db, 'app_errors'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
      setErrors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [isAdmin]);

  const unresolved = errors.filter(e => e.status !== 'resolved');

  return (
    <div className="space-y-6">
      <div className="bg-white/80 p-6 rounded-[32px] border border-red-100 shadow-sm">
        <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
          <AlertTriangle className="text-red-500" />
          Application Error Logs
          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs ml-2">
            {unresolved.length} Unresolved
          </span>
        </h3>
        
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {errors.map(err => (
            <div key={err.id} className={`p-4 rounded-2xl border ${err.status === 'resolved' ? 'bg-slate-50 border-slate-200' : 'bg-red-50/50 border-red-100'}`}>
               <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-slate-800 font-mono text-red-600 break-all">{err.message}</h4>
                  <button 
                    onClick={async () => {
                      await updateDoc(doc(db, 'app_errors', err.id), { status: err.status === 'resolved' ? 'pending' : 'resolved' });
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-full ${err.status === 'resolved' ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-green-700'}`}
                  >
                    {err.status === 'resolved' ? 'Mark Pending' : 'Mark Resolved'}
                  </button>
               </div>
               {err.stack && (
                 <pre className="mt-2 text-[10px] text-slate-600 bg-white/60 p-2 rounded-lg overflow-x-auto">
                   {err.stack}
                 </pre>
               )}
               <div className="mt-2 text-[10px] text-slate-500 flex gap-4">
                 <span>URL: {err.url}</span>
                 <span>Time: {err.timestamp ? new Date(err.timestamp.seconds * 1000).toLocaleString() : 'Just now'}</span>
               </div>
            </div>
          ))}
          {errors.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
              Everything looks good! No recent errors.
            </div>
          )}
        </div>
      </div>

      <SmartAssistant 
        title="AI Debugger (Gemini Pro)" 
        placeholder="Ask the AI Bot to analyze these errors and suggest a fix..." 
        systemInstruction={`You are an expert AI debugger. Analyze the following recent app errors and provide a technical root-cause and clear code-level fix. Recent Errors Data (top 15): ${JSON.stringify(errors.slice(0,15))}`} 
        icon={Bot} 
      />
    </div>
  );
}

export function StatCard({ label, val, color, subText }: { label: string, val: number, color: string, subText?: string }) {
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
      className="p-4 rounded-[24px] border border-transparent shadow-sm transition-all hover:shadow-lg group cursor-default h-full flex flex-col justify-between" 
      style={{ background: theme.bg, borderColor: theme.border }}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: theme.text }}>{label}</div>
          <div className="p-1.5 rounded-lg bg-white/50 shadow-inner group-hover:bg-white transition-colors">
            <Icon size={14} style={{ color: theme.text }} strokeWidth={2.5} />
          </div>
        </div>
        <div className="text-3xl font-black tracking-tight" style={{ color: theme.text }}>{val}</div>
      </div>
      
      {subText ? (
        <div className="mt-2 pt-2 border-t border-current/10 flex items-center gap-1.5 overflow-hidden">
          <Clock size={10} style={{ color: theme.text }} className="shrink-0" />
          <span className="text-[9px] font-black uppercase text-current whitespace-nowrap opacity-60" style={{ color: theme.text }}>{subText}</span>
        </div>
      ) : (
        <div className="h-1 w-8 rounded-full mt-3 bg-current opacity-20" style={{ color: theme.text }}></div>
      )}
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
          <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>{response}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function UsersListModal({ title, uids, allUsers, onClose }: { title: string, uids: string[], allUsers: UserProfile[], onClose: () => void }) {
  const usersList = uids.map(uid => allUsers.find(u => u.id === uid) || { id: uid, username: 'Unknown User', name: '', surname: '', designation: '' });

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

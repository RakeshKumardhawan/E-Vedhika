import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Share2, BarChart3, Layers, GraduationCap, Book, FileText, Download, CheckCircle, Upload, Search, Users, Eye, Building2, UserCheck, XCircle, ArrowRight, Play, UploadCloud, Clock, ShieldCheck, Mail, MapPin, Calendar, Database, ChevronDown, ChevronRight, Hash, Info, Lock, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import Swal from 'sweetalert2';
import { PR_ACT_DB, PRSection } from '../data/prActData';
import { handleShare } from '../App';
import { StatCard } from './AdminPanelScreen';
import { PRActHub } from './KnowledgeHubScreen';
import { User as FirebaseUser } from 'firebase/auth';

let XLSX: any = null;
let jsPDF: any = null;
let autoTable: any = null;

const loadHeavyModulesWorkspace = async () => {
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

export default function DigitalWorkspaceSection({ addToast, user }: { addToast: (s:string) => void, user: FirebaseUser | null }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools = [
    { id: 'dsr', title: 'DSR Analyzer', icon: BarChart3, desc: 'Analyze Daily Status Reports' },
    { id: 'multiday', title: 'Multi-Day attendance', icon: Layers, desc: 'Multiple Attendance Records' },
    { id: 'training', title: 'Digital Training', icon: GraduationCap, desc: 'Workflows & Tutorials' },
    { id: 'pract', title: 'PR Act Hub', icon: Book, desc: 'A to Z Interactive Guide' }
  ];

  return (
    <div className="section-card card-blue relative">
      <div className="flex justify-between items-start mb-1">
        <div>
          <motion.h2 
            initial={{ x: -10, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }}
            style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <LayoutDashboard size={24} style={{ color: '#0891b2' }} /> Mana Panchayath
          </motion.h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Advanced tools for PR & RD Officers.</p>
        </div>
        <button 
          onClick={() => {
            const url = `${window.location.origin}/?tab=workspace`;
            handleShare('Mana Panchayath - E-Vedhika', 'Access advanced tools for PR & RD Officers on Mana Panchayath - E-Vedhika!', url, () => addToast("Link copied!"));
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider h-fit mt-1"
          title="Share Mana Panchayath"
        >
          <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
        </button>
      </div>

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
             </div>

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


const FormsHub = lazy(() => import("./FormsHubScreen"));


const DirectorySection = lazy(() => import("./DirectoryScreen"));

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
    await loadHeavyModulesWorkspace();
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
    await loadHeavyModulesWorkspace();
    if (rawRows.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet(rawRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Combined Raw Data");
    XLSX.writeFile(wb, `MultiDay_Combined_Raw_${new Date().toLocaleDateString()}.xlsx`);
    addToast("మొత్తం కలిపిన Raw డేటా డౌన్లోడ్ అవుతోంది...");
  };

  const downloadRawPdf = async () => {
    await loadHeavyModulesWorkspace();
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
    await loadHeavyModulesWorkspace();
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
    await loadHeavyModulesWorkspace();
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
    await loadHeavyModulesWorkspace();
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

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
        await loadHeavyModulesWorkspace();
        setUploadProgress(50);
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
        setIsProcessing(false);
        setUploadProgress(0);
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
        const isD = (dsrStatusRaw.includes("entered") && !dsrStatusRaw.includes("not")) || dsrStatusRaw.includes("yes") || dsrStatusRaw.includes("✅") || dsrStatusRaw.includes("uploaded") || (dsrTimeStr && dsrTimeStr.length > 3 && dsrTimeStr.includes(":"));
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
        
        // Count DSR vs Pending
        if (isD) dsr++;
        else if (!isM && !isT && !isL) pending++;
        
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
        setIsProcessing(false);
        setUploadProgress(0);
        addToast("ప్రాసెస్ చేయబడింది, కానీ డేటా ఏమీ దొరకలేదు. ఫైల్ ఫార్మార్ట్ ఒకసారి చూడండి.");
        return;
      }

      setData(processed);
      setFilteredData(processed);
      setStats({ total: processed.length, present, dsr, pending, meeting, training, leave, before901, after900 });
      // @ts-ignore
      setMandalSummaries(Object.fromEntries(mandalStats));
      setLastUpdateTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setUploadProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setUploadProgress(0);
      }, 500);
      addToast(`విజయవంతంగా ప్రాసెస్ చేయబడింది! ${processed.length} గ్రామ పంచాయతీలు దొరికాయి. 🚀`);
      } catch (err) {
        console.error("DSR Processing Error:", err);
        setIsProcessing(false);
        setUploadProgress(0);
        addToast("ఫైల్ ప్రాసెస్ చేయడంలో లోపం సంభవించింది. దయచేసి మళ్ళీ ప్రయత్నించండి.");
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
    await loadHeavyModulesWorkspace();
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
    await loadHeavyModulesWorkspace();
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
    await loadHeavyModulesWorkspace();
    if (rawJson.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet(rawJson);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Raw Data");
    XLSX.writeFile(wb, `Original_Raw_File_${new Date().toLocaleDateString()}.xlsx`);
    addToast("ఒరిజినల్ Raw ఫైల్ (Excel) డౌన్లోడ్ అవుతోంది...");
  };

  const downloadRawPdf = async () => {
    await loadHeavyModulesWorkspace();
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
      <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] text-center relative overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
            <div className="w-64">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Processing DSR...</span>
                <span className="text-[10px] font-black text-primary">{uploadProgress}%</span>
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
        <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-4">DSR Analytical Engine</h4>
        <input type="file" onChange={onUpload} className="hidden" id="dsr-up" disabled={isProcessing} />
        <label htmlFor="dsr-up" className={`bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl transition-all inline-block text-xs uppercase tracking-widest ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90 active:scale-95'}`}>
           {isProcessing ? 'Processing...' : 'Select DSR File'}
        </label>
      </div>

      {data.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            <button aria-label="Filter Total" onClick={() => setActiveFilter(null)} className="text-left w-full"><StatCard label="TOTAL" val={stats.total} color="blue" /></button>
            <button aria-label="Filter Present" onClick={() => setActiveFilter('P')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'P' ? 'ring-2 ring-emerald-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="PRESENT" val={stats.present} color="emerald" /></button>
            <button title="ఉదయం 9:00 కంటే ముందు విధులకు హాజరైన వారి (Present) సంఖ్య." onClick={() => setActiveFilter('B9')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'B9' ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="ON TIME" val={stats.before901} color="indigo" /></button>
            <button title="ఉదయం 9:01 తర్వాత విధులకు హాజరైన వారి (Present) సంఖ్య." onClick={() => setActiveFilter('A9')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'A9' ? 'ring-2 ring-rose-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="LATE ATT" val={stats.after900} color="rose" /></button>
            <button aria-label="Filter DSR" onClick={() => setActiveFilter('D')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'D' ? 'ring-2 ring-blue-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="DSR REP" val={stats.dsr} color="emerald" /></button>
            <button aria-label="Filter No DSR" onClick={() => setActiveFilter('NE')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'NE' ? 'ring-2 ring-amber-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="NO DSR" val={stats.pending} color="amber" subText={stats.pending > 0 ? `LIVE: ${currentTime}` : undefined} /></button>
            <button aria-label="Filter Meeting" onClick={() => setActiveFilter('M')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'M' ? 'ring-2 ring-cyan-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="MEETING" val={stats.meeting} color="cyan" /></button>
            <button aria-label="Filter Training" onClick={() => setActiveFilter('T')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'T' ? 'ring-2 ring-amber-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="TRAINING" val={stats.training} color="amber" /></button>
            <button aria-label="Filter Leave" onClick={() => setActiveFilter('L')} className={`text-left w-full transition-transform active:scale-95 ${activeFilter === 'L' ? 'ring-2 ring-slate-500 ring-offset-2 rounded-2xl' : ''}`}><StatCard label="LEAVE" val={stats.leave} color="slate" /></button>
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

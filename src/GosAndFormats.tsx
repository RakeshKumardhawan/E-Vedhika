import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../firebase';
import { Download, Upload, Trash2, FileBadge } from 'lucide-react';
import { requireLoginAlert, getFriendlyError } from './App';

export function GosAndFormatsPublic({ user, addToast, isAdmin }: { user: any, addToast: (s: string) => void, isAdmin?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Application' | 'GO'>('Application');
  const [showUpload, setShowUpload] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [whatIsIt, setWhatIsIt] = useState('');
  const [whoUses, setWhoUses] = useState('');
  const [fileNameDisplay, setFileNameDisplay] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'gos_formats'), orderBy('time', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setItems(arr);
    });
    return () => unsub();
  }, []);

  const displayedItems = items.filter(item => {
     if (activeTab === 'Application') return item.category === 'Application';
     return item.category !== 'Application'; // 'GO' or 'Format'
  });

  const handleUpload = async () => {
    if (!user) {
       requireLoginAlert();
       return;
    }
    if (!title) return addToast("Title is required");
    if (!file) return addToast("Please select a valid PDF/Doc file");
    if (activeTab === 'Application' && (!whatIsIt || !whoUses)) {
       return addToast("Please explain what this application is and who uses it.");
    }
    
    setUploading(true);
    setProgress(0);

    try {
      const lastDotIndex = file.name.lastIndexOf('.');
      const extension = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '';
      let safeFileNameDisplay = fileNameDisplay ? fileNameDisplay.replace(/[^a-zA-Z0-9.\-]/g, '_') : '';
      if (safeFileNameDisplay && extension && !safeFileNameDisplay.endsWith(extension)) {
        safeFileNameDisplay += extension;
      }
      const safeName = fileNameDisplay ? safeFileNameDisplay : file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
      const storageRef = ref(storage, `gos_formats/${Date.now()}_${safeName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        }, 
        (error) => {
          console.error(error);
          addToast(getFriendlyError(error));
          setUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, 'gos_formats'), {
            title,
            description,
            category: activeTab,
            whatIsIt: activeTab === 'Application' ? whatIsIt : '',
            whoUses: activeTab === 'Application' ? whoUses : '',
            url: downloadURL,
            storagePath: uploadTask.snapshot.ref.fullPath,
            fileName: file.name,
            fileNameDisplay: fileNameDisplay || file.name,
            size: file.size,
            time: Date.now(),
            uploadedBy: user.uid
          });
          addToast("Document Uploaded Successfully!");
          setUploading(false);
          setShowUpload(false);
          setTitle('');
          setDescription('');
          setWhatIsIt('');
          setWhoUses('');
          setFileNameDisplay('');
          setFile(null);
          setProgress(0);
        }
      );
    } catch(err: any) {
      addToast(getFriendlyError(err));
      setUploading(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      if (item.storagePath) {
        const fileRef = ref(storage, item.storagePath);
        await deleteObject(fileRef).catch(e => console.warn("Storage warning:", e));
      }
      await deleteDoc(doc(db, 'gos_formats', item.id));
      addToast("Document Deleted");
    } catch (err: any) {
      addToast(getFriendlyError(err));
    }
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[60vh]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
         <div>
           <h2 className="text-xl sm:text-2xl font-black text-indigo-600 flex flex-row items-center flex-wrap gap-2">
              <FileBadge className="text-indigo-500 shrink-0" />
              <span>Applications, Formats & GOs</span>
           </h2>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ముఖ్యమైన అప్లికేషన్లు & ప్రభుత్వ ఉత్తర్వులు</p>
         </div>
         <button onClick={() => {
             if(!user) return requireLoginAlert();
             setShowUpload(!showUpload);
           }} className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all">
            <Upload size={16} /> Upload File
         </button>
      </div>

      <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl w-full max-w-sm">
        <button 
           onClick={() => {setActiveTab('Application'); setShowUpload(false);}}
           className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'Application' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
           1. Applications & Formats
        </button>
        <button 
           onClick={() => {setActiveTab('GO'); setShowUpload(false);}}
           className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'GO' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
           2. GOs
        </button>
      </div>

      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-6 space-y-4">
               <div>
                 <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Document Title (ఫైల్ పేరు) *</label>
                 <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Pension Form / GO 42" className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400" />
               </div>
               
               {activeTab === 'Application' && (
                 <>
                   <div>
                     <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">What is this file? (ఈ ఫైల్ ఏంటి?) *</label>
                     <textarea value={whatIsIt} onChange={e => setWhatIsIt(e.target.value)} rows={2} placeholder="Explain what the original purpose..." className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 custom-scrollbar" />
                   </div>
                   <div>
                     <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Who is this for? (ఎవరికి యూస్ అవుతుంది?) *</label>
                     <textarea value={whoUses} onChange={e => setWhoUses(e.target.value)} rows={2} placeholder="e.g. Farmers, Students, Teachers..." className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 custom-scrollbar" />
                   </div>
                 </>
               )}

               {activeTab === 'GO' && (
                 <div>
                   <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Brief Description (Optional)</label>
                   <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 custom-scrollbar" />
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">PDF/Word File Upload *</label>
                   <input type="file" accept="application/pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-white file:border file:border-slate-200 file:text-indigo-700 hover:file:bg-indigo-50 cursor-pointer" />
                 </div>
                 <div>
                   <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 block">Change File Name Display (Optional)</label>
                   <input type="text" value={fileNameDisplay} onChange={e => setFileNameDisplay(e.target.value)} placeholder="e.g. valid_certificate" className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400" />
                 </div>
               </div>

               {uploading && (
                 <div className="w-full bg-slate-200 rounded-full h-2 mt-4 overflow-hidden">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                 </div>
               )}

               <div className="flex justify-end pt-4 border-t border-indigo-100/50">
                  <button disabled={uploading} onClick={handleUpload} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all">
                     {uploading ? `Uploading ${Math.round(progress)}%` : 'Push to ' + activeTab}
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 mt-2">
        {displayedItems.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
             <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No {activeTab}s Available</p>
          </div>
        ) : (
          displayedItems.map(item => (
            <div key={item.id} className="p-4 sm:p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-indigo-200 hover:shadow-md transition-all group relative overflow-hidden">
              {item.uploadedBy === 'admin' && (
                 <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-bl-lg shadow-sm">Admin Access Verified</div>
              )}
              <div className="flex gap-4 items-start w-full md:w-3/4">
                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-500 font-black text-xs uppercase shrink-0 group-hover:scale-110 transition-transform">
                    {item.category === 'GO' ? 'GO' : 'APP'}
                 </div>
                 <div className="w-full">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{item.title}</h3>
                    
                    {item.category === 'Application' ? (
                       <div className="space-y-2 mb-3 bg-white p-3 rounded-xl border border-slate-100 outline-none w-full">
                          {item.whatIsIt && (
                            <div>
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">What is this?</span>
                              <p className="text-xs text-slate-600">{item.whatIsIt}</p>
                            </div>
                          )}
                          {item.whoUses && (
                            <div>
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">Who is it for?</span>
                              <p className="text-xs text-slate-600">{item.whoUses}</p>
                            </div>
                          )}
                       </div>
                    ) : (
                       item.description && <p className="text-sm text-slate-500 mb-3">{item.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <span>{new Date(item.time).toLocaleDateString()}</span>
                       {item.size && <span>• {(item.size / 1024 / 1024).toFixed(2)} MB</span>}
                       {item.fileNameDisplay && <span className="max-w-[150px] truncate text-indigo-400/80" title={item.fileNameDisplay}>• {item.fileNameDisplay}</span>}
                    </div>
                 </div>
              </div>
              <div className="flex w-full md:w-auto items-center gap-2">
                 {(isAdmin || (user && item.uploadedBy === user.uid && item.uploadedBy !== 'admin')) && (
                    <button onClick={() => handleDelete(item)} className="p-3 bg-white text-rose-500 rounded-xl hover:bg-rose-50 border border-slate-100 transition-colors shadow-sm shrink-0">
                       <Trash2 size={18} />
                    </button>
                 )}
                 <a href={item.url} target="_blank" rel="noreferrer" onClick={(e) => {
                    if (!item.url) { e.preventDefault(); addToast("File link not found"); }
                 }} className="flex-1 md:w-auto px-6 py-3 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20">
                    <Download size={16} /> Download
                 </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Export Admin as same component since both have same functionality based on auth user
export const GosAndFormatsAdmin = GosAndFormatsPublic;

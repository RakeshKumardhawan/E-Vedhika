import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Search, ExternalLink, Download, Upload } from 'lucide-react';
import { FORMS_DATA } from '../data/docsData';
import { requireLoginAlert } from '../App';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { User as FirebaseUser } from 'firebase/auth';

export default function FormsHub({ addToast, user }: { addToast: (s:string) => void, user: FirebaseUser | null }) {
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
    </div>
  );
}

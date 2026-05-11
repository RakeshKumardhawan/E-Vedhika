import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, User, Building, Flag } from 'lucide-react';
import Swal from 'sweetalert2';
import { UserProfile } from '../App';

export default function DirectorySection({ allUsers }: { allUsers: UserProfile[] }) {
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
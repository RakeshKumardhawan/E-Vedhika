import React, { useState } from 'react';

export default function MyActivity({ user, userProfile, problems, suggestions, posts }: any) {
  const [activeTab, setActiveTab] = useState<'problems'|'suggestions'>('problems');

  const myProblems = problems.filter((p: any) => p.userId === user?.uid || p.authorId === user?.uid);
  const mySuggestions = suggestions.filter((s: any) => s.authorId === user?.uid || s.userId === user?.uid || s.uid === user?.uid);

  return (
    <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[60vh]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary flex items-center gap-2 mb-2">
            <span className="text-3xl">📋</span> My Activity & Reports
          </h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Track the status of your submitted issues and feedback</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-100 pb-2 overflow-x-auto custom-scrollbar">
        <button aria-label="My Problems" onClick={() => setActiveTab('problems')} className={`py-2 px-4 font-black text-sm uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'problems' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}>
          My Problems ({myProblems.length})
        </button>
        <button aria-label="My Suggestions" onClick={() => setActiveTab('suggestions')} className={`py-2 px-4 font-black text-sm uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'suggestions' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}>
          My Suggestions ({mySuggestions.length})
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'problems' && (
           myProblems.length > 0 ? myProblems.map((p: any) => (
             <div key={p.id} className="p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition-all">
                <div className="flex-1">
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-black uppercase text-slate-400 tracking-widest">{p.category}</span>
                     <span className={`px-3 text-[10px] font-black uppercase tracking-widest py-1 rounded-full ${p.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.status || 'Pending'}
                     </span>
                   </div>
                   <h3 className="font-bold text-slate-800 mt-2">{p.title || p.desc?.substring(0, 50)}</h3>
                   <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.desc}</p>
                   <p className="text-[10px] font-bold text-slate-400 mt-2">Submitted on: {new Date(p.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
             </div>
           )) : <div className="py-10 text-center font-bold text-slate-400">No problems reported yet.</div>
        )}

        {activeTab === 'suggestions' && (
           mySuggestions.length > 0 ? mySuggestions.map((s: any) => (
             <div key={s.id} className="p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition-all">
                <div className="flex-1">
                   <div className="flex items-center justify-between">
                     <span className={`px-3 text-[10px] font-black uppercase tracking-widest py-1 rounded-full ${(s.status === 'approved' || s.status === 'resolved') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.status === 'approved' || s.status === 'resolved' ? 'Published' : (s.status || 'Under Review')}
                     </span>
                   </div>
                   <p className="text-sm text-slate-700 mt-2">{s.text || s.msg || s.suggestion}</p>
                   <p className="text-[10px] font-bold text-slate-400 mt-2">Submitted on: {new Date(s.time || s.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
             </div>
           )) : <div className="py-10 text-center font-bold text-slate-400">No suggestions submitted yet.</div>
        )}
      </div>
    </div>
  );
}

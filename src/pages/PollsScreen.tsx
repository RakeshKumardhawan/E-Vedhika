import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Vote, Plus, X, Share2 } from 'lucide-react';

export default function PollsScreen({ user, addToast }: { user: any, addToast: (msg: string) => void }) {
  const [polls, setPolls] = useState<any[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'polls'), orderBy('createdAt', 'desc')), (snap) => {
      setPolls(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching polls:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return addToast("లాగిన్ అవసరం (Login required)");
    if (!newPollQuestion.trim() || newPollOptions.some(opt => !opt.trim())) return addToast("అన్ని వివరాలు నింపండి (Fill all fields)");

    try {
      await addDoc(collection(db, 'polls'), {
        question: newPollQuestion,
        options: newPollOptions.map(opt => ({ text: opt, votes: 0 })),
        votedBy: {},
        createdBy: user.uid,
        createdAt: Date.now()
      });
      setNewPollQuestion("");
      setNewPollOptions(["", ""]);
      addToast("పోల్ విజయవంతంగా సృష్టించబడింది (Poll created)");
    } catch (err: any) {
      addToast("పోల్ సృష్టించడం విఫలమైంది: " + err.message);
    }
  };

  const handleVote = async (pollId: string, optionIndex: number, currentPoll: any) => {
    if (!user) return addToast("లాగిన్ అవసరం (Login required)");
    if (currentPoll.votedBy[user.uid] !== undefined) return addToast("మీరు ఇప్పటికే ఓటు వేశారు (Already voted)");

    try {
      const pollRef = doc(db, 'polls', pollId);
      const newOptions = [...currentPoll.options];
      newOptions[optionIndex].votes += 1;
      
      await updateDoc(pollRef, {
        options: newOptions,
        [`votedBy.${user.uid}`]: optionIndex
      });
      addToast("మీ ఓటు నమోదైంది (Vote recorded)");
    } catch (err: any) {
      addToast("ఓటు విఫలమైంది: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
         <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Vote size={24} />
         </div>
         <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">ప్రజాభిప్రాయ సేకరణ (Polls)</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Village Voting & Opinions</p>
         </div>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
         <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
           <Plus size={16} className="text-primary" /> కొత్త పోల్ సృష్టించండి (Create Poll)
         </h3>
         <form onSubmit={handleCreatePoll} className="space-y-4">
           <input 
             type="text" 
             value={newPollQuestion} 
             onChange={e => setNewPollQuestion(e.target.value)} 
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
                   onChange={e => {
                     const newOpts = [...newPollOptions];
                     newOpts[i] = e.target.value;
                     setNewPollOptions(newOpts);
                   }} 
                   placeholder={`ఆప్షన్ (Option) ${i + 1}`} 
                   className="flex-1 bg-slate-50 border-slate-100 rounded-2xl p-4 text-sm font-bold placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20" 
                   required 
                 />
                 {i >= 2 && (
                   <button type="button" onClick={() => setNewPollOptions(newPollOptions.filter((_, idx) => idx !== i))} className="p-4 text-slate-400 hover:text-red-500 bg-slate-50 rounded-2xl transition-colors">
                     <X size={16} />
                   </button>
                 )}
               </div>
             ))}
           </div>
           <button type="button" onClick={() => setNewPollOptions([...newPollOptions, ""])} className="text-[10px] font-black text-primary hover:text-blue-700 transition-colors flex items-center gap-1 uppercase tracking-widest pl-1 mt-2">
             <Plus size={14} /> యాడ్ ఆప్షన్ (Add Option)
           </button>
           <button type="submit" className="w-full mt-4 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform uppercase tracking-widest text-sm">
             పబ్లిష్ చేయండి (Publish Poll)
           </button>
         </form>
      </div>

      <div className="space-y-4">
         {loading ? (
           <div className="text-center py-10"><div className="w-8 h-8 mx-auto border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div></div>
         ) : polls.length === 0 ? (
           <div className="text-center py-12 text-slate-400 font-bold">ఇంకా ఎటువంటి పోల్స్ లేవు (No polls yet)</div>
         ) : (
           polls.map(poll => {
             const totalVotes = poll.options.reduce((acc: number, opt: any) => acc + opt.votes, 0);
             const userVotedIndex = user ? poll.votedBy[user.uid] : undefined;
             
             return (
               <div key={poll.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-bl-xl font-black">{totalVotes} Votes</div>
                 <h3 className="text-base sm:text-lg font-black text-slate-800 mb-4 mt-2 pr-12">{poll.question}</h3>
                 <div className="space-y-3">
                   {poll.options.map((opt: any, i: number) => {
                     const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                     const isSelected = userVotedIndex === i;
                     return (
                       <button 
                         key={i} 
                         onClick={() => handleVote(poll.id, i, poll)}
                         disabled={userVotedIndex !== undefined}
                         className={`w-full relative overflow-hidden rounded-xl border text-left transition-all ${userVotedIndex !== undefined ? (isSelected ? 'border-primary bg-blue-50/50' : 'border-slate-100 bg-slate-50 opacity-70') : 'border-slate-100 bg-white hover:border-primary/50 hover:bg-slate-50'}`}
                       >
                         <div className={`absolute top-0 left-0 bottom-0 transition-all duration-1000 ${isSelected ? 'bg-blue-100' : 'bg-slate-200/50'}`} style={{ width: `${percent}%` }} />
                         <div className="relative p-4 flex justify-between items-center z-10">
                           <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{opt.text}</span>
                           {userVotedIndex !== undefined && (
                             <span className={`text-xs font-black ${isSelected ? 'text-primary' : 'text-slate-400'}`}>{percent}%</span>
                           )}
                         </div>
                       </button>
                     );
                   })}
                 </div>
                 <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wider">
                    <span className="uppercase">Created: {new Date(poll.createdAt).toLocaleDateString('en-IN')}</span>
                    <button 
                      onClick={() => {
                        const shareText = `దయచేసి ఈ పోల్ లో పాల్గొనండి:\n*${poll.question}*\n\nమా గ్రామం యాప్ లో ఓటు వేయడానికి కింది లింక్ ద్వారా వెళ్ళండి:\n${window.location.origin}`;
                        if (navigator.share) {
                          navigator.share({ title: 'Vote in Poll', text: shareText }).catch(console.error);
                        } else {
                          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
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

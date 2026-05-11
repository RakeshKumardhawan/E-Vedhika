import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, UserProfile, OperationType, requireLoginAlert, handleFirestoreError } from '../App';

export default function ChatScreen({ messages, user, addToast, userProfile }: { messages: ChatMessage[], user: any, addToast: (s:string) => void, userProfile: UserProfile | null }) {
  const [msg, setMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!msg.trim()) return;
    if (requireLoginAlert(user)) return;
    
    try {
      await addDoc(collection(db, 'chat'), { 
        msg, 
        time: Date.now(), 
        uid: user.uid,
        userName: userProfile?.username || user.displayName || 'Portal User'
      });
      setMsg("");
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, 'chat');
      addToast("Error sending"); 
    }
  };

  return (
    <div className="bg-white rounded-3xl border shadow-sm flex flex-col h-[600px] overflow-hidden">
      <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
        <div className="font-black text-primary flex items-center gap-3">
           <MessageCircle size={20}/> 
           LIVE FEED
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc] custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map(m => (
            <motion.div 
              key={m.id} 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${m.uid === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col max-w-[80%]">
                <span className={`text-[10px] font-black uppercase mb-1 px-1 ${m.uid === user?.uid ? 'text-right text-primary/40' : 'text-slate-400'}`}>
                  {m.userName || 'Portal User'}
                </span>
                <div className={`p-3 rounded-2xl text-sm font-medium shadow-sm whitespace-pre-wrap ${m.uid === user?.uid ? 'bg-primary text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`} style={m.uid === user?.uid ? { background: '#0d3b66' } : {}}>
                  {m.msg}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>
      <div className="p-4 border-t flex gap-2">
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type..." className="mb-0 flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-primary/50 text-sm" />
        <button aria-label="Send message" onClick={send} className="bg-primary text-white p-3 rounded-xl" style={{ background: '#0d3b66' }}><Send size={18}/></button>
      </div>
    </div>
  );
}

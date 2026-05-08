import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, MessageSquare, Loader2, Sparkles, User, ChevronLeft } from 'lucide-react';
import { askMana } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

export function ManaBot({ currentTab, userName }: { currentTab: string, userName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: `నమస్కారం ${userName || ''}! E-VEDHIKA వెబ్సైటుకు స్వాగతం. ఈ వెబ్‌సైట్‌ను ఎలా ఉపయోగించాలో లేదా ఇక్కడ ఉన్న ఫీచర్ల గురించి నేను మీకు వివరిస్తాను. మీకు ఏం సహాయం కావాలి? (Hello! Welcome to E-VEDHIKA. I'm here to guide you on how to use this website and its features. How can I help you today?)`,
      sender: 'bot',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const context = `The user is currently on the "${currentTab}" tab. The user's name is ${userName || 'Anonymous'}.`;
    const response = await askMana(input, context);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: response || 'Sorry, I encountered an error.',
      sender: 'bot',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden relative"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight leading-tight">E-VEDHIKA Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest leading-none">Online & Ready</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth bg-slate-50/50">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}
                  >
                    <div className="prose prose-sm prose-slate max-w-none prose-headings:text-inherit prose-p:leading-relaxed prose-li:my-0">
                      <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm rounded-tl-none">
                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">ఆలోచిస్తున్నాను... కాస్త వేచి ఉండండి</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none font-bold text-slate-700 placeholder:text-slate-400"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[9px] text-center text-slate-300 font-bold uppercase tracking-widest mt-2 px-4 leading-tight">
                E-VEDHIKA AI may provide incorrect information. Verify official details.<br/>
                (ఈ సమాచారాన్ని అధికారికంగా సరిచూసుకోగలరు)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-16 h-16 rounded-[24px] shadow-2xl flex items-center justify-center transition-all duration-300 relative group overflow-hidden ${
          isOpen ? 'bg-slate-900 border-4 border-slate-800' : 'bg-indigo-600 border-4 border-indigo-500 hover:rotate-6'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {isOpen ? (
          <X size={28} className="text-white relative z-10" />
        ) : (
          <div className="relative z-10 flex flex-col items-center">
             <Bot size={28} className="text-white drop-shadow-lg" />
             <div className="absolute -top-1 -right-1">
                <div className="w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-600 animate-ping"></div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-600 absolute top-0"></div>
             </div>
          </div>
        )}
      </motion.button>
    </div>
  );
}

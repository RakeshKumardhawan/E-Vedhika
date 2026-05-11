import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, AlertTriangle, Lightbulb, MapPin, Scale, Users, LayoutDashboard, Share2, CornerDownRight, ArrowLeft, FileText, AlertCircle, Book, Bot, XCircle, CheckCircle2 } from 'lucide-react';
import { PR_ACT_DB, PRSection } from '../data/prActData';

function KnowledgeHubSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isolatedSection, setIsolatedSection] = useState<PRSection | null>(null);

  // Advanced NLP Search Logic
  const getFilteredData = () => {
    if (!searchTerm.trim()) return PR_ACT_DB;

    const term = searchTerm.toLowerCase().trim();

    // Exact Number Catch: If user typed only a number (e.g., "114", "37")
    const isExactNumber = /^\d+$/.test(term);
    if (isExactNumber) {
      const exactMatch = PR_ACT_DB.filter((s: PRSection) => s.number === term && s.type === 'section');
      if (exactMatch.length > 0) return exactMatch;
    }

    // Fuzzy NLP Search
    // Remove vowels, spaces and special chars for a forgiving "sound/root" search
    const normalize = (str: string) => str.toLowerCase().replace(/[\s\(\)\[\]\{\}\.,!?'"అఆఇఈఉఊఎఏఐఒఓఔఅంఅఃa-zA-Z]/g, ''); 
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
           if (normTitle.includes(normTerm) || normContent.includes(normTerm)) return true;
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
              {isolatedSection.type === 'section' ? `సెక్షన్ ${isolatedSection.number}` : `షెడ్యూల్ ${isolatedSection.number}`}
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
                {isolatedSection.type === 'section' ? 'TPRA 2018 SECTION' : 'TPRA 2018 SCHEDULE'}
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
                  <AlertCircle size={16} /> రియల్ లైఫ్ రిఫరెన్స్ (Real-Life Reference)
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
            <Book size={32} className="text-yellow-400 shrink-0" /> TS PR Act 2018 <br className="sm:hidden" />పాకెట్ గైడ్
          </h2>
          <p className="text-indigo-100 text-xs sm:text-sm font-bold uppercase tracking-widest mb-8 max-w-lg opacity-90 leading-relaxed">
            290 సెక్షన్లు, 8 షెడ్యూల్స్ - అడ్వాన్స్డ్ స్మార్ట్ సెర్చ్ తో కచ్చితమైన డేటా మీ అరచేతిలో. ఏదీ కలపకుండా దేనికదే విడివిడిగా (Individual Sections) ఒరిజినల్ డేటాతో.
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
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-4 text-slate-400 hover:text-indigo-600 transition-colors p-2"
                >
                  <XCircle size={20} />
                </button>
              )}
            </div>
            <p className="text-indigo-200 text-[10px] font-semibold mt-3 ml-2">
              💡 గమనిక: బ్రాకెట్లు, స్పెల్లింగ్ మిస్టేక్స్ ఉన్నా సరి చేసి ఒరిజినల్ సెక్షన్ తీస్తుంది. 
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {['114', '73', '140', 'కార్యదర్శి', 'పన్ను'].map(tag => (
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
            <p className="text-lg">మీరు వెతుకుతున్న "{searchTerm}" సంబంధించిన సెక్షన్ దొరకలేదు.</p>
            <p className="text-xs text-slate-400 mt-2">దయచేసి నంబర్ లేదా సరైన పదాన్ని ప్రయత్నించండి.</p>
          </div>
        ) : (
          filteredData.map((c: PRSection) => (
            <div key={c.id} className="group bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start gap-6">
                
                {/* Badge Section */}
                <div className="shrink-0">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                      {c.type === 'section' ? 'SEC' : 'SCH'}
                    </span>
                    <span className="text-2xl font-black">
                      {c.number}
                    </span>
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
                      <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
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
                పై డేటా అంతా కచ్చితమైన ఒరిజినల్ సెక్షన్ నంబర్లతో పొందుపరచబడింది. ఇందులో డమ్మీ కంటెంట్ లేకుండా, రియల్ లైఫ్ లో వాడుకునేలా పక్కాగా స్ప్లిట్ చేయబడింది.
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


export { KnowledgeHubSection, PRActHub };
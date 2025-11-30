
import React, { useState } from 'react';
import { Report, VerdictType, SourceCategory, CommunityNote } from '../types';
import { neutralizeBias, verifyCommunityNote } from '../services/geminiService';
import { EvolutionVisualizer } from './EvolutionVisualizer';
import { NeuralVoice } from './NeuralVoice';

interface ReportCardProps {
  report: Report;
  highContrast?: boolean;
  onDeepDive?: (report: Report) => void;
}

// PREMIUM ICONS (SVG)
const Icons = {
    Chat: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
    Scale: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>,
    Share: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
    X: () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    Download: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    Card: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
    Up: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11v 8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-3a1 1 0 0 0-1-1v-6a3 3 0 0 0-6 0v4a2 2 0 0 0 2 2h3z"/><path d="M17 11v8"/></svg>,
    Down: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13v-8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3a1 1 0 0 1-1 1v6a3 3 0 0 1-6 0v-4a2 2 0 0 1 2-2h3z"/><path d="M17 13v-8"/></svg>
};

const VerdictBadge = ({ verdict, highContrast }: { verdict: VerdictType, highContrast?: boolean }) => {
  const styles = highContrast ? {
    [VerdictType.VERIFIED]: "bg-white text-black border-2 border-black",
    [VerdictType.FALSE]: "bg-black text-white border-2 border-white",
    [VerdictType.MISLEADING]: "bg-black text-white border-2 border-white border-dashed",
    [VerdictType.UNCERTAIN]: "bg-gray-200 text-black border-2 border-black",
    [VerdictType.OPINION]: "bg-white text-black border-2 border-black italic",
    [VerdictType.OUTDATED]: "bg-gray-300 text-black border-2 border-black line-through",
    [VerdictType.NOT_RECENT]: "bg-white text-black border-2 border-dashed border-black",
  } : {
    [VerdictType.VERIFIED]: "bg-gradient-to-r from-green-900/50 to-green-600/20 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(74,222,128,0.2)]",
    [VerdictType.FALSE]: "bg-gradient-to-r from-red-900/50 to-red-600/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(248,113,113,0.2)]",
    [VerdictType.MISLEADING]: "bg-gradient-to-r from-yellow-900/50 to-yellow-600/20 text-yellow-400 border-yellow-500/50",
    [VerdictType.UNCERTAIN]: "bg-gray-800 text-gray-400 border-gray-600",
    [VerdictType.OPINION]: "bg-blue-900/30 text-blue-400 border-blue-500/50",
    [VerdictType.OUTDATED]: "bg-purple-900/30 text-purple-400 border-purple-500/50",
    [VerdictType.NOT_RECENT]: "bg-orange-900/30 text-orange-400 border-orange-500/50",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border tracking-wider transition-all duration-300 ${styles[verdict]}`}>
      {verdict}
    </span>
  );
};

const TimeContextBadge = ({ context }: { context?: 'Breaking' | 'Recent' | 'Old' | 'Very Old' }) => {
    if (!context) return null;
    
    const styles = {
        'Breaking': 'bg-red-500 text-white animate-pulse',
        'Recent': 'bg-blue-500 text-white',
        'Old': 'bg-gray-600 text-gray-200',
        'Very Old': 'bg-gray-800 text-gray-400 border border-gray-600'
    };

    return (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${styles[context] || 'bg-gray-700'}`}>
            {context}
        </span>
    );
};

export const ReportCard: React.FC<ReportCardProps> = ({ report, highContrast, onDeepDive }) => {
  const [expanded, setExpanded] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [neutralizedText, setNeutralizedText] = useState<string | null>(null);
  const [isNeutralizing, setIsNeutralizing] = useState(false);
  const [showNeutralized, setShowNeutralized] = useState(false);
  const [briefMode, setBriefMode] = useState(false);
  
  // Voting State
  const [votes, setVotes] = useState(report.communityVotes || { up: 0, down: 0 });
  const [hasVoted, setHasVoted] = useState<'up' | 'down' | null>(report.communityVotes?.userVoted || null);

  // Community Notes State
  const [notes, setNotes] = useState<CommunityNote[]>(report.communityNotes || []);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isVerifyingNote, setIsVerifyingNote] = useState(false);

  const glowColor = highContrast ? '' :
    report.verdict === VerdictType.VERIFIED ? 'hover:shadow-[0_0_30px_rgba(0,255,159,0.1)] hover:border-sophon-success/50' :
    report.verdict === VerdictType.FALSE ? 'hover:shadow-[0_0_30px_rgba(255,0,60,0.15)] hover:border-sophon-danger/50' :
    'hover:shadow-[0_0_30px_rgba(252,238,10,0.1)] hover:border-sophon-warning/50';

  const baseBorder = highContrast ? 'border-white' :
    report.verdict === VerdictType.VERIFIED ? 'border-l-4 border-l-sophon-success border-y border-r border-y-white/5 border-r-white/5' :
    report.verdict === VerdictType.FALSE ? 'border-l-4 border-l-sophon-danger border-y border-r border-y-white/5 border-r-white/5' :
    report.verdict === VerdictType.MISLEADING ? 'border-l-4 border-l-sophon-warning border-y border-r border-y-white/5 border-r-white/5' :
    'border-l-4 border-gray-600 border-y border-r border-white/5';
    
  const downloadReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    const element = document.createElement("a");
    const file = new Blob([`SOPHON INTEL REPORT\nID: ${report.id}\nVERDICT: ${report.verdict}\n\nSUMMARY:\n${report.summary}\n\nSOURCES:\n${report.sources.map(s => `- ${s.title} (${s.url})`).join('\n')}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `SOPHON_REPORT_${report.id.slice(0,8)}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const shareToTwitter = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `🚨 SOPHON REPORT\n\nTOPIC: ${report.topic}\nVERDICT: ${report.verdict}\n\n${report.summary}\n\nVerified via Sophon Sentinel.`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleNeutralize = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (showNeutralized) { setShowNeutralized(false); return; }
      if (neutralizedText) { setShowNeutralized(true); return; }
      setIsNeutralizing(true);
      const clean = await neutralizeBias(report.summary);
      setNeutralizedText(clean);
      setShowNeutralized(true);
      setIsNeutralizing(false);
  };

  const handleVote = (type: 'up' | 'down') => {
      if (hasVoted === type) return; // Already voted this way
      
      const newVotes = { ...votes };
      if (hasVoted) {
          // Remove old vote
          newVotes[hasVoted]--;
      }
      // Add new vote
      newVotes[type]++;
      
      setVotes(newVotes);
      setHasVoted(type);
      
      if (type === 'down') {
          alert("Vote Recorded. Flagged for Manual Review.");
      }
  };

  const handleAddNote = async () => {
      if (!newNote.trim()) return;
      setIsVerifyingNote(true);
      
      const isVerified = await verifyCommunityNote(newNote, report.summary);
      
      const note: CommunityNote = {
          id: crypto.randomUUID(),
          text: newNote,
          isVerified,
          timestamp: Date.now()
      };
      
      setNotes(prev => [note, ...prev]);
      setNewNote('');
      setIsVerifyingNote(false);
      setIsAddingNote(false);
  };

  const sourceDates = report.sources.map(s => s.date).filter(d => d && d !== "UNKNOWN").sort();
  const latestDate = sourceDates.length > 0 ? sourceDates[0] : null;

  const pulse = report.socialPulse || { sentiment: 'NEUTRAL', score: 50, topNarrative: 'No social signal detected.', hotSpots: [] };

  // --- BRIEF MODE (INSHORTS STYLE) ---
  if (briefMode) {
      return (
          <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] overflow-hidden rounded-xl group cursor-pointer" onClick={() => setBriefMode(false)}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
              
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <VerdictBadge verdict={report.verdict} highContrast={highContrast} />
                  <button onClick={(e) => { e.stopPropagation(); setBriefMode(false); }} className="p-1 rounded-full bg-black/50 text-white hover:bg-white hover:text-black">✕</button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2 leading-tight drop-shadow-md">{report.topic}</h3>
                  <p className="text-sm text-gray-300 line-clamp-4 leading-relaxed font-serif">
                      {report.summary}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                      <span>POWERED BY SOPHON</span>
                      <span>TAP TO EXPAND</span>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className={`glass-panel p-5 rounded-xl transition-all duration-300 group hover:-translate-y-1 ${baseBorder} ${glowColor}`}>
      
      {/* Header Row */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 flex-wrap">
           <VerdictBadge verdict={report.verdict} highContrast={highContrast} />
           <TimeContextBadge context={report.timeContext} />
           {latestDate && (
               <span className={`text-[10px] font-mono border px-2 py-0.5 rounded ${highContrast ? 'border-black text-black' : 'text-gray-400 border-gray-700 bg-black/20'}`}>
                   📅 {latestDate}
               </span>
           )}
           {report.detectedLanguage && report.detectedLanguage !== 'English' && (
             <span className={`text-[10px] font-mono border px-2 py-0.5 rounded uppercase ${highContrast ? 'border-white text-white' : 'text-sophon-accent border-sophon-accent/30 bg-sophon-accent/5'}`}>
                🌐 {report.detectedLanguage}
             </span>
           )}
        </div>
        <div className="flex flex-col items-end">
            <span className={`${highContrast ? 'text-white' : 'text-sophon-accent'} text-xs font-bold font-mono`}>{report.confidenceScore}% CONFIDENCE</span>
            <div className="flex items-center gap-1 mt-1">
                 <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out ${highContrast ? 'bg-white' : report.sourceReliability > 70 ? 'bg-sophon-success' : 'bg-sophon-danger'}`} 
                        style={{ width: `${report.sourceReliability}%` }}
                    ></div>
                 </div>
            </div>
        </div>
      </div>

      {/* Title & Actions */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <h3 className="text-lg font-bold text-white leading-tight flex-1 tracking-tight group-hover:text-sophon-accent transition-colors duration-300">{report.topic}</h3>
        <div className="flex gap-2">
            {onDeepDive && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDeepDive(report); }}
                    className={`p-2 rounded-lg border transition-all ${highContrast ? 'bg-white text-black border-black' : 'bg-sophon-accent/10 text-sophon-accent border-sophon-accent/30 hover:bg-sophon-accent/20'}`}
                    title="Deep Dive Chat"
                >
                    <Icons.Chat />
                </button>
            )}
            <button onClick={() => setBriefMode(true)} title="Brief Mode (60 Words)" className={`p-2 rounded-lg border transition-all hover:scale-110 ${highContrast ? 'border-white text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}>
                <Icons.Card />
            </button>
            <button onClick={handleNeutralize} title="Neutralize Bias" className={`p-2 rounded-lg border transition-all hover:scale-110 ${highContrast ? 'border-white text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}>
                {isNeutralizing ? '...' : <Icons.Scale />}
            </button>
            <button onClick={shareToTwitter} title="Share to X" className={`p-2 rounded-lg border transition-all hover:scale-110 ${highContrast ? 'border-white text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}>
                <Icons.X />
            </button>
            
            {/* NEW NEURAL VOICE COMPONENT */}
            <NeuralVoice text={`Verdict: ${report.verdict}. Topic: ${report.topic}. Summary: ${showNeutralized && neutralizedText ? neutralizedText : report.summary}`} highContrast={highContrast} />

            <button onClick={downloadReport} title="Download Report" className={`p-2 rounded-lg border transition-all hover:scale-110 ${highContrast ? 'border-white text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}>
                <Icons.Download />
            </button>
        </div>
      </div>
      
      {/* Claim Context */}
      <div className={`mb-4 p-4 rounded-lg border transition-colors ${highContrast ? 'bg-white text-black border-black' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
        <p className={`text-[10px] uppercase mb-1 font-mono tracking-wider ${highContrast ? 'text-black' : 'text-gray-500'}`}>Analyzed Claim:</p>
        <p className={`italic font-serif text-sm ${highContrast ? 'text-black' : 'text-gray-200'}`}>"{report.claim}"</p>
      </div>

      {/* SOCIAL PULSE */}
      <div className={`mb-4 p-3 rounded-lg flex items-center gap-4 transition-all ${highContrast ? 'bg-gray-100 text-black border border-black' : 'bg-gradient-to-r from-white/5 to-transparent border border-white/10'}`}>
          <div className="flex flex-col items-center border-r border-gray-600 pr-4 min-w-[60px]">
              <span className={`text-xl`}>{pulse.sentiment === 'ANGRY' ? '😡' : pulse.sentiment === 'FEARFUL' ? '😨' : '😐'}</span>
              <span className={`text-[8px] font-bold uppercase mt-1 ${highContrast ? 'text-black' : 'text-gray-300'}`}>{pulse.sentiment}</span>
          </div>
          <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] text-gray-500 uppercase font-mono">SOCIAL PULSE</p>
                  <div className="flex gap-1">
                      {pulse.hotSpots.map(platform => (
                          <span key={platform} className={`text-[8px] px-1.5 py-0.5 rounded border uppercase ${highContrast ? 'border-black text-black' : 'border-gray-700 text-gray-500 bg-black/20'}`}>{platform}</span>
                      ))}
                  </div>
              </div>
              <p className={`text-xs italic ${highContrast ? 'text-black' : 'text-gray-300'}`}>"{pulse.topNarrative}"</p>
          </div>
      </div>

      {/* PEER REVIEW / CONSENSUS PROTOCOL */}
      <div className={`mb-4 p-2 rounded border border-dashed flex justify-between items-center ${highContrast ? 'bg-white border-black text-black' : 'bg-black/30 border-gray-700 text-gray-300'}`}>
          <div className="text-[10px] font-mono font-bold tracking-wide pl-2">PEER CONSENSUS</div>
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                  <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${votes.up > votes.down ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${(votes.up / (votes.up + votes.down || 1)) * 100}%` }}></div>
                  </div>
              </div>
              <div className="flex gap-1">
                  <button 
                    onClick={() => handleVote('up')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold border transition-colors ${hasVoted === 'up' ? 'bg-green-500/20 text-green-400 border-green-500' : 'border-transparent hover:bg-white/5 text-gray-500'}`}
                  >
                      <Icons.Up /> VERIFY ({votes.up})
                  </button>
                  <div className="w-px bg-gray-700 h-4 self-center"></div>
                  <button 
                    onClick={() => handleVote('down')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold border transition-colors ${hasVoted === 'down' ? 'bg-red-500/20 text-red-400 border-red-500' : 'border-transparent hover:bg-white/5 text-gray-500'}`}
                  >
                      <Icons.Down /> DISPUTE ({votes.down})
                  </button>
              </div>
          </div>
      </div>

      {/* COMMUNITY NOTES */}
      <div className={`mb-4 p-3 rounded-lg border ${highContrast ? 'border-black bg-gray-50' : 'border-white/10 bg-white/5'}`}>
          <div className="flex justify-between items-center mb-2">
              <h4 className="text-[10px] font-mono font-bold text-gray-500 uppercase">COMMUNITY CONTEXT</h4>
              <button 
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  className={`text-[9px] px-2 py-1 rounded border ${highContrast ? 'border-black text-black' : 'border-sophon-accent text-sophon-accent hover:bg-sophon-accent/10'}`}
              >
                  {isAddingNote ? 'CANCEL' : '+ ADD CONTEXT'}
              </button>
          </div>

          {isAddingNote && (
              <div className="mb-3 animate-fadeIn">
                  <textarea 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add missing context or corrections..."
                      className={`w-full p-2 text-xs rounded border mb-2 focus:outline-none ${highContrast ? 'bg-white border-black text-black' : 'bg-black border-gray-600 text-white'}`}
                  />
                  <button 
                      onClick={handleAddNote}
                      disabled={isVerifyingNote || !newNote.trim()}
                      className={`w-full py-1 text-[10px] font-bold rounded ${highContrast ? 'bg-black text-white' : 'bg-sophon-accent text-black hover:bg-white'}`}
                  >
                      {isVerifyingNote ? 'AI AUDITING...' : 'SUBMIT FOR AUDIT'}
                  </button>
              </div>
          )}

          <div className="space-y-2">
              {notes.length === 0 && !isAddingNote ? (
                  <p className="text-[10px] text-gray-600 italic text-center py-2">No community notes yet.</p>
              ) : (
                  notes.map(note => (
                      <div key={note.id} className={`p-2 rounded border-l-2 text-xs ${note.isVerified ? 'border-green-500 bg-green-500/5' : 'border-yellow-500 bg-yellow-500/5'}`}>
                          <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[8px] font-bold px-1 rounded ${note.isVerified ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'}`}>
                                  {note.isVerified ? '🤖 AI AUDITED' : '⚠️ UNVERIFIED'}
                              </span>
                              <span className="text-[9px] text-gray-500">{new Date(note.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className={highContrast ? 'text-black' : 'text-gray-300'}>{note.text}</p>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* Summary */}
      <div className={`relative transition-all duration-500 ${showNeutralized ? 'bg-blue-500/10 p-3 rounded-lg border-l-2 border-blue-500' : ''}`}>
          {showNeutralized && <span className="block text-[9px] font-bold text-blue-400 mb-2 tracking-widest">NEUTRALIZED CONTEXT:</span>}
          <p className={`text-sm leading-relaxed mb-4 ${highContrast ? 'text-white' : 'text-gray-300'}`}>
            {showNeutralized ? neutralizedText : report.summary}
          </p>
      </div>

      {/* Footer Controls & Sources */}
      <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
        <button 
          onClick={() => setExpanded(!expanded)}
          className={`text-xs flex items-center justify-between group/btn ${highContrast ? 'text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <span className="font-mono tracking-wide">{expanded ? 'HIDE SOURCES' : `VIEW SOURCES (${report.sources.length})`}</span>
          <span className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {expanded && (
          <ul className="mt-2 space-y-2 animate-fadeIn">
            {report.sources.map((source, idx) => (
              <li key={idx} className={`flex items-center justify-between text-xs p-2.5 rounded-lg border transition-colors ${highContrast ? 'bg-white text-black border-black' : 'bg-black/40 border-white/5 hover:border-white/20 text-gray-300'}`}>
                <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate font-bold">{source.title}</a>
                    <span className="text-[9px] text-gray-500 font-mono">{source.date || "UNKNOWN DATE"}</span>
                </div>
                <div className="flex items-center gap-2">
                    {source.reliabilityScore < 40 && (
                        <div className="flex items-center gap-1 text-[9px] text-red-400 border border-red-900 bg-red-900/20 px-1.5 py-0.5 rounded" title="Potential Bad Actor">
                            <Icons.Alert />
                            <span className="hidden sm:inline">SUSPICIOUS</span>
                        </div>
                    )}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${highContrast ? 'bg-black text-white' : source.reliabilityScore > 80 ? 'text-sophon-success bg-sophon-success/10' : 'text-sophon-danger bg-sophon-danger/10'}`}>{source.reliabilityScore}%</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {report.evolutionTrace && report.evolutionTrace.length > 0 && (
            <>
                <button 
                    onClick={() => setShowEvolution(!showEvolution)}
                    className={`text-xs flex items-center justify-between group/btn mt-2 ${highContrast ? 'text-white' : 'text-purple-400 hover:text-purple-300'}`}
                >
                    <span className="font-mono tracking-wide">{showEvolution ? 'HIDE VIRAL TRAJECTORY' : 'VIEW VIRAL TRAJECTORY'}</span>
                    <span className={`transform transition-transform ${showEvolution ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {showEvolution && <EvolutionVisualizer stages={report.evolutionTrace} highContrast={highContrast} />}
            </>
        )}
      </div>
    </div>
  );
};

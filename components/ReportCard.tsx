
import React, { useState } from 'react';
import { Report, VerdictType, SourceCategory } from '../types';
import { neutralizeBias } from '../services/geminiService';
import { EvolutionVisualizer } from './EvolutionVisualizer';

interface ReportCardProps {
  report: Report;
  highContrast?: boolean;
  onDeepDive?: (report: Report) => void;
}

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

export const ReportCard: React.FC<ReportCardProps> = ({ report, highContrast, onDeepDive }) => {
  const [expanded, setExpanded] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [neutralizedText, setNeutralizedText] = useState<string | null>(null);
  const [isNeutralizing, setIsNeutralizing] = useState(false);
  const [showNeutralized, setShowNeutralized] = useState(false);

  const glowColor = highContrast ? '' :
    report.verdict === VerdictType.VERIFIED ? 'hover:shadow-[0_0_30px_rgba(0,255,159,0.1)] hover:border-sophon-success/50' :
    report.verdict === VerdictType.FALSE ? 'hover:shadow-[0_0_30px_rgba(255,0,60,0.15)] hover:border-sophon-danger/50' :
    'hover:shadow-[0_0_30px_rgba(252,238,10,0.1)] hover:border-sophon-warning/50';

  const baseBorder = highContrast ? 'border-white' :
    report.verdict === VerdictType.VERIFIED ? 'border-l-4 border-l-sophon-success border-y border-r border-y-white/5 border-r-white/5' :
    report.verdict === VerdictType.FALSE ? 'border-l-4 border-l-sophon-danger border-y border-r border-y-white/5 border-r-white/5' :
    report.verdict === VerdictType.MISLEADING ? 'border-l-4 border-l-sophon-warning border-y border-r border-y-white/5 border-r-white/5' :
    'border-l-4 border-gray-600 border-y border-r border-white/5';
    
  const speakReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const text = `Verdict: ${report.verdict}. Topic: ${report.topic}. Summary: ${showNeutralized && neutralizedText ? neutralizedText : report.summary}`;
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
  };

  const downloadReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    const element = document.createElement("a");
    const file = new Blob([`SOPHON INTEL REPORT\n\nID: ${report.id}\nTOPIC: ${report.topic}\nCLAIM: ${report.claim}\nVERDICT: ${report.verdict}\nCONFIDENCE: ${report.confidenceScore}%\n\nSUMMARY:\n${report.summary}\n\nSOURCES:\n${report.sources.map(s => `- ${s.title} (${s.url})`).join('\n')}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `SOPHON_INTEL_${report.id.slice(0,8)}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const shareToTwitter = (e: React.MouseEvent) => {
    e.stopPropagation();
    const icon = report.verdict === VerdictType.VERIFIED ? '✅' : report.verdict === VerdictType.FALSE ? '❌' : '⚠️';
    const text = `🚨 SOPHON REPORT\n\nTOPIC: ${report.topic}\nVERDICT: ${icon} ${report.verdict}\n\n${report.summary}\n\nVerified via Sophon Sentinel. #FactCheck`;
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

  const sourceDates = report.sources.map(s => s.date).filter(Boolean).sort();
  const latestDate = sourceDates.length > 0 ? sourceDates[0] : null;

  // SOCIAL SENTIMENT HELPER
  const getSentimentIcon = (sentiment: string) => {
      switch(sentiment) {
          case 'ANGRY': return '😡';
          case 'FEARFUL': return '😨';
          case 'HAPPY': return '😁';
          case 'DIVIDED': return '🌗';
          default: return '😐';
      }
  };

  const getSentimentColor = (sentiment: string) => {
      switch(sentiment) {
          case 'ANGRY': return 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]';
          case 'FEARFUL': return 'text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]';
          case 'HAPPY': return 'text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]';
          case 'DIVIDED': return 'text-yellow-500';
          default: return 'text-blue-400';
      }
  };

  const pulse = report.socialPulse || { sentiment: 'NEUTRAL', score: 50, topNarrative: 'No social signal detected.', hotSpots: [] };

  return (
    <div className={`glass-panel p-5 rounded-xl transition-all duration-300 group hover:-translate-y-1 ${baseBorder} ${glowColor}`}>
      {/* Header Row */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 flex-wrap">
           <span className="text-[10px] font-mono text-gray-500 bg-black/30 px-2 py-1 rounded">ID: {report.id.slice(0, 8)}</span>
           <VerdictBadge verdict={report.verdict} highContrast={highContrast} />
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
                        className={`h-full transition-all duration-1000 ease-out ${highContrast ? 'bg-white' : report.sourceReliability > 70 ? 'bg-sophon-success shadow-[0_0_10px_#00ff9f]' : report.sourceReliability > 40 ? 'bg-sophon-warning' : 'bg-sophon-danger'}`} 
                        style={{ width: `${report.sourceReliability}%` }}
                    ></div>
                 </div>
            </div>
        </div>
      </div>

      {/* Title & Actions */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <h3 className="text-lg font-bold text-white leading-tight flex-1 tracking-tight group-hover:text-sophon-accent transition-colors duration-300 cursor-default">{report.topic}</h3>
        <div className="flex gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {onDeepDive && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDeepDive(report); }}
                    className={`p-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all ${highContrast ? 'bg-white text-black border-black' : 'bg-sophon-accent/10 text-sophon-accent border-sophon-accent/30 hover:bg-sophon-accent/20 hover:scale-105'}`}
                >
                    💬 CHAT
                </button>
            )}
            <button onClick={handleNeutralize} title="Neutralize Bias" className={`p-2 rounded-lg border transition-all hover:scale-110 ${highContrast ? 'border-white text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-white/5'}`}>
                {isNeutralizing ? '...' : '⚖️'}
            </button>
            <button onClick={shareToTwitter} title="Share to X" className={`p-2 rounded-lg border transition-all hover:scale-110 ${highContrast ? 'border-white text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-white/5'}`}>
                ✖
            </button>
            <button onClick={speakReport} title="Read Aloud" className={`p-2 rounded-lg border transition-all hover:scale-110 ${highContrast ? 'border-white text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-white/5'}`}>
                🔊
            </button>
            <button onClick={downloadReport} title="Download" className={`p-2 rounded-lg border transition-all hover:scale-110 ${highContrast ? 'border-white text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-white/5'}`}>
                ⬇
            </button>
        </div>
      </div>
      
      {/* Claim Context */}
      <div className={`mb-4 p-4 rounded-lg border transition-colors ${highContrast ? 'bg-white text-black border-black' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
        <p className={`text-[10px] uppercase mb-1 font-mono tracking-wider ${highContrast ? 'text-black' : 'text-gray-500'}`}>Analyzed Claim:</p>
        <p className={`italic font-serif text-sm ${highContrast ? 'text-black' : 'text-gray-200'}`}>"{report.claim}"</p>
      </div>

      {/* SOCIAL PULSE (ECHO CHAMBER ANALYSIS) */}
      <div className={`mb-4 p-3 rounded-lg flex items-center gap-4 transition-all ${highContrast ? 'bg-gray-100 text-black border border-black' : 'bg-gradient-to-r from-white/5 to-transparent border border-white/10 hover:border-white/20'}`}>
          <div className="flex flex-col items-center border-r border-gray-600 pr-4 min-w-[60px]">
              <div className={`text-2xl transition-transform hover:scale-125 ${highContrast ? 'text-black' : getSentimentColor(pulse.sentiment)}`}>
                  {getSentimentIcon(pulse.sentiment)}
              </div>
              <span className={`text-[8px] font-bold uppercase mt-1 ${highContrast ? 'text-black' : getSentimentColor(pulse.sentiment)}`}>{pulse.sentiment}</span>
          </div>
          <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] text-gray-500 uppercase font-mono">LIVE SOCIAL PULSE</p>
                  <div className="flex gap-1">
                      {pulse.hotSpots.map(platform => (
                          <span key={platform} className={`text-[8px] px-1.5 py-0.5 rounded border uppercase ${highContrast ? 'border-black text-black' : 'border-gray-700 text-gray-500 bg-black/20'}`}>{platform}</span>
                      ))}
                  </div>
              </div>
              <p className={`text-xs italic ${highContrast ? 'text-black' : 'text-gray-300'}`}>"{pulse.topNarrative}"</p>
          </div>
      </div>

      {/* Key Evidence */}
      {report.keyEvidence && report.keyEvidence.length > 0 && (
         <div className="mb-4 grid gap-2">
             {report.keyEvidence.map((ev, i) => (
                 <div key={i} className={`text-xs p-3 rounded-lg border-l-2 flex gap-3 items-start ${highContrast ? 'bg-black text-white border-white' : ev.type === 'SUPPORTING' ? 'bg-sophon-success/5 border-sophon-success/40 text-gray-300' : 'bg-sophon-danger/5 border-sophon-danger/40 text-gray-300'}`}>
                     <span className={`font-bold text-sm ${ev.type === 'SUPPORTING' ? 'text-green-400' : 'text-red-400'}`}>{ev.type === 'SUPPORTING' ? '✓' : '✕'}</span>
                     <span className="leading-snug">{ev.point}</span>
                 </div>
             ))}
         </div>
      )}

      {/* Summary / Neutralized */}
      <div className={`relative transition-all duration-500 ${showNeutralized ? 'bg-blue-500/10 p-3 rounded-lg border-l-2 border-blue-500' : ''}`}>
          {showNeutralized && <span className="block text-[9px] font-bold text-blue-400 mb-2 tracking-widest">NEUTRALIZED CONTEXT:</span>}
          <p className={`text-sm leading-relaxed mb-4 ${highContrast ? 'text-white' : 'text-gray-300'}`}>
            {showNeutralized ? neutralizedText : report.summary}
          </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {report.tags.map(tag => (
          <span key={tag} className="text-[9px] font-bold uppercase text-gray-500 px-2 py-1 border border-gray-800 bg-black/30 rounded hover:border-gray-600 hover:text-gray-300 transition-colors cursor-default">#{tag}</span>
        ))}
      </div>

      {/* FOOTER CONTROLS */}
      <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
        
        {/* Sources Toggle */}
        <button 
          onClick={() => setExpanded(!expanded)}
          className={`text-xs flex items-center justify-between group/btn ${highContrast ? 'text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <span className="font-mono tracking-wide">{expanded ? 'HIDE SOURCES' : `VIEW SOURCE ANALYSIS (${report.sources.length})`}</span>
          <span className={`transform transition-transform ${expanded ? 'rotate-180' : ''} ${highContrast ? '' : 'text-sophon-accent'}`}>▼</span>
        </button>
        
        {expanded && (
          <ul className="mt-2 space-y-2 animate-fadeIn">
            {report.sources.map((source, idx) => (
              <li key={idx} className={`flex items-center justify-between text-xs p-2.5 rounded-lg border transition-colors ${highContrast ? 'bg-white text-black border-black' : 'bg-black/40 border-white/5 hover:border-white/20 text-gray-300'}`}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate flex-1 font-bold">{source.title}</a>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${highContrast ? 'bg-black text-white' : source.reliabilityScore > 80 ? 'text-sophon-success bg-sophon-success/10' : 'text-sophon-danger bg-sophon-danger/10'}`}>{source.reliabilityScore}%</span>
              </li>
            ))}
          </ul>
        )}

        {/* Evolution Toggle */}
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

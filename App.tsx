
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgentStatus, LogEntry, Report, VerdictType, NewsItem } from './types';
import { scanForTopics, investigateTopic, analyzeManualQuery, analyzeImageClaim, analyzeAudioClaim, fetchGlobalNews } from './services/geminiService';
import { TerminalLog } from './components/TerminalLog';
import { ReportCard } from './components/ReportCard';
import { HolographicGlobe } from './components/HolographicGlobe';
import { ThreatDashboard } from './components/ThreatDashboard';
import { LiveTicker } from './components/LiveTicker';
import { ArchivePanel } from './components/ArchivePanel';
import { ImageUploader } from './components/ImageUploader';
import { VoiceInput } from './components/VoiceInput';
import { WhatsAppConnect } from './components/WhatsAppConnect';
import { IntelChat } from './components/IntelChat';
import { PublisherPortal } from './components/PublisherPortal';
import { GlobalNewsFeed } from './components/GlobalNewsFeed';
import { GameMode } from './components/GameMode';
import { DeconstructionLab } from './components/DeconstructionLab';
import { AgentID } from './components/AgentID';
import { SophonLogo } from './components/SophonLogo';

// GAMIFICATION CONSTANTS
const XP_EVENTS = {
    SCAN_COMPLETE: 50,
    THREAT_FOUND: 100,
    MANUAL_ANALYSIS: 25,
    FORENSIC_ANALYSIS: 40
};

// Level Up Toast Component
const LevelUpToast = ({ rank, onClose }: { rank: string, onClose: () => void }) => (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn">
        <div className="bg-black/90 border-2 border-sophon-accent p-6 rounded-lg shadow-[0_0_50px_rgba(0,240,255,0.4)] text-center">
            <div className="text-4xl mb-2">⭐</div>
            <h2 className="text-xl font-bold text-white font-mono tracking-widest">PROMOTION AUTHORIZED</h2>
            <p className="text-sophon-accent text-sm mt-1">RANK: {rank}</p>
            <button onClick={onClose} className="mt-4 px-4 py-1 text-xs border border-white/20 hover:bg-white/10 rounded">DISMISS</button>
        </div>
    </div>
);

export default function App() {
  // --- STATE ---
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [reports, setReports] = useState<Report[]>([]);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  
  const [archive, setArchive] = useState<Report[]>(() => {
    try {
      const saved = localStorage.getItem('sophon_archive');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [scanInterval, setScanInterval] = useState(180000); // 3 minutes strictly enforced
  const [autoDeepScan, setAutoDeepScan] = useState(false);
  
  const [manualInput, setManualInput] = useState('');
  const [activeSector, setActiveSector] = useState<string>('GLOBAL_WIRE');
  const [scannedCandidates, setScannedCandidates] = useState<{ query: string, sector: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'threats' | 'archive' | 'publisher'>('feed');
  const [deepScanMode, setDeepScanMode] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [chatReport, setChatReport] = useState<Report | null>(null);
  
  const [highContrast, setHighContrast] = useState(false);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- XP SYSTEM ---
  const [xp, setXp] = useState(() => {
      const saved = localStorage.getItem('sophon_xp');
      return saved ? parseInt(saved) : 0;
  });
  const [showLevelUp, setShowLevelUp] = useState<{show: boolean, rank: string}>({show: false, rank: ''});
  const prevRankRef = useRef('');

  useEffect(() => {
    localStorage.setItem('sophon_xp', xp.toString());
    
    // Check for rank up (Simple simulation logic mirroring AgentID)
    const getRank = (x: number) => {
        if (x > 5000) return 'ARCHITECT';
        if (x > 2000) return 'SENTINEL';
        if (x > 500) return 'ANALYST';
        if (x > 0) return 'OBSERVER';
        return 'INFORMANT';
    };
    
    const currentRank = getRank(xp);
    if (prevRankRef.current && currentRank !== prevRankRef.current) {
        setShowLevelUp({ show: true, rank: currentRank });
        addLog(`PROMOTION: Agent rank updated to ${currentRank}`, 'success');
    }
    prevRankRef.current = currentRank;

  }, [xp]);

  const awardXP = (amount: number, reason: string) => {
      setXp(prev => prev + amount);
      // Optional: Add small log for XP? 
      // addLog(`+${amount} XP: ${reason}`, 'success');
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
    if (!highContrast) {
        document.body.classList.add('high-contrast');
    } else {
        document.body.classList.remove('high-contrast');
    }
  };

  useEffect(() => {
    localStorage.setItem('sophon_archive', JSON.stringify(archive));
  }, [archive]);

  // Initial News Load
  useEffect(() => {
    refreshGlobalNews();
  }, []);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      message,
      type
    }]);
  };

  const refreshGlobalNews = async () => {
      setIsNewsLoading(true);
      try {
          const liveData = await fetchGlobalNews();
          if (liveData && liveData.length > 0) {
              const formatted: NewsItem[] = liveData.map((item, idx) => ({
                  id: `gn-${idx}-${Date.now()}`,
                  headline: item.headline,
                  summary: item.summary,
                  source: item.source || "Global Wire",
                  time: item.time || "Recent",
                  url: item.url || "#",
                  upvotes: Math.floor(Math.random() * 50) + 5
              }));
              setGlobalNews(formatted);
              addLog("Global News Wire Synced.", 'success');
          } else {
              addLog("Global News Wire sync empty or failed.", 'warning');
          }
      } catch (e) {
          console.error("Feed Error", e);
      }
      setIsNewsLoading(false);
  };

  const handleNewReport = (report: Report) => {
     setReports(prev => [report, ...prev]);
     setArchive(prev => {
        if (prev.some(r => r.id === report.id)) return prev;
        return [report, ...prev];
     });
  };

  const handleArchiveImport = (importedReports: Report[]) => {
      const newArchive = [...archive];
      let count = 0;
      importedReports.forEach(r => {
          if (!newArchive.some(existing => existing.id === r.id)) {
              newArchive.unshift(r);
              count++;
          }
      });
      setArchive(newArchive);
      addLog(`Database Injection Complete. Added ${count} new records.`, 'success');
  };

  const performScanCycle = useCallback(async () => {
    if (status !== AgentStatus.IDLE && status !== AgentStatus.SCANNING) return;

    try {
      setStatus(AgentStatus.SCANNING);
      addLog(`Initiating Federated Scan: News, Reddit & 4chan...`, 'action');
      
      // Step 1: Fetch diverse targets (News + Rumors)
      const results = await scanForTopics();
      setScannedCandidates(results); 

      if (results.length === 0) {
          addLog(`Scan returned no viable targets.`, 'info');
          setStatus(AgentStatus.IDLE);
          return;
      }

      addLog(`Targets Acquired: ${results.length} nodes (News, Reddit, Anon). Processing batch...`, 'info');

      // Step 2: Process Batch Loop
      for (const target of results) {
          // Break if user stopped scan
          if (!scanIntervalRef.current) break;

          setActiveSector(target.sector); // Update UI to show we are scanning Reddit/4chan etc
          setStatus(AgentStatus.VERIFYING);
          
          addLog(`Scanning Sector [${target.sector}]: "${target.query}"`, 'action');
          
          const report = await investigateTopic(target.query, target.sector, autoDeepScan);
          
          if (report) {
             handleNewReport(report);
             awardXP(XP_EVENTS.SCAN_COMPLETE, "Scan Complete");

             const msgType = report.verdict === VerdictType.VERIFIED ? 'success' :
                             report.verdict === VerdictType.FALSE ? 'error' : 'warning';
             
             if (report.verdict === VerdictType.FALSE || report.verdict === VerdictType.MISLEADING) {
                 addLog(`⚠️ THREAT DETECTED: ${report.topic}`, 'error');
                 awardXP(XP_EVENTS.THREAT_FOUND, "Threat Neutralized");
             } else {
                 addLog(`Verdict: ${report.verdict} [Conf: ${report.confidenceScore}%]`, msgType);
             }
          }

          // Small delay between batch items to prevent API slamming and simulate processing time
          await new Promise(r => setTimeout(r, 2500));
      }

    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      if (errorMsg.includes("429") || errorMsg.includes("quota")) {
          addLog("⚠️ API RATE LIMIT REACHED. PAUSING AUTO-SCAN.", 'error');
          setIsAutoScanning(false);
          return;
      }
      addLog(`System Error: ${errorMsg}`, 'error');
    } finally {
      setStatus(AgentStatus.IDLE);
      setActiveSector('STANDBY');
      addLog(`Batch Scan Complete. Monitoring loop active (${scanInterval/1000}s).`, 'info');
    }
  }, [status, autoDeepScan, scanInterval]);

  // LOGGING EFFECT: Only fires when toggling Scanning ON/OFF
  useEffect(() => {
    if (isAutoScanning) {
        addLog(`Sentinel Loop Engaged. Interval: ${scanInterval/1000}s`, 'success');
        if (status === AgentStatus.IDLE) {
            performScanCycle();
        }
    } else {
        if (scanIntervalRef.current) {
             // Only log termination if we were previously scanning
             addLog('Sentinel Loop Terminated.', 'warning');
        }
    }
  }, [isAutoScanning]);

  // INTERVAL EFFECT: Manages the loop separately from the logs to prevent spam
  useEffect(() => {
    if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
    }

    if (isAutoScanning) {
      scanIntervalRef.current = setInterval(() => {
        performScanCycle();
      }, scanInterval); 
    } else {
      setActiveSector('STANDBY');
      setScannedCandidates([]);
    }
    
    return () => {
      if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
      }
    };
  }, [isAutoScanning, scanInterval, performScanCycle]);

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    if (isAutoScanning) setIsAutoScanning(false);

    setStatus(AgentStatus.ANALYZING);
    setActiveSector('USER_INPUT');
    addLog(`Manual RAG Request: "${manualInput}" [Deep Scan: ${deepScanMode ? 'ON' : 'OFF'}]`, 'action');

    try {
        const report = await analyzeManualQuery(manualInput, deepScanMode);
        if (report) {
            handleNewReport(report);
            addLog(`Report generated. Lang: ${report.detectedLanguage || 'EN'}`, 'success');
            awardXP(XP_EVENTS.MANUAL_ANALYSIS, "Manual Query");
            if (report.verdict === VerdictType.FALSE) awardXP(XP_EVENTS.THREAT_FOUND, "Found Threat");
        } else {
            addLog('Could not retrieve sufficient context.', 'error');
        }
    } catch (e) {
         const errorMsg = e instanceof Error ? e.message : String(e);
         if (errorMsg.includes("429")) {
             addLog("⚠️ RATE LIMIT. Please wait 2 minutes.", 'error');
         } else {
             addLog("Manual verification failed.", 'error');
         }
    }
    setStatus(AgentStatus.IDLE);
    setManualInput('');
  };

  const handleVoiceInput = (text: string) => {
      setManualInput(text);
      setTimeout(() => {
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          handleManualVerify(fakeEvent);
      }, 500);
  };
  
  const handleMediaUpload = async (mediaData: { base64: string, mimeType: string }) => {
    if (isAutoScanning) setIsAutoScanning(false);
    setStatus(AgentStatus.ANALYZING);
    setActiveSector('FORENSIC_SCAN');
    
    const isAudio = mediaData.mimeType.startsWith('audio/') || mediaData.mimeType.includes('audio');
    const isPdf = mediaData.mimeType.includes('pdf');
    
    try {
        let report;
        if (isAudio) {
            addLog(`Initiating Audio Forensic Analysis...`, 'action');
            report = await analyzeAudioClaim(mediaData.base64, mediaData.mimeType);
        } else if (isPdf) {
            addLog(`Initiating Document Verification...`, 'action');
            report = await analyzeImageClaim(mediaData.base64, mediaData.mimeType);
        } else {
            addLog(`Initiating Vision Analysis...`, 'action');
            report = await analyzeImageClaim(mediaData.base64, mediaData.mimeType);
        }

        if (report) {
            handleNewReport(report);
            awardXP(XP_EVENTS.FORENSIC_ANALYSIS, "Forensic Scan");
            addLog(`Forensic Analysis Complete. Verdict: ${report.verdict}`, 'success');
        }
    } catch (e) {
        console.error(e);
        addLog(`Forensic Analysis Failed.`, 'error');
    }
    setStatus(AgentStatus.IDLE);
  };

  const threatCount = reports.filter(r => r.verdict === VerdictType.FALSE || r.verdict === VerdictType.MISLEADING).length;

  return (
    <div className={`min-h-screen ${highContrast ? 'bg-black text-white' : 'bg-sophon-dark text-gray-200'} selection:bg-sophon-accent/30 selection:text-white overflow-x-hidden`}>
      
      {showLevelUp.show && <LevelUpToast rank={showLevelUp.rank} onClose={() => setShowLevelUp({show: false, rank: ''})} />}

      <LiveTicker activeSector={activeSector} threatLevel={threatCount > 5 ? 'HIGH' : 'LOW'} news={globalNews} highContrast={highContrast} />

      <WhatsAppConnect isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} highContrast={highContrast} />
      {chatReport && (
          <IntelChat report={chatReport} onClose={() => setChatReport(null)} highContrast={highContrast} />
      )}

      <nav className={`sticky top-0 w-full z-50 border-b ${highContrast ? 'bg-black border-white' : 'border-white/5 bg-sophon-dark/90 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <SophonLogo className={`w-8 h-8 rounded-full object-cover transition-all duration-500 group-hover:scale-110 ${highContrast ? 'border-2 border-white' : 'border border-sophon-accent'}`} />
            <h1 className="text-xl font-bold tracking-tight group-hover:text-sophon-accent transition-colors">SOPHON <span className={`font-light ml-2 text-sm hidden sm:inline-block ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>SENTINEL SYSTEM v2.5</span></h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 font-mono text-xs">
               <div className="flex flex-col items-end">
                   <span className="text-gray-500 text-[10px]">CURRENT VECTOR</span>
                   <span className={`font-bold transition-all ${highContrast ? 'text-black' : activeSector === 'ANON_RUMORS' ? 'text-sophon-danger animate-pulse' : activeSector === 'REDDIT_HIVE' ? 'text-orange-500' : 'text-sophon-accent'}`}>
                       {activeSector}
                   </span>
               </div>
               <div className="h-8 w-px bg-white/10"></div>
               <div className="flex flex-col items-end">
                    <span className="text-gray-500 text-[10px]">SYSTEM STATUS</span>
                    <span className={`${status === AgentStatus.IDLE ? 'text-gray-400' : highContrast ? 'text-white' : 'text-sophon-accent animate-pulse'}`}>{status}</span>
               </div>
            </div>

            <button 
                onClick={toggleHighContrast}
                className={`p-2 rounded border transition-colors ${highContrast ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}
                title={highContrast ? "Disable High Contrast" : "Enable Accessibility Mode"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 00-.556.144L8.304 16H6a1 1 0 01-1-1v-5.382l-1.725 3.45a1 1 0 01-1.789-.894l.8-1.599L.677 11H2a1 1 0 01-1-1h2V6a1 1 0 011-1h1.323L10 2.053V2zM7 6v6.17l.732 1.464a3 3 0 00.993-1.748l1.23-3.838a1 1 0 011.083-.757l3.864.552A3.996 3.996 0 0013 5h-2a1 1 0 01-1-1V3.17L7 6z" />
                </svg>
            </button>
            
            <div className="flex items-center gap-2">
                <select 
                    value={scanInterval} 
                    onChange={(e) => setScanInterval(Number(e.target.value))}
                    disabled={isAutoScanning}
                    className={`text-[10px] p-1 rounded bg-black/40 border ${highContrast ? 'border-white text-white' : 'border-gray-700 text-gray-300'}`}
                >
                    <option value={60000}>1m</option>
                    <option value={120000}>2m</option>
                    <option value={180000}>3m</option>
                    <option value={300000}>5m</option>
                </select>
                <button
                    onClick={() => setAutoDeepScan(!autoDeepScan)}
                    disabled={isAutoScanning}
                    className={`text-[10px] px-2 py-1 rounded border ${autoDeepScan ? 'bg-purple-500/20 text-purple-400 border-purple-500' : 'bg-black/40 text-gray-500 border-gray-700'}`}
                    title="Deep Scan Mode"
                >
                    DEEP
                </button>
                <button
                onClick={() => setIsAutoScanning(!isAutoScanning)}
                className={`px-4 py-2 rounded font-mono text-xs font-bold transition-all border ${
                    isAutoScanning 
                    ? 'bg-sophon-danger/10 border-sophon-danger text-sophon-danger hover:bg-sophon-danger/20 animate-pulse' 
                    : highContrast ? 'bg-white text-black border-white' : 'bg-sophon-accent/10 border-sophon-accent text-sophon-accent hover:bg-sophon-accent/20 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                }`}
                >
                {isAutoScanning ? 'TERMINATE' : 'AUTO SCAN'}
                </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-8 pb-12 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
           
           {/* AGENT PROFILE CARD - NOW WITH XP FROM APP STATE */}
           <AgentID xp={xp} highContrast={highContrast} />

           <div className={`glass-panel p-6 rounded-lg flex flex-col items-center justify-center relative overflow-hidden ${highContrast ? 'border-2 border-white' : ''}`}>
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
             {!highContrast && <HolographicGlobe reports={reports} news={globalNews} highContrast={highContrast} />}
             <div className="mt-6 text-center w-full">
                <h2 className="text-sm font-mono text-gray-400 tracking-widest">THREAT DETECTION</h2>
                <div className="flex justify-around mt-4 border-t border-white/5 pt-4">
                    <div className="text-center">
                        <span className="text-xl font-bold text-white block">{reports.length}</span>
                        <span className="text-[9px] text-gray-500 uppercase">Session Reports</span>
                    </div>
                    <div className="text-center">
                        <span className={`text-xl font-bold block ${highContrast ? 'text-white' : 'text-sophon-danger'}`}>
                            {threatCount}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase">Active Threats</span>
                    </div>
                </div>
             </div>
           </div>

           {/* ACTIVE SECTOR SCAN VISUALIZATION */}
           <div className={`p-4 rounded-lg border animate-fadeIn ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-sophon-accent/40 bg-sophon-accent/5'}`}>
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-widest opacity-70">Target Acquisition</span>
                  {(status === AgentStatus.SCANNING || status === AgentStatus.VERIFYING) && (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-sophon-accent animate-ping"></div>
                    </div>
                  )}
               </div>
               
               <div className="flex flex-col gap-2 mb-3">
                   <div className={`text-[10px] px-3 py-2 rounded border text-center transition-colors duration-500 ${
                       highContrast ? 'bg-black text-white' : 
                       activeSector === 'ANON_RUMORS' ? 'bg-sophon-danger/10 text-sophon-danger border-sophon-danger/30' :
                       activeSector === 'REDDIT_HIVE' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' :
                       'bg-sophon-accent/10 text-sophon-accent border-sophon-accent/30'
                   }`}>
                       SCANNING: {activeSector}
                   </div>
               </div>
               
               {scannedCandidates.length > 0 && (
                   <div className="mt-3 pt-2 border-t border-white/10 animate-fadeIn">
                       <p className="text-[9px] text-gray-500 font-mono mb-1 uppercase tracking-widest">Processing Batch:</p>
                       <div className="flex flex-col gap-1">
                           {scannedCandidates.map((c, i) => (
                               <div key={i} className={`flex justify-between items-center text-[9px] px-2 py-1 rounded border truncate ${highContrast ? 'bg-black text-white border-black' : 'bg-white/5 border-white/10'}`} style={{ opacity: status === AgentStatus.VERIFYING && activeSector === c.sector ? 1 : 0.5 }}>
                                   <span className="truncate flex-1">{c.query}</span>
                                   <span className={`ml-2 text-[8px] font-bold ${c.sector === 'ANON_RUMORS' ? 'text-sophon-danger' : c.sector === 'REDDIT_HIVE' ? 'text-orange-400' : 'text-sophon-accent'}`}>[{c.sector.split('_')[0]}]</span>
                               </div>
                           ))}
                       </div>
                   </div>
               )}

               {isAutoScanning && status === AgentStatus.IDLE && (
                   <div className="mt-2 text-[9px] text-gray-500 font-mono text-center">
                       NEXT BATCH IN {(scanInterval / 60000).toFixed(1)}m...
                   </div>
               )}
           </div>
           
           <GlobalNewsFeed news={globalNews} onRefresh={refreshGlobalNews} loading={isNewsLoading} highContrast={highContrast} />
           <ImageUploader onMediaSelected={handleMediaUpload} disabled={status !== AgentStatus.IDLE} highContrast={highContrast} />
           <TerminalLog logs={logs} highContrast={highContrast} />
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className={`glass-panel p-6 rounded-lg border-t-2 transition-all hover:border-opacity-100 ${highContrast ? 'border-white' : 'border-sophon-accent border-opacity-60 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]'}`}>
             <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 tracking-widest ${highContrast ? 'text-white' : 'text-sophon-accent'}`}>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
               </svg>
               QUERY INTELLIGENCE DATABASE
             </h3>
             <form onSubmit={handleManualVerify} className="flex flex-col gap-3">
                 <div className="flex gap-3">
                    <VoiceInput onInput={handleVoiceInput} disabled={status !== AgentStatus.IDLE && !isAutoScanning} highContrast={highContrast} />
                    <div className="flex-1 relative group">
                        <input 
                            type="text" 
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            placeholder="Enter claim to verify..."
                            className={`w-full h-full rounded-lg p-4 pl-4 text-base focus:outline-none transition-all ${highContrast ? 'bg-white text-black border-2 border-black focus:border-black' : 'bg-black/60 border border-gray-700 text-white focus:border-sophon-accent focus:bg-black/80 shadow-inner'}`}
                        />
                    </div>
                    <button 
                    type="submit" 
                    disabled={status !== AgentStatus.IDLE && !isAutoScanning}
                    className={`px-6 py-4 font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-50 ${highContrast ? 'bg-white text-black border-2 border-black hover:bg-gray-200' : 'bg-sophon-accent text-black hover:bg-white hover:shadow-[0_0_15px_rgba(0,240,255,0.6)]'}`}
                    >
                    ANALYZE
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    </button>
                 </div>
             </form>
             <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] text-gray-500 italic">
                   Multilingual RAG Active: Supports Devanagari script & Hinglish
                </p>
                <span className={`text-[10px] font-mono ${highContrast ? 'text-white' : 'text-sophon-success'}`}>SYSTEM READY</span>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">LIVE INTELLIGENCE FEED</h2>
            <div className={`flex p-1 rounded-lg border w-full sm:w-auto overflow-x-auto ${highContrast ? 'bg-black border-white' : 'bg-black/40 border-white/10'}`}>
                <button 
                    onClick={() => setActiveTab('feed')}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'feed' ? (highContrast ? 'bg-white text-black' : 'bg-sophon-accent text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]') : 'text-gray-400 hover:text-white'}`}
                >
                    DASHBOARD
                </button>
                <button 
                    onClick={() => setActiveTab('threats')}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'threats' ? (highContrast ? 'bg-white text-black' : 'bg-sophon-danger text-white shadow-[0_0_10px_rgba(255,0,60,0.4)]') : 'text-gray-400 hover:text-white'}`}
                >
                    THREAT MATRIX
                    {threatCount > 0 && (
                        <span className={`text-[9px] px-1 rounded-full ${highContrast ? 'bg-black text-white' : 'bg-white text-sophon-danger'}`}>{threatCount}</span>
                    )}
                </button>
                 <button 
                    onClick={() => setActiveTab('archive')}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'archive' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    ARCHIVE ({archive.length})
                </button>
                <button 
                    onClick={() => setActiveTab('publisher')}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'publisher' ? (highContrast ? 'bg-white text-black' : 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]') : 'text-gray-400 hover:text-white'}`}
                >
                    PUBLISHER
                </button>
            </div>
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'feed' && (
                <div className="space-y-4 animate-fadeIn">
                    
                    {/* GAME MODE TRAINING */}
                    <div className="mb-6">
                        <GameMode highContrast={highContrast} onXPEarned={(amount) => awardXP(amount, "Cognitive Drill")} />
                    </div>

                    {/* EDUCATIONAL HUB */}
                    <div className="mb-6">
                        <DeconstructionLab highContrast={highContrast} />
                    </div>

                    {reports.length === 0 ? (
                    <div className={`text-center py-10 border-2 border-dashed rounded-lg ${highContrast ? 'border-white' : 'border-gray-800'}`}>
                        <p className="text-gray-500 font-mono">NO ACTIVE SESSION DATA</p>
                        <p className="text-gray-600 text-sm mt-2">Initiate scan or check Archive for history</p>
                    </div>
                    ) : (
                    reports.map(report => (
                        <ReportCard 
                            key={report.id} 
                            report={report} 
                            highContrast={highContrast} 
                            onDeepDive={setChatReport}
                        />
                    ))
                    )}
                </div>
            )}
            
            {activeTab === 'threats' && (
                <ThreatDashboard reports={reports} />
            )}

            {activeTab === 'archive' && (
                <ArchivePanel archive={archive} onImport={handleArchiveImport} />
            )}

            {activeTab === 'publisher' && (
                <PublisherPortal highContrast={highContrast} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

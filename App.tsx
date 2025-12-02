
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

const XP_EVENTS = {
    SCAN_COMPLETE: 50,
    THREAT_FOUND: 100, // Only for actual debunked lies
    MANUAL_ANALYSIS: 25,
    FORENSIC_ANALYSIS: 40
};

const LevelUpToast = ({ rank, onClose }: { rank: string, onClose: () => void }) => (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn">
        <div className="bg-black/90 border-2 border-sophon-accent p-6 rounded-lg shadow-[0_0_50px_rgba(0,240,255,0.4)] text-center backdrop-blur-xl">
            <div className="text-4xl mb-2">⭐</div>
            <h2 className="text-xl font-bold text-white font-mono tracking-widest">PROMOTION AUTHORIZED</h2>
            <p className="text-sophon-accent text-sm mt-1">RANK: {rank}</p>
            <button onClick={onClose} className="mt-4 px-4 py-1 text-xs border border-white/20 hover:bg-white/10 rounded">DISMISS</button>
        </div>
    </div>
);

export default function App() {
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [reports, setReports] = useState<Report[]>([]);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  
  const [archive, setArchive] = useState<Report[]>(() => {
    try {
      const saved = localStorage.getItem('sophon_archive');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [scanInterval, setScanInterval] = useState(180000); 
  const [autoDeepScan, setAutoDeepScan] = useState(false);
  
  const [manualInput, setManualInput] = useState('');
  const [activeSector, setActiveSector] = useState<string>('GLOBAL_MONITOR');
  const [scannedCandidates, setScannedCandidates] = useState<{ query: string, sector: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'threats' | 'archive' | 'publisher'>('feed');
  const [deepScanMode, setDeepScanMode] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [chatReport, setChatReport] = useState<Report | null>(null);
  
  const [highContrast, setHighContrast] = useState(false);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [xp, setXp] = useState(() => {
      const saved = localStorage.getItem('sophon_xp');
      return saved ? parseInt(saved) : 0;
  });
  const [showLevelUp, setShowLevelUp] = useState<{show: boolean, rank: string}>({show: false, rank: ''});
  const prevRankRef = useRef('');

  useEffect(() => {
    localStorage.setItem('sophon_xp', xp.toString());
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

  const awardXP = (amount: number, reason: string) => setXp(prev => prev + amount);

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
    if (!highContrast) document.body.classList.add('high-contrast');
    else document.body.classList.remove('high-contrast');
  };

  useEffect(() => { localStorage.setItem('sophon_archive', JSON.stringify(archive)); }, [archive]);
  useEffect(() => { refreshGlobalNews(); }, []);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { id: crypto.randomUUID(), timestamp: Date.now(), message, type }]);
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
      importedReports.forEach(r => {
          if (!newArchive.some(existing => existing.id === r.id)) newArchive.unshift(r);
      });
      setArchive(newArchive);
      addLog(`Database Injection Complete.`, 'success');
  };

  const performScanCycle = useCallback(async () => {
    if (status !== AgentStatus.IDLE && status !== AgentStatus.SCANNING) return;

    try {
      setStatus(AgentStatus.SCANNING);
      addLog(`Initiating Global Monitor Sequence...`, 'action');
      
      const results = await scanForTopics();
      setScannedCandidates(results); 

      if (results.length === 0) {
          addLog(`No significant new narratives detected.`, 'info');
          setStatus(AgentStatus.IDLE);
          return;
      }

      addLog(`Acquired ${results.length} narrative vectors. Analyzing...`, 'info');

      for (const target of results) {
          if (!scanIntervalRef.current) break;

          setActiveSector(target.sector); 
          setStatus(AgentStatus.VERIFYING);
          
          addLog(`Analyzing: "${target.query}"`, 'action');
          
          const report = await investigateTopic(target.query, target.sector, autoDeepScan);
          
          if (report) {
             handleNewReport(report);
             awardXP(XP_EVENTS.SCAN_COMPLETE, "Analysis Complete");

             const isThreat = report.verdict === VerdictType.FALSE || report.verdict === VerdictType.MISLEADING;
             
             if (isThreat) {
                 addLog(`⚠️ ANOMALY DETECTED: ${report.topic}`, 'error');
                 awardXP(XP_EVENTS.THREAT_FOUND, "Misinfo Identified");
             } else {
                 addLog(`Verified: ${report.topic} [Status: ${report.verdict}]`, 'success');
             }
          }
          await new Promise(r => setTimeout(r, 2500));
      }

    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      if (errorMsg.includes("429") || errorMsg.includes("quota")) {
          addLog("⚠️ API LIMIT. PAUSING MONITOR.", 'error');
          setIsAutoScanning(false);
          return;
      }
      addLog(`System Error: ${errorMsg}`, 'error');
    } finally {
      setStatus(AgentStatus.IDLE);
      setActiveSector('STANDBY');
      addLog(`Cycle Complete. Monitoring (${scanInterval/1000}s).`, 'info');
    }
  }, [status, autoDeepScan, scanInterval]);

  useEffect(() => {
    if (isAutoScanning) {
        addLog(`Monitor Loop Engaged. Interval: ${scanInterval/1000}s`, 'success');
        if (status === AgentStatus.IDLE) performScanCycle();
    } else {
        if (scanIntervalRef.current) addLog('Monitor Loop Terminated.', 'warning');
    }
  }, [isAutoScanning]);

  useEffect(() => {
    if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
    }
    if (isAutoScanning) {
      scanIntervalRef.current = setInterval(() => performScanCycle(), scanInterval); 
    } else {
      setActiveSector('STANDBY');
      setScannedCandidates([]);
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isAutoScanning, scanInterval, performScanCycle]);

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    if (isAutoScanning) setIsAutoScanning(false);

    setStatus(AgentStatus.ANALYZING);
    setActiveSector('USER_INPUT');
    addLog(`Analyzing Query: "${manualInput}"`, 'action');

    try {
        const report = await analyzeManualQuery(manualInput, deepScanMode);
        if (report) {
            handleNewReport(report);
            addLog(`Analysis Complete.`, 'success');
            awardXP(XP_EVENTS.MANUAL_ANALYSIS, "Manual Query");
        }
    } catch (e) {
         addLog("Analysis failed.", 'error');
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
    
    try {
        let report;
        addLog(`Processing Media...`, 'action');
        if (mediaData.mimeType.includes('audio')) report = await analyzeAudioClaim(mediaData.base64, mediaData.mimeType);
        else report = await analyzeImageClaim(mediaData.base64, mediaData.mimeType);

        if (report) {
            handleNewReport(report);
            awardXP(XP_EVENTS.FORENSIC_ANALYSIS, "Forensic Scan");
            addLog(`Media Analysis Complete.`, 'success');
        }
    } catch (e) {
        addLog(`Forensic Analysis Failed.`, 'error');
    }
    setStatus(AgentStatus.IDLE);
  };

  const threatCount = reports.filter(r => r.verdict === VerdictType.FALSE || r.verdict === VerdictType.MISLEADING).length;

  return (
    <div className={`min-h-screen relative ${highContrast ? 'bg-white text-black' : 'bg-[#020204] text-gray-200'} selection:bg-sophon-accent/30 selection:text-white overflow-x-hidden`}>
      
      {/* Dynamic Background */}
      {!highContrast && (
          <div className="fixed inset-0 pointer-events-none z-0">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sophon-accent/5 blur-[120px] animate-breathing"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sophon-purple/5 blur-[120px] animate-breathing" style={{ animationDelay: '4s' }}></div>
          </div>
      )}

      {showLevelUp.show && <LevelUpToast rank={showLevelUp.rank} onClose={() => setShowLevelUp({show: false, rank: ''})} />}

      <div className="relative z-10">
        <LiveTicker activeSector={activeSector} threatLevel={threatCount > 5 ? 'HIGH' : 'LOW'} news={globalNews} highContrast={highContrast} />

        <WhatsAppConnect isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} highContrast={highContrast} />
        {chatReport && <IntelChat report={chatReport} onClose={() => setChatReport(null)} highContrast={highContrast} />}

        <nav className={`sticky top-0 w-full z-50 border-b ${highContrast ? 'bg-white border-black' : 'border-white/5 bg-[#050505]/80 backdrop-blur-md'}`}>
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
                <SophonLogo className={`w-8 h-8 rounded-full object-cover transition-all duration-500 group-hover:scale-110 ${highContrast ? 'border-2 border-black' : 'border border-sophon-accent'}`} />
                <h1 className="text-xl font-bold tracking-tight group-hover:text-sophon-accent transition-colors">SOPHON <span className={`font-light ml-2 text-sm hidden sm:inline-block font-mono opacity-50`}>SENTINEL v2.5</span></h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-4 font-mono text-xs">
                <div className="flex flex-col items-end">
                    <span className="text-gray-500 text-[9px] uppercase tracking-widest">Target</span>
                    <span className={`font-bold transition-all ${highContrast ? 'text-black' : activeSector === 'ANON_RUMORS' ? 'text-sophon-danger' : 'text-sophon-accent'}`}>
                        {activeSector}
                    </span>
                </div>
                <div className="h-6 w-px bg-white/10"></div>
                <div className="flex flex-col items-end">
                        <span className="text-gray-500 text-[9px] uppercase tracking-widest">Status</span>
                        <span className={`${status === AgentStatus.IDLE ? 'text-gray-400' : highContrast ? 'text-black' : 'text-sophon-success animate-pulse'}`}>{status}</span>
                </div>
                </div>

                <button onClick={toggleHighContrast} className={`p-2 rounded border transition-colors ${highContrast ? 'bg-black text-white border-black' : 'border-white/20 text-gray-400 hover:text-white hover:border-white/40'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 00-.556.144L8.304 16H6a1 1 0 01-1-1v-5.382l-1.725 3.45a1 1 0 01-1.789-.894l.8-1.599L.677 11H2a1 1 0 01-1-1h2V6a1 1 0 011-1h1.323L10 2.053V2zM7 6v6.17l.732 1.464a3 3 0 00.993-1.748l1.23-3.838a1 1 0 011.083-.757l3.864.552A3.996 3.996 0 0013 5h-2a1 1 0 01-1-1V3.17L7 6z" /></svg>
                </button>
                
                <div className="flex items-center gap-2">
                    <button
                    onClick={() => setIsAutoScanning(!isAutoScanning)}
                    className={`px-4 py-2 rounded font-mono text-xs font-bold transition-all border ${
                        isAutoScanning 
                        ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20' 
                        : highContrast ? 'bg-black text-white border-black' : 'bg-sophon-accent/10 border-sophon-accent text-sophon-accent hover:bg-sophon-accent/20 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    }`}
                    >
                    {isAutoScanning ? 'HALT MONITOR' : 'INITIATE MONITOR'}
                    </button>
                </div>
            </div>
            </div>
        </nav>

        <main className="pt-8 pb-12 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-4 space-y-6">
                <AgentID xp={xp} highContrast={highContrast} />

                <div className={`glass-panel p-6 rounded-lg flex flex-col items-center justify-center relative overflow-hidden ${highContrast ? 'border-2 border-black' : ''}`}>
                    {!highContrast && <HolographicGlobe reports={reports} news={globalNews} highContrast={highContrast} />}
                    <div className="mt-6 text-center w-full">
                        <h2 className="text-xs font-mono text-gray-500 tracking-[0.2em] mb-4">GLOBAL INTELLIGENCE GRID</h2>
                        <div className="flex justify-around border-t border-white/5 pt-4">
                            <div className="text-center">
                                <span className="text-xl font-bold text-white block">{reports.length}</span>
                                <span className="text-[9px] text-gray-500 uppercase">Reports Generated</span>
                            </div>
                            <div className="text-center">
                                <span className={`text-xl font-bold block ${highContrast ? 'text-black' : 'text-sophon-success'}`}>
                                    {reports.filter(r => r.verdict === VerdictType.VERIFIED).length}
                                </span>
                                <span className="text-[9px] text-gray-500 uppercase">Verified Events</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MONITOR STATUS */}
                <div className={`p-4 rounded-lg border animate-fadeIn ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-white/10'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-mono uppercase font-bold tracking-widest opacity-60">Operations</span>
                        {(status === AgentStatus.SCANNING || status === AgentStatus.VERIFYING) && (
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-sophon-accent animate-ping"></div>
                            </div>
                        )}
                    </div>
                    
                    <div className={`text-[10px] px-3 py-2 rounded border text-center transition-colors duration-500 ${highContrast ? 'bg-gray-100' : 'bg-white/5 border-white/10'}`}>
                        CURRENT TASK: {activeSector}
                    </div>
                    
                    {scannedCandidates.length > 0 && (
                        <div className="mt-3 space-y-1">
                            {scannedCandidates.map((c, i) => (
                                <div key={i} className={`flex justify-between items-center text-[9px] px-2 py-1 rounded ${highContrast ? 'bg-gray-100' : 'bg-white/5'} ${status === AgentStatus.VERIFYING && activeSector === c.sector ? 'border-l-2 border-sophon-accent' : 'opacity-50'}`}>
                                    <span className="truncate flex-1">{c.query}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <GlobalNewsFeed news={globalNews} onRefresh={refreshGlobalNews} loading={isNewsLoading} highContrast={highContrast} />
                <ImageUploader onMediaSelected={handleMediaUpload} disabled={status !== AgentStatus.IDLE} highContrast={highContrast} />
                <TerminalLog logs={logs} highContrast={highContrast} />
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* QUERY BOX */}
                <div className={`glass-panel p-6 rounded-lg border-t-2 transition-all ${highContrast ? 'border-black' : 'border-sophon-accent border-opacity-60'}`}>
                    <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 tracking-widest ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        MANUAL VERIFICATION REQUEST
                    </h3>
                    <form onSubmit={handleManualVerify} className="flex flex-col gap-3">
                        <div className="flex gap-3">
                            <VoiceInput onInput={handleVoiceInput} disabled={status !== AgentStatus.IDLE && !isAutoScanning} highContrast={highContrast} />
                            <div className="flex-1 relative group">
                                <input 
                                    type="text" 
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    placeholder="Enter news, claim, or rumor to analyze..."
                                    className={`w-full h-full rounded-lg p-4 pl-4 text-sm focus:outline-none transition-all ${highContrast ? 'bg-white text-black border-2 border-black' : 'bg-black/60 border border-gray-700 text-white focus:border-sophon-accent focus:bg-black/80'}`}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={status !== AgentStatus.IDLE && !isAutoScanning}
                                className={`px-6 py-4 font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50 ${highContrast ? 'bg-black text-white hover:bg-gray-800' : 'bg-sophon-accent text-black hover:bg-white hover:shadow-[0_0_15px_rgba(0,240,255,0.6)]'}`}
                            >
                                ANALYZE
                            </button>
                        </div>
                    </form>
                </div>

                {/* TABS */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <h2 className={`text-xl font-bold ${highContrast ? 'text-black' : 'text-white'}`}>INTELLIGENCE FEED</h2>
                    <div className="flex gap-2">
                        {['feed', 'threats', 'archive', 'publisher'].map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all uppercase ${
                                    activeTab === tab 
                                    ? highContrast ? 'bg-black text-white' : 'bg-white text-black' 
                                    : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                {tab === 'feed' ? 'Monitor' : tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="min-h-[400px]">
                    {activeTab === 'feed' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="mb-6"><GameMode highContrast={highContrast} onXPEarned={(amount) => awardXP(amount, "Cognitive Drill")} /></div>
                            <div className="mb-6"><DeconstructionLab highContrast={highContrast} /></div>
                            {reports.length === 0 ? (
                                <div className={`text-center py-16 border-2 border-dashed rounded-lg ${highContrast ? 'border-black' : 'border-gray-800'}`}>
                                    <p className="text-gray-500 font-mono text-xs">NO ACTIVE REPORTS</p>
                                </div>
                            ) : (
                                reports.map(report => (
                                    <ReportCard key={report.id} report={report} highContrast={highContrast} onDeepDive={setChatReport} />
                                ))
                            )}
                        </div>
                    )}
                    {activeTab === 'threats' && <ThreatDashboard reports={reports} />}
                    {activeTab === 'archive' && <ArchivePanel archive={archive} onImport={handleArchiveImport} />}
                    {activeTab === 'publisher' && <PublisherPortal highContrast={highContrast} />}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}

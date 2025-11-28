
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgentStatus, LogEntry, Report, VerdictType, SourceCategory } from './types';
import { scanForTopics, investigateTopic, analyzeManualQuery, analyzeImageClaim, analyzeAudioClaim, DATA_SECTORS } from './services/geminiService';
import { TerminalLog } from './components/TerminalLog';
import { ReportCard } from './components/ReportCard';
import { RadarPulse } from './components/RadarPulse';
import { ThreatDashboard } from './components/ThreatDashboard';
import { Heatmap } from './components/Heatmap';
import { LiveTicker } from './components/LiveTicker';
import { ArchivePanel } from './components/ArchivePanel';
import { ImageUploader } from './components/ImageUploader';
import { VoiceInput } from './components/VoiceInput';
import { WhatsAppConnect } from './components/WhatsAppConnect';
import { IntelChat } from './components/IntelChat';
import { GameMode } from './components/GameMode';
import { DeconstructionLab } from './components/DeconstructionLab';
import { PublisherPortal } from './components/PublisherPortal';

export default function App() {
  // --- STATE ---
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [reports, setReports] = useState<Report[]>([]);
  
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
  const [manualInput, setManualInput] = useState('');
  const [activeSector, setActiveSector] = useState<string>('ALL_SECTORS');
  const [activeTab, setActiveTab] = useState<'feed' | 'threats' | 'archive' | 'publisher'>('feed');
  const [deepScanMode, setDeepScanMode] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [chatReport, setChatReport] = useState<Report | null>(null);
  
  const [highContrast, setHighContrast] = useState(false);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      message,
      type
    }]);
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
      const currentSector = DATA_SECTORS[Math.floor(Math.random() * DATA_SECTORS.length)];
      setActiveSector(currentSector);
      addLog(`RAG Pipeline Initialized. Target Sector: ${currentSector}`, 'action');
      
      const results = await scanForTopics(currentSector);
      if (results.length === 0) {
          addLog(`Sector ${currentSector} nominal. No anomalies.`, 'info');
          setStatus(AgentStatus.IDLE);
          return;
      }

      const target = results[0]; 
      setStatus(AgentStatus.VERIFYING);
      addLog(`Retrieving context for: "${target.query}"`, 'action');
      
      const report = await investigateTopic(target.query, target.sector, false);
      if (report) {
         handleNewReport(report);
         const msgType = report.verdict === VerdictType.VERIFIED ? 'success' :
                         report.verdict === VerdictType.FALSE ? 'error' : 'warning';
         if (report.verdict === VerdictType.FALSE || report.verdict === VerdictType.MISLEADING) {
             addLog(`CRITICAL THREAT DETECTED: ${report.topic}`, 'error');
         } else {
             addLog(`Analysis Complete. Verdict: ${report.verdict} [Conf: ${report.confidenceScore}%]`, msgType);
         }
      } else {
         addLog(`RAG Retrieval failed for target.`, 'warning');
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
      addLog('Scanning paused. Cooling down (120s)...', 'info');
    }
  }, [status]);

  useEffect(() => {
    if (isAutoScanning) {
      addLog('Sentinel Loop Engaged. Interval: 120s', 'success');
      performScanCycle();
      scanIntervalRef.current = setInterval(() => {
        performScanCycle();
      }, 120000); 
    } else {
      if (scanIntervalRef.current) {
         addLog('Sentinel Loop Terminated.', 'warning');
         clearInterval(scanIntervalRef.current);
         scanIntervalRef.current = null;
      }
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isAutoScanning, performScanCycle]);

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
      
      <LiveTicker activeSector={activeSector} threatLevel={threatCount > 5 ? 'HIGH' : 'LOW'} reports={archive} highContrast={highContrast} />

      <WhatsAppConnect isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} highContrast={highContrast} />
      {chatReport && (
          <IntelChat report={chatReport} onClose={() => setChatReport(null)} highContrast={highContrast} />
      )}

      <nav className={`sticky top-0 w-full z-50 border-b ${highContrast ? 'bg-black border-white' : 'border-white/5 bg-sophon-dark/90 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className={`w-8 h-8 rounded transition-all duration-500 group-hover:rotate-180 ${highContrast ? 'bg-white text-black' : 'bg-gradient-to-br from-sophon-accent to-blue-600 text-black'} flex items-center justify-center font-bold font-mono`}>S</div>
            <h1 className="text-xl font-bold tracking-tight group-hover:text-sophon-accent transition-colors">SOPHON <span className={`font-light ml-2 text-sm hidden sm:inline-block ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>SENTINEL SYSTEM v2.5</span></h1>
          </div>

          <div className="flex items-center gap-6">
            <button
                onClick={() => setShowConnectModal(true)}
                className={`hidden md:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded transition-all transform hover:scale-105 ${highContrast ? 'bg-white text-black' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 hover:shadow-[0_0_10px_rgba(74,222,128,0.3)]'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                CONNECT AGENT
            </button>

            <div className="hidden md:flex items-center gap-4 font-mono text-xs">
               <div className="flex flex-col items-end">
                   <span className="text-gray-500 text-[10px]">CURRENT VECTOR</span>
                   <span className={highContrast ? 'text-white font-bold' : 'text-sophon-accent'}>{activeSector}</span>
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
            
            <button
              onClick={() => setIsAutoScanning(!isAutoScanning)}
              className={`px-4 py-2 rounded font-mono text-xs font-bold transition-all border ${
                isAutoScanning 
                  ? 'bg-sophon-danger/10 border-sophon-danger text-sophon-danger hover:bg-sophon-danger/20 animate-pulse' 
                  : highContrast ? 'bg-white text-black border-white' : 'bg-sophon-accent/10 border-sophon-accent text-sophon-accent hover:bg-sophon-accent/20 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              }`}
            >
              {isAutoScanning ? 'TERMINATE SCAN' : 'INITIATE SCAN'}
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-8 pb-12 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
           <div className={`glass-panel p-6 rounded-lg flex flex-col items-center justify-center relative overflow-hidden ${highContrast ? 'border-2 border-white' : ''}`}>
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
             {!highContrast && <RadarPulse active={status !== AgentStatus.IDLE} />}
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
                 <div className="flex items-center gap-2 self-end">
                    <button
                        type="button"
                        onClick={() => setDeepScanMode(!deepScanMode)}
                        className={`text-[10px] font-mono font-bold px-3 py-1 rounded border transition-colors flex items-center gap-2 ${
                            deepScanMode 
                              ? highContrast ? 'bg-white text-black border-black' : 'bg-sophon-warning/20 border-sophon-warning text-sophon-warning shadow-[0_0_10px_rgba(252,238,10,0.3)]' 
                              : highContrast ? 'bg-black text-white border-white' : 'bg-black/40 border-gray-800 text-gray-500 hover:text-white'
                        }`}
                    >
                        {deepScanMode ? '◉ DEEP SCAN: ON (SLOW)' : '○ DEEP SCAN: OFF (FAST)'}
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
                    {!highContrast && (
                        <div className="mb-6">
                            <Heatmap reports={archive} highContrast={highContrast} />
                        </div>
                    )}
                    <div className="mb-6">
                        <GameMode highContrast={highContrast} />
                    </div>
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

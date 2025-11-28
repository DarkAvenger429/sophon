
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgentStatus, LogEntry, Report, VerdictType, SourceCategory } from './types';
import { scanForTopics, investigateTopic, analyzeManualQuery, analyzeImageClaim, DATA_SECTORS } from './services/geminiService';
import { TerminalLog } from './components/TerminalLog';
import { ReportCard } from './components/ReportCard';
import { RadarPulse } from './components/RadarPulse';
import { ThreatDashboard } from './components/ThreatDashboard';
import { NetworkGraph } from './components/NetworkGraph';
import { LiveTicker } from './components/LiveTicker';
import { ArchivePanel } from './components/ArchivePanel';
import { ImageUploader } from './components/ImageUploader';
import { VoiceInput } from './components/VoiceInput';

export default function App() {
  // --- STATE ---
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  
  // SESSION STATE: Resets on refresh (Clean Slate)
  const [reports, setReports] = useState<Report[]>([]);
  
  // ARCHIVE STATE: Persists across refreshes (The Vault)
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
  const [activeTab, setActiveTab] = useState<'feed' | 'threats' | 'archive'>('feed');
  
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- DEMO DATA SEEDING ---
  // If archive is empty on load, inject mock data so the demo looks good immediately
  useEffect(() => {
    if (archive.length === 0) {
        const demoReports: Report[] = [
            {
                id: 'demo-1',
                timestamp: Date.now() - 10000000,
                topic: 'Global Quantum Encryption Standard',
                claim: 'UN passes universal mandate for quantum-resistant encryption by 2026.',
                verdict: VerdictType.VERIFIED,
                summary: 'Major global powers have agreed to a new NIST-backed standard for post-quantum cryptography to secure banking infrastructure.',
                confidenceScore: 92,
                sourceReliability: 88,
                sources: [
                    { title: 'United Nations Press', url: '#', category: SourceCategory.GOVERNMENT, reliabilityScore: 95, date: '2024-05-15' },
                    { title: 'Reuters Tech', url: '#', category: SourceCategory.NEWS, reliabilityScore: 85, date: '2024-05-16' }
                ],
                tags: ['TECH', 'POLICY', 'SECURITY'],
                originSector: 'CYBERSECURITY_UPDATES',
                detectedLanguage: 'English',
                keyEvidence: [],
                relatedThemes: ['Cyber Warfare', 'Future Tech']
            },
            {
                id: 'demo-2',
                timestamp: Date.now() - 8000000,
                topic: 'Fusion Energy Breakthrough',
                claim: 'Commercial fusion reactor produces net energy for 24 continuous hours.',
                verdict: VerdictType.VERIFIED,
                summary: 'ITER facility confirms sustained plasma burn achieving Q>1 for the first time in history, marking a pivotal shift in clean energy.',
                confidenceScore: 95,
                sourceReliability: 98,
                sources: [
                    { title: 'Nature Physics Journal', url: '#', category: SourceCategory.ACADEMIC, reliabilityScore: 99, date: '2024-05-18' }
                ],
                tags: ['ENERGY', 'PHYSICS', 'CLIMATE'],
                originSector: 'SCIENCE_BREAKTHROUGHS',
                detectedLanguage: 'English',
                keyEvidence: [],
                relatedThemes: ['Clean Energy', 'Future Tech']
            },
            {
                id: 'demo-3',
                timestamp: Date.now() - 6000000,
                topic: 'New Global Trade Pact',
                claim: 'ASEAN and EU sign comprehensive digital trade agreement.',
                verdict: VerdictType.VERIFIED,
                summary: 'The agreement eliminates tariffs on digital goods and establishes a shared framework for AI governance between the two blocs.',
                confidenceScore: 89,
                sourceReliability: 85,
                sources: [
                    { title: 'Financial Times', url: '#', category: SourceCategory.NEWS, reliabilityScore: 88, date: '2024-05-19' }
                ],
                tags: ['ECONOMICS', 'TRADE', 'POLITICS'],
                originSector: 'GLOBAL_ECONOMICS',
                detectedLanguage: 'English',
                keyEvidence: [],
                relatedThemes: ['Globalization', 'Economic Policy']
            },
             {
                id: 'demo-4',
                timestamp: Date.now() - 4000000,
                topic: 'AI Copyright Regulation',
                claim: 'US Supreme Court rules AI generated art cannot be copyrighted.',
                verdict: VerdictType.VERIFIED,
                summary: 'The court upheld the lower court decision stating that human authorship is a prerequisite for copyright protection under current law.',
                confidenceScore: 94,
                sourceReliability: 92,
                sources: [
                    { title: 'SCOTUS Blog', url: '#', category: SourceCategory.GOVERNMENT, reliabilityScore: 95, date: '2024-05-20' }
                ],
                tags: ['LAW', 'AI', 'COPYRIGHT'],
                originSector: 'LEGAL_UPDATES',
                detectedLanguage: 'English',
                keyEvidence: [],
                relatedThemes: ['AI Ethics', 'Legal Precedent']
            },
            {
                id: 'demo-5',
                timestamp: Date.now() - 5000000,
                topic: 'Synthetic Banana Shortage',
                claim: 'Lab-grown bananas are causing a generic mutation in natural crops.',
                verdict: VerdictType.FALSE,
                summary: 'No scientific evidence supports the claim of gene transfer between synthetic and organic fruit. Originates from a satirical blog.',
                confidenceScore: 85,
                sourceReliability: 20,
                sources: [
                    { title: 'Viral TikTok Video', url: '#', category: SourceCategory.SOCIAL, reliabilityScore: 10, date: '2024-05-18' }
                ],
                tags: ['FOOD', 'HOAX', 'VIRAL'],
                originSector: 'VIRAL_RUMORS_INDIA',
                detectedLanguage: 'English',
                keyEvidence: [],
                relatedThemes: ['Health Scare', 'Anti-Science']
            },
            {
                id: 'demo-6',
                timestamp: Date.now() - 200000,
                topic: 'Mars Colony Recruitment',
                claim: 'NASA begins secret lottery for 2030 Mars colony tickets.',
                verdict: VerdictType.MISLEADING,
                summary: 'NASA has opened applications for a simulation habitat on Earth, not for actual Mars travel. Social media users misinterpreted the press release.',
                confidenceScore: 78,
                sourceReliability: 60,
                sources: [
                    { title: 'SpaceX Fan Forum', url: '#', category: SourceCategory.SOCIAL, reliabilityScore: 30, date: '2024-05-20' },
                    { title: 'NASA Official Site', url: '#', category: SourceCategory.GOVERNMENT, reliabilityScore: 100, date: '2024-05-19' }
                ],
                tags: ['SPACE', 'NASA', 'MISINFO'],
                originSector: 'SPACE_EXPLORATION',
                detectedLanguage: 'English',
                keyEvidence: [],
                relatedThemes: ['Space', 'Gov Coverup']
            }
        ];
        setArchive(demoReports);
        localStorage.setItem('sophon_archive', JSON.stringify(demoReports));
        addLog('SYSTEM INITIALIZED. ARCHIVE POPULATED WITH SEED DATA.', 'success');
    }
  }, []);

  // --- PERSISTENCE EFFECT ---
  // Save archive whenever it changes
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

  // Helper to add report to both session and archive (without duplicates in archive)
  const handleNewReport = (report: Report) => {
     setReports(prev => [report, ...prev]);
     setArchive(prev => {
        // Prevent duplicate IDs
        if (prev.some(r => r.id === report.id)) return prev;
        return [report, ...prev];
     });
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
      
      const report = await investigateTopic(target.query, target.sector);
      
      if (report) {
         handleNewReport(report);
         
         const msgType = report.verdict === VerdictType.VERIFIED ? 'success' :
                         report.verdict === VerdictType.FALSE ? 'error' : 'warning';

         addLog(`Analysis Complete. Verdict: ${report.verdict} [Conf: ${report.confidenceScore}%]`, msgType);
         
         if (report.verdict === VerdictType.FALSE || report.verdict === VerdictType.MISLEADING) {
             addLog(`THREAT DETECTED in sector ${currentSector}. Added to Matrix.`, 'error');
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

    const wasRunning = isAutoScanning;
    if (wasRunning) {
        setIsAutoScanning(false);
        addLog('Auto-scan paused for manual override.', 'warning');
    }

    setStatus(AgentStatus.ANALYZING);
    setActiveSector('USER_INPUT');
    addLog(`Manual RAG Request: "${manualInput}"`, 'action');

    try {
        const report = await analyzeManualQuery(manualInput);
        if (report) {
            handleNewReport(report);
            addLog(`Report generated. Lang: ${report.detectedLanguage || 'EN'}`, 'success');
            if (report.detectedLanguage !== 'English') {
                addLog(`Translated ${report.detectedLanguage} to English for analysis.`, 'info');
            }
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
      // Auto-submit after voice input
      setTimeout(() => {
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          handleManualVerify(fakeEvent);
      }, 500);
  };
  
  const handleImageUpload = async (base64: string) => {
    const wasRunning = isAutoScanning;
    if (wasRunning) setIsAutoScanning(false);
    
    setStatus(AgentStatus.ANALYZING);
    setActiveSector('FORENSIC_SCAN');
    addLog(`Initiating Multimodal Vision Analysis...`, 'action');
    
    try {
        const report = await analyzeImageClaim(base64);
        if (report) {
            handleNewReport(report);
            addLog(`Image Analysis Complete. Verdict: ${report.verdict}`, 'success');
        }
    } catch (e) {
        addLog(`Forensic Analysis Failed.`, 'error');
    }
    
    setStatus(AgentStatus.IDLE);
  };

  const threatCount = reports.filter(r => r.verdict === VerdictType.FALSE || r.verdict === VerdictType.MISLEADING).length;

  return (
    <div className="min-h-screen bg-sophon-dark text-gray-200 selection:bg-sophon-accent/30 selection:text-white overflow-x-hidden">
      
      {/* Pass ARCHIVE to ticker so headlines persist even if session is clean */}
      <LiveTicker activeSector={activeSector} threatLevel={threatCount > 5 ? 'HIGH' : 'LOW'} reports={archive} />

      {/* Top Navigation / Status Bar */}
      <nav className="sticky top-0 w-full z-50 border-b border-white/5 bg-sophon-dark/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-sophon-accent to-blue-600 flex items-center justify-center font-bold text-black font-mono">
              S
            </div>
            <h1 className="text-xl font-bold tracking-tight">SOPHON <span className="text-gray-600 font-light ml-2 text-sm hidden sm:inline-block">SENTINEL SYSTEM v2.5</span></h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 font-mono text-xs">
               <div className="flex flex-col items-end">
                   <span className="text-gray-500 text-[10px]">CURRENT VECTOR</span>
                   <span className="text-sophon-accent">{activeSector}</span>
               </div>
               <div className="h-8 w-px bg-white/10"></div>
               <div className="flex flex-col items-end">
                    <span className="text-gray-500 text-[10px]">SYSTEM STATUS</span>
                    <span className={`${status === AgentStatus.IDLE ? 'text-gray-400' : 'text-sophon-accent animate-pulse'}`}>
                        {status}
                    </span>
               </div>
            </div>
            
            <button
              onClick={() => setIsAutoScanning(!isAutoScanning)}
              className={`px-4 py-2 rounded font-mono text-xs font-bold transition-all border ${
                isAutoScanning 
                  ? 'bg-sophon-danger/10 border-sophon-danger text-sophon-danger hover:bg-sophon-danger/20' 
                  : 'bg-sophon-accent/10 border-sophon-accent text-sophon-accent hover:bg-sophon-accent/20'
              }`}
            >
              {isAutoScanning ? 'TERMINATE SCAN' : 'INITIATE SCAN'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-8 pb-12 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Visuals & Tools */}
        <div className="lg:col-span-4 space-y-6">
           {/* Visualizer */}
           <div className="glass-panel p-6 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
             <RadarPulse active={status !== AgentStatus.IDLE} />
             <div className="mt-6 text-center w-full">
                <h2 className="text-sm font-mono text-gray-400 tracking-widest">THREAT DETECTION</h2>
                <div className="flex justify-around mt-4 border-t border-white/5 pt-4">
                    <div className="text-center">
                        <span className="text-xl font-bold text-white block">{reports.length}</span>
                        <span className="text-[9px] text-gray-500 uppercase">Session Reports</span>
                    </div>
                    <div className="text-center">
                        <span className="text-xl font-bold text-sophon-danger block">
                            {threatCount}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase">Active Threats</span>
                    </div>
                </div>
             </div>
           </div>
           
           {/* Image Uploader */}
           <ImageUploader onImageSelected={handleImageUpload} disabled={status !== AgentStatus.IDLE} />

           {/* Logs */}
           <TerminalLog logs={logs} />
        </div>

        {/* Right Column: Command Center & Feed */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* PROMINENT MANUAL INPUT */}
          <div className="glass-panel p-6 rounded-lg border-t-2 border-sophon-accent">
             <h3 className="text-sm font-bold text-sophon-accent mb-4 flex items-center gap-2 tracking-widest">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
               </svg>
               QUERY INTELLIGENCE DATABASE
             </h3>
             <form onSubmit={handleManualVerify} className="flex gap-3">
                 {/* Voice Input Button */}
                 <VoiceInput onInput={handleVoiceInput} disabled={status !== AgentStatus.IDLE && !isAutoScanning} />
                 
                 <div className="flex-1 relative">
                    <input 
                        type="text" 
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder="Enter claim to verify..."
                        className="w-full h-full bg-black/60 border border-gray-700 rounded-lg p-4 pl-4 text-base text-white focus:outline-none focus:border-sophon-accent transition-all shadow-inner"
                    />
                 </div>
                 <button 
                   type="submit"
                   disabled={status !== AgentStatus.IDLE && !isAutoScanning}
                   className="px-6 py-4 bg-sophon-accent text-black font-bold font-mono rounded-lg hover:bg-sophon-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 min-w-[140px]"
                 >
                   ANALYZE
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                   </svg>
                 </button>
             </form>
             <div className="flex justify-between items-center mt-3">
                <p className="text-[10px] text-gray-500 italic">
                   Multilingual RAG Active: Supports Devanagari script & Hinglish
                </p>
                <span className="text-[10px] font-mono text-sophon-success">SYSTEM READY</span>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">LIVE INTELLIGENCE FEED</h2>
            
            {/* Tabs */}
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 w-full sm:w-auto overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('feed')}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors whitespace-nowrap ${activeTab === 'feed' ? 'bg-sophon-accent text-black' : 'text-gray-400 hover:text-white'}`}
                >
                    DASHBOARD
                </button>
                <button 
                    onClick={() => setActiveTab('threats')}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'threats' ? 'bg-sophon-danger text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    THREAT MATRIX
                    {threatCount > 0 && (
                        <span className="bg-white text-sophon-danger text-[9px] px-1 rounded-full">{threatCount}</span>
                    )}
                </button>
                 <button 
                    onClick={() => setActiveTab('archive')}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'archive' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    ARCHIVE ({archive.length})
                </button>
            </div>
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'feed' && (
                <div className="space-y-4 animate-fadeIn">
                    {/* Embedded Graph for Dashboard */}
                    <div className="mb-6">
                        <NetworkGraph reports={archive} heightClass="h-[400px]" />
                    </div>

                    {reports.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-800 rounded-lg">
                        <p className="text-gray-500 font-mono">NO ACTIVE SESSION DATA</p>
                        <p className="text-gray-600 text-sm mt-2">Initiate scan or check Archive for history</p>
                    </div>
                    ) : (
                    reports.map(report => (
                        <ReportCard key={report.id} report={report} />
                    ))
                    )}
                </div>
            )}
            
            {activeTab === 'threats' && (
                <ThreatDashboard reports={reports} />
            )}

            {activeTab === 'archive' && (
                <ArchivePanel archive={archive} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

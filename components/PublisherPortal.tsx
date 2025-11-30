
import React, { useState, useEffect, useRef } from 'react';
import { connectWallet, signHeadline, WalletState } from '../services/web3Service';
import { searchLedgerSemantically } from '../services/geminiService';

interface PublisherPortalProps {
  highContrast?: boolean;
}

interface BlockData {
    headline: string;
    category: 'OSINT' | 'LEAK' | 'OFFICIAL' | 'ANALYSIS';
    urgency: 'LOW' | 'MED' | 'CRITICAL';
    factHash: string;
    signature: string;
}

interface Block {
    height: number;
    hash: string;
    prevHash: string;
    timestamp: number;
    miner: string;
    data: BlockData;
    gasUsed: number;
    nonce: number;
}

// --- VISUAL COMPONENTS ---

const NetworkGraphCanvas = ({ highContrast }: { highContrast?: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let dataPoints = Array(50).fill(0).map(() => Math.random() * 50 + 20);
        let animationId: number;

        const draw = () => {
            if (!ctx || !canvas) return;
            // Shift data
            if (Math.random() > 0.8) {
                dataPoints.shift();
                dataPoints.push(Math.random() * 60 + 20);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw Grid
            ctx.strokeStyle = highContrast ? '#eee' : '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let i=0; i<canvas.width; i+=20) { ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); }
            ctx.stroke();

            // Draw Line
            ctx.strokeStyle = highContrast ? '#000' : '#00f0ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            dataPoints.forEach((val, i) => {
                const x = (i / (dataPoints.length - 1)) * canvas.width;
                const y = canvas.height - (val / 100) * canvas.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Fill area
            ctx.fillStyle = highContrast ? 'rgba(0,0,0,0.1)' : 'rgba(0, 240, 255, 0.1)';
            ctx.lineTo(canvas.width, canvas.height);
            ctx.lineTo(0, canvas.height);
            ctx.fill();

            animationId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animationId);
    }, [highContrast]);

    return <canvas ref={canvasRef} width={300} height={40} className="w-full h-full" />;
};

const NetworkHUD = ({ highContrast }: { highContrast?: boolean }) => {
    const [stats, setStats] = useState({ block: 18420000, gas: 15, peers: 42, tps: 1200 });
    
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                block: prev.block + 1,
                gas: Math.floor(Math.random() * 20) + 10,
                peers: Math.floor(Math.random() * 5) + 40,
                tps: Math.floor(Math.random() * 200) + 1100
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b text-[10px] font-mono ${highContrast ? 'bg-black text-white border-white' : 'bg-black/80 border-sophon-accent/20 text-sophon-accent'}`}>
            <div className="flex flex-col">
                <span className="opacity-50 uppercase">Block Height</span>
                <span className="text-sm font-bold">#{stats.block.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
                <span className="opacity-50 uppercase">Network Load</span>
                <div className="h-6 w-full"><NetworkGraphCanvas highContrast={highContrast} /></div>
            </div>
             <div className="flex flex-col">
                <span className="opacity-50 uppercase">Gas / TPS</span>
                <span className="text-sm font-bold">{stats.gas} Gwei / {stats.tps} TPS</span>
            </div>
            <div className="flex flex-col text-right">
                <span className="opacity-50 uppercase">Peers</span>
                <span className="text-sm font-bold flex justify-end items-center gap-2">
                    {stats.peers} NODES 
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </span>
            </div>
        </div>
    );
};

const RetroIdenticon = ({ address, size = 32 }: { address: string, size?: number }) => {
    const seed = parseInt(address.slice(2, 10), 16);
    const colors = ['#00f0ff', '#ff003c', '#fcee0a', '#00ff9f', '#ffffff'];
    const color = colors[seed % colors.length];
    
    return (
        <div className="rounded border border-white/20 overflow-hidden bg-black relative shadow-lg" style={{ width: size, height: size }}>
            <div className="absolute inset-0 opacity-50" style={{ backgroundColor: color }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border border-black/50 bg-white/20 rotate-45 transform transition-transform hover:rotate-90"></div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const PublisherPortal: React.FC<PublisherPortalProps> = ({ highContrast }) => {
  // STATE
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [activeTab, setActiveTab] = useState<'PUBLISH' | 'EXPLORER'>('PUBLISH');
  
  // Wallet & Ledger
  const [wallet, setWallet] = useState<WalletState>({ address: null, isConnected: false, chainId: null });
  const [ledger, setLedger] = useState<Block[]>(() => {
      try {
          const saved = localStorage.getItem('sophon_ledger');
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  });

  // Publishing Form State
  const [formData, setFormData] = useState({
      headline: '',
      category: 'OSINT' as BlockData['category'],
      urgency: 'LOW' as BlockData['urgency']
  });
  const [publishStatus, setPublishStatus] = useState<'IDLE' | 'MINING' | 'CONFIRMED'>('IDLE');
  const [miningLogs, setMiningLogs] = useState<string[]>([]);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);

  // Explorer State
  const [filter, setFilter] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [semanticMode, setSemanticMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredBlocks, setFilteredBlocks] = useState<Block[]>([]);

  useEffect(() => {
      localStorage.setItem('sophon_ledger', JSON.stringify(ledger));
  }, [ledger]);

  // Handle Search Logic
  useEffect(() => {
      const runSearch = async () => {
          if (!filter) {
              setFilteredBlocks(ledger);
              return;
          }

          if (semanticMode) {
              setIsSearching(true);
              // Prepare data for AI
              const headlines = ledger.map(b => ({ id: b.hash, text: b.data.headline }));
              const matchingIds = await searchLedgerSemantically(filter, headlines);
              
              setFilteredBlocks(ledger.filter(b => matchingIds.includes(b.hash)));
              setIsSearching(false);
          } else {
              const lowerFilter = filter.toLowerCase();
              setFilteredBlocks(ledger.filter(b => 
                  b.data.headline.toLowerCase().includes(lowerFilter) || 
                  b.miner.toLowerCase().includes(lowerFilter)
              ));
          }
      };

      // Debounce slightly for semantic
      const timeoutId = setTimeout(runSearch, semanticMode ? 600 : 0);
      return () => clearTimeout(timeoutId);
  }, [filter, ledger, semanticMode]);

  // Actions
  const handleConnect = async () => {
    const state = await connectWallet();
    setWallet(state);
  };

  const addMiningLog = (msg: string) => setMiningLogs(prev => [...prev, `> ${new Date().toLocaleTimeString()} ${msg}`]);

  const handlePublish = async () => {
      if (!wallet.isConnected || !formData.headline) return;
      
      setPublishStatus('MINING');
      setMiningLogs([]);
      addMiningLog("Initiating Smart Contract [0xSOPHON...]");
      
      try {
          // 1. Sign
          addMiningLog("Requesting Signature...");
          const signedData = await signHeadline(formData.headline);
          if (!signedData) throw new Error("Signature Rejected");
          addMiningLog(`Signature Acquired: ${signedData.signature.slice(0, 10)}...`);

          // 2. Simulate Mining Delay
          await new Promise(r => setTimeout(r, 800));
          addMiningLog("Hashing Block Content...");
          await new Promise(r => setTimeout(r, 800));
          addMiningLog("Broadcasting to Mempool...");
          await new Promise(r => setTimeout(r, 1200));
          addMiningLog("Block Confirmed.");

          // 3. Create Block
          const newBlock: Block = {
              height: ledger.length > 0 ? ledger[0].height + 1 : 18420001,
              hash: signedData.hash,
              prevHash: ledger.length > 0 ? ledger[0].hash : "0x0000000000000000000000000000000000000000",
              timestamp: Date.now(),
              miner: wallet.address || "Unknown",
              gasUsed: 21000 + Math.floor(Math.random() * 5000),
              nonce: Math.floor(Math.random() * 1000000),
              data: {
                  headline: formData.headline,
                  category: formData.category,
                  urgency: formData.urgency,
                  factHash: signedData.hash, // Using tx hash as fact hash for demo
                  signature: signedData.signature
              }
          };

          setLedger(prev => [newBlock, ...prev]);
          setCurrentBlock(newBlock);
          setPublishStatus('CONFIRMED');
          setFormData({ headline: '', category: 'OSINT', urgency: 'LOW' });

      } catch (e) {
          addMiningLog(`ERROR: ${e}`);
          setPublishStatus('IDLE');
      }
  };

  // Auth Screen
  if (!isAuthenticated) {
    return (
        <div className="w-full h-[500px] flex items-center justify-center animate-fadeIn">
            <div className={`w-full max-w-sm p-8 rounded-lg border-2 text-center relative overflow-hidden ${highContrast ? 'bg-white border-black' : 'bg-black/80 border-sophon-accent/50 shadow-[0_0_50px_rgba(0,240,255,0.15)]'}`}>
                <div className="mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed rounded-full animate-spin-slow flex items-center justify-center">
                        <span className="text-2xl">🔐</span>
                    </div>
                    <h2 className={`text-xl font-bold font-mono tracking-widest ${highContrast ? 'text-black' : 'text-white'}`}>NODE ACCESS</h2>
                    <p className="text-[10px] text-gray-500 font-mono">ENCRYPTED GATEWAY</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); if(accessCode === 'SOPHON-PRESS') setIsAuthenticated(true); else alert('ACCESS DENIED'); }}>
                    <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="ACCESS KEY (SOPHON-PRESS)" className={`w-full p-3 text-center font-mono text-xs rounded mb-4 focus:outline-none border ${highContrast ? 'bg-gray-100 border-black text-black' : 'bg-gray-900 border-gray-700 text-sophon-accent focus:border-sophon-accent'}`} />
                    <button type="submit" className={`w-full py-3 rounded font-bold font-mono text-xs tracking-widest transition-all ${highContrast ? 'bg-black text-white' : 'bg-sophon-accent text-black hover:bg-white'}`}>AUTHENTICATE</button>
                </form>
            </div>
        </div>
    );
  }

  return (
    <div className={`animate-fadeIn rounded-lg border-2 overflow-hidden flex flex-col min-h-[600px] ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-sophon-accent/30'}`}>
        
        {/* TOP BAR */}
        <NetworkHUD highContrast={highContrast} />
        
        {/* NAV */}
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-b border-gray-800 gap-4">
            <div>
                <h2 className={`text-xl font-bold font-mono tracking-widest ${highContrast ? 'text-black' : 'text-white'}`}>PUBLISHER NODE</h2>
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${wallet.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {wallet.isConnected ? `CONNECTED: ${wallet.address?.slice(0,6)}...${wallet.address?.slice(-4)}` : 'DISCONNECTED'}
                </div>
            </div>
            <div className="flex items-center gap-4">
                {!wallet.isConnected && (
                    <button onClick={handleConnect} className="px-3 py-1.5 bg-sophon-accent text-black text-[10px] font-bold rounded animate-pulse">
                        CONNECT WALLET
                    </button>
                )}
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('PUBLISH')} className={`px-4 py-2 rounded font-bold text-xs transition-colors border ${activeTab === 'PUBLISH' ? (highContrast ? 'bg-black text-white border-black' : 'bg-sophon-accent text-black border-sophon-accent') : 'bg-transparent border-gray-700 text-gray-400'}`}>PUBLISH</button>
                    <button onClick={() => setActiveTab('EXPLORER')} className={`px-4 py-2 rounded font-bold text-xs transition-colors border ${activeTab === 'EXPLORER' ? (highContrast ? 'bg-black text-white border-black' : 'bg-purple-500 text-white border-purple-500') : 'bg-transparent border-gray-700 text-gray-400'}`}>EXPLORER</button>
                </div>
            </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 flex-1 bg-black/20">
            
            {/* --- PUBLISH TAB --- */}
            {activeTab === 'PUBLISH' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    {/* FORM */}
                    <div className={`p-6 rounded-lg border flex flex-col ${highContrast ? 'bg-white border-black' : 'bg-black/40 border-gray-700'}`}>
                        <div className="mb-4 flex justify-between items-center">
                            <h3 className={`text-sm font-bold font-mono ${highContrast ? 'text-black' : 'text-gray-300'}`}>NEW INTELLIGENCE BLOCK</h3>
                            {!wallet.isConnected && <button onClick={handleConnect} className="text-[10px] underline text-sophon-accent">CONNECT WALLET TO SIGN</button>}
                        </div>
                        
                        <div className="space-y-4 flex-1">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 mb-1 block">HEADLINE / INTEL</label>
                                <textarea 
                                    value={formData.headline} 
                                    onChange={(e) => setFormData({...formData, headline: e.target.value})} 
                                    placeholder="> Enter verified intelligence data..." 
                                    className={`w-full h-32 p-4 rounded font-mono text-sm focus:outline-none border ${highContrast ? 'bg-gray-100 border-black' : 'bg-gray-900 border-gray-600 text-white focus:border-sophon-accent'}`}
                                    disabled={!wallet.isConnected || publishStatus === 'MINING'}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">CATEGORY</label>
                                    <select 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                                        className={`w-full p-2 rounded text-xs border ${highContrast ? 'bg-white border-black' : 'bg-gray-900 border-gray-600 text-white'}`}
                                        disabled={publishStatus === 'MINING'}
                                    >
                                        <option value="OSINT">OSINT ANALYSIS</option>
                                        <option value="LEAK">VERIFIED LEAK</option>
                                        <option value="OFFICIAL">OFFICIAL STATEMENT</option>
                                        <option value="ANALYSIS">FORENSIC REPORT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">URGENCY</label>
                                    <select 
                                        value={formData.urgency}
                                        onChange={(e) => setFormData({...formData, urgency: e.target.value as any})}
                                        className={`w-full p-2 rounded text-xs border ${highContrast ? 'bg-white border-black' : 'bg-gray-900 border-gray-600 text-white'}`}
                                        disabled={publishStatus === 'MINING'}
                                    >
                                        <option value="LOW">LOW PRIORITY</option>
                                        <option value="MED">MEDIUM PRIORITY</option>
                                        <option value="CRITICAL">CRITICAL / BREAKING</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-800">
                             <button 
                                onClick={handlePublish}
                                disabled={!wallet.isConnected || !formData.headline || publishStatus === 'MINING'}
                                className={`w-full py-4 rounded font-bold font-mono text-xs tracking-widest border transition-all ${
                                    highContrast ? 'bg-black text-white border-black disabled:opacity-50' 
                                    : 'bg-sophon-accent text-black border-sophon-accent hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:bg-gray-800 disabled:border-gray-800 disabled:text-gray-500'
                                }`}
                            >
                                {publishStatus === 'MINING' ? 'MINING BLOCK...' : 'SIGN & BROADCAST'}
                            </button>
                        </div>
                    </div>

                    {/* STATUS / RECEIPT */}
                    <div className={`p-6 rounded-lg border relative overflow-hidden flex flex-col ${highContrast ? 'bg-gray-50 border-black' : 'bg-black/40 border-gray-700'}`}>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                        
                        <h3 className={`text-sm font-bold font-mono mb-4 ${highContrast ? 'text-black' : 'text-gray-300'}`}>EXECUTION TERMINAL</h3>

                        {/* TERMINAL OUTPUT */}
                        <div className={`flex-1 rounded p-4 font-mono text-[10px] overflow-y-auto mb-4 ${highContrast ? 'bg-white border border-black text-black' : 'bg-black border border-gray-800 text-green-500'}`}>
                            {miningLogs.length === 0 && <span className="opacity-50">> System Ready. Awaiting Input...</span>}
                            {miningLogs.map((log, i) => <div key={i}>{log}</div>)}
                            {publishStatus === 'MINING' && <div className="animate-pulse">> Processing...</div>}
                        </div>

                        {/* CONFIRMED BLOCK VISUAL */}
                        {publishStatus === 'CONFIRMED' && currentBlock && (
                            <div className={`p-4 rounded border animate-fadeIn ${highContrast ? 'bg-white border-black' : 'bg-sophon-accent/10 border-sophon-accent/30'}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded border-2 flex items-center justify-center bg-black border-sophon-accent">
                                        <span className="text-xl">🧊</span>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-sophon-accent">BLOCK #{currentBlock.height}</div>
                                        <div className="text-[9px] text-gray-400">HASH: {currentBlock.hash.slice(0, 16)}...</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-gray-500">
                                    <div className="p-2 bg-black/30 rounded">
                                        GAS USED: <span className="text-white">{currentBlock.gasUsed}</span>
                                    </div>
                                    <div className="p-2 bg-black/30 rounded">
                                        SIZE: <span className="text-white">1.2 KB</span>
                                    </div>
                                </div>
                                <button onClick={() => setPublishStatus('IDLE')} className="w-full mt-3 py-2 text-[10px] font-bold border border-gray-600 rounded hover:bg-white/10 text-gray-400">
                                    DISMISS
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- EXPLORER TAB --- */}
            {activeTab === 'EXPLORER' && (
                <div className="h-full flex flex-col">
                    {/* FILTERS & SEARCH */}
                    <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
                        <div className="flex-1 flex gap-2 w-full">
                            <input 
                                type="text" 
                                placeholder={semanticMode ? "SEMANTIC SEARCH (e.g. 'financial crimes')" : "SEARCH BY HASH / KEYWORD"} 
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className={`flex-1 p-2 text-xs rounded border focus:outline-none font-mono ${highContrast ? 'bg-white border-black' : 'bg-black/60 border-gray-700 text-white focus:border-purple-500'}`}
                            />
                        </div>
                         
                         <div className="flex items-center gap-2">
                             <div 
                                onClick={() => setSemanticMode(!semanticMode)}
                                className={`cursor-pointer px-3 py-2 rounded text-[10px] font-bold border flex items-center gap-2 select-none ${
                                    semanticMode 
                                    ? highContrast ? 'bg-black text-white' : 'bg-purple-500/20 border-purple-500 text-purple-400' 
                                    : highContrast ? 'bg-gray-100 text-gray-500' : 'bg-black/40 border-gray-700 text-gray-500'
                                }`}
                             >
                                 <span className={`w-2 h-2 rounded-full ${semanticMode ? 'bg-purple-500' : 'bg-gray-500'}`}></span>
                                 AI SEMANTIC SEARCH
                             </div>
                             
                             <div className={`px-4 py-2 rounded border text-xs font-mono font-bold ${highContrast ? 'bg-white border-black' : 'bg-black/60 border-gray-700 text-gray-400'}`}>
                                 BLOCKS: {ledger.length}
                             </div>
                         </div>
                    </div>

                    {/* TABLE */}
                    <div className={`flex-1 rounded border overflow-hidden flex flex-col relative ${highContrast ? 'bg-white border-black' : 'bg-black/40 border-gray-800'}`}>
                        {/* Loading Overlay */}
                        {isSearching && (
                             <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center flex-col gap-2">
                                 <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                 <span className="text-[10px] font-mono text-purple-400">SEARCHING NEURAL NET...</span>
                             </div>
                        )}

                        {/* HEADER */}
                        <div className={`grid grid-cols-12 p-3 border-b text-[9px] font-bold uppercase tracking-wider ${highContrast ? 'bg-gray-100 border-black text-black' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
                            <div className="col-span-1">Height</div>
                            <div className="col-span-2">Age</div>
                            <div className="col-span-2">Miner</div>
                            <div className="col-span-4">Payload (Headline)</div>
                            <div className="col-span-2">Hash</div>
                            <div className="col-span-1 text-center">Urgency</div>
                        </div>

                        {/* ROWS */}
                        <div className="overflow-y-auto flex-1">
                            {filteredBlocks.length === 0 ? (
                                <div className="text-center py-10 opacity-50 font-mono text-xs">NO BLOCKS FOUND</div>
                            ) : (
                                filteredBlocks.map((block) => (
                                    <div 
                                        key={block.hash} 
                                        onClick={() => setSelectedBlock(block)}
                                        className={`grid grid-cols-12 p-3 border-b text-[10px] font-mono items-center cursor-pointer transition-colors ${highContrast ? 'border-gray-200 hover:bg-gray-100 text-black' : 'border-gray-800 text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <div className="col-span-1 text-purple-400">{block.height}</div>
                                        <div className="col-span-2">{new Date(block.timestamp).toLocaleTimeString()}</div>
                                        <div className="col-span-2 flex items-center gap-2">
                                            <RetroIdenticon address={block.miner} size={16} />
                                            <span className="truncate">{block.miner.slice(0,8)}...</span>
                                        </div>
                                        <div className="col-span-4 truncate text-white">{block.data.headline}</div>
                                        <div className="col-span-2 truncate opacity-50">{block.hash}</div>
                                        <div className="col-span-1 text-center">
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                                block.data.urgency === 'CRITICAL' ? 'bg-red-500 text-white' : 
                                                block.data.urgency === 'MED' ? 'bg-yellow-500 text-black' : 
                                                'bg-green-500 text-black'
                                            }`}>
                                                {block.data.urgency}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* BLOCK DETAIL MODAL */}
            {selectedBlock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setSelectedBlock(null)}>
                    <div className={`w-full max-w-2xl rounded-lg border-2 p-6 relative ${highContrast ? 'bg-white border-black text-black' : 'bg-black border-sophon-accent/50 shadow-[0_0_50px_rgba(0,240,255,0.2)]'}`} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedBlock(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
                        
                        <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
                            <div className="p-3 bg-sophon-accent/10 border border-sophon-accent rounded">
                                <span className="text-2xl">🧊</span>
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold font-mono ${highContrast ? 'text-black' : 'text-white'}`}>BLOCK #{selectedBlock.height}</h3>
                                <p className="text-xs text-gray-500 font-mono">{selectedBlock.hash}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 font-mono text-xs">
                            <div>
                                <div className="text-gray-500 mb-1">MINED BY</div>
                                <div className="flex items-center gap-2 mb-4">
                                    <RetroIdenticon address={selectedBlock.miner} size={20} />
                                    <span className={highContrast ? 'text-black' : 'text-purple-400'}>{selectedBlock.miner}</span>
                                </div>
                                
                                <div className="text-gray-500 mb-1">TIMESTAMP</div>
                                <div className={`mb-4 ${highContrast ? 'text-black' : 'text-white'}`}>{new Date(selectedBlock.timestamp).toLocaleString()}</div>

                                <div className="text-gray-500 mb-1">NONCE</div>
                                <div className={`mb-4 ${highContrast ? 'text-black' : 'text-white'}`}>{selectedBlock.nonce}</div>
                            </div>
                            
                            <div>
                                <div className="text-gray-500 mb-1">CATEGORY</div>
                                <div className="mb-4">
                                    <span className="px-2 py-1 bg-gray-800 rounded text-gray-300 border border-gray-600">{selectedBlock.data.category}</span>
                                </div>

                                <div className="text-gray-500 mb-1">FACT HASH (DATA)</div>
                                <div className="mb-4 break-all opacity-70 text-[10px]">{selectedBlock.data.factHash}</div>

                                <div className="text-gray-500 mb-1">SIGNATURE</div>
                                <div className="mb-4 break-all opacity-70 text-[10px]">{selectedBlock.data.signature.slice(0, 40)}...</div>
                            </div>
                        </div>

                        <div className={`mt-4 p-4 rounded border ${highContrast ? 'bg-gray-100 border-black' : 'bg-gray-900 border-gray-700'}`}>
                            <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase">Decoded Payload</div>
                            <p className={`text-sm italic ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>"{selectedBlock.data.headline}"</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

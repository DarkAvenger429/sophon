
import React, { useState } from 'react';
import { connectWallet, signHeadline, verifySignature, WalletState } from '../services/web3Service';
import { findSemanticMatch } from '../services/geminiService';

interface PublisherPortalProps {
  highContrast?: boolean;
}

interface SignedItem {
    headline: string;
    fact: string; // The Semantic Fact that was actually signed
    signature: string;
    hash: string;
    address: string;
    timestamp: number;
}

export const PublisherPortal: React.FC<PublisherPortalProps> = ({ highContrast }) => {
  // AUTHENTICATION
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'PUBLISH' | 'EXPLORER'>('PUBLISH');

  // PUBLISH STATE
  const [wallet, setWallet] = useState<WalletState>({ address: null, isConnected: false, chainId: null });
  const [headline, setHeadline] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [receipt, setReceipt] = useState<SignedItem | null>(null);
  
  // SHARED LEDGER STATE (In a real app, this is fetched from the chain)
  const [history, setHistory] = useState<SignedItem[]>([]);

  // EXPLORER STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SignedItem[]>([]);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (accessCode === 'SOPHON-PRESS') {
          setIsAuthenticated(true);
          setAuthError('');
      } else {
          setAuthError('ACCESS DENIED');
          setAccessCode('');
      }
  };

  const handleConnect = async () => {
    const state = await connectWallet();
    setWallet(state);
  };

  const handleSign = async () => {
    if (!headline.trim() || !wallet.isConnected) return;
    setIsSigning(true);
    
    // Sign the raw headline for simple provenance
    const result = await signHeadline(headline);
    
    if (result) {
        const newItem: SignedItem = {
            headline: headline.trim(),
            fact: result.fact, 
            signature: result.signature,
            hash: result.hash,
            address: wallet.address || '',
            timestamp: Date.now()
        };
        setReceipt(newItem);
        setHistory(prev => [newItem, ...prev]);
    }
    setIsSigning(false);
  };

  const handleSearch = () => {
      if (!searchQuery.trim()) {
          setSearchResults(history);
          return;
      }
      const results = history.filter(item => 
          item.headline.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
  };

  const copyProof = (item: SignedItem) => {
      const proof = JSON.stringify({
          content: item.headline,
          timestamp: new Date(item.timestamp).toISOString(),
          signature: item.signature,
          publisher: item.address
      }, null, 2);
      navigator.clipboard.writeText(proof);
      alert("Cryptographic Proof Copied");
  };

  // Helper to calculate Mock Reputation
  const getReputation = (address: string) => {
      const count = history.filter(h => h.address === address).length;
      if (count > 5) return { rank: 'TIER 1 (GOLD)', color: 'text-yellow-400' };
      if (count > 2) return { rank: 'TIER 2 (SILVER)', color: 'text-gray-300' };
      return { rank: 'UNVERIFIED', color: 'text-gray-500' };
  };

  if (!isAuthenticated) {
      return (
          <div className={`w-full h-[500px] flex items-center justify-center animate-fadeIn`}>
              <div className={`w-full max-w-md p-8 rounded-lg border-2 flex flex-col items-center text-center ${highContrast ? 'bg-white border-black' : 'bg-black/60 border-red-500/50 shadow-[0_0_30px_rgba(255,0,60,0.1)]'}`}>
                  <h2 className={`text-xl font-bold font-mono tracking-widest mb-2 ${highContrast ? 'text-black' : 'text-white'}`}>RESTRICTED ACCESS</h2>
                  <form onSubmit={handleLogin} className="w-full mt-6">
                      <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="ENTER CODE (SOPHON-PRESS)" className={`w-full p-3 text-center font-mono text-sm rounded mb-4 focus:outline-none border ${highContrast ? 'bg-gray-100 border-black text-black' : 'bg-black border-gray-700 text-white focus:border-sophon-danger'}`} />
                      {authError && <div className="mb-4 text-[10px] font-bold text-red-500 animate-pulse">{authError}</div>}
                      <button type="submit" className={`w-full py-3 rounded font-bold font-mono text-xs tracking-widest transition-all ${highContrast ? 'bg-black text-white hover:bg-gray-800' : 'bg-sophon-danger text-black hover:bg-sophon-danger/80'}`}>AUTHENTICATE</button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className={`p-6 rounded-lg border-2 ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-sophon-accent/30'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h2 className={`text-xl font-bold font-mono tracking-widest ${highContrast ? 'text-black' : 'text-white'}`}>BLOCKCHAIN HUB</h2>
                  <p className={`text-xs font-mono mt-1 ${highContrast ? 'text-gray-600' : 'text-gray-400'}`}>NEWS SUPPLY CHAIN // ON-CHAIN REPUTATION</p>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => setActiveTab('PUBLISH')} className={`px-4 py-2 rounded font-bold text-xs transition-colors ${activeTab === 'PUBLISH' ? (highContrast ? 'bg-black text-white' : 'bg-sophon-accent text-black') : 'bg-transparent border border-gray-600 text-gray-400'}`}>PUBLISHER MODE</button>
                  <button onClick={() => { setActiveTab('EXPLORER'); setSearchResults(history); }} className={`px-4 py-2 rounded font-bold text-xs transition-colors ${activeTab === 'EXPLORER' ? (highContrast ? 'bg-black text-white' : 'bg-purple-500 text-white') : 'bg-transparent border border-gray-600 text-gray-400'}`}>LEDGER EXPLORER</button>
              </div>
          </div>
      </div>

      {activeTab === 'PUBLISH' && (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SIGNING INTERFACE */}
                <div className={`p-6 rounded-lg border ${highContrast ? 'bg-white border-black' : 'bg-black/40 border-gray-700'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-sm font-bold ${highContrast ? 'text-black' : 'text-white'}`}>1. ORIGINATE</h3>
                        {wallet.isConnected ? (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${highContrast ? 'bg-white border-black text-black' : 'bg-sophon-success/20 border-sophon-success text-sophon-success'}`}>
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-[10px] font-mono font-bold">{wallet.address?.slice(0,6)}...{wallet.address?.slice(-4)}</span>
                            </div>
                        ) : (
                            <div className="text-[10px] text-gray-500">NOT CONNECTED</div>
                        )}
                    </div>
                    
                    {!wallet.isConnected && (
                        <button onClick={handleConnect} className={`w-full mb-6 py-4 rounded-lg font-bold font-mono text-sm tracking-widest transition-all flex items-center justify-center gap-3 ${highContrast ? 'bg-black text-white border-2 border-black hover:bg-gray-800' : 'bg-sophon-accent text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:bg-white animate-pulse'}`}>CONNECT WALLET</button>
                    )}
                    
                    <textarea value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Enter official news headline to timestamp..." className={`w-full h-32 p-4 rounded mb-4 font-mono text-sm focus:outline-none border transition-all ${highContrast ? 'bg-gray-50 border-black text-black disabled:bg-gray-200' : `bg-gray-900 border-gray-600 text-white focus:border-sophon-accent ${!wallet.isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}`} disabled={!wallet.isConnected} />
                    
                    <button onClick={handleSign} disabled={!wallet.isConnected || !headline.trim() || isSigning} className={`w-full py-3 rounded font-bold font-mono text-xs tracking-widest transition-all ${highContrast ? 'bg-black text-white hover:bg-gray-800 disabled:opacity-50' : 'bg-sophon-accent text-black hover:bg-sophon-accent/90 disabled:opacity-50 disabled:cursor-not-allowed'}`}>
                        {isSigning ? 'SIGNING...' : 'SIGN & TIMESTAMP'}
                    </button>
                </div>

                {/* RECEIPT */}
                <div className={`p-6 rounded-lg border relative overflow-hidden flex flex-col ${highContrast ? 'bg-gray-50 border-black' : 'bg-black/40 border-gray-700'}`}>
                    <h3 className={`text-sm font-bold mb-4 ${highContrast ? 'text-black' : 'text-gray-400'}`}>2. DIGITAL SEAL</h3>
                    {receipt ? (
                        <div className="space-y-4 animate-fadeIn flex-1">
                            <div className={`p-3 rounded border font-mono text-[10px] break-all ${highContrast ? 'bg-white border-black' : 'bg-purple-500/5 border-purple-500/30'}`}>
                                <div className="text-gray-500 mb-1">CONTENT HASH</div>
                                <div className={highContrast ? 'text-black' : 'text-purple-400'}>{receipt.hash}</div>
                            </div>
                            <div className={`p-3 rounded border font-mono text-[10px] break-all ${highContrast ? 'bg-white border-black' : 'bg-blue-500/5 border-blue-500/30'}`}>
                                <div className="text-gray-500 mb-1">TIMESTAMP</div>
                                <div className={highContrast ? 'text-black' : 'text-blue-400'}>{new Date(receipt.timestamp).toUTCString()}</div>
                            </div>
                            <div className="mt-auto flex gap-2">
                                <button onClick={() => copyProof(receipt)} className={`flex-1 py-2 rounded text-[10px] font-bold border ${highContrast ? 'bg-white text-black border-black' : 'bg-black text-gray-300 border-gray-600 hover:border-white'}`}>COPY PROOF</button>
                                <div className="flex items-center gap-2 px-3 py-2 rounded bg-black/20 border border-gray-700">
                                    <div className={`w-2 h-2 rounded-full ${highContrast ? 'bg-black' : 'bg-sophon-success animate-pulse'}`}></div>
                                    <span className={`text-[10px] font-bold ${highContrast ? 'text-black' : 'text-white'}`}>ON-CHAIN</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <span className="text-xs font-mono">AWAITING SIGNATURE</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'EXPLORER' && (
          <div className="animate-fadeIn">
              <div className={`p-6 rounded-lg border ${highContrast ? 'bg-white border-black' : 'bg-black/40 border-gray-700'}`}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-sm font-bold ${highContrast ? 'text-black' : 'text-white'}`}>LEDGER EXPLORER</h3>
                      <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Search keywords or Hash..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                            className={`px-3 py-1.5 text-xs rounded border focus:outline-none w-64 font-mono ${highContrast ? 'bg-white border-black text-black' : 'bg-black border-gray-600 text-white focus:border-purple-500'}`}
                          />
                          <button onClick={handleSearch} className={`px-4 py-1.5 rounded text-xs font-bold ${highContrast ? 'bg-black text-white' : 'bg-purple-600 text-white'}`}>SEARCH</button>
                      </div>
                  </div>

                  {searchResults.length === 0 ? (
                      <div className="text-center py-12 opacity-50 font-mono text-xs">NO RECORDS FOUND ON LOCAL LEDGER</div>
                  ) : (
                      <div className="space-y-3">
                          {searchResults.map((item, idx) => {
                              const rep = getReputation(item.address);
                              return (
                                <div key={idx} className={`p-4 rounded border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${highContrast ? 'bg-gray-50 border-black' : 'bg-white/5 border-white/10 hover:border-purple-500/50 transition-colors'}`}>
                                    <div className="flex-1">
                                        <h4 className={`text-sm font-bold ${highContrast ? 'text-black' : 'text-white'}`}>{item.headline}</h4>
                                        <div className="flex gap-4 mt-2 text-[10px] font-mono text-gray-500">
                                            <span>BLOCK: #{Math.floor(18000000 + (item.timestamp / 1000000))}</span>
                                            <span className="truncate max-w-[150px]">HASH: {item.hash}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-bold ${rep.color}`}>{rep.rank}</span>
                                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-[8px] text-white border border-white/20`}>
                                                {item.address.slice(2,4).toUpperCase()}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-mono">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </span>
                                        <button onClick={() => copyProof(item)} className={`mt-1 text-[9px] underline ${highContrast ? 'text-black' : 'text-purple-400 hover:text-purple-300'}`}>
                                            VIEW PROOF
                                        </button>
                                    </div>
                                </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

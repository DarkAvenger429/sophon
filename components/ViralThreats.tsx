import React, { useEffect, useState } from 'react';
import { scanForTopics } from '../services/geminiService';

interface ThreatItem {
    id: string;
    headline: string;
    platform: string;
    status: string;
    risk: string;
    count: string;
    url?: string;
}

// REAL WORLD SEED DATA (Fallbacks)
const SEED_THREATS: ThreatItem[] = [
    {
        id: '1',
        headline: "Deepfake: 'Pentagon Explosion' Photo Crashes Stock Market",
        platform: "Twitter/X",
        status: "DEBUNKED",
        risk: "EXTREME",
        count: "Global Impact",
        url: "https://www.cnn.com/2023/05/22/tech/twitter-fake-image-pentagon-explosion/index.html"
    },
    {
        id: '2',
        headline: "Hoax: 'Solar Superstorm' Internet Apocalypse Warning",
        platform: "WhatsApp",
        status: "FALSE",
        risk: "HIGH",
        count: "Recurring Chain",
        url: "https://www.space.com/solar-storm-internet-apocalypse-debunked"
    },
    {
        id: '3',
        headline: "Scam: 'Digital ID Mandate' for Internet Access",
        platform: "Facebook/Telegram",
        status: "MISLEADING",
        risk: "MED",
        count: "Conspiracy",
        url: "https://www.reuters.com/fact-check/no-evidence-world-economic-forum-ordering-digital-id-internet-access-2023-09-29/"
    }
];

export const ViralThreats: React.FC<{ highContrast?: boolean }> = ({ highContrast }) => {
  const [threats, setThreats] = useState<ThreatItem[]>(SEED_THREATS);
  const [loading, setLoading] = useState(false);

  const refreshThreats = async () => {
      setLoading(true);
      try {
          const liveData = await scanForTopics("VIRAL_MISINFORMATION");
          if (liveData && liveData.length > 0) {
              const formatted: ThreatItem[] = liveData.slice(0, 3).map((item, idx) => ({
                  id: `live-${idx}`,
                  headline: item.query, 
                  platform: ["Twitter", "WhatsApp", "Telegram"][Math.floor(Math.random() * 3)],
                  status: "ANALYZING",
                  risk: "HIGH",
                  count: "Trending Now",
                  url: `https://www.google.com/search?q=${encodeURIComponent(item.query)}`
              }));
              setThreats(formatted);
          }
      } catch (e) {
          console.error("Using seed data");
      }
      setLoading(false);
  };

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-sophon-danger/30 hover:border-sophon-danger/60'}`}>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <span className={`text-xl ${loading ? 'animate-spin' : ''}`}>🔥</span>
                <div>
                    <h3 className={`text-sm font-bold font-mono tracking-widest ${highContrast ? 'text-black' : 'text-white'}`}>VIRAL THREATS</h3>
                    <p className="text-[10px] text-gray-500">RECENT MAJOR HOAXES</p>
                </div>
            </div>
            <button 
                onClick={refreshThreats}
                disabled={loading}
                className={`text-[10px] border px-2 py-1 rounded hover:bg-white/10 ${highContrast ? 'border-black text-black' : 'border-white/20 text-gray-400'}`}
            >
                {loading ? 'SCANNING...' : 'LIVE SCAN'}
            </button>
        </div>
        
        <div className="space-y-3">
            {threats.map(fake => (
                <div key={fake.id} className={`p-3 rounded border flex flex-col gap-2 animate-fadeIn ${highContrast ? 'bg-gray-50 border-black' : 'bg-black/40 border-white/5 hover:bg-white/5'}`}>
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className={`text-xs font-bold leading-tight line-clamp-2 ${highContrast ? 'text-black' : 'text-gray-200'}`}>{fake.headline}</p>
                            <div className="flex gap-2 mt-1 text-[9px] text-gray-500 font-mono">
                                <span>{fake.platform}</span>
                                <span>•</span>
                                <span>{fake.count}</span>
                            </div>
                        </div>
                        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap ${highContrast ? 'bg-black text-white' : 'bg-sophon-danger text-black shadow-[0_0_10px_rgba(255,0,60,0.4)]'}`}>
                            {fake.risk}
                        </div>
                    </div>
                    
                    {fake.url && (
                        <a 
                            href={fake.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className={`text-[10px] flex items-center gap-1 hover:underline ${highContrast ? 'text-blue-600' : 'text-sophon-accent'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            VIEW SOURCE
                        </a>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};
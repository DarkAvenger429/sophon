
import React from 'react';
import { NewsItem } from '../types';

interface LiveTickerProps {
  activeSector: string;
  threatLevel: string;
  news: NewsItem[];
  highContrast?: boolean;
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ activeSector, threatLevel, news, highContrast }) => {
  const hasNews = news.length > 0;

  const NewsContent = () => (
      hasNews ? (
        news.map((item) => (
            <span key={item.id} className="inline-flex items-center gap-2 mx-8">
                <span className={highContrast ? 'text-white font-bold' : 'text-sophon-success'}>/// GLOBAL WIRE:</span>
                <span className={`font-bold ${highContrast ? 'text-white' : 'text-white'}`}>{item.headline}</span>
                <span className="text-gray-500">[{item.time}]</span>
            </span>
        ))
      ) : (
         <>
            <span className="inline-flex items-center gap-2 mx-8"><span className={highContrast ? 'text-white' : 'text-sophon-accent'}>/// MONITORING SECTOR: {activeSector}</span></span>
            <span className="inline-flex items-center gap-2 mx-8"><span>/// SYSTEM THREAT LEVEL: <span className={threatLevel === 'HIGH' ? 'text-sophon-danger' : 'text-sophon-success'}>{threatLevel}</span></span></span>
            <span className="inline-flex items-center gap-2 mx-8"><span>/// GLOBAL RAG NODES: ONLINE</span></span>
            <span className="inline-flex items-center gap-2 mx-8"><span>/// SEARCH GROUNDING: ACTIVE</span></span>
         </>
      )
  );

  return (
    <div 
        className={`w-full border-b h-9 flex items-center overflow-hidden relative z-40 select-none ${highContrast ? 'bg-black border-white' : 'bg-sophon-dark border-white/10'}`}
        role="marquee"
        aria-live="polite"
    >
      <div className={`px-4 h-full flex items-center font-bold text-xs shrink-0 font-mono tracking-widest relative z-20 ${highContrast ? 'bg-white text-black' : 'bg-sophon-accent text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'}`}>
        LIVE WIRE
      </div>
      
      {/* Ticker Container */}
      <div className="flex-1 overflow-hidden relative flex items-center h-full">
         {highContrast ? (
             <div className="px-4 text-[10px] font-mono text-white flex gap-4 overflow-x-auto scrollbar-hide whitespace-nowrap">
                 {/* Static list for accessibility mode */}
                 {hasNews ? news.map(n => n.headline).join(' /// ') : `MONITORING: ${activeSector} /// THREAT LEVEL: ${threatLevel}`}
             </div>
         ) : (
            <div className="animate-marquee whitespace-nowrap flex items-center text-[10px] font-mono text-gray-400 absolute left-0">
               {/* Tripled content to ensure gapless loop */}
               <div className="flex">
                  {Array.from({ length: 4 }).map((_, i) => (
                      <React.Fragment key={i}>
                          <NewsContent />
                      </React.Fragment>
                  ))}
               </div>
            </div>
         )}
      </div>
      
      {!highContrast && <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-sophon-dark to-transparent pointer-events-none z-10"></div>}
    </div>
  );
};
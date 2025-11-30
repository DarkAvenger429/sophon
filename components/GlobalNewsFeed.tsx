
import React from 'react';
import { NewsItem } from '../types';

interface GlobalNewsFeedProps {
    news: NewsItem[];
    onRefresh: () => void;
    loading: boolean;
    highContrast?: boolean;
}

export const GlobalNewsFeed: React.FC<GlobalNewsFeedProps> = ({ news, onRefresh, loading, highContrast }) => {
  return (
    <div className={`p-4 rounded-lg border-2 h-[500px] flex flex-col relative ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-sophon-accent/30'}`}>
        
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
            <div>
                <h3 className={`text-sm font-bold font-mono tracking-widest ${highContrast ? 'text-black' : 'text-white'}`}>GLOBAL NEWS WIRE</h3>
                <p className="text-[10px] text-gray-500">REAL-TIME RAG FEED // VERIFIED SOURCES</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={onRefresh}
                    disabled={loading}
                    className={`text-[10px] px-2 py-1 rounded border hover:bg-white/10 ${loading ? 'animate-pulse' : ''} ${highContrast ? 'border-black text-black' : 'border-sophon-accent text-sophon-accent'}`}
                >
                    {loading ? 'SYNCING...' : 'REFRESH'}
                </button>
            </div>
        </div>
        
        <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {news.map(item => (
                <div key={item.id} className={`p-3 rounded border animate-fadeIn ${highContrast ? 'bg-gray-50 border-black' : 'bg-black/40 border-white/10 hover:border-white/20'}`}>
                    <div className="flex justify-between items-start gap-2">
                        <a href={item.url} target="_blank" rel="noreferrer" className={`text-xs font-bold leading-tight hover:underline ${highContrast ? 'text-black' : 'text-white'}`}>
                            {item.headline}
                        </a>
                        <span className="text-[9px] text-gray-500 whitespace-nowrap">{item.time}</span>
                    </div>
                    
                    <p className={`text-[10px] mt-2 mb-2 leading-relaxed ${highContrast ? 'text-gray-700' : 'text-gray-400'}`}>
                        {item.summary}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">{item.source}</span>
                        <div className="flex gap-2">
                            <span className={`text-[9px] flex items-center gap-1 px-1.5 py-0.5 rounded ${highContrast ? 'bg-gray-200' : 'bg-white/5 text-gray-500'}`}>
                                Verified
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
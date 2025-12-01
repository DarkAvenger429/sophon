
import React, { useEffect, useState } from 'react';
import { Report, VerdictType, NewsItem } from '../types';

interface HolographicGlobeProps {
  reports: Report[];
  news?: NewsItem[];
  highContrast?: boolean;
}

interface MatrixItem {
    id: string;
    status: 'THREAT' | 'VERIFIED' | 'WIRE';
    label: string;
    url?: string;
    isExternal: boolean;
}

interface RegionData {
    code: string;
    label: string;
    count: number;
    threats: number;
    items: MatrixItem[];
}

export const HolographicGlobe: React.FC<HolographicGlobeProps> = ({ reports, news = [], highContrast }) => {
  const [regions, setRegions] = useState<RegionData[]>([]);

  useEffect(() => {
    // 0: Americas, 1: EMEA, 2: APAC
    const stats: RegionData[] = [
        { code: 'AMERICAS', label: 'NO. AMERICA / SA', count: 0, threats: 0, items: [] },
        { code: 'EMEA', label: 'EUROPE / ME / AFRICA', count: 0, threats: 0, items: [] },
        { code: 'APAC', label: 'ASIA PACIFIC', count: 0, threats: 0, items: [] }
    ];

    // Process Reports
    reports.forEach(r => {
        const hash = r.id.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
        const idx = hash % 3;
        
        const isThreat = r.verdict === VerdictType.FALSE || r.verdict === VerdictType.MISLEADING;
        
        stats[idx].count++;
        if (isThreat) stats[idx].threats++;
        
        stats[idx].items.push({ 
            id: r.id.substring(0, 8), 
            status: isThreat ? 'THREAT' : 'VERIFIED',
            label: isThreat ? 'MALICIOUS' : 'SECURE',
            url: undefined, // Internal link
            isExternal: false
        });
    });

    // Process News (Simulated Geolocation based on hash)
    news.forEach(n => {
        const hash = n.id.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
        const idx = hash % 3;
        
        stats[idx].count++;
        // News from wire is considered neutral/verified for this viz unless flagged elsewhere
        stats[idx].items.push({
            id: n.id.split('-')[1] || 'WIRE',
            status: 'WIRE',
            label: 'NEWS WIRE',
            url: n.url,
            isExternal: true
        });
    });

    // Limit displayed items
    stats.forEach(region => {
        if (region.items.length > 8) {
            region.items = region.items.slice(region.items.length - 8);
        }
    });

    setRegions(stats);
  }, [reports, news]);

  return (
    <div className={`w-full h-auto min-h-[350px] flex flex-col rounded-lg p-4 border-2 ${highContrast ? 'bg-white border-black text-black' : 'bg-[#050505] border-sophon-accent/20'}`}>
        <div className="flex justify-between items-end mb-4 border-b border-gray-800 pb-2">
            <div>
                <h3 className={`text-sm font-bold font-mono tracking-widest ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>GLOBAL THREAT MATRIX</h3>
                <p className="text-[10px] text-gray-500 font-mono">INTERACTIVE REGIONAL DATA</p>
            </div>
            <div className="text-[10px] font-mono text-gray-500">
                ACTIVE ZONES: 3
            </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
            {regions.map((region) => (
                <div key={region.code} className={`rounded border flex flex-col overflow-hidden ${highContrast ? 'border-black bg-gray-50' : 'border-white/10 bg-white/5'}`}>
                    {/* Header */}
                    <div className={`p-2 border-b text-[10px] font-bold flex justify-between items-center ${highContrast ? 'border-black bg-gray-200' : 'border-white/10 bg-black/40 text-gray-400'}`}>
                        <span>{region.code}</span>
                        {region.threats > 0 && (
                            <span className={`px-1.5 rounded text-[8px] ${highContrast ? 'bg-black text-white' : 'bg-sophon-danger text-black'}`}>
                                ⚠ {region.threats}
                            </span>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="p-3 text-center border-b border-white/5">
                        <div className={`text-3xl font-bold font-mono ${highContrast ? 'text-black' : 'text-white'}`}>{region.count}</div>
                        <div className="text-[9px] uppercase text-gray-500 tracking-wider">Total Events</div>
                    </div>

                    {/* Visual Matrix List */}
                    <div className="flex-1 p-2 space-y-1 overflow-hidden relative min-h-[100px]">
                         {/* Scan line effect */}
                         {!highContrast && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sophon-accent/5 to-transparent animate-scan-line pointer-events-none"></div>}

                         {/* Threat Bar */}
                        <div className="flex items-center gap-2 text-[9px] font-mono mb-3 opacity-80">
                            <span className="text-gray-500 w-6">RISK</span>
                            <div className="flex-1 h-1 bg-gray-800 rounded overflow-hidden">
                                <div className={`h-full ${highContrast ? 'bg-black' : 'bg-sophon-danger'}`} style={{ width: `${Math.min(100, (region.threats / (region.count || 1)) * 100)}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                             {region.items.map((item, idx) => {
                                 const colorClass = item.status === 'THREAT' 
                                        ? highContrast ? 'border-black bg-gray-200 text-black hover:bg-gray-300' : 'border-sophon-danger bg-sophon-danger/10 text-sophon-danger hover:bg-sophon-danger/20 hover:shadow-[0_0_10px_rgba(255,0,60,0.3)]' 
                                        : item.status === 'WIRE'
                                        ? highContrast ? 'border-gray-400 bg-white text-gray-800 hover:bg-gray-100' : 'border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400'
                                        : highContrast ? 'border-gray-400 bg-white text-gray-600' : 'border-sophon-success/50 bg-white/5 text-gray-400';
                                 
                                 const Tag = item.isExternal ? 'a' : 'div';
                                 const props = item.isExternal ? { href: item.url, target: '_blank', rel: 'noreferrer' } : {};

                                 return (
                                     <Tag 
                                        key={idx} 
                                        {...props}
                                        className={`flex justify-between items-center text-[9px] font-mono px-2 py-1 rounded border-l-2 cursor-pointer transition-all duration-300 group ${colorClass}`}
                                     >
                                         <span className="group-hover:tracking-wider transition-all">ID-{item.id}</span>
                                         <div className="flex items-center gap-2">
                                            <span>{item.label}</span>
                                            {item.isExternal && <span className="opacity-0 group-hover:opacity-100">↗</span>}
                                         </div>
                                     </Tag>
                                 );
                             })}
                             {region.count === 0 && (
                                 <div className="text-[9px] text-gray-700 text-center py-6 font-mono border border-dashed border-gray-800 rounded">
                                     NO ACTIVE DATA
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

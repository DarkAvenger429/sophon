import React from 'react';
import { Report, VerdictType } from '../types';

interface HeatmapProps {
  reports: Report[];
  highContrast?: boolean;
}

// REGION MAPPING
const REGIONS: Record<string, string[]> = {
    'AMERICAS': ['usa', 'washington', 'new york', 'california', 'texas', 'canada', 'toronto', 'brazil', 'rio', 'mexico'],
    'EMEA': ['uk', 'london', 'france', 'paris', 'germany', 'berlin', 'russia', 'moscow', 'ukraine', 'kyiv', 'israel', 'gaza', 'iran', 'tehran', 'dubai', 'nigeria', 'south africa'],
    'APAC': ['india', 'delhi', 'mumbai', 'bangalore', 'amritsar', 'pune', 'hyderabad', 'china', 'beijing', 'japan', 'tokyo', 'australia', 'sydney']
};

export const Heatmap: React.FC<HeatmapProps> = ({ reports, highContrast }) => {
  // Aggregate Data
  const locationStats: Record<string, { count: number, threats: number }> = {};

  reports.forEach(report => {
      const text = `${report.topic} ${report.tags.join(' ')} ${report.entities.join(' ')}`.toLowerCase();
      const isThreat = report.verdict === VerdictType.FALSE || report.verdict === VerdictType.MISLEADING;

      Object.entries(REGIONS).forEach(([region, cities]) => {
          cities.forEach(city => {
              if (text.includes(city)) {
                  if (!locationStats[city]) locationStats[city] = { count: 0, threats: 0 };
                  locationStats[city].count++;
                  if (isThreat) locationStats[city].threats++;
              }
          });
      });
  });

  // Helper to get color intensity
  const getIntensityClass = (stats: { count: number, threats: number }) => {
      if (stats.threats > 0) {
          // Threat Gradient
          if (stats.threats > 3) return highContrast ? 'bg-black text-white border-2 border-white' : 'bg-sophon-danger text-black shadow-[0_0_15px_rgba(255,0,60,0.6)]';
          return highContrast ? 'bg-gray-800 text-white' : 'bg-sophon-danger/40 text-white border-sophon-danger/50';
      } else {
          // Safe Gradient
          if (stats.count > 3) return highContrast ? 'bg-gray-300 text-black' : 'bg-sophon-success text-black shadow-[0_0_10px_rgba(0,255,159,0.4)]';
          return highContrast ? 'bg-white text-black border border-black' : 'bg-sophon-success/20 text-sophon-success border-sophon-success/30';
      }
  };

  const activeCities = Object.keys(locationStats).sort((a, b) => locationStats[b].count - locationStats[a].count);

  return (
    <div className={`w-full p-4 rounded-lg border-2 ${highContrast ? 'bg-white border-black' : 'glass-panel border-sophon-accent/30'}`}>
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <div>
                <h3 className={`text-sm font-bold font-mono tracking-widest ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>
                    GEOSPATIAL INTEL MATRIX
                </h3>
                <p className="text-[10px] text-gray-500 font-mono">REGIONAL THREAT DENSITY</p>
            </div>
            <div className="flex gap-2 text-[9px] font-mono uppercase">
                <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${highContrast ? 'bg-black' : 'bg-sophon-danger'}`}></span> THREAT</span>
                <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${highContrast ? 'bg-gray-400' : 'bg-sophon-success'}`}></span> SECURE</span>
            </div>
        </div>

        {activeCities.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-mono text-xs">
                NO GEOLOCATED INTEL IN CURRENT SESSION
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(REGIONS).map(([region, cities]) => {
                    const regionActiveCities = cities.filter(c => locationStats[c]);
                    if (regionActiveCities.length === 0) return null;

                    return (
                        <div key={region} className={`p-3 rounded border ${highContrast ? 'border-black' : 'bg-black/20 border-white/5'}`}>
                            <h4 className={`text-[10px] font-bold mb-2 opacity-50 ${highContrast ? 'text-black' : 'text-white'}`}>{region}</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {regionActiveCities.map(city => {
                                    const stats = locationStats[city];
                                    return (
                                        <div key={city} className={`p-2 rounded text-center transition-all ${getIntensityClass(stats)}`}>
                                            <div className="text-[10px] font-bold uppercase font-mono">{city}</div>
                                            <div className="text-[8px] font-mono opacity-80">
                                                RPT: {stats.count} | THT: {stats.threats}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};
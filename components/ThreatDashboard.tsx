import React from 'react';
import { Report, VerdictType } from '../types';
import { ReportCard } from './ReportCard';

interface ThreatDashboardProps {
  reports: Report[];
}

export const ThreatDashboard: React.FC<ThreatDashboardProps> = ({ reports }) => {
  const threats = reports.filter(r => r.verdict === VerdictType.FALSE || r.verdict === VerdictType.MISLEADING);

  return (
    <div className="animate-fadeIn">
       <div className="mb-6 p-4 rounded bg-sophon-danger/10 border border-sophon-danger/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-sophon-danger/20 flex items-center justify-center animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sophon-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wider">THREAT MATRIX ACTIVE</h2>
                    <p className="text-sophon-danger text-xs font-mono uppercase">Displaying detected falsehoods & misleading intel</p>
                </div>
            </div>
            <div className="text-right">
                <span className="text-3xl font-bold text-white">{threats.length}</span>
                <span className="block text-xs text-gray-400">ACTIVE THREATS</span>
            </div>
       </div>

       <div className="space-y-4">
         {threats.length === 0 ? (
            <div className="text-center py-20 border border-gray-800 rounded-lg bg-black/20">
                <p className="text-gray-500 font-mono">NO ACTIVE THREATS DETECTED</p>
                <p className="text-gray-600 text-sm mt-2">System is monitoring for misinformation...</p>
            </div>
         ) : (
             threats.map(report => (
                 <ReportCard key={report.id} report={report} />
             ))
         )}
       </div>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalLogProps {
  logs: LogEntry[];
  highContrast?: boolean;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs, highContrast }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className={`rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs flex flex-col gap-1 border-l-2 shadow-inner ${highContrast ? 'bg-black border-white' : 'glass-panel border-sophon-accent/50 bg-black/60'}`}>
      <div className={`sticky top-0 backdrop-blur pb-2 mb-2 border-b flex justify-between items-center z-10 ${highContrast ? 'bg-black border-white text-white' : 'bg-black/80 border-white/10 text-sophon-accent'}`}>
        <span className="font-bold tracking-widest">&gt;&gt; SYSTEM_LOG</span>
        {!highContrast && (
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.8)]"></div>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
          </div>
        )}
      </div>
      
      {logs.length === 0 && <span className="text-gray-600 italic">&gt;&gt; Awaiting initialization...</span>}
      
      {logs.map((log) => (
        <div key={log.id} className="flex gap-2 animate-fadeIn hover:bg-white/5 p-0.5 rounded">
          <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]</span>
          <span className={`${
            highContrast ? 'text-white' : 
            log.type === 'error' ? 'text-red-400 font-bold' :
            log.type === 'success' ? 'text-green-400' :
            log.type === 'action' ? 'text-cyan-300' :
            log.type === 'warning' ? 'text-yellow-300' :
            'text-gray-300'
          }`}>
            {log.type === 'action' ? '> ' : ''}{log.message}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

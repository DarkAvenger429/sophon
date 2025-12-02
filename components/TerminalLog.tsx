
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';

interface TerminalLogProps {
  logs: LogEntry[];
  highContrast?: boolean;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs, highContrast }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  };

  useEffect(() => {
    if (shouldAutoScroll && containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, shouldAutoScroll]);

  return (
    <div 
        ref={containerRef}
        onScroll={handleScroll}
        className={`rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs flex flex-col gap-1 border-l-2 shadow-inner ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-sophon-accent/30 bg-black/40'}`}
    >
      <div className={`sticky top-0 backdrop-blur-sm pb-2 mb-2 border-b flex justify-between items-center z-10 ${highContrast ? 'bg-white border-black text-black' : 'border-white/10 text-sophon-accent'}`}>
        <span className="font-bold tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-current animate-pulse"></span>
            SYSTEM_LOG
        </span>
        <span className="text-[9px] opacity-50">LIVE KERNEL OUTPUT</span>
      </div>
      
      {logs.length === 0 && <span className="text-gray-600 italic">&gt;&gt; System Initialized. Awaiting Input...</span>}
      
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 animate-fadeIn hover:bg-white/5 p-0.5 rounded">
          <span className="text-gray-600 shrink-0 font-mono">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]</span>
          <span className={`${
            highContrast ? 'text-black' : 
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
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Report, VerdictType } from '../types';

interface Node {
  id: string;
  type: 'REPORT' | 'THEME';
  label: string;
  verdict?: VerdictType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fx?: number | null;
  fy?: number | null;
  reportData?: Report; // Full report data for the modal
}

interface Link {
  source: string;
  target: string;
}

interface NetworkGraphProps {
  reports: Report[];
  heightClass?: string;
}

// HISTORICAL SEED DATA (Background Context)
const HISTORICAL_THREATS = [
    { id: 'theme-health', label: 'Health Misinfo', type: 'THEME' },
    { id: 'h1', label: 'Vaccine Microchips', verdict: VerdictType.FALSE, parent: 'theme-health' },
    { id: 'h2', label: '5G Virus', verdict: VerdictType.FALSE, parent: 'theme-health' },
    
    { id: 'theme-space', label: 'Anti-Science', type: 'THEME' },
    { id: 'h5', label: 'Flat Earth', verdict: VerdictType.FALSE, parent: 'theme-space' },
    { id: 'h6', label: 'Fake Moon Landing', verdict: VerdictType.FALSE, parent: 'theme-space' },

    { id: 'theme-politics', label: 'Deep State', type: 'THEME' },
    { id: 'h9', label: 'Stolen Election', verdict: VerdictType.FALSE, parent: 'theme-politics' },
    { id: 'h11', label: 'QAnon', verdict: VerdictType.FALSE, parent: 'theme-politics' },
    
    { id: 'theme-finance', label: 'Crypto Scams', type: 'THEME' },
    { id: 'h13', label: 'XRP Buyback', verdict: VerdictType.FALSE, parent: 'theme-finance' },

    { id: 'theme-tech', label: 'AI Doomsday', type: 'THEME' },
    { id: 'h16', label: 'Sentient AI', verdict: VerdictType.MISLEADING, parent: 'theme-tech' },
];

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ reports, heightClass = "h-[600px]" }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'THREATS' | 'VERIFIED'>('ALL');
  
  const draggingNode = useRef<Node | null>(null);

  useEffect(() => {
    const newNodes: Node[] = [];
    const newLinks: Link[] = [];
    const nodeMap = new Map<string, Node>();

    // 1. Process Nodes based on Filter
    // Always include historical themes for context unless showing verified only
    if (filter !== 'VERIFIED') {
        HISTORICAL_THREATS.forEach(item => {
            const isTheme = item.type === 'THEME';
            const node: Node = {
                id: item.id,
                type: isTheme ? 'THEME' : 'REPORT',
                label: item.label,
                verdict: (item as any).verdict,
                x: Math.random() * 800,
                y: Math.random() * 600,
                vx: 0,
                vy: 0,
                radius: isTheme ? 30 : 10
            };
            newNodes.push(node);
            nodeMap.set(item.id, node);

            if (!isTheme && (item as any).parent) {
                newLinks.push({ source: (item as any).parent, target: item.id });
            }
        });
    }

    // 2. Add Session Reports
    const visibleReports = reports.filter(r => {
        if (filter === 'ALL') return true;
        if (filter === 'THREATS') return r.verdict === VerdictType.FALSE || r.verdict === VerdictType.MISLEADING;
        if (filter === 'VERIFIED') return r.verdict === VerdictType.VERIFIED;
        return true;
    });

    visibleReports.forEach(report => {
        if (nodeMap.has(report.id)) return;

        // Size based on importance/confidence
        const size = report.verdict === VerdictType.VERIFIED ? 12 : 15;
        
        const node: Node = {
            id: report.id,
            type: 'REPORT',
            label: report.topic.length > 15 ? report.topic.slice(0, 15) + '...' : report.topic,
            verdict: report.verdict,
            x: Math.random() * 800,
            y: Math.random() * 600,
            vx: 0,
            vy: 0,
            radius: size,
            reportData: report
        };
        newNodes.push(node);
        nodeMap.set(node.id, node);

        // Dynamic Clustering
        let linked = false;
        report.relatedThemes?.forEach(themeName => {
            let targetId = '';
            // Match against historical themes if they exist
            if (themeName.toLowerCase().includes('health')) targetId = 'theme-health';
            else if (themeName.toLowerCase().includes('space')) targetId = 'theme-space';
            else if (themeName.toLowerCase().includes('politic')) targetId = 'theme-politics';
            else if (themeName.toLowerCase().includes('finance')) targetId = 'theme-finance';
            else if (themeName.toLowerCase().includes('tech')) targetId = 'theme-tech';
            
            if (targetId && nodeMap.has(targetId)) {
                newLinks.push({ source: targetId, target: node.id });
                linked = true;
            }
        });

        // If verified, maybe link to other verified nodes to form a "Truth Cluster"
        if (report.verdict === VerdictType.VERIFIED) {
             const otherVerified = newNodes.find(n => n.id !== report.id && n.verdict === VerdictType.VERIFIED);
             if (otherVerified) {
                 newLinks.push({ source: otherVerified.id, target: node.id });
                 linked = true;
             }
        }

        if (!linked && filter !== 'VERIFIED') {
             // Link to a generic hub if no specific theme found
             const hubId = report.verdict === VerdictType.VERIFIED ? 'hub-truth' : 'hub-unknown';
             if (!nodeMap.has(hubId)) {
                 const hub: Node = { id: hubId, type: 'THEME', label: hubId === 'hub-truth' ? 'Verified Intel' : 'Emerging', x: 400, y: 300, vx: 0, vy: 0, radius: 25 };
                 newNodes.push(hub);
                 nodeMap.set(hubId, hub);
             }
             newLinks.push({ source: hubId, target: node.id });
        }
    });

    setNodes(newNodes);
    setLinks(newLinks);
  }, [reports, filter]);

  // Physics Loop (Same logic, tweaked parameters)
  useEffect(() => {
    if (nodes.length === 0) return;
    let animationFrameId: number;
    const width = 800;
    const height = 600;

    const tick = () => {
      setNodes(prevNodes => {
        const nextNodes = prevNodes.map(node => ({ ...node }));
        
        // Repulsion
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const dx = nextNodes[i].x - nextNodes[j].x;
            const dy = nextNodes[i].y - nextNodes[j].y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1) dist = 1;
            const force = 1200 / (dist * dist); // Strong repulsion
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            if (!nextNodes[i].fx) { nextNodes[i].vx += fx; nextNodes[i].vy += fy; }
            if (!nextNodes[j].fx) { nextNodes[j].vx -= fx; nextNodes[j].vy -= fy; }
          }
        }

        // Springs
        links.forEach(link => {
          const source = nextNodes.find(n => n.id === link.source);
          const target = nextNodes.find(n => n.id === link.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const force = (dist - 150) * 0.01; // Looser springs
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            if (!source.fx) { source.vx += fx; source.vy += fy; }
            if (!target.fx) { target.vx -= fx; target.vy -= fy; }
          }
        });

        // Center Gravity
        nextNodes.forEach(node => {
          if (node.fx != null && node.fy != null) {
              node.x = node.fx; node.y = node.fy; node.vx = 0; node.vy = 0;
          } else {
              node.vx += (width / 2 - node.x) * 0.003;
              node.vy += (height / 2 - node.y) * 0.003;
              node.vx *= 0.85; node.vy *= 0.85;
              node.x += node.vx; node.y += node.vy;
          }
        });
        return nextNodes;
      });
      animationFrameId = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(animationFrameId);
  }, [nodes.length, links.length]);

  // Handlers
  const handleMouseDown = (e: React.MouseEvent, node: Node) => {
      e.stopPropagation();
      draggingNode.current = node;
      node.fx = node.x; node.fy = node.y;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
      if (!draggingNode.current || !svgRef.current) return;
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
          const x = (e.clientX - CTM.e) / CTM.a;
          const y = (e.clientY - CTM.f) / CTM.d;
          setNodes(prev => prev.map(n => n.id === draggingNode.current?.id ? { ...n, fx: x, fy: y } : n));
      }
  };
  const handleMouseUp = () => {
      if (draggingNode.current) {
          const id = draggingNode.current.id;
          setNodes(prev => prev.map(n => n.id === id ? { ...n, fx: null, fy: null } : n));
          draggingNode.current = null;
      }
  };

  const getNodeColor = (node: Node) => {
    if (node.type === 'THEME') return '#ffffff';
    switch (node.verdict) {
      case VerdictType.VERIFIED: return '#00ff9f';
      case VerdictType.FALSE: return '#ff003c';
      case VerdictType.MISLEADING: return '#fcee0a';
      case VerdictType.OPINION: return '#00f0ff';
      default: return '#9ca3af';
    }
  };

  return (
    <div className={`glass-panel w-full rounded-lg relative overflow-hidden bg-black/40 select-none ${heightClass}`}
         onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      
      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-sm font-bold text-white tracking-widest">INTELLIGENCE GRAPH</h3>
        <p className="text-[10px] text-gray-400 font-mono">INTERACTIVE TOPOLOGY MAP</p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
         <button onClick={() => setFilter('ALL')} className={`px-2 py-1 text-[10px] font-bold rounded border ${filter === 'ALL' ? 'bg-sophon-accent text-black border-sophon-accent' : 'bg-black/50 text-gray-400 border-gray-700'}`}>ALL INTEL</button>
         <button onClick={() => setFilter('THREATS')} className={`px-2 py-1 text-[10px] font-bold rounded border ${filter === 'THREATS' ? 'bg-sophon-danger text-black border-sophon-danger' : 'bg-black/50 text-gray-400 border-gray-700'}`}>THREATS</button>
         <button onClick={() => setFilter('VERIFIED')} className={`px-2 py-1 text-[10px] font-bold rounded border ${filter === 'VERIFIED' ? 'bg-sophon-success text-black border-sophon-success' : 'bg-black/50 text-gray-400 border-gray-700'}`}>VERIFIED</button>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-move" viewBox="0 0 800 600">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="25" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="rgba(255,255,255,0.1)" />
          </marker>
        </defs>
        {links.map((link, i) => {
           const s = nodes.find(n => n.id === link.source);
           const t = nodes.find(n => n.id === link.target);
           if (!s || !t) return null;
           return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" markerEnd="url(#arrow)" />;
        })}
        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x},${node.y})`}
             onMouseDown={(e) => handleMouseDown(e, node)}
             onClick={(e) => { e.stopPropagation(); if(node.type === 'REPORT') setSelectedNode(node); }}
             onMouseEnter={() => setHoveredNode(node)}
             onMouseLeave={() => setHoveredNode(null)}
             className="cursor-pointer transition-opacity duration-300"
             style={{ opacity: hoveredNode && hoveredNode.id !== node.id && !links.some(l => (l.source === node.id && l.target === hoveredNode.id) || (l.target === node.id && l.source === hoveredNode.id)) ? 0.2 : 1 }}
          >
            {node.type === 'THEME' && <circle r={node.radius + 8} fill="rgba(255,255,255,0.02)" className="animate-pulse" />}
            <circle r={node.radius} fill={getNodeColor(node)} stroke="rgba(0,0,0,0.8)" strokeWidth="2" />
            {(node.type === 'THEME' || hoveredNode?.id === node.id) && (
              <text dy={node.radius + 15} textAnchor="middle" className="text-[10px] font-mono fill-white font-bold bg-black shadow-black drop-shadow-md pointer-events-none">{node.label}</text>
            )}
          </g>
        ))}
      </svg>

      {/* INTELLIGENCE DOSSIER MODAL */}
      {selectedNode && selectedNode.reportData && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 p-6 flex flex-col animate-fadeIn">
              <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
                  <div>
                      <h2 className="text-xl font-bold text-white leading-tight">{selectedNode.reportData.topic}</h2>
                      <div className="flex gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              selectedNode.verdict === VerdictType.VERIFIED ? 'bg-sophon-success text-black' : 
                              selectedNode.verdict === VerdictType.FALSE ? 'bg-sophon-danger text-white' : 
                              'bg-sophon-warning text-black'
                          }`}>{selectedNode.verdict}</span>
                          <span className="text-gray-500 font-mono text-[10px]">CONFIDENCE: {selectedNode.reportData.confidenceScore}%</span>
                      </div>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2">
                  <div className="mb-4">
                      <p className="text-[10px] text-gray-500 uppercase font-mono mb-1">CLAIM</p>
                      <p className="text-sm text-gray-300 italic border-l-2 border-gray-700 pl-3">"{selectedNode.reportData.claim}"</p>
                  </div>
                  <div className="mb-4">
                      <p className="text-[10px] text-gray-500 uppercase font-mono mb-1">ANALYSIS SUMMARY</p>
                      <p className="text-sm text-gray-200 leading-relaxed">{selectedNode.reportData.summary}</p>
                  </div>
                   {selectedNode.reportData.keyEvidence && selectedNode.reportData.keyEvidence.length > 0 && (
                     <div className="mb-4">
                         <p className="text-[10px] text-gray-500 uppercase font-mono mb-1">KEY EVIDENCE</p>
                         <ul className="space-y-1">
                             {selectedNode.reportData.keyEvidence.map((ev, i) => (
                                 <li key={i} className={`text-xs flex gap-2 ${ev.type === 'SUPPORTING' ? 'text-green-400' : 'text-red-400'}`}>
                                     <span>{ev.type === 'SUPPORTING' ? '+' : '-'}</span>
                                     <span>{ev.point}</span>
                                 </li>
                             ))}
                         </ul>
                     </div>
                   )}
              </div>
              
              <div className="pt-4 mt-auto border-t border-white/10">
                  <p className="text-[10px] text-gray-500 mb-2">PRIMARY SOURCE</p>
                  {selectedNode.reportData.sources.length > 0 ? (
                      <a href={selectedNode.reportData.sources[0].url} target="_blank" rel="noreferrer" className="block w-full text-center py-2 bg-sophon-accent/10 border border-sophon-accent text-sophon-accent font-bold text-xs rounded hover:bg-sophon-accent/20 transition-colors">
                          ACCESS SOURCE DATA
                      </a>
                  ) : (
                      <div className="text-gray-600 text-xs italic">Source classified or unavailable</div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { Report, VerdictType } from '../types';

interface HolographicGlobeProps {
  reports: Report[];
  highContrast?: boolean;
}

interface Point {
  x: number;
  y: number;
  z: number;
  baseColor: string;
  activeColor: string;
  region: 'AMERICAS' | 'EMEA' | 'APAC';
}

export const HolographicGlobe: React.FC<HolographicGlobeProps> = ({ reports, highContrast }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Analyze threats by region to color the globe
  const getThreatLevel = (region: string) => {
    const regionalReports = reports.filter(r => {
        const text = (r.topic + r.tags.join(' ')).toUpperCase();
        if (region === 'AMERICAS') return text.includes('USA') || text.includes('BRAZIL') || text.includes('CANADA');
        if (region === 'EMEA') return text.includes('UK') || text.includes('FRANCE') || text.includes('RUSSIA') || text.includes('ISRAEL') || text.includes('AFRICA');
        if (region === 'APAC') return text.includes('CHINA') || text.includes('INDIA') || text.includes('JAPAN') || text.includes('AUSTRALIA');
        return false;
    });
    
    const threats = regionalReports.filter(r => r.verdict === VerdictType.FALSE || r.verdict === VerdictType.MISLEADING).length;
    return threats > 0 ? 'CRITICAL' : 'SAFE';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const GLOBE_RADIUS = 120;
    const DOT_COUNT = 400;
    const ROTATION_SPEED = 0.005;

    // Generate Points on Sphere
    const points: Point[] = [];
    for (let i = 0; i < DOT_COUNT; i++) {
        // Golden Angle distribution for even sphere coverage
        const theta = Math.acos(1 - 2 * (i + 0.5) / DOT_COUNT);
        const phi = Math.PI * (1 + Math.sqrt(5)) * i;

        const x = GLOBE_RADIUS * Math.sin(theta) * Math.cos(phi);
        const y = GLOBE_RADIUS * Math.sin(theta) * Math.sin(phi);
        const z = GLOBE_RADIUS * Math.cos(theta);

        // Rough Mapping to Regions based on Cartesian coordinates
        let region: Point['region'] = 'EMEA';
        if (x < -40) region = 'AMERICAS';
        else if (x > 40) region = 'APAC';

        points.push({ 
            x, y, z, 
            region, 
            baseColor: highContrast ? '#888' : '#00f0ff',
            activeColor: highContrast ? '#000' : '#ff003c'
        });
    }

    let angle = 0;
    let animationId: number;

    const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Current Threat Status
        const status = {
            'AMERICAS': getThreatLevel('AMERICAS'),
            'EMEA': getThreatLevel('EMEA'),
            'APAC': getThreatLevel('APAC'),
        };

        // Sort by Z depth so front dots draw on top of back dots
        points.sort((a, b) => {
            const zA = a.z * Math.cos(angle) - a.x * Math.sin(angle);
            const zB = b.z * Math.cos(angle) - b.x * Math.sin(angle);
            return zA - zB;
        });

        points.forEach(p => {
            // Rotate around Y axis
            const rotX = p.x * Math.cos(angle) - p.z * Math.sin(angle);
            const rotZ = p.x * Math.sin(angle) + p.z * Math.cos(angle);
            
            // Perspective scale
            const scale = 250 / (250 - rotZ);
            const x2d = cx + rotX * scale;
            const y2d = cy + p.y * scale;

            // Draw Connection Lines (Optimization: only to nearest neighbors is expensive, so just random flicker lines)
            if (Math.random() > 0.98) {
                ctx.beginPath();
                ctx.moveTo(cx, cy); // Beam from center
                ctx.lineTo(x2d, y2d);
                ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
                ctx.stroke();
            }

            // Draw Dot
            const alpha = (rotZ + GLOBE_RADIUS) / (2 * GLOBE_RADIUS); // Fade back dots
            const isThreat = status[p.region] === 'CRITICAL';
            
            ctx.beginPath();
            ctx.arc(x2d, y2d, scale * (isThreat ? 2.5 : 1.5), 0, Math.PI * 2);
            
            if (isThreat) {
                ctx.fillStyle = highContrast ? `rgba(0,0,0,${alpha})` : `rgba(255, 0, 60, ${alpha})`;
                // Pulse effect
                if (Math.random() > 0.9) {
                    ctx.fillStyle = '#fff';
                }
            } else {
                ctx.fillStyle = highContrast ? `rgba(100,100,100,${alpha})` : `rgba(0, 240, 255, ${alpha * 0.5})`;
            }
            
            ctx.fill();
        });

        angle += ROTATION_SPEED;
        animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [reports, highContrast]);

  return (
    <div className={`relative w-full h-[300px] flex items-center justify-center overflow-hidden rounded-lg border-2 ${highContrast ? 'bg-white border-black' : 'bg-[#020202] border-sophon-accent/20'}`}>
        <div className="absolute top-4 left-4 z-10">
            <h3 className={`text-xs font-bold font-mono tracking-widest ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>
                GLOBAL THREAT HOLOGRAPH
            </h3>
            <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${highContrast ? 'bg-black' : 'bg-sophon-danger animate-pulse'}`}></span>
                    <span className="text-[9px] text-gray-500 font-mono">ACTIVE THREAT</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${highContrast ? 'bg-gray-400' : 'bg-sophon-accent opacity-50'}`}></span>
                    <span className="text-[9px] text-gray-500 font-mono">SECURE NODE</span>
                </div>
            </div>
        </div>
        
        {/* Decorative Ring */}
        <div className={`absolute w-[260px] h-[260px] rounded-full border border-dashed animate-[spin_20s_linear_infinite] ${highContrast ? 'border-gray-300' : 'border-sophon-accent/10'}`}></div>
        
        <canvas ref={canvasRef} width={600} height={400} className="w-full h-full" />
    </div>
  );
};


import React from 'react';
import { EvolutionStage } from '../types';

interface EvolutionVisualizerProps {
  stages: EvolutionStage[];
  highContrast?: boolean;
}

export const EvolutionVisualizer: React.FC<EvolutionVisualizerProps> = ({ stages, highContrast }) => {
  if (!stages || stages.length === 0) return null;

  return (
    <div className={`mt-4 p-4 rounded border-2 border-dashed ${highContrast ? 'border-black bg-gray-50' : 'border-gray-700 bg-black/20'}`}>
      <h4 className={`text-xs font-bold font-mono mb-4 tracking-widest ${highContrast ? 'text-black' : 'text-gray-400'}`}>
        VIRAL PHYLOGENY // MUTATION TRACKER
      </h4>
      
      <div className="relative">
        {/* Vertical Line */}
        <div className={`absolute left-[19px] top-2 bottom-4 w-0.5 ${highContrast ? 'bg-black' : 'bg-gray-800'}`}></div>

        <div className="space-y-6">
          {stages.map((stage, idx) => {
            const isOrigin = idx === 0;
            const distortionLevel = stage.distortionScore > 70 ? 'HIGH' : stage.distortionScore > 40 ? 'MED' : 'LOW';
            const dotColor = isOrigin 
                ? highContrast ? 'bg-black' : 'bg-blue-500' 
                : stage.distortionScore > 60 
                    ? highContrast ? 'bg-black' : 'bg-sophon-danger' 
                    : highContrast ? 'bg-gray-500' : 'bg-sophon-warning';

            return (
              <div key={idx} className="relative flex gap-4 animate-fadeIn" style={{ animationDelay: `${idx * 150}ms` }}>
                
                {/* Dot */}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 ${highContrast ? 'border-white bg-black text-white' : 'border-[#050505] bg-gray-900'}`}>
                   <div className={`w-3 h-3 rounded-full ${dotColor} ${!highContrast && !isOrigin ? 'animate-pulse' : ''}`}></div>
                </div>

                {/* Card */}
                <div className={`flex-1 p-3 rounded border ${highContrast ? 'bg-white border-black' : 'bg-black/40 border-gray-800'}`}>
                   <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${highContrast ? 'bg-black text-white' : 'bg-gray-800 text-gray-300'}`}>
                              {stage.platform.toUpperCase()}
                          </span>
                          <span className="text-[9px] font-mono text-gray-500">{stage.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-1">
                          <span className="text-[8px] uppercase text-gray-500">Distortion</span>
                          <div className={`h-1 w-8 rounded ${highContrast ? 'bg-gray-300' : 'bg-gray-800'}`}>
                              <div 
                                className={`h-full rounded ${highContrast ? 'bg-black' : stage.distortionScore > 60 ? 'bg-sophon-danger' : 'bg-sophon-warning'}`} 
                                style={{ width: `${stage.distortionScore}%` }}
                              ></div>
                          </div>
                      </div>
                   </div>
                   
                   <p className={`text-xs italic ${highContrast ? 'text-black' : 'text-gray-300'}`}>"{stage.variant}"</p>
                   
                   {isOrigin && (
                       <div className={`mt-2 text-[9px] uppercase font-bold ${highContrast ? 'text-black' : 'text-blue-400'}`}>
                           /// PATIENT ZERO DETECTED
                       </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

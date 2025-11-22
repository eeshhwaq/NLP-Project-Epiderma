import React, { useState, useRef, useEffect } from 'react';
import { Detection } from '../types';

interface Props {
  imageSrc: string;
  detections: Detection[];
}

export const BoundingBoxOverlay: React.FC<Props> = ({ imageSrc, detections }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Colors for different types (cosmetic purely)
  const getColor = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('whitehead')) return 'border-yellow-400 bg-yellow-400/20 text-yellow-100';
    if (l.includes('blackhead')) return 'border-slate-800 bg-slate-800/20 text-slate-100';
    if (l.includes('pustule') || l.includes('papule')) return 'border-red-500 bg-red-500/20 text-red-100';
    if (l.includes('cyst')) return 'border-purple-500 bg-purple-500/20 text-purple-100';
    return 'border-brand-400 bg-brand-400/20 text-white';
  };

  return (
    <div className="relative inline-block rounded-lg overflow-hidden shadow-md group">
      <img 
        src={imageSrc} 
        alt="Analyzed Skin" 
        className="max-w-full h-auto max-h-[400px] object-contain block"
        onLoad={() => setImageLoaded(true)}
      />
      
      {imageLoaded && detections.map((det, idx) => {
        // Gemini 2.5 Flash typically returns 0-1000 normalized coordinates
        // [ymin, xmin, ymax, xmax]
        const [ymin, xmin, ymax, xmax] = det.bbox;
        
        const top = ymin / 10;
        const left = xmin / 10;
        const height = (ymax - ymin) / 10;
        const width = (xmax - xmin) / 10;

        const styleClass = getColor(det.label);

        return (
          <div
            key={idx}
            className={`absolute border-2 transition-opacity duration-300 hover:opacity-100 ${styleClass}`}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
          >
            <span className="absolute -top-6 left-0 bg-black/70 text-[10px] px-1.5 py-0.5 rounded text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {det.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
import React from 'react';
import { Sparkles } from 'lucide-react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3 select-none group cursor-default">
      <div className="relative w-12 h-12">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-brand-400/50 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Icon Container */}
        <div className="relative w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl shadow-lg flex items-center justify-center transform transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
          
          {/* Face-E Hybrid SVG */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
             {/* Bottom part of 'e' forming a jaw/smile */}
             <path d="M19 12H10C8 12 6.5 13.5 6.5 16C6.5 19 9 21 12.5 21C15.5 21 17.5 19.5 18 18" /> 
             {/* Top part of 'e' forming forehead */}
             <path d="M19 12C19 8 16 5 12 5C9 5 7 6.5 6.5 9" />
             {/* Eye */}
             <circle cx="12.5" cy="9.5" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        </div>
        
        {/* Decorative Sparkle */}
        <div className="absolute -top-2 -right-2 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 animate-pulse">
          <Sparkles size={16} fill="currentColor" />
        </div>
      </div>
      
      <div className="flex flex-col justify-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans leading-none">
          Epiderma
        </h1>
        <span className="text-[10px] font-bold text-brand-500 dark:text-brand-400 tracking-[0.25em] uppercase pl-0.5">AI Dermatologist</span>
      </div>
    </div>
  );
};
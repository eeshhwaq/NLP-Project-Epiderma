import React from 'react';
import { Message, Sender, AcneSeverity } from '../types';
import { Bot, User, Activity, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface Props {
  message: Message;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isBot = message.sender === Sender.Bot;

  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} animate-fade-in-up group`}>
      
      {/* Avatar for Bot */}
      {isBot && (
        <div className="flex-shrink-0 mr-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm">
            <Bot size={20} />
          </div>
        </div>
      )}

      <div className={`flex flex-col max-w-[90%] md:max-w-[80%] ${isBot ? 'items-start' : 'items-end'}`}>
        
        <div className={`relative p-5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
          isBot 
            ? 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800' 
            : 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-tr-none shadow-brand-500/20'
        }`}>
          
          {/* Text Content */}
          {message.isThinking ? (
            <div className="flex items-center gap-3 text-slate-500">
              <Activity className="animate-spin text-brand-500" size={18} />
              <span className="font-medium">Analyzing details...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap markdown-body">
              {message.text}
            </div>
          )}

          {/* Simple image preview in chat if it exists, but simpler now */}
          {message.image && (
             <div className="mt-3 rounded-lg overflow-hidden border border-white/20 max-w-[150px]">
                <img src={message.image} alt="Context" className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity" />
             </div>
          )}

          {/* Structured Analysis Result (Text only mainly, visuals are on left) */}
          {message.analysis && (
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700/50 space-y-3">
              <div className="flex items-center gap-2">
                 <div className={`h-2 w-2 rounded-full ${
                     message.analysis.severity === AcneSeverity.Severe ? 'bg-red-500' :
                     message.analysis.severity === AcneSeverity.Moderate ? 'bg-yellow-500' : 'bg-green-500'
                 }`} />
                 <span className="font-bold text-sm uppercase tracking-wide opacity-80">Severity: {message.analysis.severity}</span>
              </div>
              
              {message.analysis.treatment_suggestions && (
                  <div className="text-sm opacity-90 bg-black/5 dark:bg-white/5 p-3 rounded-lg">
                    <strong className="block mb-1 opacity-70 text-xs uppercase">Recommended approach</strong>
                    {message.analysis.treatment_suggestions}
                  </div>
              )}

              <div className="flex gap-2 text-[10px] opacity-60 items-center mt-2">
                 <AlertCircle size={12} />
                 {message.analysis.disclaimer}
              </div>
            </div>
          )}
        </div>
        <div className="text-[10px] text-slate-400 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>
    </div>
  );
};
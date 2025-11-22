import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Trash2, Moon, Sun, Image as ImageIcon, X, Upload, Scan, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Logo } from './frontend/components/Logo';
import { ChatMessage } from './frontend/components/ChatMessage';
import { BoundingBoxOverlay } from './frontend/components/BoundingBoxOverlay';
import { Message, Sender, AcneSeverity, AnalysisResult } from './types';
// import { analyzeSkinImage, chatWithRAG } from './services/geminiService';
import { analyzeImage, sendChat } from './services/apiService';

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  sender: Sender.Bot,
  text: "Welcome to Epiderma!\n\nI'm your AI dermatological assistant. Upload a picture to get an instant acne analysis and treatment suggestions.",
  timestamp: Date.now()
};

function base64ToFile(base64: string, filename: string) {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Split View State
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Sync active image/analysis from chat history
  useEffect(() => {
    // Find the last message with an image/analysis to display on the left
    const lastAnalysisMsg = [...messages].reverse().find(m => m.analysis && m.image);
    if (lastAnalysisMsg && lastAnalysisMsg.analysis) {
      setActiveImage(lastAnalysisMsg.image!);
      setActiveAnalysis(lastAnalysisMsg.analysis);
    } else {
        // If we cleared chat, reset (unless we want to keep the image up)
        if (messages.length === 1) {
             setActiveImage(null);
             setActiveAnalysis(null);
        }
    }
  }, [messages]);

  // Global Paste Handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) processFile(file);
          e.preventDefault();
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    alert("Image size too large. Please use an image under 5MB.");
    return;
  }

  setActiveFile(file); // store the file
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result as string;
    setActiveImage(base64); // still use base64 for preview
    setActiveAnalysis(null); // Reset analysis while loading
    triggerAnalysis(file); // send the File object instead
  };
  reader.readAsDataURL(file);
};


  const handleNewImageUpload = (base64Image: string) => {
    setActiveImage(base64Image);
    setActiveAnalysis(null); // Reset analysis while loading
    triggerAnalysis(base64Image);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
    }
  };
const triggerAnalysis = async (file: File) => {
  if (isLoading) return;

  const userMsgId = uuidv4();
  const userMsg: Message = {
      id: userMsgId,
      sender: Sender.User,
      text: "Analyze this image.",
      image: URL.createObjectURL(file), // for preview only
      timestamp: Date.now()
  };

  setMessages(prev => [...prev, userMsg]);
  setIsLoading(true);

  // Add temporary bot thinking message
  const loadingMsgId = uuidv4();
  setMessages(prev => [...prev, {
    id: loadingMsgId,
    sender: Sender.Bot,
    isThinking: true,
    timestamp: Date.now()
  }]);

  try {
      // Send the file directly
      const analysis = await analyzeImage(file); // send file instead of base64

      const a=1;
      const b=3;
      const c = `Based on the analysis of your skin condition, here are some treatment suggestions to help manage and improve your acne:

      1. **Cleansing Routine:** Use a gentle, non-comedogenic cleanser twice daily.
      2. **Topical Treatments:** Benzoyl peroxide or salicylic acid.
      3. **Moisturizing:** Use a lightweight, oil-free moisturizer.
      4. **Sun Protection:** SPF 30 daily.
      5. **Avoid Picking:** Refrain from picking or squeezing pimples.`;

      const responseText = `Analysis Complete.\n**Severity:** ${a}\n**Detected:** ${b} lesions.\n\n${c.substring(0, 150)}...`;

      setMessages(prev => prev.map(msg => {
          if (msg.id === loadingMsgId) {
              return {
                  ...msg,
                  isThinking: false,
                  text: responseText,
                  image: URL.createObjectURL(file),
                  analysis: analysis
              };
          }
          return msg;
      }));

      setActiveAnalysis(analysis);

  } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => {
          if (msg.id === loadingMsgId) {
              return { ...msg, isThinking: false, text: "I couldn't process that image. Please try a clearer photo." };
          }
          return msg;
      }));
  } finally {
      setIsLoading(false);
  }
};


  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = {
      id: uuidv4(),
      sender: Sender.User,
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    
    // RAG Chat
    const loadingMsgId = uuidv4();
    setMessages(prev => [...prev, { id: loadingMsgId, sender: Sender.Bot, isThinking: true, timestamp: Date.now() }]);

    try {
        // Convert history
        const historyForApi = messages.map(m => ({
            role: m.sender === Sender.User ? 'user' : 'model',
            parts: [{ text: m.text || (m.image ? 'Image uploaded' : '') }]
        }));
        
        // Add context from current analysis if available
        let contextPrompt = inputValue;
        if (activeAnalysis) {
            contextPrompt += `\n[Context: The user is asking about an image with ${activeAnalysis.severity} acne, containing ${activeAnalysis.detections.map(d => d.label).join(', ')}.]`;
        }

        const { reply } = await sendChat(contextPrompt);
        console.log(reply);
        
        setMessages(prev => prev.map(msg => {
            if (msg.id === loadingMsgId) {
                return { ...msg, isThinking: false, text: reply };
            }
            return msg;
        }));
    } catch (error) {
        setMessages(prev => prev.map(msg => {
            if (msg.id === loadingMsgId) return { ...msg, isThinking: false, text: "Connection error." };
            return msg;
        }));
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      
      {/* LEFT PANEL: Prominent Upload & Visualization */}
      <div 
        className={`md:w-1/2 relative flex flex-col transition-all duration-300 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 ${
            isDragOver 
            ? 'bg-brand-50 dark:bg-brand-900/30' 
            : 'bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Background Patterns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-100/50 dark:bg-brand-900/10 rounded-full blur-3xl"></div>
             <div className="absolute top-1/2 -right-24 w-64 h-64 bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-3xl"></div>
        </div>

        {/* Logo Area */}
        <div className="absolute top-8 left-8 z-20">
           <Logo />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
            
            {activeImage ? (
                <div className="relative w-full h-full max-w-2xl flex flex-col animate-fade-in-up">
                    {/* Analysis Status Header */}
                    <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${activeAnalysis ? 'bg-green-500' : 'bg-yellow-400 animate-pulse'}`}></div>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                {activeAnalysis ? 'Scan Complete' : 'Analyzing...'}
                            </span>
                         </div>
                         {activeAnalysis && (
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                activeAnalysis.severity === AcneSeverity.Severe ? 'bg-red-500 text-white' :
                                activeAnalysis.severity === AcneSeverity.Moderate ? 'bg-yellow-500 text-white' :
                                'bg-green-500 text-white'
                             }`}>
                                 {activeAnalysis.severity}
                             </span>
                         )}
                    </div>

                    {/* Main Image Area */}
                    <div className="relative flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center group">
                         {activeAnalysis ? (
                            <div className="relative w-full h-full bg-black/5 dark:bg-black/50 flex items-center justify-center p-4">
                                {/* <BoundingBoxOverlay imageSrc={activeImage} detections={activeAnalysis.detections} /> */}
                            </div>
                         ) : (
                             <div className="relative w-full h-full p-4 flex items-center justify-center">
                                <img src={activeImage} className="max-w-full max-h-full object-contain opacity-50 blur-md scale-105" alt="Processing" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                    <div className="w-20 h-20 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <span className="text-brand-600 dark:text-brand-400 font-medium animate-pulse">Detecting lesions...</span>
                                </div>
                             </div>
                         )}

                         {/* Hover actions */}
                         <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={() => { setActiveImage(null); setActiveAnalysis(null); }}
                                className="bg-white/90 dark:bg-slate-800/90 p-2.5 rounded-full shadow-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all transform hover:scale-110"
                             >
                                 <Trash2 size={20} />
                             </button>
                         </div>
                    </div>
                    
                    {/* Bottom Caption */}
                    {activeAnalysis && (
                        <div className="mt-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-white/20 text-center">
                             <p className="text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 text-sm">
                                <AlertCircle size={16} className="text-brand-500" />
                                Found {activeAnalysis.detections.length} areas of concern. Check the chat for treatment plan.
                             </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-lg text-center">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative cursor-pointer bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-12 shadow-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-300 hover:shadow-brand-500/20 hover:-translate-y-1"
                    >
                        <div className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl group-hover:bg-yellow-400/40 transition-colors"></div>
                        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-brand-500/20 rounded-full blur-xl group-hover:bg-brand-500/40 transition-colors"></div>

                        <div className="relative w-28 h-28 bg-brand-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-brand-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner">
                            <Upload size={48} strokeWidth={1.5} />
                        </div>
                        
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 font-sans tracking-tight">
                            Upload Photo
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 text-base leading-relaxed max-w-xs mx-auto">
                            Drag & drop your selfie here, or click to browse. <br/>
                            <span className="text-xs opacity-70 mt-2 block">Supports JPG, PNG (Max 5MB)</span>
                        </p>
                        
                        <button className="bg-brand-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-brand-500/30 group-hover:bg-brand-500 group-hover:shadow-brand-500/50 transition-all w-full max-w-[200px]">
                            Select File
                        </button>
                    </div>
                    
                    <div className="mt-10 flex items-center justify-center gap-6 text-slate-400">
                        <div className="flex flex-col items-center gap-2 group cursor-default">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:text-brand-500 transition-colors">
                                <ImageIcon size={18} />
                            </div>
                            <span className="text-[10px] font-bold tracking-wider uppercase">High Res</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                        <div className="flex flex-col items-center gap-2 group cursor-default">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:text-brand-500 transition-colors">
                                <Scan size={18} />
                            </div>
                            <span className="text-[10px] font-bold tracking-wider uppercase">AI Scan</span>
                        </div>
                         <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                        <div className="flex flex-col items-center gap-2 group cursor-default">
                             <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:text-brand-500 transition-colors">
                                <Sparkles size={18} />
                             </div>
                             <span className="text-[10px] font-bold tracking-wider uppercase">Instant</span>
                        </div>
                    </div>
                </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />
        </div>
      </div>

      {/* RIGHT PANEL: Chat */}
      <div className="md:w-1/2 flex flex-col bg-white dark:bg-slate-950 relative z-0 shadow-xl md:shadow-none">
        
        {/* Chat Header */}
        <div className="flex-none h-20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
           <div className="flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Treatment Assistant</h2>
              <span className="text-xs text-green-500 flex items-center gap-1 font-medium">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                 Online & Ready
              </span>
           </div>
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Toggle Theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={() => { setMessages([INITIAL_MESSAGE]); setActiveImage(null); setActiveAnalysis(null); }}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                title="Clear Chat"
              >
                <Trash2 size={18} />
              </button>
           </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
           {messages.map(msg => (
             <ChatMessage key={msg.id} message={msg} />
           ))}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-none p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
            <div className="relative flex items-end gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-3xl border border-slate-200 dark:border-slate-800 focus-within:border-brand-400 dark:focus-within:border-brand-600 focus-within:shadow-lg focus-within:shadow-brand-100/50 dark:focus-within:shadow-none transition-all duration-300">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-3.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all"
                  title="Attach Image"
                >
                  <Paperclip size={20} />
                </button>
                
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={activeAnalysis ? "Ask about the treatment suggestions..." : "Ask a question or paste an image..."}
                  className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none py-3.5 max-h-32 min-h-[52px] text-sm md:text-base"
                  rows={1}
                />

                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className={`p-3.5 rounded-2xl transition-all duration-300 transform ${
                    !inputValue.trim() || isLoading
                      ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                      : 'bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-500/20 hover:scale-105'
                  }`}
                >
                  {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                      <ArrowRight size={20} strokeWidth={2.5} />
                  )}
                </button>
            </div>
            <div className="text-center mt-3">
                <p className="text-[10px] text-slate-400 dark:text-slate-600">
                    Epiderma AI can make mistakes. Consult a doctor for medical advice.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
}

export default App;

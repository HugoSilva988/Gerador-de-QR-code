import React, { useState } from 'react';
import { InputSection } from './components/InputSection';
import { PreviewSection } from './components/PreviewSection';
import { QRSettings } from './types';
import { QrCode, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [settings, setSettings] = useState<QRSettings>({
    content: '',
    fgColor: '#000000',
    bgColor: '#ffffff',
    size: 256,
    includeMargin: true,
    level: 'Q',
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 flex flex-col">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <QrCode className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              QR <span className="text-indigo-400">Genio</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900 py-1.5 px-3 rounded-full border border-slate-800">
            <Zap size={14} className="text-yellow-500" />
            <span>Powered by Gemini 2.5 Flash</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-8rem)] min-h-[800px]">
            
            {/* Left Column: Input Controls */}
            <div className="lg:col-span-5 xl:col-span-4 h-full">
              <InputSection settings={settings} setSettings={setSettings} />
            </div>

            {/* Right Column: Preview */}
            <div className="lg:col-span-7 xl:col-span-8 h-full">
              <PreviewSection settings={settings} />
            </div>
            
          </div>
        </div>
      </main>

      {/* Footer for Mobile */}
      <footer className="border-t border-slate-800 py-6 mt-auto bg-slate-950 text-center md:hidden">
        <p className="text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} QR Genio. Criado com React & Gemini.
        </p>
      </footer>
    </div>
  );
};

export default App;
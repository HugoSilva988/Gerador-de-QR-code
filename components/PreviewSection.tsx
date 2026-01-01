
import React, { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QRSettings } from '../types';
import { Download, Share2, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';

interface PreviewSectionProps {
  settings: QRSettings;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({ settings }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Trigger animation when content changes
  useEffect(() => {
    if (settings.content) {
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [settings.content]);

  const handleDownload = (format: 'png' | 'jpeg') => {
    if (!settings.content) return;
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const image = canvas.toDataURL(`image/${format}`);
      const link = document.createElement('a');
      link.href = image;
      link.download = `qrcode-genio.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 shadow-xl backdrop-blur-sm flex flex-col items-center justify-center h-full min-h-[400px] relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        
        <div className="text-center relative">
          <h3 className="text-xl font-semibold text-white mb-2 flex items-center justify-center gap-2">
            Pré-visualização
            {isUpdating && <Sparkles size={16} className="text-indigo-400 animate-pulse" />}
          </h3>
          <p className="text-slate-400 text-xs">O seu QR Code é gerado em tempo real</p>
        </div>

        {/* QR Code Container */}
        <div 
          ref={qrRef}
          className={`bg-white p-4 rounded-2xl shadow-2xl shadow-black/50 transform transition-all duration-300 ${
            settings.content 
              ? `hover:scale-105 ${isUpdating ? 'animate-qr-update' : ''}` 
              : 'opacity-50'
          }`}
        >
          {settings.content ? (
            <QRCodeCanvas
              value={settings.content}
              size={settings.size}
              bgColor={settings.bgColor}
              fgColor={settings.fgColor}
              level={settings.level}
              includeMargin={settings.includeMargin}
              className="rounded-lg max-w-full h-auto"
              style={{ width: '100%', maxWidth: '256px', height: 'auto' }}
            />
          ) : (
            <div className="w-64 h-64 flex flex-col items-center justify-center bg-slate-100 rounded-lg text-slate-400 gap-2">
               <AlertTriangle size={48} className="opacity-20 text-orange-500" />
               <span className="text-sm font-medium">Preencha os campos obrigatórios</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex w-full gap-3">
          <button
            onClick={() => handleDownload('png')}
            disabled={!settings.content}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg shadow-indigo-900/20 transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
            <span>Baixar PNG</span>
          </button>
          
          <button
            onClick={() => handleDownload('jpeg')}
            disabled={!settings.content}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white p-3 rounded-xl transition-all duration-200 flex items-center justify-center"
            title="Baixar JPEG"
          >
            <span className="font-bold text-xs">JPG</span>
          </button>
        </div>
        
        <div className="text-center">
           <p className="text-[10px] text-slate-500 uppercase tracking-widest">Alta Resolução • Vetorial</p>
        </div>

      </div>
    </div>
  );
};

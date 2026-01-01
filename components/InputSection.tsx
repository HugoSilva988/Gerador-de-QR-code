
import React, { useState, useCallback, useEffect } from 'react';
import { QRSettings, QRMode } from '../types';
import { generateQRContent } from '../services/geminiService';
import { 
  Wand2, Type, Link, Wifi, Mail, Loader2, Palette, Settings2, 
  Eye, EyeOff, Lock, Network, Contact, Phone, Building, 
  Briefcase, Globe, AlertCircle, Instagram, Twitter, Linkedin, Share2
} from 'lucide-react';

interface InputSectionProps {
  settings: QRSettings;
  setSettings: React.Dispatch<React.SetStateAction<QRSettings>>;
}

export const InputSection: React.FC<InputSectionProps> = ({ settings, setSettings }) => {
  const [activeTab, setActiveTab] = useState<QRMode>(QRMode.TEXT);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandAI, setExpandAI] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Wi-Fi specific state
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);
  const [showWifiPass, setShowWifiPass] = useState(false);

  // vCard specific state
  const [vName, setVName] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vOrg, setVOrg] = useState('');
  const [vTitle, setVTitle] = useState('');
  const [vUrl, setVUrl] = useState('');

  // Email specific state
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');

  // Social specific state
  const [socialPlatform, setSocialPlatform] = useState<'instagram' | 'twitter' | 'linkedin'>('instagram');
  const [socialHandle, setSocialHandle] = useState('');

  const handleChange = (field: keyof QRSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Sync Wi-Fi
  useEffect(() => {
    if (activeTab === QRMode.WIFI) {
      if (!wifiSSID.trim()) {
        setSettings(prev => ({ ...prev, content: '' }));
        setErrors(prev => ({ ...prev, wifiSSID: "O nome da rede (SSID) é obrigatório." }));
        return;
      }
      setErrors(prev => {
        const { wifiSSID, ...rest } = prev;
        return rest;
      });
      const escape = (str: string) => str.replace(/([\\;:,])/g, '\\$1');
      const ssid = escape(wifiSSID);
      const pass = escape(wifiPassword);
      let wifiStr = `WIFI:T:${wifiEncryption};S:${ssid};`;
      if (wifiEncryption !== 'nopass') wifiStr += `P:${pass};`;
      wifiStr += `H:${wifiHidden ? 'true' : 'false'};;`;
      setSettings(prev => ({ ...prev, content: wifiStr }));
    }
  }, [wifiSSID, wifiPassword, wifiEncryption, wifiHidden, activeTab]);

  // Sync vCard
  useEffect(() => {
    if (activeTab === QRMode.VCARD) {
      if (!vName.trim()) {
        setSettings(prev => ({ ...prev, content: '' }));
        setErrors(prev => ({ ...prev, vName: "O nome é obrigatório." }));
        return;
      }
      setErrors(prev => {
        const { vName, ...rest } = prev;
        return rest;
      });
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${vName}`,
        `N:;${vName};;;`,
        vOrg ? `ORG:${vOrg}` : '',
        vTitle ? `TITLE:${vTitle}` : '',
        vPhone ? `TEL;TYPE=CELL:${vPhone}` : '',
        vEmail ? `EMAIL;TYPE=INTERNET:${vEmail}` : '',
        vUrl ? `URL:${vUrl}` : '',
        'END:VCARD'
      ].filter(Boolean).join('\n');
      setSettings(prev => ({ ...prev, content: vcard }));
    }
  }, [vName, vPhone, vEmail, vOrg, vTitle, vUrl, activeTab]);

  // Sync Email
  useEffect(() => {
    if (activeTab === QRMode.EMAIL) {
      if (!mailTo.trim()) {
        setSettings(prev => ({ ...prev, content: '' }));
        setErrors(prev => ({ ...prev, mailTo: "O destinatário é obrigatório." }));
        return;
      }
      setErrors(prev => {
        const { mailTo, ...rest } = prev;
        return rest;
      });
      const mailto = `mailto:${mailTo}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
      setSettings(prev => ({ ...prev, content: mailto }));
    }
  }, [mailTo, mailSubject, mailBody, activeTab]);

  // Sync Social
  useEffect(() => {
    if (activeTab === QRMode.SOCIAL) {
      if (!socialHandle.trim()) {
        setSettings(prev => ({ ...prev, content: '' }));
        setErrors(prev => ({ ...prev, socialHandle: "O usuário ou link é obrigatório." }));
        return;
      }
      setErrors(prev => {
        const { socialHandle, ...rest } = prev;
        return rest;
      });

      let url = socialHandle;
      if (!url.startsWith('http')) {
        if (socialPlatform === 'instagram') url = `https://instagram.com/${socialHandle.replace('@', '')}`;
        if (socialPlatform === 'twitter') url = `https://x.com/${socialHandle.replace('@', '')}`;
        if (socialPlatform === 'linkedin') url = `https://linkedin.com/in/${socialHandle}`;
      }
      setSettings(prev => ({ ...prev, content: url }));
    }
  }, [socialHandle, socialPlatform, activeTab]);

  const handleTabChange = (tabId: QRMode) => {
    setActiveTab(tabId);
    setErrors({});
  };

  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      let context = 'creative';
      if (activeTab === QRMode.WIFI) context = 'wifi';
      if (activeTab === QRMode.VCARD) context = 'business';
      if (activeTab === QRMode.EMAIL) context = 'email';
      if (activeTab === QRMode.SOCIAL) context = 'social';

      const result = await generateQRContent(aiPrompt, context);
      
      if (activeTab === QRMode.WIFI) {
        const parse = (key: string) => {
            const match = result.match(new RegExp(`${key}:([^;]*)(;|$)`));
            return match ? match[1].replace(/\\([\\;:,])/g, '$1') : '';
        };
        setWifiSSID(parse('S'));
        setWifiPassword(parse('P'));
        setWifiEncryption(parse('T') || 'WPA');
      } else if (activeTab === QRMode.VCARD) {
        const parseV = (key: string) => {
            const regex = new RegExp(`^${key}(?:;[^:]*)?:(.*)$`, 'mi');
            const match = result.match(regex);
            return match ? match[1].trim() : '';
        };
        setVName(parseV('FN'));
        setVOrg(parseV('ORG'));
        setVTitle(parseV('TITLE'));
        setVPhone(parseV('TEL'));
        setVEmail(parseV('EMAIL'));
        setVUrl(parseV('URL'));
      } else if (activeTab === QRMode.EMAIL) {
          const match = result.match(/mailto:([^?]*)\?subject=([^&]*)&body=(.*)/i);
          if (match) {
              setMailTo(match[1]);
              setMailSubject(decodeURIComponent(match[2]));
              setMailBody(decodeURIComponent(match[3]));
          } else {
              handleChange('content', result);
          }
      } else if (activeTab === QRMode.SOCIAL) {
          if (result.startsWith('http')) {
              setSocialHandle(result);
          } else {
              handleChange('content', result);
          }
      } else {
        handleChange('content', result);
      }
      setExpandAI(false);
      setAiPrompt('');
    } catch (error) {
      alert("Erro na conexão com a IA.");
    } finally {
      setIsGenerating(false);
    }
  }, [aiPrompt, activeTab, setSettings]);

  const tabs = [
    { id: QRMode.TEXT, icon: <Type size={18} />, label: 'Texto' },
    { id: QRMode.URL, icon: <Link size={18} />, label: 'Link' },
    { id: QRMode.VCARD, icon: <Contact size={18} />, label: 'vCard' },
    { id: QRMode.SOCIAL, icon: <Share2 size={18} />, label: 'Social' },
    { id: QRMode.WIFI, icon: <Wifi size={18} />, label: 'Wi-Fi' },
    { id: QRMode.EMAIL, icon: <Mail size={18} />, label: 'Email' },
  ];

  const ErrorLabel = ({ field }: { field: string }) => errors[field] ? (
    <span className="text-[10px] text-red-400 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
      <AlertCircle size={10} /> {errors[field]}
    </span>
  ) : null;

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 shadow-xl backdrop-blur-sm h-full flex flex-col gap-6">
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Configurar QR Code</h2>
        <p className="text-slate-400 text-sm">Crie seu QR inteligente em segundos.</p>
      </div>

      <div className="flex p-1 bg-slate-900/50 rounded-xl gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-grow flex flex-col gap-4 relative">
        
        {activeTab === QRMode.WIFI ? (
            <div className="flex flex-col gap-4 bg-slate-900/40 p-5 rounded-xl border border-slate-800 h-full overflow-y-auto">
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Network size={12}/> Nome da Rede <span className="text-red-500">*</span>
                        </label>
                        <ErrorLabel field="wifiSSID" />
                    </div>
                    <input 
                      type="text" 
                      value={wifiSSID} 
                      onChange={(e) => setWifiSSID(e.target.value)} 
                      placeholder="Ex: Wi-Fi da Sala" 
                      className={`w-full bg-slate-800 border ${errors.wifiSSID ? 'border-red-500/50 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'} rounded-lg px-3 py-2 text-white transition-all outline-none`} 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Segurança</label>
                        <select value={wifiEncryption} onChange={(e) => setWifiEncryption(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none">
                            <option value="WPA">WPA/WPA2</option>
                            <option value="WEP">WEP</option>
                            <option value="nopass">Aberta</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Oculta?</label>
                        <button onClick={() => setWifiHidden(!wifiHidden)} className={`w-full h-10 rounded-lg border flex items-center justify-center gap-2 transition-all ${wifiHidden ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                            <Wifi size={16} /> <span className="text-xs">{wifiHidden ? 'Sim' : 'Não'}</span>
                        </button>
                    </div>
                </div>
                {wifiEncryption !== 'nopass' && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Senha</label>
                        <div className="relative">
                            <input type={showWifiPass ? "text" : "password"} value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none pr-10" />
                            <button onClick={() => setShowWifiPass(!showWifiPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                {showWifiPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ) : activeTab === QRMode.VCARD ? (
            <div className="flex flex-col gap-3 bg-slate-900/40 p-5 rounded-xl border border-slate-800 h-full overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome <span className="text-red-500">*</span></label>
                            <ErrorLabel field="vName" />
                        </div>
                        <input type="text" value={vName} onChange={(e) => setVName(e.target.value)} className={`w-full bg-slate-800 border ${errors.vName ? 'border-red-500/50 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'} rounded-lg px-3 py-2 text-sm text-white outline-none`} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telefone</label>
                        <input type="text" value={vPhone} onChange={(e) => setVPhone(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                    <input type="email" value={vEmail} onChange={(e) => setVEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Empresa</label>
                        <input type="text" value={vOrg} onChange={(e) => setVOrg(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cargo</label>
                        <input type="text" value={vTitle} onChange={(e) => setVTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                    </div>
                </div>
            </div>
        ) : activeTab === QRMode.SOCIAL ? (
            <div className="flex flex-col gap-4 bg-slate-900/40 p-5 rounded-xl border border-slate-800 h-full overflow-y-auto">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Escolha a Rede</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => setSocialPlatform('instagram')}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${socialPlatform === 'instagram' ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                        >
                            <Instagram size={20} />
                            <span className="text-[9px] font-bold uppercase">Insta</span>
                        </button>
                        <button 
                            onClick={() => setSocialPlatform('twitter')}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${socialPlatform === 'twitter' ? 'bg-sky-600/20 border-sky-500 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                        >
                            <Twitter size={20} />
                            <span className="text-[9px] font-bold uppercase">X / Twitter</span>
                        </button>
                        <button 
                            onClick={() => setSocialPlatform('linkedin')}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${socialPlatform === 'linkedin' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                        >
                            <Linkedin size={20} />
                            <span className="text-[9px] font-bold uppercase">LinkedIn</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Usuário ou Link Completo <span className="text-red-500">*</span></label>
                        <ErrorLabel field="socialHandle" />
                    </div>
                    <input 
                      type="text" 
                      value={socialHandle} 
                      onChange={(e) => setSocialHandle(e.target.value)} 
                      placeholder={socialPlatform === 'instagram' ? "@usuario" : "Link ou usuário..."} 
                      className={`w-full bg-slate-800 border ${errors.socialHandle ? 'border-red-500/50' : 'border-slate-700'} rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    />
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 mt-2">
                    <p className="text-[9px] text-slate-500 font-medium">Use a IA para sugerir um link direto ou post criativo para esta rede.</p>
                </div>
            </div>
        ) : activeTab === QRMode.EMAIL ? (
            <div className="flex flex-col gap-4 bg-slate-900/40 p-5 rounded-xl border border-slate-800 h-full overflow-y-auto">
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Destinatário <span className="text-red-500">*</span></label>
                        <ErrorLabel field="mailTo" />
                    </div>
                    <input type="email" value={mailTo} onChange={(e) => setMailTo(e.target.value)} placeholder="exemplo@email.com" className={`w-full bg-slate-800 border ${errors.mailTo ? 'border-red-500/50 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'} rounded-lg px-3 py-2 text-white outline-none`} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assunto</label>
                    <input type="text" value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} placeholder="Assunto do email" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none" />
                </div>
                <div className="flex-grow space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mensagem</label>
                    <textarea value={mailBody} onChange={(e) => setMailBody(e.target.value)} placeholder="Escreva sua mensagem..." className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none resize-none" />
                </div>
            </div>
        ) : (
            <div className="h-full flex flex-col gap-1">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{activeTab === QRMode.URL ? 'URL' : 'Texto'} <span className="text-red-500">*</span></label>
                    <ErrorLabel field="content" />
                </div>
                <textarea
                    value={settings.content}
                    onChange={(e) => {
                      handleChange('content', e.target.value);
                      if (e.target.value.trim()) {
                        setErrors(prev => { const { content, ...rest } = prev; return rest; });
                      } else {
                        setErrors(prev => ({ ...prev, content: "Este campo é obrigatório." }));
                      }
                    }}
                    placeholder={activeTab === QRMode.URL ? "https://seusite.com" : "Digite seu texto..."}
                    className={`w-full h-full min-h-[200px] bg-slate-900/50 border ${errors.content ? 'border-red-500/50 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'} rounded-xl p-4 text-white outline-none resize-none`}
                />
            </div>
        )}

        <button onClick={() => setExpandAI(!expandAI)} className="absolute bottom-4 right-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 active:scale-95 text-white p-2.5 rounded-full shadow-lg transition-all z-10 flex items-center gap-2 group">
            <Wand2 size={20} className="group-hover:rotate-12 transition-transform" />
            {expandAI && <span className="pr-2 text-sm font-bold">Assistente IA</span>}
        </button>

        {expandAI && (
          <div className="absolute inset-x-0 bottom-16 bg-slate-800 border border-indigo-500/30 rounded-2xl p-4 shadow-2xl z-20 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={aiPrompt} 
                onChange={(e) => setAiPrompt(e.target.value)} 
                placeholder={activeTab === QRMode.SOCIAL ? "Sugira um post sobre inovação para o LinkedIn..." : "Peça para a IA preencher..."} 
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" 
                onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()} 
              />
              <button onClick={handleAIGenerate} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-lg text-white disabled:opacity-50">
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Palette size={10}/> Cores</span>
            <div className="flex justify-around items-center">
                <input type="color" value={settings.fgColor} onChange={(e) => handleChange('fgColor', e.target.value)} className="w-8 h-8 rounded-full border-none cursor-pointer bg-transparent" />
                <div className="w-[1px] h-6 bg-slate-700"></div>
                <input type="color" value={settings.bgColor} onChange={(e) => handleChange('bgColor', e.target.value)} className="w-8 h-8 rounded-full border-none cursor-pointer bg-transparent" />
            </div>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Settings2 size={10}/> Opções</span>
            <div className="flex justify-around items-center gap-2">
                <div className="flex items-center gap-1">
                    <input type="checkbox" checked={settings.includeMargin} onChange={(e) => handleChange('includeMargin', e.target.checked)} className="w-3 h-3 accent-indigo-500" />
                    <span className="text-[10px] text-slate-400">Margem</span>
                </div>
                <select value={settings.level} onChange={(e) => handleChange('level', e.target.value)} className="bg-transparent text-[10px] text-white outline-none">
                    <option value="L">L</option>
                    <option value="M">M</option>
                    <option value="Q">Q</option>
                    <option value="H">H</option>
                </select>
            </div>
        </div>
      </div>
    </div>
  );
};

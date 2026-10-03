import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Mic, Send, X, Volume2, Sparkles, User, Bot, VolumeX, GripHorizontal, RotateCcw } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { SpeechService } from '../services/speechService';
import { useLanguage } from '../context/LanguageContext';
import { useProfile } from '../context/ProfileContext';
import { useSiteText } from '../hooks/useSiteText';
import { useFloatingPanel, ResizeEdge } from '../hooks/useFloatingPanel';
import { ChatMessage, Scheme } from '../../../shared/types';

/** Renders **bold** segments from assistant replies without showing the asterisks */
const renderFormatted = (text: string) =>
  text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));

/** Thin invisible strips on the edges, larger squares on the corners */
const RESIZE_HANDLES: { edge: ResizeEdge; className: string }[] = [
  { edge: 'n', className: 'top-0 left-4 right-4 h-1.5 cursor-ns-resize' },
  { edge: 's', className: 'bottom-0 left-4 right-4 h-1.5 cursor-ns-resize' },
  { edge: 'w', className: 'left-0 top-4 bottom-4 w-1.5 cursor-ew-resize' },
  { edge: 'e', className: 'right-0 top-4 bottom-4 w-1.5 cursor-ew-resize' },
  { edge: 'nw', className: 'top-0 left-0 w-4 h-4 cursor-nwse-resize' },
  { edge: 'ne', className: 'top-0 right-0 w-4 h-4 cursor-nesw-resize' },
  { edge: 'sw', className: 'bottom-0 left-0 w-4 h-4 cursor-nesw-resize' },
  { edge: 'se', className: 'bottom-0 right-0 w-5 h-5 cursor-nwse-resize' }
];

interface VoiceChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScheme: (schemeId: string) => void;
}

export const VoiceChatWidget: React.FC<VoiceChatWidgetProps> = ({
  isOpen,
  onClose,
  onSelectScheme
}) => {
  const { currentLanguage, t } = useLanguage();
  const { profile, profileConfirmed } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: '', // greeting is rendered from translations so it follows the selected language
      language: currentLanguage.code,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const st = useSiteText();
  const panel = useFloatingPanel('chatPanel');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Follow-up chips for the most recent suggested scheme, then topic chips; already-asked questions are hidden
  const asked = new Set(messages.filter((m) => m.sender === 'user').map((m) => m.text));
  const latestScheme = [...messages].reverse().find((m) => m.sender === 'assistant' && m.suggestedSchemes?.length)?.suggestedSchemes?.[0];
  const schemeLabel = latestScheme ? latestScheme.shortTitle || latestScheme.name : '';
  const suggestionChips = [
    ...(latestScheme
      ? [
          { icon: '📝', text: st('chipHowApply', { name: schemeLabel }), followUp: true },
          { icon: '📁', text: st('chipDocs', { name: schemeLabel }), followUp: true },
          { icon: '✅', text: st('chipEligible', { name: schemeLabel }), followUp: true }
        ]
      : []),
    { icon: '🎓', text: st('chipStudents'), followUp: false },
    { icon: '🌾', text: st('chipFarmers'), followUp: false },
    { icon: '👩', text: st('chipWomen'), followUp: false },
    { icon: '👴', text: st('chipPension'), followUp: false },
    { icon: '💼', text: st('chipBusiness'), followUp: false },
    { icon: '🛠️', text: st('chipJobs'), followUp: false }
  ].filter((chip) => !asked.has(chip.text));

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      language: currentLanguage.code,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Earlier turns (minus the canned greeting) so the assistant remembers the conversation
    const history = messages
      .filter((m) => m.id !== 'msg-init')
      .map((m) => ({ sender: m.sender, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    const { assistantResponse, suggestedSchemes } = await ApiService.sendChatMessage(
      textToSend,
      currentLanguage.name,
      history,
      profileConfirmed ? profile : undefined
    );

    const assistantMsg: ChatMessage = {
      id: `asst-${Date.now()}`,
      sender: 'assistant',
      text: assistantResponse,
      language: currentLanguage.code,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedSchemes
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);

    // Speak the response when this device has a voice for the language; otherwise say so once
    setIsSpeaking(true);
    setVoiceNotice(null);
    SpeechService.speak(
      assistantResponse,
      currentLanguage.code,
      () => setIsSpeaking(false),
      () => setVoiceNotice(st('voiceUnavailable', { lang: currentLanguage.nativeName }))
    );
  };

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    setVoiceNotice(null);
    setIsListening(true);
    recognitionRef.current = SpeechService.startListening(
      currentLanguage.code,
      (transcript) => {
        setIsListening(false);
        setInputText(transcript);
        handleSendMessage(transcript);
      },
      (err) => {
        setIsListening(false);
        if (err === 'aborted') return;
        setVoiceNotice(err === 'not-allowed' || err === 'service-not-allowed' ? st('micBlocked') : st('micFailed'));
      }
    );
  };

  return (
    <div
      role="dialog"
      aria-label="GoodBridgeScheme AI Voice Assistant"
      style={panel.style}
      className={`fixed z-50 glass-card rounded-3xl border border-emerald-500/40 shadow-2xl flex flex-col overflow-hidden ${
        panel.isInteracting ? 'select-none' : 'animate-in fade-in slide-in-from-bottom-5'
      }`}
    >
      {/* Resize grips on every edge and corner (floating mode only) */}
      {panel.isFloating &&
        RESIZE_HANDLES.map(({ edge, className }) => (
          <div key={edge} onPointerDown={panel.startResize(edge)} className={`absolute z-10 touch-none ${className}`} aria-hidden="true" />
        ))}

      {/* Widget Header: drag to move; arrow keys move, Shift+arrows resize */}
      <div
        onPointerDown={panel.startDrag}
        onKeyDown={panel.onKeyDown}
        tabIndex={panel.isFloating ? 0 : -1}
        title={panel.isFloating ? 'Drag to move. Drag the edges or corners to resize.' : undefined}
        className={`bg-slate-900 text-white p-4 flex items-center justify-between touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
          panel.isFloating ? (panel.isInteracting ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm leading-none flex items-center gap-1.5">
              {panel.isFloating && <GripHorizontal className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />}
              <span className="truncate">GoodBridgeScheme AI Voice Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Active: {currentLanguage.flag} {currentLanguage.nativeName} ({currentLanguage.name})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isSpeaking && (
            <button
              onClick={() => {
                SpeechService.stop();
                setIsSpeaking(false);
              }}
              className="p-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center gap-1"
              title="Stop Speech"
            >
              <VolumeX className="w-3.5 h-3.5" /> Stop
            </button>
          )}
          {panel.isFloating && (
            <button
              onClick={panel.reset}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              title="Reset size and position"
              aria-label="Reset size and position"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Waveform Equalizer (When active) */}
      {(isListening || isSpeaking) && (
        <div className="bg-emerald-950/80 px-4 py-2 flex items-center justify-center gap-1.5 border-b border-emerald-800">
          <span className="text-xs text-emerald-300 font-extrabold mr-2">
            {isListening ? '🎙️ Listening to your voice...' : '🔊 Speaking response in regional voice...'}
          </span>
          <div className="w-1.5 bg-emerald-400 rounded-full animate-bar-1" />
          <div className="w-1.5 bg-emerald-400 rounded-full animate-bar-2" />
          <div className="w-1.5 bg-emerald-400 rounded-full animate-bar-3" />
          <div className="w-1.5 bg-emerald-400 rounded-full animate-bar-4" />
          <div className="w-1.5 bg-emerald-400 rounded-full animate-bar-5" />
        </div>
      )}

      {voiceNotice && (
        <div role="status" className="px-4 py-2 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-900 flex items-start justify-between gap-2">
          <span>{voiceNotice}</span>
          <button onClick={() => setVoiceNotice(null)} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-emerald-400 border border-slate-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] p-3.5 rounded-2xl text-xs space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{msg.id === 'msg-init' ? t('chatGreeting') : renderFormatted(msg.text)}</p>

              {/* Suggested Scheme Pills */}
              {msg.suggestedSchemes && msg.suggestedSchemes.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Matched Schemes:</span>
                  {msg.suggestedSchemes.map((s) => (
                    <button
                      key={s.schemeId}
                      onClick={() => onSelectScheme(s.schemeId)}
                      className="w-full text-left p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300"
                    >
                      <span className="truncate">{s.name}</span>
                      <span>💰 {s.financialBenefit}</span>
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[9px] opacity-70 block text-right font-mono">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
            <Sparkles className="w-4 h-4 animate-spin text-emerald-500" />
            <span>{t('chatThinking')}</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion chips: follow-ups for the latest suggested scheme, then topics (all in the chat language) */}
      <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto text-[11px] no-scrollbar">
        {suggestionChips.map((chip) => (
          <button
            key={chip.text}
            onClick={() => handleSendMessage(chip.text)}
            disabled={loading}
            className={`px-2.5 py-1 rounded-full border shrink-0 transition-colors disabled:opacity-50 ${
              chip.followUp
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            {chip.icon} {chip.text}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <button
          type="button"
          onClick={handleMicClick}
          className={`p-2.5 rounded-xl text-white transition-colors ${
            isListening ? 'bg-rose-600 animate-bounce' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
          title="Click to Speak"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('chatPlaceholder')}
          className="flex-1 text-xs p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <button
          type="submit"
          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

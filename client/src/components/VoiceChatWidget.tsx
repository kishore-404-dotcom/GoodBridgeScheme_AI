import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Mic, Send, X, Volume2, Sparkles, User, Bot, VolumeX } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { SpeechService } from '../services/speechService';
import { useLanguage } from '../context/LanguageContext';
import { useProfile } from '../context/ProfileContext';
import { ChatMessage, Scheme } from '../../../shared/types';

/** Renders **bold** segments from assistant replies without showing the asterisks */
const renderFormatted = (text: string) =>
  text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));

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
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    // Speak response automatically
    setIsSpeaking(true);
    SpeechService.speak(assistantResponse.replace(/[*#•]/g, ''), currentLanguage.code, () => setIsSpeaking(false));
  };

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    SpeechService.startListening(
      currentLanguage.code,
      (transcript) => {
        setIsListening(false);
        setInputText(transcript);
        handleSendMessage(transcript);
      },
      (err) => {
        setIsListening(false);
        console.warn('Voice error:', err);
      }
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md h-[550px] glass-card rounded-3xl border border-emerald-500/40 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
      {/* Widget Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-none flex items-center gap-1.5">
              <span>GoodBridgeScheme AI Voice Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Active: {currentLanguage.flag} {currentLanguage.nativeName} ({currentLanguage.name})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
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

      {/* Suggested Quick Prompt Pills */}
      <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto text-[11px] no-scrollbar">
        <button
          onClick={() => handleSendMessage('Schemes for female students scholarship')}
          className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shrink-0 hover:border-emerald-500"
        >
          🎓 Girl Scholarships
        </button>
        <button
          onClick={() => handleSendMessage('PM-KISAN farmer cash benefit')}
          className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shrink-0 hover:border-emerald-500"
        >
          🌾 PM-KISAN Cash
        </button>
        <button
          onClick={() => handleSendMessage('Low interest business loan for shopkeepers')}
          className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shrink-0 hover:border-emerald-500"
        >
          💼 MUDRA Business Loan
        </button>
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

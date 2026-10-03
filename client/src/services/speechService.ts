import { SUPPORTED_LANGUAGES } from '../utils/vernacularDictionary';
import { ApiService } from './apiService';

/**
 * Web Speech API Service
 * Handles SpeechRecognition (Voice Input) and SpeechSynthesis (Regional Audio Output).
 * Voice output only works when the device/browser has a voice for the language,
 * so callers can check hasVoice() and fall back to text.
 */
export class SpeechService {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static voices: SpeechSynthesisVoice[] = [];
  /** Server-generated speech currently playing (or being fetched) */
  private static audio: HTMLAudioElement | null = null;
  private static audioUrl: string | null = null;
  private static fetchAbort: AbortController | null = null;

  /** Voices load asynchronously in Chromium; cache them as soon as they are available */
  static {
    if (this.synth) {
      const load = () => {
        this.voices = this.synth?.getVoices() || [];
      };
      load();
      this.synth.addEventListener?.('voiceschanged', load);
    }
  }

  private static speechCode(langCode: string): string {
    return (SUPPORTED_LANGUAGES.find((l) => l.code === langCode) || SUPPORTED_LANGUAGES[0]).speechCode;
  }

  /** Best installed voice for the language: exact locale first, then same language; natural/online voices preferred */
  private static findVoice(langCode: string): SpeechSynthesisVoice | null {
    if (!this.voices.length && this.synth) this.voices = this.synth.getVoices();
    const code = this.speechCode(langCode).toLowerCase();
    const base = code.split('-')[0];
    const candidates = this.voices.filter((v) => v.lang.toLowerCase().replace('_', '-') === code);
    const pool = candidates.length ? candidates : this.voices.filter((v) => v.lang.toLowerCase().startsWith(`${base}-`) || v.lang.toLowerCase() === base);
    if (!pool.length) return null;
    return pool.find((v) => /natural|online|google/i.test(v.name)) || pool[0];
  }

  /** True when this device can read text aloud in the language */
  public static hasVoice(langCode: string): boolean {
    return !!this.synth && !!this.findVoice(langCode);
  }

  /**
   * Speaks text in the regional language voice. Uses an installed browser voice when there is one;
   * otherwise asks the server to generate speech (most browsers only have English/Hindi voices).
   * onFail is called if neither works, so callers can show a "text only" notice.
   */
  public static speak(text: string, langCode = 'hi', onEnd?: () => void, onFail?: () => void): boolean {
    this.stop();
    const clean = text.replace(/[*#_`[\]()•]/g, '');
    const voice = this.synth ? this.findVoice(langCode) : null;
    if (!this.synth || !voice) {
      this.speakFromServer(clean, langCode, onEnd, onFail);
      return true;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }
    this.synth.speak(utterance);
    return true;
  }

  private static async speakFromServer(text: string, langCode: string, onEnd?: () => void, onFail?: () => void) {
    const abort = new AbortController();
    this.fetchAbort = abort;
    const blob = await ApiService.textToSpeech(text, langCode, abort.signal);
    if (abort.signal.aborted) return; // stopped while loading
    this.fetchAbort = null;
    if (!blob) {
      onEnd?.();
      onFail?.();
      return;
    }
    this.audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(this.audioUrl);
    this.audio = audio;
    const finish = () => {
      if (this.audio === audio) this.releaseAudio();
      onEnd?.();
    };
    audio.onended = finish;
    audio.onerror = () => {
      finish();
      onFail?.();
    };
    audio.play().catch(() => {
      finish();
      onFail?.();
    });
  }

  private static releaseAudio() {
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
    }
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
    this.audio = null;
    this.audioUrl = null;
  }

  /** Stops browser speech, server audio, and any audio still being fetched */
  public static stop(): void {
    this.synth?.cancel();
    this.fetchAbort?.abort();
    this.fetchAbort = null;
    this.releaseAudio();
  }

  /**
   * Starts microphone voice recognition. Returns the recognition instance (call .stop() to end)
   * or null when the browser has no speech recognition.
   */
  public static startListening(
    langCode: string,
    onResult: (text: string) => void,
    onError: (err: string) => void
  ): { stop: () => void } | null {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError('unsupported');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = this.speechCode(langCode);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => onResult(event.results[0][0].transcript);
    recognition.onerror = (event: any) => onError(event.error || 'unknown');
    recognition.start();
    return recognition;
  }
}

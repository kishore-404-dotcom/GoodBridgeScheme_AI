import { SUPPORTED_LANGUAGES } from '../utils/vernacularDictionary';

/**
 * Web Speech API Service
 * Handles SpeechRecognition (Voice Input) and SpeechSynthesis (Regional Audio Output).
 * Voice output only works when the device/browser has a voice for the language,
 * so callers can check hasVoice() and fall back to text.
 */
export class SpeechService {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static voices: SpeechSynthesisVoice[] = [];

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
   * Speaks text in the regional language voice.
   * Returns false (and calls onEnd) when no voice for the language is installed,
   * instead of reading regional text with a mismatched English voice.
   */
  public static speak(text: string, langCode = 'hi', onEnd?: () => void): boolean {
    const voice = this.synth ? this.findVoice(langCode) : null;
    if (!this.synth || !voice) {
      onEnd?.();
      return false;
    }

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`[\]()]/g, ''));
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

  public static stop(): void {
    this.synth?.cancel();
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

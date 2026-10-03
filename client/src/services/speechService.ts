import { SUPPORTED_LANGUAGES } from '../utils/vernacularDictionary';
import { ApiService } from './apiService';

/**
 * Web Speech API Service
 * Handles SpeechRecognition (Voice Input) and SpeechSynthesis (Regional Audio Output).
 * Voice output only works when the device/browser has a voice for the language,
 * so callers can check hasVoice() and fall back to text.
 */
/** Recently generated server audio, reused when the same text is read again */
const audioCache = new Map<string, Blob>();
const AUDIO_CACHE_LIMIT = 40;
const rememberAudio = (key: string, blob: Blob) => {
  audioCache.set(key, blob);
  if (audioCache.size > AUDIO_CACHE_LIMIT) audioCache.delete(audioCache.keys().next().value as string);
};

const FIRST_CHUNK = 110;
const CHUNK = 220;
/** Splits text into speakable pieces at sentence ends (., !, ?, Indic danda), short first piece */
export const splitForSpeech = (text: string): string[] => {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?।॥])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    const limit = chunks.length === 0 ? FIRST_CHUNK : CHUNK;
    if (current && (current + ' ' + sentence).length > limit) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
    // A single very long sentence is cut at a comma or space
    while (current.length > (chunks.length === 0 ? FIRST_CHUNK : CHUNK) * 1.5) {
      const max = chunks.length === 0 ? FIRST_CHUNK : CHUNK;
      const cut = Math.max(current.lastIndexOf(',', max), current.lastIndexOf(' ', max));
      const at = cut > max / 2 ? cut + 1 : max;
      chunks.push(current.slice(0, at).trim());
      current = current.slice(at).trim();
    }
  }
  if (current) chunks.push(current);
  return chunks;
};

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

  /**
   * Server voice, chunked: generation time grows steeply with text length, so the text is split
   * into sentence-sized pieces. The first piece is kept short so audio starts quickly, and each
   * next piece is generated while the current one plays.
   */
  private static async speakFromServer(text: string, langCode: string, onEnd?: () => void, onFail?: () => void) {
    const abort = new AbortController();
    this.fetchAbort = abort;
    const chunks = splitForSpeech(text);
    const fetchChunk = (chunk: string): Promise<Blob | null> => {
      const cacheKey = `${langCode}|${chunk}`;
      const cached = audioCache.get(cacheKey);
      if (cached) return Promise.resolve(cached);
      const attempt = () => ApiService.textToSpeech(chunk, langCode, abort.signal);
      return attempt()
        .then((blob) => blob || (abort.signal.aborted ? null : attempt()))
        .then((blob) => {
          if (blob) rememberAudio(cacheKey, blob);
          return blob;
        });
    };

    // Each piece takes longer to generate than to play, so the next pieces are generated in parallel ahead of playback
    const LOOKAHEAD = 2;
    let played = 0;
    const pending: Promise<Blob | null>[] = [];
    const piece = (i: number) => (pending[i] ??= fetchChunk(chunks[i]));
    for (let i = 0; i < chunks.length; i++) {
      for (let j = i; j <= Math.min(i + LOOKAHEAD, chunks.length - 1); j++) piece(j);
      const blob = await piece(i);
      if (abort.signal.aborted) return; // stopped by the user or a newer request
      // A piece that still failed is skipped so the rest of the text is still read
      if (!blob) continue;
      const ok = await this.playBlob(blob, abort.signal);
      if (abort.signal.aborted) return;
      if (ok) played++;
    }
    if (played === 0) onFail?.();
    if (this.fetchAbort === abort) this.fetchAbort = null;
    onEnd?.();
  }

  /** Plays one audio blob; resolves true when it finished, false if it could not play */
  private static playBlob(blob: Blob, signal: AbortSignal): Promise<boolean> {
    return new Promise((resolve) => {
      this.releaseAudio();
      this.audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(this.audioUrl);
      this.audio = audio;
      const done = (ok: boolean) => {
        if (this.audio === audio) this.releaseAudio();
        resolve(ok);
      };
      signal.addEventListener('abort', () => done(false), { once: true });
      audio.onended = () => done(true);
      audio.onerror = () => done(false);
      audio.play().catch(() => done(false));
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

import crypto from 'crypto';
import { aiClient } from '../config/gemini';

/**
 * Server-side text-to-speech with Gemini, used when the citizen's browser has no voice
 * for their language (most browsers only ship English and Hindi voices).
 */
const TTS_MODELS = (process.env.GEMINI_TTS_MODELS || 'gemini-3.8-flash-tts,gemini-3.1-flash-tts-preview,gemini-2.5-flash-preview-tts')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
const VOICE = process.env.GEMINI_TTS_VOICE || 'Kore';
export const MAX_TTS_CHARS = 1500;
const CACHE_LIMIT = 60;

const cache = new Map<string, Buffer>();

/** Wraps raw 16-bit mono PCM (what most Gemini TTS models return) in a WAV header */
const pcmToWav = (pcm: Buffer, sampleRate: number): Buffer => {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

export class TtsService {
  public static isAvailable(): boolean {
    return !!aiClient;
  }

  /** Returns WAV audio for the text in the given language */
  public static async synthesize(text: string, languageName: string): Promise<Buffer> {
    if (!aiClient) throw new Error('Gemini is not configured');
    const clipped = text.slice(0, MAX_TTS_CHARS);
    const cacheKey = crypto.createHash('sha1').update(`${languageName}|${clipped}`).digest('hex');
    const hit = cache.get(cacheKey);
    if (hit) return hit;

    let lastErr: unknown;
    for (const model of TTS_MODELS) {
      try {
        const res = await aiClient.models.generateContent({
          model,
          contents: [{ parts: [{ text: `Read this aloud clearly and warmly in ${languageName}:\n\n${clipped}` }] }],
          config: {
            httpOptions: { timeout: 45000 },
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } }
          }
        });
        const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        if (!part?.inlineData?.data) throw new Error('No audio returned');

        const data = Buffer.from(part.inlineData.data, 'base64');
        const mime = (part.inlineData.mimeType || '').toLowerCase();
        const rate = Number(mime.match(/rate=(\d+)/)?.[1]) || 24000;
        const wav = mime.includes('wav') || data.subarray(0, 4).toString() === 'RIFF' ? data : pcmToWav(data, rate);

        cache.set(cacheKey, wav);
        if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
        return wav;
      } catch (err) {
        lastErr = err;
        console.warn(`TTS with ${model} failed:`, (err as Error).message.slice(0, 120));
      }
    }
    throw lastErr;
  }
}

import { SUPPORTED_LANGUAGES } from '../utils/vernacularDictionary';

/**
 * Web Speech API Service
 * Handles SpeechRecognition (Voice Input) and SpeechSynthesis (Regional Audio Output)
 */
export class SpeechService {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  /**
   * Speaks text in the specified regional language voice
   */
  public static speak(text: string, langCode = 'hi', onEnd?: () => void): void {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this browser environment.');
      if (onEnd) onEnd();
      return;
    }

    // Cancel ongoing speech
    this.synth.cancel();

    const cleanText = text.replace(/[*#_`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === langCode) || SUPPORTED_LANGUAGES[0];
    utterance.lang = langObj.speechCode;
    utterance.rate = 0.95; // Slightly clear and deliberate speed
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    this.synth.speak(utterance);
  }

  /**
   * Stop current speech
   */
  public static stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Starts microphone voice recognition
   */
  public static startListening(
    langCode: string,
    onResult: (text: string) => void,
    onError: (err: any) => void
  ): any {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Speech Recognition is not supported on this browser. Please use Chrome or Edge.');
      return null;
    }

    const recognition = new SpeechRecognition();
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === langCode) || SUPPORTED_LANGUAGES[0];
    recognition.lang = langObj.speechCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      onError(event.error);
    };

    recognition.start();
    return recognition;
  }
}

import { useState, useRef, useCallback } from 'react';

export type SupportedLanguage = 'en-IN' | 'hi-IN' | 'bn-IN' | 'ta-IN' | 'te-IN' | 'mr-IN' | 'gu-IN' | 'kn-IN' | 'ml-IN';

export const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml-IN', label: 'മലയാളം (Malayalam)' },
];

// Score voices for quality - prefer Google voices and female voices for clarity
function scoreVoice(voice: SpeechSynthesisVoice, targetLang: string): number {
  let score = 0;
  const langBase = targetLang.split('-')[0];
  
  // Exact language match
  if (voice.lang === targetLang) score += 100;
  else if (voice.lang.startsWith(langBase)) score += 50;
  else return 0; // No match at all
  
  // Prefer Google voices (much clearer for Indian languages)
  if (voice.name.toLowerCase().includes('google')) score += 80;
  
  // Prefer Microsoft voices (also good quality)
  if (voice.name.toLowerCase().includes('microsoft')) score += 60;
  
  // Prefer female voices for clarity (common naming patterns)
  const femalePrefixes = ['female', 'woman', 'swara', 'priya', 'ananya', 'lakshmi', 'meera', 'zira', 'heera'];
  if (femalePrefixes.some(p => voice.name.toLowerCase().includes(p))) score += 20;
  
  // Prefer non-default voices (usually better quality)
  if (!voice.default) score += 5;
  
  // Prefer local voices over remote (less latency)
  if (voice.localService) score += 10;
  
  return score;
}

function findBestVoice(voices: SpeechSynthesisVoice[], targetLang: string): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  
  const scored = voices
    .map(v => ({ voice: v, score: scoreVoice(v, targetLang) }))
    .filter(v => v.score > 0)
    .sort((a, b) => b.score - a.score);
  
  return scored.length > 0 ? scored[0].voice : null;
}

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>('en-IN');
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const shouldRestartRef = useRef(false);
  const onResultRef = useRef<((text: string) => void) | null>(null);
  const onErrorRef = useRef<((err: string) => void) | null>(null);

  const startListening = useCallback((onResult: (text: string) => void, onError?: (err: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError?.('Speech recognition not supported in this browser');
      return;
    }

    onResultRef.current = onResult;
    onErrorRef.current = onError || null;

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript;
        onResultRef.current?.(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      if (event.error === 'not-allowed') {
        onErrorRef.current?.('Microphone permission denied. Please allow microphone access in your browser settings.');
        shouldRestartRef.current = false;
        setIsListening(false);
        return;
      }
      onErrorRef.current?.(`Speech error: ${event.error}`);
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        try {
          recognition.start();
        } catch {
          shouldRestartRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach(t => t.stop());
        try {
          recognition.start();
          setIsListening(true);
        } catch (err: any) {
          onError?.(`Could not start: ${err.message}`);
        }
      })
      .catch((err) => {
        if (err.name === 'NotAllowedError') {
          onError?.('Microphone permission denied. Please allow access in browser settings.');
        } else if (err.name === 'NotFoundError') {
          onError?.('No microphone found on this device.');
        } else {
          onError?.(`Microphone error: ${err.message}`);
        }
      });
  }, [language]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch { /* already stopped */ }
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    
    // Strip markdown for cleaner speech
    const cleanText = text
      .replace(/[*_#`~\[\]()]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split long text into chunks for better quality (max ~200 chars per chunk)
    const chunks = splitTextForSpeech(cleanText);
    
    const speakChunks = (voices: SpeechSynthesisVoice[]) => {
      const bestVoice = findBestVoice(voices, language);
      
      let chunkIndex = 0;
      const speakNext = () => {
        if (chunkIndex >= chunks.length) {
          setIsSpeaking(false);
          return;
        }
        
        const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
        utterance.lang = language;
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
        
        if (chunkIndex === 0) {
          utterance.onstart = () => setIsSpeaking(true);
        }
        
        utterance.onend = () => {
          chunkIndex++;
          speakNext();
        };
        
        utterance.onerror = (e) => {
          // If a chunk fails, try the next one
          console.warn('TTS chunk error:', e);
          chunkIndex++;
          if (chunkIndex >= chunks.length) {
            setIsSpeaking(false);
          } else {
            speakNext();
          }
        };
        
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      };
      
      speakNext();
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speakChunks(window.speechSynthesis.getVoices());
      };
    } else {
      speakChunks(voices);
    }
  }, [language]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    language,
    setLanguage,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}

// Split text at sentence boundaries for better TTS quality
function splitTextForSpeech(text: string): string[] {
  const sentences = text.match(/[^.!?।]+[.!?।]*/g) || [text];
  const chunks: string[] = [];
  let current = '';
  
  for (const sentence of sentences) {
    if ((current + sentence).length > 200 && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  
  if (current.trim()) {
    chunks.push(current.trim());
  }
  
  return chunks.length > 0 ? chunks : [text];
}

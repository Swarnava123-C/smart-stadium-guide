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

    // Store callbacks in refs for stable access
    onResultRef.current = onResult;
    onErrorRef.current = onError || null;

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true; // Keep listening

    recognition.onresult = (event: any) => {
      // Get the latest result
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript;
        onResultRef.current?.(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Don't stop - just keep listening silently
        return;
      }
      if (event.error === 'aborted') {
        return; // User stopped
      }
      if (event.error === 'not-allowed') {
        onErrorRef.current?.('Microphone permission denied. Please allow microphone access in your browser settings.');
        shouldRestartRef.current = false;
        setIsListening(false);
        return;
      }
      onErrorRef.current?.(`Speech error: ${event.error}`);
    };

    recognition.onend = () => {
      // Auto-restart if we should still be listening
      if (shouldRestartRef.current) {
        try {
          recognition.start();
        } catch {
          // If restart fails, stop
          shouldRestartRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;

    // Request microphone first, then start recognition
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        // Got permission, release the stream (recognition uses its own)
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

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Try to find a voice matching the language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang === language) 
      || voices.find(v => v.lang.startsWith(language.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    
    // Voices may load async - wait a tick
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const v = window.speechSynthesis.getVoices();
        const match = v.find(voice => voice.lang === language) 
          || v.find(voice => voice.lang.startsWith(language.split('-')[0]));
        if (match) utterance.voice = match;
        window.speechSynthesis.speak(utterance);
      };
    } else {
      window.speechSynthesis.speak(utterance);
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

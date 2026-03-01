import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';

type RecognitionConstructor = new () => SpeechRecognition;
type WindowWithWebkit = Window & { webkitSpeechRecognition?: RecognitionConstructor };

export const useVoice = (onFinalTranscript?: (text: string) => void) => {
  const isListening = useStore((state) => state.isListening);
  const setListening = useStore((state) => state.setListening);
  const setTranscript = useStore((state) => state.setTranscript);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const continuousRef = useRef(false);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;

  const isSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in (window as WindowWithWebkit)
  );

  useEffect(() => {
    if (!isSupported) return;

    const w = window as WindowWithWebkit;
    const Recognition = (w.SpeechRecognition as RecognitionConstructor | undefined) ?? w.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      setTranscript(finalText || interimText);

      if (finalText && onFinalRef.current) {
        onFinalRef.current(finalText);
      }
    };

    recognition.onend = () => {
      // In continuous mode, auto-restart after getting a result
      if (continuousRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started or mic unavailable
          setListening(false);
          continuousRef.current = false;
        }
        return;
      }
      setListening(false);
    };

    recognition.onerror = (event: Event) => {
      // Don't stop for 'no-speech' in continuous mode — just let it restart
      if ((event as any).error === 'no-speech' && continuousRef.current) return;
      setListening(false);
      continuousRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      continuousRef.current = false;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [isSupported, setListening, setTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    setTranscript('');
    continuousRef.current = true;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      continuousRef.current = false;
    }
  }, [isListening, setListening, setTranscript]);

  const stopListening = useCallback(() => {
    continuousRef.current = false;
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
    setListening(false);
  }, [isListening, setListening]);

  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
  };
};

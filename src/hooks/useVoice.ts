import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';

type RecognitionConstructor = new () => SpeechRecognition;
type WindowWithWebkit = Window & { webkitSpeechRecognition?: RecognitionConstructor };

export const useVoice = () => {
  const isListening = useStore((state) => state.isListening);
  const setListening = useStore((state) => state.setListening);
  const setTranscript = useStore((state) => state.setTranscript);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join('');

      setTranscript(transcript);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [isSupported, setListening, setTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    setTranscript('');
    recognitionRef.current.start();
    setListening(true);
  }, [isListening, setListening, setTranscript]);

  const stopListening = useCallback(() => {
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

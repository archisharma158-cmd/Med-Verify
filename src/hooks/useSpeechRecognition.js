import { useState, useEffect, useRef, useCallback } from "react";
import { isSpeechRecognitionSupported, createSpeechRecognizer } from "../services/speechService";

export function useSpeechRecognition({ lang = "en-US", onFinalTranscript } = {}) {
  const [isSupported] = useState(() => isSpeechRecognitionSupported());
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const recognizerRef = useRef(null);

  const stopListening = useCallback(() => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {
        // Ignore stop error
      }
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    setError(null);
    setTranscript("");

    const recognizer = createSpeechRecognizer({
      lang,
      onResult: ({ finalText, interimText }) => {
        if (finalText) {
          setTranscript(finalText);
          if (onFinalTranscript) {
            onFinalTranscript(finalText);
          }
        } else if (interimText) {
          setTranscript(interimText);
        }
      },
      onError: (err) => {
        if (err === "no-speech") {
          setError("No speech detected. Please speak closer to your microphone.");
        } else if (err === "not-allowed" || err === "permission-denied") {
          setError("Microphone permission was denied. Please allow microphone access.");
        } else {
          setError(`Speech recognition error: ${err}`);
        }
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    if (recognizer) {
      try {
        recognizer.start();
        setIsListening(true);
        recognizerRef.current = recognizer;
      } catch (err) {
        setError("Could not start speech recognition: " + err.message);
        setIsListening(false);
      }
    }
  }, [isSupported, lang, onFinalTranscript]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
}

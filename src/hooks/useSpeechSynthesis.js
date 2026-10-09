import { useState, useEffect, useCallback } from "react";
import { isSpeechSynthesisSupported, speakUtterance, stopSpeaking } from "../services/speechService";

export function useSpeechSynthesis() {
  const [isSupported] = useState(() => isSpeechSynthesisSupported());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);

  const speak = useCallback(
    (text, { lang = "en-US", rate = 1.0 } = {}) => {
      if (!isSupported) {
        setError("Text-to-speech is not supported in this browser.");
        return;
      }

      setError(null);
      setIsSpeaking(true);

      speakUtterance(text, {
        lang,
        rate,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (err) => {
          setIsSpeaking(false);
          setError("Speech error: " + err);
        }
      });
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  return {
    isSupported,
    isSpeaking,
    error,
    speak,
    stop
  };
}

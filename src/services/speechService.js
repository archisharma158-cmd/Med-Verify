/**
 * Web Speech API Service
 * 
 * Provides robust capability detection and wrappers for:
 * 1. Speech-to-Text (STT) via Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 * 2. Text-to-Speech (TTS) via window.speechSynthesis
 */

export function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance);
}

export function createSpeechRecognizer({ lang = "en-US", onResult, onError, onEnd }) {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = lang;

  recognition.onresult = (event) => {
    let finalTranscript = "";
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (onResult) {
      onResult({
        finalText: finalTranscript.trim(),
        interimText: interimTranscript.trim()
      });
    }
  };

  recognition.onerror = (event) => {
    if (onError) {
      onError(event.error);
    }
  };

  recognition.onend = () => {
    if (onEnd) {
      onEnd();
    }
  };

  return recognition;
}

export function speakUtterance(text, { lang = "en-US", rate = 1.0, pitch = 1.0, onStart, onEnd, onError } = {}) {
  if (!isSpeechSynthesisSupported()) {
    if (onError) onError("Speech synthesis is not supported on this browser.");
    return;
  }

  // Cancel any ongoing utterance first
  window.speechSynthesis.cancel();

  // Strip emojis or heavy markdown symbols for cleaner speech
  const cleanText = text
    .replace(/[#*`_~]/g, "")
    .replace(/⚠️|•|✳|✚/g, "")
    .replace(/\n+/g, ". ");

  const utterance = new window.SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = pitch;

  // Try matching preferred voice if available
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

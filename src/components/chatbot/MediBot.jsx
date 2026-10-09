import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Globe,
  Sparkles,
  Info,
  LoaderCircle,
  Square
} from "lucide-react";
import ChatMessage from "./ChatMessage";
import {
  BOT_LANGUAGES,
  INITIAL_BOT_MESSAGES,
  SUGGESTED_QUESTIONS,
  getBotResponse
} from "../../services/chatbotService";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../../hooks/useSpeechSynthesis";

let messageIdCounter = 100;
function createMessageId(prefix) {
  messageIdCounter += 1;
  return `${prefix}-${messageIdCounter}`;
}

export default function MediBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [messages, setMessages] = useState(INITIAL_BOT_MESSAGES.en);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeechEnabled, setAutoSpeechEnabled] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState(null);

  const messagesEndRef = useRef(null);

  const handleVoiceFinalTranscript = useCallback((text) => {
    setInputText(text);
  }, []);

  // Speech Recognition (STT) Hook
  const {
    isSupported: isSttSupported,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    error: sttError
  } = useSpeechRecognition({
    lang: BOT_LANGUAGES[language].speechLang,
    onFinalTranscript: handleVoiceFinalTranscript
  });

  // Speech Synthesis (TTS) Hook
  const {
    isSupported: isTtsSupported,
    isSpeaking,
    speak,
    stop: stopSpeaking
  } = useSpeechSynthesis();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Switch initial message on language change if chat just opened
  const handleLanguageSwitch = (newLang) => {
    setLanguage(newLang);
    if (messages.length <= 1) {
      setMessages(INITIAL_BOT_MESSAGES[newLang]);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    if (isListening) {
      stopListening();
    }

    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg = {
      id: createMessageId("usr"),
      sender: "user",
      text,
      timestamp: timeString
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    resetTranscript();
    setIsLoading(true);

    try {
      const botReply = await getBotResponse(text, language);
      setMessages((prev) => [...prev, botReply]);

      if (autoSpeechEnabled && isTtsSupported) {
        setCurrentSpeakingId(botReply.id);
        speak(botReply.text, {
          lang: BOT_LANGUAGES[language].speechLang
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      const fallbackMsg = {
        id: createMessageId("err"),
        sender: "bot",
        text: "I encountered a processing error. Please try again or rephrase your question.",
        timestamp: timeString
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakMessage = (msgId, text) => {
    if (!isTtsSupported) return;

    if (isSpeaking && currentSpeakingId === msgId) {
      stopSpeaking();
      setCurrentSpeakingId(null);
    } else {
      setCurrentSpeakingId(msgId);
      speak(text, {
        lang: BOT_LANGUAGES[language].speechLang
      });
    }
  };

  const handleStopAllSpeech = () => {
    stopSpeaking();
    setCurrentSpeakingId(null);
  };

  const currentQuestions = SUGGESTED_QUESTIONS[language] || SUGGESTED_QUESTIONS.en;

  return (
    <>
      {/* Floating Circular Robot Toggle Button */}
      <button
        type="button"
        className={`mv-bot-launcher ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close MediBot assistant" : "Open MediBot medicine assistant"}
        title={isOpen ? "Close MediBot" : "Open MediBot Safety Assistant"}
      >
        {isOpen ? (
          <X size={26} />
        ) : (
          <div className="mv-robot-icon-wrap">
            <Bot size={28} />
            <span className="mv-bot-pulse-ring" />
          </div>
        )}
      </button>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <aside
          className="mv-bot-window"
          role="complementary"
          aria-label="MediBot Health Assistant"
        >
          {/* Header */}
          <div className="mv-bot-header">
            <div className="mv-bot-title-group">
              <div className="mv-bot-avatar-badge">
                <Bot size={20} />
              </div>
              <div>
                <div className="mv-bot-title-row">
                  <h4>MediBot</h4>
                  <span className="mv-bot-mode-pill">Packaging Literacy</span>
                </div>
                <div className="mv-bot-status-row">
                  <span className="mv-green-dot" />
                  <span>Interactive Safety Guide</span>
                </div>
              </div>
            </div>

            <div className="mv-bot-header-controls">
              {/* Language Switcher */}
              <div className="mv-bot-lang-toggle" title="Switch language">
                <Globe size={13} />
                <button
                  type="button"
                  className={language === "en" ? "active" : ""}
                  onClick={() => handleLanguageSwitch("en")}
                >
                  EN
                </button>
                <span>/</span>
                <button
                  type="button"
                  className={language === "hi" ? "active" : ""}
                  onClick={() => handleLanguageSwitch("hi")}
                >
                  हिन्दी
                </button>
              </div>

              {/* Stop Speaking Button if audio is actively playing */}
              {isSpeaking && (
                <button
                  type="button"
                  className="mv-bot-stop-audio-btn"
                  onClick={handleStopAllSpeech}
                  title="Stop speaking"
                  aria-label="Stop audio"
                >
                  <Square size={13} />
                  <span>Stop</span>
                </button>
              )}

              {/* Auto Speech Toggle */}
              {isTtsSupported && (
                <button
                  type="button"
                  className={`mv-bot-tts-toggle ${autoSpeechEnabled ? "active" : ""}`}
                  onClick={() => {
                    if (autoSpeechEnabled) handleStopAllSpeech();
                    setAutoSpeechEnabled(!autoSpeechEnabled);
                  }}
                  title={autoSpeechEnabled ? "Voice replies enabled" : "Mute voice replies"}
                  aria-label={autoSpeechEnabled ? "Mute replies" : "Enable voice replies"}
                >
                  {autoSpeechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                className="mv-bot-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat window"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="mv-bot-messages-container">
            {messages.map((item) => (
              <ChatMessage
                key={item.id}
                message={item}
                onSpeak={(text) => handleSpeakMessage(item.id, text)}
                isSpeakingThis={isSpeaking && currentSpeakingId === item.id}
              />
            ))}

            {isLoading && (
              <div className="mv-chat-message-row is-bot">
                <div className="mv-chat-avatar">
                  <Bot size={18} />
                </div>
                <div className="mv-chat-bubble-wrap">
                  <div className="mv-chat-bubble mv-chat-loading-bubble">
                    <LoaderCircle className="mv-spin" size={16} />
                    <span>MediBot is typing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div className="mv-bot-chips-bar">
            <span className="mv-chips-label">
              <Sparkles size={12} />
              {language === "hi" ? "सुझाए गए प्रश्न:" : "Suggested topics:"}
            </span>
            <div className="mv-chips-scroll">
              {currentQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="mv-chip-btn"
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Speech Error Notice if any */}
          {sttError && (
            <div className="mv-bot-speech-notice" role="alert">
              <span>{sttError}</span>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            className="mv-bot-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            {/* Microphone Button (Speech to Text) */}
            {isSttSupported ? (
              <button
                type="button"
                className={`mv-bot-mic-btn ${isListening ? "listening" : ""}`}
                onClick={isListening ? stopListening : startListening}
                aria-label={isListening ? "Stop listening" : "Speak your message"}
                title={isListening ? "Listening... click to stop" : "Speak message"}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            ) : (
              <span
                className="mv-bot-mic-disabled"
                title="Voice input not supported in this browser"
              >
                <MicOff size={16} />
              </span>
            )}

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                language === "hi"
                  ? isListening
                    ? "सुन रहा हूँ... बोलिए"
                    : "दवा पैकेजिंग से जुड़ा सवाल पूछें..."
                  : isListening
                  ? "Listening... speak now"
                  : "Ask about batch codes, expiry or packaging..."
              }
              aria-label="Ask MediBot a question"
              disabled={isLoading}
            />

            <button
              type="submit"
              className="mv-bot-send-btn"
              disabled={!inputText.trim() || isLoading}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>

          {/* Bottom Safety Guardrail Footer */}
          <div className="mv-bot-footer-guardrail">
            <Info size={12} />
            <span>
              {language === "hi"
                ? "स्थानीय डेमो गाइड · कोई चिकित्सा निदान या नुस्खा नहीं"
                : "Demo Assistant · General guidance only · No medical diagnosis"}
            </span>
          </div>
        </aside>
      )}
    </>
  );
}

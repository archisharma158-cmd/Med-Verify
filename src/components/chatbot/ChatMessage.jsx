import { Bot, User, Volume2, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function ChatMessage({ message, onSpeak, isSpeakingThis }) {
  const [copied, setCopied] = useState(false);
  const isBot = message.sender === "bot";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`mv-chat-message-row ${isBot ? "is-bot" : "is-user"}`}>
      <div className="mv-chat-avatar">
        {isBot ? <Bot size={18} /> : <User size={18} />}
      </div>

      <div className="mv-chat-bubble-wrap">
        <div className="mv-chat-bubble">
          <div className="mv-chat-text">{message.text}</div>

          <div className="mv-chat-meta">
            <span className="mv-chat-time">{message.timestamp}</span>

            {isBot && message.provider && message.provider !== "none" && (
              <span className="mv-chat-provider-badge">
                Powered by {message.provider === "openai" ? "OpenAI" : "Gemini"}
              </span>
            )}

            {isBot && onSpeak && (
              <button
                type="button"
                className={`mv-chat-bubble-action ${isSpeakingThis ? "speaking" : ""}`}
                onClick={() => onSpeak(message.text)}
                aria-label={isSpeakingThis ? "Speaking..." : "Read message aloud"}
                title="Read message aloud"
              >
                <Volume2 size={13} />
              </button>
            )}

            <button
              type="button"
              className="mv-chat-bubble-action"
              onClick={handleCopy}
              aria-label="Copy text"
              title="Copy message"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

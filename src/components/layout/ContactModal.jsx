import { useState } from "react";
import { X, Send, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

export default function ContactModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setName("");
    setEmail("");
    setMessage("");
    setError("");
    onClose();
  };

  return (
    <div className="mv-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
      <div className="mv-modal-dialog">
        <div className="mv-modal-header">
          <div className="mv-modal-title-group">
            <img src="/logo-icon.png" alt="Medify" className="mv-modal-logo-icon" />
            <h3 id="contact-modal-title">Contact Medify Project</h3>
          </div>
          <button
            type="button"
            className="mv-modal-close-btn"
            onClick={handleResetAndClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mv-modal-body">
          {submitted ? (
            <div className="mv-modal-success-state">
              <CheckCircle2 size={48} className="text-emerald" />
              <h4>Message Received</h4>
              <p>
                Thank you, <strong>{name}</strong>. Your feedback or inquiry regarding the Medify platform has been recorded locally for review.
              </p>
              <div className="mv-privacy-assurance">
                <small>Privacy Note: Medify does not store personal medical history or share user queries with advertising networks.</small>
              </div>
              <button
                type="button"
                className="mv-btn-primary mv-w-full"
                onClick={handleResetAndClose}
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mv-modal-form" noValidate>
              <p className="mv-modal-description">
                Have a question about packaging verification, regulatory API partnerships, or technical feedback? Send us a message below.
              </p>

              {error && (
                <div className="mv-alert-inline mv-alert-error" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="mv-form-field">
                <label htmlFor="contact-name">Your Full Name <span className="mv-required">*</span></label>
                <div className="mv-input-wrapper">
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith / Alex Sharma"
                    required
                  />
                </div>
              </div>

              <div className="mv-form-field">
                <label htmlFor="contact-email">Email Address <span className="mv-required">*</span></label>
                <div className="mv-input-wrapper">
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="mv-form-field">
                <label htmlFor="contact-category">Inquiry Topic</label>
                <div className="mv-input-wrapper">
                  <select
                    id="contact-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="general">General Inquiry & Questions</option>
                    <option value="bug">Report Scanner / OCR Issue</option>
                    <option value="partnership">Regulatory / Pharmacy API Partnership</option>
                    <option value="accessibility">Accessibility Feedback</option>
                  </select>
                </div>
              </div>

              <div className="mv-form-field">
                <label htmlFor="contact-msg">Message Details <span className="mv-required">*</span></label>
                <textarea
                  id="contact-msg"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry, feedback, or suggestion..."
                  required
                />
              </div>

              <div className="mv-modal-actions">
                <button type="submit" className="mv-btn-primary mv-w-full">
                  <Send size={16} />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

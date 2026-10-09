import { useState } from "react";
import { QrCode, Camera, Keyboard, ArrowRight, Shield, ShieldCheck, Home, History, FileText, User } from "lucide-react";

export default function Hero({ onStartVerification }) {
  const [phoneTab, setPhoneTab] = useState("scan");

  const handleCardClick = (tab) => {
    setPhoneTab(tab);
    if (onStartVerification) {
      onStartVerification(tab);
    }
    const scannerEl = document.getElementById("scanner");
    if (scannerEl) {
      scannerEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSimulateScan = () => {
    if (onStartVerification) {
      onStartVerification("scan");
    }
    const scannerEl = document.getElementById("scanner");
    if (scannerEl) {
      scannerEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="mv-hero-section" id="home" aria-label="MediFy Introduction">
      {/* Organic Background Ambience & Botanical Foliage */}
      <div className="mv-hero-backdrop">
        <div className="mv-leaf-decor mv-leaf-left" aria-hidden="true" />
        <div className="mv-leaf-decor mv-leaf-right" aria-hidden="true" />
        <div className="mv-hero-glow-radial" />
      </div>

      <div className="mv-container mv-hero-content-wrapper">
        {/* Left Column: Headlines & 3 Action Cards */}
        <div className="mv-hero-left">
          {/* Tag Pill */}
          <div className="mv-hero-badge">
            <span className="mv-badge-plus">+</span>
            <span className="mv-badge-text">SMART MEDICINE VERIFICATION</span>
          </div>

          {/* Main Headline */}
          <h1 className="mv-hero-heading">
            Check Your Medicine.<br />
            <span className="mv-heading-glow">Stay Safe.</span>
          </h1>

          {/* Subtitle */}
          <p className="mv-hero-subheading">
            Scan the QR code, barcode or take a photo to verify your medicine, check expiry date and get instant safety alerts.
          </p>

          {/* 3 Action Cards Row */}
          <div className="mv-action-cards-grid">
            {/* Card 1: Scan QR / Barcode */}
            <button
              type="button"
              className={`mv-action-card mv-card-scan ${phoneTab === "scan" ? "is-selected" : ""}`}
              onClick={() => handleCardClick("scan")}
            >
              <div className="mv-card-icon-box mv-icon-green">
                <QrCode size={24} />
              </div>
              <div className="mv-card-info">
                <h2 className="mv-card-title">Scan QR / Barcode</h2>
                <p className="mv-card-sub">Point your camera at the code</p>
              </div>
              <div className="mv-card-arrow-btn">
                <ArrowRight size={16} />
              </div>
            </button>

            {/* Card 2: Take a Photo (OCR) */}
            <button
              type="button"
              className={`mv-action-card mv-card-photo ${phoneTab === "photo" ? "is-selected" : ""}`}
              onClick={() => handleCardClick("photo")}
            >
              <div className="mv-card-icon-box mv-icon-blue">
                <Camera size={24} />
              </div>
              <div className="mv-card-info">
                <h2 className="mv-card-title">Take a Photo (OCR)</h2>
                <p className="mv-card-sub">Capture the medicine packaging</p>
              </div>
              <div className="mv-card-arrow-btn">
                <ArrowRight size={16} />
              </div>
            </button>

            {/* Card 3: Enter Details Manually */}
            <button
              type="button"
              className={`mv-action-card mv-card-manual ${phoneTab === "manual" ? "is-selected" : ""}`}
              onClick={() => handleCardClick("manual")}
            >
              <div className="mv-card-icon-box mv-icon-purple">
                <Keyboard size={24} />
              </div>
              <div className="mv-card-info">
                <h2 className="mv-card-title">Enter Details Manually</h2>
                <p className="mv-card-sub">Type name, batch or expiry date</p>
              </div>
              <div className="mv-card-arrow-btn">
                <ArrowRight size={16} />
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: 3D Smartphone Mockup + Medicine Box & Pills */}
        <div className="mv-hero-right">
          {/* Handwritten Annotation Callout */}
          <div className="mv-handwritten-note">
            <span className="mv-note-line">Scan</span>
            <span className="mv-note-line">Check</span>
            <span className="mv-note-line">Stay Safe</span>
            <svg className="mv-note-arrow" viewBox="0 0 70 50" fill="none">
              <path
                d="M10 10 C 25 35, 45 42, 60 40"
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M52 35 L62 40 L54 48"
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="mv-mockup-scene">
            {/* Realistic 3D Smartphone */}
            <div className="mv-phone-device">
              {/* Phone Speaker & Camera Notch */}
              <div className="mv-phone-notch">
                <span className="mv-phone-camera-lens" />
                <span className="mv-phone-speaker-slit" />
              </div>

              {/* Phone Screen Display */}
              <div className="mv-phone-screen">
                {/* Phone Status Bar */}
                <div className="mv-phone-status-bar">
                  <span className="time">9:41</span>
                  <div className="status-icons">
                    <span className="wifi">●●●</span>
                    <span className="battery">100%</span>
                  </div>
                </div>

                {/* Phone In-App Header */}
                <div className="mv-phone-app-header">
                  <div className="mv-app-brand">
                    <span className="plus-shield">+</span>
                    <span className="app-title">MediFy</span>
                  </div>
                </div>

                {/* Segmented Mode Selector Pills */}
                <div className="mv-phone-tabs">
                  <button
                    type="button"
                    className={`mv-phone-tab ${phoneTab === "scan" ? "active" : ""}`}
                    onClick={() => setPhoneTab("scan")}
                  >
                    Scan
                  </button>
                  <button
                    type="button"
                    className={`mv-phone-tab ${phoneTab === "photo" ? "active" : ""}`}
                    onClick={() => setPhoneTab("photo")}
                  >
                    Photo
                  </button>
                  <button
                    type="button"
                    className={`mv-phone-tab ${phoneTab === "manual" ? "active" : ""}`}
                    onClick={() => setPhoneTab("manual")}
                  >
                    Manual
                  </button>
                </div>

                {/* Camera Viewfinder Area */}
                <div className="mv-phone-viewfinder">
                  {/* Inside Camera Feed: Medicine Preview */}
                  <div className="mv-viewfinder-feed">
                    <div className="mv-feed-med-box">
                      <div className="med-box-label">
                        <strong>Paracetamol</strong>
                        <small>Tablets IP 500 mg</small>
                      </div>
                      <div className="med-box-qr">
                        {/* 2D QR Pattern */}
                        <div className="qr-simulated-grid" />
                      </div>
                      <span className="med-box-brand">ABC Pharma</span>
                    </div>

                    {/* Laser Scan Beam */}
                    <div className="mv-scan-laser-line" />

                    {/* Viewfinder Reticle Framing Corners */}
                    <div className="mv-reticle-corner top-left" />
                    <div className="mv-reticle-corner top-right" />
                    <div className="mv-reticle-corner bottom-left" />
                    <div className="mv-reticle-corner bottom-right" />
                  </div>

                  {/* Alignment Prompt */}
                  <p className="mv-reticle-instruction">
                    Align the QR / Barcode within the frame
                  </p>

                  {/* Shutter / Trigger Button */}
                  <div className="mv-phone-shutter-wrap">
                    <button
                      type="button"
                      className="mv-phone-shutter-btn"
                      onClick={handleSimulateScan}
                      title="Click to start verification"
                      aria-label="Start scanning"
                    >
                      <span className="shutter-inner" />
                    </button>
                  </div>
                </div>

                {/* Phone Bottom Navigation Bar */}
                <div className="mv-phone-bottom-nav">
                  <div className="nav-item active">
                    <Home size={16} />
                    <span>Home</span>
                  </div>
                  <div className="nav-item">
                    <History size={16} />
                    <span>History</span>
                  </div>
                  <div className="nav-item">
                    <FileText size={16} />
                    <span>Report</span>
                  </div>
                  <div className="nav-item">
                    <User size={16} />
                    <span>Profile</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Medicine Packaging Box & Blister Pack Alongside Phone */}
            <div className="mv-physical-medicine-cluster">
              {/* Paracetamol Medicine Carton */}
              <div className="mv-real-medicine-carton">
                <div className="carton-top-accent" />
                <div className="carton-body">
                  <div className="carton-brand">
                    <h3>Paracetamol</h3>
                    <p>Tablets IP 500 mg</p>
                  </div>
                  <div className="carton-barcode-strip">
                    <div className="barcode-bars" />
                    <span className="barcode-num">890123456789</span>
                  </div>
                  <div className="carton-footer">
                    <span>ABC Pharma</span>
                    <span>10 × 10 Tablets</span>
                  </div>
                </div>
              </div>

              {/* Realistic Blister Pack with White Round Tablets */}
              <div className="mv-real-blister-strip">
                <div className="blister-metallic-surface">
                  <div className="blister-pills-row">
                    <div className="blister-pill-pocket"><span className="white-pill" /></div>
                    <div className="blister-pill-pocket"><span className="white-pill" /></div>
                    <div className="blister-pill-pocket"><span className="white-pill" /></div>
                    <div className="blister-pill-pocket"><span className="white-pill" /></div>
                    <div className="blister-pill-pocket"><span className="white-pill" /></div>
                  </div>
                  <div className="blister-pills-row">
                    <div className="blister-pill-pocket"><span className="white-pill" /></div>
                    <div className="blister-pill-pocket"><span className="white-pill" /></div>
                    <div className="blister-pill-pocket"><span className="white-pill" /></div>
                    <div className="blister-pill-pocket"><span className="white-pill" /></div>
                    <div className="blister-pill-pocket"><span className="white-pill" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

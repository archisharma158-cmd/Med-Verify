import { ShieldCheck, ScanLine, ArrowRight, CheckCircle2, LockKeyhole, Sparkles, QrCode, Calendar, Layers, Eye } from "lucide-react";

export default function Hero({ onStartVerification }) {
  const scrollToSection = (e, id, tab = null) => {
    e.preventDefault();
    if (tab && onStartVerification) {
      onStartVerification(tab);
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="mv-hero-section" id="home" aria-label="Hero Introduction">
      <div className="mv-hero-bg-blobs">
        <div className="mv-blob mv-blob-1" />
        <div className="mv-blob mv-blob-2" />
      </div>

      <div className="mv-container mv-hero-grid">
        {/* Left Column: Copy & CTAs */}
        <div className="mv-hero-content">
          <div className="mv-hero-eyebrow">
            <span className="mv-eyebrow-icon">
              <ShieldCheck size={16} />
            </span>
            <span>VERIFIED PACKAGING INTELLIGENCE FOR PATIENT SAFETY</span>
          </div>

          <h1 className="mv-hero-title">
            Know your medicine.<br />
            <span className="text-emerald">Protect your health.</span>
          </h1>

          <p className="mv-hero-description">
            MedVerify helps patients, caregivers, and pharmacies inspect medicine packaging, read barcode serialization data, extract label typography with OCR, and identify crucial details that require confirmation with authorized health regulators.
          </p>

          <div className="mv-hero-actions-row">
            <a
              href="#scanner"
              className="mv-btn-primary mv-btn-hero"
              onClick={(e) => scrollToSection(e, "scanner", "scan")}
            >
              <ScanLine size={19} />
              <span>Verify a Medicine</span>
              <ArrowRight size={17} />
            </a>

            <a
              href="#how-it-works"
              className="mv-btn-secondary mv-btn-hero"
              onClick={(e) => scrollToSection(e, "how-it-works")}
            >
              <span>How It Works</span>
            </a>
          </div>

          {/* Verification Method Quick Jump Chips */}
          <div className="mv-hero-method-chips">
            <span className="mv-quick-label">Jump to method:</span>
            <button
              type="button"
              className="mv-quick-chip"
              onClick={(e) => scrollToSection(e, "scanner", "scan")}
            >
              <QrCode size={13} /> QR / Barcode
            </button>
            <button
              type="button"
              className="mv-quick-chip"
              onClick={(e) => scrollToSection(e, "scanner", "photo")}
            >
              <Sparkles size={13} /> Photo OCR
            </button>
            <button
              type="button"
              className="mv-quick-chip"
              onClick={(e) => scrollToSection(e, "scanner", "manual")}
            >
              <Layers size={13} /> Manual Entry
            </button>
          </div>

          {/* Trust Value Badges (No false claims) */}
          <div className="mv-hero-trust-bar">
            <div className="mv-trust-item">
              <CheckCircle2 size={16} />
              <span>Transparent Data Source Attribution</span>
            </div>
            <div className="mv-trust-item">
              <LockKeyhole size={16} />
              <span>Zero Personal Health Logging</span>
            </div>
            <div className="mv-trust-item">
              <ShieldCheck size={16} />
              <span>Strict Regulatory Disclaimers</span>
            </div>
          </div>
        </div>

        {/* Right Column: High-Tech Medicine Packaging Visual */}
        <div className="mv-hero-visual-col">
          <div className="mv-visual-card-wrap">
            {/* Ambient concentric radar rings */}
            <div className="mv-radar-ring mv-radar-outer" />
            <div className="mv-radar-ring mv-radar-inner" />

            {/* Interactive Medicine Packaging Mockup */}
            <div className="mv-package-mockup-card">
              <div className="mv-mockup-header">
                <div className="mv-rx-symbol">Rx</div>
                <div className="mv-mockup-title-wrap">
                  <span className="mv-mockup-brand">PARACETAMOL 650mg</span>
                  <small className="mv-mockup-subtitle">IP / ANALGESIC & ANTIPYRETIC TABLETS</small>
                </div>
                <span className="mv-mockup-shield">
                  <ShieldCheck size={18} />
                </span>
              </div>

              {/* Medicine Strip / Blister graphic */}
              <div className="mv-blister-illustration">
                <div className="mv-blister-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="mv-tablet-cell">
                      <div className="mv-tablet-pill" />
                    </div>
                  ))}
                </div>

                <div className="mv-packaging-details-strip">
                  <div className="mv-strip-row">
                    <span>B.No: <strong>DL6509B</strong></span>
                    <span>MFG: <strong>09/2024</strong></span>
                  </div>
                  <div className="mv-strip-row">
                    <span>EXP: <strong>08/2027</strong></span>
                    <span>MRP: <strong>₹32.50</strong></span>
                  </div>
                </div>

                {/* Simulated 2D DataMatrix barcode */}
                <div className="mv-mockup-datamatrix">
                  <div className="mv-datamatrix-pattern" />
                  <small>GS1 DATAMATRIX (01)0890123(10)DL6509B(17)270831</small>
                </div>
              </div>

              {/* Inspection Hotspots */}
              <div className="mv-hotspot-badge mv-hotspot-batch" title="Batch number inspection">
                <span className="mv-hotspot-pin" />
                <div>
                  <strong>Batch DL6509B</strong>
                  <small>Standard Alphanumeric Code</small>
                </div>
              </div>

              <div className="mv-hotspot-badge mv-hotspot-exp" title="Expiry date inspection">
                <Calendar size={14} />
                <div>
                  <strong>EXP 08/2027</strong>
                  <small>Shelf Life Active</small>
                </div>
              </div>
            </div>

            {/* Floating Live Verification Status Tag */}
            <div className="mv-floating-tag">
              <div className="mv-floating-icon">
                <Eye size={18} />
              </div>
              <div>
                <strong>Packaging Inspector</strong>
                <small>Structural format check · Demo Ready</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

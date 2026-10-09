import { QrCode, FileText, ShieldCheck, BarChart3, Database, Users, Heart, ArrowRight } from "lucide-react";

export default function HowItWorksSection({ onGoToScanner }) {
  const steps = [
    {
      num: 1,
      icon: <QrCode size={26} />,
      title: "Scan or Enter",
      desc: "Scan QR/barcode, take a photo or enter details manually.",
      mode: "scan"
    },
    {
      num: 2,
      icon: <FileText size={26} />,
      title: "Extract Information",
      desc: "We read key details like medicine name, batch, expiry etc.",
      mode: "photo"
    },
    {
      num: 3,
      icon: <ShieldCheck size={26} />,
      title: "Verify & Analyze",
      desc: "We check with trusted databases and look for alerts or duplicate scans.",
      mode: "manual"
    },
    {
      num: 4,
      icon: <BarChart3 size={26} />,
      title: "Get Result",
      desc: "See risk level (Low / Medium / High) with details and next steps.",
      mode: "scan"
    }
  ];

  const trustHighlights = [
    {
      icon: <ShieldCheck size={28} className="text-forest" />,
      title: "Quick Verification",
      subtitle: "Get results in seconds"
    },
    {
      icon: <Database size={28} className="text-forest" />,
      title: "Trusted Sources",
      subtitle: "CDSCO, NSQ and more"
    },
    {
      icon: <Users size={28} className="text-forest" />,
      title: "Hindi + English",
      subtitle: "Easy for everyone"
    },
    {
      icon: <Heart size={28} className="text-forest" />,
      title: "Made for Safer Communities",
      subtitle: "Awareness for a healthier India"
    }
  ];

  const handleStepClick = (mode) => {
    if (onGoToScanner) {
      onGoToScanner(mode);
    }
    const scannerEl = document.getElementById("scanner");
    if (scannerEl) {
      scannerEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="mv-how-section" id="how-it-works" aria-label="How Medify Works">
      <div className="mv-container">
        {/* Curving Light Mint Container */}
        <div className="mv-how-card">
          {/* Section Heading */}
          <div className="mv-how-header">
            <h2 className="mv-how-title">How Medify Works?</h2>
          </div>

          {/* 4 Steps Horizontal Flow */}
          <div className="mv-how-steps-flow">
            {steps.map((step, idx) => (
              <div key={step.num} className="mv-how-step-col">
                <div
                  className="mv-how-step-item"
                  onClick={() => handleStepClick(step.mode)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleStepClick(step.mode)}
                >
                  {/* Step Number Badge */}
                  <span className="mv-step-circle-badge">{step.num}</span>

                  {/* Icon Card Box */}
                  <div className="mv-step-icon-box">
                    {step.icon}
                  </div>

                  {/* Step Text Info */}
                  <div className="mv-step-text-wrap">
                    <h3 className="mv-step-title">{step.title}</h3>
                    <p className="mv-step-desc">{step.desc}</p>
                  </div>
                </div>

                {/* Arrow Connector between steps */}
                {idx < steps.length - 1 && (
                  <div className="mv-step-arrow-connector" aria-hidden="true">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Trust Highlights Row */}
          <div className="mv-trust-bar-bottom">
            {trustHighlights.map((hl, i) => (
              <div key={i} className="mv-trust-bar-col">
                <div className="mv-trust-icon-wrap">
                  {hl.icon}
                </div>
                <div className="mv-trust-text-wrap">
                  <h4 className="mv-trust-title">{hl.title}</h4>
                  <p className="mv-trust-sub">{hl.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

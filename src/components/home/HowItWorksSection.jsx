import { ScanLine, FileCheck, ShieldCheck, ArrowRight } from "lucide-react";

export default function HowItWorksSection({ onGoToScanner }) {
  const steps = [
    {
      number: "01",
      icon: <ScanLine size={26} />,
      title: "Scan or Enter Medicine Details",
      description:
        "Select your preferred inspection method: scan the 2D DataMatrix code with your camera, upload a photo of the blister packaging for OCR extraction, or enter known details manually.",
      tip: "Ensure good lighting and avoid camera glare on foil strips."
    },
    {
      number: "02",
      icon: <FileCheck size={26} />,
      title: "Review Extracted Information",
      description:
        "Inspect the structured output: verify extracted product name, candidate batch ID, and calculated shelf life status. Edit any OCR misreadings directly on the interface.",
      tip: "Double-check that the inner blister strip matches the outer box."
    },
    {
      number: "03",
      icon: <ShieldCheck size={26} />,
      title: "Confirm with a Trusted Source",
      description:
        "Review the physical packaging safety checklist and compare details against official regulatory directories (CDSCO, US FDA Orange Book) or consult your licensed pharmacist if anything appears suspect.",
      tip: "Never ingest medication if packaging shows signs of tampering."
    }
  ];

  return (
    <section className="mv-how-section" id="how-it-works" aria-label="How MedVerify Works">
      <div className="mv-container">
        <div className="mv-section-heading">
          <span className="mv-section-eyebrow">TRANSPARENT 3-STEP PROCESS</span>
          <h2>How MedVerify Works</h2>
          <p>
            A simple, responsible workflow that pairs browser technology with human vigilance to safeguard your health.
          </p>
        </div>

        <div className="mv-steps-grid">
          {steps.map((step, idx) => (
            <div key={idx} className="mv-step-card">
              <div className="mv-step-top">
                <span className="mv-step-num-badge">{step.number}</span>
                <div className="mv-step-icon-wrap">{step.icon}</div>
              </div>

              <h3>{step.title}</h3>
              <p className="mv-step-desc">{step.description}</p>

              <div className="mv-step-tip">
                <strong>Pro Tip:</strong> {step.tip}
              </div>
            </div>
          ))}
        </div>

        <div className="mv-how-cta-center">
          <a
            href="#scanner"
            className="mv-btn-primary"
            onClick={(e) => {
              e.preventDefault();
              if (onGoToScanner) onGoToScanner("scan");
              const el = document.getElementById("scanner");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span>Try the Inspection Tools Now</span>
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

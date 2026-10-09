import { ShieldCheck, ExternalLink, AlertTriangle, Phone } from "lucide-react";
import { REGULATORY_REGISTRIES } from "../../constants/medicineKnowledge";

export default function Footer({ onOpenContact }) {
  return (
    <footer className="mv-footer-section" role="contentinfo">
      <div className="mv-container">
        <div className="mv-footer-grid">
          {/* Brand & Mission */}
          <div className="mv-footer-col mv-footer-brand-col">
            <a
              href="#home"
              className="mv-brand mv-footer-brand"
              aria-label="MedVerify Homepage"
            >
              <img
                src="/logo.png"
                alt="MedVerify - Safe Medicines, Trusted Health"
                className="mv-footer-logo-img"
              />
            </a>
            <p className="mv-footer-mission">
              &quot;Know your medicine. Protect your health.&quot; MedVerify is a technology demonstration platform designed to assist patients and caregivers in reading medicine packaging codes and identifying details that need verification from trusted sources.
            </p>
            <div className="mv-demo-pill">
              <span>● Educational Demonstration Platform · Zero Unverified Claims</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mv-footer-col">
            <h4>Platform Navigation</h4>
            <ul className="mv-footer-links">
              <li><a href="#home">Home</a></li>
              <li><a href="#scanner">Verify Medicine</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#benefits">Packaging Benefits</a></li>
              <li><a href="#safety">Safety & Limits</a></li>
              <li><a href="#regulatory">Regulatory Registers</a></li>
              <li>
                <button
                  type="button"
                  className="mv-footer-btn-link"
                  onClick={onOpenContact}
                >
                  Contact & Support
                </button>
              </li>
            </ul>
          </div>

          {/* Official Health Authorities */}
          <div className="mv-footer-col">
            <h4>Official Regulators</h4>
            <ul className="mv-footer-links">
              {REGULATORY_REGISTRIES.slice(0, 4).map((reg) => (
                <li key={reg.country}>
                  <a
                    href={reg.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mv-footer-ext-link"
                  >
                    <span>{reg.agency} ({reg.country})</span>
                    <ExternalLink size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency / Safety Guidance */}
          <div className="mv-footer-col">
            <h4>Safety & Helpline</h4>
            <div className="mv-footer-help-box">
              <p className="mv-help-title">
                <Phone size={14} /> India PvPI Helpline:
              </p>
              <strong className="mv-phone-val">1800-180-3024 (Toll-Free)</strong>
              <p className="mv-help-sub">Report adverse drug reactions or suspect medicine batches.</p>
            </div>

            <div className="mv-footer-help-box">
              <p className="mv-help-title">
                <Phone size={14} /> US FDA MedWatch:
              </p>
              <strong className="mv-phone-val">1-800-FDA-1088</strong>
              <p className="mv-help-sub">Voluntary medical product problem reporting.</p>
            </div>
          </div>
        </div>

        {/* Mandatory Legal & Safety Disclaimer Banner */}
        <div className="mv-footer-disclaimer-card">
          <div className="mv-disclaimer-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="mv-disclaimer-text">
            <strong>CRITICAL MEDICINE SAFETY DISCLAIMER:</strong>
            <p>
              MedVerify is an educational packaging inspection tool. Scanning a barcode or performing optical character recognition (OCR) on medicine packaging does NOT prove that a medicine is authentic, genuine, medically safe, correctly formulated, or regulator-approved. Counterfeiters can duplicate physical packaging and barcodes. Always purchase prescription medications through licensed pharmacies, check physical tamper seals, and consult a qualified medical doctor or pharmacist before consumption.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mv-footer-bottom">
          <p>
            © {new Date().getFullYear()} MedVerify. Built with patient safety as the highest priority.
          </p>
          <div className="mv-footer-bottom-links">
            <span>Privacy-Conscious · No Server Storage of Patient Medicine Data</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

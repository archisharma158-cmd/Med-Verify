import { ExternalLink, AlertTriangle, Phone } from "lucide-react";
import { REGULATORY_REGISTRIES } from "../../constants/medicineKnowledge";
import { useLanguage } from "../../context/LanguageContext";

export default function Footer({ onOpenContact }) {
  const { t } = useLanguage();

  return (
    <footer className="mv-footer-section" role="contentinfo">
      <div className="mv-container">
        <div className="mv-footer-grid">
          {/* Brand & Mission */}
          <div className="mv-footer-col mv-footer-brand-col">
            <a
              href="#home"
              className="mv-brand mv-footer-brand"
              aria-label="MediFy Homepage"
            >
              <img
                src="/logo.png"
                alt="MediFy - Safe Medicines, Healthier India"
                className="mv-footer-logo-img"
              />
            </a>
            <p className="mv-footer-mission">
              {t("footerMission")}
            </p>
            <div className="mv-demo-pill">
              <span>● {t("footerEduNotice")}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mv-footer-col">
            <h4>{t("footerNavTitle")}</h4>
            <ul className="mv-footer-links">
              <li><a href="#home">{t("navHome")}</a></li>
              <li><a href="#scanner">{t("navVerify")}</a></li>
              <li><a href="#how-it-works">{t("navHowItWorks")}</a></li>
              <li><a href="#risk-meter">{t("navRiskMeter")}</a></li>
              <li><a href="#safety">{t("safetyEyebrow")}</a></li>
              <li><a href="#regulatory">{t("footerRegTitle")}</a></li>
              <li>
                <button
                  type="button"
                  className="mv-footer-btn-link"
                  onClick={onOpenContact}
                >
                  {t("footerContactBtn")}
                </button>
              </li>
            </ul>
          </div>

          {/* Official Health Authorities */}
          <div className="mv-footer-col">
            <h4>{t("footerRegTitle")}</h4>
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
            <h4>{t("footerHelplineTitle")}</h4>
            <div className="mv-footer-help-box">
              <p className="mv-help-title">
                <Phone size={14} /> India PvPI Helpline:
              </p>
              <strong className="mv-phone-val">1800-180-3024 (Toll-Free)</strong>
              <p className="mv-help-sub">{t("footerHelplineDesk")}</p>
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
            <strong>{t("footerDisclaimTitle")}:</strong>
            <p>
              {t("footerDisclaimText")}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mv-footer-bottom">
          <p>
            {t("footerCopyright")}
          </p>
          <div className="mv-footer-bottom-links">
            <span>Privacy-Conscious · No Server Storage of Patient Medicine Data</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

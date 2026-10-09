import { ExternalLink, Building2, PhoneCall, AlertCircle, ShieldAlert, ChevronRight } from "lucide-react";
import { REGULATORY_REGISTRIES } from "../../constants/medicineKnowledge";
import { useLanguage } from "../../context/LanguageContext";

export default function RegulatoryRegistrySection({ onOpenAlerts }) {
  const { t } = useLanguage();

  return (
    <section className="mv-regulatory-section" id="regulatory" aria-label="Official Regulatory Drug Registries">
      <div className="mv-container">
        {/* Interactive CDSCO Surveillance Banner */}
        {onOpenAlerts && (
          <div className="mv-registry-alert-cta-banner">
            <div className="mv-cta-banner-icon">
              <ShieldAlert size={28} />
            </div>
            <div className="mv-cta-banner-text">
              <h4>{t("regCtaTitle")}</h4>
              <p>{t("regCtaDesc")}</p>
            </div>
            <button
              type="button"
              className="mv-btn-primary mv-btn-sm mv-cta-banner-btn"
              onClick={onOpenAlerts}
            >
              <span>{t("regCtaBtn")}</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        <div className="mv-section-heading">
          <span className="mv-section-eyebrow">{t("regEyebrow")}</span>
          <h2>{t("regHeading")}</h2>
          <p>{t("regSub")}</p>
        </div>

        <div className="mv-registry-grid">
          {REGULATORY_REGISTRIES.map((item) => (
            <div key={item.country} className="mv-registry-card">
              <div className="mv-registry-top">
                <div className="mv-registry-badge">
                  <Building2 size={16} />
                  <span>{item.country}</span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mv-registry-link-icon"
                  title={`Open official ${item.agency} website`}
                >
                  <ExternalLink size={16} />
                </a>
              </div>

              <h3>{item.agency}</h3>
              <div className="mv-registry-portal-name">{item.portalName}</div>
              <p className="mv-registry-desc">{item.description}</p>

              <div className="mv-registry-helpline">
                <PhoneCall size={14} className="text-emerald" />
                <span>{item.helpline}</span>
              </div>

              <div className="mv-registry-action-note">
                <AlertCircle size={13} />
                <span>{item.reportingAction}</span>
              </div>

              <div className="mv-registry-bottom-action">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mv-btn-outline mv-w-full mv-btn-sm"
                >
                  <span>Visit {item.agency.split(" ")[0]} Portal</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

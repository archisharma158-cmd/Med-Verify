import { FileSearch, Clock, ShieldAlert, Cpu, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function BenefitsSection() {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: <FileSearch size={24} />,
      title: t("benefit1Title", "Decodes Complex Label Typography"),
      description: t(
        "benefit1Desc",
        "Medicine packaging often uses tiny, condensed fonts that are difficult to read under poor lighting. MediFy extracts and magnifies brand names, active pharmaceutical ingredients (APIs), and manufacturer addresses."
      )
    },
    {
      icon: <Clock size={24} />,
      title: t("benefit2Title", "Real-Time Expiry & Shelf Life Analysis"),
      description: t(
        "benefit2Desc",
        "Calculates exact days remaining until expiry, flags products that have passed their expiration date, and highlights products nearing the end of their shelf life so treatments are not compromised."
      )
    },
    {
      icon: <Cpu size={24} />,
      title: t("benefit3Title", "Batch Format Sanity Checking"),
      description: t(
        "benefit3Desc",
        "Validates standard alphanumeric batch patterns against pharmaceutical conventions, ensuring you capture clean batch numbers required for tracking official recalls or reporting adverse reactions."
      )
    },
    {
      icon: <ShieldAlert size={24} />,
      title: t("benefit4Title", "Identifies What Demands Confirmation"),
      description: t(
        "benefit4Desc",
        "Rather than giving a false sense of security, MediFy explicitly highlights what cannot be proven by a barcode or photograph alone, equipping you with an objective checklist for your pharmacist."
      )
    }
  ];

  return (
    <section className="mv-benefits-section" id="benefits" aria-label="Practical Platform Benefits">
      <div className="mv-container">
        <div className="mv-section-heading">
          <span className="mv-section-eyebrow">{t("benefitsEyebrow", "PRACTICAL CLINICAL UTILITY")}</span>
          <h2>{t("benefitsHeading", "Empowering Safer Medicine Decisions")}</h2>
          <p>
            {t(
              "benefitsSub",
              "MediFy is built to promote packaging literacy and patient vigilance. Here is how our tools support your everyday healthcare safety checks."
            )}
          </p>
        </div>

        <div className="mv-benefits-grid">
          {benefits.map((item, idx) => (
            <div key={idx} className="mv-benefit-card">
              <div className="mv-benefit-icon-wrapper">
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>

        {/* Responsible Disclaimer Box */}
        <div className="mv-benefit-disclaimer-strip">
          <CheckCircle2 size={18} className="text-emerald" />
          <span>
            {t(
              "benefitsCommitment",
              "Our Commitment: We never generate speculative authenticity percentages or claim that a scanned QR code proves a pill is genuine or medically safe."
            )}
          </span>
        </div>
      </div>
    </section>
  );
}

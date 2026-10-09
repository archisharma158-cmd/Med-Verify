import { ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function SafetySection() {
  const { t } = useLanguage();

  return (
    <section className="mv-safety-section" id="safety" aria-label="Safety Limitations and Best Practices">
      <div className="mv-container">
        <div className="mv-section-heading">
          <span className="mv-section-eyebrow text-danger">{t("safetyEyebrow", "ESSENTIAL SAFETY BOUNDARIES")}</span>
          <h2>{t("safetyHeading", "The Limits of Automated Verification")}</h2>
          <p>
            {t(
              "safetySub",
              "Understanding what technology can and cannot do is fundamental to avoiding substandard or counterfeit pharmaceuticals."
            )}
          </p>
        </div>

        {/* Comparison Grid: What Tech Can Do vs What It Cannot Do */}
        <div className="mv-capabilities-grid">
          {/* Column 1: Automated Capabilities */}
          <div className="mv-cap-card mv-cap-supported">
            <div className="mv-cap-header">
              <CheckCircle2 size={22} className="text-emerald" />
              <h3>{t("safetyCanTitle", "What Automated Scanning Can Do")}</h3>
            </div>
            <ul className="mv-cap-list">
              <li>
                <strong>{t("canItem1Title", "Read Barcode Serialization")}:</strong>{" "}
                {t("canItem1Desc", "Decodes GS1 DataMatrix identifiers, batch codes, GTINs, and expiration date strings.")}
              </li>
              <li>
                <strong>{t("canItem2Title", "Extract Fine Packaging Typography")}:</strong>{" "}
                {t("canItem2Desc", "Uses computer vision to convert embossed or printed blister text into readable digital records.")}
              </li>
              <li>
                <strong>{t("canItem3Title", "Calculate Expiration Timeframes")}:</strong>{" "}
                {t("canItem3Desc", "Computes days remaining until the labeled expiration date to prevent consuming stale medications.")}
              </li>
              <li>
                <strong>{t("canItem4Title", "Structure Data for Review")}:</strong>{" "}
                {t("canItem4Desc", "Prepares an organized checklist of packaging attributes for convenient inspection.")}
              </li>
            </ul>
          </div>

          {/* Column 2: Limitations Requiring Human / Lab Inspection */}
          <div className="mv-cap-card mv-cap-unsupported">
            <div className="mv-cap-header">
              <XCircle size={22} className="text-danger" />
              <h3>{t("safetyCannotTitle", "What Technology Cannot Do Alone")}</h3>
            </div>
            <ul className="mv-cap-list">
              <li>
                <strong>{t("cannotItem1Title", "Cannot Prove Authentic Chemistry")}:</strong>{" "}
                {t("cannotItem1Desc", "A valid barcode does not prove that the chemical formula inside the tablet is authentic or therapeutically active.")}
              </li>
              <li>
                <strong>{t("cannotItem2Title", "Cannot Detect Cloned Barcodes")}:</strong>{" "}
                {t("cannotItem2Desc", "Sophisticated counterfeiters can photograph genuine barcodes and duplicate them onto fraudulent packaging.")}
              </li>
              <li>
                <strong>{t("cannotItem3Title", "Cannot Verify Cold Chain Integrity")}:</strong>{" "}
                {t("cannotItem3Desc", "Scanners cannot determine if temperature-sensitive biologics or vaccines were exposed to heat or spoilage.")}
              </li>
              <li>
                <strong>{t("cannotItem4Title", "Cannot Substitute for Medical Advice")}:</strong>{" "}
                {t("cannotItem4Desc", "Digital tools cannot diagnose symptoms, adjust dosages, or replace licensed pharmacists.")}
              </li>
            </ul>
          </div>
        </div>

        {/* Golden Rules of Medicine Safety */}
        <div className="mv-golden-rules-card">
          <div className="mv-golden-header">
            <ShieldAlert size={24} className="text-emerald" />
            <div>
              <h4>{t("goldenRulesTitle", "5 Golden Rules Before Ingesting Any Medicine")}</h4>
              <p>{t("goldenRulesSub", "Adhere to these clinical safety standards for every prescription and OTC product:")}</p>
            </div>
          </div>

          <div className="mv-rules-grid">
            <div className="mv-rule-item">
              <span className="num">1</span>
              <div>
                <strong>{t("rule1Title", "Only Buy from Licensed Pharmacies")}</strong>
                <p>{t("rule1Desc", "Avoid rogue online sellers or unregistered vendors offering steep discounts on vital prescription drugs.")}</p>
              </div>
            </div>

            <div className="mv-rule-item">
              <span className="num">2</span>
              <div>
                <strong>{t("rule2Title", "Examine the Physical Seal First")}</strong>
                <p>{t("rule2Desc", "Never accept bottles with broken neck bands, peeled foils, or blister pockets with micro-punctures.")}</p>
              </div>
            </div>

            <div className="mv-rule-item">
              <span className="num">3</span>
              <div>
                <strong>{t("rule3Title", "Compare Box with Inner Strip")}</strong>
                <p>{t("rule3Desc", "The batch number and expiry date printed on the foil strip MUST match the outer carton exactly.")}</p>
              </div>
            </div>

            <div className="mv-rule-item">
              <span className="num">4</span>
              <div>
                <strong>{t("rule4Title", "Watch for Taste, Smell, or Color Shifts")}</strong>
                <p>{t("rule4Desc", "If a repeat prescription looks slightly off in color, smells strange, or crumbles easily, stop immediately.")}</p>
              </div>
            </div>

            <div className="mv-rule-item">
              <span className="num">5</span>
              <div>
                <strong>{t("rule5Title", "When in Doubt, Ask Your Pharmacist")}</strong>
                <p>{t("rule5Desc", "Your local licensed pharmacist has direct access to drug supply-chain invoices and manufacturer reps.")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

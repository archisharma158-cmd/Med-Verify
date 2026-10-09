import { ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

export default function SafetySection() {
  return (
    <section className="mv-safety-section" id="safety" aria-label="Safety Limitations and Best Practices">
      <div className="mv-container">
        <div className="mv-section-heading">
          <span className="mv-section-eyebrow text-danger">ESSENTIAL SAFETY BOUNDARIES</span>
          <h2>The Limits of Automated Verification</h2>
          <p>
            Understanding what technology can and cannot do is fundamental to avoiding substandard or counterfeit pharmaceuticals.
          </p>
        </div>

        {/* Comparison Grid: What Tech Can Do vs What It Cannot Do */}
        <div className="mv-capabilities-grid">
          {/* Column 1: Automated Capabilities */}
          <div className="mv-cap-card mv-cap-supported">
            <div className="mv-cap-header">
              <CheckCircle2 size={22} className="text-emerald" />
              <h3>What Automated Scanning Can Do</h3>
            </div>
            <ul className="mv-cap-list">
              <li>
                <strong>Read Barcode Serialization:</strong> Decodes GS1 DataMatrix identifiers, batch codes, GTINs, and expiration date strings.
              </li>
              <li>
                <strong>Extract Fine Packaging Typography:</strong> Uses computer vision to convert embossed or printed blister text into readable digital records.
              </li>
              <li>
                <strong>Calculate Expiration Timeframes:</strong> Computes days remaining until the labeled expiration date to prevent consuming stale medications.
              </li>
              <li>
                <strong>Structure Data for Review:</strong> Prepares an organized checklist of packaging attributes for convenient inspection.
              </li>
            </ul>
          </div>

          {/* Column 2: Limitations Requiring Human / Lab Inspection */}
          <div className="mv-cap-card mv-cap-unsupported">
            <div className="mv-cap-header">
              <XCircle size={22} className="text-danger" />
              <h3>What Technology Cannot Do Alone</h3>
            </div>
            <ul className="mv-cap-list">
              <li>
                <strong>Cannot Prove Authentic Chemistry:</strong> A valid barcode does not prove that the chemical formula inside the tablet is authentic or therapeutically active.
              </li>
              <li>
                <strong>Cannot Detect Cloned Barcodes:</strong> Sophisticated counterfeiters can photograph genuine barcodes and duplicate them onto fraudulent packaging.
              </li>
              <li>
                <strong>Cannot Verify Cold Chain Integrity:</strong> Scanners cannot determine if temperature-sensitive biologics or vaccines were exposed to heat or spoilage.
              </li>
              <li>
                <strong>Cannot Substitute for Medical Advice:</strong> Digital tools cannot diagnose symptoms, adjust dosages, or replace licensed pharmacists.
              </li>
            </ul>
          </div>
        </div>

        {/* Golden Rules of Medicine Safety */}
        <div className="mv-golden-rules-card">
          <div className="mv-golden-header">
            <ShieldAlert size={24} className="text-emerald" />
            <div>
              <h4>5 Golden Rules Before Ingesting Any Medicine</h4>
              <p>Adhere to these clinical safety standards for every prescription and OTC product:</p>
            </div>
          </div>

          <div className="mv-rules-grid">
            <div className="mv-rule-item">
              <span className="num">1</span>
              <div>
                <strong>Only Buy from Licensed Pharmacies</strong>
                <p>Avoid rogue online sellers or unregistered vendors offering steep discounts on vital prescription drugs.</p>
              </div>
            </div>

            <div className="mv-rule-item">
              <span className="num">2</span>
              <div>
                <strong>Examine the Physical Seal First</strong>
                <p>Never accept bottles with broken neck bands, peeled foils, or blister pockets with micro-punctures.</p>
              </div>
            </div>

            <div className="mv-rule-item">
              <span className="num">3</span>
              <div>
                <strong>Compare Box with Inner Strip</strong>
                <p>The batch number and expiry date printed on the foil strip MUST match the outer carton exactly.</p>
              </div>
            </div>

            <div className="mv-rule-item">
              <span className="num">4</span>
              <div>
                <strong>Watch for Taste, Smell, or Color Shifts</strong>
                <p>If a repeat prescription looks slightly off in color, smells strange, or crumbles easily, stop immediately.</p>
              </div>
            </div>

            <div className="mv-rule-item">
              <span className="num">5</span>
              <div>
                <strong>When in Doubt, Ask Your Pharmacist</strong>
                <p>Your local licensed pharmacist has direct access to drug supply-chain invoices and manufacturer reps.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

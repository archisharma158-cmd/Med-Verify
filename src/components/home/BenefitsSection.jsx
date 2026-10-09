import { FileSearch, Clock, ShieldAlert, Cpu, CheckCircle2 } from "lucide-react";

export default function BenefitsSection() {
  const benefits = [
    {
      icon: <FileSearch size={24} />,
      title: "Decodes Complex Label Typography",
      description:
        "Medicine packaging often uses tiny, condensed fonts that are difficult to read under poor lighting. MedVerify extracts and magnifies brand names, active pharmaceutical ingredients (APIs), and manufacturer addresses."
    },
    {
      icon: <Clock size={24} />,
      title: "Real-Time Expiry & Shelf Life Analysis",
      description:
        "Calculates exact days remaining until expiry, flags products that have passed their expiration date, and highlights products nearing the end of their shelf life so treatments are not compromised."
    },
    {
      icon: <Cpu size={24} />,
      title: "Batch Format Sanity Checking",
      description:
        "Validates standard alphanumeric batch patterns against pharmaceutical conventions, ensuring you capture clean batch numbers required for tracking official recalls or reporting adverse reactions."
    },
    {
      icon: <ShieldAlert size={24} />,
      title: "Identifies What Demands Confirmation",
      description:
        "Rather than giving a false sense of security, MedVerify explicitly highlights what cannot be proven by a barcode or photograph alone, equipping you with an objective checklist for your pharmacist."
    }
  ];

  return (
    <section className="mv-benefits-section" id="benefits" aria-label="Practical Platform Benefits">
      <div className="mv-container">
        <div className="mv-section-heading">
          <span className="mv-section-eyebrow">PRACTICAL CLINICAL UTILITY</span>
          <h2>Empowering Safer Medicine Decisions</h2>
          <p>
            MedVerify is built to promote packaging literacy and patient vigilance. Here is how our tools support your everyday healthcare safety checks.
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
            <strong>Our Commitment:</strong> We never generate speculative &quot;authenticity percentages&quot; or claim that a scanned QR code proves a pill is genuine or medically safe.
          </span>
        </div>
      </div>
    </section>
  );
}

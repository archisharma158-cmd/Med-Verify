import { useState } from "react";
import { ShieldCheck, ScanLine, Menu, X, ArrowRight } from "lucide-react";

export default function Navbar({ onOpenContact, onSelectScanTab }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  const handleNavClick = (e, targetId, tabMode = null) => {
    e.preventDefault();
    closeMenu();

    if (tabMode && onSelectScanTab) {
      onSelectScanTab(tabMode);
    }

    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="mv-navbar" role="banner">
      <div className="mv-nav-container">
        {/* Brand */}
        <a
          href="#home"
          className="mv-brand"
          onClick={(e) => handleNavClick(e, "home")}
          aria-label="MedVerify Homepage"
        >
          <img
            src="/logo.png"
            alt="MedVerify - Safe Medicines, Trusted Health"
            className="mv-brand-logo-img"
          />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="mv-nav-links" aria-label="Main Navigation">
          <a href="#home" onClick={(e) => handleNavClick(e, "home")}>
            Home
          </a>
          <a href="#scanner" onClick={(e) => handleNavClick(e, "scanner")}>
            Verify Medicine
          </a>
          <a href="#how-it-works" onClick={(e) => handleNavClick(e, "how-it-works")}>
            How It Works
          </a>
          <a href="#safety" onClick={(e) => handleNavClick(e, "safety")}>
            Safety Information
          </a>
          <a href="#regulatory" onClick={(e) => handleNavClick(e, "regulatory")}>
            Regulatory Registers
          </a>
          <button
            type="button"
            className="mv-nav-link-btn"
            onClick={() => {
              closeMenu();
              onOpenContact();
            }}
          >
            Contact
          </button>
        </nav>

        {/* Action Button */}
        <div className="mv-nav-action-wrapper">
          <a
            href="#scanner"
            className="mv-nav-cta-btn"
            onClick={(e) => handleNavClick(e, "scanner", "scan")}
          >
            <ScanLine size={16} />
            <span>Verify a Medicine</span>
            <ArrowRight size={15} />
          </a>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="mv-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mv-mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <nav className="mv-mobile-nav">
            <a href="#home" onClick={(e) => handleNavClick(e, "home")}>
              Home
            </a>
            <a href="#scanner" onClick={(e) => handleNavClick(e, "scanner")}>
              Verify Medicine
            </a>
            <a href="#how-it-works" onClick={(e) => handleNavClick(e, "how-it-works")}>
              How It Works
            </a>
            <a href="#safety" onClick={(e) => handleNavClick(e, "safety")}>
              Safety Information
            </a>
            <a href="#regulatory" onClick={(e) => handleNavClick(e, "regulatory")}>
              Regulatory Registers
            </a>
            <button
              type="button"
              className="mv-mobile-link-btn"
              onClick={() => {
                closeMenu();
                onOpenContact();
              }}
            >
              Contact & Feedback
            </button>
            <div className="mv-mobile-cta-wrap">
              <a
                href="#scanner"
                className="mv-btn-primary mv-w-full"
                onClick={(e) => handleNavClick(e, "scanner", "scan")}
              >
                <ScanLine size={18} />
                <span>Verify a Medicine Now</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

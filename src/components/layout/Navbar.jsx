import { useState } from "react";
import { Globe, User, Menu, X, ChevronDown, Check } from "lucide-react";

export default function Navbar({ onOpenContact, onSelectScanTab, currentLanguage = "en", onLanguageChange }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [lang, setLang] = useState(currentLanguage);

  const closeMenu = () => setMobileMenuOpen(false);

  const handleNavClick = (e, targetId, navKey, tabMode = null) => {
    e.preventDefault();
    closeMenu();
    setActiveNav(navKey);

    if (tabMode && onSelectScanTab) {
      onSelectScanTab(tabMode);
    }

    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectLang = (newLang) => {
    setLang(newLang);
    setLangMenuOpen(false);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  return (
    <header className="mv-navbar" role="banner">
      <div className="mv-nav-container">
        {/* Brand */}
        <a
          href="#home"
          className="mv-brand"
          onClick={(e) => handleNavClick(e, "home", "home")}
          aria-label="MediFy Homepage"
        >
          <img
            src="/logo.png"
            alt="MediFy - Safe Medicines, Healthier India"
            className="mv-brand-logo-img"
          />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="mv-nav-links" aria-label="Main Navigation">
          <a
            href="#home"
            className={activeNav === "home" ? "is-active" : ""}
            onClick={(e) => handleNavClick(e, "home", "home")}
          >
            Home
            {activeNav === "home" && <span className="mv-nav-indicator" />}
          </a>
          <a
            href="#how-it-works"
            className={activeNav === "how-it-works" ? "is-active" : ""}
            onClick={(e) => handleNavClick(e, "how-it-works", "how-it-works")}
          >
            How It Works
            {activeNav === "how-it-works" && <span className="mv-nav-indicator" />}
          </a>
          <a
            href="#safety"
            className={activeNav === "safety" ? "is-active" : ""}
            onClick={(e) => handleNavClick(e, "safety", "safety")}
          >
            Safety Guide
            {activeNav === "safety" && <span className="mv-nav-indicator" />}
          </a>
          <a
            href="#regulatory"
            className={activeNav === "reports" ? "is-active" : ""}
            onClick={(e) => handleNavClick(e, "regulatory", "reports")}
          >
            Reports
            {activeNav === "reports" && <span className="mv-nav-indicator" />}
          </a>
          <a
            href="#benefits"
            className={activeNav === "about" ? "is-active" : ""}
            onClick={(e) => handleNavClick(e, "benefits", "about")}
          >
            About
            {activeNav === "about" && <span className="mv-nav-indicator" />}
          </a>
        </nav>

        {/* Right Nav Controls: Language + Sign In */}
        <div className="mv-nav-action-wrapper">
          {/* Language Selector */}
          <div className="mv-lang-dropdown-wrapper">
            <button
              type="button"
              className="mv-lang-btn"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              aria-expanded={langMenuOpen}
              aria-label="Select language"
            >
              <Globe size={15} />
              <span>{lang.toUpperCase()}</span>
              <ChevronDown size={14} className={`mv-chevron ${langMenuOpen ? "open" : ""}`} />
            </button>

            {langMenuOpen && (
              <div className="mv-lang-menu">
                <button
                  type="button"
                  className={`mv-lang-option ${lang === "en" ? "active" : ""}`}
                  onClick={() => handleSelectLang("en")}
                >
                  <span>English (EN)</span>
                  {lang === "en" && <Check size={14} />}
                </button>
                <button
                  type="button"
                  className={`mv-lang-option ${lang === "hi" ? "active" : ""}`}
                  onClick={() => handleSelectLang("hi")}
                >
                  <span>हिंदी (HI)</span>
                  {lang === "hi" && <Check size={14} />}
                </button>
              </div>
            )}
          </div>

          {/* Sign In Button */}
          <button
            type="button"
            className="mv-signin-btn"
            onClick={onOpenContact}
            aria-label="Sign In or Contact"
          >
            <User size={16} />
            <span>Sign In</span>
          </button>

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
            <a href="#home" onClick={(e) => handleNavClick(e, "home", "home")}>
              Home
            </a>
            <a href="#how-it-works" onClick={(e) => handleNavClick(e, "how-it-works", "how-it-works")}>
              How It Works
            </a>
            <a href="#safety" onClick={(e) => handleNavClick(e, "safety", "safety")}>
              Safety Guide
            </a>
            <a href="#regulatory" onClick={(e) => handleNavClick(e, "regulatory", "reports")}>
              Reports & Registries
            </a>
            <a href="#benefits" onClick={(e) => handleNavClick(e, "benefits", "about")}>
              About MediFy
            </a>

            <div className="mv-mobile-lang-row">
              <span className="label">Language:</span>
              <button
                type="button"
                className={`mv-btn-chip ${lang === "en" ? "active" : ""}`}
                onClick={() => handleSelectLang("en")}
              >
                English
              </button>
              <button
                type="button"
                className={`mv-btn-chip ${lang === "hi" ? "active" : ""}`}
                onClick={() => handleSelectLang("hi")}
              >
                हिंदी
              </button>
            </div>

            <div className="mv-mobile-cta-wrap">
              <button
                type="button"
                className="mv-signin-btn mv-w-full"
                onClick={() => {
                  closeMenu();
                  onOpenContact();
                }}
              >
                <User size={18} />
                <span>Sign In / Contact</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

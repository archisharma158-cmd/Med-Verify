import { useState } from "react";
import {
  Globe,
  User,
  Menu,
  X,
  ChevronDown,
  Check,
  History,
  ShieldAlert,
  LayoutDashboard,
  AlertTriangle,
  QrCode
} from "lucide-react";

export default function Navbar({
  onOpenContact,
  onSelectScanTab,
  onOpenHistory,
  onOpenReport,
  onOpenAlerts,
  onOpenAdmin,
  historyCount = 0,
  currentLanguage = "en",
  onLanguageChange
}) {
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
            href="#scanner"
            className={activeNav === "scanner" ? "is-active" : ""}
            onClick={(e) => handleNavClick(e, "scanner", "scanner", "scan")}
          >
            Verify Medicine
            {activeNav === "scanner" && <span className="mv-nav-indicator" />}
          </a>
          <a
            href="#how-it-works"
            className={activeNav === "how-it-works" ? "is-active" : ""}
            onClick={(e) => handleNavClick(e, "how-it-works", "how-it-works")}
          >
            How It Works
            {activeNav === "how-it-works" && <span className="mv-nav-indicator" />}
          </a>
          <button
            type="button"
            className="mv-nav-btn-link"
            onClick={onOpenAlerts}
            title="Browse official CDSCO recalls & alerts"
          >
            <ShieldAlert size={14} className="text-emerald" />
            <span>CDSCO Alerts</span>
          </button>
          <button
            type="button"
            className="mv-nav-btn-link"
            onClick={onOpenAdmin}
            title="Open safety oversight & admin dashboard"
          >
            <LayoutDashboard size={14} className="text-cyan" />
            <span>Admin Portal</span>
          </button>
        </nav>

        {/* Right Nav Action Toolbar */}
        <div className="mv-nav-action-wrapper">
          {/* Scan History Button */}
          {onOpenHistory && (
            <button
              type="button"
              className="mv-nav-icon-btn"
              onClick={onOpenHistory}
              title="View Scan History"
              aria-label="Scan History"
            >
              <History size={17} />
              {historyCount > 0 && (
                <span className="mv-nav-badge-count">{historyCount}</span>
              )}
            </button>
          )}

          {/* Report Suspicious Defect Button */}
          {onOpenReport && (
            <button
              type="button"
              className="mv-nav-report-btn"
              onClick={onOpenReport}
              title="Report suspicious medicine or defect"
            >
              <AlertTriangle size={14} />
              <span>Report Fake</span>
            </button>
          )}

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
          <div className="mv-mobile-drawer-inner">
            <div className="mv-mobile-nav-links">
              <a
                href="#home"
                onClick={(e) => handleNavClick(e, "home", "home")}
              >
                Home
              </a>
              <a
                href="#scanner"
                onClick={(e) => handleNavClick(e, "scanner", "scanner", "scan")}
              >
                Verify Medicine
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => handleNavClick(e, "how-it-works", "how-it-works")}
              >
                How It Works
              </a>
              <button
                type="button"
                className="mv-mobile-drawer-btn"
                onClick={() => {
                  closeMenu();
                  onOpenAlerts();
                }}
              >
                <ShieldAlert size={16} className="text-emerald" />
                <span>CDSCO Quality Alerts</span>
              </button>
              <button
                type="button"
                className="mv-mobile-drawer-btn"
                onClick={() => {
                  closeMenu();
                  onOpenHistory();
                }}
              >
                <History size={16} className="text-amber" />
                <span>Scan History ({historyCount})</span>
              </button>
              <button
                type="button"
                className="mv-mobile-drawer-btn"
                onClick={() => {
                  closeMenu();
                  onOpenReport();
                }}
              >
                <AlertTriangle size={16} className="text-crimson" />
                <span>Report Suspicious Medicine</span>
              </button>
              <button
                type="button"
                className="mv-mobile-drawer-btn"
                onClick={() => {
                  closeMenu();
                  onOpenAdmin();
                }}
              >
                <LayoutDashboard size={16} className="text-cyan" />
                <span>Admin & Safety Dashboard</span>
              </button>
              <button
                type="button"
                className="mv-mobile-drawer-btn"
                onClick={() => {
                  closeMenu();
                  onOpenContact();
                }}
              >
                <User size={16} />
                <span>Contact Project</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

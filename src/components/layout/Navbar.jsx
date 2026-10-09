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
  QrCode,
  Gauge
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function Navbar({
  onOpenContact,
  onSelectScanTab,
  onOpenHistory,
  onOpenReport,
  onOpenAlerts,
  onOpenAdmin,
  historyCount = 0
}) {
  const { language, setLanguage, languages, t, currentLanguageMeta } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("home");

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
    setLanguage(newLang);
    setLangMenuOpen(false);
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
            {t("navHome", "Home")}
            {activeNav === "home" && <span className="mv-nav-indicator" />}
          </a>
          <a
            href="#scanner"
            className={activeNav === "scanner" ? "is-active" : ""}
            onClick={(e) => handleNavClick(e, "scanner", "scanner", "scan")}
          >
            {t("navVerify", "Verify Medicine")}
            {activeNav === "scanner" && <span className="mv-nav-indicator" />}
          </a>
          <a
            href="#risk-meter"
            className={activeNav === "risk-meter" ? "is-active" : ""}
            onClick={(e) => handleNavClick(e, "risk-meter", "risk-meter")}
          >
            {t("navRiskMeter", "Risk Meter")}
            {activeNav === "risk-meter" && <span className="mv-nav-indicator" />}
          </a>
          <a
            href="#history"
            className={activeNav === "history" ? "is-active" : ""}
            onClick={(e) => handleNavClick(e, "history", "history")}
          >
            {t("navHistory", "Scan History")}
            {activeNav === "history" && <span className="mv-nav-indicator" />}
          </a>
          <a
            href="#how-it-works"
            className={activeNav === "how-it-works" ? "is-active" : ""}
            onClick={(e) => handleNavClick(e, "how-it-works", "how-it-works")}
          >
            {t("navHowItWorks", "How It Works")}
            {activeNav === "how-it-works" && <span className="mv-nav-indicator" />}
          </a>
          <button
            type="button"
            className="mv-nav-btn-link"
            onClick={onOpenAlerts}
            title="Browse official CDSCO recalls & alerts"
          >
            <ShieldAlert size={14} className="text-emerald" />
            <span>{t("navCdscoAlerts", "CDSCO Alerts")}</span>
          </button>
          <button
            type="button"
            className="mv-nav-btn-link"
            onClick={onOpenAdmin}
            title="Open safety oversight & admin dashboard"
          >
            <LayoutDashboard size={14} className="text-cyan" />
            <span>{t("navAdmin", "Admin Portal")}</span>
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
              title="View Scan History Drawer"
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
              <span>{t("navReportFake", "Report Fake")}</span>
            </button>
          )}

          {/* Multi-Language Selector Dropdown (Supports 11 Indian Languages) */}
          <div className="mv-lang-dropdown-wrapper">
            <button
              type="button"
              className="mv-lang-btn"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              aria-expanded={langMenuOpen}
              aria-label="Select language"
            >
              <Globe size={15} />
              <span className="mv-lang-current-code">{currentLanguageMeta?.nativeName || language.toUpperCase()}</span>
              <ChevronDown size={14} className={`mv-chevron ${langMenuOpen ? "open" : ""}`} />
            </button>

            {langMenuOpen && (
              <div className="mv-lang-menu mv-lang-menu-scrollable">
                <div className="mv-lang-menu-header">
                  <span>Select Indian Language</span>
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    className={`mv-lang-option ${language === l.code ? "active" : ""}`}
                    onClick={() => handleSelectLang(l.code)}
                  >
                    <span className="mv-lang-option-text">
                      <span className="mv-lang-native">{l.nativeName}</span>
                      <span className="mv-lang-en-name">({l.name})</span>
                    </span>
                    {language === l.code && <Check size={14} className="text-emerald" />}
                  </button>
                ))}
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
                {t("navHome", "Home")}
              </a>
              <a
                href="#scanner"
                onClick={(e) => handleNavClick(e, "scanner", "scanner", "scan")}
              >
                {t("navVerify", "Verify Medicine")}
              </a>
              <a
                href="#risk-meter"
                onClick={(e) => handleNavClick(e, "risk-meter", "risk-meter")}
              >
                <Gauge size={16} className="text-emerald inline-icon" />
                <span>{t("navRiskMeter", "Risk Meter")}</span>
              </a>
              <a
                href="#history"
                onClick={(e) => handleNavClick(e, "history", "history")}
              >
                <History size={16} className="text-amber inline-icon" />
                <span>{t("navHistory", "Scan History")}</span>
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => handleNavClick(e, "how-it-works", "how-it-works")}
              >
                {t("navHowItWorks", "How It Works")}
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
                <span>{t("navCdscoAlerts", "CDSCO Quality Alerts")}</span>
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
                <span>{t("navHistory", "Scan History Drawer")} ({historyCount})</span>
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
                <span>{t("navReportFake", "Report Suspicious Medicine")}</span>
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
                <span>{t("navAdmin", "Admin & Safety Dashboard")}</span>
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
                <span>{t("footerContactBtn", "Contact & Support")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

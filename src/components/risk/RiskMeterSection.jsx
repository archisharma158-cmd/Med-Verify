import { useState, useMemo } from "react";
import {
  Gauge,
  Activity,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  RotateCcw,
  Info,
  ChevronRight
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function RiskMeterSection({ activeVerificationResult, onGoToScanner }) {
  const { t } = useLanguage();

  // Interactive Simulator Toggles
  const [simulatorFactors, setSimulatorFactors] = useState({
    cdscoRecall: false,
    expired: false,
    nearExpiry: false,
    duplicateScan: false,
    unverifiedMaker: false,
    barcodeMismatch: false
  });

  const [useLiveScanScore, setUseLiveScanScore] = useState(false);

  // Calculate score based on toggles
  const simulatedScore = useMemo(() => {
    if (useLiveScanScore && activeVerificationResult?.riskAnalysis?.score !== undefined) {
      return activeVerificationResult.riskAnalysis.score;
    }
    let total = 0;
    if (simulatorFactors.cdscoRecall) total += 40;
    if (simulatorFactors.expired) total += 35;
    if (simulatorFactors.nearExpiry) total += 15;
    if (simulatorFactors.duplicateScan) total += 20;
    if (simulatorFactors.unverifiedMaker) total += 15;
    if (simulatorFactors.barcodeMismatch) total += 10;
    return Math.min(100, total);
  }, [simulatorFactors, useLiveScanScore, activeVerificationResult]);

  // Determine category and styling
  const scoreCategory = useMemo(() => {
    if (simulatedScore <= 25) {
      return {
        level: "low",
        color: "#10B981",
        label: t("meterLowZone", "Low Risk (0–25 Safe)"),
        verdict: t("safetyVerdictSafe", "SAFE TO CONSUME: Standard regulatory compliance verified."),
        badgeClass: "mv-risk-badge-low"
      };
    } else if (simulatedScore <= 60) {
      return {
        level: "medium",
        color: "#F59E0B",
        label: t("meterMedZone", "Moderate Concern (26–60 Caution)"),
        verdict: t("safetyVerdictCaution", "PROCEED WITH CAUTION: Check batch expiry and consult pharmacist."),
        badgeClass: "mv-risk-badge-med"
      };
    } else {
      return {
        level: "high",
        color: "#EF4444",
        label: t("meterHighZone", "High Risk Alert (61–100 Danger)"),
        verdict: t("safetyVerdictDanger", "QUARANTINE ADVISORY: Do not consume! High likelihood of counterfeit/recall."),
        badgeClass: "mv-risk-badge-high"
      };
    }
  }, [simulatedScore, t]);

  // Speedometer Needle Angle (-90 deg at 0 to +90 deg at 100)
  const needleAngle = -90 + (simulatedScore / 100) * 180;

  const handleToggle = (key) => {
    setUseLiveScanScore(false);
    setSimulatorFactors((prev) => ({
      ...prev,
      // If toggling expired, turn off near expiry and vice versa
      ...(key === "expired" && !prev.expired ? { nearExpiry: false } : {}),
      ...(key === "nearExpiry" && !prev.nearExpiry ? { expired: false } : {}),
      [key]: !prev[key]
    }));
  };

  const handleResetSimulator = () => {
    setUseLiveScanScore(false);
    setSimulatorFactors({
      cdscoRecall: false,
      expired: false,
      nearExpiry: false,
      duplicateScan: false,
      unverifiedMaker: false,
      barcodeMismatch: false
    });
  };

  return (
    <section className="mv-section mv-risk-meter-section" id="risk-meter" aria-label="Risk Meter">
      <div className="mv-container">
        {/* Section Heading */}
        <div className="mv-section-header text-center">
          <div className="mv-badge-pill">
            <Gauge size={14} className="text-emerald" />
            <span>0–100 SAFETY SCALE</span>
          </div>
          <h2 className="mv-section-title">{t("riskMeterTitle", "Pharmaceutical Risk Meter")}</h2>
          <p className="mv-section-sub">
            {t(
              "riskMeterSubtitle",
              "Explore how CDSCO recalls, expiry dates, duplicate serials, and manufacturer credibility determine medicine safety (0–100 score)."
            )}
          </p>
        </div>

        {/* Live Scan Score Notification if available */}
        {activeVerificationResult && (
          <div className="mv-risk-active-scan-banner">
            <div className="mv-active-scan-info">
              <Activity size={18} className="text-cyan" />
              <span>
                Active scan detected: <strong>{activeVerificationResult.extractedData.medicineName}</strong> (Batch: {activeVerificationResult.extractedData.batchNumber})
              </span>
            </div>
            <button
              type="button"
              className={`mv-btn-sm ${useLiveScanScore ? "mv-btn-primary" : "mv-btn-outline"}`}
              onClick={() => setUseLiveScanScore(!useLiveScanScore)}
            >
              {useLiveScanScore ? "Viewing Active Score" : "Load Active Scan Score"}
            </button>
          </div>
        )}

        {/* Dual Column Layout: Speedometer Visualizer + Interactive Simulator */}
        <div className="mv-risk-meter-grid">
          {/* Left Column: Visual Speedometer Gauge Card */}
          <div className="mv-meter-display-card">
            <div className="mv-meter-top-bar">
              <span className={`mv-risk-pill ${scoreCategory.badgeClass}`}>
                {scoreCategory.label}
              </span>
              <span className="mv-score-pill-value" style={{ color: scoreCategory.color }}>
                {simulatedScore} / 100
              </span>
            </div>

            {/* Speedometer Gauge Visualizer */}
            <div className="mv-speedometer-wrapper">
              <svg viewBox="0 0 300 180" className="mv-speedometer-svg">
                <defs>
                  {/* Gauge Arc Gradient */}
                  <linearGradient id="speedometerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="45%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>

                  {/* Subtle Glow Filter */}
                  <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={scoreCategory.color} floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Background Arc Track */}
                <path
                  d="M 30 150 A 120 120 0 0 1 270 150"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="22"
                  strokeLinecap="round"
                />

                {/* Colored Zones Arc Track */}
                <path
                  d="M 30 150 A 120 120 0 0 1 270 150"
                  fill="none"
                  stroke="url(#speedometerGradient)"
                  strokeWidth="20"
                  strokeLinecap="round"
                  filter="url(#gaugeGlow)"
                />

                {/* Zone Indicators */}
                <text x="35" y="172" fill="#10B981" fontSize="11" fontWeight="700">0 (SAFE)</text>
                <text x="140" y="55" fill="#F59E0B" fontSize="11" fontWeight="700" textAnchor="middle">50 (CAUTION)</text>
                <text x="265" y="172" fill="#EF4444" fontSize="11" fontWeight="700" textAnchor="end">100 (HIGH RISK)</text>

                {/* Animated Needle */}
                <g
                  transform={`rotate(${needleAngle} 150 150)`}
                  className="mv-speedometer-needle-group"
                >
                  <polygon
                    points="146,150 154,150 151,35 149,35"
                    fill={scoreCategory.color}
                    className="mv-needle-poly"
                  />
                  <circle cx="150" cy="150" r="14" fill="#0f172a" stroke={scoreCategory.color} strokeWidth="3" />
                  <circle cx="150" cy="150" r="6" fill={scoreCategory.color} />
                </g>
              </svg>

              {/* Big Score Number */}
              <div className="mv-meter-score-display">
                <span className="mv-big-number" style={{ color: scoreCategory.color }}>
                  {simulatedScore}
                </span>
                <span className="mv-big-label">CONCERN INDEX</span>
              </div>
            </div>

            {/* Verdict Box */}
            <div className={`mv-verdict-box mv-verdict-${scoreCategory.level}`}>
              <div className="mv-verdict-icon">
                {scoreCategory.level === "low" ? (
                  <ShieldCheck size={22} className="text-emerald" />
                ) : scoreCategory.level === "medium" ? (
                  <AlertTriangle size={22} className="text-amber" />
                ) : (
                  <ShieldAlert size={22} className="text-crimson" />
                )}
              </div>
              <div className="mv-verdict-text">
                <strong>{scoreCategory.label.split("(")[0]}</strong>
                <p>{scoreCategory.verdict}</p>
              </div>
            </div>

            {/* Direct Verification CTA */}
            {onGoToScanner && (
              <button
                type="button"
                className="mv-meter-verify-cta-btn"
                onClick={onGoToScanner}
              >
                <span>Check Your Medicine Now</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Right Column: Interactive Risk Factor Simulator */}
          <div className="mv-simulator-control-card">
            <div className="mv-sim-header">
              <div className="mv-sim-title-group">
                <Sliders size={20} className="text-emerald" />
                <h3>{t("simulatorTitle", "Interactive Risk Simulator")}</h3>
              </div>
              <button
                type="button"
                className="mv-sim-reset-btn"
                onClick={handleResetSimulator}
                title="Reset toggles to 0"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>

            <p className="mv-sim-desc">
              {t(
                "simulatorDesc",
                "Toggle risk factors below to see real-time impact on the safety gauge:"
              )}
            </p>

            <div className="mv-simulator-toggles-list">
              {/* Factor 1: CDSCO Recall */}
              <label className={`mv-sim-toggle-item ${simulatorFactors.cdscoRecall ? "is-active" : ""}`}>
                <input
                  type="checkbox"
                  checked={simulatorFactors.cdscoRecall}
                  onChange={() => handleToggle("cdscoRecall")}
                />
                <div className="mv-sim-toggle-label">
                  <span className="mv-sim-factor-name">{t("toggleCdsco", "CDSCO Recall / NSQ Notice (+40)")}</span>
                  <span className="mv-sim-factor-sub">Not of Standard Quality or counterfeit alert list</span>
                </div>
                <span className="mv-sim-pts-pill text-crimson">+40 pts</span>
              </label>

              {/* Factor 2: Expired */}
              <label className={`mv-sim-toggle-item ${simulatorFactors.expired ? "is-active" : ""}`}>
                <input
                  type="checkbox"
                  checked={simulatorFactors.expired}
                  onChange={() => handleToggle("expired")}
                />
                <div className="mv-sim-toggle-label">
                  <span className="mv-sim-factor-name">{t("toggleExpired", "Expired Medicine (+35)")}</span>
                  <span className="mv-sim-factor-sub">Manufacturing shelf-life expired</span>
                </div>
                <span className="mv-sim-pts-pill text-crimson">+35 pts</span>
              </label>

              {/* Factor 3: Near Expiry */}
              <label className={`mv-sim-toggle-item ${simulatorFactors.nearExpiry ? "is-active" : ""}`}>
                <input
                  type="checkbox"
                  checked={simulatorFactors.nearExpiry}
                  onChange={() => handleToggle("nearExpiry")}
                />
                <div className="mv-sim-toggle-label">
                  <span className="mv-sim-factor-name">{t("toggleNearExpiry", "Near Expiry (<90 Days) (+15)")}</span>
                  <span className="mv-sim-factor-sub">Close to expiration date threshold</span>
                </div>
                <span className="mv-sim-pts-pill text-amber">+15 pts</span>
              </label>

              {/* Factor 4: Duplicate Scan */}
              <label className={`mv-sim-toggle-item ${simulatorFactors.duplicateScan ? "is-active" : ""}`}>
                <input
                  type="checkbox"
                  checked={simulatorFactors.duplicateScan}
                  onChange={() => handleToggle("duplicateScan")}
                />
                <div className="mv-sim-toggle-label">
                  <span className="mv-sim-factor-name">{t("toggleDuplicate", "Unusual Repeated Scan (+20)")}</span>
                  <span className="mv-sim-factor-sub">Same serial number scanned on multiple devices</span>
                </div>
                <span className="mv-sim-pts-pill text-amber">+20 pts</span>
              </label>

              {/* Factor 5: Unknown Manufacturer */}
              <label className={`mv-sim-toggle-item ${simulatorFactors.unverifiedMaker ? "is-active" : ""}`}>
                <input
                  type="checkbox"
                  checked={simulatorFactors.unverifiedMaker}
                  onChange={() => handleToggle("unverifiedMaker")}
                />
                <div className="mv-sim-toggle-label">
                  <span className="mv-sim-factor-name">{t("toggleUnknownMfr", "Unverified Manufacturer (+15)")}</span>
                  <span className="mv-sim-factor-sub">Missing or unregistered pharmaceutical license</span>
                </div>
                <span className="mv-sim-pts-pill text-amber">+15 pts</span>
              </label>

              {/* Factor 6: Barcode Mismatch */}
              <label className={`mv-sim-toggle-item ${simulatorFactors.barcodeMismatch ? "is-active" : ""}`}>
                <input
                  type="checkbox"
                  checked={simulatorFactors.barcodeMismatch}
                  onChange={() => handleToggle("barcodeMismatch")}
                />
                <div className="mv-sim-toggle-label">
                  <span className="mv-sim-factor-name">{t("toggleBarcodeErr", "Barcode Format Mismatch (+10)")}</span>
                  <span className="mv-sim-factor-sub">GS1 DataMatrix standard checksum anomaly</span>
                </div>
                <span className="mv-sim-pts-pill text-amber">+10 pts</span>
              </label>
            </div>

            {/* Explanatory footer note */}
            <div className="mv-sim-info-note">
              <Info size={15} />
              <span>
                Based on National Drug Regulatory risk scoring heuristics aligned with CDSCO & WHO guidelines.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

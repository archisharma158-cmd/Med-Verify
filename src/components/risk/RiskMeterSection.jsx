import { useState, useMemo, useEffect } from "react";
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

  // Smoothly animated score for dial and digital readout
  const [displayedScore, setDisplayedScore] = useState(simulatedScore);

  useEffect(() => {
    let start = displayedScore;
    let end = simulatedScore;
    if (start === end) return;

    let startTime = null;
    const duration = 400; // ms
    let animationFrame;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      const val = Math.round(start + (end - start) * ease);
      setDisplayedScore(val);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [simulatedScore]);

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

  // Mathematically anchored needle geometry in SVG coordinates
  // At 0 score: angle is 180 deg (points left to 0 SAFE)
  // At 50 score: angle is 90 deg (points straight up to 50 CAUTION)
  // At 100 score: angle is 0 deg (points right to 100 HIGH RISK)
  const needleGeom = useMemo(() => {
    const cx = 160;
    const cy = 145;
    const needleLength = 78;
    const angleDeg = 180 - (displayedScore / 100) * 180;
    const rad = (angleDeg * Math.PI) / 180;

    const tipX = cx + needleLength * Math.cos(rad);
    const tipY = cy - needleLength * Math.sin(rad);

    const baseWidth = 5.5;
    const leftBaseX = cx + baseWidth * Math.sin(rad);
    const leftBaseY = cy + baseWidth * Math.cos(rad);
    const rightBaseX = cx - baseWidth * Math.sin(rad);
    const rightBaseY = cy - baseWidth * Math.cos(rad);

    const tailX = cx - 14 * Math.cos(rad);
    const tailY = cy + 14 * Math.sin(rad);

    const points = `${tipX.toFixed(1)},${tipY.toFixed(1)} ${rightBaseX.toFixed(1)},${rightBaseY.toFixed(1)} ${tailX.toFixed(1)},${tailY.toFixed(1)} ${leftBaseX.toFixed(1)},${leftBaseY.toFixed(1)}`;

    return { cx, cy, points };
  }, [displayedScore]);

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
                {displayedScore} / 100
              </span>
            </div>

            {/* Speedometer Gauge Visualizer */}
            <div className="mv-speedometer-wrapper">
              <svg viewBox="0 0 320 185" className="mv-speedometer-svg">
                <defs>
                  {/* Gauge Arc Gradient */}
                  <linearGradient id="speedometerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="28%" stopColor="#10B981" />
                    <stop offset="48%" stopColor="#F59E0B" />
                    <stop offset="68%" stopColor="#F59E0B" />
                    <stop offset="85%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>

                  {/* Subtle Glow Filter */}
                  <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={scoreCategory.color} floodOpacity="0.45" />
                  </filter>

                  {/* Needle Drop Shadow */}
                  <filter id="needleShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
                  </filter>
                </defs>

                {/* Background Arc Track */}
                <path
                  d="M 60 145 A 100 100 0 0 1 260 145"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="20"
                  strokeLinecap="round"
                />

                {/* Colored Zones Arc Track */}
                <path
                  d="M 60 145 A 100 100 0 0 1 260 145"
                  fill="none"
                  stroke="url(#speedometerGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  filter="url(#gaugeGlow)"
                />

                {/* Subtle Inner Dash Ring */}
                <path
                  d="M 76 145 A 84 84 0 0 1 244 145"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1.5"
                  strokeDasharray="3 5"
                />

                {/* Graduation Tick Marks */}
                <line x1="44" y1="145" x2="52" y2="145" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="79" y1="74" x2="85" y2="80" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="160" y1="35" x2="160" y2="29" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="241" y1="74" x2="235" y2="80" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="276" y1="145" x2="268" y2="145" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />

                {/* Zone Indicators - Cleanly separated from arc */}
                <text x="56" y="172" fill="#10B981" fontSize="10.5" fontWeight="800" letterSpacing="0.04em" textAnchor="middle">
                  {t("meterSafeLabel", "0 (SAFE)")}
                </text>
                <text x="160" y="20" fill="#F59E0B" fontSize="10.5" fontWeight="800" letterSpacing="0.05em" textAnchor="middle">
                  {t("meterCautionLabel", "50 (CAUTION)")}
                </text>
                <text x="264" y="172" fill="#EF4444" fontSize="10.5" fontWeight="800" letterSpacing="0.04em" textAnchor="middle">
                  {t("meterDangerLabel", "100 (HIGH RISK)")}
                </text>

                {/* Mathematically Anchored Needle & Hub */}
                <g filter="url(#needleShadow)">
                  <polygon
                    points={needleGeom.points}
                    fill={scoreCategory.color}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="0.8"
                  />
                  <circle cx={needleGeom.cx} cy={needleGeom.cy} r="13" fill="#0c1626" stroke={scoreCategory.color} strokeWidth="3" />
                  <circle cx={needleGeom.cx} cy={needleGeom.cy} r="5" fill={scoreCategory.color} />
                </g>
              </svg>

              {/* Big Score Number */}
              <div className="mv-meter-score-display">
                <span className="mv-big-number" style={{ color: scoreCategory.color }}>
                  {displayedScore}
                </span>
                <span className="mv-big-label">{t("meterConcernIndex", "CONCERN INDEX")}</span>
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
                <span>{t("meterCheckCta", "Check Your Medicine Now")}</span>
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

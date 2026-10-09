import { useState } from "react";
import {
  Copy,
  Printer,
  RotateCcw,
  Layers,
  Database,
  EyeOff,
  AlertTriangle,
  Clock,
  Sparkles,
  Check,
  ShieldAlert,
  Bot,
  ChevronDown,
  ChevronUp,
  Info,
  Activity,
  History,
  FileText
} from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import DisclaimerAlert from "../common/DisclaimerAlert";
import PackagingChecklist from "./PackagingChecklist";
import { formatVerificationReport } from "../../services/medicineService";
import { useLanguage } from "../../context/LanguageContext";

export default function VerificationResults({
  result,
  onReset,
  onReportSuspicious,
  onAskAiToExplain,
  onGenerateReport
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showFactorBreakdown, setShowFactorBreakdown] = useState(false);

  if (!result) return null;

  const {
    extractedData,
    catalogMatch,
    expiryAnalysis,
    batchAnalysis,
    cdscoAlert,
    duplicateAnalysis,
    riskAnalysis,
    unverifiedAttributes,
    overallStatus,
    statusBadgeLabel,
    statusDescription,
    disclaimer,
    isDemoMode,
    integrationNote
  } = result;

  const handleCopyReport = async () => {
    try {
      const text = formatVerificationReport(result);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // SVG Gauge calculations (radius = 54, circumference = 2 * PI * 54 = ~339.29)
  const score = riskAnalysis?.score || 10;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <section className="mv-results-section" id="results" aria-label="Medicine Verification Results">
      <div className="mv-container">
        {/* Results Header Card */}
        <div className="mv-results-header-card">
          <div className="mv-results-title-group">
            <div className="mv-results-eyebrow">
              <span className="mv-pulse-dot" />
              <span>{t("resultsTitle", "VERIFICATION EVALUATION SUMMARY")}</span>
            </div>

            <h2>{extractedData.medicineName || "Extracted Packaging Record"}</h2>

            <div className="mv-results-badges-row">
              <StatusBadge type={overallStatus} label={statusBadgeLabel} size="md" />

              {isDemoMode && (
                <StatusBadge
                  type="demo"
                  label="Demo Reference Registry"
                  size="md"
                />
              )}

              <span className="mv-badge mv-badge-neutral">
                Source: {extractedData.source.replace("_", " ").toUpperCase()}
              </span>

              {duplicateAnalysis?.isDuplicate && (
                <span className="mv-badge mv-badge-duplicate">
                  <History size={12} /> Scanned {duplicateAnalysis.scanCount}x
                </span>
              )}
            </div>

            <p className="mv-status-description">{statusDescription}</p>
          </div>

          <div className="mv-results-actions">
            {onGenerateReport && (
              <button
                type="button"
                className="mv-btn-primary mv-btn-report-gen"
                onClick={() => onGenerateReport(result)}
                title="Generate official printable verification dossier"
              >
                <FileText size={16} />
                <span>{t("btnGenerateReport", "Generate Report")}</span>
              </button>
            )}

            {onAskAiToExplain && (
              <button
                type="button"
                className="mv-btn-primary mv-btn-ai-explain"
                onClick={() => onAskAiToExplain(result)}
                title="Explain this result with AI assistant in Hindi or English"
              >
                <Bot size={16} />
                <span>{t("btnExplainAi", "Explain With AI")}</span>
              </button>
            )}

            {onReportSuspicious && (
              <button
                type="button"
                className="mv-btn-outline mv-btn-danger-accent"
                onClick={() => onReportSuspicious(result)}
                title="Report this suspect medicine to safety logs"
              >
                <ShieldAlert size={16} />
                <span>{t("btnReportSuspicious", "Report Defect")}</span>
              </button>
            )}

            <button
              type="button"
              className="mv-btn-outline mv-btn-copy"
              onClick={handleCopyReport}
              title="Copy formatted summary"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? "Copied!" : t("btnCopyReport", "Copy Report")}</span>
            </button>

            <button
              type="button"
              className="mv-btn-outline"
              onClick={handlePrint}
              title="Print inspection record"
            >
              <Printer size={16} />
              <span>{t("btnPrintReport", "Print / Export")}</span>
            </button>

            <button
              type="button"
              className="mv-btn-outline mv-btn-reset"
              onClick={onReset}
            >
              <RotateCcw size={16} />
              <span>{t("btnScanAnother", "Scan Another")}</span>
            </button>
          </div>
        </div>

        {/* CDSCO Regulatory Alert Banner (If Matched) */}
        {cdscoAlert && (
          <div className="mv-cdsco-flagged-banner" role="alert">
            <div className="mv-cdsco-banner-icon">
              <ShieldAlert size={28} />
            </div>
            <div className="mv-cdsco-banner-content">
              <div className="mv-cdsco-banner-title-row">
                <h4>OFFICIAL CDSCO REGULATORY ALERT: {cdscoAlert.alertType} NOTICE</h4>
                <span className="mv-cdsco-pill">{cdscoAlert.id}</span>
              </div>
              <p>
                <strong>Flagged Batch:</strong> {cdscoAlert.batchNumber} | <strong>Authority:</strong> {cdscoAlert.issuingAuthority}
              </p>
              <p className="mv-cdsco-issue-desc">{cdscoAlert.reportedIssue}</p>
              <div className="mv-cdsco-mandate">
                <strong>Mandatory Directive:</strong> {cdscoAlert.recommendedAction}
              </div>
            </div>
          </div>
        )}

        {/* 0-100 Risk Score Gauge & Assessment Card */}
        {riskAnalysis && (
          <div className={`mv-risk-meter-card mv-risk-level-${riskAnalysis.category}`}>
            <div className="mv-risk-meter-main">
              {/* Circular Animated SVG Gauge */}
              <div className="mv-risk-gauge-visual">
                <svg viewBox="0 0 120 120" className="mv-risk-gauge-svg">
                  {/* Background Track */}
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="10"
                  />
                  {/* Animated Progress Arc */}
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={riskAnalysis.color}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    className="mv-gauge-arc-anim"
                  />
                </svg>

                <div className="mv-gauge-center-content">
                  <span className="mv-gauge-score-number" style={{ color: riskAnalysis.color }}>
                    {riskAnalysis.score}
                  </span>
                  <span className="mv-gauge-score-max">/100</span>
                </div>
              </div>

              {/* Score Info Text */}
              <div className="mv-risk-meter-info">
                <div className="mv-risk-level-tag-wrap">
                  <span className={`mv-risk-level-tag mv-tag-${riskAnalysis.category}`}>
                    <Activity size={14} /> {riskAnalysis.label.toUpperCase()}
                  </span>
                  <span className="mv-risk-heuristic-pill">Rule-Based Screening Engine v1</span>
                </div>
                <h3>{t("riskAssessmentTitle", "Screening Risk Assessment")}</h3>
                <p>
                  Calculated using multi-parameter pharmaceutical risk heuristics (expiration status, CDSCO recall matches, manufacturer authorization, and duplicate serial tracking).
                </p>

                <button
                  type="button"
                  className="mv-toggle-factors-btn"
                  onClick={() => setShowFactorBreakdown(!showFactorBreakdown)}
                >
                  <span>{showFactorBreakdown ? t("hideFactors", "Hide Factor Breakdown") : t("viewFactors", "View Contributing Risk Factors")}</span>
                  {showFactorBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {/* Expandable Contributing Factors List */}
            {showFactorBreakdown && (
              <div className="mv-factors-breakdown-tray">
                <h4>Contributing Risk Points ({riskAnalysis.factors.length} Factors Triggered):</h4>
                <div className="mv-factors-grid">
                  {riskAnalysis.factors.map((f, i) => (
                    <div key={i} className={`mv-factor-card mv-factor-${f.type}`}>
                      <div className="mv-factor-head">
                        <span className="mv-factor-name">{f.name}</span>
                        <span className="mv-factor-pts">+{f.points} {t("pointsAdded", "pts")}</span>
                      </div>
                      <p className="mv-factor-desc">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mandatory Safety Alert */}
        <div className="mv-mb-6">
          <DisclaimerAlert
            variant={overallStatus === "cdsco_flagged" || overallStatus === "expired_warning" ? "danger" : "warning"}
            title="CRITICAL MEDICINE SAFETY BOUNDARY NOTICE"
          >
            <p>{disclaimer}</p>
          </DisclaimerAlert>
        </div>

        {/* 3-Column Source & Certainty Breakdown */}
        <div className="mv-sources-grid">
          {/* Column 1: Extracted from User / Scanner */}
          <div className="mv-source-column mv-source-extracted">
            <div className="mv-source-col-header">
              <Layers size={18} />
              <div>
                <h4>1. Extracted Packaging Data</h4>
                <small>Information decoded directly from physical item</small>
              </div>
            </div>

            <div className="mv-source-col-body">
              <div className="mv-data-row">
                <span className="mv-data-label">Product Name:</span>
                <span className="mv-data-val font-semibold">{extractedData.medicineName}</span>
              </div>

              <div className="mv-data-row">
                <span className="mv-data-label">Batch / Lot ID:</span>
                <span className="mv-data-val mono">
                  {extractedData.batchNumber || "Not stamped"}
                </span>
              </div>

              <div className="mv-data-row">
                <span className="mv-data-label">Batch Analysis:</span>
                <span className={`mv-data-val ${batchAnalysis.isValid ? "text-emerald" : "text-amber"}`}>
                  {batchAnalysis.note}
                </span>
              </div>

              <div className="mv-data-row">
                <span className="mv-data-label">Labeled Expiry:</span>
                <span className="mv-data-val mono">
                  {extractedData.expiryDate || "Not stamped"}
                </span>
              </div>

              <div className="mv-data-row">
                <span className="mv-data-label">Shelf Life State:</span>
                <span className={`mv-data-val tag-status-${expiryAnalysis.status}`}>
                  <Clock size={13} /> {expiryAnalysis.label}
                </span>
              </div>

              <div className="mv-data-row">
                <span className="mv-data-label">Manufacturer:</span>
                <span className="mv-data-val">
                  {extractedData.manufacturer || "Not identified"}
                </span>
              </div>

              {duplicateAnalysis?.isDuplicate && (
                <div className="mv-data-row">
                  <span className="mv-data-label">Scan Frequency:</span>
                  <span className="mv-data-val text-amber font-semibold">
                    Scanned {duplicateAnalysis.scanCount} times (Repeated session)
                  </span>
                </div>
              )}

              {extractedData.rawCodeOrText && (
                <div className="mv-extracted-raw-preview">
                  <span className="label">Raw Extracted String:</span>
                  <pre>{extractedData.rawCodeOrText.slice(0, 160)}{extractedData.rawCodeOrText.length > 160 ? "..." : ""}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Matched Reference Standards */}
          <div className="mv-source-column mv-source-matched">
            <div className="mv-source-col-header">
              <Database size={18} />
              <div>
                <h4>2. Reference Catalog Standard</h4>
                <small>Cross-referenced from local demo monograph</small>
              </div>
            </div>

            <div className="mv-source-col-body">
              <div className="mv-demo-integration-banner">
                <Sparkles size={14} />
                <span>{integrationNote}</span>
              </div>

              {catalogMatch ? (
                <>
                  <div className="mv-data-row">
                    <span className="mv-data-label">Standard Monograph:</span>
                    <span className="mv-data-val font-semibold">{catalogMatch.name}</span>
                  </div>

                  <div className="mv-data-row">
                    <span className="mv-data-label">Active Ingredient:</span>
                    <span className="mv-data-val">{catalogMatch.genericName}</span>
                  </div>

                  <div className="mv-data-row">
                    <span className="mv-data-label">Therapeutic Class:</span>
                    <span className="mv-data-val">{catalogMatch.therapeuticClass}</span>
                  </div>

                  <div className="mv-data-row">
                    <span className="mv-data-label">Regulatory Schedule:</span>
                    <span className="mv-data-val font-semibold text-emerald">
                      {catalogMatch.scheduleClass}
                    </span>
                  </div>

                  <div className="mv-data-row">
                    <span className="mv-data-label">Standard Storage:</span>
                    <span className="mv-data-val text-muted text-sm">
                      {catalogMatch.storageAdvice}
                    </span>
                  </div>

                  <div className="mv-data-row">
                    <span className="mv-data-label">Common Packaging:</span>
                    <span className="mv-data-val text-muted text-sm">
                      {catalogMatch.commonPackagingTraits?.packagingType}
                    </span>
                  </div>
                </>
              ) : (
                <div className="mv-no-match-box">
                  <AlertTriangle size={24} className="text-amber" />
                  <h5>No Local Demo Monograph Match</h5>
                  <p>
                    This item is not present in the local demo database. When integrated with official government registers (CDSCO / FDA), real-time lookup will query full national medicine directories.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Strictly Unverified Attributes */}
          <div className="mv-source-column mv-source-unverified">
            <div className="mv-source-col-header">
              <EyeOff size={18} />
              <div>
                <h4>3. Parameters That Remain Unverified</h4>
                <small>Requires physical inspection or laboratory testing</small>
              </div>
            </div>

            <div className="mv-source-col-body">
              <div className="mv-unverified-list">
                {unverifiedAttributes.map((attr, idx) => (
                  <div key={idx} className="mv-unverified-item">
                    <h5>• {attr.title}</h5>
                    <p>{attr.description}</p>
                    <small className="verification-how">
                      <strong>How to verify:</strong> {attr.howToVerify}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Physical Packaging Checklist Section */}
        <div className="mv-mt-8">
          <PackagingChecklist />
        </div>

        {/* Next Steps & Regulatory Help */}
        <div className="mv-results-next-steps">
          <h4>Have Doubts About This Medicine?</h4>
          <p>
            If you notice differences in printing, seal damage, missing manufacturing license numbers, or feel unexpected side effects:
          </p>
          <div className="mv-next-steps-grid">
            <div className="mv-step-box">
              <strong>1. Consult Your Dispensing Pharmacist</strong>
              <p>Bring the medicine and original purchase receipt to your local pharmacy for hands-on comparison.</p>
            </div>
            <div className="mv-step-box">
              <strong>2. Verify on Regulatory Portal</strong>
              <p>Check the CDSCO Sugam portal or US FDA Orange Book to confirm valid manufacturing licenses.</p>
            </div>
            <div className="mv-step-box">
              <strong>3. Report Suspect Batches</strong>
              <p>Call the National Pharmacovigilance Programme helpline at 1800-180-3024 (India) or FDA MedWatch (USA).</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

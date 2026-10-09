import { useState, useMemo, useEffect } from "react";
import {
  History,
  Search,
  Download,
  Trash2,
  RotateCcw,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  Sparkles
} from "lucide-react";
import {
  getScanHistory,
  clearScanHistory,
  removeScanRecord,
  exportScanHistoryCsv
} from "../../services/historyService";
import { useLanguage } from "../../context/LanguageContext";

export default function ScanHistorySection({
  onSelectScan,
  onGenerateReport,
  onReportSuspicious,
  onSampleScanTrigger
}) {
  const { t } = useLanguage();
  const [historyItems, setHistoryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");

  // Load history on mount and listen to window updates
  const refreshHistory = () => {
    setHistoryItems(getScanHistory());
  };

  useEffect(() => {
    refreshHistory();

    const handleStorageChange = () => refreshHistory();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("medify:history-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("medify:history-updated", handleStorageChange);
    };
  }, []);

  // Filtered and searched items
  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      // Risk filter
      if (filterRisk === "low" && item.riskScore > 25) return false;
      if (filterRisk === "medium" && (item.riskScore <= 25 || item.riskScore > 60)) return false;
      if (filterRisk === "high" && item.riskScore <= 60) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.medicineName?.toLowerCase().includes(q);
        const batchMatch = item.batchNumber?.toLowerCase().includes(q);
        const mfrMatch = item.manufacturer?.toLowerCase().includes(q);
        return nameMatch || batchMatch || mfrMatch;
      }
      return true;
    });
  }, [historyItems, filterRisk, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = historyItems.length;
    const safe = historyItems.filter((i) => i.riskScore <= 25).length;
    const flagged = historyItems.filter((i) => i.riskScore > 25).length;
    const recalled = historyItems.filter((i) => i.cdscoAlertMatch || i.riskScore >= 75).length;
    return { total, safe, flagged, recalled };
  }, [historyItems]);

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all medicine scan history?")) {
      clearScanHistory();
      refreshHistory();
    }
  };

  const handleRemoveOne = (id) => {
    removeScanRecord(id);
    refreshHistory();
  };

  const handleExportCsv = () => {
    exportScanHistoryCsv();
  };

  return (
    <section className="mv-section mv-history-section" id="history" aria-label="Scan History Section">
      <div className="mv-container">
        {/* Section Header */}
        <div className="mv-section-header text-center">
          <div className="mv-badge-pill">
            <History size={14} className="text-amber" />
            <span>LOCAL AUDIT TRAIL</span>
          </div>
          <h2 className="mv-section-title">{t("historyTitle", "Medicine Scan History")}</h2>
          <p className="mv-section-sub">
            {t(
              "historySubtitle",
              "Permanent audit log of verified medicines, risk scores, and regulatory alerts on your device."
            )}
          </p>
        </div>

        {/* Metric Cards Banner */}
        <div className="mv-history-metrics-grid">
          <div className="mv-metric-card">
            <div className="mv-metric-num">{stats.total}</div>
            <div className="mv-metric-label">{t("statTotalScans", "Total Scans")}</div>
          </div>
          <div className="mv-metric-card mv-metric-safe">
            <div className="mv-metric-num text-emerald">{stats.safe}</div>
            <div className="mv-metric-label">{t("statSafe", "Verified Safe")}</div>
          </div>
          <div className="mv-metric-card mv-metric-flagged">
            <div className="mv-metric-num text-amber">{stats.flagged}</div>
            <div className="mv-metric-label">{t("statFlagged", "Flagged Risks")}</div>
          </div>
          <div className="mv-metric-card mv-metric-recalled">
            <div className="mv-metric-num text-crimson">{stats.recalled}</div>
            <div className="mv-metric-label">{t("statRecalls", "CDSCO Recalls")}</div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, and Actions */}
        <div className="mv-history-toolbar">
          {/* Search Box */}
          <div className="mv-history-search-wrap">
            <Search size={16} className="mv-search-icon" />
            <input
              type="text"
              placeholder={t("searchHistoryPlaceholder", "Search medicine name, batch number, brand...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mv-history-search-input"
            />
          </div>

          {/* Risk Level Filter Tabs */}
          <div className="mv-history-filter-tabs">
            <button
              type="button"
              className={`mv-filter-tab ${filterRisk === "all" ? "active" : ""}`}
              onClick={() => setFilterRisk("all")}
            >
              {t("filterAll", "All Records")} ({historyItems.length})
            </button>
            <button
              type="button"
              className={`mv-filter-tab mv-tab-low ${filterRisk === "low" ? "active" : ""}`}
              onClick={() => setFilterRisk("low")}
            >
              {t("filterSafe", "Safe (0–25)")}
            </button>
            <button
              type="button"
              className={`mv-filter-tab mv-tab-med ${filterRisk === "medium" ? "active" : ""}`}
              onClick={() => setFilterRisk("medium")}
            >
              {t("filterCaution", "Caution (26–60)")}
            </button>
            <button
              type="button"
              className={`mv-filter-tab mv-tab-high ${filterRisk === "high" ? "active" : ""}`}
              onClick={() => setFilterRisk("high")}
            >
              {t("filterHighRisk", "High Risk (61–100)")}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mv-history-actions-row">
            <button
              type="button"
              className="mv-btn-outline mv-btn-sm"
              onClick={handleExportCsv}
              disabled={historyItems.length === 0}
              title="Download CSV spreadsheet"
            >
              <Download size={14} />
              <span>{t("btnExportCsv", "Export CSV")}</span>
            </button>
            {historyItems.length > 0 && (
              <button
                type="button"
                className="mv-btn-outline mv-btn-sm text-crimson"
                onClick={handleClearAll}
                title="Clear all stored logs"
              >
                <Trash2 size={14} />
                <span>{t("btnClearHistory", "Clear History")}</span>
              </button>
            )}
          </div>
        </div>

        {/* History Cards Grid or Empty State */}
        {filteredItems.length > 0 ? (
          <div className="mv-history-cards-grid">
            {filteredItems.map((item) => {
              const isHigh = item.riskScore > 60;
              const isMed = item.riskScore > 25 && item.riskScore <= 60;
              const isLow = item.riskScore <= 25;

              return (
                <div
                  key={item.id}
                  className={`mv-history-card ${isHigh ? "mv-card-risk-high" : isMed ? "mv-card-risk-med" : "mv-card-risk-low"}`}
                >
                  <div className="mv-hcard-header">
                    <div>
                      <h3 className="mv-hcard-title">{item.medicineName}</h3>
                      <p className="mv-hcard-mfr">{item.manufacturer}</p>
                    </div>

                    <div
                      className={`mv-hcard-score-pill ${
                        isHigh ? "mv-score-high" : isMed ? "mv-score-med" : "mv-score-low"
                      }`}
                    >
                      <span className="mv-hscore-num">{item.riskScore}</span>
                      <span className="mv-hscore-denom">/100</span>
                    </div>
                  </div>

                  <div className="mv-hcard-details-grid">
                    <div className="mv-hcard-detail">
                      <span className="mv-detail-label">Batch:</span>
                      <span className="mv-detail-val font-mono">{item.batchNumber}</span>
                    </div>
                    <div className="mv-hcard-detail">
                      <span className="mv-detail-label">Expiry:</span>
                      <span className="mv-detail-val">{item.expiryDate || "N/A"}</span>
                    </div>
                    <div className="mv-hcard-detail">
                      <span className="mv-detail-label">Source:</span>
                      <span className="mv-detail-val uppercase">{item.source || "SCAN"}</span>
                    </div>
                    <div className="mv-hcard-detail">
                      <span className="mv-detail-label">Date:</span>
                      <span className="mv-detail-val">
                        {item.scannedAt
                          ? new Date(item.scannedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })
                          : "Recent"}
                      </span>
                    </div>
                  </div>

                  {item.cdscoAlertMatch && (
                    <div className="mv-hcard-cdsco-pill">
                      <ShieldAlert size={13} />
                      <span>CDSCO Quality Alert Match</span>
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="mv-hcard-actions">
                    <button
                      type="button"
                      className="mv-haction-btn mv-haction-reverify"
                      onClick={() => onSelectScan && onSelectScan(item)}
                      title="Re-verify this medicine now"
                    >
                      <RotateCcw size={14} />
                      <span>{t("btnReVerify", "Re-Verify")}</span>
                    </button>

                    <button
                      type="button"
                      className="mv-haction-btn mv-haction-report"
                      onClick={() => onGenerateReport && onGenerateReport(item)}
                      title="Generate official safety report"
                    >
                      <FileText size={14} />
                      <span>{t("btnGenerateReport", "Report")}</span>
                    </button>

                    {item.riskScore > 25 && onReportSuspicious && (
                      <button
                        type="button"
                        className="mv-haction-btn mv-haction-defect"
                        onClick={() => onReportSuspicious(item)}
                        title="Submit defect report"
                      >
                        <AlertTriangle size={14} />
                        <span>{t("btnReportDefect", "Defect")}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="mv-haction-btn mv-haction-delete"
                      onClick={() => handleRemoveOne(item.id)}
                      title="Remove record"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State with Sample Test Triggers */
          <div className="mv-history-empty-card">
            <div className="mv-empty-icon-wrap">
              <History size={36} className="text-emerald" />
            </div>
            <h3>{t("noHistoryTitle", "No scan history recorded yet")}</h3>
            <p>
              {t(
                "noHistoryDesc",
                "Scan a medicine using QR or OCR above, or test these common medicines:"
              )}
            </p>

            <div className="mv-sample-scans-row">
              <button
                type="button"
                className="mv-sample-chip mv-chip-safe"
                onClick={() =>
                  onSampleScanTrigger &&
                  onSampleScanTrigger({
                    medicineName: "Dolo 650 Tablet",
                    batchNumber: "DL24890",
                    manufacturer: "Micro Labs Ltd",
                    expiryDate: "12/2027",
                    source: "sample_dolo"
                  })
                }
              >
                <ShieldCheck size={14} className="text-emerald" />
                <span>{t("trySampleDolo", "Test Dolo 650 (Safe)")}</span>
              </button>

              <button
                type="button"
                className="mv-sample-chip mv-chip-recall"
                onClick={() =>
                  onSampleScanTrigger &&
                  onSampleScanTrigger({
                    medicineName: "Pan 40 Tablet",
                    batchNumber: "PN23999",
                    manufacturer: "Alkem Laboratories",
                    expiryDate: "10/2026",
                    source: "sample_pan40"
                  })
                }
              >
                <ShieldAlert size={14} className="text-crimson" />
                <span>{t("trySamplePan", "Test Pan 40 (CDSCO Recall)")}</span>
              </button>

              <button
                type="button"
                className="mv-sample-chip mv-chip-safe"
                onClick={() =>
                  onSampleScanTrigger &&
                  onSampleScanTrigger({
                    medicineName: "Augmentin 625 Duo",
                    batchNumber: "AG24102",
                    manufacturer: "GlaxoSmithKline",
                    expiryDate: "08/2027",
                    source: "sample_augmentin"
                  })
                }
              >
                <ShieldCheck size={14} className="text-emerald" />
                <span>{t("trySampleAug", "Test Augmentin 625 (Safe)")}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

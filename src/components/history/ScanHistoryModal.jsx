import { useState, useEffect } from "react";
import {
  X,
  History,
  Download,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Calendar,
  AlertCircle,
  FileCheck,
  Search,
  Filter,
  FileText
} from "lucide-react";
import { getScanHistory, clearScanHistory, exportScanHistoryCsv } from "../../services/historyService";

export default function ScanHistoryModal({
  isOpen,
  onClose,
  onSelectScan,
  onGenerateReport
}) {
  const [historyList, setHistoryList] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHistoryList(getScanHistory());
      setConfirmClear(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    const csvContent = exportScanHistoryCsv();
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `medify_scan_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearHistory = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearScanHistory();
    setHistoryList([]);
    setConfirmClear(false);
  };

  const filteredHistory = historyList.filter((item) => {
    if (filter !== "all" && item.riskCategory !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.medicineName || "").toLowerCase().includes(q);
      const matchBatch = (item.batchNumber || "").toLowerCase().includes(q);
      const matchMfr = (item.manufacturer || "").toLowerCase().includes(q);
      return matchName || matchBatch || matchMfr;
    }
    return true;
  });

  return (
    <div className="mv-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <div className="mv-modal-dialog mv-modal-history-dialog">
        <div className="mv-modal-header">
          <div className="mv-modal-title-group">
            <div className="mv-history-icon-badge">
              <History size={20} />
            </div>
            <div>
              <h3 id="history-modal-title">Medicine Scan History</h3>
              <p className="mv-modal-subtitle">Review previous barcode, OCR, and manual verification records</p>
            </div>
          </div>
          <button
            type="button"
            className="mv-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mv-modal-body">
          {/* Controls Bar */}
          <div className="mv-history-controls-bar">
            {/* Search Input */}
            <div className="mv-history-search-wrap">
              <Search size={16} className="mv-search-icon" />
              <input
                type="text"
                placeholder="Search by medicine, batch, manufacturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Chips */}
            <div className="mv-history-filter-chips">
              <button
                type="button"
                className={`mv-chip ${filter === "all" ? "is-active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All ({historyList.length})
              </button>
              <button
                type="button"
                className={`mv-chip mv-chip-low ${filter === "low" ? "is-active" : ""}`}
                onClick={() => setFilter("low")}
              >
                🟢 Low Risk ({historyList.filter((h) => h.riskCategory === "low").length})
              </button>
              <button
                type="button"
                className={`mv-chip mv-chip-med ${filter === "medium" ? "is-active" : ""}`}
                onClick={() => setFilter("medium")}
              >
                🟡 Medium ({historyList.filter((h) => h.riskCategory === "medium").length})
              </button>
              <button
                type="button"
                className={`mv-chip mv-chip-high ${filter === "high" ? "is-active" : ""}`}
                onClick={() => setFilter("high")}
              >
                🔴 High Risk ({historyList.filter((h) => h.riskCategory === "high").length})
              </button>
            </div>

            {/* Export & Clear Actions */}
            <div className="mv-history-action-btns">
              <button
                type="button"
                className="mv-btn-outline mv-btn-sm"
                onClick={handleExportCsv}
                disabled={historyList.length === 0}
                title="Export scan logs to CSV"
              >
                <Download size={14} /> Export CSV
              </button>

              <button
                type="button"
                className={`mv-btn-outline mv-btn-sm ${confirmClear ? "mv-btn-danger" : ""}`}
                onClick={handleClearHistory}
                disabled={historyList.length === 0}
              >
                <Trash2 size={14} /> {confirmClear ? "Confirm Clear?" : "Clear All"}
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="mv-history-list-wrap">
            {filteredHistory.length === 0 ? (
              <div className="mv-history-empty-state">
                <FileCheck size={44} className="mv-empty-icon text-muted" />
                <h4>No Scan Records Found</h4>
                <p>
                  {historyList.length === 0
                    ? "You haven't scanned or verified any medicines yet. Use the barcode or OCR scanner to inspect medicine packaging."
                    : "No scan matches your search query or selected filter criteria."}
                </p>
              </div>
            ) : (
              <div className="mv-history-cards-grid">
                {filteredHistory.map((item) => (
                  <div key={item.id} className={`mv-history-card mv-risk-border-${item.riskCategory}`}>
                    <div className="mv-history-card-top">
                      <div className="mv-history-card-title-wrap">
                        <h4>{item.medicineName}</h4>
                        <div className="mv-history-meta-row">
                          <span className="mv-history-meta-batch">Batch: <strong>{item.batchNumber}</strong></span>
                          <span className="mv-history-meta-mfr">{item.manufacturer}</span>
                        </div>
                      </div>

                      <div className="mv-history-score-badge">
                        <span className={`mv-score-pill mv-score-${item.riskCategory}`}>
                          {item.riskScore}/100
                        </span>
                        <small>{item.riskCategory.toUpperCase()}</small>
                      </div>
                    </div>

                    <div className="mv-history-card-bottom">
                      <div className="mv-history-tags-row">
                        <span className="mv-tag mv-tag-source">
                          {item.source.toUpperCase()}
                        </span>
                        {item.cdscoAlertFlag && (
                          <span className="mv-tag mv-tag-alert">
                            <ShieldAlert size={12} /> CDSCO FLAGGED
                          </span>
                        )}
                        <span className="mv-tag-time">
                          <Calendar size={12} /> {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="mv-hmodal-actions-pair">
                        {onGenerateReport && (
                          <button
                            type="button"
                            className="mv-btn-history-report"
                            onClick={() => {
                              onGenerateReport(item);
                            }}
                            title="Generate Official Dossier Report"
                          >
                            <FileText size={13} />
                            <span>Report</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="mv-btn-view-scan"
                          onClick={() => {
                            onSelectScan(item);
                            onClose();
                          }}
                        >
                          <span>Inspect Record</span>
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

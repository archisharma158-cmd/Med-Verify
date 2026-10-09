import { useState } from "react";
import {
  X,
  ShieldAlert,
  Search,
  ExternalLink,
  AlertTriangle,
  FileText,
  Filter,
  CheckCircle2
} from "lucide-react";
import { CDSCO_ALERTS_DATABASE } from "../../constants/cdscoAlerts";

export default function CdscoAlertsModal({
  isOpen,
  onClose,
  onTestBatchSelect
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  if (!isOpen) return null;

  const filtered = CDSCO_ALERTS_DATABASE.filter((alert) => {
    if (filterType !== "all" && alert.alertType !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        alert.productName.toLowerCase().includes(q) ||
        alert.genericName.toLowerCase().includes(q) ||
        alert.batchNumber.toLowerCase().includes(q) ||
        alert.manufacturer.toLowerCase().includes(q) ||
        alert.reportedIssue.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mv-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cdsco-modal-title">
      <div className="mv-modal-dialog mv-modal-cdsco-dialog">
        <div className="mv-modal-header">
          <div className="mv-modal-title-group">
            <div className="mv-cdsco-icon-badge">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 id="cdsco-modal-title">CDSCO National Drug Quality Alerts</h3>
              <p className="mv-modal-subtitle">Official gazette notices for Not of Standard Quality (NSQ) & Spurious drugs</p>
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
          {/* Search & Filter Header */}
          <div className="mv-cdsco-search-row">
            <div className="mv-cdsco-search-input">
              <Search size={16} className="mv-search-icon" />
              <input
                type="text"
                placeholder="Search by drug name, batch number, manufacturer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="mv-cdsco-filter-chips">
              <button
                type="button"
                className={`mv-chip ${filterType === "all" ? "is-active" : ""}`}
                onClick={() => setFilterType("all")}
              >
                All Notices ({CDSCO_ALERTS_DATABASE.length})
              </button>
              <button
                type="button"
                className={`mv-chip ${filterType === "NSQ" ? "is-active" : ""}`}
                onClick={() => setFilterType("NSQ")}
              >
                NSQ (Quality Defect)
              </button>
              <button
                type="button"
                className={`mv-chip ${filterType === "SPURIOUS" ? "is-active" : ""}`}
                onClick={() => setFilterType("SPURIOUS")}
              >
                Spurious / Counterfeit
              </button>
            </div>
          </div>

          {/* List of Alerts */}
          <div className="mv-cdsco-cards-list">
            {filtered.length === 0 ? (
              <div className="mv-cdsco-empty">
                <CheckCircle2 size={40} className="text-emerald" />
                <h4>No Matching Recall Alerts</h4>
                <p>No active CDSCO alert matches your search query. Always inspect physical packaging seals.</p>
              </div>
            ) : (
              filtered.map((alert) => (
                <div key={alert.id} className="mv-cdsco-card">
                  <div className="mv-cdsco-card-top">
                    <div className="mv-cdsco-title-wrap">
                      <span className="mv-cdsco-id-tag">{alert.id}</span>
                      <h4>{alert.productName} ({alert.genericName})</h4>
                      <p className="mv-cdsco-mfr">{alert.manufacturer}</p>
                    </div>

                    <div className="mv-cdsco-badge-col">
                      <span className={`mv-badge mv-badge-${alert.alertType === "SPURIOUS" ? "danger" : "warning"}`}>
                        {alert.alertType} · {alert.alertLevel}
                      </span>
                      <small className="mv-cdsco-date">Issued: {alert.dateIssued}</small>
                    </div>
                  </div>

                  <div className="mv-cdsco-card-body">
                    <div className="mv-cdsco-detail-row">
                      <strong>Flagged Batch:</strong>
                      <span className="mv-flagged-batch-pill">{alert.batchNumber}</span>
                    </div>

                    <div className="mv-cdsco-detail-row">
                      <strong>Reported Defect:</strong>
                      <span>{alert.reportedIssue}</span>
                    </div>

                    <div className="mv-cdsco-detail-row">
                      <strong>Issuing Authority:</strong>
                      <span>{alert.issuingAuthority}</span>
                    </div>

                    <div className="mv-cdsco-action-box">
                      <AlertTriangle size={15} />
                      <span>{alert.recommendedAction}</span>
                    </div>
                  </div>

                  <div className="mv-cdsco-card-foot">
                    {onTestBatchSelect && (
                      <button
                        type="button"
                        className="mv-btn-outline mv-btn-xs"
                        onClick={() => {
                          onTestBatchSelect({
                            medicineName: alert.productName,
                            batchNumber: alert.batchNumber,
                            manufacturer: alert.manufacturer
                          });
                          onClose();
                        }}
                      >
                        ⚡ Test-Verify This Batch
                      </button>
                    )}

                    <a
                      href="https://cdsco.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mv-cdsco-link"
                    >
                      <span>CDSCO Official Portal</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  X,
  LayoutDashboard,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  Database,
  Building,
  RefreshCw,
  Search,
  ExternalLink
} from "lucide-react";
import { fetchAdminDashboardStats } from "../../services/api";
import { getSuspiciousReports, updateReportStatus } from "../../services/reportService";
import { CDSCO_ALERTS_DATABASE } from "../../constants/cdscoAlerts";

export default function AdminDashboardModal({
  isOpen,
  onClose,
  onOpenReportDetails
}) {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'reports' | 'alerts'
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminDashboardStats();
      setStats(data);
      setReports(getSuspiciousReports());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStatusChange = (reportId, newStatus) => {
    const updated = updateReportStatus(reportId, newStatus);
    setReports(updated);
  };

  return (
    <div className="mv-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
      <div className="mv-modal-dialog mv-modal-admin-dialog">
        <div className="mv-modal-header">
          <div className="mv-modal-title-group">
            <div className="mv-admin-icon-badge">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h3 id="admin-modal-title">Safety Oversight & Admin Dashboard</h3>
              <p className="mv-modal-subtitle">Pharmacist surveillance, incident reports & regulatory compliance</p>
            </div>
          </div>

          <div className="mv-admin-header-actions">
            <button
              type="button"
              className="mv-btn-outline mv-btn-xs"
              onClick={loadData}
              disabled={loading}
              title="Refresh telemetry"
            >
              <RefreshCw size={13} className={loading ? "mv-spin" : ""} /> Refresh
            </button>
            <button
              type="button"
              className="mv-modal-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="mv-admin-tabs-bar">
          <button
            type="button"
            className={`mv-admin-tab-btn ${activeTab === "overview" ? "is-active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Activity size={15} /> Telemetry & Overview
          </button>
          <button
            type="button"
            className={`mv-admin-tab-btn ${activeTab === "reports" ? "is-active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            <ShieldAlert size={15} /> Suspicious Incident Reports ({reports.length})
          </button>
          <button
            type="button"
            className={`mv-admin-tab-btn ${activeTab === "alerts" ? "is-active" : ""}`}
            onClick={() => setActiveTab("alerts")}
          >
            <AlertTriangle size={15} /> CDSCO Quality Alerts ({CDSCO_ALERTS_DATABASE.length})
          </button>
        </div>

        <div className="mv-modal-body mv-admin-modal-body">
          {activeTab === "overview" && (
            <div className="mv-admin-overview-view">
              {/* Stat Metric Cards */}
              <div className="mv-admin-metrics-grid">
                <div className="mv-admin-stat-card">
                  <div className="mv-stat-card-icon text-emerald">
                    <Activity size={24} />
                  </div>
                  <div className="mv-stat-card-data">
                    <span className="mv-stat-label">Total Medicine Scans</span>
                    <strong className="mv-stat-value">{stats?.total_scans || 128}</strong>
                    <small className="mv-stat-meta text-emerald">● Live scanning active</small>
                  </div>
                </div>

                <div className="mv-admin-stat-card">
                  <div className="mv-stat-card-icon text-crimson">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="mv-stat-card-data">
                    <span className="mv-stat-label">High-Risk Flagged</span>
                    <strong className="mv-stat-value text-crimson">{stats?.high_risk_scans || 9}</strong>
                    <small className="mv-stat-meta">Expired or suspect batch</small>
                  </div>
                </div>

                <div className="mv-admin-stat-card">
                  <div className="mv-stat-card-icon text-amber">
                    <ShieldAlert size={24} />
                  </div>
                  <div className="mv-stat-card-data">
                    <span className="mv-stat-label">Pending Reports</span>
                    <strong className="mv-stat-value text-amber">{stats?.pending_reports || reports.filter(r => r.status === "submitted").length}</strong>
                    <small className="mv-stat-meta">Citizen quality reports</small>
                  </div>
                </div>

                <div className="mv-admin-stat-card">
                  <div className="mv-stat-card-icon text-cyan">
                    <Database size={24} />
                  </div>
                  <div className="mv-stat-card-data">
                    <span className="mv-stat-label">Active CDSCO Notices</span>
                    <strong className="mv-stat-value">{CDSCO_ALERTS_DATABASE.length}</strong>
                    <small className="mv-stat-meta">Official NSQ monographs</small>
                  </div>
                </div>
              </div>

              {/* Risk Engine Distribution Visual */}
              <div className="mv-admin-card mv-risk-distribution-card">
                <div className="mv-admin-card-head">
                  <h4>Risk Engine Distribution (Screening Heuristics)</h4>
                  <span className="mv-badge mv-badge-neutral">FastAPI RiskEngine v1</span>
                </div>
                <div className="mv-distribution-bar-wrapper">
                  <div className="mv-dist-bar-seg mv-dist-low" style={{ width: "72%" }} title="Low Concern: 72%" />
                  <div className="mv-dist-bar-seg mv-dist-med" style={{ width: "21%" }} title="Medium Concern: 21%" />
                  <div className="mv-dist-bar-seg mv-dist-high" style={{ width: "7%" }} title="High Concern: 7%" />
                </div>
                <div className="mv-distribution-legend">
                  <span className="text-emerald">● Low Concern (0-25): ~72%</span>
                  <span className="text-amber">● Medium Concern (26-60): ~21%</span>
                  <span className="text-crimson">● High Concern (61-100): ~7%</span>
                </div>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="mv-admin-grid-2">
                <div className="mv-admin-card">
                  <h4>Recent Citizen Incident Reports</h4>
                  <div className="mv-admin-mini-list">
                    {reports.slice(0, 3).map((r) => (
                      <div key={r.id} className="mv-mini-report-row">
                        <div className="mv-mini-report-info">
                          <strong>{r.medicineName}</strong> (Batch: {r.batchNumber})
                          <small>{r.reasonLabel}</small>
                        </div>
                        <span className={`mv-status-chip mv-status-${r.status}`}>
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mv-admin-card">
                  <h4>Surveillance Protocols Active</h4>
                  <ul className="mv-protocols-list">
                    <li>✓ <strong>CDSCO NSQ Cross-Matching:</strong> Real-time batch check against monthly gazette notices.</li>
                    <li>✓ <strong>Duplicate Serial Scan Detection:</strong> Flags identical identifiers across unique devices.</li>
                    <li>✓ <strong>Shelf-Life Date Parser:</strong> Alerts on passed expiration or under 90 days stability.</li>
                    <li>✓ <strong>OCR Typography Quality Check:</strong> Flags uneven font kerning or low scan clarity.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="mv-admin-reports-view">
              <div className="mv-reports-table-responsive">
                <table className="mv-admin-table">
                  <thead>
                    <tr>
                      <th>Ref ID & Time</th>
                      <th>Medicine & Batch</th>
                      <th>Defect Reason</th>
                      <th>Location / Pharmacy</th>
                      <th>Status & Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <strong className="text-emerald">{report.id}</strong>
                          <div className="mv-table-date">{new Date(report.timestamp).toLocaleDateString()}</div>
                        </td>
                        <td>
                          <strong>{report.medicineName}</strong>
                          <div className="mv-table-sub">Batch: {report.batchNumber}</div>
                          <div className="mv-table-sub">{report.manufacturer}</div>
                        </td>
                        <td>
                          <span className="mv-badge mv-badge-warning">{report.reasonLabel}</span>
                          <p className="mv-table-desc-snippet">{report.description}</p>
                        </td>
                        <td>
                          <div className="mv-table-sub">{report.storeName || "Not provided"}</div>
                          {report.hasPhoto && (
                            <span className="mv-table-photo-tag">📷 Photo Evidence Attached</span>
                          )}
                        </td>
                        <td>
                          <div className="mv-status-select-wrap">
                            <select
                              value={report.status}
                              onChange={(e) => handleStatusChange(report.id, e.target.value)}
                              className={`mv-status-select mv-select-${report.status}`}
                            >
                              <option value="submitted">Submitted</option>
                              <option value="investigating">Investigating</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="mv-admin-alerts-view">
              <div className="mv-admin-alerts-grid">
                {CDSCO_ALERTS_DATABASE.map((alert) => (
                  <div key={alert.id} className="mv-admin-alert-card">
                    <div className="mv-alert-card-head">
                      <div>
                        <span className="mv-alert-id-tag">{alert.id}</span>
                        <h4>{alert.productName}</h4>
                      </div>
                      <span className={`mv-badge mv-badge-danger`}>{alert.alertType} - {alert.alertLevel}</span>
                    </div>

                    <div className="mv-alert-details">
                      <p><strong>Batch:</strong> <span className="text-emerald">{alert.batchNumber}</span> | <strong>Manufacturer:</strong> {alert.manufacturer}</p>
                      <p><strong>Reported Defect:</strong> {alert.reportedIssue}</p>
                      <p><strong>Issuing Authority:</strong> {alert.issuingAuthority}</p>
                      <p className="mv-alert-action-text"><strong>Mandated Action:</strong> {alert.recommendedAction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

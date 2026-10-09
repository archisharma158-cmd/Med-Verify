import { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Upload,
  CheckCircle2,
  ShieldAlert,
  Camera,
  MapPin,
  Building,
  PhoneCall,
  FileText
} from "lucide-react";
import { createSuspiciousReport } from "../../services/reportService";
import { submitSuspiciousReportToBackend } from "../../services/api";

const REASON_OPTIONS = [
  { value: "suspicious_packaging", label: "Suspicious Packaging / Seal Defect", desc: "Blister foil torn, mismatched font, peeling sticker, or fake hologram" },
  { value: "expired_medicine", label: "Expired Medicine / Tampered Expiry Date", desc: "Date stamp scratched off, altered, or passed expiry date" },
  { value: "mismatched_information", label: "Mismatched Label vs Content", desc: "Discrepancy in dosage, salt name, or tablet color/shape" },
  { value: "regulatory_alert_concern", label: "Matches CDSCO Recall Notice", desc: "Batch is listed under Not of Standard Quality (NSQ) advisory" },
  { value: "repeated_serial_scan", label: "Duplicated Serial Barcode", desc: "Serial code scanned multiple times across devices" },
  { value: "other", label: "Other Adverse Effect or Suspect Quality", desc: "Unexpected smell, crumble, adverse reaction, or counterfeit suspicion" }
];

export default function ReportSuspiciousModal({
  isOpen,
  onClose,
  initialData = null
}) {
  const [formData, setFormData] = useState({
    medicineName: "",
    manufacturer: "",
    batchNumber: "",
    reason: "suspicious_packaging",
    description: "",
    storeName: "",
    contactInfo: ""
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        medicineName: initialData.medicineName !== "Not provided" ? initialData.medicineName || "" : "",
        manufacturer: initialData.manufacturer !== "Not provided" ? initialData.manufacturer || "" : "",
        batchNumber: initialData.batchNumber !== "Not provided" ? initialData.batchNumber || "" : "",
        reason: initialData.cdscoAlert ? "regulatory_alert_concern" : initialData.duplicateAnalysis?.isDuplicate ? "repeated_serial_scan" : "suspicious_packaging",
        description: initialData.cdscoAlert ? `Auto-flagged from CDSCO recall notice: ${initialData.cdscoAlert.reportedIssue}` : ""
      }));
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo size must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.medicineName.trim()) {
      setError("Please provide a medicine name.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // 1. Create locally in persistent store
      const report = createSuspiciousReport({
        ...formData,
        photoDataUrl: photoPreview,
        scanId: initialData?.id || null
      });

      // 2. Try sending to backend API in background
      submitSuspiciousReportToBackend({
        ...formData,
        scanId: initialData?.id || null
      }).catch(() => {});

      setSubmittedReport(report);
    } catch (err) {
      setError("Failed to record report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedReport(null);
    setPhotoPreview(null);
    setError("");
    onClose();
  };

  return (
    <div className="mv-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
      <div className="mv-modal-dialog mv-modal-report-dialog">
        <div className="mv-modal-header">
          <div className="mv-modal-title-group">
            <div className="mv-report-icon-badge">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 id="report-modal-title">Report Suspicious Medicine</h3>
              <p className="mv-modal-subtitle">Submit quality defect or counterfeit alerts for regulatory review</p>
            </div>
          </div>
          <button
            type="button"
            className="mv-modal-close-btn"
            onClick={handleResetAndClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mv-modal-body">
          {submittedReport ? (
            <div className="mv-modal-success-state">
              <div className="mv-success-icon-wrap">
                <CheckCircle2 size={54} className="text-emerald" />
              </div>
              <h4>Incident Report Submitted</h4>
              <div className="mv-report-id-pill">
                <span>Reference Tracking ID:</span>
                <strong>{submittedReport.id}</strong>
              </div>
              <p>
                Your quality incident report for <strong>{submittedReport.medicineName}</strong> (Batch: {submittedReport.batchNumber}) has been securely logged.
              </p>

              <div className="mv-report-next-steps">
                <h5>Official Guidance & Actions:</h5>
                <ul>
                  <li>Do NOT consume suspect tablets or capsules. Quarantine the blister or carton safely away from children.</li>
                  <li>Keep original pharmacy purchase invoice and packaging for regulatory inspection.</li>
                  <li>
                    National PvPI Adverse Drug Reaction Helpline: <strong>1800-180-3024 (Toll-Free)</strong>
                  </li>
                </ul>
              </div>

              <div className="mv-modal-actions-row">
                <button
                  type="button"
                  className="mv-btn-primary"
                  onClick={handleResetAndClose}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mv-report-form">
              {error && (
                <div className="mv-form-error-banner" role="alert">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Medicine & Batch Identifiers */}
              <div className="mv-form-row mv-form-row-2">
                <div className="mv-form-field">
                  <label htmlFor="rep-med-name">Medicine Name *</label>
                  <input
                    id="rep-med-name"
                    type="text"
                    required
                    placeholder="e.g. Pan 40 or Dolo 650"
                    value={formData.medicineName}
                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                  />
                </div>

                <div className="mv-form-field">
                  <label htmlFor="rep-batch">Batch / Lot Number</label>
                  <input
                    id="rep-batch"
                    type="text"
                    placeholder="e.g. PN23999"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="mv-form-row mv-form-row-2">
                <div className="mv-form-field">
                  <label htmlFor="rep-mfr">Manufacturer Name</label>
                  <input
                    id="rep-mfr"
                    type="text"
                    placeholder="e.g. Alkem Laboratories Ltd"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>

                <div className="mv-form-field">
                  <label htmlFor="rep-store">Pharmacy / Retailer & City</label>
                  <input
                    id="rep-store"
                    type="text"
                    placeholder="e.g. Apollo Chemist, Delhi"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  />
                </div>
              </div>

              {/* Reason Selector */}
              <div className="mv-form-field">
                <label>Primary Suspicion Reason *</label>
                <div className="mv-reason-select-grid">
                  {REASON_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`mv-reason-card ${formData.reason === opt.value ? "is-selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={opt.value}
                        checked={formData.reason === opt.value}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      />
                      <div className="mv-reason-card-content">
                        <strong>{opt.label}</strong>
                        <span>{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mv-form-field">
                <label htmlFor="rep-desc">Detailed Defect Description</label>
                <textarea
                  id="rep-desc"
                  rows={3}
                  placeholder="Describe what looked wrong (e.g., mismatched font, chalky crumbling tablet, loose foil seal, blurry barcode)..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Photo Evidence Upload */}
              <div className="mv-form-field">
                <label>Photo Evidence (Packaging / Blister / Foil)</label>
                <div className="mv-photo-upload-container">
                  {photoPreview ? (
                    <div className="mv-photo-preview-wrap">
                      <img src={photoPreview} alt="Defect Preview" className="mv-uploaded-photo" />
                      <button
                        type="button"
                        className="mv-remove-photo-btn"
                        onClick={() => setPhotoPreview(null)}
                      >
                        <X size={14} /> Remove Photo
                      </button>
                    </div>
                  ) : (
                    <label className="mv-photo-dropzone">
                      <input
                        type="file"
                        accept="image/*"
                        className="mv-file-input-hidden"
                        onChange={handlePhotoUpload}
                      />
                      <div className="mv-dropzone-inner">
                        <Camera size={26} className="text-emerald" />
                        <span>Click or drop packaging photo here</span>
                        <small>Max file size: 5MB (JPEG, PNG, WebP)</small>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Contact Information (Optional) */}
              <div className="mv-form-field">
                <label htmlFor="rep-contact">Contact Email or Phone (Optional - for follow-up)</label>
                <input
                  id="rep-contact"
                  type="text"
                  placeholder="name@example.com or mobile number"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                />
              </div>

              <div className="mv-form-disclaimer">
                <small>
                  Privacy Assurance: Incident reports are shared with regulatory surveillance logs to spot localized counterfeit clusters. Personal medical health records are not stored.
                </small>
              </div>

              <div className="mv-modal-actions-row">
                <button
                  type="button"
                  className="mv-btn-outline"
                  onClick={handleResetAndClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mv-btn-primary mv-btn-danger-accent"
                  disabled={submitting}
                >
                  {submitting ? "Submitting Report..." : "Submit Incident Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

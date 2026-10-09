/**
 * Suspicious Medicine Reporting Service
 * Implements Feature 10 (Suspicious Medicine Reporting)
 */

const STORAGE_KEY = "medify_suspicious_reports_v1";

const DEFAULT_SEED_REPORTS = [
  {
    id: "REP-2026-8492",
    timestamp: "2025-02-18T10:30:00.000Z",
    medicineName: "Pan 40",
    manufacturer: "Alkem Laboratories Ltd",
    batchNumber: "PN23999",
    reason: "regulatory_alert_concern",
    reasonLabel: "CDSCO Alert / Recalled Batch",
    description: "Retail pharmacy strip matches the national NSQ notice batch. Tablets appeared chalky and crumbled when removed from foil.",
    storeName: "City Medicos, Sector 14, Gurugram",
    status: "investigating",
    contactInfo: "rajesh.k@gmail.com",
    hasPhoto: true,
    riskLevel: "high"
  },
  {
    id: "REP-2026-6120",
    timestamp: "2025-02-12T15:45:00.000Z",
    medicineName: "Augmentin 625 Duo",
    manufacturer: "GlaxoSmithKline",
    batchNumber: "AG99120",
    reason: "suspicious_packaging",
    reasonLabel: "Suspicious Packaging & Seal",
    description: "Blister foil seal was loose with visible brown discoloration around the tablets. Hologram looked like a flat printed sticker without rainbow shift.",
    storeName: "Shree Ganesh Pharmacy, Jaipur",
    status: "submitted",
    contactInfo: "anita.sharma@yahoo.co.in",
    hasPhoto: true,
    riskLevel: "high"
  },
  {
    id: "REP-2026-4019",
    timestamp: "2025-01-29T11:20:00.000Z",
    medicineName: "Cetirizine 10mg",
    manufacturer: "Apex Formulations",
    batchNumber: "CT21090",
    reason: "expired_medicine",
    reasonLabel: "Expired Date Stamp Tampering",
    description: "Expiration date appeared scratched off and re-stamped with a darker ink font.",
    storeName: "Apollo Chemist Branch 4, Delhi",
    status: "resolved",
    contactInfo: "mohit.verma@outlook.com",
    hasPhoto: false,
    riskLevel: "medium"
  }
];

export function getSuspiciousReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with default demo reports so admin dashboard has real data to display
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_REPORTS));
      return DEFAULT_SEED_REPORTS;
    }
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : DEFAULT_SEED_REPORTS;
  } catch (err) {
    console.error("Failed to load reports:", err);
    return DEFAULT_SEED_REPORTS;
  }
}

export function createSuspiciousReport({
  medicineName = "",
  manufacturer = "",
  batchNumber = "",
  reason = "other",
  description = "",
  storeName = "",
  contactInfo = "",
  photoDataUrl = null,
  scanId = null
}) {
  const reports = getSuspiciousReports();
  const idNumber = Math.floor(1000 + Math.random() * 9000);
  const reportId = `REP-${new Date().getFullYear()}-${idNumber}`;

  const REASON_LABELS = {
    suspicious_packaging: "Suspicious Packaging / Blister Defect",
    expired_medicine: "Expired Medicine Sold / Tampered Expiry",
    mismatched_information: "Mismatched Label vs Content",
    repeated_serial_scan: "Duplicated Serial Code Scan",
    regulatory_alert_concern: "CDSCO Regulatory Alert Match",
    other: "Other Quality Concern"
  };

  const newReport = {
    id: reportId,
    timestamp: new Date().toISOString(),
    medicineName: medicineName.trim() || "Unspecified Medicine",
    manufacturer: manufacturer.trim() || "Unspecified",
    batchNumber: batchNumber.trim().toUpperCase() || "N/A",
    reason,
    reasonLabel: REASON_LABELS[reason] || reason,
    description: description.trim(),
    storeName: storeName.trim(),
    contactInfo: contactInfo.trim(),
    hasPhoto: !!photoDataUrl,
    photoDataUrl: photoDataUrl || null,
    scanId: scanId || null,
    status: "submitted",
    riskLevel: reason === "regulatory_alert_concern" || reason === "repeated_serial_scan" ? "high" : "medium"
  };

  const updated = [newReport, ...reports];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to store report:", err);
  }

  return newReport;
}

export function updateReportStatus(reportId, newStatus) {
  const reports = getSuspiciousReports();
  const updated = reports.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to update status:", err);
  }
  return updated;
}

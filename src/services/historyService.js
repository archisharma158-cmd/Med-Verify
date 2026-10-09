/**
 * Scan History & Duplicate Scan Tracking Service
 * Implements Feature 6 (Duplicate Detection) and Feature 11 (Scan History)
 */

const STORAGE_KEY = "medify_scan_history_v1";
const DEVICE_ID_KEY = "medify_device_uuid";

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = "dev-" + Math.random().toString(36).substring(2, 10) + "-" + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Retrieve all past scan records from local storage.
 */
export function getScanHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error("Failed to load scan history:", err);
    return [];
  }
}

/**
 * Check if a batch number or serial has been scanned previously (Duplicate Detection).
 */
export function checkDuplicateScan(batchNumber, serialNumber = "") {
  if (!batchNumber && !serialNumber) {
    return {
      isDuplicate: false,
      scanCount: 0,
      firstScanned: null,
      lastScanned: null,
      anomalyLevel: "none",
      note: "No serial or batch available for duplicate tracking."
    };
  }

  const cleanBatch = (batchNumber || "").trim().toUpperCase();
  const cleanSerial = (serialNumber || "").trim().toUpperCase();
  const history = getScanHistory();

  const matchingScans = history.filter((item) => {
    const itemBatch = (item.batchNumber || "").trim().toUpperCase();
    const itemSerial = (item.serialNumber || "").trim().toUpperCase();

    if (cleanSerial && itemSerial === cleanSerial) return true;
    if (cleanBatch && itemBatch === cleanBatch) return true;
    return false;
  });

  const scanCount = matchingScans.length;

  if (scanCount === 0) {
    return {
      isDuplicate: false,
      scanCount: 1, // Current will be 1st
      firstScanned: new Date().toISOString(),
      lastScanned: null,
      anomalyLevel: "none",
      note: "First time this identifier has been inspected on this client."
    };
  }

  const isAnomaly = scanCount >= 2;
  const anomalyLevel = scanCount >= 4 ? "high" : scanCount >= 2 ? "medium" : "minor";

  return {
    isDuplicate: true,
    scanCount: scanCount + 1,
    previousScansCount: scanCount,
    firstScanned: matchingScans[matchingScans.length - 1].timestamp,
    lastScanned: matchingScans[0].timestamp,
    anomalyLevel,
    note: `Identifier previously inspected ${scanCount} time(s). Repeated serial scans across sessions may indicate duplicate packaging labels.`
  };
}

/**
 * Save a newly verified scan into local history.
 */
export function saveScanRecord(result) {
  if (!result || !result.extractedData) return;

  const history = getScanHistory();
  const recordId = "SCAN-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

  const newEntry = {
    id: recordId,
    timestamp: result.timestamp || new Date().toISOString(),
    medicineName: result.extractedData.medicineName || "Unknown Medicine",
    batchNumber: result.extractedData.batchNumber || "N/A",
    serialNumber: result.extractedData.serialNumber || "",
    expiryDate: result.extractedData.expiryDate || "N/A",
    manufacturer: result.extractedData.manufacturer || "N/A",
    source: result.extractedData.source || "manual",
    riskScore: result.riskAnalysis ? result.riskAnalysis.score : 10,
    riskCategory: result.riskAnalysis ? result.riskAnalysis.category : "low",
    overallStatus: result.overallStatus || "extracted_only",
    statusBadgeLabel: result.statusBadgeLabel || "Verified",
    catalogMatched: !!result.catalogMatch,
    cdscoAlertFlag: !!(result.cdscoAlert || result.riskAnalysis?.cdscoAlert),
    deviceId: getDeviceId()
  };

  // Add to top of array, limit to 100 entries
  const updated = [newEntry, ...history.filter(h => h.id !== recordId)].slice(0, 100);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save scan record:", err);
  }

  return newEntry;
}

/**
 * Clear all scan history.
 */
export function clearScanHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("medify:history-updated"));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a single scan record by ID.
 */
export function removeScanRecord(id) {
  try {
    const history = getScanHistory().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent("medify:history-updated"));
    return true;
  } catch {
    return false;
  }
}

/**
 * Export scan history as CSV formatted string.
 */
export function exportScanHistoryCsv() {
  const history = getScanHistory();
  if (history.length === 0) return "";

  const headers = [
    "Scan ID",
    "Timestamp",
    "Medicine Name",
    "Batch Number",
    "Expiry Date",
    "Manufacturer",
    "Source",
    "Risk Score (0-100)",
    "Risk Category",
    "Status"
  ];

  const rows = history.map((item) => [
    `"${item.id}"`,
    `"${new Date(item.timestamp).toLocaleString()}"`,
    `"${item.medicineName.replace(/"/g, '""')}"`,
    `"${item.batchNumber.replace(/"/g, '""')}"`,
    `"${item.expiryDate}"`,
    `"${item.manufacturer.replace(/"/g, '""')}"`,
    `"${item.source}"`,
    item.riskScore,
    `"${item.riskCategory}"`,
    `"${item.statusBadgeLabel.replace(/"/g, '""')}"`
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

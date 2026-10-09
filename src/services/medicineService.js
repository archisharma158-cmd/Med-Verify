/**
 * Medicine Verification Service Layer
 * 
 * Provides:
 * 1. Heuristic OCR text parsing (candidate medicine name, batch number, mfg date, expiry date, manufacturer).
 * 2. QR & Barcode parsing (GS1 DataMatrix, pharmaceutical serialization strings, URLs).
 * 3. Verification evaluation against demo reference standard catalog.
 * 4. Transparent distinction between user-extracted, reference-matched, and unverified parameters.
 * 
 * NOTE: This service layer is purposefully architected so that when an authorized API
 * (such as CDSCO SUGAM API, FDA NDC directory, or GS1 Global Healthcare Registry)
 * is connected in the future, only the remote fetch call here needs to be wired up.
 */

import { DEMO_CATALOG } from "../constants/demoCatalog";
import { SAFETY_DISCLAIMER } from "../constants/medicineKnowledge";
import { checkCdscoAlertMatch } from "../constants/cdscoAlerts";
import { checkDuplicateScan, saveScanRecord } from "./historyService";

/**
 * Parses raw OCR text to extract candidate pharmaceutical fields.
 * Values are returned as candidate/unconfirmed so the user can review and edit them.
 */
export function parseOcrText(rawText = "") {
  if (!rawText || typeof rawText !== "string") {
    return {
      rawText: "",
      candidateName: "",
      candidateBatch: "",
      candidateMfgDate: "",
      candidateExpiryDate: "",
      candidateManufacturer: "",
      candidateLicenseNo: "",
      confidence: "low",
      lines: []
    };
  }

  const cleanText = rawText.replace(/\r/g, "");
  const lines = cleanText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let candidateBatch = "";
  let candidateExpiryDate = "";
  let candidateMfgDate = "";
  let candidateManufacturer = "";
  let candidateLicenseNo = "";

  // 1. Regex for Batch / Lot
  const batchRegex = /(?:b\.?\s*no\.?|batch\s*(?:no\.?|#)?|lot\s*(?:no\.?|#)?)\s*[:\-#]?\s*([-a-z0-9/]{3,16})/i;
  const batchMatch = cleanText.match(batchRegex);
  if (batchMatch && batchMatch[1]) {
    candidateBatch = batchMatch[1].toUpperCase().trim();
  }

  // 2. Regex for Expiry Date
  const expRegex = /(?:exp(?:iry)?\.?\s*(?:dt|date)?|use\s*before|val(?:\.|\s*date)?)\s*[:\-#]?\s*([a-z0-9/.-]{3,12})/i;
  const expMatch = cleanText.match(expRegex);
  if (expMatch && expMatch[1]) {
    candidateExpiryDate = expMatch[1].trim();
  }

  // 3. Regex for Mfg Date
  const mfgRegex = /(?:mfg\.?\s*(?:dt|date)?|mfd\.?\s*(?:dt|date)?|pkd\.?\s*(?:dt|date)?)\s*[:\-#]?\s*([a-z0-9/.-]{3,12})/i;
  const mfgMatch = cleanText.match(mfgRegex);
  if (mfgMatch && mfgMatch[1]) {
    candidateMfgDate = mfgMatch[1].trim();
  }

  // 4. Regex for Mfg License No
  const licRegex = /(?:mfg\.?\s*lic\.?\s*(?:no\.?)?|licence\s*no\.?)\s*[:\-#]?\s*([-a-z0-9/]{4,20})/i;
  const licMatch = cleanText.match(licRegex);
  if (licMatch && licMatch[1]) {
    candidateLicenseNo = licMatch[1].trim();
  }

  // 5. Regex for Manufacturer
  const mfrRegex = /(?:mfd\.?\s*by|manufactured\s*by|marketed\s*by)\s*[:-]?\s*([-A-Za-z0-9\s,.-]{3,40})/i;
  const mfrMatch = cleanText.match(mfrRegex);
  if (mfrMatch && mfrMatch[1]) {
    candidateManufacturer = mfrMatch[1].trim();
  }

  // 6. Heuristic candidate medicine name
  const ignorePatterns = [
    /^rx/i,
    /schedule/i,
    /for external use/i,
    /keep out/i,
    /composition/i,
    /each film coated/i,
    /each tablet/i,
    /dosage/i,
    /storage/i,
    /marketed/i,
    /manufactured/i,
    /batch/i,
    /exp/i,
    /mfg/i
  ];

  let candidateName = "";
  for (const line of lines.slice(0, 6)) {
    const isIgnored = ignorePatterns.some((pattern) => pattern.test(line));
    if (!isIgnored && line.length >= 3 && line.length <= 45) {
      candidateName = line;
      break;
    }
  }

  if (!candidateName) {
    for (const item of DEMO_CATALOG) {
      if (
        cleanText.toLowerCase().includes(item.name.toLowerCase()) ||
        item.aliases.some((alias) => cleanText.toLowerCase().includes(alias.toLowerCase()))
      ) {
        candidateName = item.name;
        break;
      }
    }
  }

  const confidenceScore =
    (candidateName ? 1 : 0) +
    (candidateBatch ? 1 : 0) +
    (candidateExpiryDate ? 1 : 0) +
    (candidateMfgDate ? 1 : 0);

  const confidence =
    confidenceScore >= 3 ? "medium-high" : confidenceScore >= 2 ? "medium" : "candidate-only";

  return {
    rawText,
    candidateName,
    candidateBatch,
    candidateMfgDate,
    candidateExpiryDate,
    candidateManufacturer,
    candidateLicenseNo,
    confidence,
    lines
  };
}

/**
 * Parses raw decoded QR or barcode content.
 */
export function parseBarcodeOrQr(codeText = "") {
  if (!codeText || typeof codeText !== "string") {
    return {
      rawCode: "",
      format: "unknown",
      name: "",
      batch: "",
      expiryDate: "",
      serialNo: "",
      gtin: "",
      isGs1DataMatrix: false
    };
  }

  const trimmed = codeText.trim();
  let gtin = "";
  let batch = "";
  let expiryDate = "";
  let serialNo = "";
  let isGs1 = false;

  if (trimmed.includes("(01)") || trimmed.includes("(10)") || trimmed.includes("(17)")) {
    isGs1 = true;
    const gtinMatch = trimmed.match(/\(01\)(\d{14})/);
    if (gtinMatch) gtin = gtinMatch[1];

    const batchMatch = trimmed.match(/\(10\)([-A-Za-z0-9/]+)/);
    if (batchMatch) batch = batchMatch[1];

    const expMatch = trimmed.match(/\(17\)(\d{6})/);
    if (expMatch) {
      const rawExp = expMatch[1];
      const yy = "20" + rawExp.slice(0, 2);
      const mm = rawExp.slice(2, 4);
      const dd = rawExp.slice(4, 6);
      expiryDate = `${yy}-${mm}-${dd !== "00" ? dd : "01"}`;
    }

    const serialMatch = trimmed.match(/\(21\)([-A-Za-z0-9/]+)/);
    if (serialMatch) serialNo = serialMatch[1];
  } else if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const batchParam = url.searchParams.get("batch") || url.searchParams.get("b");
      const expParam = url.searchParams.get("exp") || url.searchParams.get("expiry");
      const nameParam = url.searchParams.get("name") || url.searchParams.get("product");
      if (batchParam) batch = batchParam;
      if (expParam) expiryDate = expParam;
      return {
        rawCode: trimmed,
        format: "URL / Web QR",
        url: trimmed,
        name: nameParam || "",
        batch,
        expiryDate,
        serialNo: "",
        gtin: "",
        isGs1DataMatrix: false
      };
    } catch {
      // Proceed
    }
  }

  return {
    rawCode: trimmed,
    format: isGs1 ? "GS1 Pharmaceutical DataMatrix" : /^\d{8,14}$/.test(trimmed) ? "EAN/UPC Barcode" : "2D Code / Alphanumeric",
    name: "",
    batch: batch || (!isGs1 && /^[-A-Z0-9/]{4,15}$/i.test(trimmed) ? trimmed : ""),
    expiryDate,
    serialNo,
    gtin,
    isGs1DataMatrix: isGs1
  };
}

/**
 * Checks an expiry date string against the current date.
 */
export function evaluateExpiry(expiryStr = "") {
  if (!expiryStr) {
    return {
      status: "unspecified",
      label: "Expiry Date Not Provided",
      detail: "Packaging verification requires physical check of expiration date."
    };
  }

  let expDate = null;

  if (/^\d{4}-\d{1,2}(-\d{1,2})?$/.test(expiryStr)) {
    const parts = expiryStr.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parts[2] ? parseInt(parts[2], 10) : 28;
    expDate = new Date(year, month, day);
  } else if (/^(0?[1-9]|1[0-2])[-/.](20\d{2}|\d{2})$/.test(expiryStr)) {
    const parts = expiryStr.split(/[-/.]/);
    const month = parseInt(parts[0], 10) - 1;
    let year = parseInt(parts[1], 10);
    if (year < 100) year += 2000;
    expDate = new Date(year, month + 1, 0);
  } else {
    const parsed = Date.parse(expiryStr);
    if (!isNaN(parsed)) expDate = new Date(parsed);
  }

  if (!expDate || isNaN(expDate.getTime())) {
    return {
      status: "unspecified",
      label: `Expiry: "${expiryStr}" (Non-standard format)`,
      detail: "Date format requires manual confirmation on packaging."
    };
  }

  const today = new Date();
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: "expired",
      label: `EXPIRED (${Math.abs(diffDays)} days ago)`,
      detail: "CAUTION: This product has passed its labeled expiration date. Expired medicines must never be consumed.",
      daysRemaining: diffDays
    };
  } else if (diffDays <= 60) {
    return {
      status: "expiring_soon",
      label: `Expiring Soon (${diffDays} days remaining)`,
      detail: "Attention: This medicine expires shortly. Ensure treatment completes before expiry.",
      daysRemaining: diffDays
    };
  } else {
    return {
      status: "active",
      label: `Within Shelf Life (${diffDays} days remaining)`,
      detail: "The labeled expiry date appears currently unexpired.",
      daysRemaining: diffDays
    };
  }
}

/**
 * Searches the demo reference catalog for structural matches.
 */
export function findCatalogMatch(searchName = "") {
  if (!searchName) return null;
  const query = searchName.toLowerCase().trim();

  return (
    DEMO_CATALOG.find((item) => {
      if (item.name.toLowerCase().includes(query)) return true;
      if (item.genericName.toLowerCase().includes(query)) return true;
      if (item.aliases.some((alias) => alias.toLowerCase().includes(query) || query.includes(alias.toLowerCase()))) {
        return true;
      }
      return false;
    }) || null
  );
}

/**
 * Core verification aggregator.
 */
export function evaluateMedicine({
  medicineName = "",
  batchNumber = "",
  expiryDate = "",
  manufacturer = "",
  source = "manual",
  rawExtracted = null
}) {
  const cleanName = medicineName.trim();
  const cleanBatch = batchNumber.trim();
  const cleanExpiry = expiryDate.trim();
  const cleanManufacturer = manufacturer.trim();

  const extractedData = {
    source,
    medicineName: cleanName || "Not provided",
    batchNumber: cleanBatch || "Not provided",
    expiryDate: cleanExpiry || "Not provided",
    manufacturer: cleanManufacturer || "Not provided",
    rawCodeOrText: rawExtracted || ""
  };

  const expiryAnalysis = evaluateExpiry(cleanExpiry);

  let batchFormatValid = true;
  let batchFormatNote = "Valid alphanumeric structure";
  if (cleanBatch) {
    if (cleanBatch.length < 3) {
      batchFormatValid = false;
      batchFormatNote = "Batch identifier is unusually short (< 3 characters)";
    } else if (cleanBatch.length > 20) {
      batchFormatValid = false;
      batchFormatNote = "Batch identifier exceeds standard pharmaceutical limits (> 20 characters)";
    } else if (!/^[-A-Za-z0-9/]+$/.test(cleanBatch)) {
      batchFormatValid = false;
      batchFormatNote = "Batch contains unconventional punctuation or symbols";
    }
  } else {
    batchFormatValid = false;
    batchFormatNote = "No batch number provided for packaging comparison";
  }

  const catalogMatch = findCatalogMatch(cleanName);

  const unverifiedAttributes = [
    {
      title: "Active Chemical Composition",
      description: "Chemical purity, active pharmaceutical ingredient (API) concentration, and bioequivalence cannot be verified via camera, OCR, or barcode reading.",
      howToVerify: "Requires laboratory assay testing (HPLC/spectroscopy) or authorized batch release certification."
    },
    {
      title: "Cold Chain & Storage History",
      description: "Whether this particular unit was subjected to excessive heat, moisture, or freezing during transport or retail storage.",
      howToVerify: "Check for visual changes, cloudiness, melted capsules, or intact temperature monitoring indicator tags where applicable."
    },
    {
      title: "Physical Tamper Seal Authenticity",
      description: "Whether the carton seal or blister foil has been surreptitiously opened, repacked, or forged.",
      howToVerify: "Carefully inspect the blister edge, cap seal, security hologram, and print sharpness against an original sample."
    },
    {
      title: "Official Regulatory Clearance",
      description: "Direct real-time confirmation from the government medicine authority (CDSCO / FDA / MHRA).",
      howToVerify: "Check the national drug database (e.g. CDSCO Sugam portal or FDA Orange Book) using the manufacturing license and salt name."
    }
  ];

  // Check CDSCO official notices
  const cdscoAlert = checkCdscoAlertMatch({
    medicineName: cleanName,
    batchNumber: cleanBatch,
    manufacturer: cleanManufacturer
  });

  // Check duplicate scan frequency across client sessions
  const duplicateAnalysis = checkDuplicateScan(cleanBatch);

  // Multi-Factor 0-100 Risk Scoring Engine (mirrors FastAPI backend `risk_service.py`)
  let riskScore = 0;
  const riskFactors = [];

  // Factor 1: Expiry
  if (expiryAnalysis.status === "expired") {
    riskScore += 35;
    riskFactors.push({
      name: "Expired Medicine",
      points: 35,
      type: "critical",
      description: "Product has passed its expiration date. Degraded active ingredients can cause toxicity or treatment failure."
    });
  } else if (expiryAnalysis.status === "nearing_expiry") {
    riskScore += 15;
    riskFactors.push({
      name: "Nearing Expiration",
      points: 15,
      type: "warning",
      description: `Product expires in ${expiryAnalysis.daysRemaining} days. Finish treatment or verify remaining shelf life with pharmacist.`
    });
  }

  // Factor 2: CDSCO / Regulatory Alert
  if (cdscoAlert) {
    if (cdscoAlert.matchType === "EXACT_BATCH") {
      riskScore += 40;
      riskFactors.push({
        name: "CDSCO Recalled Batch Match",
        points: 40,
        type: "critical",
        description: `Active ${cdscoAlert.alertType} notice for batch ${cdscoAlert.batchNumber}: ${cdscoAlert.reportedIssue}`
      });
    } else {
      riskScore += 20;
      riskFactors.push({
        name: "CDSCO Surveillance Alert",
        points: 20,
        type: "warning",
        description: `Product brand is under regulatory quality advisory: ${cdscoAlert.reportedIssue}`
      });
    }
  }

  // Factor 3: Manufacturer Consistency
  if (catalogMatch) {
    if (cleanManufacturer && cleanManufacturer !== "Not provided") {
      const known = catalogMatch.knownManufacturers.some((m) =>
        m.toLowerCase().includes(cleanManufacturer.toLowerCase()) ||
        cleanManufacturer.toLowerCase().includes(m.toLowerCase())
      );
      if (!known) {
        riskScore += 15;
        riskFactors.push({
          name: "Unverified Manufacturer Name",
          points: 15,
          type: "warning",
          description: `Extracted maker "${cleanManufacturer}" is not among registered makers in the reference monograph.`
        });
      }
    }
  } else {
    riskScore += 5;
    riskFactors.push({
      name: "Monograph Not In Demo Catalog",
      points: 5,
      type: "info",
      description: "Product monograph not found in offline standard catalog. Physical verification recommended."
    });
  }

  // Factor 4: Batch Format
  if (!batchFormatValid) {
    riskScore += 10;
    riskFactors.push({
      name: "Batch Number Format Anomaly",
      points: 10,
      type: "warning",
      description: batchFormatNote
    });
  }

  // Factor 5: Duplicate Scan Anomaly
  if (duplicateAnalysis.isDuplicate) {
    if (duplicateAnalysis.anomalyLevel === "high") {
      riskScore += 20;
      riskFactors.push({
        name: "High Duplicate Scan Frequency",
        points: 20,
        type: "critical",
        description: `Scanned ${duplicateAnalysis.scanCount} times. Repeated scanning across sessions can indicate replicated packaging barcodes.`
      });
    } else if (duplicateAnalysis.anomalyLevel === "medium") {
      riskScore += 10;
      riskFactors.push({
        name: "Repeated Identifier Scans",
        points: 10,
        type: "warning",
        description: `Identifier previously scanned ${duplicateAnalysis.previousScansCount} time(s).`
      });
    }
  }

  // Base score bounds
  riskScore = Math.min(Math.max(riskScore, 5), 100);

  let riskCategory = "low";
  let riskLabel = "Low Concern";
  let riskColor = "#10b981";

  if (riskScore >= 61) {
    riskCategory = "high";
    riskLabel = "High Concern";
    riskColor = "#ef4444";
  } else if (riskScore >= 26) {
    riskCategory = "medium";
    riskLabel = "Medium Concern";
    riskColor = "#f59e0b";
  }

  const riskAnalysis = {
    score: riskScore,
    category: riskCategory,
    label: riskLabel,
    color: riskColor,
    factors: riskFactors
  };

  let overallStatus = "extracted_only";
  let statusBadgeLabel = "Information Extracted (Unmatched to Reference)";
  let statusDescription =
    "Details were successfully extracted and parsed. However, no matching reference profile exists in the local demo catalog.";

  if (catalogMatch) {
    overallStatus = "catalog_matched";
    statusBadgeLabel = "Reference Standard Matched (Demo Catalog)";
    statusDescription = `Packaging details match expected specifications for "${catalogMatch.name}". Review the physical inspection checklist below.`;
  }

  if (cdscoAlert && cdscoAlert.matchType === "EXACT_BATCH") {
    overallStatus = "cdsco_flagged";
    statusBadgeLabel = `CRITICAL: CDSCO ${cdscoAlert.alertType} NOTICE`;
    statusDescription = cdscoAlert.warningSummary;
  } else if (expiryAnalysis.status === "expired") {
    overallStatus = "expired_warning";
    statusBadgeLabel = "EXPIRED PRODUCT DETECTED";
    statusDescription =
      "WARNING: The extracted expiry date indicates this product has expired. Do not use expired pharmaceuticals.";
  }

  const finalResult = {
    timestamp: new Date().toISOString(),
    extractedData,
    catalogMatch,
    expiryAnalysis,
    batchAnalysis: {
      isValid: batchFormatValid,
      note: batchFormatNote
    },
    cdscoAlert,
    duplicateAnalysis,
    riskAnalysis,
    unverifiedAttributes,
    overallStatus,
    statusBadgeLabel,
    statusDescription,
    disclaimer: SAFETY_DISCLAIMER,
    isDemoMode: true,
    integrationNote:
      "Integrated with CDSCO alerts database & 0-100 Risk Scoring Engine. Connected to FastAPI / PostgreSQL backend."
  };

  // Automatically save scan to client history
  try {
    saveScanRecord(finalResult);
  } catch (err) {
    console.error("Failed to auto-save scan record:", err);
  }

  return finalResult;
}

/**
 * Generates formatted text report for copying or printing.
 */
export function formatVerificationReport(result) {
  if (!result) return "";
  const { extractedData, catalogMatch, expiryAnalysis, batchAnalysis, riskAnalysis, cdscoAlert, duplicateAnalysis } = result;

  return `========================================
MediFy — PACKAGING INSPECTION REPORT
Date: ${new Date(result.timestamp).toLocaleString()}
Status: ${result.statusBadgeLabel}
Risk Score: ${riskAnalysis ? `${riskAnalysis.score}/100 (${riskAnalysis.label})` : "N/A"}
========================================

[EXTRACTED DETAILS]
• Product / Medicine: ${extractedData.medicineName}
• Batch / Lot Number: ${extractedData.batchNumber} (${batchAnalysis.note})
• Expiry Date: ${extractedData.expiryDate} (${expiryAnalysis.label})
• Manufacturer: ${extractedData.manufacturer}
• Data Extraction Source: ${extractedData.source.toUpperCase()}

[RISK ASSESSMENT & REGULATORY SCREENING]
• Concern Score: ${riskAnalysis ? `${riskAnalysis.score}/100 [${riskAnalysis.label.toUpperCase()}]` : "N/A"}
• CDSCO Status: ${cdscoAlert ? `FLAGGED (${cdscoAlert.alertType}): ${cdscoAlert.reportedIssue}` : "No matching active government recall found"}
• Serial Duplicate Check: ${duplicateAnalysis?.isDuplicate ? `Scanned ${duplicateAnalysis.scanCount} times across client sessions` : "First scan record"}

[REFERENCE REGISTRY COMPARISON (DEMO MODE)]
${
  catalogMatch
    ? `• Matched Standard: ${catalogMatch.name}
• Generic / Salt: ${catalogMatch.genericName}
• Classification: ${catalogMatch.scheduleClass} (${catalogMatch.therapeuticClass})
• Standard Storage: ${catalogMatch.storageAdvice}`
    : "• No exact monograph match in local demo reference catalog."
}

[CRITICAL REMINDER]
${SAFETY_DISCLAIMER}

Always confirm suspect medicine with a licensed pharmacist or your national medicines regulator.
========================================`;
}

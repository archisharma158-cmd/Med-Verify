import { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import {
  Upload,
  Image as ImageIcon,
  AlertCircle,
  FileText,
  Sparkles,
  RefreshCw,
  LoaderCircle
} from "lucide-react";
import { parseOcrText } from "../../services/medicineService";
import { useLanguage } from "../../context/LanguageContext";

export default function PhotoOcrScanner({ onVerifyExtracted }) {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ status: "", progress: 0 });
  const [error, setError] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, or WebP).");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setError("File is too large (> 12MB). Please select a compressed image.");
      return;
    }

    setError("");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRawText("");
    setParsedData(null);
    runOcr(file);
  };

  const runOcr = async (file) => {
    setOcrLoading(true);
    setOcrProgress({ status: "Initializing OCR engine...", progress: 5 });
    setError("");

    try {
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress({
              status: `Recognizing packaging text (${Math.round((m.progress || 0) * 100)}%)...`,
              progress: Math.round((m.progress || 0) * 100)
            });
          } else if (m.status) {
            setOcrProgress({
              status: `${m.status.replace(/_/g, " ")}...`,
              progress: 20
            });
          }
        }
      });

      const extracted = result.data.text.trim();
      if (!extracted) {
        setError(
          "No readable text could be recognized. Please upload a closer, higher-contrast photo with good lighting."
        );
        return;
      }

      setRawText(extracted);
      const parsed = parseOcrText(extracted);
      setParsedData(parsed);
    } catch (err) {
      console.error("OCR process error:", err);
      setError(
        "Optical character recognition failed. Ensure the image is clear or switch to manual entry."
      );
    } finally {
      setOcrLoading(false);
      setOcrProgress({ status: "", progress: 0 });
    }
  };

  const handleCandidateChange = (field, value) => {
    setParsedData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRawTextChange = (e) => {
    const updated = e.target.value;
    setRawText(updated);
    const reparsed = parseOcrText(updated);
    setParsedData(reparsed);
  };

  const handleProceed = () => {
    if (!parsedData) return;

    onVerifyExtracted({
      medicineName: parsedData.candidateName || "Extracted Packaging Item",
      batchNumber: parsedData.candidateBatch || "",
      expiryDate: parsedData.candidateExpiryDate || "",
      manufacturer: parsedData.candidateManufacturer || "",
      source: "ocr_photo",
      rawExtracted: rawText
    });
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setRawText("");
    setParsedData(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mv-ocr-tab">
      <div className="mv-tab-intro">
        <h3>{t("ocrIntroTitle", "Packaging Photo OCR Text Extraction")}</h3>
        <p>
          {t("ocrIntroDesc", "Upload a clear photograph of the medicine blister, strip, bottle label, or carton. Our client-side OCR engine will extract text and identify candidate batch and expiry details.")}
        </p>
      </div>

      {/* Image Upload Zone */}
      {!previewUrl && (
        <label className="mv-ocr-dropzone">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            aria-label="Upload packaging photo"
          />
          <div className="mv-dropzone-icon">
            <Upload size={38} />
          </div>
          <h4>{t("ocrDropTitle", "Drop medicine packaging photo here")}</h4>
          <p>{t("ocrDropSub", "Supports JPG, PNG, WebP up to 12MB. Processed securely on your device.")}</p>
          <span className="mv-dropzone-browse-btn">{t("ocrBrowseBtn", "Browse Local Files")}</span>
        </label>
      )}

      {/* Active Photo Preview & Progress */}
      {previewUrl && (
        <div className="mv-ocr-active-container">
          <div className="mv-ocr-preview-header">
            <div className="mv-file-info">
              <ImageIcon size={18} />
              <span>{selectedFile?.name || "Medicine Packaging Image"}</span>
              <span className="mv-file-size">
                ({(selectedFile?.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <button
              type="button"
              className="mv-btn-outline mv-btn-sm"
              onClick={handleReset}
              disabled={ocrLoading}
            >
              <RefreshCw size={14} />
              <span>{t("ocrChooseAnother", "Choose Another Photo")}</span>
            </button>
          </div>

          <div className="mv-ocr-split-view">
            {/* Left: Image thumbnail */}
            <div className="mv-ocr-image-box">
              <img src={previewUrl} alt="Medicine packaging uploaded by user" />
              {ocrLoading && (
                <div className="mv-ocr-overlay-loading">
                  <LoaderCircle className="mv-spin" size={36} />
                  <span>{ocrProgress.status}</span>
                  <div className="mv-progress-bar-wrap">
                    <div
                      className="mv-progress-bar-fill"
                      style={{ width: `${ocrProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Extracted & Parsed Data */}
            <div className="mv-ocr-results-box">
              {parsedData && (
                <>
                  <div className="mv-ocr-candidates-header">
                    <h4>
                      <Sparkles size={16} />
                      {t("ocrCandidateTitle", "Candidate Fields (Review & Edit)")}
                    </h4>
                    <span className="mv-hint-badge">
                      {t("ocrCandidateHint", "Unconfirmed Candidates — Verify against label")}
                    </span>
                  </div>

                  <div className="mv-candidate-fields">
                    <div className="mv-input-group">
                      <label htmlFor="candidate-name">
                        {t("ocrCandidateName", "Candidate Medicine Name")}
                        <span className="tag-unconfirmed">Unconfirmed</span>
                      </label>
                      <input
                        id="candidate-name"
                        type="text"
                        value={parsedData.candidateName || ""}
                        onChange={(e) => handleCandidateChange("candidateName", e.target.value)}
                        placeholder="e.g. Paracetamol 650mg"
                      />
                    </div>

                    <div className="mv-fields-row">
                      <div className="mv-input-group">
                        <label htmlFor="candidate-batch">
                          {t("ocrCandidateBatch", "Candidate Batch / Lot")}
                          <span className="tag-unconfirmed">Unconfirmed</span>
                        </label>
                        <input
                          id="candidate-batch"
                          type="text"
                          value={parsedData.candidateBatch || ""}
                          onChange={(e) => handleCandidateChange("candidateBatch", e.target.value)}
                          placeholder="e.g. DL6509B"
                        />
                      </div>

                      <div className="mv-input-group">
                        <label htmlFor="candidate-exp">
                          {t("ocrCandidateExp", "Candidate Expiry Date")}
                          <span className="tag-unconfirmed">Unconfirmed</span>
                        </label>
                        <input
                          id="candidate-exp"
                          type="text"
                          value={parsedData.candidateExpiryDate || ""}
                          onChange={(e) =>
                            handleCandidateChange("candidateExpiryDate", e.target.value)
                          }
                          placeholder="e.g. 08/2027 or 2027-08"
                        />
                      </div>
                    </div>

                    <div className="mv-fields-row">
                      <div className="mv-input-group">
                        <label htmlFor="candidate-mfg">
                          Candidate Mfg Date
                          <span className="tag-unconfirmed">Unconfirmed</span>
                        </label>
                        <input
                          id="candidate-mfg"
                          type="text"
                          value={parsedData.candidateMfgDate || ""}
                          onChange={(e) =>
                            handleCandidateChange("candidateMfgDate", e.target.value)
                          }
                          placeholder="e.g. 09/2024"
                        />
                      </div>

                      <div className="mv-input-group">
                        <label htmlFor="candidate-mfr">
                          {t("ocrCandidateMfr", "Candidate Manufacturer")}
                          <span className="tag-unconfirmed">Unconfirmed</span>
                        </label>
                        <input
                          id="candidate-mfr"
                          type="text"
                          value={parsedData.candidateManufacturer || ""}
                          onChange={(e) =>
                            handleCandidateChange("candidateManufacturer", e.target.value)
                          }
                          placeholder="e.g. Micro Labs Ltd."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Editable Raw OCR text drawer */}
                  <div className="mv-raw-text-wrapper">
                    <label htmlFor="mv-raw-ocr-textarea" className="mv-raw-toggle-label">
                      <FileText size={15} />
                      <span>Full OCR Extracted Text (Editable for OCR Glare Correction):</span>
                    </label>
                    <textarea
                      id="mv-raw-ocr-textarea"
                      rows={4}
                      value={rawText}
                      onChange={handleRawTextChange}
                      placeholder="Extracted label text appears here. You may edit directly."
                    />
                  </div>

                  <div className="mv-ocr-actions">
                    <button
                      type="button"
                      className="mv-btn-primary mv-btn-verify-ocr"
                      onClick={handleProceed}
                    >
                      <Sparkles size={17} />
                      <span>{t("ocrVerifyExtractedBtn", "Proceed to Verification Panel")}</span>
                    </button>
                  </div>
                </>
              )}

              {!ocrLoading && !parsedData && !error && (
                <div className="mv-ocr-placeholder">
                  <p>Processing image...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mv-alert-inline mv-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

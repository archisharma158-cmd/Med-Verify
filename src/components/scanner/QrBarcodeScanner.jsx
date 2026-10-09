import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, Upload, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { parseBarcodeOrQr } from "../../services/medicineService";
import { useLanguage } from "../../context/LanguageContext";

export default function QrBarcodeScanner({ onScanComplete }) {
  const { t } = useLanguage();
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [error, setError] = useState("");
  const [lastDecoded, setLastDecoded] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const scannerInstanceRef = useRef(null);
  const containerId = "mv-qr-reader-viewport";

  const stopCameraScanner = useCallback(async () => {
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop();
        }
        await scannerInstanceRef.current.clear();
      } catch (err) {
        console.warn("Error stopping scanner instance:", err);
      } finally {
        scannerInstanceRef.current = null;
        setIsScanning(false);
      }
    }
  }, []);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, [stopCameraScanner]);

  const startCameraScanner = async (cameraId = null) => {
    setError("");
    setLastDecoded(null);

    try {
      await stopCameraScanner();

      const availableDevices = await Html5Qrcode.getCameras();
      if (!availableDevices || availableDevices.length === 0) {
        setError("No camera found on this device. Please connect a camera or upload a code image below.");
        return;
      }

      setCameras(availableDevices);
      const activeCameraId = cameraId || selectedCameraId || availableDevices[0].id;
      setSelectedCameraId(activeCameraId);

      const html5QrCode = new Html5Qrcode(containerId);
      scannerInstanceRef.current = html5QrCode;

      await html5QrCode.start(
        activeCameraId,
        {
          fps: 12,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          const parsed = parseBarcodeOrQr(decodedText);
          setLastDecoded({
            raw: decodedText,
            parsed,
            timestamp: new Date().toLocaleTimeString()
          });
          stopCameraScanner();
        },
        () => {
          // Frame parse idle
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Camera startup error:", err);
      let message = "Camera permission was denied or camera is unavailable.";
      if (err.name === "NotAllowedError" || String(err).includes("NotAllowedError")) {
        message = "Camera access was denied by your browser. Please allow camera permissions in browser site settings.";
      } else if (err.name === "NotFoundError" || String(err).includes("NotFoundError")) {
        message = "No compatible camera was detected on this device.";
      } else if (window.isSecureContext === false) {
        message = "Camera access requires a secure HTTPS connection or localhost environment.";
      }
      setError(message);
      setIsScanning(false);
    }
  };

  const handleCameraChange = async (e) => {
    const newCameraId = e.target.value;
    setSelectedCameraId(newCameraId);
    if (isScanning) {
      await stopCameraScanner();
      await startCameraScanner(newCameraId);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file containing a QR or barcode.");
      return;
    }

    setIsProcessingFile(true);
    setError("");
    setLastDecoded(null);

    try {
      const tempScanner = new Html5Qrcode("mv-qr-hidden-scanner");
      const decodedText = await tempScanner.scanFile(file, true);
      const parsed = parseBarcodeOrQr(decodedText);
      setLastDecoded({
        raw: decodedText,
        parsed,
        timestamp: new Date().toLocaleTimeString()
      });
      await tempScanner.clear();
    } catch {
      setError("Could not detect a readable QR code or barcode in this image. Ensure the image is clear and well-lit.");
    } finally {
      setIsProcessingFile(false);
      event.target.value = "";
    }
  };

  const handleProceedToVerification = () => {
    if (!lastDecoded) return;
    const { parsed, raw } = lastDecoded;

    onScanComplete({
      medicineName: parsed.name || (parsed.isGs1DataMatrix ? "Pharmaceutical Product (GS1)" : ""),
      batchNumber: parsed.batch || "",
      expiryDate: parsed.expiryDate || "",
      manufacturer: "",
      source: "qr_scan",
      rawExtracted: raw
    });
  };

  return (
    <div className="mv-qr-scanner-tab">
      <div className="mv-tab-intro">
        <h3>{t("qrIntroTitle", "Camera & Image Barcode Scanner")}</h3>
        <p>
          {t("qrIntroDesc", "Position the 2D DataMatrix code, QR code, or linear barcode printed on the medicine carton or blister foil.")}
        </p>
      </div>

      <div id="mv-qr-hidden-scanner" style={{ display: "none" }} />

      <div className="mv-scanner-viewport-wrapper">
        <div id={containerId} className={`mv-qr-viewport ${isScanning ? "scanning" : ""}`}>
          {!isScanning && !lastDecoded && (
            <div className="mv-viewport-idle">
              <div className="mv-idle-icon-wrap">
                <Camera size={44} />
              </div>
              <h4>{t("qrInactiveTitle", "Camera Scanner Inactive")}</h4>
              <p>{t("qrInactiveDesc", "Camera access is requested only when you click the button below.")}</p>
              <button
                type="button"
                className="mv-btn-primary mv-btn-start-scan"
                onClick={() => startCameraScanner()}
              >
                <Camera size={18} />
                <span>{t("qrStartBtn", "Start Camera Scanner")}</span>
              </button>
            </div>
          )}
        </div>

        {isScanning && (
          <div className="mv-camera-active-controls">
            <div className="mv-scan-reticle-overlay">
              <div className="mv-laser-line" />
            </div>

            <div className="mv-camera-toolbar">
              {cameras.length > 1 && (
                <div className="mv-camera-selector">
                  <label htmlFor="camera-select" className="sr-only">Switch Camera</label>
                  <select
                    id="camera-select"
                    value={selectedCameraId}
                    onChange={handleCameraChange}
                  >
                    {cameras.map((cam, idx) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                className="mv-btn-secondary mv-btn-stop"
                onClick={stopCameraScanner}
              >
                <CameraOff size={16} />
                <span>{t("qrStopBtn", "Stop Camera")}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mv-alert-inline mv-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="mv-code-file-alternative">
        <div className="mv-divider-text">
          <span>{t("qrOrUpload", "OR SCAN FROM SAVED IMAGE")}</span>
        </div>

        <label className="mv-file-dropzone-mini">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isProcessingFile}
          />
          <Upload size={18} />
          <span>
            {isProcessingFile ? t("qrDecoding", "Decoding barcode from image...") : t("qrUploadPrompt", "Upload code screenshot or photo")}
          </span>
        </label>
      </div>

      {lastDecoded && (
        <div className="mv-decoded-result-card" aria-live="polite">
          <div className="mv-decoded-header">
            <div className="mv-decoded-badge">
              <CheckCircle2 size={16} />
              <span>{t("qrDecodedSuccess", "Code Decoded Successfully")}</span>
            </div>
            <span className="mv-decoded-time">{lastDecoded.timestamp}</span>
          </div>

          <div className="mv-decoded-body">
            <div className="mv-decoded-format">
              {t("qrDecodedFormat", "Format")}: <strong>{lastDecoded.parsed.format}</strong>
            </div>

            <div className="mv-decoded-fields-grid">
              {lastDecoded.parsed.batch && (
                <div className="mv-field-chip">
                  <span className="label">{t("qrDecodedBatch", "Decoded Batch")}:</span>
                  <span className="val">{lastDecoded.parsed.batch}</span>
                </div>
              )}
              {lastDecoded.parsed.expiryDate && (
                <div className="mv-field-chip">
                  <span className="label">{t("qrDecodedExpiry", "Decoded Expiry")}:</span>
                  <span className="val">{lastDecoded.parsed.expiryDate}</span>
                </div>
              )}
              {lastDecoded.parsed.gtin && (
                <div className="mv-field-chip">
                  <span className="label">{t("qrDecodedGtin", "GS1 GTIN")}:</span>
                  <span className="val">{lastDecoded.parsed.gtin}</span>
                </div>
              )}
              {lastDecoded.parsed.serialNo && (
                <div className="mv-field-chip">
                  <span className="label">{t("qrDecodedSerial", "Serial No")}:</span>
                  <span className="val">{lastDecoded.parsed.serialNo}</span>
                </div>
              )}
            </div>

            <div className="mv-raw-payload-box">
              <span className="mv-raw-label">{t("qrRawPayload", "Raw Decoded Payload")}:</span>
              <code>{lastDecoded.raw}</code>
            </div>
          </div>

          <div className="mv-decoded-actions">
            <button
              type="button"
              className="mv-btn-primary mv-btn-verify-decoded"
              onClick={handleProceedToVerification}
            >
              <Sparkles size={16} />
              <span>{t("qrVerifyBtn", "Verify Extracted Data")}</span>
            </button>
            <button
              type="button"
              className="mv-btn-outline"
              onClick={() => {
                setLastDecoded(null);
                startCameraScanner();
              }}
            >
              <RefreshCw size={15} />
              <span>{t("qrScanAnother", "Scan Another Code")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

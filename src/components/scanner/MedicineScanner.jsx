import { useState } from "react";
import { QrCode, Camera, FileEdit, ShieldCheck } from "lucide-react";
import QrBarcodeScanner from "./QrBarcodeScanner";
import PhotoOcrScanner from "./PhotoOcrScanner";
import ManualEntryForm from "./ManualEntryForm";
import { useLanguage } from "../../context/LanguageContext";

export default function MedicineScanner({ onVerificationReady, activeTab, onTabChange }) {
  const { t } = useLanguage();
  const [internalTab, setInternalTab] = useState("scan");
  const currentTab = activeTab || internalTab;

  const handleTabSwitch = (newTab) => {
    if (onTabChange) {
      onTabChange(newTab);
    } else {
      setInternalTab(newTab);
    }
  };

  const handleProcessPayload = (data) => {
    if (onVerificationReady) {
      onVerificationReady(data);
    }
  };

  return (
    <section className="mv-scanner-section" id="scanner" aria-label="Medicine Verification Scanner">
      <div className="mv-container">
        <div className="mv-section-heading">
          <div className="mv-section-eyebrow">
            <ShieldCheck size={16} />
            <span>{t("scannerEyebrow", "INTELLIGENT PACKAGING INSPECTOR")}</span>
          </div>
          <h2>{t("scannerHeading", "Verify Before You Trust")}</h2>
          <p>
            {t(
              "scannerSub",
              "Choose your preferred verification method below to inspect codes, extract packaging typography, or cross-reference pharmaceutical details."
            )}
          </p>
        </div>

        <div className="mv-scanner-shell">
          {/* Method Navigation Tabs */}
          <div className="mv-method-tabs" role="tablist" aria-label="Verification Methods">
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === "scan"}
              className={`mv-tab-btn ${currentTab === "scan" ? "is-active" : ""}`}
              onClick={() => handleTabSwitch("scan")}
            >
              <QrCode size={19} />
              <div className="mv-tab-text">
                <span className="title">{t("tabMethodScanTitle", "Scan QR / Barcode")}</span>
                <span className="subtitle">{t("tabMethodScanSub", "Camera or code image")}</span>
              </div>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={currentTab === "photo"}
              className={`mv-tab-btn ${currentTab === "photo" ? "is-active" : ""}`}
              onClick={() => handleTabSwitch("photo")}
            >
              <Camera size={19} />
              <div className="mv-tab-text">
                <span className="title">{t("tabMethodPhotoTitle", "Upload Packaging Photo")}</span>
                <span className="subtitle">{t("tabMethodPhotoSub", "OCR text & batch reader")}</span>
              </div>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={currentTab === "manual"}
              className={`mv-tab-btn ${currentTab === "manual" ? "is-active" : ""}`}
              onClick={() => handleTabSwitch("manual")}
            >
              <FileEdit size={19} />
              <div className="mv-tab-text">
                <span className="title">{t("tabMethodManualTitle", "Enter Details Manually")}</span>
                <span className="subtitle">{t("tabMethodManualSub", "Name, batch & expiry")}</span>
              </div>
            </button>
          </div>

          {/* Active Tab Container */}
          <div className="mv-tab-panel" role="tabpanel">
            {currentTab === "scan" && (
              <QrBarcodeScanner onScanComplete={handleProcessPayload} />
            )}

            {currentTab === "photo" && (
              <PhotoOcrScanner onVerifyExtracted={handleProcessPayload} />
            )}

            {currentTab === "manual" && (
              <ManualEntryForm onSubmitDetails={handleProcessPayload} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect } from "react";
import { LanguageProvider } from "./context/LanguageContext";
import Navbar from "./components/layout/Navbar";
import Hero from "./components/home/Hero";
import BenefitsSection from "./components/home/BenefitsSection";
import MedicineScanner from "./components/scanner/MedicineScanner";
import VerificationResults from "./components/verification/VerificationResults";
import RiskMeterSection from "./components/risk/RiskMeterSection";
import ScanHistorySection from "./components/history/ScanHistorySection";
import HowItWorksSection from "./components/home/HowItWorksSection";
import SafetySection from "./components/home/SafetySection";
import RegulatoryRegistrySection from "./components/home/RegulatoryRegistrySection";
import Footer from "./components/layout/Footer";
import ContactModal from "./components/layout/ContactModal";
import ReportSuspiciousModal from "./components/reporting/ReportSuspiciousModal";
import ScanHistoryModal from "./components/history/ScanHistoryModal";
import AdminDashboardModal from "./components/admin/AdminDashboardModal";
import CdscoAlertsModal from "./components/alerts/CdscoAlertsModal";
import VerificationReportModal from "./components/reporting/VerificationReportModal";
import MediBot from "./components/chatbot/MediBot";
import { evaluateMedicine, verifyMedicineAsync } from "./services/medicineService";
import { getScanHistory } from "./services/historyService";
import "./App.css";

function AppContent() {
  const [activeTab, setActiveTab] = useState("scan");
  const [verificationResult, setVerificationResult] = useState(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isReportDossierOpen, setIsReportDossierOpen] = useState(false);
  const [reportDossierData, setReportDossierData] = useState(null);
  const [reportInitialData, setReportInitialData] = useState(null);
  const [historyCount, setHistoryCount] = useState(0);

  // Sync scan count on mount and after verification
  useEffect(() => {
    setHistoryCount(getScanHistory().length);
  }, [verificationResult]);

  const handleVerificationReady = async (payload) => {
    // Process through the medicine evaluation service with live backend support
    const evaluated = await verifyMedicineAsync(payload);
    setVerificationResult(evaluated);
    setHistoryCount(getScanHistory().length);

    // Smooth scroll to the results section
    setTimeout(() => {
      const resultsEl = document.getElementById("results");
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleResetVerification = () => {
    setVerificationResult(null);
    const scannerEl = document.getElementById("scanner");
    if (scannerEl) {
      scannerEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    const scannerEl = document.getElementById("scanner");
    if (scannerEl) {
      scannerEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Open Official Printable Verification Dossier
  const handleOpenReportDossier = (data) => {
    setReportDossierData(data);
    setIsReportDossierOpen(true);
  };

  // Trigger report modal from a specific verification result
  const handleOpenReportFromScan = (result) => {
    setReportInitialData({
      medicineName: result?.extractedData?.medicineName || result?.medicineName,
      batchNumber: result?.extractedData?.batchNumber || result?.batchNumber,
      manufacturer: result?.extractedData?.manufacturer || result?.manufacturer,
      cdscoAlert: result?.cdscoAlert || result?.cdscoAlertMatch,
      duplicateAnalysis: result?.duplicateAnalysis,
      id: result?.id
    });
    setIsReportOpen(true);
  };

  // Open fresh report modal
  const handleOpenFreshReport = () => {
    setReportInitialData(null);
    setIsReportOpen(true);
  };

  // Ask MediBot to explain scan
  const handleAskAiToExplain = (result) => {
    const event = new CustomEvent("medify:explain-scan", {
      detail: { scanResult: result, language: "en" }
    });
    window.dispatchEvent(event);
  };

  // Test-verify a batch selected from the CDSCO Alerts modal
  const handleTestBatchFromAlerts = (alertData) => {
    handleVerificationReady({
      medicineName: alertData.medicineName,
      batchNumber: alertData.batchNumber,
      manufacturer: alertData.manufacturer,
      expiryDate: "11/2026",
      source: "cdsco_test_preset"
    });
  };

  // Re-inspect a past scan from History
  const handleSelectHistoryItem = (item) => {
    handleVerificationReady({
      medicineName: item.medicineName,
      batchNumber: item.batchNumber,
      manufacturer: item.manufacturer,
      expiryDate: item.expiryDate !== "N/A" ? item.expiryDate : "12/2026",
      source: item.source || "history_recall"
    });
  };

  return (
    <div className="mv-app-root">
      {/* Navigation */}
      <Navbar
        onOpenContact={() => setIsContactOpen(true)}
        onSelectScanTab={handleSelectTab}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenReport={handleOpenFreshReport}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        historyCount={historyCount}
      />

      <main id="main-content">
        {/* Hero Section */}
        <Hero onStartVerification={handleSelectTab} />

        {/* The Medicine Scanner Component */}
        <MedicineScanner
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onVerificationReady={handleVerificationReady}
        />

        {/* Dynamic Verification Results */}
        {verificationResult && (
          <VerificationResults
            result={verificationResult}
            onReset={handleResetVerification}
            onReportSuspicious={handleOpenReportFromScan}
            onAskAiToExplain={handleAskAiToExplain}
            onGenerateReport={handleOpenReportDossier}
          />
        )}

        {/* Interactive Pharmaceutical Risk Meter (Feature Requested) */}
        <RiskMeterSection
          activeVerificationResult={verificationResult}
          onGoToScanner={() => handleSelectTab("scan")}
        />

        {/* Dedicated Medicine Scan History Section (Feature Requested) */}
        <ScanHistorySection
          onSelectScan={handleSelectHistoryItem}
          onGenerateReport={handleOpenReportDossier}
          onReportSuspicious={handleOpenReportFromScan}
          onSampleScanTrigger={handleVerificationReady}
        />

        {/* How It Works Process Pipeline */}
        <HowItWorksSection onGoToScanner={handleSelectTab} />

        {/* Practical Benefits Overview */}
        <BenefitsSection />

        {/* Safety Protocol & Limitations */}
        <SafetySection />

        {/* Official Regulatory Registries */}
        <RegulatoryRegistrySection onOpenAlerts={() => setIsAlertsOpen(true)} />
      </main>

      {/* Footer */}
      <Footer onOpenContact={() => setIsContactOpen(true)} />

      {/* Contact & Support Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Suspicious Medicine Reporting Modal (Feature 10) */}
      <ReportSuspiciousModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        initialData={reportInitialData}
      />

      {/* Scan History Drawer Modal (Feature 11) */}
      <ScanHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectScan={handleSelectHistoryItem}
        onGenerateReport={handleOpenReportDossier}
      />

      {/* Safety Oversight & Admin Dashboard Modal (Feature 12) */}
      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* CDSCO Regulatory Alerts Directory Modal (Feature 5) */}
      <CdscoAlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        onTestBatchSelect={handleTestBatchFromAlerts}
      />

      {/* Official Verification Report Dossier Modal (Feature Requested) */}
      <VerificationReportModal
        isOpen={isReportDossierOpen}
        onClose={() => setIsReportDossierOpen(false)}
        scanData={reportDossierData}
      />

      {/* Fixed Bottom-Right MediBot Chat Assistant (Features 8 & 9) */}
      <MediBot />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

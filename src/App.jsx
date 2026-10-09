import { useState } from "react";
import Navbar from "./components/layout/Navbar";
import Hero from "./components/home/Hero";
import BenefitsSection from "./components/home/BenefitsSection";
import MedicineScanner from "./components/scanner/MedicineScanner";
import VerificationResults from "./components/verification/VerificationResults";
import HowItWorksSection from "./components/home/HowItWorksSection";
import SafetySection from "./components/home/SafetySection";
import RegulatoryRegistrySection from "./components/home/RegulatoryRegistrySection";
import Footer from "./components/layout/Footer";
import ContactModal from "./components/layout/ContactModal";
import MediBot from "./components/chatbot/MediBot";
import { evaluateMedicine } from "./services/medicineService";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("scan");
  const [verificationResult, setVerificationResult] = useState(null);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleVerificationReady = (payload) => {
    // Process through the medicine evaluation service
    const evaluated = evaluateMedicine(payload);
    setVerificationResult(evaluated);

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

  return (
    <div className="mv-app-root">
      {/* Navigation */}
      <Navbar
        onOpenContact={() => setIsContactOpen(true)}
        onSelectScanTab={handleSelectTab}
      />

      <main id="main-content">
        {/* Hero Section */}
        <Hero onStartVerification={handleSelectTab} />

        {/* Benefits Overview */}
        <BenefitsSection />

        {/* The Medicine Scanner Component */}
        <MedicineScanner
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onVerificationReady={handleVerificationReady}
        />

        {/* Dynamic Verification Results (Visible upon scan or manual entry) */}
        {verificationResult && (
          <VerificationResults
            result={verificationResult}
            onReset={handleResetVerification}
          />
        )}

        {/* How It Works Process */}
        <HowItWorksSection onGoToScanner={handleSelectTab} />

        {/* Safety & Limitations */}
        <SafetySection />

        {/* Official Regulatory Registries */}
        <RegulatoryRegistrySection />
      </main>

      {/* Footer */}
      <Footer onOpenContact={() => setIsContactOpen(true)} />

      {/* Contact & Feedback Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Fixed Bottom-Right MediBot Chat Assistant */}
      <MediBot />
    </div>
  );
}

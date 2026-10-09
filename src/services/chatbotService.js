/**
 * MediBot Chatbot Service Layer
 * 
 * Safe local demonstration assistant for packaging literacy and safety guidance.
 * Provides bilingual support (English & Hindi) with medical safety guardrails.
 * 
 * NOTE: Architected as an isolated service module so an authorized AI API
 * (e.g. Gemini, custom medical LLM) can be connected without altering UI components.
 */

export const BOT_LANGUAGES = {
  en: { code: "en", label: "English", speechLang: "en-US" },
  hi: { code: "hi", label: "हिन्दी", speechLang: "hi-IN" }
};

export const INITIAL_BOT_MESSAGES = {
  en: [
    {
      id: "init-1",
      sender: "bot",
      text: "Hello! I am MediBot, your medicine packaging and safety guide.\n\nI can help you understand expiry dates, batch numbers, packaging security marks, and how to verify products with authorized health regulators.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ],
  hi: [
    {
      id: "init-1-hi",
      sender: "bot",
      text: "नमस्ते! मैं मेडिबॉट (MediBot) हूँ — आपका दवा पैकेजिंग और सुरक्षा गाइड।\n\nमैं आपको एक्सपायरी डेट, बैच नंबर, पैकेजिंग सुरक्षा संकेतों और स्वास्थ्य नियामकों के साथ पुष्टि करने के तरीके समझाने में मदद कर सकता हूँ।",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]
};

export const SUGGESTED_QUESTIONS = {
  en: [
    "How do I read an expiry date?",
    "What is a batch number?",
    "How can I spot fake packaging?",
    "Where do I report suspect medicine?",
    "Can MedVerify guarantee 100% authenticity?"
  ],
  hi: [
    "एक्सपायरी डेट कैसे पढ़ें?",
    "बैच नंबर क्या होता है?",
    "नकली पैकेजिंग कैसे पहचानें?",
    "संदिग्ध दवा की शिकायत कहाँ करें?",
    "क्या MedVerify 100% असली होने की गारंटी दे सकता है?"
  ]
};

const SAFETY_GUARDRAIL_NOTE_EN =
  "\n\n⚠️ Medical Safety Notice: I cannot diagnose conditions, prescribe medications, or adjust dosages. For health symptoms, consult a licensed physician or pharmacist.";

const SAFETY_GUARDRAIL_NOTE_HI =
  "\n\n⚠️ चिकित्सा सुरक्षा सूचना: मैं किसी बीमारी का निदान नहीं कर सकता, दवा नहीं लिख सकता या खुराक नहीं बदल सकता। स्वास्थ्य संबंधी लक्षणों के लिए कृपया किसी योग्य चिकित्सक या फार्मासिस्ट से परामर्श लें।";

/**
 * Knowledge response rules (English)
 */
function getEnglishResponse(query) {
  const q = query.toLowerCase();

  // Guardrail: Diagnosis or prescription request
  if (
    q.includes("prescribe") ||
    q.includes("headache") ||
    q.includes("fever") ||
    q.includes("stomach") ||
    q.includes("pain") ||
    q.includes("dose") ||
    q.includes("dosage") ||
    q.includes("what medicine should i take") ||
    q.includes("how many pills") ||
    q.includes("treatment") ||
    q.includes("cure")
  ) {
    return (
      "I am strictly a medicine packaging literacy assistant. I do NOT have the ability or authority to diagnose symptoms, recommend treatments, or suggest dosage instructions.\n\n" +
      "If you are unwell or have symptoms, please speak immediately with a qualified doctor or pharmacist. In case of an emergency, contact your local medical emergency services." +
      SAFETY_GUARDRAIL_NOTE_EN
    );
  }

  // Question: 100% authenticity guarantee?
  if (
    q.includes("guarantee") ||
    q.includes("100%") ||
    q.includes("genuine") ||
    q.includes("authentic") ||
    q.includes("prove") ||
    q.includes("is my medicine fake")
  ) {
    return (
      "No automated platform, QR scanner, or OCR tool can independently guarantee that a medicine is 100% authentic or safe.\n\n" +
      "A scanned barcode or clear label only confirms that the printed text or code matches expected formats. Counterfeiters can sometimes copy barcodes onto fake packages. True scientific confirmation requires:\n" +
      "1. Verification from an authorized licensed distributor/pharmacy.\n" +
      "2. Official laboratory chemical assay analysis.\n" +
      "3. Checking the batch release status with the manufacturer or regulatory body (such as CDSCO or the FDA).\n\n" +
      "MedVerify helps you spot discrepancies and gather packaging details for verification, but never replaces physical pharmacist inspection." +
      SAFETY_GUARDRAIL_NOTE_EN
    );
  }

  // Question: How to read expiry date?
  if (q.includes("expiry") || q.includes("exp") || q.includes("date") || q.includes("shelf life")) {
    return (
      "How to inspect an Expiry Date on medicine packaging:\n\n" +
      "1. **Look for standard prefixes**: 'EXP', 'EXP. DT.', 'USE BEFORE', or 'VAL'.\n" +
      "2. **Format**: Typically 'MM/YYYY' (e.g. '08/2027') or 'DD/MM/YYYY'. If only month and year are given, the product generally expires on the last day of that month.\n" +
      "3. **Compare Strip vs. Box**: The expiry date printed on the foil strip must match the date stamped on the outer cardboard box.\n" +
      "4. **Never consume expired medicine**: Chemical compounds break down over time, lose potency, or become toxic.\n" +
      "5. **Signs of tampering**: Beware of stickers placed over the original embossed date or signs of scratched-off ink." +
      SAFETY_GUARDRAIL_NOTE_EN
    );
  }

  // Question: What is batch number?
  if (q.includes("batch") || q.includes("lot") || q.includes("b.no")) {
    return (
      "What is a Batch or Lot Number?\n\n" +
      "• **Definition**: A unique alphanumeric code (e.g., 'DL6509B') assigned to a specific production run of a medicine manufactured under uniform conditions.\n" +
      "• **Why it is critical**: If a manufacturer or government agency detects contamination or packaging defects, they issue a recall targeting that specific batch.\n" +
      "• **Where to find it**: Stamped or debossed on the side flap of the outer box and printed on the crimped edge or reverse foil of a blister pack (prefixed by 'B.No.' or 'Lot').\n" +
      "• **Inspection tip**: Both the inner blister and outer box must show identical batch numbers." +
      SAFETY_GUARDRAIL_NOTE_EN
    );
  }

  // Question: Fake packaging / Red flags?
  if (
    q.includes("fake") ||
    q.includes("counterfeit") ||
    q.includes("spot") ||
    q.includes("check") ||
    q.includes("packaging") ||
    q.includes("red flag")
  ) {
    return (
      "Key Red Flags of Suspect or Counterfeit Medicine Packaging:\n\n" +
      "1. **Spelling & Typography**: Look for misspellings in brand names or active ingredients (e.g., 'Paracetmol' instead of 'Paracetamol').\n" +
      "2. **Foil & Blister Quality**: Blister pockets should be crisp. If the foil is unusually thin, tears easily, or has loose seals, be suspicious.\n" +
      "3. **Physical Tablets**: Check for crumbling, unusual discoloration, irregular size, or foreign particles.\n" +
      "4. **Missing Information**: Mandatory labels include Mfg License Number (Mfg Lic No), Batch No, Mfg Date, Expiry Date, and Manufacturer Address.\n" +
      "5. **Suspicious Price**: Extremely steep discounts from unauthorized online vendors often correlate with substandard goods." +
      SAFETY_GUARDRAIL_NOTE_EN
    );
  }

  // Question: Where to report?
  if (
    q.includes("report") ||
    q.includes("complain") ||
    q.includes("regulator") ||
    q.includes("cdsco") ||
    q.includes("fda") ||
    q.includes("authority")
  ) {
    return (
      "Where to Report Suspect or Substandard Medicines:\n\n" +
      "• **India (CDSCO & PvPI)**: Call the national toll-free helpline at 1800-180-3024 or report to your State Drug Controller / CDSCO Sugam portal.\n" +
      "• **United States (FDA)**: Use FDA MedWatch (1-800-FDA-1088 or fda.gov/medwatch).\n" +
      "• **United Kingdom (MHRA)**: Submit a report through the Yellow Card Scheme (yellowcard.mhra.gov.uk).\n" +
      "• **European Union**: Contact your National Competent Authority or report through the EMA falsified medicines portal.\n" +
      "• **Immediate Action**: Stop taking the medication, retain the packaging and receipt, and notify your dispensing pharmacist immediately." +
      SAFETY_GUARDRAIL_NOTE_EN
    );
  }

  // Question: Storage?
  if (q.includes("storage") || q.includes("store") || q.includes("fridge") || q.includes("temperature")) {
    return (
      "General Pharmaceutical Storage Best Practices:\n\n" +
      "1. **Room Temperature**: Most standard tablets/capsules should be stored in a cool, dry place below 25°C or 30°C, away from direct sunlight.\n" +
      "2. **Avoid Bathrooms**: Heat and steam from showers degrade pills rapidly.\n" +
      "3. **Refrigerated Products (2°C - 8°C)**: Products like insulin, vaccines, and certain eye drops must be kept in a refrigerator (do not freeze).\n" +
      "4. **Keep in Original Packaging**: Blister foils protect sensitive compounds from ambient humidity." +
      SAFETY_GUARDRAIL_NOTE_EN
    );
  }

  // Default helpful response
  return (
    `Thank you for asking about "${query}".\n\n` +
    "As MedVerify's safety guide, I can assist you with:\n" +
    "• Understanding batch and lot numbers stamped on medicine blisters.\n" +
    "• Identifying manufacturing and expiry date codes.\n" +
    "• Spotting physical packaging discrepancies and counterfeit red flags.\n" +
    "• Finding official regulatory contacts (CDSCO, US FDA, MHRA, EMA).\n\n" +
    "Feel free to click any of the suggested prompt chips above or ask about specific packaging details." +
    SAFETY_GUARDRAIL_NOTE_EN
  );
}

/**
 * Knowledge response rules (Hindi)
 */
function getHindiResponse(query) {
  const q = query.toLowerCase();

  // Guardrail check
  if (
    q.includes("दवा कौन सी") ||
    q.includes("दर्द") ||
    q.includes("बुखार") ||
    q.includes("सिरदर्द") ||
    q.includes("खुराक") ||
    q.includes("कितनी गोली") ||
    q.includes("इलाज")
  ) {
    return (
      "मैं केवल दवा पैकेजिंग और सुरक्षा से जुड़ी जानकारी देने वाला सहायक हूँ। मैं किसी बीमारी का निदान, दवा की सिफारिश या खुराक (dosage) की सलाह नहीं दे सकता।\n\n" +
      "कृपया किसी भी स्वास्थ्य समस्या के लिए तुरंत किसी योग्य चिकित्सक या पंजीकृत फार्मासिस्ट से संपर्क करें।" +
      SAFETY_GUARDRAIL_NOTE_HI
    );
  }

  // Guarantee / Authentic
  if (q.includes("गारंटी") || q.includes("100%") || q.includes("असली") || q.includes("नकली") || q.includes("प्रमाणित")) {
    return (
      "कोई भी स्वचालित ऐप, क्यूआर स्कैनर या ओसीआर अकेले यह प्रमाणित नहीं कर सकता कि कोई दवा 100% असली है या नहीं।\n\n" +
      "स्कैनिंग केवल यह जांचती है कि पैकेजिंग पर छपा हुआ टेक्स्ट और कोड सही प्रारूप में है या नहीं। वैज्ञानिक पुष्टि के लिए:\n" +
      "1. अधिकृत मेडिकल स्टोर या फार्मासिस्ट से खरीद की पुष्टि करें।\n" +
      "2. निर्माता कंपनी या आधिकारिक नियामक (जैसे CDSCO) से बैच की स्थिति जांचें।\n" +
      "3. केवल प्रयोगशाला परीक्षण (Lab assay) से रासायनिक शुद्धता साबित होती है।" +
      SAFETY_GUARDRAIL_NOTE_HI
    );
  }

  // Expiry date
  if (q.includes("एक्सपायरी") || q.includes("तारीख") || q.includes("डेट") || q.includes("कब तक चलेगी")) {
    return (
      "दवा पैकेजिंग पर एक्सपायरी डेट कैसे जांचें:\n\n" +
      "1. 'EXP', 'EXP. DT.', या 'USE BEFORE' लेबल देखें।\n" +
      "2. आमतौर पर यह 'MM/YYYY' (जैसे 08/2027) प्रारूप में होता है।\n" +
      "3. हमेशा अंदर की स्ट्रिप और बाहर के डिब्बे दोनों पर छपी तारीख का मिलान करें।\n" +
      "4. एक्सपायर हो चुकी दवा का कभी भी सेवन न करें, क्योंकि वह बेअसर या हानिकारक हो सकती है।" +
      SAFETY_GUARDRAIL_NOTE_HI
    );
  }

  // Batch number
  if (q.includes("बैच") || q.includes("लॉट") || q.includes("batch")) {
    return (
      "बैच नंबर क्या होता है और यह क्यों जरूरी है?\n\n" +
      "• बैच नंबर (Batch No / Lot No) किसी दवा के विशिष्ट उत्पादन चक्र (production run) का पहचान कोड होता है।\n" +
      "• यदि किसी लॉट में कोई खराबी पाई जाती है, तो सरकार या कंपनी इसी बैच नंबर के आधार पर बाजार से दवा वापस (Recall) मंगाती है।\n" +
      "• सुनिश्चित करें कि स्ट्रिप और बॉक्स दोनों पर बैच नंबर बिल्कुल एक जैसा हो।" +
      SAFETY_GUARDRAIL_NOTE_HI
    );
  }

  // Fake packaging
  if (q.includes("पहचान") || q.includes("नकली") || q.includes("पैकेजिंग") || q.includes("जांच")) {
    return (
      "संदिग्ध या नकली पैकेजिंग के मुख्य लक्षण:\n\n" +
      "1. नाम या सॉल्ट की स्पेलिंग में गलतियाँ (जैसे 'Paracetamol' की जगह गलत वर्तनी)।\n" +
      "2. धुंधली छपाई या आसानी से फटने वाली पतली फॉयल।\n" +
      "3. गोलियों का रंग बदलना, चटकना या पाउडर में बदलना।\n" +
      "4. मैन्युफैक्चरिंग लाइसेंस नंबर (Mfg Lic No) का न होना।\n" +
      "5. अत्यधिक या अस्वाभाविक छूट।" +
      SAFETY_GUARDRAIL_NOTE_HI
    );
  }

  // Report
  if (q.includes("शिकायत") || q.includes("कहाँ") || q.includes("रिपोर्ट") || q.includes("cdsco")) {
    return (
      "संदिग्ध दवा की शिकायत कहाँ करें:\n\n" +
      "• भारत में CDSCO एवं राष्ट्रीय फार्माकोविजिलेंस प्रोग्राम (PvPI) के टोल-फ्री नंबर 1800-180-3024 पर संपर्क करें।\n" +
      "• अपने राज्य के ड्रग कंट्रोलर कार्यालय में शिकायत दर्ज कराएं।\n" +
      "• दवा का सेवन तुरंत बंद करें, उसका बिल व पैकेजिंग संभाल कर रखें, और अपने फार्मासिस्ट को सूचित करें।" +
      SAFETY_GUARDRAIL_NOTE_HI
    );
  }

  // Default Hindi
  return (
    `आपके सवाल "${query}" के संबंध में:\n\n` +
    "मेडिबॉट आपको निम्नलिखित विषयों पर जानकारी प्रदान कर सकता है:\n" +
    "• दवा के पत्ते पर बैच और एक्सपायरी डेट पढ़ना।\n" +
    "• पैकेजिंग सुरक्षा संकेत और नकली दवाओं के लक्षण पहचानना।\n" +
    "• आधिकारिक स्वास्थ्य नियामकों से संपर्क करने के तरीके।\n\n" +
    "आप ऊपर दिए गए किसी भी सुझाव पर क्लिक कर सकते हैं।" +
    SAFETY_GUARDRAIL_NOTE_HI
  );
}

/**
 * Main query handler.
 * Generates response with slight simulation delay to mimic assistant response.
 */
export async function getBotResponse(userQuery, language = "en") {
  // Simulate natural assistant latency
  await new Promise((resolve) => setTimeout(resolve, 400));

  const text =
    language === "hi" ? getHindiResponse(userQuery) : getEnglishResponse(userQuery);

  return {
    id: "bot-" + Date.now(),
    sender: "bot",
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    language
  };
}

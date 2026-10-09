/**
 * Demo Medicine Reference Catalog
 * Used for demonstrating data structure matching, dosage validation, and schedule classification.
 * NOTE: This is a reference demonstration database. In production, this service layer
 * interfaces with authorized government registers (CDSCO Sugam, FDA Orange Book, etc.).
 */

export const DEMO_CATALOG = [
  {
    id: "REF-PARA-650",
    name: "Paracetamol Tablets 650mg",
    aliases: ["Dolo 650", "Calpol 650", "Crocin 650", "Paracetamol 650"],
    genericName: "Paracetamol (Acetaminophen)",
    strength: "650 mg",
    dosageForm: "Tablet",
    therapeuticClass: "Analgesic & Antipyretic",
    scheduleClass: "OTC",
    standardBatchFormat: "^[A-Z0-9]{6,10}$",
    typicalShelfLifeMonths: 36,
    storageAdvice: "Store protected from moisture and direct sunlight at a temperature not exceeding 30°C.",
    knownManufacturers: ["Micro Labs Ltd.", "GSK Pharmaceuticals", "Apex Laboratories", "Cipla Ltd."],
    commonPackagingTraits: {
      packagingType: "Blister strip of 15 tablets",
      colorCode: "White to off-white round tablet, embossed or plain score-line",
      mandatoryWarnings: "Taking more than daily dose may cause serious liver damage or allergic reactions."
    },
    referenceStandard: "IP / BP / USP Pharmacopoeia"
  },
  {
    id: "REF-AMOX-625",
    name: "Amoxicillin and Potassium Clavulanate Tablets 625mg",
    aliases: ["Augmentin 625", "Moxikind-CV 625", "Clavam 625", "Amoxiclav 625"],
    genericName: "Amoxicillin Trihydrate (500mg) + Potassium Clavulanate (125mg)",
    strength: "500 mg + 125 mg (625 mg total)",
    dosageForm: "Film-coated Tablet",
    therapeuticClass: "Broad Spectrum Antibacterial",
    scheduleClass: "SCHEDULE_H1",
    standardBatchFormat: "^[A-Z0-9]{6,12}$",
    typicalShelfLifeMonths: 24,
    storageAdvice: "Store protected from moisture at a temperature not exceeding 25°C. Keep desiccant in bottle or strip tightly sealed.",
    knownManufacturers: ["GlaxoSmithKline Pharmaceuticals", "Mankind Pharma Ltd.", "Alkem Laboratories"],
    commonPackagingTraits: {
      packagingType: "Alu-Alu blister foil with red Schedule H1 warning banner",
      colorCode: "White oval biconvex film-coated tablets",
      mandatoryWarnings: "SCHEDULE H1 PRESCRIPTION DRUG - CAUTION: To be sold by retail on prescription only."
    },
    referenceStandard: "IP / BP Pharmacopoeia"
  },
  {
    id: "REF-METF-500",
    name: "Metformin Hydrochloride Sustained Release Tablets 500mg",
    aliases: ["Glycomet 500 SR", "Glucophage 500", "Obimet 500 SR", "Metformin 500"],
    genericName: "Metformin Hydrochloride",
    strength: "500 mg",
    dosageForm: "Sustained-Release Tablet",
    therapeuticClass: "Antidiabetic (Biguanide)",
    scheduleClass: "SCHEDULE_H",
    standardBatchFormat: "^[A-Z0-9]{6,10}$",
    typicalShelfLifeMonths: 36,
    storageAdvice: "Store below 25°C in a dry place. Protect from light.",
    knownManufacturers: ["USV Pvt. Ltd.", "Sun Pharmaceutical Industries", "Torrent Pharmaceuticals"],
    commonPackagingTraits: {
      packagingType: "Blister strip of 10 or 20 tablets with red Rx Schedule H box",
      colorCode: "White, capsule-shaped, biconvex tablets",
      mandatoryWarnings: "SCHEDULE H PRESCRIPTION DRUG - CAUTION: Not to be sold without doctor prescription."
    },
    referenceStandard: "IP / USP Pharmacopoeia"
  },
  {
    id: "REF-PANT-40",
    name: "Pantoprazole Gastro-Resistant Tablets 40mg",
    aliases: ["Pan 40", "Pantocid 40", "Pantodac 40", "Pantoprazole 40"],
    genericName: "Pantoprazole Sodium Sesquihydrate",
    strength: "40 mg",
    dosageForm: "Enteric-coated Tablet",
    therapeuticClass: "Proton Pump Inhibitor (PPI)",
    scheduleClass: "SCHEDULE_H",
    standardBatchFormat: "^[A-Z0-9]{6,10}$",
    typicalShelfLifeMonths: 24,
    storageAdvice: "Store in a cool and dry place. Protect from direct sunlight and moisture.",
    knownManufacturers: ["Alkem Laboratories", "Sun Pharmaceutical Industries", "Zydus Healthcare"],
    commonPackagingTraits: {
      packagingType: "Alu-Alu blister packaging",
      colorCode: "Yellow, oval, biconvex enteric-coated tablets",
      mandatoryWarnings: "Swallow whole, do not crush or chew."
    },
    referenceStandard: "IP Pharmacopoeia"
  },
  {
    id: "REF-ATOR-10",
    name: "Atorvastatin Calcium Tablets 10mg",
    aliases: ["Atorva 10", "Lipitor 10", "Storvas 10", "Atocor 10"],
    genericName: "Atorvastatin Calcium",
    strength: "10 mg",
    dosageForm: "Film-coated Tablet",
    therapeuticClass: "Lipid-lowering agent (Statin)",
    scheduleClass: "SCHEDULE_H",
    standardBatchFormat: "^[A-Z0-9]{6,10}$",
    typicalShelfLifeMonths: 24,
    storageAdvice: "Store below 30°C in a dry place. Protect from heat and moisture.",
    knownManufacturers: ["Zydus Lifesciences", "Pfizer Ltd.", "Sun Pharma"],
    commonPackagingTraits: {
      packagingType: "Alu-Alu blister strip",
      colorCode: "White elliptical film-coated tablets",
      mandatoryWarnings: "Contraindicated during pregnancy and lactation."
    },
    referenceStandard: "IP / USP Pharmacopoeia"
  },
  {
    id: "REF-CETR-10",
    name: "Cetirizine Hydrochloride Tablets 10mg",
    aliases: ["Cetzine 10", "Zyrtec 10", "Alerid 10", "Okacet 10"],
    genericName: "Cetirizine Hydrochloride",
    strength: "10 mg",
    dosageForm: "Tablet",
    therapeuticClass: "Second-generation Antihistamine",
    scheduleClass: "OTC",
    standardBatchFormat: "^[A-Z0-9]{5,10}$",
    typicalShelfLifeMonths: 36,
    storageAdvice: "Store protected from light and moisture at a temperature not exceeding 25°C.",
    knownManufacturers: ["Dr. Reddy's Laboratories", "Cipla Ltd.", "Cipla Health"],
    commonPackagingTraits: {
      packagingType: "Blister strip of 10 tablets",
      colorCode: "White round scored tablets",
      mandatoryWarnings: "May cause drowsiness in sensitive individuals. Avoid alcohol during use."
    },
    referenceStandard: "IP / BP / USP Pharmacopoeia"
  }
];

export const DEMO_PREFILLS = [
  {
    name: "Dolo 650",
    batch: "DL6509B",
    expiryDate: "2027-08",
    manufacturer: "Micro Labs Ltd.",
    dosageForm: "Tablet"
  },
  {
    name: "Augmentin 625",
    batch: "AG9140C",
    expiryDate: "2026-11",
    manufacturer: "GlaxoSmithKline Pharmaceuticals",
    dosageForm: "Tablet"
  },
  {
    name: "Glycomet 500 SR",
    batch: "GM5021A",
    expiryDate: "2027-03",
    manufacturer: "USV Pvt. Ltd.",
    dosageForm: "Tablet"
  }
];

/**
 * Medicine Knowledge Constants
 * Information standards, packaging inspection checklists, regulatory registers, and safety disclaimers.
 */

export const SAFETY_DISCLAIMER =
  "CRITICAL SAFETY NOTICE: Automated QR/barcode scanning, packaging OCR, and data structure lookups assist in reading packaging details. They CANNOT scientifically confirm whether a medicine is genuine, chemically pure, untampered, properly stored, or approved by a regulatory body. Always inspect physical tamper seals and consult a licensed pharmacist or physician for any medicine safety questions.";

export const REGULATORY_REGISTRIES = [
  {
    country: "India",
    agency: "CDSCO (Central Drugs Standard Control Organisation)",
    portalName: "SUGAM Online Portal",
    url: "https://cdsco.gov.in",
    helpline: "Toll-free PvPI: 1800-180-3024",
    description: "National regulatory body for pharmaceuticals and medical devices in India. Use the Sugam portal for approved drug lists and pharmacovigilance reports.",
    reportingAction: "Report adverse drug events to the National Pharmacovigilance Programme of India (PvPI)."
  },
  {
    country: "United States",
    agency: "US FDA (Food and Drug Administration)",
    portalName: "FDA Orange Book & MedWatch",
    url: "https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program",
    helpline: "1-800-FDA-1088 (1-800-332-1088)",
    description: "Evaluates therapeutic equivalence and monitors post-market drug safety. Access the Orange Book for approved drug products with therapeutic equivalence evaluations.",
    reportingAction: "Submit suspect counterfeit medicines or adverse events through the FDA MedWatch online portal."
  },
  {
    country: "United Kingdom",
    agency: "MHRA (Medicines and Healthcare products Regulatory Agency)",
    portalName: "Yellow Card Scheme",
    url: "https://yellowcard.mhra.gov.uk",
    helpline: "0800 731 6789",
    description: "Regulates medicines, medical devices and blood components for safety and efficacy in the UK.",
    reportingAction: "Report defective medicines, fake packaging, or adverse drug reactions via the MHRA Yellow Card Scheme."
  },
  {
    country: "European Union",
    agency: "EMA (European Medicines Agency)",
    portalName: "Union Register of Medicinal Products",
    url: "https://www.ema.europa.eu",
    helpline: "+31 (0)88 781 6000",
    description: "Coordinates drug evaluation and safety monitoring across all European Union member states.",
    reportingAction: "Report suspected counterfeit medicines through your national competent authority or the EMA falsified medicines portal."
  },
  {
    country: "Global",
    agency: "WHO (World Health Organization)",
    portalName: "Global Surveillance and Monitoring System (GSMS)",
    url: "https://www.who.int/teams/regulation-prequalification/incidents-and-substandard-falsified-medicines",
    helpline: "rapidalert@who.int",
    description: "Coordinates global intelligence on substandard and falsified (SF) medical products.",
    reportingAction: "Browse global Medical Product Alerts issued for suspect batches in circulation."
  }
];

export const PACKAGING_INSPECTION_CHECKLIST = [
  {
    id: "seal",
    title: "Tamper-Evident Seal & Closure",
    instruction: "Check if the bottle cap seal, blister foil, or outer box security sticker is unbroken, properly aligned, and has no signs of puncture or glue residue.",
    importance: "High",
    warningSign: "Broken foil, resealed tape, irregular perforation, loose bottle ring."
  },
  {
    id: "typography",
    title: "Spelling & Typography Quality",
    instruction: "Examine brand name, active salt composition, and manufacturer address for misspellings, blurred printing, font inconsistencies, or fading ink.",
    importance: "High",
    warningSign: "Spelling mistakes in salt names (e.g., 'Paracetmol' vs 'Paracetamol'), blotchy ink, low-resolution dot matrix."
  },
  {
    id: "batch_expiry",
    title: "Batch, Mfg Date & Expiry Dates",
    instruction: "Verify that the batch number, manufacturing date, and expiry date printed on the primary blister/strip match those printed on the secondary outer carton.",
    importance: "Critical",
    warningSign: "Mismatch between inner strip and outer carton, scratched-out dates, sticker placed over original expiry date."
  },
  {
    id: "hologram",
    title: "Hologram & Optical Security Foil",
    instruction: "Tilt the packaging under direct light to check if the security hologram reflects distinct color-shifts, micro-text, or genuine manufacturer crests.",
    importance: "Medium",
    warningSign: "Dull metallic sticker that does not change colors, peeling sticker without tamper track."
  },
  {
    id: "mrp_license",
    title: "Manufacturing License & MRP",
    instruction: "Check for a valid Manufacturing License Number (e.g. 'Mfg Lic No: M/123/2018') and clear Maximum Retail Price (MRP) including taxes.",
    importance: "Medium",
    warningSign: "Missing Mfg Lic No, altered price stickers, unrealistic heavy discounts on vital medications."
  },
  {
    id: "physical_form",
    title: "Tablet / Liquid Physical Appearance",
    instruction: "Inspect the physical medicine for unusual discoloration, crumbling tablets, cracks, excessive powder dust, unusual odor, or cloudy liquid in clear vials.",
    importance: "Critical",
    warningSign: "Discoloration, foul or foreign odor, brittle crumbling tablets, precipitation in clear syrups."
  }
];

export const SCHEDULE_INFO = {
  SCHEDULE_H: {
    label: "Schedule H (Prescription Only)",
    warning: "Warning: To be sold by retail on the prescription of a Registered Medical Practitioner only.",
    color: "#b42318"
  },
  SCHEDULE_H1: {
    label: "Schedule H1 (Controlled Antibiotic/Habit-Forming)",
    warning: "Warning: It is dangerous to take this preparation except in accordance with the medical advice. Not to be sold without prescription.",
    color: "#d92d20"
  },
  OTC: {
    label: "Over-the-Counter (General Sale)",
    warning: "Safe for purchase without prescription when used strictly according to label directions and dosage instructions.",
    color: "#1b6b47"
  }
};

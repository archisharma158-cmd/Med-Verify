import { useState } from "react";
import { Search, Sparkles, AlertCircle, RotateCcw } from "lucide-react";
import { DEMO_PREFILLS } from "../../constants/demoCatalog";

export default function ManualEntryForm({ onSubmitDetails }) {
  const [medicineName, setMedicineName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [dosageForm, setDosageForm] = useState("Tablet");

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!medicineName.trim()) {
      errs.medicineName = "Medicine or product name is required.";
    } else if (medicineName.trim().length < 2) {
      errs.medicineName = "Name must be at least 2 characters.";
    }

    if (batchNumber.trim() && batchNumber.trim().length < 3) {
      errs.batchNumber = "Batch number should typically be at least 3 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitDetails({
        medicineName: medicineName.trim(),
        batchNumber: batchNumber.trim(),
        expiryDate: expiryDate.trim(),
        manufacturer: manufacturer.trim(),
        dosageForm,
        source: "manual"
      });
      setIsSubmitting(false);
    }, 200);
  };

  const handleApplyPrefill = (preset) => {
    setMedicineName(preset.name);
    setBatchNumber(preset.batch);
    setExpiryDate(preset.expiryDate);
    setManufacturer(preset.manufacturer);
    setDosageForm(preset.dosageForm || "Tablet");
    setErrors({});
  };

  const handleReset = () => {
    setMedicineName("");
    setBatchNumber("");
    setExpiryDate("");
    setManufacturer("");
    setDosageForm("Tablet");
    setErrors({});
  };

  return (
    <div className="mv-manual-tab">
      <div className="mv-tab-intro">
        <h3>Manual Packaging Details Entry</h3>
        <p>
          Enter the pharmaceutical details printed on your packaging. You do not need to fill every optional field.
        </p>
      </div>

      {/* Quick Demo Prefill Presets */}
      <div className="mv-prefills-bar">
        <span className="mv-prefill-label">
          <Sparkles size={14} /> Quick Demo Presets:
        </span>
        <div className="mv-prefill-chips">
          {DEMO_PREFILLS.map((item) => (
            <button
              key={item.name}
              type="button"
              className="mv-prefill-chip"
              onClick={() => handleApplyPrefill(item)}
              title={`Load demo details for ${item.name}`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <form className="mv-manual-form" onSubmit={handleSubmit} noValidate>
        {/* Medicine Name (Required) */}
        <div className="mv-form-field">
          <label htmlFor="mv-input-name">
            Medicine / Product Brand or Generic Name <span className="mv-required">*</span>
          </label>
          <div className={`mv-input-wrapper ${errors.medicineName ? "has-error" : ""}`}>
            <input
              id="mv-input-name"
              type="text"
              value={medicineName}
              onChange={(e) => {
                setMedicineName(e.target.value);
                if (errors.medicineName) setErrors((prev) => ({ ...prev, medicineName: "" }));
              }}
              placeholder="e.g. Dolo 650, Augmentin, Paracetamol Tablets IP"
              aria-required="true"
              aria-invalid={Boolean(errors.medicineName)}
            />
          </div>
          {errors.medicineName && (
            <p className="mv-field-error" role="alert">
              <AlertCircle size={13} /> {errors.medicineName}
            </p>
          )}
        </div>

        {/* Row 1: Batch & Expiry */}
        <div className="mv-form-row">
          <div className="mv-form-field">
            <label htmlFor="mv-input-batch">
              Batch or Lot Number <span className="mv-optional">(Optional)</span>
            </label>
            <div className={`mv-input-wrapper ${errors.batchNumber ? "has-error" : ""}`}>
              <input
                id="mv-input-batch"
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                placeholder="e.g. DL6509B, AG9140C"
              />
            </div>
            {errors.batchNumber && (
              <p className="mv-field-error" role="alert">
                <AlertCircle size={13} /> {errors.batchNumber}
              </p>
            )}
            <small className="mv-field-helper">Look for &quot;B.No.&quot; or &quot;Lot&quot; on packaging flap</small>
          </div>

          <div className="mv-form-field">
            <label htmlFor="mv-input-exp">
              Expiry Date <span className="mv-optional">(Optional)</span>
            </label>
            <div className="mv-input-wrapper">
              <input
                id="mv-input-exp"
                type="month"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="YYYY-MM"
              />
            </div>
            <small className="mv-field-helper">Printed as &quot;EXP&quot; or &quot;Use Before&quot;</small>
          </div>
        </div>

        {/* Row 2: Manufacturer & Dosage Form */}
        <div className="mv-form-row">
          <div className="mv-form-field">
            <label htmlFor="mv-input-mfr">
              Manufacturer Name <span className="mv-optional">(Optional)</span>
            </label>
            <div className="mv-input-wrapper">
              <input
                id="mv-input-mfr"
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Micro Labs Ltd, GSK, Cipla"
              />
            </div>
          </div>

          <div className="mv-form-field">
            <label htmlFor="mv-input-dosage">
              Dosage Form <span className="mv-optional">(Optional)</span>
            </label>
            <div className="mv-input-wrapper">
              <select
                id="mv-input-dosage"
                value={dosageForm}
                onChange={(e) => setDosageForm(e.target.value)}
              >
                <option value="Tablet">Tablet / Caplet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup / Oral Liquid</option>
                <option value="Injection">Injection / Vial</option>
                <option value="Ointment">Cream / Ointment</option>
                <option value="Drops">Eye / Ear Drops</option>
                <option value="Inhaler">Inhaler / Respule</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mv-form-actions">
          <button
            type="submit"
            className="mv-btn-primary mv-btn-submit-manual"
            disabled={isSubmitting}
          >
            <Search size={17} />
            <span>{isSubmitting ? "Evaluating..." : "Check Medicine Information"}</span>
          </button>

          <button
            type="button"
            className="mv-btn-outline"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            <RotateCcw size={15} />
            <span>Reset Form</span>
          </button>
        </div>
      </form>
    </div>
  );
}

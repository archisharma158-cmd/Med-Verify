import { useState } from "react";
import { CheckSquare, Square, ShieldCheck, AlertCircle } from "lucide-react";
import { PACKAGING_INSPECTION_CHECKLIST } from "../../constants/medicineKnowledge";

export default function PackagingChecklist() {
  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheck = (id) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const total = PACKAGING_INSPECTION_CHECKLIST.length;
  const completed = Object.values(checkedItems).filter(Boolean).length;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="mv-checklist-card">
      <div className="mv-checklist-header">
        <div className="mv-checklist-title">
          <ShieldCheck size={20} />
          <div>
            <h4>Physical Packaging Safety Checklist</h4>
            <p>Perform these physical checks on the packaging before consuming any medication.</p>
          </div>
        </div>

        <div className="mv-checklist-progress-pill">
          <span className="mv-progress-fraction">{completed}/{total} Completed</span>
          <div className="mv-progress-mini-bar">
            <div className="fill" style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>

      <div className="mv-checklist-items">
        {PACKAGING_INSPECTION_CHECKLIST.map((item) => {
          const isDone = Boolean(checkedItems[item.id]);

          return (
            <div
              key={item.id}
              className={`mv-check-row ${isDone ? "is-checked" : ""}`}
              onClick={() => toggleCheck(item.id)}
              role="checkbox"
              aria-checked={isDone}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleCheck(item.id);
                }
              }}
            >
              <div className="mv-check-icon">
                {isDone ? (
                  <CheckSquare size={20} className="text-emerald" />
                ) : (
                  <Square size={20} className="text-muted" />
                )}
              </div>

              <div className="mv-check-content">
                <div className="mv-check-top">
                  <span className="mv-check-title">{item.title}</span>
                  <span className={`mv-importance-tag tag-${item.importance.toLowerCase()}`}>
                    {item.importance} Priority
                  </span>
                </div>
                <p className="mv-check-instruction">{item.instruction}</p>
                <div className="mv-check-warning-sign">
                  <AlertCircle size={13} />
                  <span>Warning Sign: {item.warningSign}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

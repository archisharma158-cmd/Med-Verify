import { CheckCircle2, AlertTriangle, AlertOctagon, Info, Database } from "lucide-react";

export default function StatusBadge({ type = "extracted", label, size = "md" }) {
  let icon;
  let className;

  switch (type) {
    case "matched":
    case "catalog_matched":
      icon = <CheckCircle2 size={size === "sm" ? 12 : 14} />;
      className = "mv-badge mv-badge-success";
      break;
    case "expired":
    case "expired_warning":
      icon = <AlertOctagon size={size === "sm" ? 12 : 14} />;
      className = "mv-badge mv-badge-danger";
      break;
    case "warning":
    case "expiring_soon":
      icon = <AlertTriangle size={size === "sm" ? 12 : 14} />;
      className = "mv-badge mv-badge-warning";
      break;
    case "demo":
      icon = <Database size={size === "sm" ? 12 : 14} />;
      className = "mv-badge mv-badge-demo";
      break;
    default:
      icon = <Info size={size === "sm" ? 12 : 14} />;
      className = "mv-badge mv-badge-neutral";
      break;
  }

  return (
    <span className={`${className} mv-badge-${size}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
}

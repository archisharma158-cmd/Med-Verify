import { ShieldAlert, Info, AlertTriangle, Database } from "lucide-react";

export default function DisclaimerAlert({
  variant = "warning",
  title = "Safety Disclaimer",
  children,
  actionButton = null
}) {
  let icon = <AlertTriangle size={20} />;
  let alertClass = "mv-alert-warning";

  if (variant === "danger") {
    icon = <ShieldAlert size={20} />;
    alertClass = "mv-alert-danger";
  } else if (variant === "info") {
    icon = <Info size={20} />;
    alertClass = "mv-alert-info";
  } else if (variant === "demo") {
    icon = <Database size={20} />;
    alertClass = "mv-alert-demo";
  }

  return (
    <div className={`mv-alert-box ${alertClass}`} role="note">
      <div className="mv-alert-icon-col">{icon}</div>
      <div className="mv-alert-content-col">
        {title && <strong className="mv-alert-title">{title}</strong>}
        <div className="mv-alert-body">{children}</div>
      </div>
      {actionButton && <div className="mv-alert-action-col">{actionButton}</div>}
    </div>
  );
}

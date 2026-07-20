import React from "react";
import logoUrl from "../asg-logo.jpg";

export function ApexLogo({
  className = "",
  size = "md",
  showText = true,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}) {
  const height = size === "sm" ? 28 : size === "lg" ? 48 : 36;

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img src={logoUrl} alt="Apex Startup Group" className="object-contain" style={{ height }} />
    </div>
  );
}

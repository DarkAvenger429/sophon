import React, { ReactNode } from "react";

interface CardShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const CardShell: React.FC<CardShellProps> = ({ title, subtitle, children }) => {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1180,
        margin: "0 auto",
        background:
          "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(2,6,23,0.96))",
        borderRadius: 24,
        border: "1px solid rgba(55,65,81,0.9)",
        boxShadow: "0 18px 45px rgba(0,0,0,0.55)",
        padding: "18px 16px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          borderBottom: "1px solid rgba(31,41,55,0.9)",
          paddingBottom: 8,
          marginBottom: 4,
        }}
      >
        <div
          style={{
            fontSize: 14,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#cbd5f5",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginTop: 2,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

export default CardShell;

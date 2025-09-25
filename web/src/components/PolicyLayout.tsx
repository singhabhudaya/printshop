import type { ReactNode } from "react";

export default function PolicyLayout({
  title,
  children,
}: { title: string; children: ReactNode }) {
  return (
    <main style={{ maxWidth: 880, margin: "40px auto", padding: "0 20px" }}>
      <h1 style={{ marginBottom: 8 }}>{title}</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        <strong>Last updated:</strong> {/* set dynamically if you like */}
        {" "} {new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
      </p>
      <div className="policy-content">{children}</div>
    </main>
  );
}

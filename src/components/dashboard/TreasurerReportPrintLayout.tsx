import { forwardRef } from "react";
import logoMain from "@/assets/logo-main.png";
import ppcLogo from "@/assets/ppc logo.png";

interface TreasurerReportPrintLayoutProps {
  narrative: string;
  asOfDate: string;
}

// Renders the Treasurer's Report exactly as it should look on the
// generated PDF: org header, title, narrative paragraphs, then two
// signature blocks side by side. Rendered off-screen and captured with
// html2canvas, so sizing is fixed pixels (portrait document).
const TreasurerReportPrintLayout = forwardRef
<
  HTMLDivElement,
  TreasurerReportPrintLayoutProps
>(({ narrative, asOfDate }, ref) => {
  const paragraphs = narrative
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      ref={ref}
      style={{
        width: "1000px",
        padding: "48px",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        fontFamily: "'Sitka Display', Georgia, 'Times New Roman', serif",
        fontSize: "15px",
        color: "#000",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          paddingBottom: "20px",
          borderBottom: "2px solid #000",
          marginBottom: "28px",
        }}
      >
        <img
          src={logoMain}
          alt="CARAS Logo"
          style={{ width: "64px", height: "64px", objectFit: "contain" }}
        />
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 700, fontSize: "16px", margin: 0 }}>
            Minor Basilica and San Sebastian Parish
          </p>
          <p style={{ fontWeight: 700, fontSize: "16px", margin: 0 }}>
            Shrine of Our Lady of Mount Carmel
          </p>
          <p style={{ fontWeight: 700, fontSize: "16px", margin: "0 0 4px 0" }}>
            Confraternity of Augustinian Recollect Altar Server
          </p>
        </div>
        <img
          src={ppcLogo}
          alt="PPC Logo"
          style={{ width: "58px", height: "58px", objectFit: "contain" }}
        />
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <p
          style={{
            fontWeight: 700,
            fontSize: "18px",
            margin: 0,
            textDecoration: "underline",
          }}
        >
          Treasurer's Report
        </p>
        <p style={{ fontSize: "13px", margin: "4px 0 0 0", color: "#333" }}>
          As of {asOfDate}
        </p>
      </div>

      {/* Narrative */}
      <div style={{ marginTop: "28px" }}>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            style={{
              margin: "0 0 36px 0",
              lineHeight: 2.4,
              textAlign: "justify",
            }}
          >
            {p}
          </p>
        ))}
      </div>

      {/* Signatures */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "72px",
          gap: "40px",
        }}
      >
        <div style={{ textAlign: "center", width: "40%" }}>
          <p style={{ margin: "0 0 4px 0", fontWeight: 700 }}>
            Arturo P. Cerillo Jr.
          </p>
          <div style={{ borderTop: "1px solid #000", width: "180px", margin: "4px auto" }} />
            <span style={{ position: "relative", top: "-6px" }}>
                <p style={{ margin: 0, fontSize: "13px" }}>President</p>
             </span>
        </div>
        <div style={{ textAlign: "center", width: "40%" }}>
          <p style={{ margin: "0 0 4px 0", fontWeight: 700 }}>
            Mario R. Ledres Jr.
          </p>
          <div style={{ borderTop: "1px solid #000", width: "180px", margin: "4px auto" }} />
            <span style={{ position: "relative", top: "-6px" }}>
                 <p style={{ margin: 0, fontSize: "13px" }}>Treasurer</p>
            </span>        
        </div>
      </div>
    </div>
  );
});

TreasurerReportPrintLayout.displayName = "TreasurerReportPrintLayout";

export default TreasurerReportPrintLayout;
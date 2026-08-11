import { forwardRef } from "react";
import logoMain from "@/assets/logo-main.png";
import ppcLogo from "@/assets/ppc logo.png";
import { format } from "date-fns";

export interface DonationExportRow {
  id: string;
  donor_display: string;
  date_received: string;
  amount: number;
  note: string | null;
}

interface DonationsPrintLayoutProps {
  rows: DonationExportRow[];
  total: number;
}

function formatPeso(amount: number) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return format(d, "MMM d, yyyy");
  } catch {
    return value;
  }
}

// Rendered off-screen and captured with html2canvas — same approach as
// PenaltiesPrintLayout / ContributionsPrintLayout.
const DonationsPrintLayout = forwardRef<HTMLDivElement, DonationsPrintLayoutProps>(
  ({ rows, total }, ref) => {
    const donorColWidth = 220;
    const dateColWidth = 130;
    const amountColWidth = 120;
    const noteColWidth = 300;
    const tableWidth = donorColWidth + dateColWidth + amountColWidth + noteColWidth;

    return (
      <div
        ref={ref}
        style={{
          width: `${tableWidth + 48}px`,
          padding: "24px",
          boxSizing: "border-box",
          backgroundColor: "#ffffff",
          fontFamily: "'Sitka Display', Georgia, 'Times New Roman', serif",
          fontSize: "11px",
          color: "#000",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "32px",
            paddingBottom: "16px",
          }}
        >
          <img
            src={logoMain}
            alt="CARAS Logo"
            style={{ width: "70px", height: "70px", objectFit: "contain" }}
          />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 700, fontSize: "17px", margin: 0 }}>
              Minor Basilica and San Sebastian Parish
            </p>
            <p style={{ fontWeight: 700, fontSize: "17px", margin: 0 }}>
              Shrine of Our Lady of Mount Carmel
            </p>
            <p style={{ fontWeight: 700, fontSize: "17px", margin: "0 0 5px 0" }}>
              Confraternity of Augustinian Recollect Altar Server
            </p>
          </div>
          <img
            src={ppcLogo}
            alt="PPC Logo"
            style={{ width: "62px", height: "62px", objectFit: "contain" }}
          />
        </div>

        {/* Title bar */}
        <div
          style={{
            backgroundColor: "#84e28e",
            textAlign: "center",
            padding: "6px 0",
            fontWeight: 700,
            fontStyle: "italic",
            fontSize: "13px",
          }}
        >
          <span style={{ position: "relative", top: "-6px" }}>
            Official Donations Report
          </span>
        </div>

        {/* Table */}
        <table
          style={{
            width: `${tableWidth}px`,
            borderCollapse: "collapse",
            fontSize: "13px",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#fffecb" }}>
              <th style={{ width: `${donorColWidth}px`, padding: "6px 8px" }}>
                <span style={{ position: "relative", top: "-6px" }}>
                  <div style={cellContentStyle("left", true)}>Donor:</div>
                </span>
              </th>
              <th style={{ width: `${dateColWidth}px`, padding: "6px 8px" }}>
                <span style={{ position: "relative", top: "-6px" }}>
                  <div style={cellContentStyle("center", true)}>Date Received:</div>
                </span>
              </th>
              <th style={{ width: `${amountColWidth}px`, padding: "6px 8px" }}>
                <span style={{ position: "relative", top: "-6px" }}>
                  <div style={cellContentStyle("center", true)}>Amount:</div>
                </span>
              </th>
              <th style={{ width: `${noteColWidth}px`, padding: "6px 8px" }}>
                <span style={{ position: "relative", top: "-6px" }}>
                  <div style={cellContentStyle("left", true)}>Note:</div>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: "4px 8px", border: "none" }}>
                  <div style={cellContentStyle("left")}>{r.donor_display}</div>
                </td>
                <td style={{ padding: "4px 8px", border: "none" }}>
                  <div style={cellContentStyle("center")}>
                    {formatDate(r.date_received)}
                  </div>
                </td>
                <td style={{ padding: "4px 8px", border: "none" }}>
                  <div style={cellContentStyle("center")}>
                    {formatPeso(Number(r.amount))}
                  </div>
                </td>
                <td style={{ padding: "4px 8px", border: "none" }}>
                  <div style={cellContentStyle("left")}>{r.note || "—"}</div>
                </td>
              </tr>
            ))}

            {/* Total */}
            <tr>
              <td colSpan={4} style={{ height: "6px", border: "none" }} />
            </tr>
            <tr style={{ borderTop: "2px solid #000" }}>
              <td colSpan={4} style={{ padding: "6px 8px", border: "none" }}>
                <div style={cellContentStyle("left", true)}>
                  Total Donations: {formatPeso(total)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
);

DonationsPrintLayout.displayName = "DonationsPrintLayout";

function cellContentStyle(
  align: "left" | "center",
  bold = false
): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: align === "center" ? "center" : "flex-start",
    height: "100%",
    fontStyle: bold ? "italic" : undefined,
    fontWeight: bold ? 700 : undefined,
  };
}

export default DonationsPrintLayout;
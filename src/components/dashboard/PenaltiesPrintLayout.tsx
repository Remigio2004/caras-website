import { forwardRef } from "react";
import logoMain from "@/assets/logo-main.png";
import ppcLogo from "@/assets/ppc logo.png";
import { format } from "date-fns";

export interface PenaltyExportRow {
  id: string;
  full_name: string;
  date_absent: string;
  reason: string | null;
  penalty_amount: number;
  status: "paid" | "unpaid";
  paid_date: string | null;
}

interface PenaltiesPrintLayoutProps {
  rows: PenaltyExportRow[];
  totals: { unpaid: number; paid: number };
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

// Rendered off-screen and captured with html2canvas, so sizing here is in
// fixed pixels (not responsive) — same approach as ContributionsPrintLayout.
const PenaltiesPrintLayout = forwardRef<HTMLDivElement, PenaltiesPrintLayoutProps>(
  ({ rows, totals }, ref) => {
    const nameColWidth = 220;
    const dateColWidth = 130;
    const reasonColWidth = 260;
    const amountColWidth = 110;
    const statusColWidth = 90;
    const paidDateColWidth = 140;
    const tableWidth =
      nameColWidth +
      dateColWidth +
      reasonColWidth +
      amountColWidth +
      statusColWidth +
      paidDateColWidth;

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
            Official Penalty Report
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
              <th style={{ width: `${nameColWidth}px`, padding: "6px 8px" }}>
                <span style={{ position: "relative", top: "-6px" }}>
                  <div style={cellContentStyle("left", true)}>Full Name:</div>
                </span>
              </th>
              <th style={{ width: `${dateColWidth}px`, padding: "6px 8px" }}>
                <span style={{ position: "relative", top: "-6px" }}>
                  <div style={cellContentStyle("center", true)}>Date Penalty:</div>
                </span>
              </th>
              <th style={{ width: `${reasonColWidth}px`, padding: "6px 8px" }}>
                <span style={{ position: "relative", top: "-6px" }}>
                  <div style={cellContentStyle("left", true)}>Reason:</div>
                </span>
              </th>
              <th style={{ width: `${amountColWidth}px`, padding: "6px 8px" }}>
                <span style={{ position: "relative", top: "-6px" }}>
                  <div style={cellContentStyle("center", true)}>Amount:</div>
                </span>
              </th>
              <th style={{ width: `${statusColWidth}px`, padding: "6px 8px" }}>
                <span style={{ position: "relative", top: "-6px" }}>
                  <div style={cellContentStyle("center", true)}>Status:</div>
                </span>
              </th>
              <th style={{ width: `${paidDateColWidth}px`, padding: "6px 8px" }}>
                <span style={{ position: "relative", top: "-6px" }}>
                  <div style={cellContentStyle("center", true)}>Paid Date:</div>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: "4px 8px", border: "none" }}>
                  <div style={cellContentStyle("left")}>{r.full_name}</div>
                </td>
                <td style={{ padding: "4px 8px", border: "none" }}>
                  <div style={cellContentStyle("center")}>
                    {formatDate(r.date_absent)}
                  </div>
                </td>
                <td style={{ padding: "4px 8px", border: "none" }}>
                  <div style={cellContentStyle("left")}>{r.reason || "—"}</div>
                </td>
                <td style={{ padding: "4px 8px", border: "none" }}>
                  <div style={cellContentStyle("center")}>
                    {formatPeso(Number(r.penalty_amount))}
                  </div>
                </td>
                <td style={{ padding: "4px 8px", border: "none" }}>
                  <div style={cellContentStyle("center")}>
                    {r.status === "paid" ? "Paid" : "Unpaid"}
                  </div>
                </td>
                <td style={{ padding: "4px 8px", border: "none" }}>
                  <div style={cellContentStyle("center")}>
                    {r.paid_date ? formatDate(r.paid_date) : "—"}
                  </div>
                </td>
              </tr>
            ))}

            {/* Totals */}
            <tr>
              <td colSpan={6} style={{ height: "6px", border: "none" }} />
            </tr>
            <tr style={{ borderTop: "2px solid #000" }}>
              <td colSpan={3} style={{ padding: "6px 8px", border: "none" }}>
                <div style={cellContentStyle("left", true)}>
                  Total Unpaid: {formatPeso(totals.unpaid)}
                </div>
              </td>
              <td colSpan={3} style={{ padding: "6px 8px", border: "none" }}>
                <div style={cellContentStyle("left", true)}>
                  Total Collected: {formatPeso(totals.paid)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
);

PenaltiesPrintLayout.displayName = "PenaltiesPrintLayout";

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

export default PenaltiesPrintLayout;
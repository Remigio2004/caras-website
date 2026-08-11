import { forwardRef } from "react";
import logoMain from "@/assets/logo-main.png";
import ppcLogo from "@/assets/ppc logo.png";

export interface ContributionPeriodColumn {
  id: string;
  label: string; // pre-formatted date string, e.g. "Jul 5, 2026"
}

export interface ContributionCell {
  status: "paid" | "unpaid";
  amount: number | null;
}

export interface ContributionMemberRow {
  member_id: string;
  full_name: string;
  cells: Record<string, ContributionCell | undefined>; // keyed by period id
}

interface ContributionsPrintLayoutProps {
  periods: ContributionPeriodColumn[]; // ascending (oldest -> newest)
  members: ContributionMemberRow[]; // alphabetical
  totals: Record<string, number>; // period id -> total collected
}

function formatPeso(amount: number) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Rendered off-screen and captured with html2canvas, so sizing here is in
// fixed pixels (not responsive) to match a consistent PDF page — same
// approach as MasterlistPrintLayout.
const ContributionsPrintLayout = forwardRef
<
  HTMLDivElement,
  ContributionsPrintLayoutProps
>(({ periods, members, totals }, ref) => {
  const nameColWidth = 260;
  const periodColWidth = 150;
  const tableWidth = Math.max(
    900,
    nameColWidth + periods.length * periodColWidth
  );

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
          <p
            style={{ fontWeight: 700, fontSize: "17px", margin: "0 0 5px 0" }}
          >
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
          verticalAlign: "middle",
          padding: "6px 0",
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: "13px",
        }}
      >
        <span style={{ position: "relative", top: "-6px" }}>
          Monthly Contributions
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
                <span style={{position: "relative", top: "-6px",}}>
                     <div style={cellContentStyle("left", true)}>Full Name:</div>
                </span>
            </th>
            {periods.map((p) => (
              <th
                key={p.id}
                style={{ width: `${periodColWidth}px`, padding: "6px 8px" }}
              >
                <span style={{position: "relative", top: "-6px",}}>
                    <div style={cellContentStyle("center", true)}>{p.label}</div>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.member_id}>
              <td style={{ padding: "4px 8px", border: "none" }}>
                <div style={cellContentStyle("left")}>{m.full_name}</div>
              </td>
              {periods.map((p) => {
                const cell = m.cells[p.id];
                let display = "—";
                if (cell?.status === "paid") {
                  display = formatPeso(Number(cell.amount || 0));
                } else if (cell?.status === "unpaid") {
                  display = "Unpaid";
                }
                return (
                  <td
                    key={p.id}
                    style={{ padding: "4px 8px", border: "none" }}
                  >
                    <div style={cellContentStyle("center")}>{display}</div>
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Total row */}
          <tr>
            <td
              colSpan={1 + periods.length}
              style={{ height: "6px", border: "none" }}
            />
          </tr>
          <tr style={{ borderTop: "2px solid #000" }}>
            <td style={{ padding: "6px 8px", border: "none" }}>
              <div style={cellContentStyle("left", true)}>
                Total Collected
              </div>
            </td>
            {periods.map((p) => (
              <td key={p.id} style={{ padding: "6px 8px", border: "none" }}>
                <div style={cellContentStyle("center", true)}>
                  {formatPeso(totals[p.id] || 0)}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
});

ContributionsPrintLayout.displayName = "ContributionsPrintLayout";

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

export default ContributionsPrintLayout;
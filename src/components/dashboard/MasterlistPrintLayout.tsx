import { Fragment, forwardRef } from "react";
import logoMain from "@/assets/logo-main.png";
import ppcLogo from "@/assets/ppc logo.png";

interface Member {
  id: string;
  full_name: string;
  birthday: string;
  age: number;
  address: string;
  guardian: string;
  contact_number: string;
  batch: number;
  created_at: string;
}

interface MasterlistPrintLayoutProps {
  members: Member[];
  groupByBatch?: boolean;
}

// Groups members by batch, preserving the order they're given in (already
// sorted by batch then full_name upstream).
function groupMembersByBatch(members: Member[]) {
  const groups: { batch: number; rows: Member[] }[] = [];
  for (const m of members) {
    const last = groups[groups.length - 1];
    if (last && last.batch === m.batch) {
      last.rows.push(m);
    } else {
      groups.push({ batch: m.batch, rows: [m] });
    }
  }
  return groups;
}

function formatBirthday(value: string) {
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function calculateAge(birthday: string): number {
  if (!birthday) return 0;
  const birthDate = new Date(birthday);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

// Sort key for "Birthday" filter: calendar order (January -> December),
// ignoring the year completely so it cycles Jan 1 through Dec 31.
function getMonthDayKey(birthday: string): number {
  if (!birthday) return 9999;
  const d = new Date(birthday);
  if (isNaN(d.getTime())) return 9999;
  return d.getMonth() * 100 + d.getDate();
}

// This component renders the masterlist exactly as it should look on the
// generated PDF. It's meant to be rendered off-screen and captured with
// html2canvas, so all sizing here is in fixed pixels (not responsive) to
// match a consistent PDF page.
const MasterlistPrintLayout = forwardRef<HTMLDivElement, MasterlistPrintLayoutProps>(
  ({ members, groupByBatch = true }, ref) => {
    // When grouping by batch, rows are split into per-batch groups with a
    // blank spacer row between them. When a filter/sort other than "Batch"
    // is active, we render everything as one flat group so no blank rows
    // appear between (now-mixed) batches.
    const groups = groupByBatch
      ? groupMembersByBatch(members)
      : [{ batch: 0, rows: members }];

    return (
      <div
        ref={ref}
        style={{
          width: "1566px",
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
          <img src={logoMain} alt="CARAS Logo" style={{ width: "70px", height: "70px", objectFit: "contain" }} />
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
          <img src={ppcLogo} alt="PPC Logo" style={{ width: "62px", height: "62px", objectFit: "contain" }} />
        </div>

        {/* Official Masterlist bar */}
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
        <span
            style={{
            position: "relative",
            top: "-6px",
        }}>
          Official Masterlist
        </span>
        </div>

        {/* Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#fffecb" }}>
              <th style={thStyle("275px")}>
                <span style={{position: "relative", top: "-6px",}}>
                    <div style={cellContentStyle("left", { fontStyle: "italic", fontWeight: 700 })}>Full Name:</div>
                </span>
              </th>
              <th style={thStyle("190px")}>
                <span style={{position: "relative", top: "-6px",}}>
                  <div style={cellContentStyle("left", { fontStyle: "italic", fontWeight: 700 })}>Birthday:</div>
                </span>
              </th>
              <th style={thStyle("66px")}>
                <span style={{position: "relative", top: "-6px",}}>
                  <div style={cellContentStyle("left", { fontStyle: "italic", fontWeight: 700 })}>Age:</div>
                </span> 
              </th>
              <th style={thStyle("470px")}>
                <span style={{position: "relative", top: "-6px",}}>
                     <div style={cellContentStyle("center", { fontStyle: "italic", fontWeight: 700 })}>Address:</div>
                </span>
              </th>
              <th style={thStyle("260px")}>
                <span style={{position: "relative", top: "-6px",}}>
                  <div style={cellContentStyle("left", { fontStyle: "italic", fontWeight: 700 })}>Guardian:</div>
                </span>
              </th>
              <th style={thStyle("177px")}>
                <span style={{position: "relative", top: "-6px",}}>
                  <div style={cellContentStyle("left", { fontStyle: "italic", fontWeight: 700 })}>Contact Number:</div>
                </span>
              </th>
              <th style={thStyle("80px")}>
                <span style={{position: "relative", top: "-6px",}}>
                  <div style={cellContentStyle("left", { fontStyle: "italic", fontWeight: 700 })}>Batch:</div>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, gi) => (
              <Fragment key={`batch-${group.batch}-${gi}`}>
                {group.rows.map((m) => (
                  <tr key={m.id}>
                    <td style={tdStyle("left")}>
                      <div style={cellContentStyle("left")}>{m.full_name}</div>
                    </td>
                    <td style={tdStyle("left")}>
                      <div style={cellContentStyle("left")}>{formatBirthday(m.birthday)}</div>
                    </td>
                    <td style={tdStyle("center")}>
                      <div style={cellContentStyle("center")}>
                        {calculateAge(m.birthday)}
                      </div>
                    </td>
                    <td style={tdStyle("left")}>
                      <div style={cellContentStyle("left")}>{m.address}</div>
                    </td>
                    <td style={tdStyle("left")}>
                      <div style={cellContentStyle("left")}>{m.guardian}</div>
                    </td>
                    <td style={tdStyle("left")}>
                      <div style={cellContentStyle("left")}>{m.contact_number}</div>
                    </td>
                    <td style={tdStyle("center")}>
                      <div style={cellContentStyle("center")}>{m.batch}</div>
                    </td>
                  </tr>
                ))}

                {/* blank spacer row between batches, matching the reference layout */}
                {gi < groups.length - 1 && (
                  <tr>
                    <td colSpan={7} style={{ height: "14px", border: "none" }} />
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

MasterlistPrintLayout.displayName = "MasterlistPrintLayout";

function thStyle(width: string, align: "left" | "center" = "left"): React.CSSProperties {
  return {
    width,
    padding: "6px 8px",
  };
}

function tdStyle(_align: "left" | "center"): React.CSSProperties {
  return {
    padding: "4px 8px",
    border: "none",
  };
}

function cellContentStyle(align: "left" | "center", extra?: React.CSSProperties): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: align === "center" ? "center" : "flex-start",
    height: "100%",
    fontStyle: extra?.fontStyle,
    fontWeight: extra?.fontWeight,
    ...extra,
  };
}

export default MasterlistPrintLayout;
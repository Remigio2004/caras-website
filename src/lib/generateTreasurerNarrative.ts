import type { ContributionsTrendPoint } from "@/hooks/useContributionsTrend";
import type { PenaltiesTrendPoint } from "@/hooks/usePenaltiesTrend";
import type { CashFlowPoint } from "@/hooks/useCashFlowTrend";

export interface TreasurerStatsLike {
  totalFunds: number;
  contributionsCollected: number;
  penaltiesCollected: number;
  donationsCollected: number;
  expensesTotal: number;
  totalOutstanding: number;
}

function peso(amount: number) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function pct(part: number, whole: number) {
  if (whole <= 0) return "0%";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

function trendWord(current: number, previous: number) {
  if (previous <= 0 && current <= 0) return "remained flat";
  if (previous <= 0) return "increased";
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return "remained stable";
  return diff > 0 ? "increased" : "decreased";
}

// Builds a deterministic, formal 3-paragraph narrative from the same data
// shown on the Treasurer Dashboard (stats cards + trend/cash flow charts).
// The result is meant to be a *draft* — the treasurer can still edit it for
// proofreading before the PDF is generated.
export function generateTreasurerNarrative(
  stats: TreasurerStatsLike,
  contributionsTrend: ContributionsTrendPoint[],
  penaltiesTrend: PenaltiesTrendPoint[],
  cashFlow: CashFlowPoint[]
): string {
  const grossCollections =
    stats.contributionsCollected + stats.penaltiesCollected + stats.donationsCollected;

  const asOfDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // --- Paragraph 1: overall financial position ---
  const p1 = `As of ${asOfDate}, the Confraternity of Augustinian Recollect Altar Servers (CARAS) reports a total fund balance of ${peso(
    stats.totalFunds
  )}. This balance reflects total collections of ${peso(
    grossCollections
  )} from member contributions, penalties, and donations, less total recorded expenses of ${peso(
    stats.expensesTotal
  )}. Of the total collections, member contributions accounted for ${peso(
    stats.contributionsCollected
  )} (${pct(stats.contributionsCollected, grossCollections)}), penalties accounted for ${peso(
    stats.penaltiesCollected
  )} (${pct(stats.penaltiesCollected, grossCollections)}), and donations accounted for ${peso(
    stats.donationsCollected
  )} (${pct(stats.donationsCollected, grossCollections)}).`;

  // --- Paragraph 2: collection & cash flow trends ---
  const trendParts: string[] = [];

  if (contributionsTrend.length >= 2) {
    const latest = contributionsTrend[contributionsTrend.length - 1];
    const prev = contributionsTrend[contributionsTrend.length - 2];
    trendParts.push(
      `Contributions collected for ${latest.label} ${trendWord(
        latest.paid,
        prev.paid
      )} compared to ${prev.label}, with ${peso(latest.paid)} collected against ${peso(
        latest.unpaid
      )} still unpaid for the period.`
    );
  } else if (contributionsTrend.length === 1) {
    const only = contributionsTrend[0];
    trendParts.push(
      `For ${only.label}, ${peso(only.paid)} in contributions has been collected, with ${peso(
        only.unpaid
      )} still unpaid.`
    );
  }

  if (penaltiesTrend.length >= 1) {
    const latestP = penaltiesTrend[penaltiesTrend.length - 1];
    trendParts.push(
      `In penalties, ${latestP.label} recorded ${peso(
        latestP.incurred
      )} incurred, of which ${peso(latestP.collected)} has been collected and ${peso(
        latestP.outstanding
      )} remains outstanding.`
    );
  }

  if (cashFlow.length >= 1) {
    const latestCF = cashFlow[cashFlow.length - 1];
    const prevCF = cashFlow.length >= 2 ? cashFlow[cashFlow.length - 2] : null;
    trendParts.push(
      prevCF
        ? `The confraternity's cumulative cash position ${trendWord(
            latestCF.cumulative,
            prevCF.cumulative
          )} through ${latestCF.label}, reaching a running total of ${peso(latestCF.cumulative)}.`
        : `As of ${latestCF.label}, the confraternity's cumulative cash position stood at ${peso(
            latestCF.cumulative
          )}.`
    );
  }

  const p2 = trendParts.length
    ? trendParts.join(" ")
    : `Collection and expense trends for the period under review remain within normal ranges, with no significant deviations noted.`;

  // --- Paragraph 3: outstanding balances & closing ---
  const p3 = `A total of ${peso(
    stats.totalOutstanding
  )} in unpaid contributions and penalties remains outstanding as of this reporting period. The Treasurer's Office continues to monitor collections and expenditures closely to ensure the confraternity's funds are managed responsibly and transparently, in service of the ministry's activities and the formation of its altar servers.`;

  return [p1, p2, p3].join("\n\n");
}
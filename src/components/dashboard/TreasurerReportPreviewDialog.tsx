import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Loader2, FileEdit } from "lucide-react";
import { format } from "date-fns";
import TreasurerReportPrintLayout from "./TreasurerReportPrintLayout";
import {
  generateTreasurerNarrative,
  type TreasurerStatsLike,
} from "@/lib/generateTreasurerNarrative";
import type { ContributionsTrendPoint } from "@/hooks/useContributionsTrend";
import type { PenaltiesTrendPoint } from "@/hooks/usePenaltiesTrend";
import type { CashFlowPoint } from "@/hooks/useCashFlowTrend";

interface TreasurerReportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: TreasurerStatsLike;
  contributionsTrend: ContributionsTrendPoint[];
  penaltiesTrend: PenaltiesTrendPoint[];
  cashFlow: CashFlowPoint[];
}

export default function TreasurerReportPreviewDialog({
  open,
  onOpenChange,
  stats,
  contributionsTrend,
  penaltiesTrend,
  cashFlow,
}: TreasurerReportPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [narrative, setNarrative] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);

  const asOfDate = format(new Date(), "MMMM d, yyyy");

  // Auto-generate a fresh draft narrative every time the dialog opens, and
  // reset back to edit mode (so a stale preview from last time isn't shown).
  useEffect(() => {
    if (!open) {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setPdfBlob(null);
      setMode("edit");
      return;
    }
    setNarrative(
      generateTreasurerNarrative(stats, contributionsTrend, penaltiesTrend, cashFlow)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleGeneratePdf = async () => {
    setMode("preview");
    setGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 50));
      const node = printRef.current;
      if (!node) return;

      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 28.35; // ~1cm
      const marginY = 28.35;
      const imgWidth = pageWidth - marginX * 2;
      const usableHeight = pageHeight - marginY * 2;

      const pxPerPt = canvas.width / imgWidth;
      const pageHeightPx = Math.floor(usableHeight * pxPerPt);

      let renderedPx = 0;
      let firstPage = true;

      while (renderedPx < canvas.height) {
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            renderedPx,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            canvas.width,
            sliceHeightPx
          );
        }

        const sliceImgData = pageCanvas.toDataURL("image/png");
        const sliceHeightPt = sliceHeightPx / pxPerPt;

        if (!firstPage) pdf.addPage();
        pdf.addImage(sliceImgData, "PNG", marginX, marginY, imgWidth, sliceHeightPt);

        renderedPx += sliceHeightPx;
        firstPage = false;
      }

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfBlob(blob);
      setPdfUrl(url);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CARAS-Treasurer-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const backToEdit = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setPdfBlob(null);
    setMode("edit");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-full h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Treasurer's Report</DialogTitle>
            <DialogDescription>
              {mode === "edit"
                ? "Review and edit the auto-generated summary below before generating the PDF."
                : "Review the report before downloading."}
            </DialogDescription>
          </DialogHeader>

          {mode === "edit" ? (
            <div className="flex-1 min-h-0 flex flex-col gap-3">
              <Textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                className="flex-1 min-h-0 resize-none text-sm leading-relaxed"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={handleGeneratePdf} disabled={!narrative.trim()}>
                  <FileEdit className="w-4 h-4 mr-2" />
                  Generate PDF Preview
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 border rounded-md bg-muted/30 overflow-hidden">
                {generating || !pdfUrl ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating PDF...
                  </div>
                ) : (
                  <iframe
                    src={pdfUrl}
                    title="Treasurer's Report PDF Preview"
                    className="w-full h-full"
                  />
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={backToEdit}>
                  Back to Edit
                </Button>
                <Button onClick={handleDownload} disabled={!pdfBlob}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden off-screen render target used as the html2canvas source */}
      {open &&
        createPortal(
          <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
            <TreasurerReportPrintLayout
              ref={printRef}
              narrative={narrative}
              asOfDate={asOfDate}
            />
          </div>,
          document.body
        )}
    </>
  );
}
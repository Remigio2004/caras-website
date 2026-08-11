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
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import ExpensesPrintLayout, { ExpenseExportRow } from "./ExpensesPrintLayout";

interface ExpensesExportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: ExpenseExportRow[];
  total: number;
}

export default function ExpensesExportPreviewDialog({
  open,
  onOpenChange,
  rows,
  total,
}: ExpensesExportPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setPdfBlob(null);
      return;
    }

    const generate = async () => {
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

        const marginX = 14.17;
        const marginY = 7;
        const imgWidth = pageWidth - marginX * 2;
        const usableHeight = pageHeight - marginY * 2;

        const pxPerPt = canvas.width / imgWidth;
        const pageHeightPx = Math.floor(usableHeight * pxPerPt);

        let renderedPx = 0;
        let firstPage = true;

        while (renderedPx < canvas.height) {
          const sliceHeightPx = Math.min(
            pageHeightPx,
            canvas.height - renderedPx
          );

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
          pdf.addImage(
            sliceImgData,
            "PNG",
            marginX,
            marginY,
            imgWidth,
            sliceHeightPt
          );

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

    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rows, total]);

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CARAS-Expenses-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-full h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Expenses Report Preview</DialogTitle>
            <DialogDescription>
              Review the report before downloading.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 border rounded-md bg-muted/30 overflow-hidden">
            {generating || !pdfUrl ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating PDF...
              </div>
            ) : (
              <iframe
                src={pdfUrl}
                title="Expenses PDF Preview"
                className="w-full h-full"
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleDownload} disabled={!pdfBlob}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {open &&
        createPortal(
          <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
            <ExpensesPrintLayout ref={printRef} rows={rows} total={total} />
          </div>,
          document.body
        )}
    </>
  );
}
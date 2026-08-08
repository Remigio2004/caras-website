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
import MasterlistPrintLayout from "./MasterlistPrintLayout";

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

interface MasterlistPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  groupByBatch?: boolean;
}

export default function MasterlistPreviewDialog({
  open,
  onOpenChange,
  members,
  groupByBatch = true,
}: MasterlistPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) {
      // clean up previous preview when dialog closes
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setPdfBlob(null);
      return;
    }

    const generate = async () => {
      setGenerating(true);
      try {
        // let the hidden layout paint first
        await new Promise((r) => setTimeout(r, 50));

        const node = printRef.current;
        if (!node) return;

        const canvas = await html2canvas(node, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        // A4-ish landscape-friendly sizing based on the captured canvas ratio
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: "letter",
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const marginX = 14.17; // 0.5cm converted to points (left/right)
        const marginY = 7; // 0.3cm converted to points (top/bottom)
        const imgWidth = pageWidth - marginX * 2;
        const usableHeight = pageHeight - marginY * 2;

        // canvas pixels per PDF point, based on the printed width
        const pxPerPt = canvas.width / imgWidth;
        // how many source canvas pixels make up one page's usable height
        const pageHeightPx = Math.floor(usableHeight * pxPerPt);

        let renderedPx = 0;
        let firstPage = true;

        while (renderedPx < canvas.height) {
          const sliceHeightPx = Math.min(
            pageHeightPx,
            canvas.height - renderedPx
          );

          // crop this page's exact slice out of the full canvas (no overlap)
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
  }, [open, members, groupByBatch]);

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CARAS-Official-Masterlist-${format(new Date(), "yyyy-MM-dd")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-full h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Masterlist Preview</DialogTitle>
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
                title="Masterlist PDF Preview"
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

      {/* Hidden off-screen render target used as the html2canvas source */}
      {open &&
        createPortal(
          <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
            <MasterlistPrintLayout
              ref={printRef}
              members={members}
              groupByBatch={groupByBatch}
            />
          </div>,
          document.body
        )}
    </>
  );
}
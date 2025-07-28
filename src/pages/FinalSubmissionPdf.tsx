import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface FinalSubmissionPdfProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: { [key: string]: string };
  uploadedFiles: File[];
  onConfirm?: (pdfBase64: string) => void;
}

const SEAL_IMAGE_URL = "/US_DC_NorCal.png"; // Replace if needed

const FinalSubmissionPdf = ({
  open,
  onOpenChange,
  formData,
  uploadedFiles,
  onConfirm,
}: FinalSubmissionPdfProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

  const wrapText = (text: string, maxChars = 90): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";

    for (let word of words) {
      if ((line + word).length > maxChars) {
        lines.push(line.trim());
        line = "";
      }
      line += word + " ";
    }
    if (line) lines.push(line.trim());
    return lines;
  };

  const generatePdf = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

      let sealImage;
      try {
        const imgBytes = await fetch(SEAL_IMAGE_URL).then((r) => r.arrayBuffer());
        sealImage = await pdfDoc.embedPng(imgBytes);
      } catch (e) {
        console.warn("Seal image not loaded.");
      }

      for (const file of uploadedFiles) {
        try {
          if (file.type === "application/pdf") {
            const buf = await readFileAsArrayBuffer(file);
            const donor = await PDFDocument.load(buf);
            const copied = await pdfDoc.copyPages(donor, donor.getPageIndices());
            copied.forEach((p) => pdfDoc.addPage(p));
          }
        } catch {
          console.warn("Invalid file skipped");
        }
      }

      const page = pdfDoc.addPage([612, 792]);
      const { width, height } = page.getSize();
      let y = height - 72;
      const safe = (key: string) => formData[key] || "—";

      // Watermark
      if (sealImage) {
        const dims = sealImage.scale(0.3);
        page.drawImage(sealImage, {
          x: (width - dims.width) / 2,
          y: (height - dims.height) / 2,
          width: dims.width,
          height: dims.height,
          opacity: 0.1,
        });
      }

      // Header
      page.drawText("UNITED STATES DISTRICT COURT", { x: 72, y, size: 14, font });
      y -= 18;
      page.drawText("NORTHERN DISTRICT OF CALIFORNIA", { x: 72, y, size: 14, font });
      y -= 36;

      // Caption box
      page.drawRectangle({
        x: 60,
        y: y - 80,
        width: width - 120,
        height: 80,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      page.drawText("John Doe v. Superior Court", { x: 70, y: y - 20, size: 12, font });
      page.drawText(`Case No: SF-${Math.floor(Math.random() * 99999)}`, {
        x: width - 200,
        y: y - 20,
        size: 12,
        font,
      });
      y -= 100;

      page.drawText("INCIDENT REPORT", {
        x: width / 2 - 80,
        y,
        size: 16,
        font,
      });
      y -= 40;

      const drawLabel = (label: string, value: string) => {
        page.drawText(label, { x: 72, y, size: 12, font });
        page.drawText(value, { x: 200, y, size: 12, font });
        y -= 24;
      };

      drawLabel("First Name", safe("firstName"));
      drawLabel("Last Name", safe("lastName"));
      drawLabel("Phone", safe("contact_phone"));
      drawLabel("Email", safe("contact_email"));
      drawLabel("Incident Type", safe("type_of_incident"));
      drawLabel("Incident Date", safe("date_of_incident"));

      y -= 20;
      page.drawLine({ start: { x: 72, y }, end: { x: width - 72, y }, thickness: 1 });
      y -= 20;

      const legalText =
        "Filed under U.S. federal and California law. This document is confidential and for official use only.";
      const lines = wrapText(legalText, 80);
      lines.forEach((line) => {
        page.drawText(line, { x: 72, y, size: 10, font });
        y -= 14;
      });

      // Footer
      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        const p = pdfDoc.getPage(i);
        const footerY = 40;
        p.drawLine({
          start: { x: 72, y: footerY + 15 },
          end: { x: width - 72, y: footerY + 15 },
          thickness: 0.7,
        });
        p.drawText("Incident Report", { x: 72, y: footerY, size: 10, font });
        p.drawText(`Page ${i + 1} of ${totalPages}`, {
          x: width - 140,
          y: footerY,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfBase64((reader.result as string).split(",")[1]);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error(e);
      setError("PDF generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (open) generatePdf();
    else {
      setPdfUrl(null);
      setPdfBase64(null);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[1100px] max-w-[90vw] h-[700px] p-0 rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-white">
        <DialogHeader className="p-4 pb-0 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-primary">Submission Preview</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4">
          {isGenerating && <div>Generating PDF…</div>}
          {error && <div className="text-red-600">{error}</div>}
          {pdfUrl && (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              title="PDF Preview"
              className="w-full h-full border"
            />
          )}
        </div>
        <div className="p-4 flex justify-end gap-2">
          {pdfUrl && (
            <a href={pdfUrl} download="incident-report.pdf">
              <Button>Download</Button>
            </a>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!pdfBase64}
            onClick={() => pdfBase64 && onConfirm?.(pdfBase64)}
          >
            Confirm & Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinalSubmissionPdf;

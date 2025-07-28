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

      // First, append all uploaded PDF files in order
      const attachmentStartPage = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        try {
          if (file.type === "application/pdf") {
            attachmentStartPage.push(pdfDoc.getPageCount());
            const buf = await readFileAsArrayBuffer(file);
            const donor = await PDFDocument.load(buf);
            const copied = await pdfDoc.copyPages(donor, donor.getPageIndices());
            copied.forEach((copiedPage) => pdfDoc.addPage(copiedPage));
          }
        } catch (fileError) {
          console.warn(`Failed to process file ${file.name}:`, fileError);
          // Continue processing other files even if one fails
        }
      }

      // Now create the detailed form page as the LAST page
      const formPage = pdfDoc.addPage([612, 792]);
      const { width, height } = formPage.getSize();
      let y = height - 72;
      const safe = (key: string) => formData[key] || "—";

      // Watermark
      if (sealImage) {
        const dims = sealImage.scale(0.3);
        formPage.drawImage(sealImage, {
          x: (width - dims.width) / 2,
          y: (height - dims.height) / 2,
          width: dims.width,
          height: dims.height,
          opacity: 0.1,
        });
      }

      // Header
      formPage.drawText("UNITED STATES DISTRICT COURT", { x: 72, y, size: 14, font });
      y -= 18;
      formPage.drawText("NORTHERN DISTRICT OF CALIFORNIA", { x: 72, y, size: 14, font });
      y -= 36;

      // Caption box
      formPage.drawRectangle({
        x: 60,
        y: y - 80,
        width: width - 120,
        height: 80,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      formPage.drawText("John Doe v. Superior Court", { x: 70, y: y - 20, size: 12, font });
      formPage.drawText(`Case No: SF-${Math.floor(Math.random() * 99999)}`, {
        x: width - 200,
        y: y - 20,
        size: 12,
        font,
      });
      y -= 100;

      formPage.drawText("INCIDENT REPORT - DETAILED FORM", {
        x: width / 2 - 120,
        y,
        size: 16,
        font,
      });
      y -= 40;

      const drawLabel = (label: string, value: string) => {
        formPage.drawText(label, { x: 72, y, size: 12, font });
        formPage.drawText(value, { x: 200, y, size: 12, font });
        y -= 24;
      };

      drawLabel("First Name", safe("first_name"));
      drawLabel("Last Name", safe("last_name"));
      drawLabel("Phone", safe("contact_phone"));
      drawLabel("Email", safe("contact_email"));
      drawLabel("Incident Type", safe("type_of_incident"));
      drawLabel("Incident Date", safe("date_of_incident"));

      // Add file attachment summary
      if (uploadedFiles.length > 0) {
        y -= 30;
        formPage.drawText("ATTACHED SUPPORTING DOCUMENTS:", { x: 72, y, size: 12, font });
        y -= 20;
        formPage.drawText("(Documents appear in the preceding pages of this submission)", { 
          x: 72, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) 
        });
        y -= 20;
        
        uploadedFiles.forEach((file, index) => {
          const startPage = attachmentStartPage[index];
          formPage.drawText(`${index + 1}. ${file.name}`, { x: 90, y, size: 10, font });
          if (startPage !== undefined) {
            formPage.drawText(`(Pages ${startPage + 1}+)`, { 
              x: width - 120, y, size: 9, font, color: rgb(0.6, 0.6, 0.6) 
            });
          }
          y -= 16;
        });
      }

      y -= 30;
      formPage.drawLine({ start: { x: 72, y }, end: { x: width - 72, y }, thickness: 1 });
      y -= 20;

      // Submission details
      formPage.drawText("SUBMISSION DETAILS:", { x: 72, y, size: 12, font });
      y -= 20;
      formPage.drawText(`Submitted on: ${new Date().toLocaleDateString()}`, { x: 90, y, size: 10, font });
      y -= 16;
      formPage.drawText(`Total Pages: ${pdfDoc.getPageCount()}`, { x: 90, y, size: 10, font });
      y -= 16;
      formPage.drawText(`Attachments: ${uploadedFiles.length}`, { x: 90, y, size: 10, font });

      y -= 30;
      formPage.drawLine({ start: { x: 72, y }, end: { x: width - 72, y }, thickness: 1 });
      y -= 20;

      const legalText =
        "This incident report and all attached documents are filed under U.S. federal and California state law. " +
        "All information contained herein is confidential and intended for official court use only. " +
        "Any unauthorized disclosure or distribution is strictly prohibited.";
      const lines = wrapText(legalText, 80);
      lines.forEach((line) => {
        formPage.drawText(line, { x: 72, y, size: 10, font });
        y -= 14;
      });

      // Add footer to all pages with proper labeling
      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        const p = pdfDoc.getPage(i);
        const pageWidth = p.getSize().width;
        const footerY = 40;
        
        p.drawLine({
          start: { x: 72, y: footerY + 15 },
          end: { x: pageWidth - 72, y: footerY + 15 },
          thickness: 0.7,
        });
        
        let footerLabel = "";
        if (i === totalPages - 1) {
          // Last page is the detailed form
          footerLabel = "Incident Report - Detailed Form";
        } else {
          // Find which attachment this page belongs to
          let attachmentIndex = -1;
          for (let j = 0; j < attachmentStartPage.length; j++) {
            if (i >= attachmentStartPage[j] && (j === attachmentStartPage.length - 1 || i < attachmentStartPage[j + 1])) {
              attachmentIndex = j;
              break;
            }
          }
          if (attachmentIndex >= 0) {
            footerLabel = `Attachment ${attachmentIndex + 1}: ${uploadedFiles[attachmentIndex].name}`;
          } else {
            footerLabel = "Incident Report - Attachment";
          }
        }
        
        p.drawText(footerLabel, { 
          x: 72, 
          y: footerY, 
          size: 9, 
          font,
          color: rgb(0.4, 0.4, 0.4)
        });
        
        p.drawText(`Page ${i + 1} of ${totalPages}`, {
          x: pageWidth - 140,
          y: footerY,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        setPdfBase64(base64String);
      };
      reader.readAsDataURL(blob);

    } catch (e) {
      console.error("PDF generation error:", e);
      setError("Failed to generate PDF. Please check your files and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (open) {
      generatePdf();
    } else {
      // Clean up URLs when dialog closes
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      setPdfUrl(null);
      setPdfBase64(null);
      setError(null);
    }
  }, [open]);

  // Clean up URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[1100px] max-w-[90vw] h-[700px] p-0 rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-white">
        <DialogHeader className="p-4 pb-0 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-primary">
              Submission Preview
              {uploadedFiles.length > 0 && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({uploadedFiles.length} attachment{uploadedFiles.length > 1 ? 's' : ''} + detailed form)
                </span>
              )}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4">
          {isGenerating && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <div>Generating combined PDF...</div>
                {uploadedFiles.length > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    Processing {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <div className="mb-2">⚠️</div>
                <div>{error}</div>
              </div>
            </div>
          )}
          
          {!isGenerating && !error && pdfUrl && (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              title="PDF Preview"
              className="w-full h-full border rounded"
            />
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end items-center">
          {/* <div className="text-sm text-gray-600">
            {uploadedFiles.length > 0 ? (
              <span>Document order: Attachments (pages 1-{pdfUrl ? 'N' : '...'}) → Detailed form (final page)</span>
            ) : (
              <span>Single page: Detailed incident report form</span>
            )}
          </div> */}
          <div className="flex gap-2">
            {/* {pdfUrl && (
              <a href={pdfUrl} download="incident-report-combined.pdf">
                <Button variant="outline">Download Preview</Button>
              </a>
            )} */}
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!pdfBase64 || isGenerating}
              onClick={() => pdfBase64 && onConfirm?.(pdfBase64)}
            >
              Confirm & Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinalSubmissionPdf;

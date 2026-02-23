import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// ✅ Vite-compatible worker
GlobalWorkerOptions.workerSrc = workerSrc;

export async function loadPdf(file: File): Promise<PDFDocumentProxy> {
  const data = await file.arrayBuffer();
  return getDocument({ data }).promise;
}

export async function renderPdfPageToDataUrl(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale = 2
) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // ✅ new typings require canvas too
  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise;

  return {
    imageUrl: canvas.toDataURL("image/png"),
    width: viewport.width,
    height: viewport.height,
  };
}

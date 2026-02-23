
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// ✅ Vite: import worker as URL string
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

export async function renderPdfPageToImage(
  file: File | string,
  pageNumber = 1,
  scale = 2
) {
  let loadingTask;

  if (typeof file === "string") {
    // Fetch the PDF as an ArrayBuffer
    const response = await fetch(file);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const data = await response.arrayBuffer();

    // Pass the raw bytes (data) instead of the URL string
    loadingTask = getDocument({ data });
  } else {
    // Handle File object from input
    const data = await file.arrayBuffer();
    loadingTask = getDocument({ data });
  }

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Failed to get canvas context");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas: canvas, 
  }).promise;

  return {
    imageUrl: canvas.toDataURL("image/png"),
    width: viewport.width,
    height: viewport.height,
  };
}
import { useState } from "react";
import type { DocumentExtractionResponse } from "@/types/document";
import { GATEWAY_BASE_URL } from "@/config/env";

// const GATEWAY_BASE_URL = (import.meta.env.VITE_GATEWAY_BASE_URL as string)?.trim();

export function useAzureDocumentExtraction() {
  const [result, setResult] = useState<DocumentExtractionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractDocumentAzure = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!GATEWAY_BASE_URL) {
        throw new Error("VITE_GATEWAY_BASE_URL is missing in deployed build.");
      }

      const base = GATEWAY_BASE_URL.replace(/\/+$/, ""); // ✅ remove trailing /
      const formData = new FormData();
      formData.append("file", file);

      // const url = `${base}/{GATEWAY_BASE_URL}/analyze-azure?skip_validation=false&model_id=prebuilt-read`;
      const url = `${base}/analyze-azure?skip_validation=false&model_id=prebuilt-read`;

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error: ${response.status}`);
      }

      const data: DocumentExtractionResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Extraction failed");
      }

      // ✅ Ensure you got document_id
      if (!data.document_id) {
        console.warn("⚠️ document_id missing in backend response:", data);
      } else {
        console.log("✅ document_id received:", data.document_id);
      }

      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  };

  return { extractDocumentAzure, result, isLoading, error, reset };
}

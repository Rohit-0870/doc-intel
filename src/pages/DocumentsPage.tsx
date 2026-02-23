
import React, { useState, useMemo, useEffect } from "react";
import { METRICS_BASE_URL } from "@/config/env";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Document, OcrType } from "@/types/document";
import { DocumentsTable } from "@/components/document/DocumentsTable";
import DocumentAnalyzeFlow from "@/components/document/DocumentAnalyzeFlow";
import { useDashboardDocuments } from "@/hooks/useDashboardDocuments";
import { useDocumentExtraction } from "@/hooks/useDocumentExtraction";
import { useAzureDocumentExtraction } from "@/hooks/useAzureDocumentExtraction";
import DocumentDetailsView from "@/components/document/DocumentDetailsView";

const DocumentsPage = () => {
  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);
  const [ocrType, setOcrType] = useState<OcrType>("azure_di");
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [optimisticDocs, setOptimisticDocs] = useState<Document[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [pageSize, setPageSize] = useState<number>(10); // ✅ dynamic page size
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  useEffect(() => {
  const intervalMs = 1 * 60 * 1000;
  let lastPing = Date.now();

  const pingBackend = async () => {
    try {
      await fetch(`${METRICS_BASE_URL}/health`, { method: "GET", mode: "no-cors" });
      lastPing = Date.now();
      console.log("Backend kept warm.");
    } catch {}
  };

  const interval = setInterval(() => {
    // Only ping if 5 minutes passed since last ping
    if (Date.now() - lastPing >= intervalMs) pingBackend();
  }, intervalMs);

    // initial ping on mount
    pingBackend();

    return () => clearInterval(interval);
    }, []);


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);


  const queryClient = useQueryClient();
  const easy = useDocumentExtraction();
  const azure = useAzureDocumentExtraction();

  // Build query params dynamically
  const queryParams = useMemo(() => ({
  start_date: dateRange.from?.toISOString(),
  end_date: dateRange.to?.toISOString(),
  page,
  page_size: pageSize,
  filename_contains: debouncedSearch || undefined,
  }), [dateRange, pageSize, page, debouncedSearch]);


  const {
  data = { documents: [], totalCount: 0 },
  isLoading,
  error,
  } = useDashboardDocuments(optimisticDocs, queryParams);

  const { documents, totalCount } = data;


  const { mutate: extractMutation } = useMutation({
    mutationFn: async ({ file, ocr }: { file: File; ocr: OcrType }) => {
      return ocr === "easy_ocr" ? easy.extractDocument(file) : azure.extractDocumentAzure(file);
    },
    onMutate: async ({ file, ocr }) => {
      const now = new Date();
      const tempId = `temp-${crypto.randomUUID()}`;

      const newDoc: Document = {
        id: tempId,
        fileName: file.name,
        ocrType: ocr,
        status: "processing",
        isTemp: true,
        createdAt: now.toISOString(),
        createdAtFormatted: now.toLocaleString(undefined, {
          month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
        }),
        fileSizeBytes: file.size,
        pageDimensions: [],
        requiresHumanReview: false,
        documentType: "—",
      };

      setOptimisticDocs((prev) => [newDoc, ...prev]);
      queryClient.cancelQueries({ queryKey: ["dashboard-documents"] });
      return { newDoc };
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-documents"] });
    },
  });

  return (
    <div className="p-10 bg-white min-h-screen">
      {!activeDocumentId ? (
        <>
          <h1 className="text-2xl font-semibold mb-4">Documents</h1>
          {error ? (
            <p className="p-4 text-red-500">Error loading documents</p>
          ) : (
            <>
              {/* Page size selector (next to OCR dropdown) */}
              {/* <div className="flex items-center gap-3 mb-2">
                <label className="text-sm">Page size:</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border rounded-md px-2 py-1 text-sm"
                >
                  {[10, 25, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div> */}

              <DocumentsTable
                documents={documents}
                pageSize={pageSize}
                totalCount={totalCount}
                page={page}
                setPage={setPage}
                onView={setActiveDocumentId}
                selectedDocIds={selectedDocIds}
                toggleSelect={(id) => {
                  const next = new Set(selectedDocIds);
                  next.has(id) ? next.delete(id) : next.add(id);
                  setSelectedDocIds(next);
                }}
                onSelectAll={(ids) => setSelectedDocIds(new Set(ids))}
                ocrType={ocrType}
                setOcrType={setOcrType}
                onAnalyzeClick={() => setIsAnalyzeOpen(true)}
                dateRange={dateRange}
                setDateRange={setDateRange}
                isLoading={isLoading}
                search={search}
                setSearch={setSearch}
              />
            </>
          )}
        </>
      ) : (
        <DocumentDetailsView
          documentId={activeDocumentId}
          onBack={() => setActiveDocumentId(null)}
        />
      )}

      <DocumentAnalyzeFlow
        open={isAnalyzeOpen}
        ocrType={ocrType}
        onClose={() => setIsAnalyzeOpen(false)}
        onDocumentAdd={(file, ocr) => {
          extractMutation({ file, ocr });
          return "optimistic-id";
        }}
      />
    </div>
  );
};

export default DocumentsPage;

import { DocumentDetails } from "@/hooks/useDocumentDetails";
import { DocumentExtractionResponse } from "@/types/document";

/* ---------------------------------------------
 * Internal mapper-only types
 * --------------------------------------------- */
interface ApiExtractedValue {
  field_name: string;
  normalized_name?: string;
  field_value: string;
  confidence?: number;
  extraction_method?: string;
  page_number?: number;
  bounding_box?: any;
  was_corrected?: boolean;
}

interface ApiBoundingBox {
  field_name: string;
  page_number: number;
  bounding_box: any;
}

export const mapApiDataToFrontend = (
  data: DocumentDetails
): DocumentExtractionResponse | null => {
  if (!data || !data.document) return null;

  const doc = data.document;
  const metrics = data.cost_breakdown || {};
  const extraction = data.extraction_results || {};

  const bboxResults =
    (data.bounding_box_results?.extracted_data as ApiBoundingBox[]) || [];

  const ocr_lines = data.bounding_box_results?.lines ?? [];
  const ocr_words = data.bounding_box_results?.words ?? [];


  const mergeBoxes = (boxes: any[]) => {
  if (boxes.length === 0) return null;
  const x = Math.min(...boxes.map(b => b.x));
  const y = Math.min(...boxes.map(b => b.y));
  const maxWidth = Math.max(...boxes.map(b => b.x + b.width));
  const maxHeight = Math.max(...boxes.map(b => b.y + b.height));
  return {
      x,
      y,
      width: maxWidth - x,
      height: maxHeight - y
  };
  };

  /* ---------------------------------------------
   * Build lookup from ORIGINAL values
   * --------------------------------------------- */
  const originalValues =
    (extraction.original_values as ApiExtractedValue[]) || [];

  const originalMap = new Map<string, ApiExtractedValue>(
    originalValues.map((v) => [v.field_name, v])
  );

  /* ---------------------------------------------
   * Decide source of truth
   * --------------------------------------------- */
  const sourceValues: ApiExtractedValue[] =
    extraction.final_values?.length > 0
      ? (extraction.final_values as ApiExtractedValue[])
      : originalValues;

  const extracted_values = sourceValues.map((val) => {
    const original = originalMap.get(val.field_name);
    const spatialMatch = bboxResults.find((b) => b.field_name === val.field_name);
    
    // Default fallback box
    let finalBox = spatialMatch?.bounding_box ?? val.bounding_box ?? original?.bounding_box ?? null;

    // Multi-line Snap Logic
    if (val.field_value && Array.isArray(ocr_lines) && ocr_lines.length > 0) {
      const stringValue = String(val.field_value)
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      if (stringValue.length > 0) {

        // 1️⃣ Exact line match
        const exactMatch = ocr_lines.find(line => {
          const lineText = String(line?.text || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();

          return lineText === stringValue;
        });

        if (exactMatch?.bounding_box) {
          finalBox = exactMatch.bounding_box;
        } else {

          // 2️⃣ Multi-line merge (controlled)
          const candidateLines = ocr_lines.filter(line => {
            const lineText = String(line?.text || "")
              .replace(/\s+/g, " ")
              .trim()
              .toLowerCase();

            return stringValue.includes(lineText) && lineText.length > 3;
          });

          if (candidateLines.length > 0) {
            finalBox = mergeBoxes(
              candidateLines
                .map(l => l.bounding_box)
                .filter(Boolean)
            );
          }

          // 3️⃣ Fallback to original spatial box if snap fails
          if (!finalBox) {
            finalBox =
              spatialMatch?.bounding_box ??
              val.bounding_box ??
              original?.bounding_box ??
              null;
          }
        }
      }
    }


    // ENSURE PROPERTIES ARE UNIQUE HERE
    return {
      field_name: val.field_name,
      normalized_name: val.normalized_name ?? original?.normalized_name,
      field_value: val.field_value,
      confidence: val.confidence ?? original?.confidence ?? 0,
      extraction_method: val.extraction_method ?? original?.extraction_method ?? "llm",
      page_number: Number(spatialMatch?.page_number ?? val.page_number ?? original?.page_number ?? 1),
      bounding_box: finalBox, // ONLY ONE bounding_box property allowed
      was_corrected: val.was_corrected ?? false,
    };
  });

  /* ---------------------------------------------
   * Return final mapped object
   * --------------------------------------------- */
  return {
    success: data.success,
    document_id: doc.document_id,
    filename: doc.filename,
    file_size_bytes: doc.file_size_bytes ?? 0,
    document_type: doc.document_type ?? "unknown",

    extraction_results: {
      original_values: extraction.original_values ?? [],
      corrected_values: extraction.corrected_values ?? [],
      final_values: extraction.final_values ?? [],
    },

    extracted_values,

    mandatory_fields: (extraction.discovered_fields || []).map((f: any) => ({
      field_name: f.field_name,
      normalized_name: f.normalized_name,
      confidence: f.confidence,
      is_mandatory: f.is_mandatory,
      reason: f.reason,
      field_type: f.field_type,
      location: f.location ?? "",
      indicators: f.indicators ?? [],
    })),

    classification: {
      document_type: doc.document_type ?? "unknown",
      confidence: 1,
      reason: `Classified via ${doc.source || "system"}`,
      key_indicators: [],
    },

    statistics: {
      total_fields: extracted_values.length,
      mandatory_count: (extraction.discovered_fields || []).filter(
        (f: any) => f.is_mandatory
      ).length,
      average_confidence:
        extracted_values.length > 0
          ? extracted_values.reduce(
              (acc, curr) => acc + (curr.confidence || 0),
              0
            ) / extracted_values.length
          : 0,
      high_confidence_count: extracted_values.filter(
        (v) => (v.confidence || 0) > 0.8
      ).length,
      field_type_distribution: {},
      mandatory_percentage: 0,
    },

    validation_results: data.validation_results || [],
    is_valid: (data.validation_results || []).length === 0,
    requires_human_review: doc.requires_hitl_review || false,
    hitl_fields: [],

    token_usage: {
      input_tokens: metrics.input_tokens || 0,
      output_tokens: metrics.output_tokens || 0,
      total_tokens: metrics.total_tokens || 0,
    },

    cost_info: {
      input_cost_usd: metrics.input_cost_usd || 0,
      output_cost_usd: metrics.output_cost_usd || 0,
      total_cost_usd: metrics.total_cost_usd || 0,
    },

    time_taken_seconds: metrics.processing_time_seconds || 0,
    metrics_record_id: data.metrics_record_id ?? 0,
    raw_text_preview: data.raw_text_preview || "",
    error: data.error ?? null,
    blob_url: data.blob_url ?? undefined,

    ocr_lines,
    ocr_words: ocr_words.length > 0 ? ocr_words : ocr_lines,

    page_dimensions: data.page_dimensions ?? [],

  };
};

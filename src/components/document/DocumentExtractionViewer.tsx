
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExtractedValuesCard } from "./ExtractedValuesCard";
import { MetricsCard } from "./MetricsCard";
import { useToast } from "@/hooks/use-toast";

import type {
  DocumentExtractionResponse,
  ExtractedValue,
  FieldValue,
} from "@/types/document";

const VALIDATION_BASE_URL = import.meta.env.VITE_VALIDATION_BASE_URL as string;
const REVIEWER_ID = (import.meta.env.VITE_REVIEWER_ID as string) || "1234";

/* -------------------------------- utils -------------------------------- */

function normalizeForBackend(value: FieldValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}

function isValueChanged(a: FieldValue, b: FieldValue): boolean {
  return normalizeForBackend(a) !== normalizeForBackend(b);
}

function resolveExtractedValues(
  results: any
): ExtractedValue[] {
  if (Array.isArray(results?.final_values) && results.final_values.length > 0) {
    return results.final_values;
  }

  if (
    Array.isArray(results?.original_values) &&
    results.original_values.length > 0
  ) {
    return results.original_values;
  }

  return [];
}


async function fetchHitlFinalValues(
  documentId: string
): Promise<ExtractedValue[]> {
  const res = await fetch(`${VALIDATION_BASE_URL}/hitl/document/${documentId}`, {
    headers: { accept: "application/json" },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    console.warn("fetchHitlFinalValues failed:", json);
    return [];
  }

  const finalValues = json?.record?.final?.extracted_values;
  if (Array.isArray(finalValues)) return finalValues;

  return [];
}

/* ----------------------------------------------------------------------- */

interface DocumentExtractionViewerProps {
  data: DocumentExtractionResponse;
  onHoverFieldChange?: (fieldName: string | null) => void;
  onFieldClick?: (fieldName: string) => void;
}

export function DocumentExtractionViewer({
  data,
  onHoverFieldChange,
  onFieldClick,
}: DocumentExtractionViewerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const documentId = useMemo(
    () => data.document_id ?? null,
    [data.document_id]
  );

  const originalValues = useMemo<ExtractedValue[]>(() => {
  return resolveExtractedValues(data.extraction_results);
  }, [data.extraction_results]);

  const originalMap = useMemo(() => {
    return new Map(originalValues.map((x) => [x.field_name, x.field_value]));
  }, [originalValues]);

  const [displayedValues, setDisplayedValues] =
    useState<ExtractedValue[]>(originalValues);

  useEffect(() => {
    setDisplayedValues(originalValues);
  }, [originalValues]);

  const handleSubmitEdits = useCallback(
    async (editedValues: ExtractedValue[]) => {
      try {
        setIsSaving(true);

        if (!documentId) {
          toast({
            variant: "destructive",
            title: "Missing document ID",
            description:
              "document_id is missing in the extraction response. Backend must return document_id.",
          });

          return;
        }

        const allCorrectedFields = editedValues.filter((item) => {
          const original = originalMap.get(item.field_name);
          return isValueChanged(original, item.field_value);
        });

        if (allCorrectedFields.length === 0) {
          toast({
            variant: "warning",
            title: "No changes detected",
            description: "You haven’t modified any extracted values.",
          });

          return;
        }

        const corrections = allCorrectedFields.map((x) => ({
          field_name: x.field_name,
          corrected_value: normalizeForBackend(x.field_value),
        }));

        const url = `${VALIDATION_BASE_URL}/hitl/submit-batch?document_id=${encodeURIComponent(
          documentId
        )}&reviewer_id=${encodeURIComponent(REVIEWER_ID)}`;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(corrections),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.success) {
          console.error("❌ HITL batch submit failed:", json);
          toast({
            variant: "destructive",
            title: "Save failed",
            description: "Something went wrong while saving. Check console logs.",
          });

          return;
        }

        // optimistic update
        const optimistic = editedValues.map((item) => {
          const original = originalMap.get(item.field_name);
          const wasCorrected = isValueChanged(original, item.field_value);
          return { ...item, was_corrected: wasCorrected };
        });

        setDisplayedValues(optimistic);

        // fetch backend final truth
        const backendFinal = await fetchHitlFinalValues(documentId);

        if (backendFinal.length > 0) {
          const backendMap = new Map(
            backendFinal.map((x) => [x.field_name, x])
          );

          setDisplayedValues((prev) =>
            prev.map((p) => {
              const b = backendMap.get(p.field_name);
              if (!b) return p;

              const original = originalMap.get(p.field_name);

              const localDiff = isValueChanged(original, p.field_value);
              const backendDiff = isValueChanged(original, b.field_value);

              if (localDiff && !backendDiff) return p;

              return {
                ...p,
                ...b,
                field_value: b.field_value,
              };
            })
          );
        }

        toast({
          variant: "success",
          title: "Approved successfully",
          description: "Your corrections have been saved.",
        });
      } catch (err) {
        console.error("❌ Unexpected submit error:", err);
        alert("Save failed due to unexpected error. Check console.");
      } finally {
        setIsSaving(false);
      }
    },
    [documentId, originalMap]
  );

  return (
    <div className="space-y-6">
      <div className="border border-gray-100 rounded-lg bg-white">
        <ExtractedValuesCard
          extractedValues={displayedValues}
          onSubmit={handleSubmitEdits}
          isSaving={isSaving}
          onHoverFieldChange={onHoverFieldChange}
          onFieldClick={onFieldClick}
        />
      </div>

      <div className="border border-gray-100 rounded-lg bg-white">
        <MetricsCard
          isValid={data.is_valid}
          requiresHumanReview={data.requires_human_review}
          hitlFields={data.hitl_fields}
          statistics={data.statistics}
          tokenUsage={data.token_usage}
          costInfo={data.cost_info}
          timeTakenSeconds={data.time_taken_seconds}
          metricsRecordId={data.metrics_record_id}
          rawTextPreview={data.raw_text_preview}
          error={data.error}
        />
      </div>
    </div>
  );
}

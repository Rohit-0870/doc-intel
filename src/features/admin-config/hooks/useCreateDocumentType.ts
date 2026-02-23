import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ADMIN_BASE_URL } from "@/config/env";
import type { DocumentConfig } from "@/features/admin-config/components/ManualDocumentConfig";

/* ---------- Backend Mapper ---------- */
export function mapDocumentConfigToBackend(config: DocumentConfig) {
  return {
    document_type_name: config.name,
    field_lists: config.fields.map((f) => ({
      field_name: f.name,
      field_type: f.type,       // text, number, date, currency
      is_mandatory: f.required, // maps required -> is_mandatory
      is_deleted: false,        // always false on creation
    })),
    status: "active",
    is_approved: false,
    created_by: "manual",
  };
}

/* ---------- Hook ---------- */
export function useCreateDocumentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: DocumentConfig) => {
      const base = ADMIN_BASE_URL.replace(/\/+$/, "");

      const payload = mapDocumentConfigToBackend(config);

      const res = await fetch(`${base}/admin/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Backend rejected payload:", payload, errText);
        throw new Error(`HTTP ${res.status}`);
      }

      return res.json(); // should return the created document type
    },

    onSuccess: (newDoc) => {
      queryClient.setQueryData(["admin", "document-types"], (oldData: any) => {
        if (!oldData) return { documentTypes: [newDoc] };
        return {
          ...oldData,
          documentTypes: [...oldData.documentTypes, newDoc],
        };
      });
    },
  });
}

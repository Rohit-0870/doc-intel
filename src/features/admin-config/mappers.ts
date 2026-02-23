import type { BackendDocType } from "./types";
import type { DocumentConfig } from "@/features/admin-config/components/ManualDocumentConfig";
import type { DocumentTemplateSummary } from "./types";

export function mapBackendToDocumentConfig(
  backend: BackendDocType
): DocumentConfig {
  return {
    id: backend.id,
    name: backend.document_type_name,
    fields: backend.field_lists.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name ?? f.field_name ?? "", // either system or manual
      type: mapBackendFieldType(f.type ?? f.field_type),
      required: f.required ?? f.is_mandatory ?? false,
    })),
  };
}

function mapBackendFieldType(
  type: string | undefined
): "text" | "number" | "date" | "currency" {
  switch (type) {
    case "string":
    case "text":
      return "text";
    case "int":
    case "float":
    case "number":
      return "number";
    case "date":
      return "date";
    case "currency":
      return "currency";
    default:
      return "text";
  }
}


export function mapBackendToDocumentTemplateSummary(
  backend: BackendDocType
): DocumentTemplateSummary {
  return {
    id: backend.id,
    name: backend.document_type_name,
    fieldCount: backend.field_lists.length,
    status: backend.status,
    createdBy: backend.created_by,
    isApproved: backend.is_approved,
    createdAt: backend.created_at,
  };
}


// @/features/admin-config/mappers.ts

export const mapDocumentConfigToBackend = (config: DocumentConfig) => {
  return {
    document_type_name: config.name,
    // Add default values for fields not present in your UI yet
    vertical: "General", 
    detection_keywords: [], 
    status: "active",
    is_approved: false,
    // Map the fields array to match the "field_lists" schema
    field_lists: config.fields.map((f) => ({
      field_name: f.name,
      field_type: f.type, // "text", "number", etc.
      is_mandatory: f.required,
      is_deleted: false,
    })),
  };
};
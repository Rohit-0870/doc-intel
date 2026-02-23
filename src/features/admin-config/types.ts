export interface BackendField {
  // backend uses these properties now
  field_name: string;
  field_type: string;
  is_mandatory: boolean;

  // optional: if some older docs still use the other keys
  name?: string;
  type?: string;
  required?: boolean;
}

export interface BackendDocType {
  id: string;
  document_type_name: string;
  field_lists: BackendField[];
  status: "active" | "inactive";
  is_deleted: boolean;
  is_approved: boolean;
  created_by: "system" | "manual";
  auto_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetDocTypesResponse {
  success: boolean;
  data: BackendDocType[];
  total_count: number;
  page: number;
  page_size: number;
  error: string | null;
}


export type DocumentTemplateSummary = {
  id: string;
  name: string;
  fieldCount: number;
  status: string;
  createdBy: string;
  isApproved: boolean;
  createdAt: string;
};

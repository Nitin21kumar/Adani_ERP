export interface EmployeeDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  doc_category: string | null;
  uploaded_at: string;
}

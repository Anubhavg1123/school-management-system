import { apiClient } from './client';

export interface ImportPreviewResult {
  importLogId: string;
  importType: string;
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  preview: Array<{
    rowIndex: number;
    data: Record<string, string>;
    status: 'VALID' | 'ERROR';
    errors: string[];
  }>;
}

export interface ImportConfirmResult {
  importLogId: string;
  status: string;
  totalProcessed: number;
  successRows: number;
  failedRows: number;
}

export interface ImportLog {
  id: string;
  importType: string;
  filename: string;
  status: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  skippedRows: number;
  errorSummary?: string;
  uploadedBy: string;
  createdAt: string;
}

export const dataImportApi = {
  previewStudents: (csvContent: string, filename?: string): Promise<ImportPreviewResult> =>
    apiClient.post('/import/students/preview', { csvContent, filename }).then((r) => r.data.data),

  confirmStudents: (importLogId: string, defaultAcademicYearId?: string): Promise<ImportConfirmResult> =>
    apiClient.post('/import/students/confirm', { importLogId, defaultAcademicYearId }).then((r) => r.data.data),

  getLogs: (): Promise<{ logs: ImportLog[] }> =>
    apiClient.get('/import/logs').then((r) => r.data.data),
};

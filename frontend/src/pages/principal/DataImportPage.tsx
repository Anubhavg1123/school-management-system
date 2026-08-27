import React, { useState, useEffect } from 'react';
import { dataImportApi, ImportPreviewResult, ImportLog } from '../../api/dataImport';

export const DataImportPage: React.FC = () => {
  const [csvText, setCsvText] = useState('');
  const [filename, setFilename] = useState('students.csv');
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchLogs = async () => {
    try {
      const data = await dataImportApi.getLogs();
      setLogs(data.logs);
    } catch {
      // Ignore initial load failure
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilename(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvText(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handlePreview = async () => {
    if (!csvText.trim()) {
      setMessage({ text: 'Please upload a CSV file or paste CSV data.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await dataImportApi.previewStudents(csvText, filename);
      setPreview(res);
      setMessage({
        text: `Preview generated: ${res.validRows} valid rows, ${res.invalidRows} errors.`,
        type: res.invalidRows > 0 ? 'error' : 'success',
      });
    } catch (err: any) {
      setMessage({
        text: err?.response?.data?.error?.message || err?.message || 'Failed to preview import.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setConfirming(true);
    setMessage(null);
    try {
      const res = await dataImportApi.confirmStudents(preview.importLogId);
      setMessage({
        text: `Import confirmed! Successfully imported ${res.successRows} student records.`,
        type: 'success',
      });
      setPreview(null);
      setCsvText('');
      fetchLogs();
    } catch (err: any) {
      setMessage({
        text: err?.response?.data?.error?.message || err?.message || 'Failed to execute import.',
        type: 'error',
      });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Institutional Data Import & Migration</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Bulk ingestion with pre-validation, atomic transaction execution, and full audit logging.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Step 1: Upload & Input */}
      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">1. Upload Student CSV</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Required CSV headers: <code className="font-mono text-indigo-600 dark:text-indigo-400">first_name, last_name, email, admission_number, gender, date_of_birth</code>
          <br />Optional: <code className="font-mono text-slate-600 dark:text-slate-400">phone, whatsapp_number, admission_date</code>
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <button
            onClick={handlePreview}
            disabled={loading || !csvText}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition"
          >
            {loading ? 'Validating...' : 'Validate & Preview'}
          </button>
        </div>

        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Or paste CSV content directly here..."
          rows={5}
          className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
        />
      </div>

      {/* Step 2: Validation Preview */}
      {preview && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">2. Import Validation Preview</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total Rows: {preview.totalRows} | Valid: <span className="font-bold text-emerald-600">{preview.validRows}</span> | Errors: <span className="font-bold text-rose-600">{preview.invalidRows}</span>
              </p>
            </div>
            <button
              onClick={handleConfirm}
              disabled={confirming || preview.validRows === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition"
            >
              {confirming ? 'Importing...' : `Confirm & Import (${preview.validRows} Records)`}
            </button>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Admission No</th>
                  <th className="px-3 py-2">Validation Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                {preview.preview.map((row) => (
                  <tr key={row.rowIndex} className={row.status === 'ERROR' ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}>
                    <td className="px-3 py-2 font-mono">{row.rowIndex}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === 'VALID'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">{`${row.data.first_name || ''} ${row.data.last_name || ''}`}</td>
                    <td className="px-3 py-2 font-mono">{row.data.email}</td>
                    <td className="px-3 py-2 font-mono">{row.data.admission_number}</td>
                    <td className="px-3 py-2 text-rose-600 dark:text-rose-400">
                      {row.errors.length > 0 ? row.errors.join('; ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import History */}
      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Import History & Audit Log</h2>
        {logs.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">File</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Uploaded By</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Success / Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2.5 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{log.filename}</td>
                    <td className="px-4 py-2.5">{log.importType}</td>
                    <td className="px-4 py-2.5">{log.uploadedBy}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {log.successRows} / {log.totalRows}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">No import history yet.</p>
        )}
      </div>
    </div>
  );
};

export default DataImportPage;

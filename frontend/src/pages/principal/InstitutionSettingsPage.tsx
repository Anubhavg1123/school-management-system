import React, { useEffect, useState } from 'react';
import { getInstitutionSettings, updateInstitutionSettings, promoteStudentsBatch } from '../../api/institution';
import { apiClient as api } from '../../api/client';
import { Settings, ShieldAlert, Award, Calendar, Layers, FileText, CheckCircle2 } from 'lucide-react';

export const InstitutionSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [institutionName, setInstitutionName] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [attendanceThreshold, setAttendanceThreshold] = useState(75.0);

  // Promotion Batch form
  const [fromYearId, setFromYearId] = useState('');
  const [toYearId, setToYearId] = useState('');
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [remarks, setRemarks] = useState('');

  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const fetchData = async () => {
    try {
      const [stg, yearsRes, classesRes, logsRes] = await Promise.all([
        getInstitutionSettings(),
        api.get('/academic/academic-years'),
        api.get('/academic/classes'),
        api.get('/audit/logs?limit=15'),
      ]);

      setSettings(stg);
      setInstitutionName(stg.institutionName || '');
      setAddress(stg.address || '');
      setContactEmail(stg.contactEmail || '');
      setAttendanceThreshold(stg.attendanceThresholdPercent || 75.0);

      setAcademicYears(yearsRes.data.data);
      setClasses(classesRes.data.data);
      setAuditLogs(logsRes.data.data);
    } catch (err) {
      console.error('Failed to load institution settings data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateInstitutionSettings({
        institutionName,
        address,
        contactEmail,
        attendanceThresholdPercent: Number(attendanceThreshold),
      });
      alert('Institution settings saved successfully.');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePromoteBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromYearId || !toYearId || !fromClassId || !toClassId) {
      alert('Please select all required promotion parameters.');
      return;
    }
    setPromoting(true);
    try {
      const res = await promoteStudentsBatch({
        fromAcademicYearId: fromYearId,
        toAcademicYearId: toYearId,
        fromClassId,
        toClassId,
        remarks,
      });
      alert(`Successfully promoted ${res.promotedStudentCount} active students!`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Promotion batch failed.');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Institutional Governance & System Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure Profile Settings, Attendance Policies, Academic Year Promotion, and Review Audit Trail
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile & Policy Settings */}
        <form onSubmit={handleUpdateSettings} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Settings size={20} className="text-indigo-600" />
            <span>Institution Profile & Parameters</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Institution Name</label>
            <input
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Campus Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Min Attendance Threshold %</label>
              <input
                type="number"
                step="0.1"
                value={attendanceThreshold}
                onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
                className="w-full text-xs p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>

        {/* Year-End Batch Promotion Tool */}
        <form onSubmit={handlePromoteBatch} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Award size={20} className="text-purple-600" />
            <span>Year-End Safe Student Promotion Tool</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">From Academic Year</label>
              <select
                value={fromYearId}
                onChange={(e) => setFromYearId(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg bg-white"
              >
                <option value="">Select Year</option>
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">To Academic Year</label>
              <select
                value={toYearId}
                onChange={(e) => setToYearId(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg bg-white"
              >
                <option value="">Select Year</option>
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">From Class</label>
              <select
                value={fromClassId}
                onChange={(e) => setFromClassId(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg bg-white"
              >
                <option value="">Select Source Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">To Class</label>
              <select
                value={toClassId}
                onChange={(e) => setToClassId(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg bg-white"
              >
                <option value="">Select Target Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Promotion Remarks</label>
            <input
              type="text"
              placeholder="e.g. Annual academic promotion batch"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={promoting}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition"
          >
            {promoting ? 'Promoting Students...' : 'Promote Student Batch'}
          </button>
        </form>
      </div>

      {/* Immutable Institutional Audit Trail */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <FileText size={20} className="text-slate-700" />
          <span>Immutable Institutional Audit Log Stream</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3">Entity ID</th>
                <th className="py-2.5 px-3">User ID</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-mono text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-bold text-indigo-700">{log.action}</td>
                  <td className="py-2.5 px-3 text-gray-700">{log.entityType}</td>
                  <td className="py-2.5 px-3 font-mono text-gray-500">{log.entityId || 'N/A'}</td>
                  <td className="py-2.5 px-3 font-mono text-gray-500">{log.userId || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

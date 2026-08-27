import React, { useState, useEffect } from 'react';
import { studentAttendanceApi } from '../../api/studentAttendance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Award,
  FileCheck,
  UserCheck,
  ShieldCheck,
  Calendar,
  Users,
} from 'lucide-react';

export const AttendanceCorrectionHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'corrections' | 'bypass' | 'staffSummary'>('corrections');
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [selectedCorrectionId, setSelectedCorrectionId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Daily Summary State
  const [summaryDate, setSummaryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailySummary, setDailySummary] = useState<any>(null);

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const res = await studentAttendanceApi.getAnomalies({ limit: 50 });
      if (res.success && res.data) {
        setAnomalies(res.data);
      }
    } catch (err) {
      console.error('Failed to load anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDailySummary = async (date: string) => {
    try {
      setLoading(true);
      const res = await studentAttendanceApi.getDailySummary({ date });
      if (res.success && res.data) {
        setDailySummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load daily summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'corrections') loadAnomalies();
    if (activeTab === 'staffSummary') loadDailySummary(summaryDate);
  }, [activeTab, summaryDate]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Review & Correction Hub</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review student attendance correction petitions, approve academic bypasses, and inspect campus staff logs.
          </p>
        </div>
        {activeTab === 'staffSummary' && (
          <Input
            type="date"
            value={summaryDate}
            onChange={(e) => setSummaryDate(e.target.value)}
            className="w-44"
          />
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 bg-white px-4 pt-2 rounded-t-xl">
        <button
          onClick={() => setActiveTab('corrections')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'corrections'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Correction Petitions & Anomalies
        </button>
        <button
          onClick={() => setActiveTab('bypass')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'bypass'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="w-4 h-4" />
          Academic Activity Bypasses
        </button>
        <button
          onClick={() => setActiveTab('staffSummary')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'staffSummary'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Daily Staff Check-In Breakdown
        </button>
      </div>

      {/* Tab 1: Corrections & Anomalies */}
      {activeTab === 'corrections' && (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Attendance Anomaly & Audit Feed</h2>
            <Button onClick={loadAnomalies} variant="outline" size="sm">
              Refresh Feed
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading audit feed...</div>
          ) : anomalies.length === 0 ? (
            <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              No attendance anomalies or delayed submission logs detected.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Anomaly Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Initiated By</th>
                    <th className="p-3">Target Entity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {anomalies.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="p-3 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            item.type === 'DELAYED_SUBMISSION'
                              ? 'warning'
                              : item.type === 'OUTSIDE_WINDOW'
                              ? 'danger'
                              : 'info'
                          }
                        >
                          {item.type}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium text-gray-900">{item.description}</td>
                      <td className="p-3 text-gray-600">
                        {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System'}
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-500">{item.entityType} ({item.entityId})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Academic Bypasses */}
      {activeTab === 'bypass' && (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Academic Activity Bypass Requests</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Authorized absences for inter-college sports, debates, or university activities.
              </p>
            </div>
          </div>
          <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            Select a student record in the roll call view or submit a bypass request via API to manage approvals.
          </div>
        </Card>
      )}

      {/* Tab 3: Daily Staff Check-In Breakdown */}
      {activeTab === 'staffSummary' && dailySummary && (
        <Card className="p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Daily Institutional Staff Reporting</h2>
              <p className="text-xs text-gray-500 mt-0.5">Summary for {summaryDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <span className="text-xs text-gray-500 font-medium block">TOTAL USERS</span>
              <span className="text-xl font-bold text-gray-900">{dailySummary.totalUsers}</span>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <span className="text-xs text-green-700 font-medium block">CHECKED-IN</span>
              <span className="text-xl font-bold text-green-800">{dailySummary.checkedInCount}</span>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <span className="text-xs text-amber-700 font-medium block">LATE</span>
              <span className="text-xl font-bold text-amber-800">{dailySummary.late}</span>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <span className="text-xs text-red-700 font-medium block">ABSENT</span>
              <span className="text-xl font-bold text-red-800">{dailySummary.absent}</span>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg text-center">
              <span className="text-xs text-indigo-700 font-medium block">MISSING CHECKOUT</span>
              <span className="text-xl font-bold text-indigo-800">{dailySummary.missingCheckout}</span>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <span className="text-xs text-purple-700 font-medium block">ON LEAVE</span>
              <span className="text-xl font-bold text-purple-800">{dailySummary.onLeave}</span>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Primary Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Check-In Time</th>
                  <th className="p-3">Check-Out Time</th>
                  <th className="p-3">Late Mins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dailySummary.records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-medium text-gray-900">
                      {r.user.firstName} {r.user.lastName}
                    </td>
                    <td className="p-3 text-xs text-gray-600">{r.user.activeRole}</td>
                    <td className="p-3">
                      <Badge variant={r.status === 'PRESENT' ? 'success' : r.status === 'LATE' ? 'warning' : 'danger'}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-xs text-gray-600">
                      {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '—'}
                    </td>
                    <td className="p-3 font-mono text-xs text-gray-600">
                      {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : 'Missing Checkout'}
                    </td>
                    <td className="p-3 text-xs font-mono text-gray-700">{r.lateMinutes || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

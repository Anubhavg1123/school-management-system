import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../api/reports';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  FileSpreadsheet,
  Download,
  Building2,
  Users,
  GraduationCap,
  ArrowRightLeft,
  Calendar,
  CheckCircle,
  Clock,
  BookOpen,
} from 'lucide-react';

export const ReportsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roster' | 'classes' | 'departments' | 'transfers' | 'admissions'>('roster');
  const [isLoading, setIsLoading] = useState(true);

  const [rosterData, setRosterData] = useState<any>(null);
  const [classData, setClassData] = useState<any>(null);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [transferData, setTransferData] = useState<any[]>([]);
  const [admissionData, setAdmissionData] = useState<any>(null);

  const loadAllReports = async () => {
    setIsLoading(true);
    try {
      const [rosterRes, classRes, deptRes, transferRes, admissionRes] = await Promise.all([
        reportsApi.getStudentRoster(),
        reportsApi.getClassWiseReport(),
        reportsApi.getDepartmentWiseReport(),
        reportsApi.getTransfersReport(),
        reportsApi.getAdmissionsReport(),
      ]);

      if (rosterRes.success) setRosterData(rosterRes.data);
      if (classRes.success) setClassData(classRes.data);
      if (deptRes.success) setDeptData(deptRes.data);
      if (transferRes.success) setTransferData(transferRes.data);
      if (admissionRes.success) setAdmissionData(admissionRes.data);
    } catch (err) {
      console.error('Failed to load institutional reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  const handleDownloadRosterCsv = () => {
    window.open(reportsApi.downloadRosterCsvUrl(), '_blank');
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Generating institutional analytics & reports..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-brand-600" />
            <span>Institutional Analytics & Reports Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time verified reporting: export student rosters, monitor classroom seat capacity, and inspect transfer audit logs.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleDownloadRosterCsv}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export Student Roster (CSV)
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Admissions"
          value={rosterData?.summary?.total || 0}
          description="Lifetime registered students"
          icon={<GraduationCap className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="Active Students"
          value={rosterData?.summary?.active || 0}
          description="Currently enrolled & active"
          icon={<Users className="w-6 h-6" />}
          variant="success"
        />
        <StatCard
          title="Classroom Utilization"
          value={`${classData?.summary?.overallUtilization || 0}%`}
          description={`${classData?.summary?.totalActive || 0} / ${classData?.summary?.totalCapacity || 0} capacity`}
          icon={<BookOpen className="w-6 h-6" />}
          variant="warning"
        />
        <StatCard
          title="Academic Departments"
          value={deptData.length}
          description="Active instructional units"
          icon={<Building2 className="w-6 h-6" />}
          variant="default"
        />
      </div>

      {/* Tabs */}
      <Card noPadding>
        <div className="flex border-b border-slate-200 px-4 bg-slate-50/70">
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'border-brand-600 text-brand-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Roster ({rosterData?.summary?.total || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'classes'
                ? 'border-brand-600 text-brand-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Class Capacity & Utilization</span>
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'departments'
                ? 'border-brand-600 text-brand-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Department Enrollment</span>
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'transfers'
                ? 'border-brand-600 text-brand-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer & Status Log ({transferData.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('admissions')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'admissions'
                ? 'border-brand-600 text-brand-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Admissions Intake Timeline</span>
          </button>
        </div>

        {/* Tab 1: Student Roster */}
        {activeTab === 'roster' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700">Detailed Student Roster Breakdown</span>
              <Button variant="outline" size="sm" onClick={handleDownloadRosterCsv} leftIcon={<Download className="w-3.5 h-3.5" />}>
                Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="p-3">Admission #</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Class & Section</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">WhatsApp / Phone</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Admission Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rosterData?.rows?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-brand-700">{r.admissionNumber}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{r.fullName}</div>
                        <div className="text-slate-400 text-[10px] font-mono">{r.email}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-slate-800">{r.className}</span> ({r.sectionName})
                      </td>
                      <td className="p-3 text-slate-600">{r.departmentName}</td>
                      <td className="p-3 font-mono text-emerald-700">{r.whatsAppNumber}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            r.status === 'ACTIVE'
                              ? 'success'
                              : r.status === 'LEFT_INSTITUTION'
                              ? 'danger'
                              : r.status === 'GRADUATED'
                              ? 'info'
                              : 'warning'
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{r.admissionDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Class & Section Utilization */}
        {activeTab === 'classes' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classData?.classes?.map((c: any) => (
                <div key={c.classId} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{c.className}</h4>
                      <p className="text-[11px] text-slate-400">
                        Code: {c.classCode} | Dept: {c.departmentName} | AY: {c.academicYear}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {c.sections.map((sec: any) => (
                      <div key={sec.sectionId} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-800">{sec.sectionName}</span>
                          <span className="font-bold text-brand-700">{sec.utilizationPercentage}% Full</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sec.utilizationPercentage >= 90
                                ? 'bg-rose-500'
                                : sec.utilizationPercentage >= 60
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, sec.utilizationPercentage)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Enrolled: <strong>{sec.activeCount}</strong> active</span>
                          <span>Capacity: <strong>{sec.capacity}</strong> (Available: {sec.availableSeats})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Department-wise Enrollment */}
        {activeTab === 'departments' && (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="p-3">Department</th>
                    <th className="p-3">HOD in Charge</th>
                    <th className="p-3 text-center">Faculty Count</th>
                    <th className="p-3 text-center">Classes</th>
                    <th className="p-3 text-center">Enrolled Students</th>
                    <th className="p-3 text-center">Active Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deptData.map((d) => (
                    <tr key={d.departmentId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{d.departmentName}</div>
                        <div className="text-slate-400 font-mono text-[10px]">Code: {d.departmentCode}</div>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{d.hodName}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{d.facultyCount}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{d.classCount}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{d.totalStudents}</td>
                      <td className="p-3 text-center">
                        <Badge variant="success">{d.activeStudents}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Student Transfers & Promotions Log */}
        {activeTab === 'transfers' && (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="p-3">Date</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Transfer Type</th>
                    <th className="p-3">Status Transition</th>
                    <th className="p-3">Reason / Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transferData.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {new Date(t.effectiveDate).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{t.studentName}</div>
                        <div className="text-brand-700 font-mono text-[10px]">{t.admissionNumber}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="primary">{t.transferType.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {t.fromStatus} &rarr; {t.toStatus}
                      </td>
                      <td className="p-3 text-slate-700 max-w-sm">{t.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Admissions Intake Timeline */}
        {activeTab === 'admissions' && (
          <div className="p-4 space-y-4">
            <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
              <span className="text-brand-900 font-bold text-sm">Monthly Intake Statistics</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                {Object.entries(admissionData?.monthlyBreakdown || {}).map(([month, count]) => (
                  <div key={month} className="p-3 bg-white rounded-lg border border-brand-100 shadow-xs">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">{month}</span>
                    <h4 className="text-xl font-bold text-brand-800">{count as number} Students</h4>
                  </div>
                ))}
              </div>
            </div>

            <h4 className="font-bold text-slate-800 mt-4">Recent Admissions Log</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="p-3">Admission #</th>
                    <th className="p-3">Class & Section</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Admission Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admissionData?.recentAdmissions?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-brand-700">{s.admissionNumber}</td>
                      <td className="p-3 font-medium text-slate-800">{s.className} - {s.sectionName}</td>
                      <td className="p-3 text-slate-600">{s.department}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{s.admissionDate}</td>
                      <td className="p-3">
                        <Badge variant="success">{s.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

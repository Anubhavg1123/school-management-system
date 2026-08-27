import React, { useEffect, useState } from 'react';
import { getPrincipalDashboard, getExecutiveSummary, getDepartmentOverview, searchGlobal, getSystemHealth } from '../../api/principal';
import { 
  Building2, Users, GraduationCap, DollarSign, Activity, Search, ShieldCheck, 
  AlertTriangle, CheckCircle, Clock, FileText, Bell, RefreshCw
} from 'lucide-react';

export const PrincipalDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [executiveSummary, setExecutiveSummary] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'academic' | 'staff' | 'finance' | 'operations' | 'communication'>('academic');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [m, summary, depts, h] = await Promise.all([
        getPrincipalDashboard(),
        getExecutiveSummary(),
        getDepartmentOverview(),
        getSystemHealth(),
      ]);
      setMetrics(m);
      setExecutiveSummary(summary);
      setDepartments(depts);
      setHealth(h);
    } catch (err) {
      console.error('Failed to load Principal Dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const results = await searchGlobal(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Global search failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
        <span className="ml-3 text-gray-600 font-medium">Loading Real-Time Institutional Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Global Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Principal Executive Command Center</h1>
          <p className="text-indigo-200 text-sm mt-1">
            Real-time Institutional Overview & Controlled Administrative Governance
          </p>
        </div>

        <form onSubmit={handleSearch} className="mt-4 md:mt-0 flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Global Search (Student, Faculty, Vehicle, Notice)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 w-72"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Global Search Results Modal Overlay if Search active */}
      {searchResults && (
        <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Search Results for "{searchQuery}"</h3>
            <button onClick={() => setSearchResults(null)} className="text-sm text-gray-500 hover:text-gray-800">
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-indigo-700 mb-2">Students ({searchResults.students.length})</h4>
              {searchResults.students.map((s: any) => (
                <div key={s.id} className="p-2 border-b">{s.name} ({s.admissionNumber})</div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold text-indigo-700 mb-2">Faculty ({searchResults.faculty.length})</h4>
              {searchResults.faculty.map((f: any) => (
                <div key={f.id} className="p-2 border-b">{f.designation} ({f.employeeCode})</div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold text-indigo-700 mb-2">Vehicles ({searchResults.vehicles.length})</h4>
              {searchResults.vehicles.map((v: any) => (
                <div key={v.id} className="p-2 border-b">{v.registrationNumber} ({v.makeModel})</div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold text-indigo-700 mb-2">Notices ({searchResults.notices.length})</h4>
              {searchResults.notices.map((n: any) => (
                <div key={n.id} className="p-2 border-b">{n.title}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Level Real-Time KPI Cards (Zero-Fake!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Students</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics?.totalActiveStudents || 0}</h3>
              <span className="text-xs text-gray-400 mt-1 inline-block">+{metrics?.newAdmissions || 0} new intake</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <GraduationCap size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Faculty & Staff</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {(metrics?.facultyCount || 0) + (metrics?.nonFacultyCount || 0)}
              </h3>
              <span className="text-xs text-gray-400 mt-1 inline-block">
                {metrics?.facultyCount} Faculty | {metrics?.nonFacultyCount} Non-Faculty
              </span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Student Attendance</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {metrics?.todayStudentAttendancePercent}%
              </h3>
              <span className="text-xs text-rose-500 mt-1 inline-block">
                {metrics?.lowAttendanceCount} low-attendance alerts
              </span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Fee Collection</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                ₹{metrics?.todayFeeCollection?.toLocaleString() || 0}
              </h3>
              <span className="text-xs text-amber-600 mt-1 inline-block">
                ₹{metrics?.outstandingFees?.toLocaleString() || 0} outstanding
              </span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-3 flex space-x-6">
          {(['academic', 'staff', 'finance', 'operations', 'communication'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-semibold capitalize pb-1 transition border-b-2 ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab} Summary
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'academic' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">School Classes & Sections</p>
                <p className="text-xl font-bold text-gray-800 mt-1">
                  {executiveSummary?.academic?.classStrength || 0} Classes (Class 1–10)
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Student Attendance Rate</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  {executiveSummary?.academic?.studentAttendancePercent}% Present Today
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Low Attendance Count (&lt;75%)</p>
                <p className="text-xl font-bold text-rose-600 mt-1">
                  {executiveSummary?.academic?.lowAttendanceCount} Students
                </p>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Faculty Attendance Today</p>
                <p className="text-xl font-bold text-indigo-600 mt-1">
                  {executiveSummary?.staff?.facultyAttendancePercent}% Present
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Non-Faculty Staff Attendance</p>
                <p className="text-xl font-bold text-indigo-600 mt-1">
                  {executiveSummary?.staff?.staffAttendancePercent}% Present
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Faculty Currently On Leave</p>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  {executiveSummary?.staff?.facultyOnLeave} Faculty Members
                </p>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Total Fees Assigned</p>
                <p className="text-xl font-bold text-gray-800 mt-1">₹{executiveSummary?.finance?.totalFees?.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Total Collected</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">₹{executiveSummary?.finance?.collectedFees?.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Outstanding Dues</p>
                <p className="text-xl font-bold text-rose-600 mt-1">₹{executiveSummary?.finance?.outstandingFees?.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Overdue Accounts</p>
                <p className="text-xl font-bold text-amber-600 mt-1">{executiveSummary?.finance?.overdueCount} Accounts</p>
              </div>
            </div>
          )}

          {activeTab === 'operations' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Active Campus Visitors</p>
                <p className="text-xl font-bold text-blue-600 mt-1">{executiveSummary?.operations?.activeVisitors} Inside</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Today's Total Visitors</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{executiveSummary?.operations?.todayVisitors} Entries</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Pending Vehicle Approvals</p>
                <p className="text-xl font-bold text-purple-600 mt-1">{executiveSummary?.operations?.pendingVehicleApprovals} Requests</p>
              </div>
            </div>
          )}

          {activeTab === 'communication' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Active Institutional Notices</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{executiveSummary?.communication?.recentNotices} Notices</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Failed Delivery Messages</p>
                <p className="text-xl font-bold text-rose-600 mt-1">{executiveSummary?.communication?.failedMessages} Failed</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">WhatsApp Provider Status</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  {executiveSummary?.communication?.isWhatsAppConnected ? 'Connected (Meta Graph API)' : 'Not Configured'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* School Class & Academic Structure Overview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">School Class & Section Performance Overview (Classes 1–10)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b">
                <th className="py-3 px-4">Class Standard</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Sections</th>
                <th className="py-3 px-4">Enrolled Students</th>
                <th className="py-3 px-4">Active Status</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No active school classes registered yet. Create classes in Academic Structure as admissions begin.
                  </td>
                </tr>
              ) : (
                departments.map((d) => (
                  <tr key={d.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-semibold text-indigo-600">{d.name}</td>
                    <td className="py-3 px-4 text-gray-700">{d.code}</td>
                    <td className="py-3 px-4 text-gray-700">{d.classCount || d.sectionsCount || 1} Sections</td>
                    <td className="py-3 px-4 text-gray-700 font-medium">{d.studentCount || 0} Students</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                        {d.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Health Command Monitor */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-emerald-400" size={24} />
            <h3 className="text-lg font-bold">System Infrastructure & API Health Monitor</h3>
          </div>
          <span className="text-xs text-slate-400">Uptime: {health?.uptimeSeconds || 0} seconds</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 block">Database Connectivity</span>
            <span className="text-emerald-400 font-bold text-sm">{health?.database}</span>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 block">WhatsApp Graph API</span>
            <span className="text-indigo-400 font-bold text-sm">{health?.whatsappIntegration}</span>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 block">Pending Worker Queue</span>
            <span className="text-amber-400 font-bold text-sm">{health?.queueStatus?.pendingJobs} Jobs</span>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 block">Failed Message Queue</span>
            <span className="text-rose-400 font-bold text-sm">{health?.queueStatus?.failedJobs} Jobs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { getOfficeDashboard, createStudentMaster, updateStudentStatus, recordFeePayment } from '../../api/office';
import { apiClient as api } from '../../api/client';
import { Users, UserPlus, DollarSign, FileText, CheckCircle, AlertCircle, Plus } from 'lucide-react';

export const OfficeDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);

  // Student form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('FATHER');
  const [guardianWhatsAppNumber, setGuardianWhatsAppNumber] = useState('');
  const [sectionId, setSectionId] = useState('');

  // Payment form state
  const [payStudentId, setPayStudentId] = useState('');
  const [payFeeAssignmentId, setPayFeeAssignmentId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');

  const [submitting, setSubmitting] = useState(false);

  const fetchOfficeData = async () => {
    setLoading(true);
    try {
      const [m, stdRes, secRes] = await Promise.all([
        getOfficeDashboard(),
        api.get('/academic/students'),
        api.get('/academic/sections'),
      ]);
      setMetrics(m);
      setStudents(stdRes.data.data);
      setSections(secRes.data.data);
    } catch (err) {
      console.error('Failed to load Office data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficeData();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianWhatsAppNumber || guardianWhatsAppNumber.trim().length < 5) {
      alert('Parent/Guardian WhatsApp number is mandatory for student admission intake.');
      return;
    }
    setSubmitting(true);
    try {
      await createStudentMaster({
        firstName,
        lastName,
        email,
        guardianName,
        guardianRelationship,
        guardianWhatsAppNumber,
        sectionId,
      });
      setShowAddStudent(false);
      alert('Student Master record created successfully!');
      await fetchOfficeData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Student creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payStudentId || !payFeeAssignmentId || !payAmount) {
      alert('Please fill out all payment fields.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await recordFeePayment({
        studentId: payStudentId,
        studentFeeAssignmentId: payFeeAssignmentId,
        amount: Number(payAmount),
        paymentMethod: payMethod,
      });
      setShowRecordPayment(false);
      alert(`Payment of ₹${payAmount} verified. Receipt issued: ${result.receipt.receiptNumber}`);
      await fetchOfficeData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Payment recording failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (studentId: string, currentStatus: string) => {
    const newStatus = prompt('Enter new status (ACTIVE, LEFT_INSTITUTION, SUSPENDED):', currentStatus);
    if (!newStatus || newStatus === currentStatus) return;
    const reason = prompt('Enter reason for status update:');
    if (!reason) return;

    try {
      await updateStudentStatus(studentId, { status: newStatus, reason });
      await fetchOfficeData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Status update failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central Office Administration Portal</h1>
          <p className="text-gray-500 text-sm mt-1">
            Student Master Records, Admission Workflow, Parent Contacts, & Official Financial Receipts
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowRecordPayment(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition flex items-center space-x-1"
          >
            <DollarSign size={16} />
            <span>Record Fee Payment</span>
          </button>
          <button
            onClick={() => setShowAddStudent(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition flex items-center space-x-1"
          >
            <Plus size={16} />
            <span>New Student Admission Intake</span>
          </button>
        </div>
      </div>

      {/* Office KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Students</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics?.totalStudents || 0}</h3>
          <span className="text-xs text-emerald-600 mt-1 inline-block">{metrics?.activeStudents || 0} Active</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Left Institution</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">{metrics?.leftStudents || 0}</h3>
          <span className="text-xs text-gray-400 mt-1 inline-block">Historical Records Preserved</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Pending Approvals</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">{metrics?.pendingUserApprovals || 0}</h3>
          <span className="text-xs text-amber-700 mt-1 inline-block">Registrations in Queue</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Outstanding Fees</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{metrics?.outstandingFees?.toLocaleString() || 0}</h3>
          <span className="text-xs text-emerald-600 mt-1 inline-block">₹{metrics?.feesCollected?.toLocaleString() || 0} Collected</span>
        </div>
      </div>

      {/* Student Master Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Student Master Catalog</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b">
                <th className="py-3 px-4">Adm #</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Parent WhatsApp</th>
                <th className="py-3 px-4">Class / Section</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No students registered yet. Click "Add New Student" to process admissions.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{s.admissionNumber}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{s.user?.firstName} {s.user?.lastName}</td>
                    <td className="py-3 px-4 text-gray-600">{s.user?.email}</td>
                    <td className="py-3 px-4 font-mono text-gray-700">{s.user?.whatsAppNumber || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-600">{s.section?.class?.name || 'Unassigned'} ({s.section?.name || '—'})</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : s.status === 'LEFT_INSTITUTION'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleStatusChange(s.id, s.status)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-md transition"
                      >
                        Manage Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateStudent} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">New Student Admission Intake</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Student Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Guardian Name</label>
                <input
                  type="text"
                  required
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Parent WhatsApp * (Mandatory)</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={guardianWhatsAppNumber}
                  onChange={(e) => setGuardianWhatsAppNumber(e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg border-indigo-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Class / Section</label>
              <select
                required
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full text-xs p-2 border rounded-lg bg-white"
              >
                <option value="">Select Section</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>{sec.class?.name} - {sec.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddStudent(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg"
              >
                {submitting ? 'Creating...' : 'Admit Student'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Fee Payment Modal */}
      {showRecordPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleRecordPayment} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Record & Verify Fee Payment</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Student</label>
              <select
                required
                value={payStudentId}
                onChange={(e) => {
                  setPayStudentId(e.target.value);
                  const selectedStd = students.find((s) => s.id === e.target.value);
                  if (selectedStd && selectedStd.feeAssignments?.length > 0) {
                    setPayFeeAssignmentId(selectedStd.feeAssignments[0].id);
                  }
                }}
                className="w-full text-xs p-2 border rounded-lg bg-white"
              >
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.user?.firstName} {s.user?.lastName} ({s.admissionNumber})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fee Assignment ID</label>
              <input
                type="text"
                required
                value={payFeeAssignmentId}
                onChange={(e) => setPayFeeAssignmentId(e.target.value)}
                placeholder="Enter StudentFeeAssignment ID..."
                className="w-full text-xs p-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg bg-white"
                >
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="ONLINE">ONLINE GATEWAY</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowRecordPayment(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
              >
                {submitting ? 'Verifying...' : 'Record & Issue Receipt'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

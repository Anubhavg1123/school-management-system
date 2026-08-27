import React, { useState, useEffect } from 'react';
import { feesApi } from '../../api/fees';
import { academicApi } from '../../api/academic';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ReceiptModal } from '../../components/ui/ReceiptModal';
import {
  FeeCategory,
  FeeStructure,
  StudentFeeAssignment,
  Payment,
  Receipt,
  Refund,
  Student,
  AcademicYear,
  ClassItem,
  FeeAssignmentStatusEnum,
  PaymentMethodEnum,
} from '../../types';
import {
  Wallet,
  DollarSign,
  Receipt as ReceiptIcon,
  CreditCard,
  Building2,
  ArrowRightLeft,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  Undo2,
  Tag,
  Eye,
  Percent,
} from 'lucide-react';

export const FeeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'collect' | 'structures' | 'assignments' | 'discounts' | 'refunds' | 'reports'
  >('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [assignments, setAssignments] = useState<StudentFeeAssignment[]>([]);
  const [outstandingRows, setOutstandingRows] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Selected for Actions
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<any>(null);

  // Form States
  const [categoryForm, setCategoryForm] = useState({ code: '', name: '', description: '' });
  const [structureForm, setStructureForm] = useState({
    code: `FS-${Date.now().toString().slice(-4)}`,
    name: '',
    academicYearId: '',
    classId: '',
    description: '',
    items: [{ feeCategoryId: '', amount: 0, installmentCount: 3 }],
  });

  const [assignForm, setAssignForm] = useState({
    studentId: '',
    feeStructureId: '',
    academicYearId: '',
    notes: '',
    customInstallments: 3,
  });

  const [discountForm, setDiscountForm] = useState({
    feeAssignmentId: '',
    type: 'SCHOLARSHIP',
    amount: 0,
    percentage: 0,
    reason: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    feeAssignmentId: '',
    amount: 0,
    paymentMethod: 'CASH',
    transactionReference: '',
    notes: '',
  });

  const [refundForm, setRefundForm] = useState({
    paymentId: '',
    amount: 0,
    reason: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Initial Financial Hub Data
  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, catRes, structRes, assignRes, reportRes, classRes, yrRes, stdRes] = await Promise.all([
        feesApi.getDashboard(),
        feesApi.getCategories(),
        feesApi.getStructures(),
        feesApi.getAssignments({ limit: 50 }),
        feesApi.getOutstandingReport({ limit: 50 }),
        academicApi.getClasses(),
        academicApi.getYears(),
        academicApi.getStudents({ limit: 100, status: 'ACTIVE' }),
      ]);

      if (dashRes.success) setDashboardData(dashRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (structRes.success) setStructures(structRes.data);
      if (assignRes.success) setAssignments(assignRes.data);
      if (reportRes.success) setOutstandingRows(reportRes.data);
      if (classRes.success) setClasses(classRes.data);
      if (yrRes.success) setYears(yrRes.data);
      if (stdRes.success) setStudents(stdRes.data);
    } catch (err) {
      console.error('Failed to load financial data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  // When student selected in payment tab -> fetch their financial profile
  const handlePaymentStudentSelect = async (studentId: string) => {
    setPaymentForm({ ...paymentForm, studentId, feeAssignmentId: '', amount: 0 });
    if (!studentId) {
      setSelectedStudentProfile(null);
      return;
    }
    try {
      const res = await feesApi.getStudentProfile(studentId);
      if (res.success && res.data) {
        setSelectedStudentProfile(res.data);
        if (res.data.assignments.length > 0) {
          const firstAssign = res.data.assignments[0];
          setPaymentForm((prev) => ({
            ...prev,
            feeAssignmentId: firstAssign.id,
            amount: Math.min(
              firstAssign.netPayableAmount - (firstAssign.totalPaidAmount - firstAssign.totalRefundedAmount),
              firstAssign.installments.find((i: any) => i.status !== 'PAID')?.amount || 0
            ),
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Category
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await feesApi.createCategory(categoryForm);
      setIsCategoryModalOpen(false);
      setCategoryForm({ code: '', name: '', description: '' });
      loadFinancialData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create fee category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Structure
  const handleStructureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await feesApi.createStructure(structureForm);
      setIsStructureModalOpen(false);
      loadFinancialData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create fee structure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Fee Assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await feesApi.assignFee(assignForm);
      setIsAssignModalOpen(false);
      loadFinancialData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to assign fee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Discount
  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await feesApi.applyDiscount(discountForm);
      setIsDiscountModalOpen(false);
      loadFinancialData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to apply discount.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await feesApi.collectPayment(paymentForm);
      setSelectedPayment(res.data.payment);
      setSelectedReceipt(res.data.receipt);
      setIsReceiptOpen(true);
      setPaymentForm({
        studentId: '',
        feeAssignmentId: '',
        amount: 0,
        paymentMethod: 'CASH',
        transactionReference: '',
        notes: '',
      });
      setSelectedStudentProfile(null);
      loadFinancialData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to process payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Refund
  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await feesApi.processRefund(refundForm);
      setIsRefundModalOpen(false);
      setRefundForm({ paymentId: '', amount: 0, reason: '' });
      loadFinancialData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to process refund.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadOutstandingCsv = () => {
    window.open(feesApi.downloadOutstandingCsvUrl(), '_blank');
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading financial ledger & billing engine..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-brand-600" />
            <span>Institutional Financial & Fee Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional fee ledger: configure fee structures, schedule term installments, collect payments, issue receipts, and manage scholarship concessions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
            leftIcon={<Tag className="w-4 h-4" />}
          >
            New Fee Category
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStructureModalOpen(true)}
            leftIcon={<Layers className="w-4 h-4" />}
          >
            Create Fee Structure
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('collect')}
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            Collect Payment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Fees Assigned"
          value={`$${(dashboardData?.kpi?.totalAssigned || 0).toLocaleString()}`}
          description="Total gross student fees"
          icon={<DollarSign className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="Total Collected"
          value={`$${(dashboardData?.kpi?.totalCollected || 0).toLocaleString()}`}
          description="Real-time gross collections"
          icon={<CheckCircle className="w-6 h-6" />}
          variant="success"
        />
        <StatCard
          title="Outstanding Balance"
          value={`$${(dashboardData?.kpi?.totalOutstanding || 0).toLocaleString()}`}
          description="Net pending collections"
          icon={<Wallet className="w-6 h-6" />}
          variant="warning"
        />
        <StatCard
          title="Overdue Receivables"
          value={`$${(dashboardData?.kpi?.overdueAmount || 0).toLocaleString()}`}
          description="Lapsed installment dues"
          icon={<AlertCircle className="w-6 h-6" />}
          variant="danger"
        />
      </div>

      {/* Tab Hub */}
      <Card noPadding>
        <div className="flex border-b border-slate-200 px-4 bg-slate-50/70 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-3 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'border-brand-600 text-brand-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Financial Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('collect')}
            className={`py-3 px-3 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'collect'
                ? 'border-brand-600 text-brand-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Collect Payment</span>
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`py-3 px-3 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'structures'
                ? 'border-brand-600 text-brand-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Fee Structures ({structures.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-3 px-3 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'assignments'
                ? 'border-brand-600 text-brand-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Student Fee Assignments</span>
          </button>
          <button
            onClick={() => setActiveTab('discounts')}
            className={`py-3 px-3 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'discounts'
                ? 'border-brand-600 text-brand-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Scholarships & Waivers</span>
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`py-3 px-3 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'refunds'
                ? 'border-brand-600 text-brand-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Undo2 className="w-4 h-4" />
            <span>Refunds & Reversals</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-3 px-3 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'border-brand-600 text-brand-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Outstanding Reports</span>
          </button>
        </div>

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="p-4 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-slate-500 font-semibold text-xs uppercase">Today's Collections</span>
                <h3 className="text-2xl font-bold text-emerald-700">
                  ${(dashboardData?.kpi?.todayCollected || 0).toLocaleString()}
                </h3>
                <p className="text-[11px] text-slate-400">Punched today from campus cashier station</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-slate-500 font-semibold text-xs uppercase">Monthly Collections</span>
                <h3 className="text-2xl font-bold text-brand-700">
                  ${(dashboardData?.kpi?.monthCollected || 0).toLocaleString()}
                </h3>
                <p className="text-[11px] text-slate-400">Total collected in current monthly cycle</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Recent Financial Transactions</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('reports')}>
                  View Full Ledger &rarr;
                </Button>
              </div>

              {dashboardData?.recentTransactions?.length === 0 ? (
                <p className="text-slate-400 py-4 text-center">No payment transactions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                        <th className="p-3">Payment #</th>
                        <th className="p-3">Receipt #</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dashboardData?.recentTransactions?.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="p-3 font-mono font-bold text-brand-700">{p.paymentNumber}</td>
                          <td className="p-3 font-mono text-slate-600">{p.receipt?.receiptNumber || 'N/A'}</td>
                          <td className="p-3 font-medium text-slate-900">
                            {p.student?.user?.firstName} {p.student?.user?.lastName}
                          </td>
                          <td className="p-3">
                            <Badge variant="primary">{p.paymentMethod}</Badge>
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-700">${p.amount.toLocaleString()}</td>
                          <td className="p-3 text-slate-400 font-mono text-[11px]">
                            {new Date(p.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              {p.receipt && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="View Receipt"
                                  onClick={() => {
                                    setSelectedPayment(p);
                                    setSelectedReceipt(p.receipt);
                                    setIsReceiptOpen(true);
                                  }}
                                >
                                  <ReceiptIcon className="w-3.5 h-3.5 text-brand-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Issue Refund"
                                onClick={() => {
                                  setRefundForm({ paymentId: p.id, amount: p.amount, reason: '' });
                                  setIsRefundModalOpen(true);
                                }}
                              >
                                <Undo2 className="w-3.5 h-3.5 text-rose-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COLLECT PAYMENT */}
        {activeTab === 'collect' && (
          <div className="p-4 space-y-4 max-w-2xl mx-auto">
            <div className="bg-brand-50/60 p-4 rounded-xl border border-brand-100 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-brand-600 shrink-0" />
              <div>
                <h3 className="font-bold text-brand-900 text-sm">Fee Collection & Cashier Terminal</h3>
                <p className="text-[11px] text-brand-700">Select active enrolled student to view installment balance and record payment.</p>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <Select
                label="Select Enrolled Student *"
                required
                value={paymentForm.studentId}
                onChange={(e) => handlePaymentStudentSelect(e.target.value)}
                options={[
                  { value: '', label: 'Select Student from Directory' },
                  ...students.map((s) => ({
                    value: s.id,
                    label: `${s.user.firstName} ${s.user.lastName} (${s.admissionNumber}) - ${s.section?.class.name || 'Unassigned'}`,
                  })),
                ]}
              />

              {selectedStudentProfile && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Outstanding Balance:</span>
                    <span className="font-mono font-bold text-rose-700 text-sm">
                      ${selectedStudentProfile.summary.totalOutstanding.toLocaleString()}
                    </span>
                  </div>
                  {selectedStudentProfile.summary.overdueAmount > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-medium">
                      <span>Overdue Installments:</span>
                      <span className="font-mono font-bold">${selectedStudentProfile.summary.overdueAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200">
                    <Select
                      label="Fee Assignment Obligation *"
                      required
                      value={paymentForm.feeAssignmentId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, feeAssignmentId: e.target.value })}
                      options={selectedStudentProfile.assignments.map((a: any) => ({
                        value: a.id,
                        label: `${a.feeStructure.name} (Net: $${a.netPayableAmount} | Paid: $${a.totalPaidAmount})`,
                      }))}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Payment Amount ($) *"
                  type="number"
                  required
                  min={1}
                  value={paymentForm.amount || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                />

                <Select
                  label="Payment Method *"
                  required
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  options={[
                    { value: 'CASH', label: 'Cash (Direct Campus Desk)' },
                    { value: 'UPI', label: 'UPI (GPay / PhonePe / QR)' },
                    { value: 'BANK_TRANSFER', label: 'Bank Wire / NEFT / RTGS' },
                    { value: 'ONLINE', label: 'Online Payment Gateway' },
                    { value: 'CHEQUE', label: 'Bank Cheque / DD' },
                    { value: 'OTHER', label: 'Other' },
                  ]}
                />
              </div>

              <Input
                label="Transaction / Reference Number (Mandatory for UPI/Bank/Online)"
                value={paymentForm.transactionReference}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                placeholder="e.g. UPI-2026-998811 or CHQ-445500"
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Receipt Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Optional receipt notes..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={isSubmitting}
                  className="w-full"
                  disabled={!paymentForm.studentId || !paymentForm.amount || paymentForm.amount <= 0}
                >
                  Confirm Payment & Generate Official Receipt
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: FEE STRUCTURES */}
        {activeTab === 'structures' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700">Configured Academic Fee Structures</span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsStructureModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Create Fee Structure
              </Button>
            </div>

            {structures.length === 0 ? (
              <EmptyState
                title="No Fee Structures"
                description="Create fee structures associated with academic years and classes."
                icon={<Layers className="w-12 h-12 text-slate-300" />}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {structures.map((st) => (
                  <div key={st.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                        <span className="font-mono text-[10px] text-brand-700 font-bold">Code: {st.code}</span>
                      </div>
                      <Badge variant="primary">{st.academicYear?.name || 'Academic Year'}</Badge>
                    </div>

                    <div className="divide-y divide-slate-100 bg-slate-50 p-2.5 rounded-lg text-xs space-y-1.5">
                      {st.items?.map((it) => (
                        <div key={it.id} className="py-1 flex justify-between items-center">
                          <span className="text-slate-700 font-medium">{it.feeCategory?.name}</span>
                          <span className="font-mono font-bold text-slate-900">${it.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500">
                        Total Amount: <strong>${st.items?.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}</strong>
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {st._count?.assignments || 0} Students Assigned
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STUDENT FEE ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700">Enrolled Student Fee Obligations</span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAssignModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Assign Fee Structure
              </Button>
            </div>

            {assignments.length === 0 ? (
              <EmptyState
                title="No Fee Assignments"
                description="Assign fee structures to admitted students."
                icon={<Building2 className="w-12 h-12 text-slate-300" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                      <th className="p-3">Student</th>
                      <th className="p-3">Fee Structure</th>
                      <th className="p-3">Gross Assigned</th>
                      <th className="p-3">Discounts</th>
                      <th className="p-3">Net Payable</th>
                      <th className="p-3">Paid</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">
                            {a.student?.user?.firstName} {a.student?.user?.lastName}
                          </div>
                          <div className="font-mono text-[10px] text-brand-700">{a.student?.admissionNumber}</div>
                        </td>
                        <td className="p-3 font-medium text-slate-700">{a.feeStructure?.name}</td>
                        <td className="p-3 font-mono">${a.totalAssignedAmount.toLocaleString()}</td>
                        <td className="p-3 font-mono text-amber-700">-${a.totalDiscountAmount.toLocaleString()}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">${a.netPayableAmount.toLocaleString()}</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">${a.totalPaidAmount.toLocaleString()}</td>
                        <td className="p-3">
                          <Badge
                            variant={
                              a.status === 'PAID'
                                ? 'success'
                                : a.status === 'PARTIALLY_PAID'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {a.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Apply Scholarship / Discount"
                            onClick={() => {
                              setDiscountForm({
                                feeAssignmentId: a.id,
                                type: 'SCHOLARSHIP',
                                amount: 0,
                                percentage: 0,
                                reason: '',
                              });
                              setIsDiscountModalOpen(true);
                            }}
                          >
                            <Percent className="w-3.5 h-3.5 text-brand-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DISCOUNTS & SCHOLARSHIPS */}
        {activeTab === 'discounts' && (
          <div className="p-4 space-y-4">
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-amber-900 text-xs uppercase">Institutional Scholarships & Concessions</h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Apply fee waivers, merit scholarships, and sibling concessions with mandatory administrative justification.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDiscountModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Apply New Scholarship
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="p-3">Student</th>
                    <th className="p-3">Concession Type</th>
                    <th className="p-3">Concession Amount</th>
                    <th className="p-3">Justification Reason</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments
                    .flatMap((a) => a.discounts || [])
                    .map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-medium text-slate-800">
                          {d.studentId}
                        </td>
                        <td className="p-3">
                          <Badge variant="warning">{d.type}</Badge>
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-700">${d.amount.toLocaleString()}</td>
                        <td className="p-3 text-slate-700 max-w-sm">{d.reason}</td>
                        <td className="p-3">
                          <Badge variant="success">Active</Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: REFUNDS & REVERSALS */}
        {activeTab === 'refunds' && (
          <div className="p-4 space-y-4">
            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200">
              <h4 className="font-bold text-rose-900 text-xs uppercase">Payment Reversals & Refunds Ledger</h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Every refund creates an immutable audit record and automatically reopens outstanding student installment balances.
              </p>
            </div>

            {dashboardData?.recentRefunds?.length === 0 ? (
              <p className="text-slate-400 py-6 text-center">No refund records logged in database.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                      <th className="p-3">Refund #</th>
                      <th className="p-3">Payment Ref</th>
                      <th className="p-3">Refund Amount</th>
                      <th className="p-3">Refund Date</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboardData?.recentRefunds?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-mono font-bold text-rose-700">{r.refundNumber}</td>
                        <td className="p-3 font-mono text-slate-600">{r.paymentId}</td>
                        <td className="p-3 font-mono font-bold text-rose-700">${r.amount.toLocaleString()}</td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {new Date(r.refundDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-slate-700 max-w-sm">{r.reason}</td>
                        <td className="p-3">
                          <Badge variant="danger">{r.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: OUTSTANDING REPORTS */}
        {activeTab === 'reports' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700">Institutional Outstanding Balances & Aging</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadOutstandingCsv}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export Outstanding Report (CSV)
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="p-3">Admission #</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Class & Section</th>
                    <th className="p-3">Net Fee</th>
                    <th className="p-3">Total Paid</th>
                    <th className="p-3">Outstanding</th>
                    <th className="p-3">Overdue</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outstandingRows.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-brand-700">{r.admissionNumber}</td>
                      <td className="p-3 font-medium text-slate-800">{r.studentName}</td>
                      <td className="p-3 text-slate-600">{r.className} - {r.sectionName}</td>
                      <td className="p-3 font-mono">${r.netPayable.toLocaleString()}</td>
                      <td className="p-3 font-mono text-emerald-700">${r.totalPaid.toLocaleString()}</td>
                      <td className="p-3 font-mono font-bold text-rose-700">${r.outstandingBalance.toLocaleString()}</td>
                      <td className="p-3 font-mono text-rose-600 font-bold">${r.overdueAmount.toLocaleString()}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            r.status === 'PAID'
                              ? 'success'
                              : r.status === 'PARTIALLY_PAID'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE CATEGORY MODAL */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Create New Fee Category">
        <form onSubmit={handleCategorySubmit} className="space-y-3 text-xs">
          <Input
            label="Category Code *"
            required
            value={categoryForm.code}
            onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase() })}
            placeholder="e.g. TRANSPORT or SPORTS"
          />
          <Input
            label="Category Name *"
            required
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            placeholder="e.g. Bus Transport Fee"
          />
          <Input
            label="Description"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE FEE STRUCTURE MODAL */}
      <Modal isOpen={isStructureModalOpen} onClose={() => setIsStructureModalOpen(false)} title="Create Fee Structure">
        <form onSubmit={handleStructureSubmit} className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Structure Code *"
              required
              value={structureForm.code}
              onChange={(e) => setStructureForm({ ...structureForm, code: e.target.value })}
            />
            <Input
              label="Structure Name *"
              required
              value={structureForm.name}
              onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
              placeholder="e.g. Grade 10 Standard 2026-27"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Academic Year *"
              required
              value={structureForm.academicYearId}
              onChange={(e) => setStructureForm({ ...structureForm, academicYearId: e.target.value })}
              options={[
                { value: '', label: 'Select Academic Year' },
                ...years.map((y) => ({ value: y.id, label: y.name })),
              ]}
            />
            <Select
              label="Target Class (Optional)"
              value={structureForm.classId}
              onChange={(e) => setStructureForm({ ...structureForm, classId: e.target.value })}
              options={[
                { value: '', label: 'All Classes (General)' },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Fee Category Components</span>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setStructureForm({
                    ...structureForm,
                    items: [...structureForm.items, { feeCategoryId: '', amount: 0, installmentCount: 3 }],
                  })
                }
              >
                + Add Component
              </Button>
            </div>

            {structureForm.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2 items-center pt-1">
                <Select
                  value={item.feeCategoryId}
                  onChange={(e) => {
                    const newItems = [...structureForm.items];
                    newItems[idx].feeCategoryId = e.target.value;
                    setStructureForm({ ...structureForm, items: newItems });
                  }}
                  options={[
                    { value: '', label: 'Select Category' },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Amount ($)"
                  value={item.amount || ''}
                  onChange={(e) => {
                    const newItems = [...structureForm.items];
                    newItems[idx].amount = Number(e.target.value);
                    setStructureForm({ ...structureForm, items: newItems });
                  }}
                />
                <Input
                  type="number"
                  min={1}
                  max={12}
                  placeholder="Installments (e.g. 3)"
                  value={item.installmentCount || ''}
                  onChange={(e) => {
                    const newItems = [...structureForm.items];
                    newItems[idx].installmentCount = Number(e.target.value);
                    setStructureForm({ ...structureForm, items: newItems });
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsStructureModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Fee Structure
            </Button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN FEE STRUCTURE MODAL */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Fee Structure to Student">
        <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
          <Select
            label="Select Enrolled Student *"
            required
            value={assignForm.studentId}
            onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
            options={[
              { value: '', label: 'Select Student' },
              ...students.map((s) => ({
                value: s.id,
                label: `${s.user.firstName} ${s.user.lastName} (${s.admissionNumber})`,
              })),
            ]}
          />

          <Select
            label="Select Fee Structure *"
            required
            value={assignForm.feeStructureId}
            onChange={(e) => setAssignForm({ ...assignForm, feeStructureId: e.target.value })}
            options={[
              { value: '', label: 'Select Fee Structure' },
              ...structures.map((st) => ({
                value: st.id,
                label: `${st.name} ($${st.items?.reduce((s, i) => s + i.amount, 0)})`,
              })),
            ]}
          />

          <Input
            label="Installments Count (Default: 3)"
            type="number"
            min={1}
            max={12}
            value={assignForm.customInstallments}
            onChange={(e) => setAssignForm({ ...assignForm, customInstallments: Number(e.target.value) })}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Assign Fee & Generate Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* APPLY DISCOUNT MODAL */}
      <Modal isOpen={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} title="Apply Scholarship / Concession">
        <form onSubmit={handleDiscountSubmit} className="space-y-3 text-xs">
          <Select
            label="Discount / Concession Type *"
            required
            value={discountForm.type}
            onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value })}
            options={[
              { value: 'SCHOLARSHIP', label: 'Merit Scholarship' },
              { value: 'CONCESSION', label: 'Sibling / Staff Concession' },
              { value: 'WAIVER', label: 'Management Approved Waiver' },
              { value: 'FIXED_AMOUNT', label: 'Fixed Amount Deduction' },
              { value: 'PERCENTAGE', label: 'Percentage Waiver (%)' },
            ]}
          />

          {discountForm.type === 'PERCENTAGE' ? (
            <Input
              label="Percentage Deduction (%) *"
              type="number"
              min={1}
              max={100}
              required
              value={discountForm.percentage || ''}
              onChange={(e) => setDiscountForm({ ...discountForm, percentage: Number(e.target.value) })}
            />
          ) : (
            <Input
              label="Concession Amount ($) *"
              type="number"
              min={1}
              required
              value={discountForm.amount || ''}
              onChange={(e) => setDiscountForm({ ...discountForm, amount: Number(e.target.value) })}
            />
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Administrative Justification *</label>
            <textarea
              rows={2}
              required
              value={discountForm.reason}
              onChange={(e) => setDiscountForm({ ...discountForm, reason: e.target.value })}
              placeholder="State institutional reason or scholarship scheme..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsDiscountModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Apply & Recalculate Ledger
            </Button>
          </div>
        </form>
      </Modal>

      {/* REFUND MODAL */}
      <Modal isOpen={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)} title="Issue Payment Refund">
        <form onSubmit={handleRefundSubmit} className="space-y-3 text-xs">
          <Input
            label="Refund Amount ($) *"
            type="number"
            min={1}
            required
            value={refundForm.amount || ''}
            onChange={(e) => setRefundForm({ ...refundForm, amount: Number(e.target.value) })}
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Refund Reason *</label>
            <textarea
              rows={2}
              required
              value={refundForm.reason}
              onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
              placeholder="Official reason for reversal or refund..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsRefundModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" isLoading={isSubmitting}>
              Process Refund & Adjust Balances
            </Button>
          </div>
        </form>
      </Modal>

      {/* RECEIPT MODAL */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
        payment={selectedPayment}
      />
    </div>
  );
};

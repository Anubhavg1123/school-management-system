import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Payment, Receipt } from '../../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt?: Receipt | null;
  payment?: Payment | null;
  studentName?: string;
  admissionNumber?: string;
  className?: string;
  sectionName?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  payment,
  studentName,
  admissionNumber,
  className,
  sectionName,
}) => {
  const handlePrint = () => {
    window.print();
  };

  if (!receipt && !payment) return null;

  const receiptNo = receipt?.receiptNumber || payment?.receipt?.receiptNumber || 'RCP-PENDING';
  const payDate = receipt?.issuedDate || payment?.paymentDate || new Date().toISOString();
  const amountPaid = receipt?.amountPaid || payment?.amount || 0;
  const remainingBalance = receipt?.totalRemainingBalance ?? 0;
  const payMethod = payment?.paymentMethod || 'DIRECT';
  const txnRef = payment?.transactionReference || 'N/A';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Fee Payment Receipt">
      <div className="space-y-4 text-xs">
        {/* Printable Paper Card */}
        <div id="printable-receipt" className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-brand-700 rounded-lg flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-wide">ST. LAWRENCE ACADEMY</h3>
                <p className="text-[10px] text-slate-500">Official Institutional Fee Receipt</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-brand-700 text-xs">{receiptNo}</span>
              <p className="text-[10px] text-slate-400 font-mono">Date: {new Date(payDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Student Demographics */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-400 text-[10px] uppercase">Student Name</span>
              <p className="font-bold text-slate-800">{studentName || payment?.student?.user?.firstName + ' ' + payment?.student?.user?.lastName || 'Enrolled Student'}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase">Admission Number</span>
              <p className="font-mono font-bold text-brand-700">{admissionNumber || payment?.student?.admissionNumber || 'ADM-RECORD'}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase">Class & Section</span>
              <p className="font-medium text-slate-700">{className ? `${className} - ${sectionName || ''}` : 'Standard Class'}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase">Payment Method</span>
              <p className="font-semibold text-emerald-700">{payMethod} {txnRef !== 'N/A' && `(${txnRef})`}</p>
            </div>
          </div>

          {/* Itemized summary */}
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase">
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-right">Amount ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 font-medium text-slate-800">Fee Installment Settle Amount</td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">${amountPaid.toLocaleString()}</td>
                </tr>
                <tr className="bg-emerald-50/50 font-bold">
                  <td className="p-2.5 text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Total Amount Paid</span>
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-800 text-sm">${amountPaid.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Outstanding Balance Footer */}
          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <span className="text-slate-600 font-medium">Remaining Outstanding Balance:</span>
            <span className="font-mono font-bold text-rose-700">${remainingBalance.toLocaleString()}</span>
          </div>

          <div className="text-[10px] text-slate-400 text-center italic">
            This is a system-generated authentic financial record. Authorized by Academic Accounts Office.
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
            Print Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
};

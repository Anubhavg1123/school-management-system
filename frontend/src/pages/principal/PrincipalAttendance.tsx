import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendance';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { CalendarCheck, RefreshCw } from 'lucide-react';
import { AttendanceRecord } from '../../types';

export const PrincipalAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await attendanceApi.getRecords({
        date: dateFilter || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });

      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [dateFilter, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success">Present</Badge>;
      case 'LATE':
        return <Badge variant="warning">Late Arrival</Badge>;
      case 'ABSENT':
        return <Badge variant="danger">Absent</Badge>;
      case 'HALF_DAY':
        return <Badge variant="info">Half Day</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand-600" />
            <span>Campus Attendance Records</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time biometric, kiosk, and web check-in logs with late-arrival calculations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchRecords}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Records
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Filter Date</label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
            <Select
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'PRESENT', label: 'Present' },
                { value: 'LATE', label: 'Late Arrival' },
                { value: 'HALF_DAY', label: 'Half Day' },
                { value: 'ABSENT', label: 'Absent' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card noPadding>
        {isLoading ? (
          <LoadingSpinner size="lg" label="Loading Attendance Logs..." />
        ) : records.length === 0 ? (
          <EmptyState
            title="No Attendance Records"
            description="No check-in/check-out records match your filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Check-In Time</th>
                  <th className="px-6 py-3.5">Check-Out Time</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Source / Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      {r.user ? (
                        <div>
                          <div className="font-semibold text-slate-900">
                            {r.user.firstName} {r.user.lastName}
                          </div>
                          <div className="text-slate-500 text-[11px]">{r.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">User #{r.userId?.slice(-6) || 'N/A'}</span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono font-medium text-slate-700">{r.date}</td>

                    <td className="px-6 py-4">
                      {r.checkInTime ? (
                        <span className="font-mono text-slate-800">
                          {new Date(r.checkInTime).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {r.checkOutTime ? (
                        <span className="font-mono text-slate-800">
                          {new Date(r.checkOutTime).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(r.status)}
                        {(r.lateMinutes || 0) > 0 && (
                          <span className="text-[10px] text-amber-600 font-semibold">
                            +{r.lateMinutes}m late
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      <Badge variant="secondary">{r.source}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

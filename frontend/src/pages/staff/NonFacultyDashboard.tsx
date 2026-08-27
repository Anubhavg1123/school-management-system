import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi } from '../../api/attendance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { QrCode, Clock, CheckCircle, ShieldCheck, User } from 'lucide-react';

export const NonFacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [todayRes, histRes] = await Promise.all([
        attendanceApi.getTodayStatus(),
        attendanceApi.getMyRecords(),
      ]);

      if (todayRes.success) setTodayAttendance(todayRes.data);
      if (histRes.success && histRes.data) setHistory(histRes.data.slice(0, 7));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckIn = async () => {
    setIsPunching(true);
    setMessage(null);
    try {
      await attendanceApi.checkIn({ source: 'WEB' });
      setMessage('✅ Check-In recorded successfully for today!');
      loadData();
    } catch (err: any) {
      setMessage(`❌ ${err.response?.data?.error?.message || 'Check-in failed.'}`);
    } finally {
      setIsPunching(false);
    }
  };

  const handleCheckOut = async () => {
    setIsPunching(true);
    setMessage(null);
    try {
      await attendanceApi.checkOut({ source: 'WEB' });
      setMessage('✅ Check-Out recorded successfully. Have a safe journey home!');
      loadData();
    } catch (err: any) {
      setMessage(`❌ ${err.response?.data?.error?.message || 'Check-out failed.'}`);
    } finally {
      setIsPunching(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading Staff Station..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Welcome banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center gap-4 shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center font-bold text-xl text-white shrink-0 shadow-md">
          {user?.firstName?.[0] || 'S'}
        </div>
        <div>
          <h1 className="text-xl font-bold">
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" /> Non-Faculty Staff Member
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-slate-800 text-white font-medium text-xs border border-slate-700 shadow-md">
          {message}
        </div>
      )}

      {/* Ultra-simplified 1-Tap Punch Box */}
      <Card title="Today's Shift Attendance" headerIcon={<Clock className="w-5 h-5" />}>
        <div className="text-center py-6 space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 max-w-sm mx-auto">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Status</p>
            {todayAttendance?.checkInTime ? (
              <div className="mt-1">
                <span className="text-lg font-bold text-emerald-600 flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-5 h-5" /> Checked In
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Time: {new Date(todayAttendance.checkInTime).toLocaleTimeString()}
                </p>
                {todayAttendance.checkOutTime && (
                  <p className="text-xs text-slate-500">
                    Out: {new Date(todayAttendance.checkOutTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-base font-bold text-slate-700 mt-1">Not Checked In Yet</p>
            )}
          </div>

          <div className="max-w-sm mx-auto">
            {!todayAttendance?.checkInTime ? (
              <Button
                variant="success"
                size="lg"
                className="w-full py-4 text-base font-bold shadow-lg"
                onClick={handleCheckIn}
                isLoading={isPunching}
                leftIcon={<QrCode className="w-6 h-6" />}
              >
                Tap to Check In (Arrival)
              </Button>
            ) : !todayAttendance?.checkOutTime ? (
              <Button
                variant="danger"
                size="lg"
                className="w-full py-4 text-base font-bold shadow-lg"
                onClick={handleCheckOut}
                isLoading={isPunching}
                leftIcon={<Clock className="w-6 h-6" />}
              >
                Tap to Check Out (Departure)
              </Button>
            ) : (
              <div className="p-4 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-sm">
                Duty completed for today. Thank you!
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Recent punches */}
      <Card title="Your Recent Punch History" headerIcon={<Clock className="w-5 h-5" />} noPadding>
        {history.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">No punch records found.</div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {history.map((h) => (
              <div key={h.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">{h.date}</span>
                  <span className="ml-2 text-slate-500 font-mono text-[11px]">
                    In: {h.checkInTime ? new Date(h.checkInTime).toLocaleTimeString() : '—'}
                  </span>
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

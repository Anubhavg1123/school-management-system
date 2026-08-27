import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi } from '../../api/attendance';
import { nonFacultyApi, NonFacultyDashboardData } from '../../api/nonFaculty';
import {
  Clock,
  CheckCircle,
  Truck,
  ShieldCheck,
  UserCheck,
  Wrench,
  Loader2,
  AlertCircle,
  Bell,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const NonFacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<NonFacultyDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [punching, setPunching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await nonFacultyApi.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load operational dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setPunching(true);
      setError(null);
      await attendanceApi.checkIn({ source: 'WEB' });
      fetchDashboard();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Check-in failed');
    } finally {
      setPunching(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setPunching(true);
      setError(null);
      await attendanceApi.checkOut({ source: 'WEB' });
      fetchDashboard();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Check-out failed');
    } finally {
      setPunching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-gray-600 font-bold text-lg">Loading Staff Hub...</p>
      </div>
    );
  }

  const jobTitle = data?.user?.jobTitle || user?.userCategory || 'STAFF';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* High-Contrast Mobile Banner */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-6 rounded-2xl shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Good Day, {data?.user?.name}</h1>
            <p className="text-indigo-200 text-sm font-semibold mt-1">
              Role: <span className="text-white uppercase font-bold">{jobTitle}</span> | Code: {data?.user?.employeeCode}
            </p>
          </div>
          <div className="hidden sm:flex p-3 bg-white/10 rounded-xl">
            <Clock className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded-r-xl flex items-center justify-between text-red-900 font-bold text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs uppercase font-extrabold">
            Dismiss
          </button>
        </div>
      )}

      {/* TODAY'S ATTENDANCE PUNCH STATION (LARGE TOUCH TARGETS) */}
      <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Today's Attendance Status
          </h2>
          <span className="text-xs font-mono font-bold text-gray-500">{data?.todayDate}</span>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center space-y-3">
          {data?.attendanceStatus?.checkInTime ? (
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-extrabold bg-emerald-100 text-emerald-800">
                <CheckCircle className="w-4 h-4" /> Checked In at{' '}
                {new Date(data.attendanceStatus.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {data.attendanceStatus.checkOutTime && (
                <div className="text-xs font-bold text-gray-600 mt-1">
                  Checked Out at {new Date(data.attendanceStatus.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          ) : (
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-extrabold bg-amber-100 text-amber-900">
              Not Checked In Today
            </span>
          )}

          {/* LARGE TOUCH PUNCH BUTTONS */}
          <div className="pt-2">
            {!data?.attendanceStatus?.checkInTime ? (
              <button
                onClick={handleCheckIn}
                disabled={punching}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {punching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Clock className="w-6 h-6" />}
                PUNCH CHECK-IN
              </button>
            ) : !data?.attendanceStatus?.checkOutTime ? (
              <button
                onClick={handleCheckOut}
                disabled={punching}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {punching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Clock className="w-6 h-6" />}
                PUNCH CHECK-OUT
              </button>
            ) : (
              <div className="p-3 bg-emerald-50 text-emerald-800 font-extrabold rounded-xl border border-emerald-200 text-center">
                Today's Work Shift Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROLE-BASED QUICK ACTION CARDS (LARGE TOUCH BUTTONS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* DRIVER PORTAL CARD */}
        {(jobTitle.includes('DRIVER') || user?.activeRole === 'SUPER_ADMIN') && (
          <Link
            to="/non-faculty/driver"
            className="p-6 bg-white hover:bg-indigo-50 border-2 border-indigo-200 hover:border-indigo-500 rounded-2xl shadow-sm transition-all flex items-center gap-4 group"
          >
            <div className="p-4 bg-indigo-100 text-indigo-700 rounded-2xl group-hover:scale-105 transition-transform">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Driver Portal</h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Daily KM Logs, Fuel & Garage Maintenance</p>
            </div>
          </Link>
        )}

        {/* SECURITY PORTAL CARD */}
        {(jobTitle.includes('SECURITY') || user?.activeRole === 'SUPER_ADMIN') && (
          <Link
            to="/non-faculty/security"
            className="p-6 bg-white hover:bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-500 rounded-2xl shadow-sm transition-all flex items-center gap-4 group"
          >
            <div className="p-4 bg-emerald-100 text-emerald-700 rounded-2xl group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Security Command</h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Visitor Passes, Active Campus Logs & Vehicle Verification</p>
            </div>
          </Link>
        )}

        {/* ATTENDER PORTAL CARD */}
        {(jobTitle.includes('ATTENDER') || user?.activeRole === 'SUPER_ADMIN') && (
          <Link
            to="/non-faculty/attender"
            className="p-6 bg-white hover:bg-amber-50 border-2 border-amber-200 hover:border-amber-500 rounded-2xl shadow-sm transition-all flex items-center gap-4 group"
          >
            <div className="p-4 bg-amber-100 text-amber-700 rounded-2xl group-hover:scale-105 transition-transform">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Attender Hub</h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Assisted Attendance Entry & Staff Roster</p>
            </div>
          </Link>
        )}

        {/* FLEET MANAGEMENT CARD (ADMIN / OFFICER) */}
        {(user?.activeRole === 'SUPER_ADMIN' || user?.activeRole === 'OFFICE_ADMIN') && (
          <Link
            to="/non-faculty/fleet"
            className="p-6 bg-white hover:bg-purple-50 border-2 border-purple-200 hover:border-purple-500 rounded-2xl shadow-sm transition-all flex items-center gap-4 group"
          >
            <div className="p-4 bg-purple-100 text-purple-700 rounded-2xl group-hover:scale-105 transition-transform">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Fleet Management</h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Vehicle Master, Driver Assignments & Fleet Reports</p>
            </div>
          </Link>
        )}
      </div>

      {/* ASSIGNED VEHICLE QUICK CARD (IF DRIVER) */}
      {data?.assignedVehicle && (
        <div className="bg-indigo-50 border-2 border-indigo-200 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-7 h-7 text-indigo-700 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold uppercase text-indigo-800 tracking-wider">Assigned Vehicle</span>
              <h3 className="text-lg font-black font-mono text-indigo-950">{data.assignedVehicle.registrationNumber}</h3>
              <p className="text-xs text-indigo-700 font-medium">{data.assignedVehicle.makeModel || data.assignedVehicle.type}</p>
            </div>
          </div>
          <Link
            to="/non-faculty/driver"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-sm"
          >
            Log KM / Fuel
          </Link>
        </div>
      )}
    </div>
  );
};

export default NonFacultyDashboard;

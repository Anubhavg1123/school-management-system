import React, { useState, useEffect } from 'react';
import { smartCampusApi, PreRegisteredVisitor } from '../../api/smartCampus';

export const SmartCampusOperations: React.FC = () => {
  const [occupancy, setOccupancy] = useState<any>(null);
  const [vehicleAlerts, setVehicleAlerts] = useState<any>(null);
  const [preRegVisitors, setPreRegVisitors] = useState<PreRegisteredVisitor[]>([]);
  const [loading, setLoading] = useState(true);

  // Pre-registration form state
  const [visitorName, setVisitorName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [expectedDate, setExpectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('Official Meeting');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [occRes, alertsRes, preRegRes] = await Promise.all([
        smartCampusApi.getLiveOccupancy(),
        smartCampusApi.getVehicleAlerts(),
        smartCampusApi.getPreRegisteredVisitors(),
      ]);
      setOccupancy(occRes.data);
      setVehicleAlerts(alertsRes.data);
      setPreRegVisitors(preRegRes.data.records);
    } catch (err) {
      console.error('Failed to load campus operations data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !contactNumber.trim()) return;

    setRegistering(true);
    try {
      await smartCampusApi.preRegisterVisitor({
        visitorFullName: visitorName,
        contactNumber,
        expectedDate,
        purpose,
      });
      setVisitorName('');
      setContactNumber('');
      loadData();
      alert('Visitor pre-registered successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to pre-register visitor.');
    } finally {
      setRegistering(false);
    }
  };

  const handleFastTrackCheckIn = async (id: string) => {
    if (!window.confirm('Check in this pre-registered visitor at the security gate?')) return;
    try {
      await smartCampusApi.checkInVisitor(id);
      loadData();
      alert('Visitor checked in successfully.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Check-in failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🏫</span> Smart Campus Operations & Facility Center
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Live campus occupancy tracking, visitor pre-registration, and vehicle compliance monitoring.
        </p>
      </div>

      {/* Live Campus Occupancy Grid */}
      {occupancy && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Visitors Inside Campus</div>
            <div className="text-3xl font-bold text-indigo-600 mt-2">{occupancy.visitorsInside}</div>
            <div className="text-xs text-gray-400 mt-1">Live active gate passes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Vehicles on Campus</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{occupancy.vehiclesInside}</div>
            <div className="text-xs text-gray-400 mt-1">Tracked fleet & visitor vehicles</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Staff Present Today</div>
            <div className="text-3xl font-bold text-emerald-600 mt-2">{occupancy.staffPresentToday}</div>
            <div className="text-xs text-gray-400 mt-1">Biometric / manual check-ins</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active Emergency Alerts</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{occupancy.activeEmergencyAlerts}</div>
            <div className="text-xs text-gray-400 mt-1">Dispatched alerts in effect</div>
          </div>
        </div>
      )}

      {/* Vehicle Compliance & Document Expiry Alerts */}
      {vehicleAlerts && vehicleAlerts.alerts?.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-3">
            <span>⚠️</span> Vehicle Document Expiry Alerts ({vehicleAlerts.totalAlerts})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vehicleAlerts.alerts.map((al: any, i: number) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-amber-200 text-xs">
                <div className="flex justify-between font-bold">
                  <span>
                    🚗 {al.vehicleNumber} ({al.driverName})
                  </span>
                  <span className="text-red-600">{al.daysRemaining < 0 ? 'EXPIRED' : `${al.daysRemaining} days left`}</span>
                </div>
                <div className="text-gray-500 mt-1">
                  <strong>Document:</strong> {al.documentType} | <strong>Expires:</strong> {al.expiryDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visitor Pre-Registration Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📋</span> Pre-Register Expected Campus Visitor
        </h2>

        <form onSubmit={handlePreRegister} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Visitor Full Name</label>
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="e.g. Dr. Jane Goodall"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs bg-white dark:bg-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="+919876543210"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs bg-white dark:bg-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Expected Date</label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs bg-white dark:bg-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Purpose of Visit</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Guest Lecture"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs bg-white dark:bg-gray-700"
              required
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={registering}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition"
            >
              {registering ? 'Pre-Registering...' : 'Submit Pre-Registration'}
            </button>
          </div>
        </form>
      </div>

      {/* Pre-Registered Visitors Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Pre-Registered Visitors Roster & Gate Check-In
        </h2>

        {loading ? (
          <div className="text-center py-6 text-gray-500">Loading pre-registered visitors...</div>
        ) : preRegVisitors.length === 0 ? (
          <div className="text-center py-6 text-gray-500">No pre-registered visitors found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Pass #</th>
                  <th className="px-4 py-3">Visitor Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Host Staff</th>
                  <th className="px-4 py-3">Expected Date</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Security Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {preRegVisitors.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{v.securityPassNumber}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{v.visitorFullName}</td>
                    <td className="px-4 py-3 font-mono">{v.contactNumber}</td>
                    <td className="px-4 py-3">
                      {v.hostUser ? `${v.hostUser.firstName} ${v.hostUser.lastName}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono">{v.expectedDate}</td>
                    <td className="px-4 py-3">{v.purpose}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs ${
                          v.status === 'ARRIVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {v.status === 'PENDING_ARRIVAL' && (
                        <button
                          onClick={() => handleFastTrackCheckIn(v.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

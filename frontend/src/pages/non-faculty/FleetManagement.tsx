import { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  UserCheck,
  FileText,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
} from 'lucide-react';
import { vehicleApi, VehicleItem } from '../../api/vehicle';
import { nonFacultyApi } from '../../api/nonFaculty';

export const FleetManagement: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [search, setSearch] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // New Vehicle Form Modal State
  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);
  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: '',
    vehicleType: 'BUS',
    makeModel: '',
    color: 'Yellow',
    fuelType: 'DIESEL',
    capacity: 40,
    ownerType: 'INSTITUTION',
  });

  // Assign Driver Modal State
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleItem | null>(null);
  const [staffDrivers, setStaffDrivers] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  useEffect(() => {
    fetchFleetData();
  }, []);

  const fetchFleetData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vList, rData, attData] = await Promise.all([
        vehicleApi.getVehicles(),
        vehicleApi.getFleetReports(),
        nonFacultyApi.getAttenderDashboard(),
      ]);

      setVehicles(vList || []);
      setReports(rData);

      // Filter drivers from staff roster
      const drivers = (attData?.roster || []).filter((s: any) =>
        s.jobTitle.toUpperCase().includes('DRIVER')
      );
      setStaffDrivers(drivers);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load fleet data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await vehicleApi.createVehicle(vehicleForm);
      setSuccessMsg(`Vehicle ${vehicleForm.registrationNumber} registered in Fleet Master.`);
      setShowVehicleModal(false);
      fetchFleetData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to register vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedDriverId) return;
    try {
      setSubmitting(true);
      setError(null);
      await vehicleApi.assignDriver(selectedVehicle.id, selectedDriverId, 'Assigned by fleet officer');
      setSuccessMsg('Driver assigned to vehicle successfully.');
      setShowAssignModal(false);
      fetchFleetData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to assign driver.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading institutional fleet management...</p>
      </div>
    );
  }

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (v.makeModel && v.makeModel.toLowerCase().includes(search.toLowerCase())) ||
      v.vehicleType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-purple-600" />
            Institutional Fleet & Transport Command
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage school buses, vans, drivers, odometer histories, fuel logs, and maintenance records.
          </p>
        </div>

        <button
          onClick={() => setShowVehicleModal(true)}
          className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Register New Vehicle
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Fleet KPI Reports */}
      {reports && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase">Total Fleet</span>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{reports.summary.totalVehicles}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center shadow-sm">
            <span className="text-xs font-bold text-emerald-700 uppercase">Active</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{reports.summary.activeVehicles}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 text-center shadow-sm">
            <span className="text-xs font-bold text-indigo-700 uppercase">Total KM Logged</span>
            <p className="text-2xl font-extrabold text-indigo-700 mt-1">{reports.summary.totalKmLogged} KM</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center shadow-sm">
            <span className="text-xs font-bold text-purple-800 uppercase">Fuel Expenditure</span>
            <p className="text-2xl font-extrabold text-purple-800 mt-1">₹{reports.summary.totalFuelCost}</p>
          </div>
        </div>
      )}

      {/* Expiry Alerts Banner */}
      {reports?.expiringDocumentsCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-extrabold text-amber-900">Document Expiry Alert</h4>
              <p className="text-xs text-amber-800 font-medium">
                {reports.expiringDocumentsCount} vehicle(s) have insurance/fitness/permit expiries in the next 30 days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search fleet by registration number, make/model, type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>

      {/* Fleet Vehicles Table / Cards */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {filteredVehicles.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-medium">No vehicles registered in fleet master.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredVehicles.map((v) => (
              <div key={v.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-gray-900">{v.registrationNumber}</span>
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 text-xs font-mono font-bold rounded-full">
                      {v.vehicleType}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        v.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 font-medium">
                    Model: {v.makeModel || 'N/A'} | Capacity: {v.capacity} seats | Fuel: {v.fuelType}
                  </div>

                  <div className="text-xs text-purple-700 font-bold">
                    Assigned Driver:{' '}
                    {v.assignedDriver
                      ? `${v.assignedDriver.user.firstName} ${v.assignedDriver.user.lastName} (${v.assignedDriver.employeeCode})`
                      : 'Unassigned'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedVehicle(v);
                      setShowAssignModal(true);
                    }}
                    className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" /> Assign Driver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REGISTER NEW VEHICLE MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-purple-600" /> Register Vehicle in Fleet Master
            </h2>
            <form onSubmit={handleCreateVehicle} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Registration Number (Plate #)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-BUS-2026"
                  value={vehicleForm.registrationNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 font-mono uppercase font-bold text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 font-semibold"
                  >
                    <option value="BUS">SCHOOL BUS</option>
                    <option value="VAN">STAFF / STUDENT VAN</option>
                    <option value="CAR">INSTITUTION CAR</option>
                    <option value="AMBULANCE">AMBULANCE</option>
                    <option value="TRUCK">MAINTENANCE TRUCK</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fuel Type</label>
                  <select
                    value={vehicleForm.fuelType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
                  >
                    <option value="DIESEL">DIESEL</option>
                    <option value="PETROL">PETROL</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">ELECTRIC (EV)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Make & Model</label>
                <input
                  type="text"
                  placeholder="e.g. Ashok Leyland Sunshine 50S"
                  value={vehicleForm.makeModel}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, makeModel: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 text-white font-extrabold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN DRIVER MODAL */}
      {showAssignModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              Assign Driver to {selectedVehicle.registrationNumber}
            </h2>
            <form onSubmit={handleAssignDriver} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Driver Staff</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 font-semibold"
                >
                  <option value="">-- Choose Driver --</option>
                  {staffDrivers.map((d: any) => (
                    <option key={d.userId} value={d.userId}>
                      {d.name} ({d.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedDriverId}
                  className="px-5 py-2 bg-indigo-600 text-white font-extrabold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Driver Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;

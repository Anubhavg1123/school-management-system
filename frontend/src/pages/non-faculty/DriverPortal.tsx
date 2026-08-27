import React, { useState, useEffect } from 'react';
import {
  Truck,
  Fuel,
  Wrench,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  History,
} from 'lucide-react';
import { vehicleApi, VehicleItem } from '../../api/vehicle';
import { nonFacultyApi } from '../../api/nonFaculty';

export const DriverPortal: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'KM_LOG' | 'FUEL' | 'MAINTENANCE'>('KM_LOG');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Daily KM Form State
  const [kmForm, setKmForm] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    startingKm: 0,
    endingKm: 0,
    purpose: 'Institutional Route Transport',
    route: '',
    remarks: '',
  });

  // Fuel Form State
  const [fuelForm, setFuelForm] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    fuelType: 'DIESEL',
    quantity: 0,
    pricePerUnit: 92.5,
    odometerReading: 0,
    fuelStation: '',
    receiptNumber: '',
    remarks: '',
  });

  // Maintenance Form State
  const [maintForm, setMaintForm] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    problem: '',
    garageVendor: '',
    estimatedCost: 0,
    odometerReading: 0,
    remarks: '',
  });

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, vehicleList] = await Promise.all([
        nonFacultyApi.getDashboard(),
        vehicleApi.getVehicles(),
      ]);

      setVehicles(vehicleList || []);

      if (dashRes.assignedVehicle) {
        setAssignedVehicle(dashRes.assignedVehicle);
        setKmForm((prev) => ({ ...prev, vehicleId: dashRes.assignedVehicle!.id }));
        setFuelForm((prev) => ({ ...prev, vehicleId: dashRes.assignedVehicle!.id }));
        setMaintForm((prev) => ({ ...prev, vehicleId: dashRes.assignedVehicle!.id }));
      } else if (vehicleList.length > 0) {
        setKmForm((prev) => ({ ...prev, vehicleId: vehicleList[0].id }));
        setFuelForm((prev) => ({ ...prev, vehicleId: vehicleList[0].id }));
        setMaintForm((prev) => ({ ...prev, vehicleId: vehicleList[0].id }));
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load driver vehicle data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordKm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await vehicleApi.recordKmLog(kmForm);
      setSuccessMsg(`Recorded ${kmForm.endingKm - kmForm.startingKm} KM log successfully!`);
      fetchDriverData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to record daily KM log.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await vehicleApi.recordFuel(fuelForm);
      setSuccessMsg(`Fuel entry recorded successfully! Total: ₹${(fuelForm.quantity * fuelForm.pricePerUnit).toFixed(2)}`);
      fetchDriverData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to record fuel log.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await vehicleApi.createMaintenance(maintForm);
      setSuccessMsg('Garage maintenance request logged successfully!');
      fetchDriverData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit maintenance request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading driver portal...</p>
      </div>
    );
  }

  const calculatedTotalKm = kmForm.endingKm >= kmForm.startingKm ? kmForm.endingKm - kmForm.startingKm : 0;
  const calculatedFuelTotal = Number((fuelForm.quantity * fuelForm.pricePerUnit).toFixed(2));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-indigo-600" />
            Driver Vehicle Operations Hub
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Record daily trip odometer KM readings, log fuel receipts, and report vehicle garage maintenance requests.
          </p>
        </div>

        {assignedVehicle && (
          <div className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl font-mono text-xs font-bold text-indigo-900">
            Assigned: <span className="text-indigo-600 font-black">{assignedVehicle.registrationNumber}</span>
          </div>
        )}
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

      {/* Action Tabs */}
      <div className="border-b border-gray-200 flex gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('KM_LOG')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'KM_LOG'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Truck className="w-4 h-4" /> Record Daily KM
        </button>
        <button
          onClick={() => setActiveTab('FUEL')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'FUEL'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Fuel className="w-4 h-4 text-emerald-600" /> Log Fuel Receipt
        </button>
        <button
          onClick={() => setActiveTab('MAINTENANCE')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'MAINTENANCE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-600" /> Report Maintenance
        </button>
      </div>

      {/* TAB 1: DAILY KM FORM */}
      {activeTab === 'KM_LOG' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Daily Odometer KM Entry</h2>
          <form onSubmit={handleRecordKm} className="space-y-4 text-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Select Vehicle</label>
              <select
                value={kmForm.vehicleId}
                onChange={(e) => setKmForm({ ...kmForm, vehicleId: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 font-semibold text-base"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.makeModel || v.vehicleType}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={kmForm.date}
                  onChange={(e) => setKmForm({ ...kmForm, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3 text-base"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Route / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Route 4 Pickup"
                  value={kmForm.route}
                  onChange={(e) => setKmForm({ ...kmForm, route: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Starting Odometer KM</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={kmForm.startingKm}
                  onChange={(e) => setKmForm({ ...kmForm, startingKm: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-xl p-3 font-mono font-bold text-base"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Ending Odometer KM</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={kmForm.endingKm}
                  onChange={(e) => setKmForm({ ...kmForm, endingKm: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-xl p-3 font-mono font-bold text-base"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Total Distance Calculated</label>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center font-extrabold text-indigo-700 text-lg">
                  {calculatedTotalKm} KM
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Save Daily KM Log
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: FUEL LOG FORM */}
      {activeTab === 'FUEL' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Log Fuel Station Purchase</h2>
          <form onSubmit={handleRecordFuel} className="space-y-4 text-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Select Vehicle</label>
              <select
                value={fuelForm.vehicleId}
                onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 font-semibold text-base"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.makeModel || v.vehicleType}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Quantity (Liters / kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0.1}
                  value={fuelForm.quantity}
                  onChange={(e) => setFuelForm({ ...fuelForm, quantity: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-xl p-3 font-mono font-bold text-base"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Price Per Unit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0}
                  value={fuelForm.pricePerUnit}
                  onChange={(e) => setFuelForm({ ...fuelForm, pricePerUnit: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-xl p-3 font-mono font-bold text-base"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Calculated Total Cost</label>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center font-extrabold text-emerald-800 text-lg">
                  ₹{calculatedFuelTotal}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Odometer Reading (KM)</label>
                <input
                  type="number"
                  required
                  value={fuelForm.odometerReading}
                  onChange={(e) => setFuelForm({ ...fuelForm, odometerReading: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-xl p-3 text-base font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Fuel Station & Receipt #</label>
                <input
                  type="text"
                  placeholder="e.g. Shell Outlet / Receipt #88"
                  value={fuelForm.receiptNumber}
                  onChange={(e) => setFuelForm({ ...fuelForm, receiptNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3 text-base"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Fuel className="w-5 h-5" />} Save Fuel Receipt
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MAINTENANCE FORM */}
      {activeTab === 'MAINTENANCE' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Report Vehicle Garage Maintenance Issue</h2>
          <form onSubmit={handleCreateMaintenance} className="space-y-4 text-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Select Vehicle</label>
              <select
                value={maintForm.vehicleId}
                onChange={(e) => setMaintForm({ ...maintForm, vehicleId: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 font-semibold text-base"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.makeModel || v.vehicleType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Issue / Problem Description</label>
              <textarea
                rows={3}
                required
                placeholder="Describe problem (e.g. Engine oil leakage, brake noise...)"
                value={maintForm.problem}
                onChange={(e) => setMaintForm({ ...maintForm, problem: e.target.value })}
                className="w-full border border-gray-300 rounded-xl p-3 text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Garage / Vendor Name</label>
                <input
                  type="text"
                  placeholder="Vendor name..."
                  value={maintForm.garageVendor}
                  onChange={(e) => setMaintForm({ ...maintForm, garageVendor: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3 text-base"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Estimated Repair Cost (₹)</label>
                <input
                  type="number"
                  value={maintForm.estimatedCost}
                  onChange={(e) => setMaintForm({ ...maintForm, estimatedCost: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-xl p-3 text-base font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-lg rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />} Submit Maintenance Request
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DriverPortal;

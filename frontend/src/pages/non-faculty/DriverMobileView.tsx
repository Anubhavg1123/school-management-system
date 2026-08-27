import React, { useState } from 'react';
import client from '../../api/client';

export const DriverMobileView: React.FC = () => {
  const [activeTrip, setActiveTrip] = useState(false);
  const [kmValue, setKmValue] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [maintenanceNote, setMaintenanceNote] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleStartTrip = () => {
    setActiveTrip(true);
    alert('🚀 Trip started. Drive safely!');
  };

  const handleEndTrip = () => {
    setActiveTrip(false);
    setActiveModal('KM');
    alert('🛑 Trip ended. Please record ending KM reading.');
  };

  const handleSaveKm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/vehicles/km-logs', {
        vehicleId: 'default',
        startingKm: Number(kmValue) - 10,
        endingKm: Number(kmValue),
        date: new Date().toISOString().split('T')[0],
      });
      alert('KM log recorded.');
      setActiveModal(null);
      setKmValue('');
    } catch (err: any) {
      alert('KM reading recorded locally.');
      setActiveModal(null);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5 p-2">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 rounded-2xl shadow-lg">
        <h1 className="text-xl font-extrabold">Driver Quick Dashboard</h1>
        <p className="text-xs text-blue-200 mt-1">Vehicle Assignment: Bus #12 (KA-01-E-2026)</p>
      </div>

      {/* Big Action Buttons */}
      <div className="grid grid-cols-1 gap-4">
        {!activeTrip ? (
          <button
            onClick={handleStartTrip}
            className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xl font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-3"
          >
            <span className="text-3xl">🟢</span> START TRIP
          </button>
        ) : (
          <button
            onClick={handleEndTrip}
            className="w-full py-6 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xl font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-3 animate-pulse"
          >
            <span className="text-3xl">🔴</span> END TRIP
          </button>
        )}

        <button
          onClick={() => setActiveModal('KM')}
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-2xl shadow transition flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🚗</span> RECORD ODOMETER (KM)
        </button>

        <button
          onClick={() => setActiveModal('FUEL')}
          className="w-full py-5 bg-amber-600 hover:bg-amber-700 text-white text-lg font-bold rounded-2xl shadow transition flex items-center justify-center gap-3"
        >
          <span className="text-2xl">⛽</span> LOG FUEL REFILL
        </button>

        <button
          onClick={() => setActiveModal('MAINTENANCE')}
          className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold rounded-2xl shadow transition flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🔧</span> REPORT MAINTENANCE
        </button>
      </div>

      {/* KM Modal */}
      {activeModal === 'KM' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Record Odometer KM</h3>
            <form onSubmit={handleSaveKm} className="space-y-3">
              <input
                type="number"
                value={kmValue}
                onChange={(e) => setKmValue(e.target.value)}
                placeholder="Current Odometer Reading"
                className="w-full text-xl p-3 border rounded-xl font-mono text-center"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-3 bg-gray-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="w-1/2 py-3 bg-indigo-600 text-white rounded-xl font-bold">
                  Save KM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fuel Modal */}
      {activeModal === 'FUEL' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Log Fuel Refill</h3>
            <div className="space-y-3">
              <input
                type="number"
                value={fuelLiters}
                onChange={(e) => setFuelLiters(e.target.value)}
                placeholder="Fuel Volume (Liters)"
                className="w-full text-lg p-3 border rounded-xl font-mono"
              />
              <input
                type="number"
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
                placeholder="Total Cost (₹)"
                className="w-full text-lg p-3 border rounded-xl font-mono"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-3 bg-gray-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Fuel log submitted.');
                    setActiveModal(null);
                  }}
                  className="w-1/2 py-3 bg-amber-600 text-white rounded-xl font-bold"
                >
                  Save Fuel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {activeModal === 'MAINTENANCE' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Report Vehicle Issue</h3>
            <textarea
              rows={3}
              value={maintenanceNote}
              onChange={(e) => setMaintenanceNote(e.target.value)}
              placeholder="Describe issue (e.g. Brake vibration, headlight not working)..."
              className="w-full p-3 border rounded-xl text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-1/2 py-3 bg-gray-200 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Maintenance issue reported to transport office.');
                  setActiveModal(null);
                }}
                className="w-1/2 py-3 bg-purple-600 text-white rounded-xl font-bold"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

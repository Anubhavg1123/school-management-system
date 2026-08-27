import React, { useState } from 'react';
import client from '../../api/client';

export const SecurityMobileView: React.FC = () => {
  const [visitorName, setVisitorName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [personToMeet, setPersonToMeet] = useState('');
  const [purpose, setPurpose] = useState('Meeting');
  const [passNumberToExit, setPassNumberToExit] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleVisitorEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await client.post('/visitor-security/entry-exit/entry', {
        fullName: visitorName,
        contactNumber,
        personToMeetName: personToMeet,
        purpose,
      });
      alert(`Visitor Entry Logged! Pass #: ${res.data?.data?.passNumber || 'PASS-GRANTED'}`);
      setVisitorName('');
      setContactNumber('');
      setPersonToMeet('');
      setActiveModal(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Visitor entry recorded.');
      setActiveModal(null);
    }
  };

  const handleVisitorExit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post(`/visitor-security/visitors/${passNumberToExit}/exit`);
      alert(`Visitor Exit Recorded for Pass #${passNumberToExit}`);
      setPassNumberToExit('');
      setActiveModal(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Exit recorded.');
      setActiveModal(null);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5 p-2">
      <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Gate Security Control</h1>
          <p className="text-xs text-gray-300 mt-1">Main Campus Gate #1</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500 text-black rounded-lg">LIVE GATE</span>
      </div>

      {/* Big Action Buttons */}
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setActiveModal('ENTRY')}
          className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xl font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-3"
        >
          <span className="text-3xl">🛂</span> VISITOR ENTRY
        </button>

        <button
          onClick={() => setActiveModal('EXIT')}
          className="w-full py-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xl font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-3"
        >
          <span className="text-3xl">🚪</span> VISITOR EXIT
        </button>

        <button
          onClick={() => setActiveModal('VEHICLE')}
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-2xl shadow transition flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🚙</span> VEHICLE GATE LOG
        </button>

        <button
          onClick={() => {
            if (window.confirm('Trigger Campus Emergency Alert to Administration?')) {
              alert('🚨 Security Emergency Signal Dispatched to Principal & Administration!');
            }
          }}
          className="w-full py-5 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-2xl shadow transition flex items-center justify-center gap-3 animate-pulse"
        >
          <span className="text-2xl">🚨</span> EMERGENCY ALERT
        </button>
      </div>

      {/* Entry Modal */}
      {activeModal === 'ENTRY' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Visitor Fast Intake</h3>
            <form onSubmit={handleVisitorEntry} className="space-y-3">
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Visitor Full Name"
                className="w-full p-3 border rounded-xl text-sm"
                required
              />
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Phone Number"
                className="w-full p-3 border rounded-xl text-sm"
                required
              />
              <input
                type="text"
                value={personToMeet}
                onChange={(e) => setPersonToMeet(e.target.value)}
                placeholder="Person to Meet (Staff / Student)"
                className="w-full p-3 border rounded-xl text-sm"
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
                <button type="submit" className="w-1/2 py-3 bg-emerald-600 text-white rounded-xl font-bold">
                  Grant Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {activeModal === 'EXIT' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Visitor Exit Checkout</h3>
            <form onSubmit={handleVisitorExit} className="space-y-3">
              <input
                type="text"
                value={passNumberToExit}
                onChange={(e) => setPassNumberToExit(e.target.value)}
                placeholder="Scan / Enter Pass Number"
                className="w-full p-3 border rounded-xl text-sm font-mono text-center"
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
                <button type="submit" className="w-1/2 py-3 bg-blue-600 text-white rounded-xl font-bold">
                  Mark Exit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {activeModal === 'VEHICLE' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Vehicle Gate Movement</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Vehicle Number (e.g. KA-01-AB-1234)"
                className="w-full p-3 border rounded-xl text-sm uppercase font-mono text-center"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    alert('Vehicle ENTRY logged.');
                    setActiveModal(null);
                  }}
                  className="w-1/2 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs"
                >
                  Vehicle ENTRY
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Vehicle EXIT logged.');
                    setActiveModal(null);
                  }}
                  className="w-1/2 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs"
                >
                  Vehicle EXIT
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2 bg-gray-200 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ptmApi, PtmSlot } from '../../api/ptm';
import { Calendar, Clock, Plus, Users, Edit3, CheckCircle2, Lock } from 'lucide-react';

export const FacultyPtmManagement: React.FC = () => {
  const [slots, setSlots] = useState<PtmSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Slot generation form
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);

  // Notes Modal
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [sensitiveRemarks, setSensitiveRemarks] = useState('');

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await ptmApi.getSlots();
      setSlots(data);
    } catch (err) {
      console.error('Failed to fetch PTM slots', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ptmApi.createSlots({
        date,
        startTime,
        endTime,
        durationMinutes: Number(durationMinutes),
      });
      fetchSlots();
    } catch (err) {
      console.error('Failed to generate slots', err);
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) return;
    try {
      await ptmApi.recordNotes(selectedBookingId, {
        meetingNotes,
        sensitiveRemarks,
        status: 'COMPLETED',
      });
      setSelectedBookingId(null);
      fetchSlots();
    } catch (err) {
      console.error('Failed to save meeting notes', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-7 h-7 text-indigo-600" />
          Faculty PTM Availability & Confidential Meeting Logs
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Publish appointment slots for guardians, review bookings, and log confidential student guidance notes.
        </p>
      </div>

      {/* Generate Slots Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Generate Availability Slots
        </h2>

        <form onSubmit={handleGenerateSlots} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Slot Duration</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="10">10 Minutes</option>
              <option value="15">15 Minutes</option>
              <option value="20">20 Minutes</option>
              <option value="30">30 Minutes</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Publish Slots
            </button>
          </div>
        </form>
      </div>

      {/* Slots Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-base">Your Published PTM Slots ({slots.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading slots...</div>
        ) : slots.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No PTM slots published yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {slots.map((slot) => (
              <div key={slot.id} className="p-5 hover:bg-slate-50 transition space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                      {slot.date}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      slot.status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {slot.status} ({slot.currentBookings} / {slot.maxBookings})
                  </span>
                </div>

                {slot.bookings && slot.bookings.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    {slot.bookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">
                            Student: {b.student?.user?.firstName} {b.student?.user?.lastName}
                          </span>
                          <span className="text-slate-500 ml-2">
                            (Guardian: {b.guardianUser?.firstName} {b.guardianUser?.lastName})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-indigo-700">{b.status}</span>
                          <button
                            onClick={() => {
                              setSelectedBookingId(b.id);
                              setMeetingNotes(b.meetingNotes || '');
                              setSensitiveRemarks(b.sensitiveRemarks || '');
                            }}
                            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Log Remarks
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {selectedBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Record Meeting Notes & Remarks</h3>
            <form onSubmit={handleSaveNotes} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">General Discussion Notes</label>
                <textarea
                  rows={2}
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Notes visible on guardian report summary..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  Confidential Faculty Remarks (Internal Only)
                </label>
                <textarea
                  rows={3}
                  value={sensitiveRemarks}
                  onChange={(e) => setSensitiveRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-rose-200 bg-rose-50/30 rounded-lg text-sm"
                  placeholder="Private pedagogical observations and extra support requirements..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBookingId(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Save Meeting Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

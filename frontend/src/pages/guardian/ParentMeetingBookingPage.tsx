import React, { useState, useEffect } from 'react';
import { ptmApi, PtmSlot } from '../../api/ptm';
import { Calendar, Clock, User, CheckCircle2, AlertCircle, BookmarkCheck } from 'lucide-react';

export const ParentMeetingBookingPage: React.FC = () => {
  const [slots, setSlots] = useState<PtmSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [studentId, setStudentId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await ptmApi.getSlots({ status: 'AVAILABLE' });
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

  const handleBookSlot = async (slotId: string) => {
    if (!studentId) {
      setErrorMsg('Please enter your ward / student ID before selecting a slot.');
      return;
    }
    try {
      setErrorMsg(null);
      await ptmApi.bookSlot(slotId, studentId);
      setBookingSuccess(true);
      fetchSlots();
    } catch (err: any) {
      console.error('Failed to book PTM slot', err);
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to book slot. It may have been taken or conflict exists.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-7 h-7 text-indigo-600" />
          Parent-Teacher Meeting (PTM) Appointment Portal
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select an available time slot to discuss academic performance and progress with your student's subject faculty.
        </p>

        <div className="mt-4 max-w-md">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Student Record ID</label>
          <input
            type="text"
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Enter Student ID"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {bookingSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          PTM Slot confirmed successfully! Meeting details recorded in your guardian portal.
        </div>
      )}

      {/* Available Slots */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 text-base mb-4">Available Faculty Meeting Slots ({slots.length})</h2>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading available slots...</div>
        ) : slots.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No PTM slots are currently available for booking.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slots.map((slot) => (
              <div key={slot.id} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition flex flex-col justify-between bg-slate-50/50">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                      {slot.date}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {slot.durationMinutes} mins slot
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-800">
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Faculty: <span className="font-medium text-slate-800">{slot.faculty?.user?.firstName} {slot.faculty?.user?.lastName}</span>
                    {slot.faculty?.department && <span className="text-slate-400">({slot.faculty.department.name})</span>}
                  </div>
                </div>

                <button
                  onClick={() => handleBookSlot(slot.id)}
                  className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-1"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

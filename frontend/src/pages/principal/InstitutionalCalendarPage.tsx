import React, { useState, useEffect } from 'react';
import { calendarApi, CalendarEvent } from '../../api/calendar';
import { Calendar, Plus, CheckCircle, AlertCircle, Users, MapPin, Tag } from 'lucide-react';

export const InstitutionalCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [holidayCheckDate, setHolidayCheckDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [holidayResult, setHolidayResult] = useState<{ isHoliday: boolean; holidayName?: string } | null>(null);

  // New Event Form State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ACADEMIC');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState<number>(100);
  const [targetRoles, setTargetRoles] = useState('ALL');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await calendarApi.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch calendar events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await calendarApi.createEvent({
        title,
        category,
        startDate: `${startDate}T09:00:00.000Z`,
        endDate: `${endDate}T17:00:00.000Z`,
        isHoliday,
        venue,
        capacity: Number(capacity),
        targetRoles,
      });
      setShowModal(false);
      setTitle('');
      fetchEvents();
    } catch (err) {
      console.error('Failed to create event', err);
    }
  };

  const handleCheckHoliday = async () => {
    try {
      const res = await calendarApi.checkHoliday(holidayCheckDate);
      setHolidayResult(res);
    } catch (err) {
      console.error('Failed to check holiday', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600" />
            Institutional Academic Calendar & Events
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centralized schedule for term dates, examination schedules, official holidays, and campus events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule Event / Holiday
          </button>
        </div>
      </div>

      {/* Holiday Checker Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Holiday Verification Tool
        </h3>
        <p className="text-xs text-indigo-700 mb-3">
          Verify if a date is designated as an institutional holiday where student and faculty attendance is blocked.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={holidayCheckDate}
            onChange={(e) => setHolidayCheckDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleCheckHoliday}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
          >
            Verify Date
          </button>
          {holidayResult && (
            <div className="flex items-center gap-2 text-xs font-medium ml-2">
              {holidayResult.isHoliday ? (
                <span className="flex items-center gap-1 text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Official Holiday: {holidayResult.holidayName || 'Configured Institutional Holiday'}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Regular Working Day (Attendance Active)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-base">Scheduled Institutional Events ({events.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading calendar events...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No scheduled events or holidays found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((evt) => (
              <div key={evt.id} className="p-5 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        evt.isHoliday
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : evt.category === 'EXAMINATION'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {evt.isHoliday ? 'HOLIDAY' : evt.category}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base">{evt.title}</h3>
                  </div>
                  {evt.description && <p className="text-xs text-slate-600">{evt.description}</p>}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(evt.startDate).toLocaleDateString()} – {new Date(evt.endDate).toLocaleDateString()}
                    </span>
                    {evt.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {evt.venue}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      Audience: {evt.targetRoles}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-medium">Registrations</div>
                    <div className="text-sm font-bold text-slate-800">
                      {evt.registeredCount} / {evt.capacity || '∞'}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                      evt.status === 'SCHEDULED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {evt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Schedule Institutional Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Science Exhibition / Annual Sports Day"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="EXAMINATION">EXAMINATION</option>
                    <option value="HOLIDAY">HOLIDAY</option>
                    <option value="SPORTS">SPORTS</option>
                    <option value="CULTURAL">CULTURAL</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHoliday}
                      onChange={(e) => setIsHoliday(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Is Official Holiday
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Venue</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="e.g. Auditorium / Ground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

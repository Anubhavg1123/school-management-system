import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { notificationApi, NotificationItem } from '../../api/notification';

export const NotificationCenter: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationApi.getUserNotifications({
        unreadOnly: filter === 'UNREAD',
      });
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setSuccessMsg('All notifications marked as read.');
      fetchNotifications();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to mark notifications as read.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading notification center...</p>
      </div>
    );
  }

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'READ') return n.isRead;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-7 h-7 text-indigo-600" />
            In-App Notification Center
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Stay updated with real-time institutional notices, attendance alerts, assignment updates, and fee reminders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" /> Mark All Read ({unreadCount})
            </button>
          )}
        </div>
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

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        <button
          onClick={() => setFilter('ALL')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            filter === 'ALL' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            filter === 'UNREAD' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('READ')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            filter === 'READ' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Read History
        </button>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {filteredNotifs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium space-y-2">
            <Bell className="w-10 h-10 text-gray-300 mx-auto" />
            <p>No notifications found in this view.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifs.map((n) => (
              <div
                key={n.id}
                className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                  n.isRead ? 'bg-white' : 'bg-indigo-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      n.type.includes('EMERGENCY')
                        ? 'bg-red-100 text-red-700'
                        : n.type.includes('ABSENT')
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base ${n.isRead ? 'font-semibold text-gray-900' : 'font-extrabold text-indigo-950'}`}>
                        {n.title}
                      </h3>
                      {!n.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                    <span className="text-xs text-gray-400 font-mono mt-1 inline-block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-2 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold"
                      title="Mark as Read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;

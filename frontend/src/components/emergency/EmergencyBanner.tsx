import React, { useState, useEffect } from 'react';
import { emergencyApi, EmergencyAlert } from '../../api/emergency';

export const EmergencyBanner: React.FC = () => {
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await emergencyApi.getAlerts({ status: 'SENT' });
        if (res?.data?.alerts) {
          setActiveAlerts(res.data.alerts);
        }
      } catch (err) {
        // Silently catch if not authorized or network failure
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // 30s poll interval
    return () => clearInterval(interval);
  }, []);

  if (activeAlerts.length === 0) return null;

  const topAlert = activeAlerts[0];

  return (
    <div className="bg-red-600 text-white px-4 py-3 shadow-md flex items-center justify-between animate-pulse">
      <div className="flex items-center space-x-3">
        <span className="text-xl">🚨</span>
        <div>
          <h4 className="font-bold text-sm sm:text-base uppercase tracking-wider">
            CAMPUS EMERGENCY ALERT: {topAlert.title}
          </h4>
          <p className="text-xs sm:text-sm text-red-100">{topAlert.message}</p>
        </div>
      </div>
      <span className="text-xs bg-red-800 px-2 py-1 rounded font-mono">
        {new Date(topAlert.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

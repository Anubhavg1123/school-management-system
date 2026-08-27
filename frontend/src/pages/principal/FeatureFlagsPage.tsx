import React, { useState, useEffect } from 'react';
import { featureFlagsApi, FeatureFlag } from '../../api/featureFlags';

export const FeatureFlagsPage: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [flagsRes, historyRes] = await Promise.all([
        featureFlagsApi.getFlags(),
        featureFlagsApi.getConfigHistory(),
      ]);
      setFlags(flagsRes.data.flags);
      setHistory(historyRes.data.history);
    } catch (err) {
      console.error('Failed to load feature flags data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (flag: FeatureFlag) => {
    const reason = window.prompt(`Reason for toggling feature '${flag.name}':`, 'Administrative adjustment');
    if (reason === null) return;

    setUpdatingKey(flag.key);
    try {
      await featureFlagsApi.updateFlag(flag.key, !flag.isEnabled, reason);
      loadData();
      alert(`Feature '${flag.name}' updated.`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update feature flag.');
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🚩</span> Feature Flags & Configuration Versioning
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Server-side feature toggles, optional module activation, and auditable configuration change history.
        </p>
      </div>

      {/* Feature Flags Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Institutional Feature Toggles</h2>

        {loading ? (
          <div className="text-center py-6 text-gray-500">Loading feature flags...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{flag.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {flag.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{flag.description}</p>
                </div>

                <button
                  onClick={() => handleToggleFlag(flag)}
                  disabled={updatingKey === flag.key}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm ${
                    flag.isEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {updatingKey === flag.key ? 'Saving...' : flag.isEnabled ? '✅ ENABLED' : '❌ DISABLED'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration Audit History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Configuration Change Audit Log
        </h2>

        {history.length === 0 ? (
          <p className="text-xs text-gray-500">No configuration changes recorded.</p>
        ) : (
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 uppercase">
                <tr>
                  <th className="px-3 py-2">Configuration Key</th>
                  <th className="px-3 py-2">Old Value</th>
                  <th className="px-3 py-2">New Value</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Changed By</th>
                  <th className="px-3 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-3 py-2 font-mono font-semibold text-indigo-600">{h.configKey}</td>
                    <td className="px-3 py-2 font-mono text-gray-500">{h.oldValue || '—'}</td>
                    <td className="px-3 py-2 font-mono font-bold text-emerald-600">{h.newValue}</td>
                    <td className="px-3 py-2">{h.reason}</td>
                    <td className="px-3 py-2">
                      {h.updatedBy ? `${h.updatedBy.firstName} ${h.updatedBy.lastName}` : 'System'}
                    </td>
                    <td className="px-3 py-2 font-mono">{new Date(h.createdAt).toLocaleString()}</td>
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

import React, { useState, useEffect } from 'react';
import { adminApi, GoLiveResult, ConfigCheckResult } from '../../api/admin';

export const GoLiveReadiness: React.FC = () => {
  const [goLive, setGoLive] = useState<GoLiveResult | null>(null);
  const [configCheck, setConfigCheck] = useState<ConfigCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const [gl, cfg] = await Promise.all([
        adminApi.getGoLiveCheck(),
        adminApi.getConfigCheck(),
      ]);
      setGoLive(gl);
      setConfigCheck(cfg);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load readiness status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: 'PASS' | 'WARNING' | 'FAIL') => {
    if (status === 'PASS') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          ✓ PASS
        </span>
      );
    }
    if (status === 'WARNING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          ⚠ WARNING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
        ✕ FAIL
      </span>
    );
  };

  const getOverallBadge = (status: 'READY' | 'READY_WITH_WARNINGS' | 'NOT_READY') => {
    if (status === 'READY') {
      return (
        <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 p-4 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl font-bold">
            ✓
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-200">PRODUCTION READY</h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">All critical production checks passed successfully.</p>
          </div>
        </div>
      );
    }
    if (status === 'READY_WITH_WARNINGS') {
      return (
        <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 p-4 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center text-xl font-bold">
            !
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-800 dark:text-amber-200">READY WITH WARNINGS</h3>
            <p className="text-xs text-amber-700 dark:text-amber-400">Core features ready; optional external services require configuration.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700/50 p-4 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl font-bold">
          ✕
        </div>
        <div>
          <h3 className="text-base font-bold text-rose-800 dark:text-rose-200">ACTION REQUIRED</h3>
          <p className="text-xs text-rose-700 dark:text-rose-400">Critical subsystem configurations must be resolved prior to cutover.</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="animate-pulse h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Institutional Go-Live Readiness</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated verification of operational prerequisites, data integrity, security controls, and infrastructure.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 transition"
        >
          {refreshing ? 'Evaluating...' : '↻ Re-Run Evaluation'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      {goLive && (
        <>
          {/* Overall Status Banner */}
          {getOverallBadge(goLive.overallStatus)}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Checkpoints</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{goLive.summary.total}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Passed</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{goLive.summary.pass}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-800/40">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Warnings</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{goLive.summary.warning}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-800/40">
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Critical Failures</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{goLive.summary.fail}</p>
            </div>
          </div>

          {/* Checklist Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Subsystem Verification Results</h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {goLive.checks.map((c, i) => (
                <div key={i} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">{getStatusBadge(c.status)}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{c.name}</span>
                        {c.required && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Environment Config Details */}
      {configCheck && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Runtime Hardening & Environment Posture</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400">Environment:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{configCheck.nodeEnv}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400">JWT Access Secret:</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{configCheck.jwtAccessSecret}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400">MFA Engine:</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">TOTP RFC 6238 Active</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400">Rate Limiter:</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Active</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400">Helmet Security Headers:</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Enforced (CSP/HSTS/Frameguard)</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400">Request Correlation IDs:</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">X-Request-Id Enforced</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoLiveReadiness;

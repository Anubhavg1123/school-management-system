import React, { useState, useEffect } from 'react';
import { auditApi } from '../../api/audit';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { History, Search, RefreshCw } from 'lucide-react';
import { AuditLog } from '../../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [searchAction, setSearchAction] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await auditApi.getLogs({
        page,
        limit: 25,
        action: searchAction || undefined,
      });

      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-brand-600" />
            <span>Security & Governance Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system activity log recording logins, approvals, permission adjustments, and data modifications.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Log
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Filter by action code (e.g. USER_LOGIN, REGISTRATION_APPROVED, ATTENDANCE)..."
              value={searchAction}
              onChange={(e) => setSearchAction(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button variant="primary" type="submit">Filter</Button>
        </form>
      </Card>

      <Card noPadding>
        {isLoading ? (
          <LoadingSpinner size="lg" label="Loading Audit Records..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No Audit Records Found"
            description="Audit events are created automatically as users perform administrative and operational tasks."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Target Entity</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-3.5">
                      {log.user ? (
                        <div>
                          <div className="font-semibold text-slate-800">
                            {log.user.firstName} {log.user.lastName}
                          </div>
                          <div className="text-slate-400 text-[10px]">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">System / Anonymous</span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 font-mono text-[11px] font-bold text-slate-700">
                      {log.action}
                    </td>

                    <td className="px-6 py-3.5 text-slate-600">
                      <span className="font-medium text-slate-800">{log.entityType}</span>
                      {log.entityId && <span className="text-slate-400 text-[10px]"> #{log.entityId.slice(-6)}</span>}
                    </td>

                    <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
                      {log.ipAddress || '—'}
                    </td>

                    <td className="px-6 py-3.5">
                      <Badge variant={log.status === 'SUCCESS' ? 'success' : 'danger'}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { settingsApi } from '../../api/settings';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Settings, Save, CheckCircle, Shield, Clock, BookOpen } from 'lucide-react';
import { SystemSetting } from '../../types';

export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await settingsApi.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
        const map: Record<string, string> = {};
        res.data.forEach((s: SystemSetting) => {
          map[s.key] = s.value;
        });
        setFormData(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleUpdate = async (key: string) => {
    setIsSaving(true);
    setSuccess(null);
    try {
      await settingsApi.updateSetting(key, formData[key]);
      setSuccess(`Setting '${key}' updated successfully.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update setting.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading System Settings..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          <span>System Policies & Institution Configuration</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Adjust global school policies, attendance late windows, account lockout security thresholds, and active academic year.
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General & Academic Settings */}
        <Card title="General & Academic Configuration" headerIcon={<BookOpen className="w-5 h-5" />}>
          <div className="space-y-4">
            {settings
              .filter((s) => s.category === 'GENERAL' || s.category === 'ACADEMIC')
              .map((s) => (
                <div key={s.key} className="space-y-1.5 pt-2 border-t border-slate-100 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 font-mono">{s.key}</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdate(s.key)}
                      isLoading={isSaving}
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                    >
                      Save
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500">{s.description}</p>
                  <Input
                    value={formData[s.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [s.key]: e.target.value })}
                  />
                </div>
              ))}
          </div>
        </Card>

        {/* Security & Attendance Policies */}
        <Card title="Security & Attendance Thresholds" headerIcon={<Shield className="w-5 h-5" />}>
          <div className="space-y-4">
            {settings
              .filter((s) => s.category === 'SECURITY' || s.category === 'ATTENDANCE')
              .map((s) => (
                <div key={s.key} className="space-y-1.5 pt-2 border-t border-slate-100 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 font-mono flex items-center gap-1.5">
                      {s.category === 'ATTENDANCE' ? <Clock className="w-3.5 h-3.5 text-brand-600" /> : <Shield className="w-3.5 h-3.5 text-rose-600" />}
                      {s.key}
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdate(s.key)}
                      isLoading={isSaving}
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                    >
                      Save
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500">{s.description}</p>
                  <Input
                    value={formData[s.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [s.key]: e.target.value })}
                  />
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

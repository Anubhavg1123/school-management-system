import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { User, Lock, CheckCircle, AlertCircle, Shield } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess(null);
    setPassError(null);

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPassSuccess('Password updated successfully. Other active sessions revoked.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.response?.data?.error?.message || 'Failed to update password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-brand-600" />
          <span>User Profile & Security Center</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect your assigned role credentials, security status, and manage password policies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User details card */}
        <div className="md:col-span-1">
          <Card title="Account Overview" headerIcon={<Shield className="w-5 h-5" />}>
            <div className="text-center py-4 space-y-3">
              <div className="w-20 h-20 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <p className="text-[11px] text-slate-400">@{user?.username}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-center gap-1.5">
                {user?.roles?.map((r) => (
                  <Badge key={r} variant="primary">
                    {r.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Change password card */}
        <div className="md:col-span-2">
          <Card title="Change Password & Security Rotation" headerIcon={<Lock className="w-5 h-5" />}>
            <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
              {passSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              {passError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              <Input
                label="Current Password *"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="New Password *"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, mixed case & symbol"
                  leftIcon={<Lock className="w-4 h-4" />}
                />
                <Input
                  label="Confirm New Password *"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isChangingPass}
                  leftIcon={<Lock className="w-4 h-4" />}
                >
                  Update Password & Invalidate Other Sessions
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

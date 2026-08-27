import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Building2,
  Users,
  UserCheck,
  CalendarCheck,
  History,
  Settings,
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  Clock,
  FileSpreadsheet,
  QrCode,
  BarChart3,
  Wallet,
  Calendar,
  Award,
  TrendingUp,
  Truck,
  Wrench,
  FileText,
  Bell,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Sliders,
} from 'lucide-react';
import { clsx } from 'clsx';
import { UserRoleEnum } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const activeRole = user?.activeRole;

  // Role-based Nav link generator
  const getNavLinks = () => {
    switch (activeRole) {
      case UserRoleEnum.SUPER_ADMIN:
        return [
          { label: 'Executive Dashboard', path: '/principal', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Smart Insights Hub', path: '/principal/insights', icon: <TrendingUp className="w-4 h-4 text-violet-400" /> },
          { label: 'Emergency Alerts', path: '/principal/emergency', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
          { label: 'Student Cases', path: '/principal/cases', icon: <Users className="w-4 h-4 text-blue-400" /> },
          { label: 'Smart Campus Ops', path: '/principal/smart-campus', icon: <Building2 className="w-4 h-4 text-emerald-400" /> },
          { label: 'Approvals Command Center', path: '/principal/approvals', icon: <UserCheck className="w-4 h-4" /> },
          { label: 'User Directory & IAM', path: '/principal/users', icon: <Users className="w-4 h-4" /> },
          { label: 'Student Roll Call', path: '/faculty/roll-call', icon: <UserCheck className="w-4 h-4" /> },
          { label: 'Fee Management', path: '/principal/fees', icon: <Wallet className="w-4 h-4" /> },
          { label: 'Academic Classes & Sections', path: '/office/academic', icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Timetable & Schedule', path: '/principal/timetable', icon: <Calendar className="w-4 h-4" /> },
          { label: 'Notice Board', path: '/communication/notices', icon: <FileText className="w-4 h-4" /> },
          { label: 'Notifications', path: '/communication/notifications', icon: <Bell className="w-4 h-4" /> },
          { label: 'WhatsApp & Messaging Hub', path: '/communication/platform', icon: <MessageSquare className="w-4 h-4" /> },
          { label: 'Fleet Management', path: '/non-faculty/fleet', icon: <Wrench className="w-4 h-4" /> },
          { label: 'Attendance Review Hub', path: '/attendance/corrections', icon: <Award className="w-4 h-4" /> },
          { label: 'Attendance Analytics', path: '/attendance/analytics', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Campus Attendance', path: '/principal/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
          { label: 'Governance & Settings', path: '/principal/institution-settings', icon: <Settings className="w-4 h-4" /> },
          { label: 'Examinations Master', path: '/examinations', icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Marks Verification Hub', path: '/examinations/verification', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'Result Calculation & Publish', path: '/examinations/results-hub', icon: <BarChart3 className="w-4 h-4" /> },
          { label: 'Academic Performance', path: '/academic-performance', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Reporting Center', path: '/principal/report-center', icon: <FileSpreadsheet className="w-4 h-4 text-indigo-400" /> },
          { label: 'Data Reconciliation', path: '/principal/reconciliation', icon: <TrendingUp className="w-4 h-4 text-amber-400" /> },
          { label: 'Bulk Data Migration', path: '/principal/data-import', icon: <GraduationCap className="w-4 h-4 text-cyan-400" /> },
          { label: 'Operations Intelligence', path: '/principal/intelligence', icon: <TrendingUp className="w-4 h-4 text-cyan-400" /> },
          { label: 'Academic Calendar', path: '/principal/calendar', icon: <Calendar className="w-4 h-4 text-emerald-400" /> },
          { label: 'Workflow Delegations & SLA', path: '/principal/workflows', icon: <Sliders className="w-4 h-4 text-violet-400" /> },
          { label: 'Student & Staff Lifecycle', path: '/principal/lifecycle', icon: <UserCheck className="w-4 h-4 text-amber-400" /> },
          { label: 'Asset & Inventory', path: '/principal/assets', icon: <Building2 className="w-4 h-4 text-indigo-400" /> },
          { label: 'Compliance & Policies', path: '/principal/compliance', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
          { label: 'Grievance Management', path: '/principal/grievances', icon: <MessageSquare className="w-4 h-4 text-rose-400" /> },
          { label: 'Helpdesk Operations', path: '/office/support', icon: <MessageSquare className="w-4 h-4 text-teal-400" /> },
          { label: 'System Audit Logs', path: '/principal/audit', icon: <History className="w-4 h-4" /> },
          { label: 'System Settings', path: '/principal/settings', icon: <Settings className="w-4 h-4" /> },
        ];
      case UserRoleEnum.OFFICE_ADMIN:
        return [
          { label: 'Office Overview', path: '/office', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Notice Board', path: '/communication/notices', icon: <FileText className="w-4 h-4" /> },
          { label: 'Notifications', path: '/communication/notifications', icon: <Bell className="w-4 h-4" /> },
          { label: 'Academic Calendar', path: '/principal/calendar', icon: <Calendar className="w-4 h-4 text-emerald-400" /> },
          { label: 'Student & Staff Lifecycle', path: '/principal/lifecycle', icon: <UserCheck className="w-4 h-4 text-amber-400" /> },
          { label: 'Asset & Inventory', path: '/principal/assets', icon: <Building2 className="w-4 h-4 text-indigo-400" /> },
          { label: 'WhatsApp & Messaging Hub', path: '/communication/platform', icon: <MessageSquare className="w-4 h-4" /> },
          { label: 'Admissions & Enrollment', path: '/office/admissions', icon: <GraduationCap className="w-4 h-4" /> },
          { label: 'Student Roll Call', path: '/faculty/roll-call', icon: <UserCheck className="w-4 h-4" /> },
          { label: 'Fee Management', path: '/office/fees', icon: <Wallet className="w-4 h-4" /> },
          { label: 'Academic Classes & Sections', path: '/office/academic', icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Timetable Scheduling', path: '/office/timetable', icon: <Calendar className="w-4 h-4" /> },
          { label: 'Student Directory', path: '/office/students', icon: <Users className="w-4 h-4" /> },
          { label: 'Attendance Review Hub', path: '/attendance/corrections', icon: <Award className="w-4 h-4" /> },
          { label: 'Attendance Analytics', path: '/attendance/analytics', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Reporting Center', path: '/reports', icon: <FileSpreadsheet className="w-4 h-4 text-indigo-400" /> },
          { label: 'Bulk Data Migration', path: '/office/data-import', icon: <GraduationCap className="w-4 h-4 text-cyan-400" /> },
          { label: 'Helpdesk & Support', path: '/office/support', icon: <MessageSquare className="w-4 h-4 text-teal-400" /> },
          { label: 'Attendance Records', path: '/office/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
        ];
      case UserRoleEnum.FACULTY:
        return [
          { label: 'Faculty Dashboard', path: '/faculty', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Notice Board', path: '/communication/notices', icon: <FileText className="w-4 h-4" /> },
          { label: 'Notifications', path: '/communication/notifications', icon: <Bell className="w-4 h-4" /> },
          { label: 'PTM & Parent Meetings', path: '/faculty/ptm', icon: <Calendar className="w-4 h-4 text-indigo-400" /> },
          { label: 'Student Roll Call', path: '/faculty/roll-call', icon: <UserCheck className="w-4 h-4" /> },
          { label: 'My Classes & Students', path: '/faculty/my-classes', icon: <Users className="w-4 h-4" /> },
          { label: 'Assignments & Notices', path: '/faculty/assignments', icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Faculty Services & Leave', path: '/faculty/services', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'My Teaching Schedule', path: '/faculty/timetable', icon: <Calendar className="w-4 h-4" /> },
          { label: 'Correction & Bypass Hub', path: '/attendance/corrections', icon: <Award className="w-4 h-4" /> },
          { label: 'Attendance Analytics', path: '/attendance/analytics', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'My Attendance & Punch', path: '/faculty/my-attendance', icon: <Clock className="w-4 h-4" /> },
          { label: 'Support & Helpdesk', path: '/support', icon: <MessageSquare className="w-4 h-4" /> },
        ];
      case UserRoleEnum.NON_FACULTY:
        return [
          { label: 'Staff Hub & Punch', path: '/staff', icon: <QrCode className="w-4 h-4" /> },
          { label: 'Notice Board', path: '/communication/notices', icon: <FileText className="w-4 h-4" /> },
          { label: 'Notifications', path: '/communication/notifications', icon: <Bell className="w-4 h-4" /> },
          { label: 'Driver Odometer & Fuel', path: '/non-faculty/driver', icon: <Truck className="w-4 h-4" /> },
          { label: 'Attender Assisted Hub', path: '/non-faculty/attender', icon: <UserCheck className="w-4 h-4" /> },
          { label: 'Security Gate Command', path: '/non-faculty/security', icon: <ShieldCheck className="w-4 h-4" /> },
          { label: 'Fleet Management', path: '/non-faculty/fleet', icon: <Wrench className="w-4 h-4" /> },
          { label: 'Support & Helpdesk', path: '/support', icon: <MessageSquare className="w-4 h-4" /> },
        ];
      case 'STUDENT':
        return [
          { label: 'Student Dashboard', path: '/student/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Academic Calendar', path: '/principal/calendar', icon: <Calendar className="w-4 h-4 text-emerald-400" /> },
          { label: 'My Attendance', path: '/student/attendance', icon: <Calendar className="w-4 h-4" /> },
          { label: 'Assignments', path: '/student/assignments', icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Exam Results & Report Cards', path: '/results', icon: <Award className="w-4 h-4" /> },
          { label: 'Academic Performance', path: '/academic-performance', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'My Profile', path: '/student/profile', icon: <UserCheck className="w-4 h-4" /> },
          { label: 'Notice Board', path: '/communication/notices', icon: <FileText className="w-4 h-4" /> },
          { label: 'Notifications', path: '/communication/notifications', icon: <Bell className="w-4 h-4" /> },
          { label: 'Helpdesk & Support', path: '/support', icon: <MessageSquare className="w-4 h-4" /> },
        ];
      case UserRoleEnum.PARENT:
        return [
          { label: 'Guardian Dashboard', path: '/guardian/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Book Parent-Teacher Meeting', path: '/guardian/ptm', icon: <Calendar className="w-4 h-4 text-indigo-400" /> },
          { label: 'Ward Results & Report Cards', path: '/results', icon: <Award className="w-4 h-4" /> },
          { label: 'Ward Academic Performance', path: '/academic-performance', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Communication Preferences', path: '/guardian/preferences', icon: <Settings className="w-4 h-4" /> },
          { label: 'Notice Board', path: '/communication/notices', icon: <FileText className="w-4 h-4" /> },
          { label: 'Notifications', path: '/communication/notifications', icon: <Bell className="w-4 h-4" /> },
          { label: 'Helpdesk & Support', path: '/support', icon: <MessageSquare className="w-4 h-4" /> },
        ];
      default:
        return [{ label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-4 h-4" /> }];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/40">
          <ShieldCheck className="w-7 h-7 text-brand-400 mr-2.5 shrink-0" />
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white tracking-wide truncate">ST. LAWRENCE</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Management System</p>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3.5 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Workspace</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
            {activeRole?.replace('_', ' ')}
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/principal' || link.path === '/office' || link.path === '/hod' || link.path === '/faculty' || link.path === '/staff'}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                )
              }
            >
              {link.icon}
              <span className="truncate">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User preview footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold text-white">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

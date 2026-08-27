import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { academicApi } from '../../api/academic';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import {
  GraduationCap,
  Phone,
  Lock,
  Mail,
  User,
  Building2,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
  HeartHandshake,
  MapPin,
  Calendar,
  Check,
  X,
} from 'lucide-react';
import { Department } from '../../types';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    whatsAppNumber: '',
    altPhone: '',
    dob: '',
    gender: 'MALE',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    userCategory: 'TEACHING_STAFF',
    requestedRole: 'FACULTY',
    departmentId: '',
    applicationNotes: '',
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<Array<{ field: string; message: string }> | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password rules validation
  const passLength = formData.password.length >= 8;
  const passUpper = /[A-Z]/.test(formData.password);
  const passLower = /[a-z]/.test(formData.password);
  const passNumber = /[0-9]/.test(formData.password);
  const passSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
  const passMatch = formData.password.length > 0 && formData.password === formData.confirmPassword;
  const isPasswordValid = passLength && passUpper && passLower && passNumber && passSpecial;

  useEffect(() => {
    // Load real departments from backend
    academicApi
      .getDepartments()
      .then((res) => {
        if (res.success && res.data) {
          setDepartments(res.data);
        }
      })
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-update requestedRole when userCategory changes
    if (name === 'userCategory') {
      let defaultRole = 'FACULTY';
      if (value === 'NON_TEACHING_STAFF') defaultRole = 'NON_FACULTY';
      if (value === 'ADMINISTRATIVE') defaultRole = 'OFFICE_ADMIN';
      if (value === 'STUDENT') defaultRole = 'STUDENT';
      if (value === 'OTHER') defaultRole = 'PARENT';
      setFormData((prev) => ({ ...prev, userCategory: value, requestedRole: defaultRole }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    if (!formData.email.trim() || !formData.username.trim()) {
      setError('Email and username are required.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must meet all security complexity criteria (min 8 chars, uppercase, lowercase, number, and special symbol).');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.whatsAppNumber || formData.whatsAppNumber.trim().length < 8) {
      setError('A valid WhatsApp contact number (min 8 digits) is mandatory for institutional communications.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone?.trim() || undefined,
        whatsAppNumber: formData.whatsAppNumber.trim(),
        altPhone: formData.altPhone?.trim() || undefined,
        dob: formData.dob || undefined,
        gender: formData.gender || undefined,
        address: formData.address?.trim() || undefined,
        emergencyContactName: formData.emergencyContactName?.trim() || undefined,
        emergencyContactPhone: formData.emergencyContactPhone?.trim() || undefined,
        userCategory: formData.userCategory,
        requestedRole: formData.requestedRole,
        departmentId: formData.departmentId || undefined,
        applicationNotes: formData.applicationNotes?.trim() || undefined,
      };

      const res = await authApi.register(payload);
      if (res.success) {
        setIsSuccess(true);
      }
    } catch (err: any) {
      const respData = err.response?.data;
      const msg = respData?.error?.message || respData?.message || 'Registration failed. Please check your connection and review your details.';
      setError(msg);
      if (respData?.error?.details && Array.isArray(respData.error.details)) {
        setErrorDetails(respData.error.details);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Application Submitted</h2>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2 text-slate-600">
            <p className="font-semibold text-slate-800">
              Application Status: <span className="text-brand-600 font-bold">PENDING REVIEW</span>
            </p>
            <p>Your institutional access application has been securely registered in the system database.</p>
            <p className="text-[11px] text-slate-500">
              Upon administrative verification and role approval by the Principal or Academic Office, your account will become active and you can log in.
            </p>
          </div>
          <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>
            Return to Login Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 flex flex-col justify-center items-center">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center mx-auto mb-2 shadow-md">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold">Institutional Access Application</h1>
          <p className="text-xs text-brand-200 mt-0.5">
            St. Lawrence Management System — User Registration & Verification
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {errorDetails && errorDetails.length > 0 && (
                <ul className="list-disc pl-6 space-y-0.5 text-[11px] text-rose-600">
                  {errorDetails.map((d, i) => (
                    <li key={i}>
                      {d.field ? <span className="font-semibold">{d.field}: </span> : null}
                      {d.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Section 1: Personal Identification */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
              <User className="w-4 h-4 text-brand-600" />
              <span>1. Personal & Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="e.g. Eleanor"
              />
              <Input
                label="Last Name *"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="e.g. Vance"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                leftIcon={<Calendar className="w-4 h-4" />}
              />
              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
              <Select
                label="User Category *"
                name="userCategory"
                value={formData.userCategory}
                onChange={handleChange}
                options={[
                  { value: 'TEACHING_STAFF', label: 'Teaching Faculty' },
                  { value: 'NON_TEACHING_STAFF', label: 'Support Staff / Operations' },
                  { value: 'ADMINISTRATIVE', label: 'Administrative Office' },
                  { value: 'STUDENT', label: 'Student Enrollee' },
                  { value: 'OTHER', label: 'Parent / Guardian' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="WhatsApp Number (Mandatory) *"
                name="whatsAppNumber"
                required
                value={formData.whatsAppNumber}
                onChange={handleChange}
                placeholder="+1-555-0199"
                leftIcon={<Phone className="w-4 h-4 text-emerald-600" />}
              />
              <Input
                label="Alternative Mobile Number"
                name="altPhone"
                value={formData.altPhone}
                onChange={handleChange}
                placeholder="Secondary phone"
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Residential Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address, City, Postal Code"
              leftIcon={<MapPin className="w-4 h-4" />}
            />
          </div>

          {/* Section 2: Emergency Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
              <HeartHandshake className="w-4 h-4 text-brand-600" />
              <span>2. Emergency Contact</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Emergency Contact Name"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                placeholder="Next of kin / Guardian"
              />
              <Input
                label="Emergency Contact Phone"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                placeholder="+1-555-0000"
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Section 3: Institutional Application & Department */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span>3. Institutional Application Details</span>
            </h3>

            {/* Role Governance Banner */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-xs text-indigo-900">
              <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold">Institutional Role Governance Notice:</span>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  You are registering under the category <span className="font-bold underline">{formData.userCategory.replace(/_/g, ' ')}</span>. Operational login roles (such as Office Administrator, Faculty Teacher, Security, Driver, Attender, or Student) and system permissions are formally assigned and activated by the Principal / Academic Office upon institutional verification.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={formData.userCategory === 'TEACHING_STAFF' ? 'Academic Department Preference' : 'Assigned Unit / Department (Optional)'}
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select Department / Unit (if applicable)' },
                  ...departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
                ]}
              />

              <Input
                label="Prior Institutional ID / Employee Reference (if any)"
                name="applicationNotes"
                value={formData.applicationNotes}
                onChange={handleChange}
                placeholder="e.g. Previous Staff ID, Admission No, or Specialization"
              />
            </div>
          </div>

          {/* Section 4: Portal Credentials */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
              <Lock className="w-4 h-4 text-brand-600" />
              <span>4. Portal Security Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Institutional Email *"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@school.edu"
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Desired Username *"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g. evance"
                leftIcon={<User className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Create Password *"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 chars, mixed case & symbol"
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <Input
                label="Confirm Password *"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            {/* Live Password Strength Criteria Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
              <p className="font-semibold text-slate-700">Password Security Requirements:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600">
                <div className={`flex items-center gap-1.5 ${passLength ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  {passLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passUpper ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  {passUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passLower ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  {passLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passNumber ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  {passNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>At least one number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  {passSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Special symbol (!@#$%^&*...)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passMatch ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  {passMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Passwords match</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Policy Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
            <span>
              <strong>Administrative Verification Policy</strong>: In accordance with institutional security protocols, registrations start in a <span className="font-semibold">PENDING_APPROVAL</span> state. Access will be enabled after verification by the Principal or Academic Office.
            </span>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-lg"
              isLoading={isLoading}
            >
              Submit Application for Verification
            </Button>
          </div>

          <div className="text-center text-xs text-slate-500 pt-2">
            Already have an active account?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
              Sign in to Portal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

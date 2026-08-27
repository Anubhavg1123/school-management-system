import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting clean production system configuration seeding...');

  // 1. System Roles
  const roles = [
    {
      name: 'SUPER_ADMIN',
      displayName: 'Principal / Super Administrator',
      description: 'Universal administrative access and executive authority across all modules.',
    },
    {
      name: 'OFFICE_ADMIN',
      displayName: 'Academic Office / Office Administrator',
      description: 'Manages student admissions, enrollment, fees, records, and institutional notices.',
    },
    {
      name: 'HOD',
      displayName: 'Head of Department (HOD)',
      description: 'Department-scoped management of faculty, classes, timetables, and department attendance.',
    },
    {
      name: 'FACULTY',
      displayName: 'Faculty / Teacher',
      description: 'Classroom management, student attendance, class coordinator tools, and academic tasks.',
    },
    {
      name: 'NON_FACULTY',
      displayName: 'Non-Faculty Staff',
      description: 'Operational and campus staff (Security, Drivers, Maintenance, Attenders).',
    },
    {
      name: 'STUDENT',
      displayName: 'Student Enrollee',
      description: 'Portal access for student academic records, timetable, and attendance.',
    },
    {
      name: 'PARENT',
      displayName: 'Parent / Guardian',
      description: 'Portal access for student attendance, academic reports, and school notices.',
    },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { displayName: r.displayName, description: r.description },
      create: r,
    });
  }
  console.log('✅ System roles seeded.');

  // 2. Granular Dot-Notation Permissions
  const permissions = [
    // Users IAM
    { code: 'users.view', module: 'USERS', description: 'View user accounts and rosters' },
    { code: 'users.create', module: 'USERS', description: 'Create pre-approved user accounts' },
    { code: 'users.edit', module: 'USERS', description: 'Modify user profiles and attributes' },
    { code: 'users.delete', module: 'USERS', description: 'Deactivate or suspend user accounts' },
    { code: 'users.approve', module: 'USERS', description: 'Approve applicant registration requests' },
    { code: 'users.reject', module: 'USERS', description: 'Reject applicant registration requests' },
    { code: 'users.roles.manage', module: 'USERS', description: 'Assign or remove roles and department scopes' },
    { code: 'users.unlock', module: 'USERS', description: 'Unlock locked user accounts' },

    // Academic & Students
    { code: 'dept.manage', module: 'ACADEMIC', description: 'Create and configure academic departments' },
    { code: 'academic.manage', module: 'ACADEMIC', description: 'Manage academic years, classes, and sections' },
    { code: 'students.view', module: 'ACADEMIC', description: 'View student academic profiles and guardian details' },
    { code: 'students.create', module: 'ACADEMIC', description: 'Process student admissions and enrollments' },
    { code: 'students.edit', module: 'ACADEMIC', description: 'Update student academic records and sections' },
    { code: 'faculty.assign', module: 'ACADEMIC', description: 'Assign faculty to subjects and class sections' },
    { code: 'rooms.manage', module: 'ACADEMIC', description: 'Configure classroom facilities and room capacities' },

    // Timetable & Scheduling
    { code: 'timetable.view', module: 'TIMETABLE', description: 'View institutional and departmental timetables' },
    { code: 'timetable.manage', module: 'TIMETABLE', description: 'Create, update, and publish class timetables' },
    { code: 'extraclass.manage', module: 'TIMETABLE', description: 'Request, review, and schedule extra classes' },
    { code: 'substitute.assign', module: 'TIMETABLE', description: 'Assign substitute faculty for absent teachers' },

    // Attendance
    { code: 'attendance.view', module: 'ATTENDANCE', description: 'View attendance records and metrics' },
    { code: 'attendance.create', module: 'ATTENDANCE', description: 'Check-in and check-out campus attendance' },
    { code: 'attendance.correct', module: 'ATTENDANCE', description: 'Submit attendance correction requests' },
    { code: 'attendance.approve', module: 'ATTENDANCE', description: 'Review and approve attendance corrections' },

    // Leave Management
    { code: 'leave.request', module: 'LEAVE', description: 'Submit faculty leave applications' },
    { code: 'leave.view', module: 'LEAVE', description: 'View faculty leave requests' },
    { code: 'leave.approve', module: 'LEAVE', description: 'Approve or reject faculty leave requests' },

    // Financial Records
    { code: 'fees.view', module: 'FEES', description: 'View student fee schedules and transactions' },
    { code: 'fees.create', module: 'FEES', description: 'Create fee structures and invoices' },
    { code: 'fees.edit', module: 'FEES', description: 'Modify fee ledger and adjustments' },
    { code: 'fees.payment', module: 'FEES', description: 'Process fee payments and issue receipts' },
    { code: 'fees.refund', module: 'FEES', description: 'Process fee payment refunds' },
    { code: 'fees.discount', module: 'FEES', description: 'Apply discounts and scholarships' },

    // Reports & Notices
    { code: 'reports.view', module: 'REPORTS', description: 'View institutional analytics and performance reports' },
    { code: 'reports.export', module: 'REPORTS', description: 'Export institutional reports to PDF/Excel' },
    { code: 'notices.create', module: 'NOTICES', description: 'Draft institutional bulletins and announcements' },
    { code: 'notices.send', module: 'NOTICES', description: 'Broadcast notices to faculty and students' },

    // Campus Security & Facilities
    { code: 'vehicles.register', module: 'FACILITIES', description: 'Register campus vehicles and parking permits' },
    { code: 'visitors.create', module: 'FACILITIES', description: 'Issue visitor campus passes' },
    { code: 'audit.view', module: 'AUDIT', description: 'Inspect system-wide security and operational audit logs' },
    { code: 'settings.manage', module: 'SETTINGS', description: 'Configure institution system settings and policies' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description, module: p.module },
      create: p,
    });
  }
  console.log('✅ System permissions seeded.');

  // 3. Map Permissions to Roles
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  const officeAdminRole = await prisma.role.findUnique({ where: { name: 'OFFICE_ADMIN' } });
  const hodRole = await prisma.role.findUnique({ where: { name: 'HOD' } });
  const facultyRole = await prisma.role.findUnique({ where: { name: 'FACULTY' } });
  const nonFacultyRole = await prisma.role.findUnique({ where: { name: 'NON_FACULTY' } });

  const allDbPermissions = await prisma.permission.findMany();

  // Super Admin gets all permissions
  if (superAdminRole) {
    for (const perm of allDbPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // Office Admin permissions
  const officePermCodes = [
    'users.view', 'users.approve', 'users.reject', 'students.view', 'students.create', 'students.edit',
    'academic.manage', 'dept.manage', 'faculty.assign', 'rooms.manage',
    'timetable.view', 'timetable.manage', 'extraclass.manage', 'substitute.assign',
    'attendance.view', 'attendance.create', 'attendance.correct', 'attendance.approve',
    'fees.view', 'fees.create', 'fees.edit', 'fees.payment', 'fees.refund', 'fees.discount',
    'reports.view', 'reports.export', 'notices.create', 'notices.send',
  ];
  if (officeAdminRole) {
    for (const code of officePermCodes) {
      const p = allDbPermissions.find((perm) => perm.code === code);
      if (p) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: officeAdminRole.id, permissionId: p.id } },
          update: {},
          create: { roleId: officeAdminRole.id, permissionId: p.id },
        });
      }
    }
  }

  // HOD permissions
  const hodPermCodes = [
    'users.view', 'students.view', 'faculty.assign',
    'timetable.view', 'timetable.manage', 'extraclass.manage', 'substitute.assign',
    'attendance.view', 'attendance.create', 'attendance.correct', 'attendance.approve',
    'leave.view', 'leave.approve', 'leave.request', 'reports.view', 'notices.create',
  ];
  if (hodRole) {
    for (const code of hodPermCodes) {
      const p = allDbPermissions.find((perm) => perm.code === code);
      if (p) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: hodRole.id, permissionId: p.id } },
          update: {},
          create: { roleId: hodRole.id, permissionId: p.id },
        });
      }
    }
  }

  // Faculty permissions
  const facultyPermCodes = [
    'users.view', 'students.view', 'timetable.view', 'extraclass.manage',
    'attendance.view', 'attendance.create', 'attendance.correct',
    'leave.request', 'leave.view', 'reports.view',
  ];
  if (facultyRole) {
    for (const code of facultyPermCodes) {
      const p = allDbPermissions.find((perm) => perm.code === code);
      if (p) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: facultyRole.id, permissionId: p.id } },
          update: {},
          create: { roleId: facultyRole.id, permissionId: p.id },
        });
      }
    }
  }

  // Non-Faculty permissions
  const nonFacultyPermCodes = [
    'attendance.create', 'attendance.view', 'vehicles.register', 'visitors.create',
  ];
  if (nonFacultyRole) {
    for (const code of nonFacultyPermCodes) {
      const p = allDbPermissions.find((perm) => perm.code === code);
      if (p) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: nonFacultyRole.id, permissionId: p.id } },
          update: {},
          create: { roleId: nonFacultyRole.id, permissionId: p.id },
        });
      }
    }
  }

  console.log('✅ Role-Permission mappings configured.');

  // 4. Default Fee Categories
  const feeCategories = [
    { code: 'TUITION', name: 'Tuition Fee', description: 'Core instructional and academic course tuition.' },
    { code: 'ADMISSION', name: 'Admission & Registration Fee', description: 'One-time initial enrollment fee.' },
    { code: 'EXAM', name: 'Examination & Assessment Fee', description: 'Term/annual examinations and evaluation processing.' },
    { code: 'LAB', name: 'Laboratory & Practical Fee', description: 'Computer, Science, and specialized laboratory usage.' },
    { code: 'LIBRARY', name: 'Library & Learning Resource Fee', description: 'Library access, books, and online journals.' },
    { code: 'TRANSPORT', name: 'Campus Transportation Fee', description: 'Institutional bus routing and shuttle services.' },
    { code: 'SPORTS', name: 'Athletics & Sports Fee', description: 'Sports facilities, physical education, and tournament gear.' },
    { code: 'ACTIVITY', name: 'Student Activity & Cultural Fee', description: 'Clubs, events, seminars, and extracurricular activities.' },
    { code: 'OTHER', name: 'Miscellaneous Institutional Fee', description: 'Other approved institutional expenses.' },
  ];

  for (const cat of feeCategories) {
    await prisma.feeCategory.upsert({
      where: { code: cat.code },
      update: { name: cat.name, description: cat.description },
      create: cat,
    });
  }
  console.log('✅ Standard Fee Categories seeded.');

  // 5. System Settings (No fake/pre-filled academic year)
  const settings = [
    {
      category: 'GENERAL',
      key: 'institution_name',
      value: 'St. Lawrence Public School',
      isPublic: true,
      description: 'Official name of the school.',
    },
    {
      category: 'GENERAL',
      key: 'institution_code',
      value: 'SLA-2026',
      isPublic: true,
      description: 'Institutional identification code.',
    },
    {
      category: 'ACADEMIC',
      key: 'active_academic_year',
      value: '',
      isPublic: true,
      description: 'Current academic year cycle (configured by administrator).',
    },
    {
      category: 'TIMETABLE',
      key: 'periods_per_day',
      value: '6',
      isPublic: true,
      description: 'Standard number of instructional lecture periods per day.',
    },
    {
      category: 'ATTENDANCE',
      key: 'attendance_start_time',
      value: '09:00',
      isPublic: true,
      description: 'Standard campus reporting time (HH:MM).',
    },
    {
      category: 'ATTENDANCE',
      key: 'attendance_submission_window_minutes',
      value: '120',
      isPublic: true,
      description: 'Permitted minutes after class end time to submit/finalize attendance.',
    },
    {
      category: 'ATTENDANCE',
      key: 'minimum_required_attendance_percentage',
      value: '75',
      isPublic: true,
      description: 'Institutional threshold percentage for low attendance warnings.',
    },
    {
      category: 'ATTENDANCE',
      key: 'allow_extra_class_unapproved_attendance',
      value: 'false',
      isPublic: false,
      description: 'Whether attendance slots can be opened for unapproved extra class requests.',
    },
    {
      category: 'SECURITY',
      key: 'max_login_attempts',
      value: '5',
      isPublic: false,
      description: 'Maximum consecutive failed login attempts before lockout.',
    },
    {
      category: 'SECURITY',
      key: 'account_lockout_duration_minutes',
      value: '15',
      isPublic: false,
      description: 'Temporary lockout duration in minutes.',
    },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, category: s.category, description: s.description, isPublic: s.isPublic },
      create: s,
    });
  }
  console.log('✅ System settings seeded.');

  // 6. Initial Super Administrator Account (Principal)
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'principal@school.edu';
  const adminUsername = process.env.INITIAL_ADMIN_USERNAME || 'principal';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Anubhavg@2006';
  const adminFirstName = process.env.INITIAL_ADMIN_FIRSTNAME || 'Arthur';
  const adminLastName = process.env.INITIAL_ADMIN_LASTNAME || 'Pendleton';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      username: adminUsername,
      passwordHash,
      status: 'ACTIVE',
      activeRole: 'SUPER_ADMIN',
      firstName: adminFirstName,
      lastName: adminLastName,
      userCategory: 'ADMINISTRATIVE',
      whatsAppNumber: '+1-555-0100',
    },
    create: {
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      firstName: adminFirstName,
      lastName: adminLastName,
      status: 'ACTIVE',
      activeRole: 'SUPER_ADMIN',
      userCategory: 'ADMINISTRATIVE',
      whatsAppNumber: '+1-555-0100',
    },
  });

  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      },
      update: { isPrimary: true },
      create: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
        isPrimary: true,
      },
    });
  }

  console.log(`✅ Initial Super Administrator (Principal) verified: ${adminEmail}`);
  console.log('🌱 Clean production seeding completed successfully with ZERO demo institutional records.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

-- AlterTable
ALTER TABLE "RegistrationRequest" ADD COLUMN "address" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN "altPhone" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN "dob" DATETIME;
ALTER TABLE "RegistrationRequest" ADD COLUMN "emergencyContactName" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN "emergencyContactPhone" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN "employeeIdSuggested" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN "gender" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "RegistrationRequest" ADD COLUMN "reviewedByUserId" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN "reviewerNotes" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN "userCategory" TEXT;
ALTER TABLE "RegistrationRequest" ADD COLUMN "whatsAppNumber" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "address" TEXT;
ALTER TABLE "User" ADD COLUMN "altPhone" TEXT;
ALTER TABLE "User" ADD COLUMN "dob" DATETIME;
ALTER TABLE "User" ADD COLUMN "emergencyContactName" TEXT;
ALTER TABLE "User" ADD COLUMN "emergencyContactPhone" TEXT;
ALTER TABLE "User" ADD COLUMN "gender" TEXT;
ALTER TABLE "User" ADD COLUMN "idProofNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "idProofType" TEXT;
ALTER TABLE "User" ADD COLUMN "userCategory" TEXT;
ALTER TABLE "User" ADD COLUMN "whatsAppNumber" TEXT;

-- CreateTable
CREATE TABLE "FacultyLeave" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "facultyId" TEXT,
    "leaveType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "totalDays" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedByUserId" TEXT,
    "reviewedAt" DATETIME,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FacultyLeave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FacultyLeave_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FacultyLeave_userId_idx" ON "FacultyLeave"("userId");

-- CreateIndex
CREATE INDEX "FacultyLeave_status_idx" ON "FacultyLeave"("status");

-- CreateIndex
CREATE INDEX "Permission_code_idx" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "RegistrationRequest_createdAt_idx" ON "RegistrationRequest"("createdAt");

-- CreateIndex
CREATE INDEX "User_userCategory_idx" ON "User"("userCategory");

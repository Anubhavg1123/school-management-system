-- CreateTable
CREATE TABLE "StudentTransferLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "fromAcademicYearId" TEXT,
    "toAcademicYearId" TEXT,
    "fromDepartmentId" TEXT,
    "toDepartmentId" TEXT,
    "fromClassId" TEXT,
    "toClassId" TEXT,
    "fromSectionId" TEXT,
    "toSectionId" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "transferType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "effectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferredByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentTransferLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentDocument_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "enrollmentNumber" TEXT,
    "rollNumber" TEXT,
    "academicYearId" TEXT,
    "departmentId" TEXT,
    "sectionId" TEXT,
    "admissionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "bloodGroup" TEXT,
    "emergencyContact" TEXT,
    "previousSchool" TEXT,
    "previousGrade" TEXT,
    "previousScore" TEXT,
    "photoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Student_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("admissionDate", "admissionNumber", "bloodGroup", "createdAt", "dateOfBirth", "emergencyContact", "gender", "id", "rollNumber", "sectionId", "status", "updatedAt", "userId") SELECT "admissionDate", "admissionNumber", "bloodGroup", "createdAt", "dateOfBirth", "emergencyContact", "gender", "id", "rollNumber", "sectionId", "status", "updatedAt", "userId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
CREATE UNIQUE INDEX "Student_admissionNumber_key" ON "Student"("admissionNumber");
CREATE UNIQUE INDEX "Student_enrollmentNumber_key" ON "Student"("enrollmentNumber");
CREATE INDEX "Student_admissionNumber_idx" ON "Student"("admissionNumber");
CREATE INDEX "Student_enrollmentNumber_idx" ON "Student"("enrollmentNumber");
CREATE INDEX "Student_status_idx" ON "Student"("status");
CREATE INDEX "Student_departmentId_idx" ON "Student"("departmentId");
CREATE INDEX "Student_academicYearId_idx" ON "Student"("academicYearId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "StudentTransferLog_studentId_idx" ON "StudentTransferLog"("studentId");

-- CreateIndex
CREATE INDEX "StudentTransferLog_transferType_idx" ON "StudentTransferLog"("transferType");

-- CreateIndex
CREATE INDEX "StudentTransferLog_effectiveDate_idx" ON "StudentTransferLog"("effectiveDate");

-- CreateIndex
CREATE INDEX "StudentDocument_studentId_idx" ON "StudentDocument"("studentId");

-- CreateIndex
CREATE INDEX "StudentDocument_docType_idx" ON "StudentDocument"("docType");

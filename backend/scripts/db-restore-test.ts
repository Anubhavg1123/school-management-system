import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { createDatabaseBackup } from './db-backup';

export interface RestoreVerificationResult {
  success: boolean;
  backupFile: string;
  verifiedChecksum: boolean;
  metrics: {
    usersCount: number;
    studentsCount: number;
    rolesCount: number;
    classesCount: number;
    examinationsCount: number;
  };
  durationMs: number;
}

export const runRestoreVerification = async (backupFilePath?: string): Promise<RestoreVerificationResult> => {
  const startTime = Date.now();
  let targetBackup = backupFilePath;

  // If no backup provided, create a fresh one for testing
  if (!targetBackup) {
    const backupRes = createDatabaseBackup();
    targetBackup = backupRes.backupPath;
  }

  // 1. Verify Checksum
  const checksumFile = `${targetBackup}.sha256`;
  let verifiedChecksum = false;
  if (fs.existsSync(checksumFile)) {
    const expectedHash = fs.readFileSync(checksumFile, 'utf-8').trim();
    const fileBuffer = fs.readFileSync(targetBackup);
    const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    verifiedChecksum = expectedHash === actualHash;
    if (!verifiedChecksum) {
      throw new Error(`Checksum mismatch! Expected ${expectedHash}, got ${actualHash}`);
    }
  }

  // 2. Restore to isolated test database inside prisma folder
  const dbFileName = `isolated-restore-${Date.now()}.db`;
  const isolatedDbPath = path.resolve(__dirname, `../prisma/${dbFileName}`);
  fs.copyFileSync(targetBackup, isolatedDbPath);

  // 3. Connect Prisma to isolated DB
  const testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:./${dbFileName}`,
      },
    },
  });

  try {
    await testPrisma.$connect();

    // 4. Validate Table Counts
    const usersCount = await testPrisma.user.count();
    const studentsCount = await testPrisma.student.count();
    const rolesCount = await testPrisma.role.count();
    const classesCount = await testPrisma.class.count();
    const examinationsCount = await testPrisma.examination.count();

    await testPrisma.$disconnect();

    // 5. Cleanup isolated DB
    if (fs.existsSync(isolatedDbPath)) {
      try {
        fs.unlinkSync(isolatedDbPath);
      } catch {
        // Ignore file lock on Windows
      }
    }

    return {
      success: true,
      backupFile: targetBackup,
      verifiedChecksum,
      metrics: {
        usersCount,
        studentsCount,
        rolesCount,
        classesCount,
        examinationsCount,
      },
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    await testPrisma.$disconnect();
    if (fs.existsSync(isolatedDbPath)) {
      try {
        fs.unlinkSync(isolatedDbPath);
      } catch {
        // Ignore file lock on Windows
      }
    }
    throw err;
  }
};

if (require.main === module) {
  runRestoreVerification()
    .then((res) => {
      console.log('[RESTORE VERIFICATION] Verification completed successfully:');
      console.log(` - Backup File: ${res.backupFile}`);
      console.log(` - Checksum Valid: ${res.verifiedChecksum}`);
      console.log(` - Users Verified: ${res.metrics.usersCount}`);
      console.log(` - Students Verified: ${res.metrics.studentsCount}`);
      console.log(` - Roles Verified: ${res.metrics.rolesCount}`);
      console.log(` - Duration: ${res.durationMs}ms`);
    })
    .catch((err) => {
      console.error('[RESTORE VERIFICATION] Restore test failed:', err);
      process.exit(1);
    });
}

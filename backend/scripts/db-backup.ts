import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface BackupResult {
  success: boolean;
  backupPath: string;
  checksum: string;
  sizeBytes: number;
  timestamp: string;
}

export const createDatabaseBackup = (customBackupDir?: string): BackupResult => {
  const sourceDbPath = path.resolve(__dirname, '../prisma/dev.db');
  const backupDir = customBackupDir || path.resolve(__dirname, '../backups');

  if (!fs.existsSync(sourceDbPath)) {
    throw new Error(`Source database file not found at: ${sourceDbPath}`);
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `school-db-backup-${timestamp}.db`;
  const targetBackupPath = path.join(backupDir, backupFileName);

  // Copy database file atomically
  fs.copyFileSync(sourceDbPath, targetBackupPath);

  // Calculate SHA-256 Checksum
  const fileBuffer = fs.readFileSync(targetBackupPath);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const stats = fs.statSync(targetBackupPath);

  // Write checksum file
  fs.writeFileSync(`${targetBackupPath}.sha256`, hash);

  return {
    success: true,
    backupPath: targetBackupPath,
    checksum: hash,
    sizeBytes: stats.size,
    timestamp: new Date().toISOString(),
  };
};

if (require.main === module) {
  try {
    console.log('[DB BACKUP] Starting database backup...');
    const result = createDatabaseBackup();
    console.log('[DB BACKUP] Backup created successfully:');
    console.log(` - File: ${result.backupPath}`);
    console.log(` - Size: ${(result.sizeBytes / 1024).toFixed(2)} KB`);
    console.log(` - SHA256: ${result.checksum}`);
  } catch (err: any) {
    console.error('[DB BACKUP] Backup failed:', err.message);
    process.exit(1);
  }
}

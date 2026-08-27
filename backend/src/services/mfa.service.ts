import crypto from 'crypto';
import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export class MfaService {
  /**
   * Generates a 32-character base32 secret for TOTP setup
   */
  static generateSecret(): string {
    const buffer = crypto.randomBytes(20);
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < buffer.length; i++) {
      secret += base32Chars[buffer[i] % 32];
    }
    return secret;
  }

  /**
   * Generates standard 6-digit TOTP code for a given secret and time step (30s)
   */
  static generateTOTP(secret: string, timeStepWindow = 0): string {
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(epoch / 30) + timeStepWindow;

    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigInt64BE(BigInt(timeStep), 0);

    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'utf-8'));
    hmac.update(timeBuffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0xf;
    const binary =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    const otp = (binary % 1000000).toString().padStart(6, '0');
    return otp;
  }

  /**
   * Verifies TOTP token allowing ±1 time step tolerance (for clock drift)
   */
  static verifyTOTP(secret: string, token: string): boolean {
    if (!token || token.length !== 6) return false;
    for (let window = -1; window <= 1; window++) {
      const generated = this.generateTOTP(secret, window);
      if (generated === token) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generates 8 single-use backup recovery codes
   */
  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Sets up MFA initiation for a user
   */
  static async initiateMfaSetup(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();
    const otpAuthUrl = `otpauth://totp/SchoolApp:${encodeURIComponent(user.email)}?secret=${secret}&issuer=SchoolApp`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret,
        mfaBackupCodes: JSON.stringify(backupCodes),
      },
    });

    return {
      secret,
      otpAuthUrl,
      backupCodes,
    };
  }

  /**
   * Confirms & activates MFA for user with initial verification token
   */
  static async confirmAndEnableMfa(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) {
      throw new AppError('MFA setup has not been initiated.', 400, 'MFA_NOT_INITIATED');
    }

    const isValid = this.verifyTOTP(user.mfaSecret, token);
    if (!isValid) {
      throw new AppError('Invalid 6-digit MFA verification code.', 400, 'INVALID_MFA_TOKEN');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isMfaEnabled: true,
      },
    });

    return {
      isMfaEnabled: true,
      message: 'Multi-Factor Authentication enabled successfully.',
    };
  }

  /**
   * Disables MFA for user
   */
  static async disableMfa(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isMfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
      },
    });

    return {
      isMfaEnabled: false,
      message: 'Multi-Factor Authentication disabled.',
    };
  }
}

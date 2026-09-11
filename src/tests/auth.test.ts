import { describe, it, expect, beforeEach } from 'vitest';
import {
  authenticatePinCredentials,
  hashPinServer,
  verifyPinServer,
  BOOTSTRAP_SUPER_OWNER_EMAIL,
} from '../server/authHandler';
import { UserProfile } from '../types';

describe('HunarOS Authentication Verification Suite', () => {
  let mockVault: Record<string, UserProfile>;

  beforeEach(() => {
    mockVault = {};

    // 1. Seed Active Staff User with valid PIN
    const { hash: staffHash, salt: staffSalt } = hashPinServer('654321');
    mockVault['user-staff-1'] = {
      uid: 'user-staff-1',
      email: 'staff@lahore-institute.edu.pk',
      displayName: 'Fatima Zahra',
      role: 'STAFF',
      accountStatus: 'ACTIVE',
      pinHash: staffHash,
      pinSalt: staffSalt,
      defaultOrgId: 'org-lahore-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. Seed Suspended User
    const { hash: suspHash, salt: suspSalt } = hashPinServer('112233');
    mockVault['user-suspended-1'] = {
      uid: 'user-suspended-1',
      email: 'suspended@lahore-institute.edu.pk',
      displayName: 'Suspended Staff',
      role: 'STAFF',
      accountStatus: 'SUSPENDED',
      pinHash: suspHash,
      pinSalt: suspSalt,
      defaultOrgId: 'org-lahore-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Seed Disabled User
    const { hash: disHash, salt: disSalt } = hashPinServer('998877');
    mockVault['user-disabled-1'] = {
      uid: 'user-disabled-1',
      email: 'disabled@lahore-institute.edu.pk',
      displayName: 'Disabled Staff',
      role: 'COORDINATOR',
      accountStatus: 'DISABLED',
      pinHash: disHash,
      pinSalt: disSalt,
      defaultOrgId: 'org-lahore-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  describe('PIN Credential Cryptography', () => {
    it('generates distinct salt and hash for the same PIN (anti-rainbow table)', () => {
      const pin = '123456';
      const c1 = hashPinServer(pin);
      const c2 = hashPinServer(pin);

      expect(c1.salt).not.toEqual(c2.salt);
      expect(c1.hash).not.toEqual(c2.hash);
      expect(verifyPinServer(pin, c1.hash, c1.salt)).toBe(true);
      expect(verifyPinServer(pin, c2.hash, c2.salt)).toBe(true);
    });

    it('rejects incorrect PIN for a stored hash and salt', () => {
      const pin = '123456';
      const wrongPin = '654321';
      const creds = hashPinServer(pin);

      expect(verifyPinServer(wrongPin, creds.hash, creds.salt)).toBe(false);
    });
  });

  describe('Server-Side Authentication & Session Issuance', () => {
    it('authenticates ACTIVE user with valid PIN, issues legitimate Custom Token', async () => {
      const result = await authenticatePinCredentials(
        'staff@lahore-institute.edu.pk',
        '654321',
        mockVault
      );

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.customToken).toBeDefined();
      expect(result.userProfile?.uid).toBe('user-staff-1');
      expect(result.userProfile?.role).toBe('STAFF');
      expect(result.userProfile?.accountStatus).toBe('ACTIVE');
    });

    it('rejects ACTIVE user with invalid PIN', async () => {
      const result = await authenticatePinCredentials(
        'staff@lahore-institute.edu.pk',
        'wrong-pin',
        mockVault
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe('INVALID_CREDENTIALS');
      expect(result.customToken).toBeUndefined();
    });

    it('rejects SUSPENDED account from obtaining a session even with correct PIN', async () => {
      const result = await authenticatePinCredentials(
        'suspended@lahore-institute.edu.pk',
        '112233',
        mockVault
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(403);
      expect(result.error).toBe('ACCOUNT_SUSPENDED');
      expect(result.customToken).toBeUndefined();
    });

    it('rejects DISABLED account from obtaining a session even with correct PIN', async () => {
      const result = await authenticatePinCredentials(
        'disabled@lahore-institute.edu.pk',
        '998877',
        mockVault
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(403);
      expect(result.error).toBe('ACCOUNT_DISABLED');
      expect(result.customToken).toBeUndefined();
    });

    it('rejects an unregistered email (strictly enforces Zero-Public-Registration policy)', async () => {
      const result = await authenticatePinCredentials(
        'random-stranger@gmail.com',
        '123456',
        mockVault
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe('USER_NOT_FOUND');
      expect(result.customToken).toBeUndefined();
    });

    it('strictly rejects unauthorized bootstrap PIN bypass when user is not in vault', async () => {
      const result = await authenticatePinCredentials(
        BOOTSTRAP_SUPER_OWNER_EMAIL,
        '123456',
        mockVault
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe('USER_NOT_FOUND');
      expect(result.customToken).toBeUndefined();
    });
  });
});

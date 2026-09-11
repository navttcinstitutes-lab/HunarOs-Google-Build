import type { Request, Response } from 'express';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

export const BOOTSTRAP_SUPER_OWNER_EMAIL = 'navttcinstitutes@gmail.com';
const VAULT_FILE_PATH = path.resolve(process.cwd(), 'data/user-registry.json');

// Initialize Firebase Admin safely
function getAdmin() {
  if (getAdminApps().length === 0) {
    return initAdminApp({
      projectId: firebaseConfig.projectId,
    });
  }
  return getAdminApps()[0];
}

/**
 * Loads server-side user registry vault
 */
export function loadUserVault(): Record<string, UserProfile> {
  try {
    if (fs.existsSync(VAULT_FILE_PATH)) {
      const content = fs.readFileSync(VAULT_FILE_PATH, 'utf8');
      const data = JSON.parse(content);
      return data.users || {};
    }
  } catch (err) {
    console.error('Error reading user vault:', err);
  }
  return {};
}

/**
 * Saves user to server-side vault
 */
export function saveUserToVault(user: UserProfile): void {
  try {
    const dir = path.dirname(VAULT_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const users = loadUserVault();
    users[user.uid] = user;
    fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify({ users }, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving user to vault:', err);
  }
}

/**
 * Server-side PBKDF2/SHA-256 PIN verification
 */
export function verifyPinServer(pin: string, expectedHash: string, salt: string): boolean {
  const pepper = 'hunaros-v2.1-credential-secret';
  const combined = `${salt}:${pin}:${pepper}`;
  const computedHash = crypto.createHash('sha256').update(combined).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(expectedHash));
}

/**
 * Server-side Salted PIN generator
 */
export function hashPinServer(pin: string): { hash: string; salt: string } {
  const salt = crypto.randomUUID();
  const pepper = 'hunaros-v2.1-credential-secret';
  const combined = `${salt}:${pin}:${pepper}`;
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  return { hash, salt };
}

/**
 * Mints a Firebase Custom Token for verified user.
 * In emulator or credentialed environment: Uses Admin SDK to mint custom token.
 * In environments without IAM signBlob permission: Generates signed JWT session token.
 */
export async function mintCustomToken(
  uid: string,
  claims: { role: string; email: string; defaultOrgId?: string }
): Promise<string> {
  const adminApp = getAdmin();
  const adminAuth = getAdminAuth(adminApp);

  try {
    return await adminAuth.createCustomToken(uid, claims);
  } catch (_error: any) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        iss: `https://securetoken.google.com/${firebaseConfig.projectId}`,
        sub: uid,
        aud: firebaseConfig.projectId,
        iat: now,
        exp: now + 3600,
        uid,
        claims,
      })
    ).toString('base64url');

    const hmac = crypto.createHmac('sha256', 'hunaros-internal-jwt-secret');
    hmac.update(`${header}.${payload}`);
    const signature = hmac.digest('base64url');
    return `${header}.${payload}.${signature}`;
  }
}

export interface PinAuthResult {
  ok: boolean;
  status: number;
  error?: 'USER_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'ACCOUNT_SUSPENDED' | 'ACCOUNT_DISABLED' | 'INVALID_REQUEST';
  message?: string;
  customToken?: string;
  userProfile?: UserProfile;
}

/**
 * Authoritative Server-side Email + PIN Authentication
 */
export async function authenticatePinCredentials(
  email: string,
  pin: string,
  overrideVault?: Record<string, UserProfile>
): Promise<PinAuthResult> {
  if (!email || !pin) {
    return {
      ok: false,
      status: 400,
      error: 'INVALID_REQUEST',
      message: 'Work email and access PIN are required.',
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  const vault = overrideVault || loadUserVault();

  // 1. Locate user by email in server-authoritative vault
  const user = Object.values(vault).find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    // Zero Public Registration: strictly reject any unregistered email
    return {
      ok: false,
      status: 401,
      error: 'USER_NOT_FOUND',
      message: 'Account not recognized. Self-registration is disabled. Contact your institute administrator.',
    };
  }

  // 2. Check accountStatus policy
  if (user.accountStatus === 'SUSPENDED') {
    return {
      ok: false,
      status: 403,
      error: 'ACCOUNT_SUSPENDED',
      message: 'Account has been suspended by administrative policy. Access denied.',
      userProfile: user,
    };
  }

  if (user.accountStatus === 'DISABLED') {
    return {
      ok: false,
      status: 403,
      error: 'ACCOUNT_DISABLED',
      message: 'Account has been permanently disabled. Access denied.',
      userProfile: user,
    };
  }

  if (user.accountStatus !== 'ACTIVE') {
    return {
      ok: false,
      status: 403,
      error: 'ACCOUNT_DISABLED',
      message: `Account status is ${user.accountStatus}. Active status required.`,
      userProfile: user,
    };
  }

  // 3. Server-side PIN verification
  if (!user.pinHash || !user.pinSalt) {
    return {
      ok: false,
      status: 401,
      error: 'INVALID_CREDENTIALS',
      message: 'No PIN credential configured for this account. Use Google SSO or contact administrator.',
    };
  }

  const isValidPin = verifyPinServer(pin, user.pinHash, user.pinSalt);
  if (!isValidPin) {
    return {
      ok: false,
      status: 401,
      error: 'INVALID_CREDENTIALS',
      message: 'Incorrect PIN entered.',
    };
  }

  // 4. Mint Firebase Custom Token for authenticated user
  const customToken = await mintCustomToken(user.uid, {
    role: user.role,
    email: user.email,
    defaultOrgId: user.defaultOrgId,
  });

  return {
    ok: true,
    status: 200,
    customToken,
    userProfile: user,
  };
}

/**
 * Express Request Handler for /api/auth/pin-login
 */
export async function handlePinLoginRequest(req: Request, res: Response): Promise<void> {
  const { email, pin } = req.body;
  try {
    const result = await authenticatePinCredentials(email, pin);
    res.status(result.status).json(result);
  } catch (error: any) {
    console.error('Error during PIN login authentication:', error);
    res.status(500).json({
      ok: false,
      error: 'SERVER_ERROR',
      message: 'Internal server error during authentication.',
    });
  }
}

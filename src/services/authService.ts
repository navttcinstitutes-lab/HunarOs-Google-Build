import {
  GoogleAuthProvider,
  signInWithCustomToken,
  signInWithPopup,
  signOut as fbSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { hashPin, verifyPin } from '../lib/crypto';
import { auth, db, handleFirestoreError, OperationType, cleanFirestoreData } from '../lib/firebase';
import { StaffCreationPayload, UserProfile } from '../types';
import { logAuditEvent } from './auditService';

export const BOOTSTRAP_SUPER_OWNER_EMAIL = 'navttcinstitutes@gmail.com';

export interface AuthGateResult {
  isAuthorized: boolean;
  userProfile: UserProfile | null;
  denialReason?: 'UNAUTHORIZED' | 'SUSPENDED' | 'DISABLED' | 'NOT_FOUND';
}

/**
 * Validates and ensures user profile authorization in HunarOS
 */
export async function resolveUserProfile(firebaseUser: FirebaseUser): Promise<AuthGateResult> {
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const path = `users/${firebaseUser.uid}`;

  try {
    const userDoc = await getDoc(userDocRef);

    // Bootstrap Super Owner logic
    if (firebaseUser.email?.toLowerCase() === BOOTSTRAP_SUPER_OWNER_EMAIL.toLowerCase()) {
      if (!userDoc.exists()) {
        const now = new Date().toISOString();
        const superOwnerProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'Super Owner',
          role: 'SUPER_OWNER',
          accountStatus: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userDocRef, cleanFirestoreData(superOwnerProfile));
        await logAuditEvent('global', 'BOOTSTRAP_SUPER_OWNER_PROVISIONED', 'USER', firebaseUser.uid);
        return { isAuthorized: true, userProfile: superOwnerProfile };
      } else {
        const profile = userDoc.data() as UserProfile;
        return { isAuthorized: true, userProfile: profile };
      }
    }

    // Standard user authorization verification
    if (!userDoc.exists()) {
      // Check if user was provisioned with this email before first sign-in
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '==', firebaseUser.email?.toLowerCase())
      );
      const emailSnap = await getDocs(emailQuery);

      if (!emailSnap.empty) {
        const existingData = emailSnap.docs[0].data() as UserProfile;
        // Migrate to actual Firebase Auth UID if provisioned with placeholder ID
        if (existingData.uid !== firebaseUser.uid) {
          const now = new Date().toISOString();
          const migratedProfile: UserProfile = {
            ...existingData,
            uid: firebaseUser.uid,
            updatedAt: now,
          };
          await setDoc(userDocRef, cleanFirestoreData(migratedProfile));
          return checkStatus(migratedProfile);
        }
        return checkStatus(existingData);
      }

      // Deny access if not pre-authorized
      return { isAuthorized: false, userProfile: null, denialReason: 'UNAUTHORIZED' };
    }

    const profile = userDoc.data() as UserProfile;
    return checkStatus(profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

function checkStatus(profile: UserProfile): AuthGateResult {
  if (profile.accountStatus === 'ACTIVE') {
    return { isAuthorized: true, userProfile: profile };
  }
  return {
    isAuthorized: false,
    userProfile: profile,
    denialReason: profile.accountStatus as 'SUSPENDED' | 'DISABLED',
  };
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<AuthGateResult> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const gateResult = await resolveUserProfile(result.user);

  if (!gateResult.isAuthorized) {
    // If not authorized in HunarOS, immediately sign out of Firebase Auth to ensure zero leakage
    await fbSignOut(auth);
  }

  return gateResult;
}

/**
 * Internal Email + PIN Authentication via Authoritative Server Endpoint
 * Mints and authenticates via Firebase Custom Token so that request.auth.uid is available to Firestore rules
 */
export async function signInWithEmailAndPin(email: string, pin: string): Promise<AuthGateResult> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const response = await fetch('/api/auth/pin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: cleanEmail, pin }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        isAuthorized: false,
        userProfile: data.userProfile || null,
        denialReason: (data.error === 'ACCOUNT_SUSPENDED'
          ? 'SUSPENDED'
          : data.error === 'ACCOUNT_DISABLED'
          ? 'DISABLED'
          : data.error === 'USER_NOT_FOUND'
          ? 'NOT_FOUND'
          : 'UNAUTHORIZED') as 'UNAUTHORIZED' | 'SUSPENDED' | 'DISABLED' | 'NOT_FOUND',
      };
    }

    // Authenticate client with minted custom token if provided
    if (data.customToken) {
      try {
        await signInWithCustomToken(auth, data.customToken);
      } catch (authError) {
        console.warn('Firebase Custom Token client exchange:', authError);
        // CRITICAL: If custom token sign-in fails and auth.currentUser is not established,
        // we must not grant an authorized session, because all Firestore operations will fail
        // with "Missing or insufficient permissions".
        if (!auth.currentUser) {
          throw new Error(
            'Database authentication requires signing in with your authorized Google Account.'
          );
        }
      }
    } else if (!auth.currentUser) {
      throw new Error(
        'Database connection requires Google Authentication. Please sign in with your authorized Google account.'
      );
    }

    return {
      isAuthorized: true,
      userProfile: data.userProfile,
    };
  } catch (error: any) {
    console.error('PIN Authentication error:', error);
    return {
      isAuthorized: false,
      userProfile: null,
      denialReason: 'UNAUTHORIZED',
    };
  }
}

/**
 * Provision new staff account (requires authorized creator)
 */
export async function createStaffAccount(
  creator: UserProfile,
  payload: StaffCreationPayload
): Promise<UserProfile> {
  // Authorization check
  const isAuthorizedCreator =
    creator.role === 'SUPER_OWNER' ||
    creator.role === 'SUPER_ADMIN' ||
    creator.role === 'ADMIN' ||
    creator.role === 'COORDINATOR';

  if (!isAuthorizedCreator) {
    throw new Error('Forbidden: Insufficient permissions to create staff accounts.');
  }

  const { hash, salt } = await hashPin(payload.initialPin);
  const staffUid = `staff-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newStaff: UserProfile = cleanFirestoreData({
    uid: staffUid,
    email: payload.email.trim().toLowerCase(),
    displayName: payload.name.trim(),
    role: payload.role,
    accountStatus: 'ACTIVE',
    phone: payload.contactPhone?.trim() || undefined,
    cnic: payload.cnic?.trim() || undefined,
    pinHash: hash,
    pinSalt: salt,
    defaultOrgId: payload.organizationId,
    createdAt: now,
    updatedAt: now,
  });

  const path = `users/${staffUid}`;
  try {
    // 1. Write user profile
    await setDoc(doc(db, 'users', staffUid), newStaff);

    // 2. Write organization membership
    const membershipId = `mem-${staffUid}-${payload.organizationId}`;
    await setDoc(doc(db, 'organizations', payload.organizationId, 'members', staffUid), cleanFirestoreData({
      id: membershipId,
      userId: staffUid,
      organizationId: payload.organizationId,
      role: payload.role,
      permissions: payload.permissions || ['read_records'],
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    }));

    // 3. Log audit event
    await logAuditEvent(
      payload.organizationId,
      'STAFF_ACCOUNT_CREATED',
      'USER',
      staffUid,
      {
        createdEmail: newStaff.email,
        role: newStaff.role,
        creatorUid: creator.uid,
      }
    );

    return newStaff;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateStaffAccount(
  uid: string,
  organizationId: string,
  payload: Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt' | 'pinHash' | 'pinSalt'>>,
  membershipPayload?: { role?: string; permissions?: string[]; status?: string }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const now = new Date().toISOString();
    const updateData = cleanFirestoreData({
      ...payload,
      updatedAt: now,
    });
    
    await updateDoc(doc(db, 'users', uid), updateData);
    
    if (membershipPayload) {
      const membershipUpdate = cleanFirestoreData({
        ...membershipPayload,
        updatedAt: now,
      });
      await updateDoc(doc(db, 'organizations', organizationId, 'members', uid), membershipUpdate);
    }
    
    await logAuditEvent(organizationId, 'STAFF_ACCOUNT_UPDATED', 'USER', uid, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStaffAccount(uid: string, organizationId: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    // Delete membership first to avoid orphaned records
    await deleteDoc(doc(db, 'organizations', organizationId, 'members', uid));
    
    // Delete user profile
    await deleteDoc(doc(db, 'users', uid));
    
    await logAuditEvent(organizationId, 'STAFF_ACCOUNT_DELETED', 'USER', uid, { deletedUid: uid });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

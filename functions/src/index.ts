import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (getApps().length === 0) {
  initializeApp();
}
const db = getFirestore();

setGlobalOptions({
  region: 'asia-south1',
  maxInstances: 10,
});

/**
 * Health check — verifies Cloud Functions deployment is working.
 * Requires authentication.
 */
export const healthCheck = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }
  return {
    ok: true,
    uid: request.auth.uid,
    timestamp: new Date().toISOString(),
  };
});

/**
 * Bootstrap self-provisioning.
 *
 * Creates the initial Super Owner profile on first sign-in. This is the ONLY
 * client-callable path that writes to users/{uid}. It is gated to the single
 * bootstrap email and only succeeds when no profile exists yet for that UID.
 *
 * After the Super Owner is established, all other account creation flows
 * through provisionStaff, which is admin-gated.
 */
const BOOTSTRAP_SUPER_OWNER_EMAIL = 'navttcinstitutes@gmail.com';

export const provisionSelf = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const uid = request.auth.uid;
  const email = request.auth.token.email;

  if (!email || email !== BOOTSTRAP_SUPER_OWNER_EMAIL) {
    throw new HttpsError(
      'permission-denied',
      'Self-provisioning is only available for the bootstrap account.'
    );
  }

  const userRef = db.collection('users').doc(uid);
  const existing = await userRef.get();

  if (existing.exists) {
    return {
      ok: true,
      alreadyExists: true,
      uid,
      role: existing.get('role'),
    };
  }

  await userRef.set({
    uid,
    email,
    role: 'SUPER_OWNER',
    accountStatus: 'ACTIVE',
    createdAt: FieldValue.serverTimestamp(),
    createdBy: 'bootstrap',
  });

  await db.collection('platform_audit').add({
    action: 'USER_PROVISIONED_SELF',
    actorUid: uid,
    actorEmail: email,
    targetUid: uid,
    targetEmail: email,
    role: 'SUPER_OWNER',
    occurredAt: FieldValue.serverTimestamp(),
  });

  return {
    ok: true,
    alreadyExists: false,
    uid,
    role: 'SUPER_OWNER',
  };
});

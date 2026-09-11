import { addDoc, collection } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, cleanFirestoreData } from '../lib/firebase';
import { AuditLog } from '../types';

export async function logAuditEvent(
  organizationId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
): Promise<string | null> {
  const currentUser = auth.currentUser;
  const path = `organizations/${organizationId}/audit_logs`;

  const logData: Omit<AuditLog, 'id'> = cleanFirestoreData({
    actorUid: currentUser?.uid || 'system',
    actorEmail: currentUser?.email || 'system@hunaros.local',
    organizationId,
    action,
    entityType,
    entityId,
    occurredAt: new Date().toISOString(),
    metadata: cleanFirestoreData(metadata),
  });

  try {
    const docRef = await addDoc(collection(db, path), logData);
    return docRef.id;
  } catch (error) {
    // Audit logging failure should not crash the app, but log clearly
    console.error('Failed to write audit log:', error);
    try {
      handleFirestoreError(error, OperationType.CREATE, path);
    } catch {
      // suppress re-throw to allow primary action to succeed
    }
    return null;
  }
}

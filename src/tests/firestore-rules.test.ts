import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const PROJECT_ID = 'hunaros-test-project';
const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8');

describe('HunarOS Firestore Security Rules Verification', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8088';
    const [host, portStr] = emulatorHost.split(':');
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host: host || '127.0.0.1',
        port: portStr ? parseInt(portStr, 10) : 8088,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();

    // Seed baseline data using admin context (bypasses security rules)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      // Super Owner Profile (Verified Role-Based, Email-Agnostic)
      await setDoc(doc(db, 'users', 'super-owner-uid'), {
        uid: 'super-owner-uid',
        email: 'owner@hunaros.io',
        displayName: 'Platform Super Owner',
        role: 'SUPER_OWNER',
        accountStatus: 'ACTIVE',
      });

      // User A (Org A Admin)
      await setDoc(doc(db, 'users', 'user-a-uid'), {
        uid: 'user-a-uid',
        email: 'admin@orga.edu.pk',
        displayName: 'Admin Org A',
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
      });

      // User B (Org B Staff)
      await setDoc(doc(db, 'users', 'user-b-uid'), {
        uid: 'user-b-uid',
        email: 'staff@orgb.edu.pk',
        displayName: 'Staff Org B',
        role: 'STAFF',
        accountStatus: 'ACTIVE',
      });

      // User C (Coordinator Org A)
      await setDoc(doc(db, 'users', 'user-c-uid'), {
        uid: 'user-c-uid',
        email: 'coord@orga.edu.pk',
        displayName: 'Coordinator Org A',
        role: 'COORDINATOR',
        accountStatus: 'ACTIVE',
      });

      // User D (Super Admin Org A)
      await setDoc(doc(db, 'users', 'user-d-uid'), {
        uid: 'user-d-uid',
        email: 'superadmin@orga.edu.pk',
        displayName: 'Super Admin Org A',
        role: 'SUPER_ADMIN',
        accountStatus: 'ACTIVE',
      });

      // User E (Agent Org A)
      await setDoc(doc(db, 'users', 'user-e-uid'), {
        uid: 'user-e-uid',
        email: 'agent@orga.edu.pk',
        displayName: 'Agent Org A',
        role: 'AGENT',
        accountStatus: 'ACTIVE',
      });

      // Organizations with explicit Subscriptions
      await setDoc(doc(db, 'organizations', 'org-a'), {
        id: 'org-a',
        name: 'Institute A',
        code: 'INST-A',
        city: 'Islamabad',
        status: 'ACTIVE',
        subscription: {
          planTier: 'STARTER',
          status: 'ACTIVE',
          validUntil: '2027-01-01T00:00:00.000Z',
          enabledModules: ['CORE_OPERATIONS', 'ACADEMICS'],
          maxBatches: 5,
          maxStudents: 100,
          maxStaff: 10,
        },
      });

      await setDoc(doc(db, 'organizations', 'org-b'), {
        id: 'org-b',
        name: 'Institute B',
        code: 'INST-B',
        city: 'Lahore',
        status: 'ACTIVE',
        subscription: {
          planTier: 'GROWTH',
          status: 'ACTIVE',
          validUntil: '2027-01-01T00:00:00.000Z',
          enabledModules: ['CORE_OPERATIONS', 'ACADEMICS', 'ATTENDANCE'],
          maxBatches: 15,
          maxStudents: 500,
          maxStaff: 25,
        },
      });

      // Memberships for Org A
      await setDoc(doc(db, 'organizations', 'org-a', 'members', 'user-a-uid'), {
        id: 'mem-user-a',
        userId: 'user-a-uid',
        organizationId: 'org-a',
        role: 'ADMIN',
        status: 'ACTIVE',
      });

      await setDoc(doc(db, 'organizations', 'org-a', 'members', 'user-c-uid'), {
        id: 'mem-user-c',
        userId: 'user-c-uid',
        organizationId: 'org-a',
        role: 'COORDINATOR',
        status: 'ACTIVE',
      });

      await setDoc(doc(db, 'organizations', 'org-a', 'members', 'user-d-uid'), {
        id: 'mem-user-d',
        userId: 'user-d-uid',
        organizationId: 'org-a',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      });

      await setDoc(doc(db, 'organizations', 'org-a', 'members', 'user-e-uid'), {
        id: 'mem-user-e',
        userId: 'user-e-uid',
        organizationId: 'org-a',
        role: 'AGENT',
        status: 'ACTIVE',
      });

      // Membership for Org B
      await setDoc(doc(db, 'organizations', 'org-b', 'members', 'user-b-uid'), {
        id: 'mem-user-b',
        userId: 'user-b-uid',
        organizationId: 'org-b',
        role: 'STAFF',
        status: 'ACTIVE',
      });

      // Existing Audit Log in Org A
      await setDoc(doc(db, 'organizations', 'org-a', 'audit_logs', 'log-101'), {
        id: 'log-101',
        action: 'BOOTSTRAP',
        actorUid: 'user-a-uid',
        occurredAt: new Date().toISOString(),
      });
    });
  });

  // ==========================================
  // 1. USER ISOLATION
  // ==========================================
  describe('User Isolation Security Boundaries', () => {
    it('allows a user to read their own private profile', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertSucceeds(getDoc(doc(userA.firestore(), 'users', 'user-a-uid')));
    });

    it('rejects a user from reading another user’s private profile', async () => {
      const userB = testEnv.authenticatedContext('user-b-uid', { email: 'staff@orgb.edu.pk' });
      await assertFails(getDoc(doc(userB.firestore(), 'users', 'user-a-uid')));
    });

    it('rejects an unauthenticated guest from reading any user profile', async () => {
      const guest = testEnv.unauthenticatedContext();
      await assertFails(getDoc(doc(guest.firestore(), 'users', 'user-a-uid')));
    });

    it('rejects a user from modifying another user’s profile', async () => {
      const userB = testEnv.authenticatedContext('user-b-uid', { email: 'staff@orgb.edu.pk' });
      await assertFails(
        updateDoc(doc(userB.firestore(), 'users', 'user-a-uid'), { displayName: 'Hacked Name' })
      );
    });

    it('allows Super Owner to read any user profile', async () => {
      const superOwner = testEnv.authenticatedContext('super-owner-uid', {
        role: 'SUPER_OWNER',
        email: 'owner@hunaros.io',
      });
      await assertSucceeds(getDoc(doc(superOwner.firestore(), 'users', 'user-a-uid')));
    });

    it('allows Super Owner to delete user documents', async () => {
      const superOwner = testEnv.authenticatedContext('super-owner-uid', {
        role: 'SUPER_OWNER',
        email: 'owner@hunaros.io',
      });
      await assertSucceeds(deleteDoc(doc(superOwner.firestore(), 'users', 'user-a-uid')));
    });

    it('rejects deletion of user documents by standard users', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertFails(deleteDoc(doc(userA.firestore(), 'users', 'user-a-uid')));
    });
  });

  // ==========================================
  // 2. MULTI-TENANCY ISOLATION
  // ==========================================
  describe('Multi-Tenancy Isolation', () => {
    it('allows member of Org A to read Org A data', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertSucceeds(getDoc(doc(userA.firestore(), 'organizations', 'org-a')));
    });

    it('REJECTS user from Org B from reading Org A data (tenant leakage prevention)', async () => {
      const userB = testEnv.authenticatedContext('user-b-uid', { email: 'staff@orgb.edu.pk' });
      await assertFails(getDoc(doc(userB.firestore(), 'organizations', 'org-a')));
    });

    it('allows Super Owner to read data across all organizations', async () => {
      const superOwner = testEnv.authenticatedContext('super-owner-uid', {
        role: 'SUPER_OWNER',
        email: 'owner@hunaros.io',
      });
      await assertSucceeds(getDoc(doc(superOwner.firestore(), 'organizations', 'org-a')));
      await assertSucceeds(getDoc(doc(superOwner.firestore(), 'organizations', 'org-b')));
    });

    it('rejects non-members from reading operational subcollections in Org A', async () => {
      const userB = testEnv.authenticatedContext('user-b-uid', { email: 'staff@orgb.edu.pk' });
      await assertFails(
        getDoc(doc(userB.firestore(), 'organizations', 'org-a', 'batches', 'batch-1'))
      );
    });
  });

  // ==========================================
  // 3. AUDIT LOG IMMUTABILITY & ISOLATION
  // ==========================================
  describe('Audit Log Security & Immutability', () => {
    it('allows organization member to create append-only audit log in their organization', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertSucceeds(
        setDoc(doc(userA.firestore(), 'organizations', 'org-a', 'audit_logs', 'log-102'), {
          id: 'log-102',
          action: 'STAFF_INVITED',
          actorUid: 'user-a-uid',
          occurredAt: new Date().toISOString(),
        })
      );
    });

    it('STRICTLY REJECTS update of existing audit log (immutable guarantee)', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertFails(
        updateDoc(doc(userA.firestore(), 'organizations', 'org-a', 'audit_logs', 'log-101'), {
          action: 'TAMPERED_ACTION',
        })
      );
    });

    it('STRICTLY REJECTS delete of existing audit log even by Admin', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertFails(
        deleteDoc(doc(userA.firestore(), 'organizations', 'org-a', 'audit_logs', 'log-101'))
      );
    });

    it('STRICTLY REJECTS delete of existing audit log even by Super Owner', async () => {
      const superOwner = testEnv.authenticatedContext('super-owner-uid', {
        role: 'SUPER_OWNER',
        email: 'owner@hunaros.io',
      });
      await assertFails(
        deleteDoc(doc(superOwner.firestore(), 'organizations', 'org-a', 'audit_logs', 'log-101'))
      );
    });

    it('rejects unauthorized non-member from writing to audit logs of another organization', async () => {
      const userB = testEnv.authenticatedContext('user-b-uid', { email: 'staff@orgb.edu.pk' });
      await assertFails(
        setDoc(doc(userB.firestore(), 'organizations', 'org-a', 'audit_logs', 'log-malicious'), {
          id: 'log-malicious',
          action: 'INJECTION',
          actorUid: 'user-b-uid',
          occurredAt: new Date().toISOString(),
        })
      );
    });
  });

  // ==========================================
  // 4. RBAC (ROLE-BASED ACCESS CONTROL)
  // ==========================================
  describe('Role-Based Access Control (RBAC)', () => {
    it('SUPER_OWNER: can create a new organization', async () => {
      const superOwner = testEnv.authenticatedContext('super-owner-uid', {
        role: 'SUPER_OWNER',
        email: 'owner@hunaros.io',
      });
      await assertSucceeds(
        setDoc(doc(superOwner.firestore(), 'organizations', 'org-c-new'), {
          id: 'org-c-new',
          name: 'Institute C',
          code: 'INST-C',
          status: 'ACTIVE',
        })
      );
    });

    it('SUPER_ADMIN (Org A): can manage organization members in Org A', async () => {
      const userD = testEnv.authenticatedContext('user-d-uid', { email: 'superadmin@orga.edu.pk' });
      await assertSucceeds(
        setDoc(doc(userD.firestore(), 'organizations', 'org-a', 'members', 'new-member-uid'), {
          id: 'mem-new',
          userId: 'new-member-uid',
          organizationId: 'org-a',
          role: 'STAFF',
          status: 'ACTIVE',
        })
      );
    });

    it('ADMIN (Org A): can create members in Org A', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertSucceeds(
        setDoc(doc(userA.firestore(), 'organizations', 'org-a', 'members', 'new-staff-uid'), {
          id: 'mem-staff',
          userId: 'new-staff-uid',
          organizationId: 'org-a',
          role: 'STAFF',
          status: 'ACTIVE',
        })
      );
    });

    it('ADMIN (Org A): cannot create new organizations (restricted to Super Owner)', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertFails(
        setDoc(doc(userA.firestore(), 'organizations', 'org-rogue'), {
          id: 'org-rogue',
          name: 'Rogue Institute',
        })
      );
    });

    it('COORDINATOR (Org A): can create operational records (e.g. batches) in Org A', async () => {
      const userC = testEnv.authenticatedContext('user-c-uid', { email: 'coord@orga.edu.pk' });
      await assertSucceeds(
        setDoc(doc(userC.firestore(), 'organizations', 'org-a', 'batches', 'batch-2026'), {
          id: 'batch-2026',
          title: 'Morning AI Batch',
        })
      );
    });

    it('COORDINATOR (Org A): cannot delete operational records (requires Admin)', async () => {
      const userC = testEnv.authenticatedContext('user-c-uid', { email: 'coord@orga.edu.pk' });
      await assertFails(
        deleteDoc(doc(userC.firestore(), 'organizations', 'org-a', 'batches', 'batch-2026'))
      );
    });

    it('STAFF (Org B): can create operational records in their own org', async () => {
      const userB = testEnv.authenticatedContext('user-b-uid', { email: 'staff@orgb.edu.pk' });
      await assertSucceeds(
        setDoc(doc(userB.firestore(), 'organizations', 'org-b', 'attendance', 'att-1'), {
          id: 'att-1',
          date: '2026-09-09',
        })
      );
    });

    it('STAFF (Org B): cannot delete operational records (requires Admin)', async () => {
      const userB = testEnv.authenticatedContext('user-b-uid', { email: 'staff@orgb.edu.pk' });
      await assertFails(
        deleteDoc(doc(userB.firestore(), 'organizations', 'org-b', 'attendance', 'att-1'))
      );
    });

    it('AGENT (Org A): can create leads in Org A', async () => {
      const userE = testEnv.authenticatedContext('user-e-uid', { email: 'agent@orga.edu.pk' });
      await assertSucceeds(
        setDoc(doc(userE.firestore(), 'organizations', 'org-a', 'leads', 'lead-101'), {
          id: 'lead-101',
          applicantName: 'Tariq Mehmood',
        })
      );
    });

    it('AGENT (Org A): cannot delete leads or manage members', async () => {
      const userE = testEnv.authenticatedContext('user-e-uid', { email: 'agent@orga.edu.pk' });
      await assertFails(
        deleteDoc(doc(userE.firestore(), 'organizations', 'org-a', 'leads', 'lead-101'))
      );
      await assertFails(
        setDoc(doc(userE.firestore(), 'organizations', 'org-a', 'members', 'rogue-mem'), {
          userId: 'rogue-mem',
          role: 'ADMIN',
        })
      );
    });
  });

  // ==========================================
  // 5. SAAS SUBSCRIPTION & ENTITLEMENT SECURITY
  // ==========================================
  describe('SaaS Subscription & Entitlement Security Boundaries', () => {
    it('Tenant Admin: STRICTLY CANNOT upgrade planTier to ENTERPRISE', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertFails(
        updateDoc(doc(userA.firestore(), 'organizations', 'org-a'), {
          'subscription.planTier': 'ENTERPRISE',
        })
      );
    });

    it('Tenant Admin: STRICTLY CANNOT modify subscription status', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertFails(
        updateDoc(doc(userA.firestore(), 'organizations', 'org-a'), {
          'subscription.status': 'SUSPENDED',
        })
      );
    });

    it('Tenant Admin: STRICTLY CANNOT enable unauthorized premium modules', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertFails(
        updateDoc(doc(userA.firestore(), 'organizations', 'org-a'), {
          'subscription.enabledModules': [
            'CORE_OPERATIONS',
            'ACADEMICS',
            'ATTENDANCE',
            'FINANCE',
            'ADVANCED_REPORTING',
            'AUTOMATION',
          ],
        })
      );
    });

    it('Tenant Admin: STRICTLY CANNOT increase maxStudents capacity limit', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertFails(
        updateDoc(doc(userA.firestore(), 'organizations', 'org-a'), {
          'subscription.maxStudents': 999999,
        })
      );
    });

    it('Tenant Admin: STRICTLY CANNOT increase maxStaff capacity limit', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertFails(
        updateDoc(doc(userA.firestore(), 'organizations', 'org-a'), {
          'subscription.maxStaff': 500,
        })
      );
    });

    it('Tenant Admin: STRICTLY CANNOT increase maxBatches capacity limit', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertFails(
        updateDoc(doc(userA.firestore(), 'organizations', 'org-a'), {
          'subscription.maxBatches': 200,
        })
      );
    });

    it('Tenant Admin: STRICTLY CANNOT reactivate organization status or alter code/id', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertFails(
        updateDoc(doc(userA.firestore(), 'organizations', 'org-a'), {
          status: 'SUSPENDED',
        })
      );
      await assertFails(
        updateDoc(doc(userA.firestore(), 'organizations', 'org-a'), {
          code: 'TAMPERED-CODE',
        })
      );
    });

    it('Tenant Admin: CAN update legitimate operational profile fields (name, city, address)', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertSucceeds(
        updateDoc(doc(userA.firestore(), 'organizations', 'org-a'), {
          name: 'Institute A — Islamabad Campus Updated',
          city: 'Islamabad Capital Territory',
          address: 'Plot 45, Sector H-9, Islamabad',
        })
      );
    });

    it('Tenant Staff: STRICTLY CANNOT update organization document or subscription', async () => {
      const userB = testEnv.authenticatedContext('user-b-uid', { email: 'staff@orgb.edu.pk' });
      await assertFails(
        updateDoc(doc(userB.firestore(), 'organizations', 'org-b'), {
          name: 'Unauthorized Staff Rename',
        })
      );
      await assertFails(
        updateDoc(doc(userB.firestore(), 'organizations', 'org-b'), {
          'subscription.planTier': 'ENTERPRISE',
        })
      );
    });

    it('Cross-Tenant: Tenant Admin (Org A) STRICTLY CANNOT modify Org B subscription or profile', async () => {
      const userA = testEnv.authenticatedContext('user-a-uid', { email: 'admin@orga.edu.pk' });
      await assertFails(
        updateDoc(doc(userA.firestore(), 'organizations', 'org-b'), {
          name: 'Cross-Tenant Tamper',
          'subscription.planTier': 'ENTERPRISE',
        })
      );
    });

    it('Super Owner: CAN provision a new organization with complete subscription configuration', async () => {
      const superOwner = testEnv.authenticatedContext('super-owner-uid', {
        role: 'SUPER_OWNER',
        email: 'owner@hunaros.io',
      });
      await assertSucceeds(
        setDoc(doc(superOwner.firestore(), 'organizations', 'org-enterprise-new'), {
          id: 'org-enterprise-new',
          name: 'National Technology Institute',
          code: 'NTI-ISL',
          city: 'Islamabad',
          status: 'ACTIVE',
          subscription: {
            planTier: 'ENTERPRISE',
            status: 'ACTIVE',
            validUntil: '2028-01-01T00:00:00.000Z',
            enabledModules: [
              'CORE_OPERATIONS',
              'ACADEMICS',
              'ATTENDANCE',
              'FINANCE',
              'CRM_LEADS',
              'COMMUNICATIONS',
              'ADVANCED_REPORTING',
              'AUTOMATION',
              'NAVTTC_COMPLIANCE',
            ],
            maxBatches: 50,
            maxStudents: 2500,
            maxStaff: 100,
          },
        })
      );
    });

    it('Super Owner: CAN upgrade subscription planTier and configure enabled modules', async () => {
      const superOwner = testEnv.authenticatedContext('super-owner-uid', {
        role: 'SUPER_OWNER',
        email: 'owner@hunaros.io',
      });
      await assertSucceeds(
        updateDoc(doc(superOwner.firestore(), 'organizations', 'org-a'), {
          'subscription.planTier': 'GROWTH',
          'subscription.enabledModules': ['CORE_OPERATIONS', 'ACADEMICS', 'ATTENDANCE', 'FINANCE'],
        })
      );
    });

    it('Super Owner: CAN adjust capacity limits and organization operational status', async () => {
      const superOwner = testEnv.authenticatedContext('super-owner-uid', {
        role: 'SUPER_OWNER',
        email: 'owner@hunaros.io',
      });
      await assertSucceeds(
        updateDoc(doc(superOwner.firestore(), 'organizations', 'org-a'), {
          'subscription.maxStudents': 750,
          'subscription.maxBatches': 25,
          'subscription.maxStaff': 40,
          status: 'SUSPENDED',
          'subscription.status': 'SUSPENDED',
        })
      );
    });
  });
});

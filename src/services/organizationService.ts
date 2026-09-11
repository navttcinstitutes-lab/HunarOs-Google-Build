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
import { db, handleFirestoreError, OperationType, cleanFirestoreData } from '../lib/firebase';
import { Organization, UserProfile } from '../types';
import { logAuditEvent } from './auditService';

const DEFAULT_ORGANIZATIONS: Omit<Organization, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'org-nsi-isl-01',
    name: 'National Skills Institute (Capital Campus)',
    code: 'NSI-ISL-01',
    type: 'VOCATIONAL_ACADEMY',
    city: 'Islamabad',
    address: 'Sector H-9, Institutional Area',
    contactEmail: 'admin.isb@hunaros.edu.pk',
    contactPhone: '+92 51 9205555',
    status: 'ACTIVE',
    activeBatchesCount: 4,
    totalStudentsCount: 180,
    subscription: {
      planTier: 'ENTERPRISE',
      status: 'ACTIVE',
      enabledModules: [
        'CORE_OPERATIONS',
        'ACADEMICS',
        'ATTENDANCE',
        'FINANCE',
        'CRM_LEADS',
        'COMMUNICATIONS',
        'ADVANCED_REPORTING',
        'NAVTTC_COMPLIANCE',
      ],
      maxBatches: 50,
      maxStudents: 2500,
      maxStaff: 100,
    },
  },
  {
    id: 'org-pit-lhr-02',
    name: 'Punjab Institute of Technology & Vocational Skills',
    code: 'PIT-LHR-02',
    type: 'TECHNICAL_COLLEGE',
    city: 'Lahore',
    address: 'Ferozepur Road, Industrial Zone',
    contactEmail: 'admissions.lhr@hunaros.edu.pk',
    contactPhone: '+92 42 35912000',
    status: 'ACTIVE',
    activeBatchesCount: 3,
    totalStudentsCount: 125,
    subscription: {
      planTier: 'GROWTH',
      status: 'ACTIVE',
      enabledModules: [
        'CORE_OPERATIONS',
        'ACADEMICS',
        'ATTENDANCE',
        'FINANCE',
        'CRM_LEADS',
        'COMMUNICATIONS',
      ],
      maxBatches: 20,
      maxStudents: 1000,
      maxStaff: 50,
    },
  },
  {
    id: 'org-sttc-khi-03',
    name: 'Sindh Technical Training Center',
    code: 'STC-KHI-03',
    type: 'PRIVATE_INSTITUTE',
    city: 'Karachi',
    address: 'Korangi Industrial Area',
    contactEmail: 'info.khi@hunaros.edu.pk',
    contactPhone: '+92 21 35061122',
    status: 'ACTIVE',
    activeBatchesCount: 2,
    totalStudentsCount: 90,
    subscription: {
      planTier: 'STARTER',
      status: 'ACTIVE',
      enabledModules: ['CORE_OPERATIONS', 'ACADEMICS', 'ATTENDANCE'],
      maxBatches: 10,
      maxStudents: 300,
      maxStaff: 15,
    },
  },
];

export async function getOrganizations(user: UserProfile): Promise<Organization[]> {
  const path = 'organizations';
  try {
    if (user.role === 'SUPER_OWNER') {
      const snap = await getDocs(collection(db, path));
      const orgs: Organization[] = [];
      snap.forEach((d) => orgs.push(d.data() as Organization));

      return orgs;
    } else {
      // Fetch only assigned organizations via user's defaultOrgId or memberships
      if (user.defaultOrgId) {
        const orgDoc = await getDoc(doc(db, path, user.defaultOrgId));
        if (orgDoc.exists()) {
          return [orgDoc.data() as Organization];
        }
      }
      // Query memberships
      const membershipsSnap = await getDocs(
        query(collection(db, 'memberships'), where('userId', '==', user.uid))
      );
      const orgIds = membershipsSnap.docs.map((d) => d.data().organizationId as string);
      const orgs: Organization[] = [];
      for (const orgId of orgIds) {
        const orgDoc = await getDoc(doc(db, path, orgId));
        if (orgDoc.exists()) {
          orgs.push(orgDoc.data() as Organization);
        }
      }
      return orgs;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function seedDefaultOrganizations(): Promise<Organization[]> {
  const seeded: Organization[] = [];
  const now = new Date().toISOString();

  for (const item of DEFAULT_ORGANIZATIONS) {
    const orgData: Organization = cleanFirestoreData({
      ...item,
      createdAt: now,
      updatedAt: now,
    });
    try {
      await setDoc(doc(db, 'organizations', item.id), orgData);
      seeded.push(orgData);
      await logAuditEvent(item.id, 'ORGANIZATION_INITIALIZED', 'ORGANIZATION', item.id, {
        name: item.name,
        code: item.code,
      });
    } catch (err) {
      console.error(`Failed to seed organization ${item.id}`, err);
    }
  }

  return seeded;
}

export async function createOrganization(
  payload: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Organization> {
  const now = new Date().toISOString();
  const id = `org-${payload.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
  const org: Organization = cleanFirestoreData({
    ...payload,
    id,
    activeBatchesCount: 0,
    totalStudentsCount: 0,
    subscription: payload.subscription || {
      planTier: 'GROWTH',
      status: 'ACTIVE',
      enabledModules: [
        'CORE_OPERATIONS',
        'ACADEMICS',
        'ATTENDANCE',
        'FINANCE',
        'CRM_LEADS',
        'COMMUNICATIONS',
      ],
      maxBatches: 20,
      maxStudents: 1000,
      maxStaff: 50,
    },
    createdAt: now,
    updatedAt: now,
  });

  const path = `organizations/${id}`;
  try {
    await setDoc(doc(db, 'organizations', id), org);
    await logAuditEvent(id, 'CREATE_ORGANIZATION', 'ORGANIZATION', id, { name: org.name, code: org.code });
    return org;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrganization(
  orgId: string,
  payload: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'code' | 'subscription' | 'status'>>
): Promise<void> {
  const path = `organizations/${orgId}`;
  try {
    const orgRef = doc(db, 'organizations', orgId);
    const updateData = cleanFirestoreData({
      ...payload,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(orgRef, updateData);
    await logAuditEvent(orgId, 'UPDATE_ORGANIZATION', 'ORGANIZATION', orgId, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrganization(orgId: string): Promise<void> {
  const path = `organizations/${orgId}`;
  try {
    await logAuditEvent(orgId, 'DELETE_ORGANIZATION', 'ORGANIZATION', orgId, {});
    await deleteDoc(doc(db, 'organizations', orgId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

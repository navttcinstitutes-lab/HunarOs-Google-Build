import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Mail, Phone, Lock, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Organization, UserProfile, UserRole } from '../../types';
import { Button } from '../ui/Button';
import { Badge, BadgeVariant } from '../ui/Badge';
import { CreateStaffModal } from './CreateStaffModal';
import { InlineNotice } from '../ui/InlineNotice';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { updateStaffAccount, deleteStaffAccount } from '../../services/authService';

interface StaffListViewProps {
  currentUser: UserProfile;
  organizations: Organization[];
  activeOrg: Organization | null;
}

export const StaffListView: React.FC<StaffListViewProps> = ({
  currentUser,
  organizations,
  activeOrg,
}) => {
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<UserProfile | null>(null);

  // Edit form state
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [contactPhone, setContactPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const canCreateStaff =
    currentUser.role === 'SUPER_OWNER' ||
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'COORDINATOR';

  const fetchStaff = async () => {
    setIsLoading(true);
    setActionError(null);
    const path = 'users';
    try {
      const snap = await getDocs(collection(db, path));
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        list.push(d.data() as UserProfile);
      });
      setStaffList(list);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleStatus = async (user: UserProfile) => {
    if (user.role === 'SUPER_OWNER') return;
    const newStatus = user.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        accountStatus: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setStaffList((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, accountStatus: newStatus } : u))
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update account status.');
    }
  };

  const openEditModal = (staff: UserProfile) => {
    setEditingStaff(staff);
    setName(staff.displayName);
    setRole(staff.role);
    setContactPhone(staff.phone || '');
    setCnic(staff.cnic || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !name.trim()) {
      setEditError('Name is required.');
      return;
    }
    setIsLoading(true);
    try {
      await updateStaffAccount(
        editingStaff.uid, 
        editingStaff.defaultOrgId, 
        {
          displayName: name.trim(),
          role,
          phone: contactPhone.trim() || undefined,
          cnic: cnic.trim() || undefined
        },
        { role }
      );
      setIsEditModalOpen(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update staff account.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (staff: UserProfile) => {
    setStaffToDelete(staff);
    setEditError(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;
    setIsLoading(true);
    try {
      await deleteStaffAccount(staffToDelete.uid, staffToDelete.defaultOrgId);
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
      fetchStaff();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to delete staff account.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string): BadgeVariant => {
    switch (role) {
      case 'SUPER_OWNER': return 'danger';
      case 'ADMIN': return 'warning';
      case 'COORDINATOR': return 'info';
      case 'STAFF': return 'success';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 text-balance">Staff & Access Control</h1>
          <p className="text-xs text-neutral-500 mt-1">Governed internal users. Public registration disabled.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchStaff} isLoading={isLoading}>
            Refresh
          </Button>
          {canCreateStaff && (
            <Button variant="primary" size="md" icon={<UserPlus className="w-4 h-4" />} onClick={() => setIsCreateModalOpen(true)}>
              Provision Staff
            </Button>
          )}
        </div>
      </div>

      {actionError && <InlineNotice variant="error">{actionError}</InlineNotice>}

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Assigned Institute</th>
                <th className="py-3 px-4">CNIC / Contact</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {staffList.map((staff) => {
                const org = organizations.find((o) => o.id === staff.defaultOrgId);
                const isSelf = staff.uid === currentUser.uid;
                const isSuperOwner = staff.role === 'SUPER_OWNER';

                return (
                  <tr key={staff.uid} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-900">{staff.displayName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-neutral-500">
                          <Mail className="w-3 h-3" />
                          <span>{staff.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getRoleBadgeVariant(staff.role)} size="sm">
                        {staff.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={staff.accountStatus === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                        {staff.accountStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {isSuperOwner ? (
                        <span className="text-neutral-500 font-medium">GLOBAL</span>
                      ) : (
                        <span className="font-mono text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                          {org?.code || 'UNASSIGNED'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 text-neutral-500">
                        {staff.cnic && (
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3 h-3" />
                            <span>{staff.cnic}</span>
                          </div>
                        )}
                        {staff.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3" />
                            <span>{staff.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(!isSuperOwner && !isSelf && canCreateStaff) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2"
                              onClick={() => openEditModal(staff)}
                              aria-label={`Edit ${staff.displayName}`}
                            >
                              <Edit className="w-3.5 h-3.5 text-neutral-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2"
                              onClick={() => handleToggleStatus(staff)}
                            >
                              {staff.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2 border-red-200 hover:bg-red-50 text-red-600"
                              onClick={() => openDeleteModal(staff)}
                              aria-label={`Delete ${staff.displayName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {isSelf && <span className="text-neutral-400 font-medium">You</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    No staff records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateStaffModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        organizations={organizations}
        onStaffCreated={() => fetchStaff()}
      />

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Staff Profile" subtitle="Update basic information and role" maxWidth="sm">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
          {editError && <InlineNotice variant="error">{editError}</InlineNotice>}
          <Input label="Staff Name" required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <Select label="System Role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} options={[
            { value: 'SUPER_OWNER', label: 'Platform Owner (Global)' },
            { value: 'SUPER_ADMIN', label: 'Super Admin (Tenant)' },
            { value: 'ADMIN', label: 'Admin (Tenant)' },
            { value: 'COORDINATOR', label: 'Coordinator' },
            { value: 'STAFF', label: 'Staff' }
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="CNIC (Optional)" placeholder="xxxxx-xxxxxxx-x" value={cnic} onChange={(e) => setCnic(e.target.value)} autoComplete="off" spellCheck={false} />
            <Input label="Phone (Optional)" placeholder="+92 300 0000000" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} autoComplete="tel" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Staff Account" subtitle="This action is destructive and irreversible." maxWidth="sm">
        <div className="space-y-4">
          {editError && <InlineNotice variant="error">{editError}</InlineNotice>}
          <InlineNotice variant="warning">
            Are you sure you want to permanently delete <strong>{staffToDelete?.displayName}</strong> ({staffToDelete?.email})? This will remove the staff record from the system.
          </InlineNotice>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button variant="outline" type="button" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="!bg-red-600 hover:!bg-red-700 !border-red-600 focus:ring-red-600" type="button" onClick={handleDeleteConfirm} isLoading={isLoading}>Permanently Delete</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

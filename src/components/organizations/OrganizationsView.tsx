import React, { useState } from 'react';
import { Building2, Plus, MapPin, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import { Organization, UserProfile, SubscriptionTier, PlatformModule } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { InlineNotice } from '../ui/InlineNotice';
import { createOrganization, updateOrganization, deleteOrganization } from '../../services/organizationService';

interface OrganizationsViewProps {
  organizations: Organization[];
  currentUser: UserProfile;
  activeOrg: Organization | null;
  onSelectOrg: (org: Organization) => void;
  onRefreshOrgs: () => void;
}

export const OrganizationsView: React.FC<OrganizationsViewProps> = ({
  organizations,
  currentUser,
  activeOrg,
  onSelectOrg,
  onRefreshOrgs,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<Organization['type']>('VOCATIONAL_ACADEMY');
  const [tier, setTier] = useState<SubscriptionTier>('GROWTH');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageOrg = currentUser.role === 'SUPER_OWNER';

  const resetForm = () => {
    setName('');
    setCode('');
    setCity('');
    setAddress('');
    setContactEmail('');
    setContactPhone('');
    setTier('GROWTH');
    setType('VOCATIONAL_ACADEMY');
    setError(null);
  };

  const openEditModal = (org: Organization) => {
    setEditingOrg(org);
    setName(org.name);
    setCity(org.city);
    setAddress(org.address || '');
    setContactEmail(org.contactEmail || '');
    setContactPhone(org.contactPhone || '');
    setType(org.type);
    setError(null);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (org: Organization) => {
    setOrgToDelete(org);
    setIsDeleteModalOpen(true);
    setError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !city) {
      setError('Please fill in required fields.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const modulesMap: Record<SubscriptionTier, PlatformModule[]> = {
        STARTER: ['CORE_OPERATIONS', 'ACADEMICS', 'ATTENDANCE'],
        GROWTH: ['CORE_OPERATIONS', 'ACADEMICS', 'ATTENDANCE', 'FINANCE', 'CRM_LEADS', 'COMMUNICATIONS'],
        ENTERPRISE: [
          'CORE_OPERATIONS', 'ACADEMICS', 'ATTENDANCE', 'FINANCE', 'CRM_LEADS', 'COMMUNICATIONS', 'ADVANCED_REPORTING', 'NAVTTC_COMPLIANCE'
        ],
        CUSTOM: ['CORE_OPERATIONS', 'ACADEMICS', 'ATTENDANCE', 'FINANCE'],
      };
      const payload: Parameters<typeof createOrganization>[0] = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        city: city.trim(),
        status: 'ACTIVE',
        subscription: {
          planTier: tier,
          status: 'ACTIVE',
          enabledModules: modulesMap[tier] || modulesMap.GROWTH,
          maxBatches: tier === 'ENTERPRISE' ? 50 : tier === 'GROWTH' ? 20 : 10,
          maxStudents: tier === 'ENTERPRISE' ? 2500 : tier === 'GROWTH' ? 1000 : 300,
          maxStaff: tier === 'ENTERPRISE' ? 100 : tier === 'GROWTH' ? 50 : 15,
        },
      };
      if (address.trim()) payload.address = address.trim();
      if (contactEmail.trim()) payload.contactEmail = contactEmail.trim();
      if (contactPhone.trim()) payload.contactPhone = contactPhone.trim();

      await createOrganization(payload);
      setIsCreateModalOpen(false);
      resetForm();
      onRefreshOrgs();
    } catch (err: unknown) {
      setError("Couldn't save — check your connection and try again.");
      console.error('Organization creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg || !name || !city) {
      setError('Please fill in required fields.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        type,
        city: city.trim(),
        address: address.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      };
      await updateOrganization(editingOrg.id, payload);
      setIsEditModalOpen(false);
      resetForm();
      setEditingOrg(null);
      onRefreshOrgs();
    } catch (err: unknown) {
      setError("Couldn't save — check your connection and try again.");
      console.error('Organization update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!orgToDelete) return;
    setIsLoading(true);
    setError(null);
    try {
      await deleteOrganization(orgToDelete.id);
      setIsDeleteModalOpen(false);
      setOrgToDelete(null);
      onRefreshOrgs();
    } catch (err: unknown) {
      setError("Couldn't delete — check your connection and try again.");
      console.error('Organization deletion error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Institutes & Organizations</h1>
          <p className="text-xs text-neutral-500 mt-1">Governed training centers with isolated database boundaries.</p>
        </div>
        {canManageOrg && (
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
            Add Institute
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {organizations.map((org) => {
          const isActive = activeOrg?.id === org.id;
          return (
            <div key={org.id} className={`bg-white rounded-lg border p-5 transition-all flex flex-col justify-between ${isActive ? 'border-neutral-900 ring-1 ring-neutral-900 shadow-xs' : 'border-neutral-200 hover:border-neutral-300'}`}>
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200 break-all">{org.code}</span>
                  <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                    <Badge variant={org.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">{org.status}</Badge>
                    {isActive && <Badge variant="info" size="sm">CURRENT</Badge>}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-neutral-900 mt-3 line-clamp-2">{org.name}</h3>
                <div className="mt-3 space-y-1.5 text-xs text-neutral-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{org.city}{org.address ? `, ${org.address}` : ''}</span>
                  </div>
                  {org.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="font-mono text-[11px] truncate">{org.contactEmail}</span>
                    </div>
                  )}
                  {org.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{org.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-[11px] text-neutral-500 font-medium truncate">Type: {org.type.replace(/_/g, ' ')}</span>
                  {org.subscription && (
                    <span className="text-[10px] font-mono text-neutral-600 truncate">
                      Tier: <strong className="text-neutral-900">{org.subscription.planTier}</strong> ({org.subscription.enabledModules?.length || 0} mods)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canManageOrg && (
                    <>
                      <Button variant="outline" size="sm" className="px-2" onClick={() => openEditModal(org)}>
                        <Edit className="w-3.5 h-3.5 text-neutral-600" />
                      </Button>
                      <Button variant="outline" size="sm" className="px-2 border-red-200 hover:bg-red-50 text-red-600" onClick={() => openDeleteModal(org)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                  {!isActive ? (
                    <Button variant="outline" size="sm" onClick={() => onSelectOrg(org)}>Select</Button>
                  ) : (
                    <span className="text-xs font-semibold text-neutral-800 hidden sm:inline">Active</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
          <Building2 className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-900">No Institutes Found</h3>
          <p className="text-xs text-neutral-500 mt-1 mb-4">You have not registered any organizations yet.</p>
          {canManageOrg && (
            <Button variant="primary" size="sm" onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>Add First Institute</Button>
          )}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Register New Institute" subtitle="Provision a dedicated organization boundary" maxWidth="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-left">
          {error && <InlineNotice variant="error">{error}</InlineNotice>}
          <Input label="Institute Name" required placeholder="e.g. Islamabad Vocational Training Academy" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Institute Code" required placeholder="e.g. IVTA-ISB" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <Select label="Institute Type" value={type} onChange={(e) => setType(e.target.value as Organization['type'])} options={[{ value: 'VOCATIONAL_ACADEMY', label: 'Vocational Academy' }, { value: 'TECHNICAL_COLLEGE', label: 'Technical College' }, { value: 'PRIVATE_INSTITUTE', label: 'Private Skills Center' }, { value: 'ENTERPRISE_ACADEMY', label: 'Corporate Academy' }, { value: 'NAVTTC_AFFILIATED', label: 'NAVTTC Affiliated' }, { value: 'HYBRID', label: 'Hybrid Public/Private' }]} />
          </div>
          <Select label="SaaS Subscription Plan & Entitlement Tier" value={tier} onChange={(e) => setTier(e.target.value as SubscriptionTier)} options={[{ value: 'STARTER', label: 'Starter Plan' }, { value: 'GROWTH', label: 'Growth Plan' }, { value: 'ENTERPRISE', label: 'Enterprise Plan' }, { value: 'CUSTOM', label: 'Custom Plan' }]} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" required placeholder="e.g. Islamabad" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label="Campus Address" placeholder="Street / Sector" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contact Email" type="email" placeholder="info@academy.edu.pk" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            <Input label="Contact Phone" placeholder="+92 51 1234567" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>Register Institute</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Institute Profile" subtitle="Update basic information and contact details" maxWidth="md">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
          {error && <InlineNotice variant="error">{error}</InlineNotice>}
          <Input label="Institute Name" required placeholder="e.g. Islamabad Vocational Training Academy" value={name} onChange={(e) => setName(e.target.value)} />
          <Select label="Institute Type" value={type} onChange={(e) => setType(e.target.value as Organization['type'])} options={[{ value: 'VOCATIONAL_ACADEMY', label: 'Vocational Academy' }, { value: 'TECHNICAL_COLLEGE', label: 'Technical College' }, { value: 'PRIVATE_INSTITUTE', label: 'Private Skills Center' }, { value: 'ENTERPRISE_ACADEMY', label: 'Corporate Academy' }, { value: 'NAVTTC_AFFILIATED', label: 'NAVTTC Affiliated' }, { value: 'HYBRID', label: 'Hybrid Public/Private' }]} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" required placeholder="e.g. Islamabad" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label="Campus Address" placeholder="Street / Sector" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contact Email" type="email" placeholder="info@academy.edu.pk" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            <Input label="Contact Phone" placeholder="+92 51 1234567" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Institute" subtitle="This action is destructive and irreversible." maxWidth="sm">
        <div className="space-y-4">
          {error && <InlineNotice variant="error">{error}</InlineNotice>}
          <InlineNotice variant="warning">
            Are you sure you want to permanently delete <strong>{orgToDelete?.name}</strong>? This will remove the institute record.
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

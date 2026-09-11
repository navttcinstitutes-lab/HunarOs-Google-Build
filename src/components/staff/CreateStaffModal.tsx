import React, { useState } from 'react';
import { UserPlus, Lock, Key, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { InlineNotice } from '../ui/InlineNotice';
import { Organization, StaffCreationPayload, UserProfile, UserRole } from '../../types';
import { createStaffAccount } from '../../services/authService';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  organizations: Organization[];
  onStaffCreated: (newStaff: UserProfile) => void;
}

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  organizations,
  onStaffCreated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [initialPin, setInitialPin] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [orgId, setOrgId] = useState(organizations[0]?.id || '');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [permissions, setPermissions] = useState<string[]>([
    'manage_leads',
    'record_attendance',
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState<{
    email: string;
    pin: string;
    name: string;
  } | null>(null);

  const availablePermissions = [
    { key: 'manage_leads', label: 'Manage & Ingest Leads' },
    { key: 'manage_enrollments', label: 'Enrollment & Seat Allocation' },
    { key: 'verify_documents', label: 'Verify Documents & Custody' },
    { key: 'record_attendance', label: 'Attendance & Roster Input' },
    { key: 'manage_finance', label: 'Record Ledger & Stipends' },
    { key: 'create_staff', label: 'Staff Provisioning Authority' },
  ];

  const handleTogglePermission = (key: string) => {
    if (permissions.includes(key)) {
      setPermissions(permissions.filter((p) => p !== key));
    } else {
      setPermissions([...permissions, key]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !initialPin.trim() || !orgId) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (initialPin.length < 4 || initialPin.length > 8) {
      setError('Initial PIN must be between 4 and 8 digits.');
      return;
    }

    setIsLoading(true);

    try {
      const payload: StaffCreationPayload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        initialPin: initialPin.trim(),
        organizationId: orgId,
        role,
        permissions,
      };
      if (contactPhone.trim()) payload.contactPhone = contactPhone.trim();
      if (cnic.trim()) payload.cnic = cnic.trim();

      const newStaff = await createStaffAccount(currentUser, payload);
      setCreatedSuccess({
        email: payload.email,
        pin: payload.initialPin,
        name: payload.name,
      });
      onStaffCreated(newStaff);
    } catch (err: unknown) {
      let displayMsg = 'Failed to provision staff account.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          displayMsg = parsed.error || err.message;
        } catch {
          displayMsg = err.message;
        }
      }
      setError(displayMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setName('');
    setEmail('');
    setInitialPin('');
    setContactPhone('');
    setCnic('');
    setError(null);
    setCreatedSuccess(null);
    onClose();
  };

  const generateRandomPin = () => {
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    setInitialPin(random);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Provision Staff Account"
      subtitle="Restricted to authorized administrators (PRD Section 4A)"
      maxWidth="lg"
    >
      {createdSuccess ? (
        <div className="space-y-4 text-left">
          <InlineNotice variant="success" title="Staff Account Provisioned Successfully">
            The account is now active. As mandated by security rules, the PIN has been salted and hashed, and cannot be viewed again.
          </InlineNotice>

          <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200 space-y-2 font-mono text-xs">
            <div>
              <span className="text-neutral-500">Staff Member:</span>{' '}
              <span className="font-semibold text-neutral-900">{createdSuccess.name}</span>
            </div>
            <div>
              <span className="text-neutral-500">Email:</span>{' '}
              <span className="font-semibold text-neutral-900">{createdSuccess.email}</span>
            </div>
            <div className="bg-white p-2.5 rounded border border-neutral-300 flex items-center justify-between">
              <div>
                <span className="text-neutral-500 font-sans">Temporary Initial PIN:</span>{' '}
                <span className="font-bold text-neutral-900 tracking-widest text-sm">{createdSuccess.pin}</span>
              </div>
              <span className="text-[10px] text-rose-600 uppercase font-bold font-sans">Share Once</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={handleResetAndClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {error && <InlineNotice variant="error">{error}</InlineNotice>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Muhammad Bilal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Work Email"
              type="email"
              required
              placeholder="bilal@institute.edu.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-700 tracking-wide uppercase">
                  Initial Access PIN <span className="text-rose-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomPin}
                  className="text-[11px] text-neutral-600 hover:text-neutral-900 underline"
                >
                  Generate Random
                </button>
              </div>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="6-digit PIN"
                value={initialPin}
                onChange={(e) => setInitialPin(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-mono tracking-widest text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              />
              <p className="text-[11px] text-neutral-500 mt-1">Never stored in plaintext. Hashed with unique salt.</p>
            </div>

            <Select
              label="Assigned Organization"
              required
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              options={organizations.map((org) => ({
                value: org.id,
                label: `${org.code} - ${org.name}`,
              }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone (Optional)"
              placeholder="+92 300 1234567"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />

            <Input
              label="National CNIC (Optional)"
              placeholder="35201-XXXXXXX-X"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <Select
              label="Staff Role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={[
                { value: 'STAFF', label: 'Operational Staff' },
                { value: 'COORDINATOR', label: 'Academic Coordinator' },
                { value: 'ADMIN', label: 'Institute Administrator' },
                { value: 'AGENT', label: 'External Intake Agent' },
              ]}
            />
          </div>

          {/* Granular Permission Toggles */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-neutral-700 tracking-wide uppercase block mb-2">
              Scoped Permissions (ABAC)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-50 p-3 rounded-md border border-neutral-200">
              {availablePermissions.map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-center gap-2 text-xs text-neutral-800 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={permissions.includes(perm.key)}
                    onChange={() => handleTogglePermission(perm.key)}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-800"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button variant="outline" type="button" onClick={handleResetAndClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isLoading}
              icon={<UserPlus className="w-4 h-4" />}
            >
              Provision Account
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

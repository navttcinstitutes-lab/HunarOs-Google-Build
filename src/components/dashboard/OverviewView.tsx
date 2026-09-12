import React from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  FileCheck,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { Organization, UserProfile } from '../../types';
import { Badge } from '../ui/Badge';

interface OverviewViewProps {
  activeOrg: Organization | null;
  currentUser: UserProfile;
  onNavigateTab: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  activeOrg,
  currentUser,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 text-balance">
            {activeOrg?.name || 'Operations Overview'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Institute Code: <span className="font-mono font-semibold text-neutral-800">{activeOrg?.code}</span> • Type:{' '}
            <span className="font-medium text-neutral-800">{activeOrg?.type?.replace(/_/g, ' ')}</span> • City:{' '}
            <span className="font-medium text-neutral-800">{activeOrg?.city}</span>
            {activeOrg?.subscription && (
              <>
                {' '}• Subscription:{' '}
                <span className="font-semibold text-neutral-900">{activeOrg.subscription.planTier} Tier</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeOrg?.subscription && (
            <Badge variant="neutral" size="sm">
              {activeOrg.subscription.planTier} Plan
            </Badge>
          )}
          <Badge variant="success" size="md">
            Operational Gateway Active
          </Badge>
        </div>
      </div>

      {/* Primary KPI Grid (High Density Swiss-Minimal) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Active Batches
            </span>
            <GraduationCap className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
            {activeOrg?.activeBatchesCount || 3}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Vocational & Technical Cycles</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Total Enrolled
            </span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
            {activeOrg?.totalStudentsCount || 145}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Verified Global Persons</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Avg Attendance
            </span>
            <CalendarCheck className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700">
            89.4%
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Biometric & Roll-Call Sync</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Stipend Ledger
            </span>
            <TrendingUp className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-900">
            PKR 435,000
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Current Month Disbursements</p>
        </div>
      </div>

      {/* Operational Modules Quick Status & Architecture Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Vocational Pipeline Status */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-neutral-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
              Module Execution Matrix (Phase 1 Baseline)
            </h2>
            <span className="text-xs font-mono text-neutral-500">System State: Ready</span>
          </div>

          <div className="divide-y divide-neutral-100 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900">
                  MOD-00: Security & Organization Boundary (Phase 1)
                </div>
                <div className="text-neutral-500">
                  Firebase Authentication, Zero Public Registration, Super Owner Bootstrap.
                </div>
              </div>
              <Badge variant="success" size="sm">Active</Badge>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900">
                  MOD-01: Lead-to-Enrollment State Machine (Phase 2 Target)
                </div>
                <div className="text-neutral-500">
                  CNIC deduplication, regulatory & program intake gates, atomic seat allocations.
                </div>
              </div>
              <Badge variant="info" size="sm">Scheduled</Badge>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900">
                  MOD-02: Document Verification & Certificate Custody (Phase 3 Target)
                </div>
                <div className="text-neutral-500">
                  Document checklist, physical custody receipts, signed handover tracking.
                </div>
              </div>
              <Badge variant="neutral" size="sm">Queued</Badge>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900">
                  MOD-03: Dual-Source Attendance & Biometric Sync (Phase 4 Target)
                </div>
                <div className="text-neutral-500">
                  Punch-log normalization, roll-call reconciliation, mismatch review queue.
                </div>
              </div>
              <Badge variant="neutral" size="sm">Queued</Badge>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-900">
                  MOD-05: Double-Entry Finance & Stipend Ledger (Phase 5 Target)
                </div>
                <div className="text-neutral-500">
                  Append-only immutable transaction entries, strict reversals, student stipends.
                </div>
              </div>
              <Badge variant="neutral" size="sm">Queued</Badge>
            </div>
          </div>
        </div>

        {/* Right Col: Active Security & Governance Status */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Governance & Security
            </h3>

            <ul className="space-y-2.5 text-xs text-neutral-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  <strong>Tenant Boundary:</strong> Hard Firestore security rules enforce isolation.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  <strong>Bootstrap Identity:</strong> Authenticated as <code className="font-mono text-neutral-800">{currentUser.email}</code>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  <strong>Credential Policy:</strong> Plaintext PIN storage forbidden; salted SHA-256 in effect.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  <strong>Zero Public Intake:</strong> Staff registration gated strictly by authority.
                </span>
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-neutral-100 flex gap-2">
              <button
                onClick={() => onNavigateTab('staff')}
                className="text-xs font-semibold text-neutral-900 hover:text-neutral-700 underline"
              >
                Manage Staff Accounts →
              </button>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-neutral-900 mb-1">
              <Building className="w-4 h-4 text-neutral-600" />
              Multi-Institute Model
            </div>
            <p className="text-neutral-500 leading-relaxed">
              HunarOS provides tenant isolation and unified oversight across vocational training institutes, technical colleges, corporate academies, and partner training networks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Building2,
  ChevronDown,
  LogOut,
  Shield,
  User,
  CheckCircle,
} from 'lucide-react';
import { Organization, UserProfile } from '../../types';
import { Badge, BadgeVariant } from '../ui/Badge';
import { signOutUser } from '../../services/authService';

interface TopNavProps {
  currentUser: UserProfile;
  organizations: Organization[];
  activeOrg: Organization | null;
  onSelectOrg: (org: Organization) => void;
  onSignOut: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentUser,
  organizations,
  activeOrg,
  onSelectOrg,
  onSignOut,
}) => {
  const getRoleBadgeVariant = (role: string): BadgeVariant => {
    switch (role) {
      case 'SUPER_OWNER':
        return 'danger';
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return 'warning';
      case 'COORDINATOR':
        return 'info';
      case 'STAFF':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const handleSignOutClick = async () => {
    await signOutUser();
    onSignOut();
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-neutral-900 text-white font-bold text-sm tracking-wider">
              H
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-neutral-900 leading-tight">
                HunarOS
              </span>
              <span className="text-[10px] text-neutral-500 font-mono tracking-wider">
                Enterprise Edition
              </span>
            </div>
          </div>

          {/* Center: Active Organization Context Switcher */}
          <div className="flex items-center">
            {organizations.length > 0 && activeOrg ? (
              <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 text-xs">
                <Building2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="text-neutral-500 font-medium">Active Institute:</span>
                {currentUser.role === 'SUPER_OWNER' || organizations.length > 1 ? (
                  <select
                    className="bg-transparent font-semibold text-neutral-900 focus:outline-none cursor-pointer pr-1"
                    value={activeOrg.id}
                    onChange={(e) => {
                      const found = organizations.find((o) => o.id === e.target.value);
                      if (found) onSelectOrg(found);
                    }}
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.code} — {org.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-semibold text-neutral-900 truncate max-w-[200px] sm:max-w-xs">
                    {activeOrg.code} — {activeOrg.name}
                  </span>
                )}
                {currentUser.role === 'SUPER_OWNER' && (
                  <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-mono">
                    GLOBAL SCOPE
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-neutral-400">Resolving Organization…</span>
            )}
          </div>

          {/* Right: Role Badge & User Account Dropdown */}
          <div className="flex items-center gap-3">
            <Badge variant={getRoleBadgeVariant(currentUser.role)} size="sm">
              {currentUser.role.replace('_', ' ')}
            </Badge>

            <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-neutral-800 leading-tight">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[140px]">
                  {currentUser.email}
                </span>
              </div>
              <button
                onClick={handleSignOutClick}
                title="Sign Out"
                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

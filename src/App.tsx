import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  GraduationCap,
  FileCheck2,
  CalendarCheck2,
  Coins,
  Radio,
  FileText,
} from 'lucide-react';
import { auth } from './lib/firebase';
import { AuthScreen } from './components/auth/AuthScreen';
import { TopNav } from './components/layout/TopNav';
import { OverviewView } from './components/dashboard/OverviewView';
import { OrganizationsView } from './components/organizations/OrganizationsView';
import { StaffListView } from './components/staff/StaffListView';
import { AuditLogView } from './components/audit/AuditLogView';
import { Organization, UserProfile } from './types';
import { resolveUserProfile, AuthGateResult } from './services/authService';
import { getOrganizations } from './services/organizationService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'staff' | 'audit'>('overview');

  // Listen strictly to Auth state changes; NO pre-auth data queries
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const res = await resolveUserProfile(fbUser);
          if (res.isAuthorized && res.userProfile) {
            setCurrentUser(res.userProfile);
            await loadOrgs(res.userProfile);
          } else {
            setCurrentUser(null);
          }
        } catch (err) {
          console.error('Error resolving user profile:', err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const loadOrgs = async (user: UserProfile) => {
    try {
      const orgs = await getOrganizations(user);
      setOrganizations(orgs);
      if (orgs.length > 0) {
        // Select preferred or first
        const preferred = orgs.find((o) => o.id === user.defaultOrgId) || orgs[0];
        setActiveOrg(preferred);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  const handleAuthenticated = async (result: AuthGateResult) => {
    if (result.userProfile) {
      setCurrentUser(result.userProfile);
      await loadOrgs(result.userProfile);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setOrganizations([]);
    setActiveOrg(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-neutral-800 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono text-neutral-500 tracking-wider">
          INITIALIZING HUNAROS FOUNDATION...
        </span>
      </div>
    );
  }

  // Not signed in or unauthorized
  if (!currentUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'organizations', label: 'Institutes', icon: Building2 },
    { id: 'staff', label: 'Staff & RBAC', icon: Users },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col selection:bg-neutral-900 selection:text-white">
      {/* Top Context Bar */}
      <TopNav
        currentUser={currentUser}
        organizations={organizations}
        activeOrg={activeOrg}
        onSelectOrg={(org) => setActiveOrg(org)}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar Nav */}
        <aside className="w-56 shrink-0 hidden md:block">
          <nav className="space-y-1 sticky top-20 text-xs font-medium text-left">
            <div className="px-3 pb-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Core Modules
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as typeof activeTab)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-left ${
                    isActive
                      ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-6 px-3 pb-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Upcoming Slices
            </div>

            <div className="space-y-1 text-neutral-400 text-xs select-none">
              <div className="flex items-center gap-2 px-3 py-1.5 opacity-60">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Batches & Seats</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 opacity-60">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Documents & Custody</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 opacity-60">
                <CalendarCheck2 className="w-3.5 h-3.5" />
                <span>Attendance Sync</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 opacity-60">
                <Coins className="w-3.5 h-3.5" />
                <span>Finance & Stipends</span>
              </div>
            </div>
          </nav>
        </aside>

        {/* Mobile Tab Row */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 px-4 py-2 flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`flex flex-col items-center gap-1 py-1 text-[11px] ${
                  isActive ? 'text-neutral-900 font-semibold' : 'text-neutral-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Workspace */}
        <main className="flex-1 pb-16 md:pb-6 overflow-hidden">
          {activeTab === 'overview' && (
            <OverviewView
              activeOrg={activeOrg}
              currentUser={currentUser}
              onNavigateTab={(t) => setActiveTab(t as typeof activeTab)}
            />
          )}

          {activeTab === 'organizations' && (
            <OrganizationsView
              organizations={organizations}
              currentUser={currentUser}
              activeOrg={activeOrg}
              onSelectOrg={(org) => setActiveOrg(org)}
              onRefreshOrgs={() => loadOrgs(currentUser)}
            />
          )}

          {activeTab === 'staff' && (
            <StaffListView
              currentUser={currentUser}
              organizations={organizations}
              activeOrg={activeOrg}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogView
              currentUser={currentUser}
              activeOrg={activeOrg}
            />
          )}
        </main>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Clock, UserCheck, Database } from 'lucide-react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { AuditLog, Organization, UserProfile } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface AuditLogViewProps {
  currentUser: UserProfile;
  activeOrg: Organization | null;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  currentUser,
  activeOrg,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuditLogs = async () => {
    if (!activeOrg) {
      setLogs([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const targetOrgId = activeOrg.id;
    const path = `organizations/${targetOrgId}/audit_logs`;

    try {
      const q = query(collection(db, path), limit(50));
      const snap = await getDocs(q);
      const items: AuditLog[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as AuditLog);
      });
      // Sort in-memory by occurredAt descending
      items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
      setLogs(items);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [activeOrg?.id]);

  if (!activeOrg) {
    return (
      <div className="space-y-6 text-left">
        <div className="pb-4 border-b border-neutral-200">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 text-balance">
            Immutable Audit Trail
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Append-only system record of material actions, security updates, and custody events.
          </p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center text-neutral-500 text-xs">
          No organization selected. Please select an active institute to view its audit trail.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 text-balance">
            Immutable Audit Trail
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Append-only system record of material actions, security updates, and custody events.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={fetchAuditLogs}
          isLoading={isLoading}
        >
          Refresh Logs
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Context / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(log.occurredAt))}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-neutral-900 font-sans">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-700 font-medium">
                      {log.entityType}: {log.entityId.slice(0, 14)}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-neutral-700">
                    {log.actorEmail}
                  </td>

                  <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-neutral-400 font-sans text-xs">
                    No audit records recorded yet for this organization.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

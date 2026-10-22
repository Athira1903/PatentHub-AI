import React, { useState } from 'react';
import {
  Search,
  Download,
  CheckCircle2,
  Edit3,
  Save,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminAuditSecurityProps {
  activityLogsData: { total: number; logs: any[]; totalPages: number };
  onFetchLogs: (page: number, type?: string, search?: string) => void;
  rolePermissions: Record<string, string[]>;
  allPermissionsList: any[];
  onSaveRolePermissions: (roleName: string, permissions: string[]) => Promise<void>;
}

export const AdminAuditSecurity: React.FC<AdminAuditSecurityProps> = ({
  activityLogsData,
  onFetchLogs,
  rolePermissions,
  allPermissionsList,
  onSaveRolePermissions,
}) => {
  const [subTab, setSubTab] = useState<'trail' | 'rbac' | 'indicators'>('trail');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // RBAC State
  const [selectedRole, setSelectedRole] = useState('Inventor');
  const [editablePermissions, setEditablePermissions] = useState<Record<string, string[]>>({
    ...rolePermissions,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    onFetchLogs(1, typeFilter === 'ALL' ? undefined : typeFilter, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    onFetchLogs(newPage, typeFilter === 'ALL' ? undefined : typeFilter, searchTerm);
  };

  const handleTypeChange = (newType: string) => {
    setTypeFilter(newType);
    setCurrentPage(1);
    onFetchLogs(1, newType === 'ALL' ? undefined : newType, searchTerm);
  };

  // CSV Export for Audit Trail
  const exportAuditCsv = () => {
    if (!activityLogsData.logs || activityLogsData.logs.length === 0) {
      toast.error('No audit records to export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Timestamp,Actor,Actor Role,Action,Type,Resource,Organization,Status\n';

    activityLogsData.logs.forEach((log) => {
      const dateStr = log.createdAt ? new Date(log.createdAt).toISOString() : '';
      csvContent += `"${dateStr}","${log.user}","${log.userRole || 'User'}","${log.action}","${log.type}","${log.resource}","${log.organization}","${log.status || 'SUCCESS'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `patenthub_audit_trail_page_${currentPage}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit trail exported to CSV');
  };

  const handleTogglePermission = (permId: string) => {
    if (!isEditing) return;
    const current = editablePermissions[selectedRole] || [];
    const updated = current.includes(permId)
      ? current.filter((p) => p !== permId)
      : [...current, permId];

    setEditablePermissions({
      ...editablePermissions,
      [selectedRole]: updated,
    });
  };

  const handleSaveRole = async () => {
    setSaving(true);
    try {
      await onSaveRolePermissions(selectedRole, editablePermissions[selectedRole] || []);
      setIsEditing(false);
      toast.success(`Saved permissions for role: ${selectedRole}`);
    } catch {
      toast.error('Failed to save role permissions');
    } finally {
      setSaving(false);
    }
  };

  const ROLES = [
    { key: 'Admin', label: 'Platform Admin' },
    { key: 'OrgAdmin', label: 'Organization Admin' },
    { key: 'Inventor', label: 'Inventor' },
    { key: 'CoInventor', label: 'Co-Inventor' },
    { key: 'Guide', label: 'Guide / Supervisor' },
    { key: 'PatentExpert', label: 'Patent Expert' },
  ];

  // Group permissions by category
  const categoriesMap: Record<string, any[]> = {};
  allPermissionsList.forEach((p) => {
    const cat = p.category || 'GENERAL';
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push(p);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#315C55]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#6F8F88]">
              Governance & Integrity
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#253330] tracking-tight">
            Security & Platform Audit Logs
          </h1>
          <p className="text-xs text-[#71807C] font-medium mt-0.5">
            Tamper-evident administrative audit trail, security-relevant events, and RBAC matrix governance
          </p>
        </div>

        {/* Sub Tabs */}
        <div className="flex items-center bg-[#F7F9F8] border border-[#E5EBE8] p-1 rounded-2xl">
          {[
            { id: 'trail', label: 'Audit Trail' },
            { id: 'rbac', label: 'RBAC Matrix' },
            { id: 'indicators', label: 'Security Indicators' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                subTab === t.id
                  ? 'bg-[#315C55] text-white shadow-3xs'
                  : 'text-[#71807C] hover:text-[#253330]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUBTAB 1: AUDIT TRAIL */}
      {subTab === 'trail' && (
        <div className="space-y-4">
          {/* Search & Export Toolbar */}
          <div className="p-4 bg-white border border-[#E5EBE8] rounded-2xl shadow-3xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-[#8A9B96] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit trail by actor, action, or target resource..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs text-[#253330] placeholder-[#8A9B96] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#315C55]"
              />
            </form>

            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="px-3 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#253330] focus:outline-none"
              >
                <option value="ALL">All Event Types</option>
                <option value="SECURITY">Security Actions</option>
                <option value="ADMIN">Administrative</option>
                <option value="AUDIT">Audit Logs</option>
                <option value="DOCUMENT">Document Operations</option>
                <option value="AI">AI Operations</option>
              </select>

              <button
                onClick={exportAuditCsv}
                className="px-3 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] border border-[#E5EBE8] text-[#253330] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Export current page to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#315C55]" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5EBE8] bg-[#F7F9F8]/60 text-[#71807C] font-black uppercase tracking-wider">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Target Resource</th>
                    <th className="py-3.5 px-4">Organization</th>
                    <th className="py-3.5 px-4 text-right">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EBE8]/60">
                  {activityLogsData.logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs font-bold text-[#71807C]">
                        No audit records found matching query.
                      </td>
                    </tr>
                  ) : (
                    activityLogsData.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F7F9F8]/60 transition">
                        <td className="py-3.5 px-4 font-mono text-[#71807C] whitespace-nowrap">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-[#253330]">{log.user}</div>
                          <span className="text-[10px] text-[#71807C] font-bold">{log.userRole || 'User'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-[#315C55]">{log.action}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-[#F0F4F2] text-[#315C55] font-black rounded-full text-[10px]">
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#253330] max-w-xs truncate">{log.resource}</td>
                        <td className="py-3.5 px-4 text-[#71807C] max-w-xs truncate">{log.organization}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-black rounded-full text-[10px]">
                            {log.status || 'SUCCESS'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {activityLogsData.totalPages > 1 && (
              <div className="p-4 border-t border-[#E5EBE8] bg-[#F7F9F8]/60 flex items-center justify-between text-xs">
                <span className="font-bold text-[#71807C]">
                  Showing page {currentPage} of {activityLogsData.totalPages} ({activityLogsData.total} records total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-1.5 bg-white border border-[#E5EBE8] rounded-xl text-[#253330] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= activityLogsData.totalPages}
                    className="p-1.5 bg-white border border-[#E5EBE8] rounded-xl text-[#253330] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: RBAC MATRIX */}
      {subTab === 'rbac' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E5EBE8] pb-4">
              <div>
                <h3 className="text-sm font-black text-[#253330] uppercase tracking-wide">
                  Role-Based Access Control (RBAC) Governance
                </h3>
                <p className="text-xs text-[#71807C] mt-0.5">
                  Configure active permission flags for platform roles. All permission changes are logged in the audit trail.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#71807C] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveRole}
                      disabled={saving}
                      className="px-3.5 py-1.5 bg-[#315C55] hover:bg-[#254640] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save Matrix'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-1.5 bg-[#F7F9F8] hover:bg-[#F0F4F2] border border-[#E5EBE8] text-[#253330] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#315C55]" />
                    <span>Edit Permissions</span>
                  </button>
                )}
              </div>
            </div>

            {/* Role Switcher Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setSelectedRole(r.key)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                    selectedRole === r.key
                      ? 'bg-[#315C55] text-white shadow-3xs'
                      : 'bg-[#F7F9F8] text-[#5C6B67] hover:bg-[#E5EBE8]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Permission Checkboxes by Category */}
            <div className="space-y-6 pt-2">
              {Object.entries(categoriesMap).map(([category, perms]) => (
                <div key={category} className="p-4 bg-[#F7F9F8] rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-[#253330] uppercase tracking-wider">
                    {category} Permissions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {perms.map((p: any) => {
                      const isGranted = (editablePermissions[selectedRole] || []).includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleTogglePermission(p.id)}
                          className={`p-3 rounded-xl border text-xs transition cursor-pointer flex items-start gap-3 ${
                            isGranted
                              ? 'bg-white border-[#315C55]/40 text-[#253330]'
                              : 'bg-white/60 border-[#E5EBE8] text-[#71807C] opacity-75'
                          } ${isEditing ? 'hover:border-[#315C55]' : 'cursor-default'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isGranted}
                            disabled={!isEditing}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-[#315C55] focus:ring-[#315C55]"
                          />
                          <div>
                            <div className="font-extrabold">{p.name}</div>
                            <p className="text-[10px] text-[#71807C] mt-0.5">{p.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SECURITY INDICATORS */}
      {subTab === 'indicators' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
              <span className="text-[10px] font-black uppercase text-[#71807C]">Audit Trail Integrity</span>
              <div className="text-3xl font-black text-emerald-700 mt-1">Immutable</div>
              <span className="text-xs text-[#71807C] font-semibold mt-1 block">PostgreSQL activity log protected</span>
            </div>
            <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
              <span className="text-[10px] font-black uppercase text-[#71807C]">Secret Ingestion Sanitizer</span>
              <div className="text-3xl font-black text-[#315C55] mt-1">Active</div>
              <span className="text-xs text-[#71807C] font-semibold mt-1 block">Zero credentials or drafts logged</span>
            </div>
            <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
              <span className="text-[10px] font-black uppercase text-[#71807C]">Authorization Mode</span>
              <div className="text-3xl font-black text-[#253330] mt-1">RBAC + Org Isolated</div>
              <span className="text-xs text-[#71807C] font-semibold mt-1 block">Strict server-side policy enforcement</span>
            </div>
          </div>

          <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
            <h3 className="text-sm font-black text-[#253330] uppercase tracking-wide">
              Security Best Practices & Access Control Policies
            </h3>
            <div className="space-y-3 text-xs text-[#5C6B67]">
              <div className="p-3 bg-[#F7F9F8] rounded-2xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#253330]">Least Privilege Enforcement:</strong> Administrative accounts have operational and audit oversight but are restricted from viewing confidential provisional/complete invention claims without explicit project collaborator authorization.
                </span>
              </div>
              <div className="p-3 bg-[#F7F9F8] rounded-2xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#253330]">Audit Trail Sanitization:</strong> All sensitive operations (role changes, account suspensions, verification decisions, and permission updates) persist structured metadata in PostgreSQL while stripping passwords, tokens, API keys, and patent specifications.
                </span>
              </div>
              <div className="p-3 bg-[#F7F9F8] rounded-2xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#253330]">Multi-Tenant Organization Isolation:</strong> Projects and members belonging to specific educational institutions or universities are strictly scoped via organization foreign keys on server queries.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState, useMemo } from 'react';
import { Search, Download, Eye, Shield, User, Settings, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

type AuditAction = 
  | 'login' 
  | 'logout' 
  | 'create_ticket' 
  | 'void_ticket' 
  | 'edit_user' 
  | 'create_user' 
  | 'delete_user'
  | 'change_setting'
  | 'export_data'
  | 'failed_login';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  badgeNumber: string;
  action: AuditAction;
  description: string;
  ipAddress: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

const ACTION_CONFIG: Record<AuditAction, { icon: typeof User; label: string; color: string }> = {
  login: { icon: User, label: 'Login', color: 'text-green-600' },
  logout: { icon: User, label: 'Logout', color: 'text-gray-600' },
  create_ticket: { icon: FileText, label: 'Create Ticket', color: 'text-blue-600' },
  void_ticket: { icon: AlertCircle, label: 'Void Ticket', color: 'text-orange-600' },
  edit_user: { icon: User, label: 'Edit User', color: 'text-blue-600' },
  create_user: { icon: User, label: 'Create User', color: 'text-green-600' },
  delete_user: { icon: User, label: 'Delete User', color: 'text-red-600' },
  change_setting: { icon: Settings, label: 'Change Setting', color: 'text-purple-600' },
  export_data: { icon: Download, label: 'Export Data', color: 'text-blue-600' },
  failed_login: { icon: AlertCircle, label: 'Failed Login', color: 'text-red-600' },
};

const SEVERITY_CONFIG = {
  info: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  warning: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
  critical: { icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
};

export function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | AuditAction>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Demo data
  const demoLogs: AuditLog[] = [
    { id: 'log-1', userId: 'u-1', userName: 'Kwame Asante', badgeNumber: 'GPS001', action: 'login', description: 'User logged in successfully', ipAddress: '192.168.1.105', timestamp: '2024-01-15T08:30:00Z', severity: 'info' },
    { id: 'log-2', userId: 'u-3', userName: 'John Appiah', badgeNumber: 'ADMIN01', action: 'create_user', description: 'Created new user: GPS045', ipAddress: '192.168.1.50', timestamp: '2024-01-15T09:15:00Z', severity: 'info' },
    { id: 'log-3', userId: 'u-2', userName: 'Akua Mensah', badgeNumber: 'GPS002', action: 'create_ticket', description: 'Issued ticket #TKT-2024-0456', ipAddress: '10.0.0.25', timestamp: '2024-01-15T09:45:00Z', severity: 'info' },
    { id: 'log-4', userId: 'u-4', userName: 'Grace Osei', badgeNumber: 'SUPER01', action: 'change_setting', description: 'Changed system setting: max_ticket_amount', ipAddress: '192.168.1.10', timestamp: '2024-01-15T10:00:00Z', severity: 'warning', metadata: { oldValue: '500', newValue: '1000' } },
    { id: 'log-5', userId: 'unknown', userName: 'Unknown', badgeNumber: 'N/A', action: 'failed_login', description: 'Failed login attempt for user: ADMIN99', ipAddress: '45.67.89.123', timestamp: '2024-01-15T10:30:00Z', severity: 'critical' },
    { id: 'log-6', userId: 'u-3', userName: 'John Appiah', badgeNumber: 'ADMIN01', action: 'void_ticket', description: 'Voided ticket #TKT-2024-0123 - Reason: Duplicate entry', ipAddress: '192.168.1.50', timestamp: '2024-01-15T11:00:00Z', severity: 'warning' },
    { id: 'log-7', userId: 'u-4', userName: 'Grace Osei', badgeNumber: 'SUPER01', action: 'export_data', description: 'Exported tickets data for January 2024', ipAddress: '192.168.1.10', timestamp: '2024-01-15T11:30:00Z', severity: 'info' },
    { id: 'log-8', userId: 'u-1', userName: 'Kwame Asante', badgeNumber: 'GPS001', action: 'logout', description: 'User logged out', ipAddress: '192.168.1.105', timestamp: '2024-01-15T12:00:00Z', severity: 'info' },
    { id: 'log-9', userId: 'unknown', userName: 'Unknown', badgeNumber: 'N/A', action: 'failed_login', description: 'Multiple failed login attempts detected', ipAddress: '45.67.89.123', timestamp: '2024-01-15T12:15:00Z', severity: 'critical' },
    { id: 'log-10', userId: 'u-4', userName: 'Grace Osei', badgeNumber: 'SUPER01', action: 'delete_user', description: 'Deleted user: GPS099 - Reason: Retired', ipAddress: '192.168.1.10', timestamp: '2024-01-15T13:00:00Z', severity: 'warning' },
  ];

  const filteredLogs = useMemo(() => {
    return demoLogs.filter(log => {
      const matchesSearch = log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           log.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           log.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
      return matchesSearch && matchesAction && matchesSeverity;
    });
  }, [demoLogs, searchQuery, actionFilter, severityFilter]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-gray-500">Track all system activities and security events</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export Logs
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Events</p>
          <p className="text-2xl font-bold text-gray-900">{demoLogs.length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-600" />
            <p className="text-sm text-gray-500">Info</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{demoLogs.filter(l => l.severity === 'info').length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500" />
            <p className="text-sm text-gray-500">Warning</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{demoLogs.filter(l => l.severity === 'warning').length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-600" />
            <p className="text-sm text-gray-500">Critical</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{demoLogs.filter(l => l.severity === 'critical').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, badge, or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
          />
        </div>
        <select
          aria-label="Filter by action"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
        >
          <option value="all">All Actions</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="create_ticket">Create Ticket</option>
          <option value="void_ticket">Void Ticket</option>
          <option value="create_user">Create User</option>
          <option value="edit_user">Edit User</option>
          <option value="delete_user">Delete User</option>
          <option value="change_setting">Change Setting</option>
          <option value="export_data">Export Data</option>
          <option value="failed_login">Failed Login</option>
        </select>
        <select
          aria-label="Filter by severity"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
        >
          <option value="all">All Severity</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <select
          aria-label="Filter by date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Severity</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log) => {
                const actionConfig = ACTION_CONFIG[log.action];
                const severityConfig = SEVERITY_CONFIG[log.severity];
                const ActionIcon = actionConfig.icon;
                const SeverityIcon = severityConfig.icon;
                
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.userName}</p>
                        <p className="text-xs text-gray-500 font-mono">{log.badgeNumber}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 text-sm ${actionConfig.color}`}>
                        <ActionIcon className="w-4 h-4" />
                        {actionConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-700 max-w-xs truncate">{log.description}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 font-mono">{log.ipAddress}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${severityConfig.color} ${severityConfig.bg}`}>
                        <SeverityIcon className="w-3 h-3" />
                        {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button 
                        title="View details"
                        onClick={() => setSelectedLog(log)}
                        className="p-2 hover:bg-gray-100 text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No audit logs found matching your criteria.
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Timestamp</p>
                  <p className="font-medium text-gray-900">{formatTimestamp(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <p className="text-gray-500">User</p>
                  <p className="font-medium text-gray-900">{selectedLog.userName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Badge Number</p>
                  <p className="font-medium text-gray-900 font-mono">{selectedLog.badgeNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">IP Address</p>
                  <p className="font-medium text-gray-900 font-mono">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <p className="text-gray-500">Action</p>
                  <p className="font-medium text-gray-900">{ACTION_CONFIG[selectedLog.action].label}</p>
                </div>
                <div>
                  <p className="text-gray-500">Severity</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedLog.severity}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-900">{selectedLog.description}</p>
              </div>
              {selectedLog.metadata && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Additional Data</p>
                  <pre className="text-xs bg-gray-50 p-3 overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#1A1F3A] text-white font-medium hover:bg-[#1A1F3A]/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogsPage;

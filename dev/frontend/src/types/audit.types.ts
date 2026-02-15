// Audit Log Types

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'print'
  | 'sync'
  | 'export'
  | 'import'
  | 'assign'
  | 'transfer'
  | 'activate'
  | 'deactivate'
  | 'reset_password'
  | 'change_status';

export type AuditEntityType = 
  | 'ticket'
  | 'payment'
  | 'objection'
  | 'officer'
  | 'station'
  | 'region'
  | 'division'
  | 'district'
  | 'offence'
  | 'user'
  | 'settings'
  | 'system';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: string;
  
  // Who
  userId?: string;
  userName: string;
  userRole: string;
  userBadgeNumber?: string;
  
  // What
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityName?: string;
  
  // Details
  description: string;
  oldValue?: string;
  newValue?: string;
  metadata?: string;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  
  // Location context
  stationId?: string;
  stationName?: string;
  regionId?: string;
  regionName?: string;
  
  // Severity
  severity: AuditSeverity;
  
  // Status
  success: boolean;
  errorMessage?: string;
}

export interface AuditFilters {
  search?: string;
  action?: AuditAction | AuditAction[];
  entityType?: AuditEntityType | AuditEntityType[];
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  severity?: AuditSeverity;
  stationId?: string;
  regionId?: string;
}

export interface AuditStats {
  totalEntries: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  bySeverity: { info: number; warning: number; critical: number };
  byUser: Array<{ userId: string; userName: string; count: number }>;
  recentCritical: Array<{
    id: string;
    timestamp: string;
    action: string;
    entityType: string;
    description: string;
    userName: string;
    severity: string;
  }>;
}

export interface CreateAuditLogInput {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  description: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
  severity?: AuditSeverity;
  success?: boolean;
  errorMessage?: string;
}

// Audit Store - Centralized audit logging
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AuditLog,
  AuditAction,
  AuditEntityType,
  AuditSeverity,
  AuditFilters,
  AuditStats,
  CreateAuditLogInput,
} from '@/types';
import { auditAPI } from '@/lib/api/audit.api';
import { useAuthStore } from './auth.store';

interface AuditState {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  filters: AuditFilters;
}

interface AuditActions {
  // API actions
  fetchAuditLogs: () => Promise<void>;

  // Core actions
  addLog: (input: CreateAuditLogInput) => Promise<AuditLog>;
  getLogs: (filters?: AuditFilters) => AuditLog[];
  getLogById: (id: string) => AuditLog | undefined;

  // Filtering
  setFilters: (filters: Partial<AuditFilters>) => void;
  clearFilters: () => void;

  // Stats
  getStats: () => AuditStats;

  // Entity-specific queries
  getLogsByEntity: (entityType: AuditEntityType, entityId: string) => AuditLog[];
  getLogsByUser: (userId: string) => AuditLog[];
  getLogsBySeverity: (severity: AuditSeverity) => AuditLog[];
  getLogsByAction: (action: AuditAction) => AuditLog[];
  getLogsByStation: (stationId: string) => AuditLog[];
  getLogsByRegion: (regionId: string) => AuditLog[];
  getLogsByDateRange: (startDate: string, endDate: string) => AuditLog[];

  // Recent logs
  getRecentLogs: (limit?: number) => AuditLog[];

  // Utility
  clearLogs: () => void;
  setError: (error: string | null) => void;
}

const initialFilters: AuditFilters = {
  action: undefined,
  entityType: undefined,
  severity: undefined,
  userId: undefined,
  stationId: undefined,
  regionId: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  search: undefined,
};

const generateAuditId = () => `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useAuditStore = create<AuditState & AuditActions>()(
  persist(
    (set, get) => ({
      logs: [],
      isLoading: false,
      error: null,
      filters: initialFilters,

      // Fetch audit logs from API
      fetchAuditLogs: async () => {
        set({ isLoading: true });
        try {
          const response = await auditAPI.list();
          set({ logs: response.items, isLoading: false, error: null });
        } catch {
          set({ isLoading: false });
        }
      },

      // Add a new audit log
      addLog: async (input: CreateAuditLogInput): Promise<AuditLog> => {
        // Get current user context from auth store
        const authState = useAuthStore.getState();
        const currentUser = authState.user;
        const officer = currentUser?.officer;

        const newLog: AuditLog = {
          id: generateAuditId(),
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          entityName: input.entityName,
          description: input.description,
          severity: input.severity || 'info',
          success: input.success ?? true,
          errorMessage: input.errorMessage,
          // User context from auth store
          userId: currentUser?.id || 'system',
          userName: currentUser?.fullName || currentUser?.firstName || 'System',
          userRole: currentUser?.role || 'system',
          userBadgeNumber: officer?.badgeNumber,
          stationId: officer?.stationId,
          stationName: officer?.stationName,
          regionId: officer?.regionId,
          // Values
          oldValue: input.oldValue,
          newValue: input.newValue,
          metadata: input.metadata,
          // Browser context
          ipAddress: undefined, // Would be set by server
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          logs: [newLog, ...state.logs],
        }));

        return newLog;
      },

      // Get filtered logs
      getLogs: (customFilters?: AuditFilters): AuditLog[] => {
        const { logs, filters } = get();
        const activeFilters = customFilters || filters;

        return logs.filter((log) => {
          // Handle action filter (can be single or array)
          if (activeFilters.action) {
            const actions = Array.isArray(activeFilters.action) ? activeFilters.action : [activeFilters.action];
            if (!actions.includes(log.action)) return false;
          }

          // Handle entityType filter (can be single or array)
          if (activeFilters.entityType) {
            const entityTypes = Array.isArray(activeFilters.entityType) ? activeFilters.entityType : [activeFilters.entityType];
            if (!entityTypes.includes(log.entityType)) return false;
          }

          if (activeFilters.severity && log.severity !== activeFilters.severity) return false;
          if (activeFilters.userId && log.userId !== activeFilters.userId) return false;
          if (activeFilters.stationId && log.stationId !== activeFilters.stationId) return false;
          if (activeFilters.regionId && log.regionId !== activeFilters.regionId) return false;

          if (activeFilters.dateFrom) {
            const logDate = new Date(log.timestamp);
            const startDate = new Date(activeFilters.dateFrom);
            if (logDate < startDate) return false;
          }

          if (activeFilters.dateTo) {
            const logDate = new Date(log.timestamp);
            const endDate = new Date(activeFilters.dateTo);
            if (logDate > endDate) return false;
          }

          if (activeFilters.search) {
            const query = activeFilters.search.toLowerCase();
            const searchable = `${log.description} ${log.userName} ${log.entityId}`.toLowerCase();
            if (!searchable.includes(query)) return false;
          }

          return true;
        });
      },

      getLogById: (id: string): AuditLog | undefined => {
        return get().logs.find((log) => log.id === id);
      },

      setFilters: (newFilters: Partial<AuditFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      clearFilters: () => {
        set({ filters: initialFilters });
      },

      // Get statistics
      getStats: (): AuditStats => {
        const { logs } = get();

        const actionsByType: Record<AuditAction, number> = {} as Record<AuditAction, number>;
        const actionsByEntity: Record<AuditEntityType, number> = {} as Record<AuditEntityType, number>;
        const userActionCount: Record<string, { userId: string; userName: string; count: number }> = {};

        logs.forEach((log) => {
          actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
          actionsByEntity[log.entityType] = (actionsByEntity[log.entityType] || 0) + 1;

          if (!userActionCount[log.userId || 'system']) {
            userActionCount[log.userId || 'system'] = { userId: log.userId || 'system', userName: log.userName, count: 0 };
          }
          userActionCount[log.userId || 'system'].count += 1;
        });

        // Top users by action count
        const topUsers = Object.values(userActionCount)
          .map(u => ({ userId: u.userId, userName: u.userName, actionCount: u.count }))
          .sort((a, b) => b.actionCount - a.actionCount)
          .slice(0, 10);

        // Recent activity (last 10 logs)
        const recentActivity = logs.slice(0, 10);

        return {
          totalActions: logs.length,
          actionsByType,
          actionsByEntity,
          recentActivity,
          topUsers,
        };
      },

      // Entity-specific queries
      getLogsByEntity: (entityType: AuditEntityType, entityId: string): AuditLog[] => {
        return get().logs.filter(
          (log) => log.entityType === entityType && log.entityId === entityId
        );
      },

      getLogsByUser: (userId: string): AuditLog[] => {
        return get().logs.filter((log) => log.userId === userId);
      },

      getLogsBySeverity: (severity: AuditSeverity): AuditLog[] => {
        return get().logs.filter((log) => log.severity === severity);
      },

      getLogsByAction: (action: AuditAction): AuditLog[] => {
        return get().logs.filter((log) => log.action === action);
      },

      getLogsByStation: (stationId: string): AuditLog[] => {
        return get().logs.filter((log) => log.stationId === stationId);
      },

      getLogsByRegion: (regionId: string): AuditLog[] => {
        return get().logs.filter((log) => log.regionId === regionId);
      },

      getLogsByDateRange: (startDate: string, endDate: string): AuditLog[] => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        return get().logs.filter((log) => {
          const logDate = new Date(log.timestamp);
          return logDate >= start && logDate <= end;
        });
      },

      getRecentLogs: (limit = 20): AuditLog[] => {
        return get().logs.slice(0, limit);
      },

      clearLogs: () => {
        set({ logs: [] });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'gps-audit-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        logs: state.logs.slice(0, 500), // Keep last 500 logs in storage
      }),
    }
  )
);

// Convenience hook for logging actions
export const useAuditLogger = () => {
  const addLog = useAuditStore((state) => state.addLog);

  return {
    logCreate: (entityType: AuditEntityType, entityId: string, description: string, metadata?: Record<string, unknown>) =>
      addLog({ action: 'create', entityType, entityId, description, severity: 'info', success: true, metadata }),

    logUpdate: (entityType: AuditEntityType, entityId: string, description: string, oldValue?: Record<string, unknown>, newValue?: Record<string, unknown>) =>
      addLog({ action: 'update', entityType, entityId, description, severity: 'info', success: true, oldValue, newValue }),

    logDelete: (entityType: AuditEntityType, entityId: string, description: string) =>
      addLog({ action: 'delete', entityType, entityId, description, severity: 'warning', success: true }),

    logLogin: (success = true, errorMessage?: string) =>
      addLog({
        action: 'login',
        entityType: 'user',
        entityId: 'session',
        description: success ? 'User logged in successfully' : 'Failed login attempt',
        severity: success ? 'info' : 'warning',
        success,
        errorMessage,
      }),

    logLogout: () =>
      addLog({
        action: 'logout',
        entityType: 'user',
        entityId: 'session',
        description: 'User logged out',
        severity: 'info',
        success: true,
      }),
  };
};

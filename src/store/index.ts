// Export all stores

export { 
  useAuthStore, 
  useUser, 
  useIsAuthenticated, 
  useInterfaceMode,
  useIsHandheld,
  useJurisdiction 
} from './auth.store';

export { 
  useTicketStore, 
  useNewTicket, 
  useTicketList, 
  useSelectedTicket 
} from './ticket.store';

export { 
  useUIStore, 
  useToast, 
  useConfirm, 
  useSidebar 
} from './ui.store';

export { 
  useSyncStore, 
  useIsOnline, 
  useIsSyncing, 
  usePendingCount 
} from './sync.store';

export {
  useOffenceStore,
  useOffences,
  useActiveOffences,
  useOffenceLoading,
} from './offence.store';

export {
  useOfficerStore,
  useOfficers,
  useActiveOfficers,
  useOfficerLoading,
} from './officer.store';

export {
  usePaymentStore,
  usePayments,
  useSelectedPayment,
  usePaymentFilters,
  usePaymentLoading,
} from './payment.store';

export {
  useObjectionStore,
  useObjections,
  useSelectedObjection,
  useObjectionFilters,
  usePendingObjectionsCount,
} from './objection.store';

export {
  useStationStore,
  useStations,
  useRegions,
  useDivisions,
  useDistricts,
  useSelectedStation,
  useActiveStations,
} from './station.store';

export {
  useSettingsStore,
  useSystemSettings,
  useTicketSettings,
  useNotificationSettings,
  useSecuritySettings,
  useDataSettings,
  useDeviceSettings,
  useUserPreferences,
  useTheme,
  useCurrency,
} from './settings.store';

export {
  useAuditStore,
  useAuditLogger,
} from './audit.store';

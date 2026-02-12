import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Car, 
  User, 
  AlertTriangle, 
  Wifi, 
  WifiOff,
  Clock,
  Ban,
  CheckCircle2,
  FileWarning,
  X,
  Printer
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuthStore, useIsOnline, usePendingCount } from '@/store';
import { formatCurrency } from '@/lib/utils/formatting';
import { printTicket } from '@/lib/utils/print';
import { cn } from '@/lib/utils';
import { usePrinter } from '@/hooks/usePrinter';
import { TicketReceipt, TicketListItem } from '@/components/shared';


// Demo lookup data
const DEMO_VEHICLES: Record<string, {
  registration: string;
  type: string;
  color: string;
  make: string;
  owner: string;
  offenses: Array<{ id: string; date: string; offense: string; fine: number; status: 'paid' | 'unpaid' | 'overdue' }>;
}> = {
  'GR-1234-24': {
    registration: 'GR-1234-24',
    type: 'Saloon Car',
    color: 'Silver',
    make: 'Toyota Corolla',
    owner: 'Kwame Mensah',
    offenses: [
      { id: 'GPS-2025-0892', date: '2025-12-15', offense: 'Speeding', fine: 200, status: 'unpaid' },
      { id: 'GPS-2025-0456', date: '2025-10-03', offense: 'No Seatbelt', fine: 50, status: 'paid' },
    ]
  },
  'AS-5678-23': {
    registration: 'AS-5678-23',
    type: 'SUV',
    color: 'Black',
    make: 'Honda CR-V',
    owner: 'Ama Asante',
    offenses: [
      { id: 'GPS-2025-0234', date: '2025-11-20', offense: 'Illegal Parking', fine: 80, status: 'overdue' },
      { id: 'GPS-2025-0112', date: '2025-09-15', offense: 'Red Light Violation', fine: 150, status: 'overdue' },
      { id: 'GPS-2024-0891', date: '2024-12-01', offense: 'Phone While Driving', fine: 200, status: 'paid' },
    ]
  }
};

const DEMO_DRIVERS: Record<string, {
  name: string;
  license: string;
  phone: string;
  offenses: Array<{ id: string; date: string; offense: string; vehicle: string; fine: number; status: 'paid' | 'unpaid' | 'overdue' }>;
}> = {
  'DL-123456': {
    name: 'Kwame Mensah',
    license: 'DL-123456',
    phone: '024 123 4567',
    offenses: [
      { id: 'GPS-2025-0892', date: '2025-12-15', offense: 'Speeding', vehicle: 'GR-1234-24', fine: 200, status: 'unpaid' },
    ]
  },
  'GHA-123456789-0': {
    name: 'Kofi Owusu',
    license: 'GHA-123456789-0',
    phone: '020 987 6543',
    offenses: [
      { id: 'GPS-2025-0567', date: '2025-11-28', offense: 'Wrong Lane', vehicle: 'GT-9012-24', fine: 120, status: 'overdue' },
      { id: 'GPS-2025-0321', date: '2025-08-10', offense: 'Speeding', vehicle: 'GT-9012-24', fine: 200, status: 'overdue' },
    ]
  }
};

type LookupType = 'vehicle' | 'driver' | null;
type TicketStatusType = 'paid' | 'unpaid' | 'overdue';

// Recent tickets data
const RECENT_TICKETS: Array<{
  id: string;
  vehicle: string;
  vehicleType: string;
  vehicleColor: string;
  driver: string;
  driverId: string;
  offense: string;
  amount: number;
  status: TicketStatusType;
  time: string;
  date: string;
  location: string;
}> = [
  { id: 'GPS-2026-001', vehicle: 'GR-1234-24', vehicleType: 'Toyota Corolla', vehicleColor: 'Silver', driver: 'Kwame Mensah', driverId: 'DL-123456', offense: 'Speeding', amount: 200, status: 'paid', time: '10:30 AM', date: '2026-01-02', location: 'Ring Road Central, Accra' },
  { id: 'GPS-2026-002', vehicle: 'AS-5678-23', vehicleType: 'Honda CR-V', vehicleColor: 'Black', driver: 'Ama Asante', driverId: 'DL-789012', offense: 'No Seatbelt', amount: 50, status: 'unpaid', time: '09:15 AM', date: '2026-01-02', location: 'Liberation Road, Accra' },
  { id: 'GPS-2026-003', vehicle: 'GT-9012-24', vehicleType: 'Mercedes E-Class', vehicleColor: 'White', driver: 'Kofi Owusu', driverId: 'DL-345678', offense: 'Illegal Parking', amount: 80, status: 'overdue', time: '08:45 AM', date: '2026-01-02', location: 'Oxford Street, Osu' },
];

export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isOnline = useIsOnline();
  const pendingCount = usePendingCount();
  const printer = usePrinter();


  const [lookupType, setLookupType] = useState<LookupType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<typeof RECENT_TICKETS[0] | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Generate QR code when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      const paymentUrl = `https://pay.gps.gov.gh/ticket/${selectedTicket.id}`;
      QRCode.toDataURL(paymentUrl, { width: 120, margin: 1 })
        .then(setQrCodeUrl)
        .catch(console.error);
    } else {
      setQrCodeUrl('');
    }
  }, [selectedTicket]);

  // Demo stats
  const todayStats = { tickets: 12, amount: 2450 };
  const firstName = user?.firstName || 'Officer';

  // Print ticket receipt using shared utility
  const handlePrint = async (ticket: typeof RECENT_TICKETS[0]) => {
    const ticketData = {
      ticketNumber: ticket.id,
      date: new Date(ticket.date).toLocaleDateString('en-GB'),
      time: ticket.time,
      vehicle: ticket.vehicle,
      vehicleType: ticket.vehicleType,
      vehicleColor: ticket.vehicleColor,
      driver: ticket.driver,
      driverId: ticket.driverId,
      offenses: [{ name: ticket.offense, fine: ticket.amount }],
      totalFine: ticket.amount,
      location: ticket.location,
      officerName: user?.fullName || 'GPS Officer',
      officerBadge: user?.officer?.badgeNumber || 'GPS-0000',
    };

    if (printer.isConnected) {
      const job = {
        id: `print-${Date.now()}`,
        type: 'ticket' as const,
        data: ticketData,
        createdAt: new Date().toISOString(),
        status: 'queued' as const,
        attempts: 0,
        content: [
          { type: 'text', text: 'GHANA POLICE SERVICE', align: 'center', bold: true },
          { type: 'text', text: 'TRAFFIC VIOLATION TICKET', align: 'center' },
          { type: 'line', style: 'dashed' },
          { type: 'text', text: `TICKET NO: ${ticketData.ticketNumber}`, align: 'center', size: 'large', bold: true },
          { type: 'line', style: 'dashed' },
          { type: 'text', text: `DATE: ${ticketData.date}  TIME: ${ticketData.time}` },
          { type: 'text', text: `VEHICLE: ${ticketData.vehicle}`, bold: true },
          ...(ticketData.vehicleType || ticketData.vehicleColor ? [{ type: 'text', text: [ticketData.vehicleColor, ticketData.vehicleType].filter(Boolean).join(' ') }] : []),
          { type: 'text', text: `DRIVER: ${ticketData.driver}` },
          { type: 'text', text: `ID: ${ticketData.driverId}` },
          { type: 'line', style: 'dashed' },
          { type: 'text', text: 'OFFENCES:', bold: true },
          ...ticketData.offenses.map((o, i) => ({ type: 'text', text: `${i + 1}. ${o.name} (GHc${o.fine})` })),
          { type: 'line', style: 'double' },
          { type: 'text', text: `TOTAL: GHc${ticketData.totalFine.toFixed(2)}`, align: 'right', bold: true, size: 'large' },
          { type: 'line', style: 'double' },
          { type: 'text', text: 'PAY WITHIN 14 DAYS', align: 'center', bold: true },
          { type: 'text', text: 'Mobile Money: *920*44#', align: 'center' },
          { type: 'feed', lines: 2 },
          { type: 'text', text: `Officer: ${ticketData.officerName}`, align: 'center' },
          { type: 'text', text: `Badge: ${ticketData.officerBadge}`, align: 'center' },
          { type: 'feed', lines: 2 }
        ]
      };
      await printer.print(job);
    } else {
      printTicket(ticketData);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setNoResults(false);
    setSearchResult(null);
    
    // Simulate API call
    setTimeout(() => {
      const query = searchQuery.toUpperCase().replace(/\s/g, '');
      
      if (lookupType === 'vehicle') {
        const result = Object.values(DEMO_VEHICLES).find(v => 
          v.registration.replace(/-/g, '').includes(query.replace(/-/g, ''))
        );
        setSearchResult(result || null);
        setNoResults(!result);
      } else {
        const result = Object.values(DEMO_DRIVERS).find(d => 
          d.license.replace(/-/g, '').includes(query.replace(/-/g, '')) ||
          d.name.toUpperCase().includes(query)
        );
        setSearchResult(result || null);
        setNoResults(!result);
      }
      
      setIsSearching(false);
    }, 500);
  };

  const getTotalOwing = (offenses: any[]) => {
    return offenses
      .filter(o => o.status !== 'paid')
      .reduce((sum, o) => sum + o.fine, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-amber-100 text-amber-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle2;
      case 'unpaid': return Clock;
      case 'overdue': return Ban;
      default: return FileWarning;
    }
  };

  const closeLookup = () => {
    setLookupType(null);
    setSearchQuery('');
    setSearchResult(null);
    setNoResults(false);
  };

  return (
    <div className="min-h-full bg-handheld-surface">
      {/* Header Section */}
      <div className="pt-6 pb-8 px-4 bg-handheld-header">
        {/* Welcome & Status */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-white-60">Welcome back,</p>
            <h1 className="text-2xl font-bold text-white">{firstName}</h1>
            <p className="text-sm mt-0.5 text-white-50">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className={cn(
            'px-3 py-1.5 flex items-center gap-2',
            isOnline ? 'bg-green-500/20' : 'bg-red-500/20'
          )}>
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-400" />
                <span className="text-xs font-medium text-green-400">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-400" />
                <span className="text-xs font-medium text-red-400">Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Today's Stats */}
        <div className="p-4 bg-white-10">
          <p className="text-xs mb-3 uppercase tracking-wide text-white-60">Today's Activity</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-4xl font-bold text-white">{todayStats.tickets}</p>
              <p className="text-sm text-white-50">Tickets Issued</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-accent">{formatCurrency(todayStats.amount)}</p>
              <p className="text-sm text-white-50">Total Fines</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Alert */}
      {pendingCount > 0 && (
        <div className="mx-4 -mt-4 mb-4 bg-amber-50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">{pendingCount} tickets pending</p>
            <p className="text-sm text-amber-700">
              {isOnline ? 'Syncing now...' : 'Will sync when online'}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn('px-4 py-4 space-y-4', pendingCount === 0 && '-mt-4')}>
        
        {/* Lookup Section */}
        <div className="bg-white p-4">
          <h3 className="font-bold text-gray-900 mb-3">Quick Lookup</h3>
          <p className="text-sm text-gray-500 mb-4">Check for previous offenses or outstanding fines</p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLookupType('vehicle')}
              className={cn(
                'p-4 flex flex-col items-center gap-2 transition-colors',
                lookupType === 'vehicle' 
                  ? 'text-white bg-primary-blue' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <Car className={cn('h-6 w-6', lookupType === 'vehicle' ? 'text-accent' : 'text-gray-600')} />
              <span className="font-medium text-sm">Vehicle Lookup</span>
            </button>
            <button
              onClick={() => setLookupType('driver')}
              className={cn(
                'p-4 flex flex-col items-center gap-2 transition-colors',
                lookupType === 'driver' 
                  ? 'text-white bg-primary-blue' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <User className={cn('h-6 w-6', lookupType === 'driver' ? 'text-accent' : 'text-gray-600')} />
              <span className="font-medium text-sm">Driver Lookup</span>
            </button>
          </div>

          {/* Search Input */}
          {lookupType && (
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={lookupType === 'vehicle' ? 'Enter registration (e.g. GR-1234-24)' : 'Enter license no. or Ghana Card'}
                    className="w-full h-12 px-4 pr-10 bg-gray-100 text-base font-mono uppercase placeholder:normal-case placeholder:font-sans"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="h-12 px-5 text-white font-semibold disabled:opacity-50 flex items-center gap-2 bg-primary-blue"
                  aria-label={`Search ${lookupType}`}
                >
                  <Search className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Search</span>
                </button>
              </div>
              <button 
                onClick={closeLookup}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel lookup
              </button>
            </div>
          )}
        </div>

        {/* Search Results */}
        {isSearching && (
          <div className="bg-white p-8 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-primary-blue border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-500">Searching...</p>
          </div>
        )}

        {noResults && !isSearching && (
          <div className="bg-white p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 mx-auto mb-3 flex items-center justify-center">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-900">No records found</p>
            <p className="text-sm text-gray-500 mt-1">
              No {lookupType === 'vehicle' ? 'vehicle' : 'driver'} matching "{searchQuery}" was found
            </p>
          </div>
        )}

        {/* Vehicle Result */}
        {searchResult && lookupType === 'vehicle' && !isSearching && (
          <div className="bg-white overflow-hidden">
            <div className="p-4 bg-handheld-header">
              <p className="text-xs text-white-60">VEHICLE</p>
              <p className="text-2xl font-bold text-white font-mono">{searchResult.registration}</p>
              <p className="text-sm mt-1 text-white-70">
                {searchResult.color} {searchResult.type} • {searchResult.make}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">OWNER</p>
                  <p className="font-medium text-gray-900">{searchResult.owner}</p>
                </div>
                {getTotalOwing(searchResult.offenses) > 0 && (
                  <div className="bg-red-100 px-3 py-1.5">
                    <p className="text-xs text-red-700">OWING</p>
                    <p className="font-bold text-red-800">{formatCurrency(getTotalOwing(searchResult.offenses))}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4">
              <p className="text-xs text-gray-500 mb-3">OFFENSE HISTORY ({searchResult.offenses.length})</p>
              <div className="space-y-2">
                {searchResult.offenses.map((offense: any) => {
                  const StatusIcon = getStatusIcon(offense.status);
                  return (
                    <div key={offense.id} className="flex items-center justify-between p-3 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={cn('h-5 w-5', 
                          offense.status === 'paid' ? 'text-green-600' : 
                          offense.status === 'overdue' ? 'text-red-600' : 'text-amber-600'
                        )} />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{offense.offense}</p>
                          <p className="text-xs text-gray-500">{offense.date} • {offense.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(offense.fine)}</p>
                        <span className={cn('text-xs px-2 py-0.5 font-medium uppercase', getStatusColor(offense.status))}>
                          {offense.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Driver Result */}
        {searchResult && lookupType === 'driver' && !isSearching && (
          <div className="bg-white overflow-hidden">
            <div className="p-4 bg-handheld-header">
              <p className="text-xs text-white-60">DRIVER</p>
              <p className="text-2xl font-bold text-white">{searchResult.name}</p>
              <p className="text-sm mt-1 font-mono text-white-70">{searchResult.license}</p>
            </div>
            
            <div className="p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">PHONE</p>
                  <p className="font-medium text-gray-900">{searchResult.phone}</p>
                </div>
                {getTotalOwing(searchResult.offenses) > 0 && (
                  <div className="bg-red-100 px-3 py-1.5">
                    <p className="text-xs text-red-700">OWING</p>
                    <p className="font-bold text-red-800">{formatCurrency(getTotalOwing(searchResult.offenses))}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4">
              <p className="text-xs text-gray-500 mb-3">OFFENSE HISTORY ({searchResult.offenses.length})</p>
              <div className="space-y-2">
                {searchResult.offenses.map((offense: any) => {
                  const StatusIcon = getStatusIcon(offense.status);
                  return (
                    <div key={offense.id} className="flex items-center justify-between p-3 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={cn('h-5 w-5', 
                          offense.status === 'paid' ? 'text-green-600' : 
                          offense.status === 'overdue' ? 'text-red-600' : 'text-amber-600'
                        )} />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{offense.offense}</p>
                          <p className="text-xs text-gray-500">{offense.date} • {offense.vehicle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(offense.fine)}</p>
                        <span className={cn('text-xs px-2 py-0.5 font-medium uppercase', getStatusColor(offense.status))}>
                          {offense.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recent Tickets - Only show when not in lookup mode */}
        {!lookupType && (
          <div>
            <div className="flex items-center justify-between py-3">
              <h3 className="font-bold text-gray-900">Recent Tickets</h3>
              <button 
                onClick={() => navigate('/handheld/history')}
                className="text-sm font-semibold text-accent"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {RECENT_TICKETS.map((ticket) => (
                <TicketListItem
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => setSelectedTicket(ticket)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div 
          className="fixed inset-0 z-50 flex items-end bg-overlay"
          onClick={() => setSelectedTicket(null)}
        >
          <div 
            className="bg-white w-full max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between bg-handheld-header">
              <div>
                <p className="text-xs text-white-60">TICKET</p>
                <p className="text-xl font-bold text-white font-mono">{selectedTicket.id}</p>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-2"
                aria-label="Close"
              >
                <X className="h-6 w-6 text-accent" />
              </button>
            </div>

            {/* Status */}
            {(() => {
              const status = selectedTicket.status;
              const Icon = getStatusIcon(status);
              return (
                <div className={cn(
                  'px-4 py-3 flex items-center gap-3',
                  status === 'paid' && 'bg-green-100',
                  status === 'unpaid' && 'bg-amber-100',
                  status === 'overdue' && 'bg-red-100'
                )}>
                  <Icon className={cn(
                    'h-5 w-5',
                    status === 'paid' && 'text-green-700',
                    status === 'unpaid' && 'text-amber-700',
                    status === 'overdue' && 'text-red-700'
                  )} />
                  <span className={cn(
                    'font-semibold capitalize',
                    status === 'paid' && 'text-green-700',
                    status === 'unpaid' && 'text-amber-700',
                    status === 'overdue' && 'text-red-700'
                  )}>
                    {selectedTicket.status}
                  </span>
                </div>
              );
            })()}

            {/* Thermal Print Preview */}
            <div className="p-4 flex justify-center bg-gray-100">
              <TicketReceipt
                ticket={{
                  ticketNumber: selectedTicket.id,
                  createdAt: new Date(`${selectedTicket.date} ${selectedTicket.time}`).toISOString(),
                  vehicle: {
                    registrationNumber: selectedTicket.vehicle,
                    type: selectedTicket.vehicleType,
                    color: selectedTicket.vehicleColor,
                  },
                  driver: {
                    firstName: selectedTicket.driver.split(' ')[0],
                    lastName: selectedTicket.driver.split(' ').slice(1).join(' '),
                    idNumber: selectedTicket.driverId,
                  },
                  offences: [{
                    name: selectedTicket.offense,
                    fine: selectedTicket.amount,
                  }],
                  officer: {
                    name: user?.fullName || 'GPS Officer',
                    badgeNumber: user?.officer?.badgeNumber || 'GPS-0000',
                  },
                  location: {
                    address: selectedTicket.location,
                  },
                }}
                qrCodeUrl={qrCodeUrl}
              />
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-100">
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 h-12 bg-white font-semibold text-gray-700"
                >
                  Close
                </button>
                <button 
                  onClick={() => handlePrint(selectedTicket)}
                  className="flex-1 h-12 text-white font-semibold flex items-center justify-center gap-2 bg-primary-blue"
                >
                  <Printer className="h-5 w-5" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;

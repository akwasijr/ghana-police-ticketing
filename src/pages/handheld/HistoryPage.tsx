import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Search, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Printer,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import QRCode from 'qrcode';
import { printTicket } from '@/lib/utils/print';
import { useAuthStore } from '@/store';
import { usePrinter } from '@/hooks/usePrinter';
import { TicketReceipt, TicketListItem } from '@/components/shared';


// Demo ticket data
const DEMO_TICKETS = [
  { 
    id: 'GPS-2026-0012', 
    vehicle: 'GR-1234-24', 
    vehicleType: 'Toyota Corolla',
    vehicleColor: 'Silver',
    driver: 'Kwame Mensah',
    driverId: 'DL-123456',
    offense: 'Speeding', 
    amount: 200, 
    status: 'paid' as const, 
    date: '2026-01-02',
    time: '10:30 AM',
    location: 'Ring Road Central, Accra',
  },
  { 
    id: 'GPS-2026-0011', 
    vehicle: 'AS-5678-23', 
    vehicleType: 'Honda CR-V',
    vehicleColor: 'Black',
    driver: 'Ama Asante',
    driverId: 'DL-789012',
    offense: 'No Seatbelt', 
    amount: 50, 
    status: 'unpaid' as const, 
    date: '2026-01-02',
    time: '09:15 AM',
    location: 'Liberation Road, Accra',
  },
  { 
    id: 'GPS-2026-0010', 
    vehicle: 'GT-9012-24', 
    vehicleType: 'Mercedes E-Class',
    vehicleColor: 'White',
    driver: 'Kofi Owusu',
    driverId: 'DL-345678',
    offense: 'Illegal Parking', 
    amount: 80, 
    status: 'unpaid' as const, 
    date: '2026-01-02',
    time: '08:45 AM',
    location: 'Oxford Street, Osu',
  },
  { 
    id: 'GPS-2026-0009', 
    vehicle: 'GN-3456-25', 
    vehicleType: 'Hyundai Tucson',
    vehicleColor: 'Blue',
    driver: 'Yaw Boateng',
    driverId: 'DL-901234',
    offense: 'Red Light Violation', 
    amount: 150, 
    status: 'paid' as const, 
    date: '2026-01-01',
    time: '04:20 PM',
    location: 'Kwame Nkrumah Circle',
  },
  { 
    id: 'GPS-2026-0008', 
    vehicle: 'GW-7890-24', 
    vehicleType: 'Kia Sportage',
    vehicleColor: 'Red',
    driver: 'Efua Mensah',
    driverId: 'DL-567890',
    offense: 'Phone While Driving', 
    amount: 200, 
    status: 'overdue' as const, 
    date: '2025-12-28',
    time: '11:45 AM',
    location: 'Spintex Road',
  },
  { 
    id: 'GPS-2026-0007', 
    vehicle: 'GR-2345-23', 
    vehicleType: 'Nissan Patrol',
    vehicleColor: 'Grey',
    driver: 'Akua Sarpong',
    driverId: 'DL-234567',
    offense: 'Wrong Lane', 
    amount: 120, 
    status: 'paid' as const, 
    date: '2025-12-27',
    time: '02:30 PM',
    location: 'George Walker Bush Hwy',
  },
];

export function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const printer = usePrinter();
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTicket, setSelectedTicket] = useState<typeof DEMO_TICKETS[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest');
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

  // Filter and sort tickets
  const filteredTickets = DEMO_TICKETS
    .filter(ticket => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!ticket.vehicle.toLowerCase().includes(query) &&
            !ticket.id.toLowerCase().includes(query) &&
            !ticket.driver.toLowerCase().includes(query) &&
            !ticket.offense.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Status filter
      if (filterStatus !== 'all' && ticket.status !== filterStatus) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount') return b.amount - a.amount;
      return 0;
    });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return { bg: '#DCFCE7', color: '#166534', icon: CheckCircle2 };
      case 'unpaid': return { bg: '#FEF3C7', color: '#92400E', icon: Clock };
      case 'overdue': return { bg: '#FEE2E2', color: '#991B1B', icon: AlertTriangle };
      default: return { bg: '#F3F4F6', color: '#374151', icon: Clock };
    }
  };

  // Print ticket receipt
  const handlePrint = async (ticket: typeof DEMO_TICKETS[0]) => {
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

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: '#F3F4F6' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-4" style={{ backgroundColor: '#1A1F3A' }}>
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate('/handheld')}
            className="p-2 -ml-2"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" style={{ color: '#F9A825' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Ticket History</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{filteredTickets.length} tickets</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vehicle, driver, offense..."
            className="w-full h-12 pl-10 pr-10 bg-white text-gray-900 text-base"
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
      </div>

      {/* Filter & Sort Bar */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: '#F3F4F6' }}>
        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-1">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-sm font-medium text-gray-700 bg-transparent focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm font-medium text-gray-700 bg-transparent focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="amount">Amount</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#F3F4F6' }}>
        <div className="p-4 space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 flex items-center justify-center mb-4 bg-white">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-900">No tickets found</p>
            <p className="text-sm text-gray-500 mt-1 text-center">
              No results for "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: '#1A1F3A' }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div>
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <TicketListItem
                  key={ticket.id}
                  ticket={{
                    ...ticket,
                    offense: ticket.offense,
                    amount: ticket.amount
                  }}
                  onClick={() => setSelectedTicket(ticket)}
                />
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div 
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSelectedTicket(null)}
        >
          <div 
            className="bg-white w-full max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between" style={{ backgroundColor: '#1A1F3A' }}>
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>TICKET</p>
                <p className="text-xl font-bold text-white font-mono">{selectedTicket.id}</p>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-2"
                aria-label="Close"
              >
                <X className="h-6 w-6" style={{ color: '#F9A825' }} />
              </button>
            </div>

            {/* Status */}
            {(() => {
              const style = getStatusStyle(selectedTicket.status);
              const Icon = style.icon;
              return (
                <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: style.bg }}>
                  <Icon className="h-5 w-5" style={{ color: style.color }} />
                  <span className="font-semibold capitalize" style={{ color: style.color }}>
                    {selectedTicket.status}
                  </span>
                </div>
              );
            })()}

            {/* Details */}
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
                  className="flex-1 h-12 text-white font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#1A1F3A' }}
                >
                  <Printer className="h-5 w-5" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

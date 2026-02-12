// Super Admin - National Tickets Overview Page
import { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Globe,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { useTicketStore } from '@/store/ticket.store';
import { useStationStore } from '@/store/station.store';
import { KpiCard } from '@/components/shared';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import type { TicketStatus } from '@/types';

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  unpaid: { label: 'Unpaid', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  paid: { label: 'Paid', color: 'text-green-400', bg: 'bg-green-500/20' },
  overdue: { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/20' },
  objection: { label: 'Objection', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  cancelled: { label: 'Cancelled', color: 'text-gray-400', bg: 'bg-gray-500/20' },
};

export function NationalTicketsPage() {
  const { tickets } = useTicketStore();
  const { regions } = useStationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');

  // Compute statistics
  const stats = useMemo(() => {
    const total = tickets.length;
    const byStatus: Record<string, number> = {};
    Object.keys(STATUS_CONFIG).forEach((status) => {
      byStatus[status] = tickets.filter((t) => t.status === status).length;
    });

    const totalFines = tickets.reduce((sum, t) => sum + t.totalFine, 0);
    // Note: TicketListItem doesn't have payment info, so collected is not tracked
    const totalCollected = 0;
    const collectionRate = 0;

    // By region
    const byRegion: Record<string, { count: number; amount: number; collected: number }> = {};
    tickets.forEach((t) => {
      const regionId = t.regionId || 'unknown';
      if (!byRegion[regionId]) {
        byRegion[regionId] = { count: 0, amount: 0, collected: 0 };
      }
      byRegion[regionId].count++;
      byRegion[regionId].amount += t.totalFine;
    });

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTickets = tickets.filter((t) => new Date(t.issuedAt) >= today);
    const todayCount = todayTickets.length;
    const todayAmount = todayTickets.reduce((sum, t) => sum + t.totalFine, 0);

    // This week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekTickets = tickets.filter((t) => new Date(t.issuedAt) >= weekAgo);

    return {
      total,
      byStatus,
      totalFines,
      totalCollected,
      collectionRate,
      byRegion,
      todayCount,
      todayAmount,
      weekCount: weekTickets.length,
    };
  }, [tickets]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        ticket.ticketNumber.toLowerCase().includes(searchLower) ||
        ticket.vehicleReg.toLowerCase().includes(searchLower) ||
        ticket.officerName?.toLowerCase().includes(searchLower) ||
        ticket.stationName?.toLowerCase().includes(searchLower);

      // Status
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

      // Region
      const matchesRegion = regionFilter === 'all' || ticket.regionId === regionFilter;

      // Date range
      let matchesDate = true;
      if (dateRangeFilter !== 'all') {
        const ticketDate = new Date(ticket.issuedAt);
        const now = new Date();
        
        switch (dateRangeFilter) {
          case 'today':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            matchesDate = ticketDate >= today;
            break;
          case 'week':
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            matchesDate = ticketDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            matchesDate = ticketDate >= monthAgo;
            break;
          case 'year':
            const yearAgo = new Date();
            yearAgo.setFullYear(now.getFullYear() - 1);
            matchesDate = ticketDate >= yearAgo;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesRegion && matchesDate;
    });
  }, [tickets, searchQuery, statusFilter, regionFilter, dateRangeFilter]);

  const selectedTicket = selectedTicketId ? tickets.find((t) => t.id === selectedTicketId) : null;

  const handleExport = () => {
    const data = filteredTickets.map((t) => ({
      ticketNumber: t.ticketNumber,
      status: t.status,
      vehicleReg: t.vehicleReg,
      offenceCount: t.offenceCount,
      totalFine: t.totalFine,
      issuedAt: t.issuedAt,
      dueDate: t.dueDate,
      officerName: t.officerName,
      station: t.stationName,
      region: t.regionName || t.regionId,
    }));

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 bg-[#0A0E1A] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-[#F9A825]" />
          <div>
            <h1 className="text-2xl font-bold text-white">National Tickets Overview</h1>
            <p className="text-gray-400">Monitor tickets across all regions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'stats' : 'list')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] text-white border border-gray-700 hover:bg-[#252B48]"
          >
            {viewMode === 'list' ? <BarChart3 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {viewMode === 'list' ? 'Statistics' : 'List View'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#F9A825] text-black hover:bg-[#F9A825]/90"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Tickets"
          value={stats.total}
          icon={FileText}
          subtitle={`${stats.todayCount} today`}
          subtitleColor="gray"
        />
        <KpiCard
          title="Total Fines"
          value={formatCurrency(stats.totalFines)}
          icon={DollarSign}
        />
        <KpiCard
          title="Collected"
          value={formatCurrency(stats.totalCollected)}
          icon={CheckCircle2}
          subtitleColor="green"
        />
        <KpiCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          icon={TrendingUp}
        />
        <KpiCard
          title="Overdue"
          value={stats.byStatus.overdue || 0}
          icon={AlertTriangle}
          subtitleColor="red"
        />
      </div>

      {/* Filters */}
      <div className="bg-[#1A1F3A] border border-gray-800 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white placeholder-gray-500 focus:border-[#F9A825] focus:outline-none"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
            className="px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
          >
            <option value="all">All Regions</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value as typeof dateRangeFilter)}
            className="px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {viewMode === 'stats' ? (
        /* Statistics View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="bg-[#1A1F3A] border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = stats.byStatus[status] || 0;
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-400">{config.label}</div>
                    <div className="flex-1 bg-gray-700 h-4">
                      <div
                        className={`h-full ${config.bg.replace('/20', '')}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-white">{count}</div>
                    <div className="w-12 text-right text-gray-400">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regional Breakdown */}
          <div className="bg-[#1A1F3A] border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Regional Performance</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {Object.entries(stats.byRegion)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([regionId, data]) => {
                  const region = regions.find((r) => r.id === regionId);
                  const collectionRate = data.amount > 0 ? Math.round((data.collected / data.amount) * 100) : 0;
                  return (
                    <div key={regionId} className="p-3 bg-[#0A0E1A] border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{region?.name || regionId}</span>
                        <span className="text-sm text-gray-400">{data.count} tickets</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          {formatCurrency(data.collected)} / {formatCurrency(data.amount)}
                        </span>
                        <span className={collectionRate >= 70 ? 'text-green-400' : collectionRate >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                          {collectionRate}% collected
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-2 bg-[#1A1F3A] border border-gray-800">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-white">Tickets ({filteredTickets.length})</h2>
            </div>
            <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
              {filteredTickets.map((ticket) => {
                const statusConfig = STATUS_CONFIG[ticket.status];
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-4 cursor-pointer hover:bg-[#252B48] transition-colors ${
                      selectedTicketId === ticket.id ? 'bg-[#252B48] border-l-2 border-[#F9A825]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white">{ticket.ticketNumber}</span>
                          <span className={`px-2 py-0.5 text-xs ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {ticket.vehicleReg} • {ticket.stationName || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {ticket.offenceCount} offence{ticket.offenceCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#F9A825]">{formatCurrency(ticket.totalFine)}</p>
                        <p className="text-xs text-gray-400">{formatDate(ticket.issuedAt)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredTickets.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tickets found</p>
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="bg-[#1A1F3A] border border-gray-800">
            {selectedTicket ? (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white">Ticket Details</h2>
                  <span className={`px-2 py-1 text-xs ${STATUS_CONFIG[selectedTicket.status].bg} ${STATUS_CONFIG[selectedTicket.status].color}`}>
                    {STATUS_CONFIG[selectedTicket.status].label}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400">Ticket Number</label>
                    <p className="font-mono text-white">{selectedTicket.ticketNumber}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Vehicle Registration</label>
                    <p className="text-white">{selectedTicket.vehicleReg}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Offences</label>
                    <p className="text-white">{selectedTicket.offenceCount} offence{selectedTicket.offenceCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Total Fine</label>
                    <p className="font-bold text-[#F9A825]">{formatCurrency(selectedTicket.totalFine)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Issuing Officer</label>
                    <p className="text-white">{selectedTicket.officerName}</p>
                    <p className="text-sm text-gray-400">{selectedTicket.stationName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Region</label>
                    <p className="text-white">{selectedTicket.regionName || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400">Issued</label>
                      <p className="text-white">{formatDate(selectedTicket.issuedAt)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Due Date</label>
                      <p className="text-white">{formatDate(selectedTicket.dueDate)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Sync Status</label>
                    <p className={`text-sm ${selectedTicket.syncStatus === 'synced' ? 'text-green-400' : selectedTicket.syncStatus === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {selectedTicket.syncStatus}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

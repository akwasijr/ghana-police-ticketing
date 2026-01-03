import { Ticket, CreditCard, AlertTriangle, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';

export function DashboardHome() {
  // Demo data
  const stats = [
    { title: 'Total Tickets', value: '2,847', change: 12, icon: Ticket, color: 'bg-blue-600' },
    { title: 'Revenue', value: formatCurrency(584500), change: 8, icon: CreditCard, color: 'bg-green-600' },
    { title: 'Pending Objections', value: '23', change: -5, icon: AlertTriangle, color: 'bg-amber-600' },
    { title: 'Active Officers', value: '156', change: 0, icon: Users, color: 'bg-purple-600' },
  ];

  const recentTickets = [
    { id: 'TKT-2026-001', vehicle: 'GT-1234-25', offence: 'Speeding', amount: 200, status: 'unpaid', time: '10:30 AM' },
    { id: 'TKT-2026-002', vehicle: 'GR-5678-24', offence: 'Red Light', amount: 300, status: 'paid', time: '09:45 AM' },
    { id: 'TKT-2026-003', vehicle: 'AS-9012-25', offence: 'No Seatbelt', amount: 150, status: 'objected', time: '09:15 AM' },
    { id: 'TKT-2026-004', vehicle: 'GN-3456-23', offence: 'Overloading', amount: 500, status: 'unpaid', time: '08:30 AM' },
  ];

  const statusStyles: Record<string, string> = {
    unpaid: 'bg-amber-100 text-amber-800',
    paid: 'bg-green-100 text-green-800',
    objected: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of traffic ticketing activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={cn('p-2', stat.color)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                {stat.change !== 0 && (
                  <div className={cn('flex items-center gap-1 text-sm', stat.change > 0 ? 'text-green-600' : 'text-red-600')}>
                    {stat.change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span>{Math.abs(stat.change)}%</span>
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.title}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="bg-white">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent Tickets</h3>
              <a href="/dashboard/tickets" className="text-sm text-[#1A1F3A] hover:underline font-medium">View all</a>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-mono font-medium text-gray-900">{ticket.vehicle}</p>
                  <p className="text-sm text-gray-500">{ticket.offence} • {ticket.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(ticket.amount)}</p>
                  <span className={cn('inline-block px-2 py-0.5 text-xs font-medium uppercase', statusStyles[ticket.status])}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="bg-white">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Monthly Performance</h3>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Collection Rate</span>
                <span className="text-sm font-semibold text-gray-900">78%</span>
              </div>
              <div className="h-2 bg-gray-100 overflow-hidden">
                <div className="h-full bg-green-600 transition-all" style={{ width: '78%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Objection Rate</span>
                <span className="text-sm font-semibold text-gray-900">5%</span>
              </div>
              <div className="h-2 bg-gray-100 overflow-hidden">
                <div className="h-full bg-amber-500 transition-all" style={{ width: '5%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Officer Activity</span>
                <span className="text-sm font-semibold text-gray-900">92%</span>
              </div>
              <div className="h-2 bg-gray-100 overflow-hidden">
                <div className="h-full bg-[#1A1F3A] transition-all" style={{ width: '92%' }} />
              </div>
            </div>
            
            {/* Top Officers */}
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Top Officers This Month</h4>
              <div className="space-y-3">
                {[
                  { name: 'Sgt. Kwame Asante', tickets: 145, station: 'Accra Central' },
                  { name: 'Cpl. Ama Darko', tickets: 132, station: 'Tema Port' },
                  { name: 'Sgt. Kofi Mensah', tickets: 128, station: 'Kaneshie' },
                ].map((officer, i) => (
                  <div key={officer.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1A1F3A] flex items-center justify-center text-white font-medium text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{officer.name}</p>
                      <p className="text-xs text-gray-500">{officer.station}</p>
                    </div>
                    <span className="text-sm font-bold text-[#1A1F3A]">{officer.tickets}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

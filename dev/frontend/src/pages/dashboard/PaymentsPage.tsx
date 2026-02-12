import { useState, useMemo } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Eye, ExternalLink, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTicketStore } from '@/store/ticket.store';
import { usePaymentStore } from '@/store/payment.store';
import { useJurisdiction } from '@/store/auth.store';
import { useToast } from '@/store/ui.store';
import { matchesJurisdiction } from '@/lib/demo/jurisdiction';
import { KpiCard, DataTable, ConfirmDialog, ActionButton, FilterBar, PageHeader, type Column } from '@/components/shared';
import { Tabs } from '@/components/ui';
import { MOCK_PAYMENTS } from '@/lib/mock-data';
import type { Payment } from '@/types/payment.types';

export function PaymentsPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const { payments: storePayments, getPaymentStats } = usePaymentStore();
  const jurisdiction = useJurisdiction();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'Mobile Money' | 'Card'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Merge store payments with demo data for display
  const allPayments = useMemo<Payment[]>(() => {
    // Convert store payments to display format matching Payment type
    const storeDisplayPayments: Payment[] = storePayments.map(p => ({
      ...p,
      ticketNumber: p.ticketNumber || '',
      methodName: p.methodName || p.method,
      paymentReference: p.paymentReference || p.id,
      payerName: p.payerName || '',
      payerPhone: p.payerPhone || '',
    }));
    
    // Use store payments if available, otherwise fall back to demo
    return storeDisplayPayments.length > 0 ? storeDisplayPayments : MOCK_PAYMENTS;
  }, [storePayments]);

  const handleSendReminder = () => {
    if (!selectedPayment) return;
    
    // In production, this would be an API call
    // await paymentsApi.sendReminder(selectedPayment.id);
    
    // Log reminder to audit trail
    console.log('Payment reminder sent:', {
      paymentId: selectedPayment.id,
      ticketId: selectedPayment.ticketId,
      ticketNumber: selectedPayment.ticketNumber,
      timestamp: new Date().toISOString(),
      recipient: selectedPayment.payerName,
      phone: selectedPayment.payerPhone,
      method: 'SMS/Email'
    });
    
    setShowConfirmDialog(false);
    toast.success('Reminder Sent', 'Payment reminder sent successfully');
  };

  const ticketByNumber = new Map(tickets.map((t) => [t.ticketNumber, t]));

  const filteredPayments = allPayments.filter(payment => {
    const linkedTicket = ticketByNumber.get(payment.ticketNumber);
    if (linkedTicket && !matchesJurisdiction(jurisdiction, linkedTicket)) return false;

    const matchesSearch =
      payment.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.payerName && payment.payerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || 
      (methodFilter === 'Mobile Money' && payment.method === 'momo') ||
      (methodFilter === 'Card' && payment.method === 'card');

    const paymentDate = new Date(payment.createdAt);
    const start = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const end = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    const matchesDate = (!start || paymentDate >= start) && (!end || paymentDate <= end);

    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });

  const selectedPayment = allPayments.find(p => p.id === selectedPaymentId);

  const paymentColumns = useMemo<Column<Payment>[]>(() => [
    {
      header: 'Reference',
      accessor: 'paymentReference',
      render: (value) => <span className="font-mono text-gray-600">{String(value)}</span>
    },
    {
      header: 'Ticket ID',
      accessor: 'ticketNumber',
      render: (value) => <span className="font-medium text-[#1A1F3A]">{String(value)}</span>
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (value) => <span className="font-bold">GH₵ {(value as number).toFixed(2)}</span>
    },
    {
      header: 'Method',
      accessor: 'methodName',
      render: (value, row) => (
        <>
          <span className="text-gray-900">{String(value)}</span>
          <span className="text-[10px] text-gray-500 ml-1">({row.method})</span>
        </>
      )
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      render: (value) => (
        <span className="text-gray-500">
          {new Date(value as string).toLocaleDateString()}
          <span className="text-[10px] ml-1">{new Date(value as string).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={cn(
          "inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase",
          value === 'completed' ? "bg-green-100 text-green-700" : 
          value === 'failed' ? "bg-red-100 text-red-700" : 
          "bg-yellow-100 text-yellow-700"
        )}>
          {String(value)}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right' as const,
      render: () => (
        <button className="text-xs text-[#1A1F3A] hover:underline font-medium inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
      )
    }
  ], []);

  // Detail View
  if (selectedPaymentId && selectedPayment) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Payment Details"
          subtitle={selectedPayment.paymentReference}
          backLabel="Back to Payments"
          onBack={() => setSelectedPaymentId(null)}
          actions={
            selectedPayment.status === 'failed' ? (
              <ActionButton
                icon={Bell}
                label="Send Reminder"
                onClick={() => setShowConfirmDialog(true)}
                title="Send payment reminder"
              />
            ) : undefined
          }
          showExport
          exportLabel="Download PDF"
          onExport={() => toast.info('Download', 'Downloading receipt...')}
        />

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleSendReminder}
          title="Send Payment Reminder"
          message={`Are you sure you want to send a payment reminder for ticket ${selectedPayment.ticketNumber} to ${selectedPayment.payerName}?`}
          confirmText="Send Reminder"
        />

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Transaction Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Reference:</span>
              <p className="font-mono font-medium text-gray-900 mt-1">{selectedPayment.paymentReference}</p>
            </div>
            <div>
              <span className="text-gray-500">Ticket ID:</span>
              <button 
                onClick={() => {
                  // Navigate to tickets page with this ticket selected
                  const ticketFromList = tickets.find(t => t.ticketNumber === selectedPayment.ticketNumber);
                  if (ticketFromList) {
                    // This would need actual navigation - for now show as clickable
                    window.location.href = `/dashboard/tickets?ticketId=${ticketFromList.id}`;
                  }
                }}
                className="font-medium text-[#1A1F3A] mt-1 hover:underline flex items-center gap-1 group"
              >
                {selectedPayment.ticketNumber}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
            <div>
              <span className="text-gray-500">Amount:</span>
              <p className="font-bold text-gray-900 mt-1">GH₵ {selectedPayment.amount.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-gray-500">Method:</span>
              <p className="text-gray-900 mt-1">{selectedPayment.methodName}</p>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <p className="mt-1">
                <span className={cn(
                  'inline-flex items-center px-2 py-1 text-xs font-medium uppercase',
                  selectedPayment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                )}>
                  {selectedPayment.status}
                </span>
              </p>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>
              <p className="text-gray-900 mt-1">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Payer Name:</span>
              <p className="text-gray-900 mt-1">{selectedPayment.payerName}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        subtitle="Transaction history and reconciliation"
        showExport
        onExport={() => toast.info('Export', 'Exporting payments...')}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          title="Total Revenue"
          value={`GH₵ ${(getPaymentStats().totalAmount || allPayments.filter(p => p.status === 'completed').reduce((acc, p) => acc + p.amount, 0)).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`}
          subtitle="+12% from last month"
          icon={CreditCard}
          subtitleColor="green"
        />
        <KpiCard
          title="Successful"
          value={(getPaymentStats().byStatus?.completed || allPayments.filter(p => p.status === 'completed').length).toString()}
          subtitle="98.5% success rate"
          icon={CheckCircle2}
        />
        <KpiCard
          title="Failed"
          value={(getPaymentStats().byStatus?.failed || allPayments.filter(p => p.status === 'failed').length).toString()}
          subtitle="Requires attention"
          icon={AlertCircle}
          subtitleColor="red"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200">
        <Tabs
          tabs={[
            { id: 'all', label: 'All Payments', icon: CreditCard },
            { id: 'completed', label: 'Completed', icon: CheckCircle2 },
            { id: 'failed', label: 'Failed', icon: AlertCircle },
          ]}
          activeTab={statusFilter}
          onTabChange={(tabId) => setStatusFilter(tabId as 'all' | 'completed' | 'failed')}
        />
      </div>

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search payments..."
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        hasActiveFilters={searchTerm !== '' || dateFrom !== '' || dateTo !== ''}
        onResetFilters={() => {
          setSearchTerm('');
          setDateFrom('');
          setDateTo('');
        }}
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'failed')}
          className="h-8 px-2 text-xs bg-white border border-gray-200 text-gray-700 focus:outline-none focus:border-[#1A1F3A]"
          aria-label="Payment status filter"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as 'all' | 'Mobile Money' | 'Card')}
          className="h-8 px-2 text-xs bg-white border border-gray-200 text-gray-700 focus:outline-none focus:border-[#1A1F3A]"
          aria-label="Payment method filter"
        >
          <option value="all">All Methods</option>
          <option value="Mobile Money">Mobile Money</option>
          <option value="Card">Card</option>
        </select>
      </FilterBar>

      {/* Table */}
      <DataTable<Payment>
        columns={paymentColumns}
        data={filteredPayments}
        emptyMessage="No payments found"
        onRowClick={(payment) => setSelectedPaymentId(payment.id)}
      />
    </div>
  );
}

export default PaymentsPage;

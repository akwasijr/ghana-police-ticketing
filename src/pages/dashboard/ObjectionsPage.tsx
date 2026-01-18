import { useState } from 'react';
import { Search, AlertTriangle, CheckCircle2, XCircle, Clock, Eye, FileText, User, Phone, Calendar, ExternalLink, Bell, Download, FileCheck } from 'lucide-react';
import { KpiCard, DataTable, ConfirmDialog, ToastContainer, ActionButton } from '@/components/shared';
import { Tabs } from '@/components/ui';
import type { ToastType } from '@/components/shared';
import { useObjectionStore } from '@/store/objection.store';
import { useAuthStore } from '@/store/auth.store';
import type { ObjectionStatus } from '@/store/objection.store';

type TabFilter = 'all' | ObjectionStatus;

export function ObjectionsPage() {
  const { user } = useAuthStore();
  const { 
    objections, 
    approveObjection, 
    rejectObjection,
    getObjectionStats 
  } = useObjectionStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [selectedObjection, setSelectedObjection] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleSendReminder = () => {
    if (!selectedObj) return;
    
    // In production, this would be an API call
    // await objectionsApi.sendReminder(selectedObj.id);
    
    // Log reminder to audit trail
    console.log('Objection reminder sent:', {
      objectionId: selectedObj.id,
      ticketId: selectedObj.ticketNumber,
      timestamp: new Date().toISOString(),
      recipient: selectedObj.driverPhone,
      method: 'SMS/Email'
    });
    
    setShowConfirmDialog(false);
    addToast('Reminder sent to driver successfully', 'success');
  };

  const stats = getObjectionStats();

  const filteredObjections = objections.filter(obj => {
    const matchesSearch = 
      obj.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj.vehicleReg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj.driverName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === 'all' || obj.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const selectedObj = objections.find(o => o.id === selectedObjection);
  
  const handleApprove = (_id: string) => {
    setShowReviewModal('approve');
  };

  const handleReject = (_id: string) => {
    setShowReviewModal('reject');
  };
  
  const confirmReview = () => {
    if (!selectedObj) return;
    
    const reviewerId = user?.id || 'unknown';
    const reviewerName = user?.fullName || 'Unknown Officer';
    
    if (showReviewModal === 'approve') {
      approveObjection(selectedObj.id, reviewerId, reviewerName, reviewNotes);
      addToast(`Objection ${selectedObj.id} has been approved`, 'success');
    } else if (showReviewModal === 'reject') {
      rejectObjection(selectedObj.id, reviewerId, reviewerName, reviewNotes);
      addToast(`Objection ${selectedObj.id} has been rejected`, 'info');
    }
    
    setShowReviewModal(null);
    setReviewNotes('');
    setSelectedObjection(null);
  };

  if (selectedObjection && selectedObj) {
    // Detail View
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedObjection(null)}
            className="text-xs text-[#1A1F3A] hover:underline font-medium"
          >
            ← Back to Objections
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Objection Details</h1>
              <p className="text-xs text-gray-500 font-mono">{selectedObj.id}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium uppercase ${
              selectedObj.status === 'pending' ? 'bg-amber-100 text-amber-800' :
              selectedObj.status === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {selectedObj.status}
            </span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {selectedObj.status === 'pending' && (
              <ActionButton
                icon={Bell}
                label="Send Reminder"
                onClick={() => setShowConfirmDialog(true)}
                title="Send reminder to driver"
              />
            )}
            <ActionButton
              icon={Download}
              label="Download PDF"
              title="Download objection details"
            />
          </div>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleSendReminder}
          title="Send Reminder to Driver"
          message={`Are you sure you want to send a reminder to ${selectedObj.driverName} (${selectedObj.driverPhone}) regarding their objection for ticket ${selectedObj.ticketNumber}?`}
          confirmText="Send Reminder"

        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <div className="grid grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="col-span-2 space-y-3">
            {/* Ticket Info */}
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Ticket Information</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Ticket ID:</span>
                  <button 
                    onClick={() => {
                      // Navigate to tickets page with this ticket selected
                      window.location.href = `/dashboard/tickets?ticketId=${selectedObj.ticketNumber}`;
                    }}
                    className="font-mono font-medium text-[#1A1F3A] mt-0.5 hover:underline flex items-center gap-1 group"
                  >
                    {selectedObj.ticketNumber}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
                <div>
                  <span className="text-gray-500">Vehicle Reg:</span>
                  <p className="font-mono font-medium text-gray-900 mt-0.5">{selectedObj.vehicleReg}</p>
                </div>
                <div>
                  <span className="text-gray-500">Offence Type:</span>
                  <p className="text-gray-900 mt-0.5">{selectedObj.offenceType}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fine Amount:</span>
                  <p className="font-bold text-gray-900 mt-0.5">GH₵ {selectedObj.fineAmount}</p>
                </div>
              </div>
            </div>

            {/* Objection Reason */}
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Driver's Objection</h3>
              <div className="bg-gray-50 border-l-4 border-[#1A1F3A] p-3">
                <p className="text-xs text-gray-700 leading-relaxed">{selectedObj.reason}</p>
              </div>
              {selectedObj.evidence && (
                <div className="mt-3">
                  <span className="text-[10px] text-gray-500 uppercase">Supporting Evidence:</span>
                  <p className="text-xs text-gray-600 mt-1">{selectedObj.evidence}</p>
                </div>
              )}
            </div>

            {/* Review Section (if reviewed) */}
            {selectedObj.reviewedAt && (
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-xs font-semibold text-gray-900 mb-3">Review Decision</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-0.5 text-[10px] font-medium uppercase ${
                      selectedObj.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedObj.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Reviewed by:</span>
                    <p className="text-gray-900 mt-0.5">{selectedObj.reviewedBy}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Reviewed at:</span>
                    <p className="text-gray-900 mt-0.5">{new Date(selectedObj.reviewedAt).toLocaleString()}</p>
                  </div>
                  {selectedObj.reviewNotes && (
                    <div>
                      <span className="text-gray-500">Review Notes:</span>
                      <p className="text-gray-900 mt-1 bg-gray-50 p-2 border-l-2 border-gray-300">{selectedObj.reviewNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Section (if pending) */}
            {selectedObj.status === 'pending' && (
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-xs font-semibold text-gray-900 mb-3">Review & Decision</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Review Notes</label>
                    <textarea 
                      className="w-full h-20 px-2 py-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
                      placeholder="Enter your review notes and decision rationale..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprove(selectedObj.id)}
                      className="flex-1 h-9 text-xs font-medium bg-green-600 text-white hover:bg-green-700"
                    >
                      <CheckCircle2 className="inline h-3.5 w-3.5 mr-1.5" />
                      Approve Objection
                    </button>
                    <button 
                      onClick={() => handleReject(selectedObj.id)}
                      className="flex-1 h-9 text-xs font-medium bg-red-600 text-white hover:bg-red-700"
                    >
                      <XCircle className="inline h-3.5 w-3.5 mr-1.5" />
                      Reject Objection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Driver Details</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-900">{selectedObj.driverName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-900">{selectedObj.driverPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-500">Submitted: {new Date(selectedObj.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    window.location.href = `/dashboard/tickets?ticketId=${selectedObj.ticketNumber}`;
                  }}
                  className="w-full h-8 text-xs bg-[#1A1F3A] text-white font-medium hover:bg-[#2a325a] flex items-center justify-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  View Original Ticket
                </button>
                <button className="w-full h-8 text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Contact Driver
                </button>
                <button className="w-full h-8 text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5" />
                  View Evidence
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Ticket Objections</h1>
        <p className="text-xs text-gray-500">Review and adjudicate contested tickets</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          title="Pending Review"
          value={stats.pending.toString()}
          subtitle="Requires action"
          icon={AlertTriangle}
          subtitleColor="red"
        />
        <KpiCard
          title="Approved"
          value={stats.approved.toString()}
          subtitle="This month"
          icon={CheckCircle2}
          subtitleColor="green"
        />
        <KpiCard
          title="Rejected"
          value={stats.rejected.toString()}
          subtitle="This month"
          icon={XCircle}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200">
        <Tabs
          tabs={[
            { id: 'all', label: 'All Objections', icon: FileText },
            { id: 'pending', label: 'Pending', icon: Clock },
            { id: 'approved', label: 'Approved', icon: CheckCircle2 },
            { id: 'rejected', label: 'Rejected', icon: XCircle },
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as TabFilter)}
        />
      </div>

      {/* Search */}
      <div className="bg-white p-3 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by ticket ID, vehicle reg, or driver name..." 
            className="w-full h-8 pl-8 pr-3 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Objections List */}
      <DataTable
        columns={[
          {
            header: 'Status',
            accessor: 'status',
            render: (value) => (
              <span className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase ${
                value === 'pending' ? 'bg-amber-100 text-amber-800' :
                value === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {String(value)}
              </span>
            )
          },
          {
            header: 'Ticket ID',
            accessor: 'ticketNumber',
            render: (value) => <span className="font-mono font-medium text-[#1A1F3A]">{String(value)}</span>
          },
          {
            header: 'Vehicle',
            accessor: 'vehicleReg',
            render: (value) => <span className="font-mono text-gray-900">{String(value)}</span>
          },
          {
            header: 'Driver',
            accessor: 'driverName',
            render: (value) => <span className="text-gray-900">{String(value)}</span>
          },
          {
            header: 'Offence',
            accessor: 'offenceType',
            render: (value) => <span className="text-gray-600">{String(value)}</span>
          },
          {
            header: 'Submitted',
            accessor: 'submittedAt',
            render: (value) => (
              <span className="text-gray-500">{value ? new Date(String(value)).toLocaleDateString() : '-'}</span>
            )
          },
          {
            header: 'Actions',
            accessor: 'id',
            align: 'left' as const,
            render: (value) => (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedObjection(value as string);
                }}
                className="flex items-center gap-1 h-7 px-2.5 text-xs bg-[#1A1F3A] text-white hover:bg-[#2a325a]"
              >
                <Eye className="h-3.5 w-3.5" />
                Review
              </button>
            )
          }
        ]}
        data={filteredObjections}
        emptyMessage="No objections found"
        emptyIcon={<FileText className="h-8 w-8 text-gray-300" />}
      />

      {/* Review Confirmation Modal */}
      {showReviewModal && selectedObj && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => {
            setShowReviewModal(null);
            setReviewNotes('');
          }}
          onConfirm={confirmReview}
          title={showReviewModal === 'approve' ? 'Approve Objection' : 'Reject Objection'}
          message={`Are you sure you want to ${showReviewModal} objection for ticket ${selectedObj.ticketNumber}?${reviewNotes ? ` Review notes: "${reviewNotes}"` : ''}`}
          confirmText={showReviewModal === 'approve' ? 'Approve' : 'Reject'}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default ObjectionsPage;

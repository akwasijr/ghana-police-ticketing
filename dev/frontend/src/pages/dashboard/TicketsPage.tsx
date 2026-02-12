import { useState, useMemo } from 'react';
import { Eye, FileText, CreditCard, Clock, AlertTriangle, XCircle, MapPin, User, Car, Camera, FileCheck, Bell, Edit, Plus, Image as ImageIcon, Mail } from 'lucide-react';
import { useTicketStore } from '@/store/ticket.store';
import { useJurisdiction } from '@/store/auth.store';
import { useToast } from '@/store/ui.store';
import { formatCurrency } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';
import { matchesJurisdiction } from '@/lib/demo/jurisdiction';
import { Tabs } from '@/components/ui';
import { DataTable, ConfirmDialog, ActionButton, Modal, FilterBar, PageHeader, type Column } from '@/components/shared';
import { MOCK_FULL_TICKETS } from '@/lib/mock-data';
import type { TicketListItem } from '@/types';

export function TicketsPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const jurisdiction = useJurisdiction();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [objectionFilter, setObjectionFilter] = useState<'all' | 'with' | 'without'>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteImages, setNewNoteImages] = useState<string[]>([]);
  const updateTicketInList = useTicketStore((state) => state.updateTicketInList);

  const handleSendReminder = () => {
    if (!selectedTicket) return;
    
    // In production, this would be an API call
    // await ticketsApi.sendReminder(selectedTicket.id);
    
    // Log reminder to audit trail
    console.log('Reminder sent:', {
      ticketId: selectedTicket.ticketNumber,
      timestamp: new Date().toISOString(),
      recipient: selectedTicket.driver?.phone,
      method: 'SMS'
    });
    
    setShowConfirmDialog(false);
    toast.success('Reminder Sent', 'Payment reminder sent successfully');
  };

  const handleStatusChange = () => {
    if (!selectedTicket || !selectedStatus) return;
    
    // Update ticket in store
    updateTicketInList(selectedTicket.id, { status: selectedStatus as any });
    
    // Log status change to audit trail
    console.log('Status changed:', {
      ticketId: selectedTicket.ticketNumber,
      oldStatus: selectedTicket.status,
      newStatus: selectedStatus,
      timestamp: new Date().toISOString(),
      changedBy: 'Current User' // Would be from auth context in production
    });
    
    setShowStatusDialog(false);
    setSelectedStatus('');
    toast.success('Status Updated', `Ticket status changed to ${selectedStatus}`);
  };

  const handleAddNote = () => {
    if (!selectedTicket || !newNoteContent.trim()) return;
    
    const newNote = {
      id: `note-${Date.now()}`,
      content: newNoteContent,
      officerId: 'OFF-CURRENT', // Would come from auth context
      officerName: 'Current Officer', // Would come from auth context
      officerEmail: 'officer@gps.gov.gh', // Would come from auth context
      timestamp: new Date().toISOString(),
      images: newNoteImages.length > 0 ? newNoteImages.map((uri, idx) => ({
        id: `note-img-${Date.now()}-${idx}`,
        uri,
        type: 'evidence' as const,
        timestamp: new Date().toISOString(),
        uploaded: false
      })) : undefined
    };
    
    // In production, this would be an API call
    // await ticketsApi.addNote(selectedTicket.id, newNote);
    
    // Log to audit trail
    console.log('Note added:', {
      ticketId: selectedTicket.ticketNumber,
      noteId: newNote.id,
      officerId: newNote.officerId,
      timestamp: newNote.timestamp,
      hasImages: !!newNote.images?.length
    });
    
    // Update local state (in production, would refetch from API)
    if (!selectedTicket.notesList) {
      selectedTicket.notesList = [];
    }
    selectedTicket.notesList.push(newNote);
    
    setShowAddNoteDialog(false);
    setNewNoteContent('');
    setNewNoteImages([]);
    toast.success('Note Added', 'Note added successfully');
  };

  const filteredTickets = tickets.filter(ticket => {
    if (!matchesJurisdiction(jurisdiction, ticket)) return false;

    const matchesSearch = 
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.vehicleReg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.officerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

    const ticketDate = new Date(ticket.issuedAt);
    const start = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const end = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    const matchesDate = (!start || ticketDate >= start) && (!end || ticketDate <= end);

    const isObjection = ticket.status === 'objection';
    const matchesObjection = objectionFilter === 'all' || (objectionFilter === 'with' ? isObjection : !isObjection);
    
    return matchesSearch && matchesStatus && matchesDate && matchesObjection;
  });

  const statusColors: Record<string, string> = {
    unpaid: 'bg-amber-100 text-amber-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    objection: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const columns = useMemo<Column<TicketListItem>[]>(() => [
    {
      header: 'Ticket No.',
      accessor: 'ticketNumber',
      render: (value) => <span className="font-mono font-medium text-gray-900">{String(value)}</span>
    },
    {
      header: 'Date & Time',
      accessor: 'issuedAt',
      render: (value) => (
        <span className="text-gray-600">
          {new Date(value as string).toLocaleDateString()} {new Date(value as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    {
      header: 'Vehicle',
      accessor: 'vehicleReg',
      render: (value) => <span className="font-mono text-gray-900">{String(value)}</span>
    },
    {
      header: 'Officer',
      accessor: 'officerName',
      render: (value) => <span className="text-gray-600">{String(value)}</span>
    },
    {
      header: 'Amount',
      accessor: 'totalFine',
      render: (value) => <span className="font-medium text-gray-900">{formatCurrency(value as number)}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={cn('inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase', statusColors[value as string])}>
          {String(value)}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right' as const,
      render: () => (
        <button type="button" className="text-gray-400 hover:text-[#1A1F3A]" aria-label="View ticket">
          <Eye className="h-4 w-4" />
        </button>
      )
    }
  ], [statusColors]);

  const selectedTicket = MOCK_FULL_TICKETS.find(t => t.id === selectedTicketId);

  // Detail View
  if (selectedTicketId && selectedTicket) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Ticket Details"
          subtitle={selectedTicket.ticketNumber}
          backLabel="Back to Tickets"
          onBack={() => setSelectedTicketId(null)}
          statusBadge={
            <span className={cn('inline-flex items-center px-3 py-1 text-xs font-medium uppercase', statusColors[selectedTicket.status])}>
              {selectedTicket.status}
            </span>
          }
          actions={
            <>
              {selectedTicket.status === 'unpaid' && (
                <>
                  <ActionButton
                    icon={Edit}
                    label="Change Status"
                    onClick={() => setShowStatusDialog(true)}
                    title="Change ticket status"
                  />
                  <ActionButton
                    icon={Bell}
                    label="Send Reminder"
                    onClick={() => setShowConfirmDialog(true)}
                    title="Send payment reminder"
                  />
                </>
              )}
            </>
          }
          showExport
          exportLabel="Download PDF"
          onExport={() => toast.info('Download', 'Downloading PDF...')}
        />

        {/* Confirmation Dialog for Send Reminder */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleSendReminder}
          title="Send Payment Reminder"
          message={`Are you sure you want to send a payment reminder to ${selectedTicket.driver?.firstName} ${selectedTicket.driver?.lastName} (${selectedTicket.driver?.phone})?`}
          confirmText="Send Reminder"
        />

        {/* Status Change Dialog */}
        <Modal
          isOpen={showStatusDialog}
          onClose={() => setShowStatusDialog(false)}
          onConfirm={handleStatusChange}
          title="Change Ticket Status"
          confirmText="Confirm"
          confirmDisabled={!selectedStatus}
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Select New Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
            >
              <option value="">Select a status...</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="objection">Under Objection</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </Modal>

        {/* Add Note Dialog */}
        <Modal
          isOpen={showAddNoteDialog}
          onClose={() => {
            setShowAddNoteDialog(false);
            setNewNoteContent('');
            setNewNoteImages([]);
          }}
          onConfirm={handleAddNote}
          title="Add Officer Note"
          confirmText="Confirm"
          confirmDisabled={!newNoteContent.trim()}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Note Content *</label>
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Enter note details..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A] resize-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Attach Images (Optional)</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const mockImage = `/demo-evidence-${newNoteImages.length + 1}.jpg`;
                    setNewNoteImages([...newNoteImages, mockImage]);
                    toast.info('Image Attached', 'Image attached (demo mode)');
                  }}
                  className="h-9 px-3 flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium transition-colors"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Add Image
                </button>
                {newNoteImages.length > 0 && (
                  <span className="flex items-center text-xs text-gray-600">
                    {newNoteImages.length} image{newNoteImages.length > 1 ? 's' : ''} attached
                  </span>
                )}
              </div>
              {newNoteImages.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {newNoteImages.map((_, idx) => (
                    <div key={idx} className="relative w-20 h-20 bg-gray-200 border border-gray-300 flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                      <button
                        onClick={() => setNewNoteImages(newNoteImages.filter((__, i) => i !== idx))}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 border border-gray-200">
              <p className="text-[10px] text-gray-600">
                <strong>Note:</strong> This note will be linked to your officer account and include your email for audit trail purposes. All notes are timestamped and immutable.
              </p>
            </div>
          </div>
        </Modal>

        <div className="grid grid-cols-3 gap-4">
          {/* Left Column - Vehicle & Driver */}
          <div className="col-span-2 space-y-4">
            {/* Vehicle Information */}
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Car className="h-4 w-4 text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-900">Vehicle Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Registration Number:</span>
                  <p className="font-mono font-bold text-gray-900 mt-1 text-sm">{selectedTicket.vehicle.registrationNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Make & Model:</span>
                  <p className="text-gray-900 mt-1">{selectedTicket.vehicle.make} {selectedTicket.vehicle.model}</p>
                </div>
                <div>
                  <span className="text-gray-500">Color:</span>
                  <p className="text-gray-900 mt-1">{selectedTicket.vehicle.color}</p>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <p className="text-gray-900 mt-1 capitalize">{selectedTicket.vehicle.type}</p>
                </div>
                <div>
                  <span className="text-gray-500">Owner Name:</span>
                  <p className="text-gray-900 mt-1">{selectedTicket.vehicle.ownerName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Owner Phone:</span>
                  <p className="text-gray-900 mt-1">{selectedTicket.vehicle.ownerPhone}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Owner Address:</span>
                  <p className="text-gray-900 mt-1">{selectedTicket.vehicle.ownerAddress}</p>
                </div>
              </div>
            </div>

            {/* Driver Information */}
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-900">Driver Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Full Name:</span>
                  <p className="font-medium text-gray-900 mt-1">{selectedTicket.driver?.firstName} {selectedTicket.driver?.lastName}</p>
                </div>
                <div>
                  <span className="text-gray-500">License Number:</span>
                  <p className="font-mono text-gray-900 mt-1">{selectedTicket.driver?.licenseNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">ID Type:</span>
                  <p className="text-gray-900 mt-1 capitalize">{selectedTicket.driver?.idType?.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-gray-500">ID Number:</span>
                  <p className="font-mono text-gray-900 mt-1">{selectedTicket.driver?.idNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <p className="text-gray-900 mt-1">{selectedTicket.driver?.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Address:</span>
                  <p className="text-gray-900 mt-1">{selectedTicket.driver?.address}</p>
                </div>
              </div>
            </div>

            {/* Violation Details */}
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-900">Violation Details</h3>
              </div>
              <div className="space-y-3">
                {selectedTicket.offences.map((offence) => (
                  <div key={offence.id} className="bg-gray-50 p-3 border-l-4 border-[#1A1F3A]">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{offence.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase mt-0.5">Category: {offence.category}</p>
                      </div>
                      <p className="text-sm font-bold text-[#1A1F3A]">{formatCurrency(offence.fine)}</p>
                    </div>
                    {offence.notes && (
                      <p className="text-xs text-gray-600 mt-2 italic">"{offence.notes}"</p>
                    )}
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-xs font-semibold text-gray-900">Total Fine:</span>
                  <span className="text-lg font-bold text-[#1A1F3A]">{formatCurrency(selectedTicket.totalFine)}</span>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-900">Location</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Address:</span>
                    <p className="text-gray-900 mt-1">{selectedTicket.location.address}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Landmark:</span>
                    <p className="text-gray-900 mt-1">{selectedTicket.location.landmark}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Coordinates:</span>
                    <p className="font-mono text-gray-900 mt-1 text-[11px]">{selectedTicket.location.latitude?.toFixed(6)}, {selectedTicket.location.longitude?.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Accuracy:</span>
                    <p className="text-gray-900 mt-1">{selectedTicket.location.accuracy}m</p>
                  </div>
                </div>
                {/* Map placeholder */}
                <div className="bg-gray-100 border border-gray-200 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Map View</p>
                    <p className="text-[10px] text-gray-400 mt-1">Location: {selectedTicket.location.landmark}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Photos */}
            {selectedTicket.photos.length > 0 && (
              <div className="bg-white border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-900">Evidence Photos ({selectedTicket.photos.length})</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {selectedTicket.photos.map((photo) => (
                    <div key={photo.id} className="border border-gray-200 overflow-hidden">
                      <div className="bg-gray-100 aspect-video flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="p-2 bg-white">
                        <p className="text-[10px] text-gray-500 uppercase font-medium">{photo.type}</p>
                        <p className="text-[9px] text-gray-400">{new Date(photo.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Officer Notes */}
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-900">Officer Notes</h3>
                  <span className="text-[10px] text-gray-500">({selectedTicket.notesList?.length || 0})</span>
                </div>
                <button
                  onClick={() => setShowAddNoteDialog(true)}
                  className="h-7 px-2.5 flex items-center gap-1 bg-[#1A1F3A] text-white hover:bg-[#2a325a] text-[11px] font-medium transition-colors"
                  title="Add new note"
                >
                  <Plus className="h-3 w-3" />
                  Add Note
                </button>
              </div>
              
              <div className="space-y-3">
                {selectedTicket.notesList && selectedTicket.notesList.length > 0 ? (
                  selectedTicket.notesList.map((note) => (
                    <div key={note.id} className="bg-amber-50 border-l-4 border-[#F9A825] p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-gray-600" />
                          <div>
                            <p className="text-[11px] font-semibold text-gray-900">{note.officerName}</p>
                            {note.officerEmail && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Mail className="h-2.5 w-2.5 text-gray-500" />
                                <p className="text-[9px] text-gray-600">{note.officerEmail}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] text-gray-500">{new Date(note.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed mb-2">{note.content}</p>
                      {note.images && note.images.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {note.images.map((img) => (
                            <div key={img.id} className="w-16 h-16 bg-gray-200 border border-gray-300 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      )}
                      {note.edited && (
                        <p className="text-[9px] text-gray-500 italic mt-2">Edited {note.editedAt && `on ${new Date(note.editedAt).toLocaleString()}`}</p>
                      )}
                    </div>
                  ))
                ) : selectedTicket.notes ? (
                  <div className="bg-amber-50 border-l-4 border-[#F9A825] p-3">
                    <p className="text-xs text-gray-700 leading-relaxed">{selectedTicket.notes}</p>
                    <p className="text-[9px] text-gray-500 mt-2">Legacy note - no audit trail</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No notes added yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-4">
            {/* Ticket Summary */}
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Ticket Summary</h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-gray-500">Ticket Number:</span>
                  <p className="font-mono font-medium text-gray-900 mt-1">{selectedTicket.ticketNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Issued:</span>
                  <p className="text-gray-900 mt-1">{new Date(selectedTicket.issuedAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Due Date:</span>
                  <p className="text-gray-900 mt-1">{new Date(selectedTicket.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total Amount:</span>
                  <p className="font-bold text-lg text-[#1A1F3A] mt-1">{formatCurrency(selectedTicket.totalFine)}</p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Status:</span>
                  <p className="mt-1">
                    <span className={cn('inline-flex items-center px-2 py-1 text-[10px] font-medium uppercase', statusColors[selectedTicket.status])}>
                      {selectedTicket.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {selectedTicket.status === 'paid' && selectedTicket.paidAt && (
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-xs font-semibold text-gray-900 mb-3">Payment Details</h3>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-gray-500">Reference:</span>
                    <p className="font-mono text-gray-900 mt-1">{selectedTicket.paymentReference}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount Paid:</span>
                    <p className="font-bold text-gray-900 mt-1">{formatCurrency(selectedTicket.paidAmount || 0)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Method:</span>
                    <p className="text-gray-900 mt-1">{selectedTicket.paymentMethod}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Paid On:</span>
                    <p className="text-gray-900 mt-1">{new Date(selectedTicket.paidAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Officer Information */}
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Issued By</h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-gray-500">Officer:</span>
                  <p className="font-medium text-gray-900 mt-1">{selectedTicket.officerName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Badge Number:</span>
                  <p className="font-mono text-gray-900 mt-1">{selectedTicket.officerBadgeNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Station:</span>
                  <p className="text-gray-900 mt-1">{selectedTicket.stationName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tickets"
        subtitle="Manage and monitor traffic violations"
        showExport
        onExport={() => toast.info('Export', 'Exporting tickets...')}
      />

      {/* Tabs */}
      <div className="bg-white border border-gray-200">
        <Tabs
          tabs={[
            { id: 'all', label: 'All Tickets', icon: FileText },
            { id: 'unpaid', label: 'Unpaid', icon: Clock },
            { id: 'paid', label: 'Paid', icon: CreditCard },
            { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
            { id: 'objection', label: 'Objections', icon: XCircle },
          ]}
          activeTab={statusFilter}
          onTabChange={(tabId) => setStatusFilter(tabId)}
        />
      </div>

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search tickets..."
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
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
          aria-label="Ticket status filter"
        >
          <option value="all">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="objection">Objection</option>
        </select>
        <select
          value={objectionFilter}
          onChange={(e) => setObjectionFilter(e.target.value as 'all' | 'with' | 'without')}
          className="h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
          aria-label="Objection filter"
        >
          <option value="all">All Tickets</option>
          <option value="with">With Objection</option>
          <option value="without">Without Objection</option>
        </select>
      </FilterBar>

      {/* Table */}
      <DataTable<TicketListItem>
        columns={columns}
        data={filteredTickets}
        emptyMessage="No tickets found matching your filters."
        onRowClick={(ticket) => setSelectedTicketId(ticket.id)}
      />
    </div>
  );
}

export default TicketsPage;

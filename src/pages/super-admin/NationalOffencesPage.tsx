// Super Admin - National Offences Management Page
import { useState, useMemo } from 'react';
import {
  Scale,
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Eye,
  Tag,
  DollarSign,
  Save,
  X,
  Globe,
  Download,
} from 'lucide-react';
import { useOffenceStore } from '@/store/offence.store';
import { useToast } from '@/store/ui.store';
import { OFFENCE_CATEGORIES, type Offence, type OffenceCategory, type OffenceFormData } from '@/types/offence.types';
import { KpiCard, ConfirmDialog } from '@/components/shared';
import { formatCurrency } from '@/lib/utils/formatting';

export function NationalOffencesPage() {
  const { offences, addOffence, updateOffence, deleteOffence, toggleOffenceStatus, updateFine, resetToDefaults } =
    useOffenceStore();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<OffenceCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingOffence, setEditingOffence] = useState<Offence | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedOffenceId, setSelectedOffenceId] = useState<string | null>(null);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkFineAdjustment, setBulkFineAdjustment] = useState<number>(0);

  const [formData, setFormData] = useState<OffenceFormData>({
    code: '',
    name: '',
    description: '',
    legalBasis: '',
    category: 'other',
    defaultFine: 100,
    minFine: 50,
    maxFine: 500,
    points: undefined,
  });

  // Computed statistics
  const stats = useMemo(() => {
    const total = offences.length;
    const active = offences.filter((o) => o.isActive).length;
    const inactive = total - active;
    const avgFine = total > 0 ? offences.reduce((sum, o) => sum + o.defaultFine, 0) / total : 0;
    const totalMaxFines = offences.reduce((sum, o) => sum + o.maxFine, 0);

    const byCategory: Record<string, number> = {};
    OFFENCE_CATEGORIES.forEach((cat) => {
      byCategory[cat.value] = offences.filter((o) => o.category === cat.value).length;
    });

    return { total, active, inactive, avgFine, totalMaxFines, byCategory };
  }, [offences]);

  const filteredOffences = useMemo(() => {
    return offences.filter((o) => {
      const matchesSearch =
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.legalBasis.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || o.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? o.isActive : !o.isActive);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [offences, searchQuery, categoryFilter, statusFilter]);

  const handleOpenModal = (offence?: Offence) => {
    if (offence) {
      setEditingOffence(offence);
      setFormData({
        code: offence.code,
        name: offence.name,
        description: offence.description,
        legalBasis: offence.legalBasis,
        category: offence.category,
        defaultFine: offence.defaultFine,
        minFine: offence.minFine,
        maxFine: offence.maxFine,
        points: offence.points,
      });
    } else {
      setEditingOffence(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        legalBasis: '',
        category: 'other',
        defaultFine: 100,
        minFine: 50,
        maxFine: 500,
        points: undefined,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.name) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingOffence) {
      updateOffence(editingOffence.id, formData);
      toast.success('Offence updated successfully');
    } else {
      addOffence(formData);
      toast.success('Offence created successfully');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteOffence(id);
    toast.success('Offence deleted successfully');
    setShowDeleteConfirm(null);
    setSelectedOffenceId(null);
  };

  const handleExport = () => {
    const data = JSON.stringify(offences, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offences-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Offences exported successfully');
  };

  const handleBulkFineAdjust = () => {
    if (bulkFineAdjustment === 0) return;

    filteredOffences.forEach((offence) => {
      const newFine = Math.max(offence.minFine, Math.min(offence.maxFine, offence.defaultFine + bulkFineAdjustment));
      updateFine(offence.id, newFine);
    });

    toast.success(`Updated fines for ${filteredOffences.length} offences`);
    setShowBulkEditModal(false);
    setBulkFineAdjustment(0);
  };

  const selectedOffence = selectedOffenceId ? offences.find((o) => o.id === selectedOffenceId) : null;

  return (
    <div className="p-6 space-y-6 bg-[#0A0E1A] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-[#F9A825]" />
          <div>
            <h1 className="text-2xl font-bold text-white">National Offence Catalog</h1>
            <p className="text-gray-400">Manage traffic offences across all regions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] text-white border border-gray-700 hover:bg-[#252B48]"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowBulkEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] text-white border border-gray-700 hover:bg-[#252B48]"
          >
            <Edit2 className="w-4 h-4" />
            Bulk Edit Fines
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#F9A825] text-black hover:bg-[#F9A825]/90"
          >
            <Plus className="w-4 h-4" />
            Add Offence
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Offences"
          value={stats.total}
          icon={Scale}
        />
        <KpiCard
          title="Active"
          value={stats.active}
          icon={CheckCircle2}
        />
        <KpiCard
          title="Inactive"
          value={stats.inactive}
          icon={AlertTriangle}
        />
        <KpiCard
          title="Avg Fine"
          value={formatCurrency(stats.avgFine)}
          icon={DollarSign}
        />
        <KpiCard
          title="Categories"
          value={OFFENCE_CATEGORIES.length}
          icon={Tag}
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
                placeholder="Search offences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white placeholder-gray-500 focus:border-[#F9A825] focus:outline-none"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as OffenceCategory | 'all')}
            className="px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
          >
            <option value="all">All Categories</option>
            {OFFENCE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Offences List */}
        <div className="lg:col-span-2 bg-[#1A1F3A] border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">
              Offences ({filteredOffences.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
            {filteredOffences.map((offence) => (
              <div
                key={offence.id}
                onClick={() => setSelectedOffenceId(offence.id)}
                className={`p-4 cursor-pointer hover:bg-[#252B48] transition-colors ${
                  selectedOffenceId === offence.id ? 'bg-[#252B48] border-l-2 border-[#F9A825]' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{offence.code}</span>
                      <span
                        className={`px-2 py-0.5 text-xs ${
                          offence.isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {offence.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="font-medium text-white mt-1">{offence.name}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">{offence.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#F9A825]">{formatCurrency(offence.defaultFine)}</p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(offence.minFine)} - {formatCurrency(offence.maxFine)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {filteredOffences.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No offences found</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-[#1A1F3A] border border-gray-800">
          {selectedOffence ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Offence Details</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(selectedOffence)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleOffenceStatus(selectedOffence.id)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    {selectedOffence.isActive ? (
                      <ToggleRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(selectedOffence.id)}
                    className="p-2 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400">Code</label>
                  <p className="font-mono text-white">{selectedOffence.code}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Name</label>
                  <p className="text-white">{selectedOffence.name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Description</label>
                  <p className="text-gray-300 text-sm">{selectedOffence.description}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Legal Basis</label>
                  <p className="text-gray-300 text-sm">{selectedOffence.legalBasis}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Category</label>
                  <p className="text-white capitalize">{selectedOffence.category.replace('_', ' ')}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Default Fine</label>
                    <p className="font-bold text-[#F9A825]">{formatCurrency(selectedOffence.defaultFine)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Min Fine</label>
                    <p className="text-white">{formatCurrency(selectedOffence.minFine)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Max Fine</label>
                    <p className="text-white">{formatCurrency(selectedOffence.maxFine)}</p>
                  </div>
                </div>
                {selectedOffence.points !== undefined && (
                  <div>
                    <label className="text-xs text-gray-400">Penalty Points</label>
                    <p className="text-white">{selectedOffence.points} points</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select an offence to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A1F3A] border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editingOffence ? 'Edit Offence' : 'Add New Offence'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
                    placeholder="e.g., SPD-001"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as OffenceCategory })}
                    className="w-full px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
                  >
                    {OFFENCE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
                  placeholder="Offence name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none resize-none"
                  placeholder="Describe the offence"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Legal Basis</label>
                <input
                  type="text"
                  value={formData.legalBasis}
                  onChange={(e) => setFormData({ ...formData, legalBasis: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
                  placeholder="e.g., Road Traffic Act 2004"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Default Fine (GHS)</label>
                  <input
                    type="number"
                    value={formData.defaultFine}
                    onChange={(e) => setFormData({ ...formData, defaultFine: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Min Fine (GHS)</label>
                  <input
                    type="number"
                    value={formData.minFine}
                    onChange={(e) => setFormData({ ...formData, minFine: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Fine (GHS)</label>
                  <input
                    type="number"
                    value={formData.maxFine}
                    onChange={(e) => setFormData({ ...formData, maxFine: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Penalty Points</label>
                  <input
                    type="number"
                    value={formData.points ?? ''}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-[#F9A825] text-black hover:bg-[#F9A825]/90"
              >
                <Save className="w-4 h-4" />
                {editingOffence ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A1F3A] border border-gray-800 w-full max-w-md">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Bulk Adjust Fines</h2>
              <button onClick={() => setShowBulkEditModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-400">
                Adjust fines for {filteredOffences.length} offences matching current filters.
              </p>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount to add/subtract (GHS)</label>
                <input
                  type="number"
                  value={bulkFineAdjustment}
                  onChange={(e) => setBulkFineAdjustment(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-[#0A0E1A] border border-gray-700 text-white focus:border-[#F9A825] focus:outline-none"
                  placeholder="e.g., 50 or -25"
                />
                <p className="text-xs text-gray-500 mt-1">Use negative values to reduce fines</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => setShowBulkEditModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkFineAdjust}
                className="flex items-center gap-2 px-4 py-2 bg-[#F9A825] text-black hover:bg-[#F9A825]/90"
              >
                <Save className="w-4 h-4" />
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        title="Delete Offence"
        message="Are you sure you want to delete this offence? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        onClose={() => setShowDeleteConfirm(null)}
      />
    </div>
  );
}

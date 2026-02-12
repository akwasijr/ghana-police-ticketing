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
  FileText,
  Filter,
  RotateCcw,
  Gavel,
  CheckCircle2,
  Hash,
  ArrowLeft,
  Eye,
  Calendar,
  Tag,
  DollarSign,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import { useOffenceStore } from '@/store/offence.store';
import { useToast } from '@/store/ui.store';
import { OFFENCE_CATEGORIES, type Offence, type OffenceCategory, type OffenceFormData } from '@/types/offence.types';
import { KpiCard, ConfirmDialog } from '@/components/shared';
import { formatCurrency } from '@/lib/utils/formatting';

export function OffencesPage() {
  const { offences, addOffence, updateOffence, deleteOffence, toggleOffenceStatus, updateFine, resetToDefaults } =
    useOffenceStore();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<OffenceCategory | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingOffence, setEditingOffence] = useState<Offence | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingFine, setEditingFine] = useState<string | null>(null);
  const [tempFine, setTempFine] = useState<number>(0);
  const [selectedOffenceId, setSelectedOffenceId] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailFormData, setDetailFormData] = useState<OffenceFormData | null>(null);

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

  const filteredOffences = useMemo(() => {
    return offences.filter((o) => {
      const matchesSearch =
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.legalBasis.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || o.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [offences, searchQuery, categoryFilter]);

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

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOffence(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOffence) {
      updateOffence(editingOffence.id, formData);
      toast.success('Offence Updated', `"${formData.name}" has been updated successfully.`);
    } else {
      addOffence(formData);
      toast.success('Offence Added', `"${formData.name}" has been added successfully.`);
    }
    handleCloseModal();
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteOffence(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const handleStartEditFine = (offence: Offence) => {
    setEditingFine(offence.id);
    setTempFine(offence.defaultFine);
  };

  const handleSaveFine = (id: string) => {
    updateFine(id, tempFine);
    setEditingFine(null);
  };

  const getCategoryLabel = (category: OffenceCategory) => {
    return OFFENCE_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  const getCategoryColor = (category: OffenceCategory) => {
    const colors: Record<OffenceCategory, string> = {
      speed: 'bg-red-100 text-red-800',
      traffic_signal: 'bg-amber-100 text-amber-800',
      documentation: 'bg-blue-100 text-blue-800',
      vehicle_condition: 'bg-purple-100 text-purple-800',
      parking: 'bg-green-100 text-green-800',
      dangerous_driving: 'bg-rose-100 text-rose-800',
      licensing: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category];
  };

  const stats = useMemo(() => {
    const active = offences.filter((o) => o.isActive).length;
    const avgFine = offences.reduce((sum, o) => sum + o.defaultFine, 0) / offences.length || 0;
    const categories = new Set(offences.map((o) => o.category)).size;
    return { total: offences.length, active, avgFine, categories };
  }, [offences]);

  const offenceToDelete = offences.find(o => o.id === showDeleteConfirm);
  const selectedOffence = offences.find(o => o.id === selectedOffenceId);

  const handleViewOffence = (offence: Offence) => {
    setSelectedOffenceId(offence.id);
    setIsEditingDetails(false);
    setDetailFormData(null);
  };

  const handleBackToList = () => {
    setSelectedOffenceId(null);
    setIsEditingDetails(false);
    setDetailFormData(null);
  };

  const handleStartEditDetails = () => {
    if (selectedOffence) {
      setDetailFormData({
        code: selectedOffence.code,
        name: selectedOffence.name,
        description: selectedOffence.description,
        legalBasis: selectedOffence.legalBasis,
        category: selectedOffence.category,
        defaultFine: selectedOffence.defaultFine,
        minFine: selectedOffence.minFine,
        maxFine: selectedOffence.maxFine,
        points: selectedOffence.points,
      });
      setIsEditingDetails(true);
    }
  };

  const handleCancelEditDetails = () => {
    setIsEditingDetails(false);
    setDetailFormData(null);
  };

  const handleSaveDetails = () => {
    if (selectedOffence && detailFormData) {
      updateOffence(selectedOffence.id, detailFormData);
      setIsEditingDetails(false);
      setDetailFormData(null);
      toast.success('Offence Updated', `"${detailFormData.name}" has been updated successfully.`);
    }
  };

  // Detail View
  if (selectedOffenceId && selectedOffence) {
    return (
      <div className="space-y-4">
        {/* Back Button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBackToList}
            className="text-xs text-[#1A1F3A] hover:underline font-medium flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Offences
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">{selectedOffence.name}</h1>
              <span className={`px-2 py-0.5 text-[10px] font-medium uppercase ${getCategoryColor(selectedOffence.category)}`}>
                {getCategoryLabel(selectedOffence.category)}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">{selectedOffence.code}</p>
          </div>
          
          <div className="flex items-center gap-2.5">
            {!isEditingDetails ? (
              <>
                <button
                  onClick={handleStartEditDetails}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'white',
                    backgroundColor: '#1A1F3A',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Offence
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(selectedOffence.id)}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#dc2626',
                    backgroundColor: 'white',
                    border: '2px solid #dc2626',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancelEditDetails}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#1A1F3A',
                    backgroundColor: 'white',
                    border: '2px solid #1A1F3A',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveDetails}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'white',
                    backgroundColor: '#16a34a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => {
            handleDelete();
            handleBackToList();
          }}
          title="Delete Offence"
          message={`Are you sure you want to delete "${selectedOffence.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />

        {/* Detail Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#1A1F3A]" />
                Basic Information
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Offence Code</label>
                {isEditingDetails && detailFormData ? (
                  <input
                    type="text"
                    value={detailFormData.code}
                    onChange={(e) => setDetailFormData({ ...detailFormData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                  />
                ) : (
                  <p className="text-sm font-mono font-semibold text-[#1A1F3A]">{selectedOffence.code}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Offence Name</label>
                {isEditingDetails && detailFormData ? (
                  <input
                    type="text"
                    value={detailFormData.name}
                    onChange={(e) => setDetailFormData({ ...detailFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{selectedOffence.name}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                {isEditingDetails && detailFormData ? (
                  <textarea
                    value={detailFormData.description}
                    onChange={(e) => setDetailFormData({ ...detailFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                  />
                ) : (
                  <p className="text-sm text-gray-600">{selectedOffence.description || 'No description provided'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Category</label>
                {isEditingDetails && detailFormData ? (
                  <select
                    value={detailFormData.category}
                    onChange={(e) => setDetailFormData({ ...detailFormData, category: e.target.value as OffenceCategory })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                  >
                    {OFFENCE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase ${getCategoryColor(selectedOffence.category)}`}>
                    {getCategoryLabel(selectedOffence.category)}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <button
                  onClick={() => toggleOffenceStatus(selectedOffence.id)}
                  className="flex items-center gap-1"
                  title={selectedOffence.isActive ? 'Click to deactivate' : 'Click to activate'}
                >
                  {selectedOffence.isActive ? (
                    <>
                      <ToggleRight className="h-5 w-5 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-5 w-5 text-gray-400" />
                      <span className="text-xs text-gray-400 font-medium">Inactive</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Legal Basis */}
          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#1A1F3A]" />
                Legal Basis
              </h3>
            </div>
            <div className="p-4">
              <label className="block text-xs text-gray-500 mb-1">Regulation Reference</label>
              {isEditingDetails && detailFormData ? (
                <textarea
                  value={detailFormData.legalBasis}
                  onChange={(e) => setDetailFormData({ ...detailFormData, legalBasis: e.target.value })}
                  rows={4}
                  placeholder="e.g., Road Traffic Act 2004 (Act 683), Section 15(1)"
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                />
              ) : (
                <div className="bg-gray-50 p-3 border border-gray-200">
                  <p className="text-sm text-gray-700">{selectedOffence.legalBasis}</p>
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-2">
                This is the legal reference that provides authority for issuing fines for this offence.
              </p>
            </div>
          </div>

          {/* Fine Structure */}
          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#1A1F3A]" />
                Fine Structure
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {isEditingDetails && detailFormData ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min Fine (GH₵)</label>
                    <input
                      type="number"
                      value={detailFormData.minFine}
                      onChange={(e) => setDetailFormData({ ...detailFormData, minFine: Number(e.target.value) })}
                      min={0}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Default Fine (GH₵)</label>
                    <input
                      type="number"
                      value={detailFormData.defaultFine}
                      onChange={(e) => setDetailFormData({ ...detailFormData, defaultFine: Number(e.target.value) })}
                      min={detailFormData.minFine}
                      max={detailFormData.maxFine}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max Fine (GH₵)</label>
                    <input
                      type="number"
                      value={detailFormData.maxFine}
                      onChange={(e) => setDetailFormData({ ...detailFormData, maxFine: Number(e.target.value) })}
                      min={detailFormData.minFine}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gray-50 border border-gray-200">
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Minimum</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedOffence.minFine)}</p>
                    </div>
                    <div className="text-center p-3 bg-[#1A1F3A] text-white">
                      <p className="text-[10px] uppercase mb-1 opacity-70">Default</p>
                      <p className="text-lg font-bold">{formatCurrency(selectedOffence.defaultFine)}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 border border-gray-200">
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Maximum</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedOffence.maxFine)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Officers can adjust the fine within the min-max range when issuing tickets.</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Penalty Points */}
          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#1A1F3A]" />
                Penalty Points
              </h3>
            </div>
            <div className="p-4">
              {isEditingDetails && detailFormData ? (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Points (0-12)</label>
                  <input
                    type="number"
                    value={detailFormData.points || ''}
                    onChange={(e) => setDetailFormData({ ...detailFormData, points: e.target.value ? Number(e.target.value) : undefined })}
                    min={0}
                    max={12}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                  />
                </div>
              ) : selectedOffence.points ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-red-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-red-800">{selectedOffence.points}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Penalty Points</p>
                    <p className="text-xs text-gray-500">Added to driver's license record</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No penalty points assigned</p>
                  <p className="text-xs text-gray-400 mt-1">This offence does not carry license penalty points</p>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white border border-gray-200 lg:col-span-2">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#1A1F3A]" />
                Record Information
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Created</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedOffence.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Last Updated</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedOffence.updatedAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
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
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Offences & Regulations</h1>
          <p className="text-xs text-gray-500">Manage traffic violations, legal basis, and fine amounts</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => resetToDefaults()}
            style={{
              height: '36px',
              padding: '0 16px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#1A1F3A',
              backgroundColor: 'white',
              border: '2px solid #1A1F3A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset Defaults
          </button>
          <button
            onClick={() => handleOpenModal()}
            style={{
              height: '36px',
              padding: '0 16px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'white',
              backgroundColor: '#1A1F3A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus className="h-4 w-4" />
            Add Offence
          </button>
        </div>
      </div>

      {/* Stats Grid using KpiCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Total Offences"
          value={stats.total}
          subtitle="All registered offences"
          icon={Scale}
        />
        <KpiCard
          title="Active Offences"
          value={stats.active}
          subtitle={`${Math.round((stats.active / stats.total) * 100) || 0}% of total`}
          subtitleColor="green"
          icon={CheckCircle2}
        />
        <KpiCard
          title="Average Fine"
          value={formatCurrency(stats.avgFine)}
          subtitle="Across all offences"
          icon={Gavel}
        />
        <KpiCard
          title="Categories"
          value={stats.categories}
          subtitle="Offence categories"
          icon={Hash}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, code, or legal basis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as OffenceCategory | 'all')}
            className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
          >
            <option value="all">All Categories</option>
            {OFFENCE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Offences Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Offence</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Legal Basis</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Fine (GH₵)</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Points</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOffences.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex justify-center mb-2">
                      <AlertTriangle className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-xs">No offences found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredOffences.map((offence) => (
                  <tr 
                    key={offence.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${!offence.isActive ? 'opacity-50' : ''}`}
                    onClick={() => handleViewOffence(offence)}
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs font-semibold text-[#1A1F3A]">
                        {offence.code}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{offence.name}</p>
                        <p className="text-[10px] text-gray-500 max-w-xs truncate">{offence.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-start gap-1.5 max-w-xs">
                        <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-600 line-clamp-2">{offence.legalBasis}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 text-[10px] font-medium uppercase ${getCategoryColor(offence.category)}`}>
                        {getCategoryLabel(offence.category)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      {editingFine === offence.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={tempFine}
                            onChange={(e) => setTempFine(Number(e.target.value))}
                            min={offence.minFine}
                            max={offence.maxFine}
                            className="w-20 px-2 py-1 border border-gray-300 text-xs"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveFine(offence.id)}
                            className="text-green-600 hover:text-green-800 text-[10px] font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFine(null)}
                            className="text-gray-400 hover:text-gray-600 text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer group"
                          onClick={() => handleStartEditFine(offence)}
                          title="Click to edit fine"
                        >
                          <span className="text-xs font-semibold text-gray-900">{formatCurrency(offence.defaultFine)}</span>
                          <span className="text-[10px] text-gray-400 ml-1 opacity-0 group-hover:opacity-100">
                            ({offence.minFine}-{offence.maxFine})
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {offence.points ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-800 text-[10px] font-bold">
                          {offence.points}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {offence.isActive ? (
                          <>
                            <ToggleRight className="h-4 w-4 text-green-600" />
                            <span className="text-[10px] text-green-600 font-medium">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                            <span className="text-[10px] text-gray-400 font-medium">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewOffence(offence)}
                          className="p-1.5 text-gray-400 hover:text-[#1A1F3A] hover:bg-gray-100"
                          title="View details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(offence)}
                          className="p-1.5 text-gray-400 hover:text-[#1A1F3A] hover:bg-gray-100"
                          title="Edit offence"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(offence.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete offence"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation using ConfirmDialog */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Offence"
        message={`Are you sure you want to delete "${offenceToDelete?.name || 'this offence'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModal}
          />
          
          <div className="relative bg-white border border-gray-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                {editingOffence ? 'Edit Offence' : 'Add New Offence'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-lg">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Offence Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., SPD-001"
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as OffenceCategory })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                      required
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Offence Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Exceeding Speed Limit"
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the offence..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Legal Basis / Regulation *
                    <span className="text-gray-400 font-normal ml-1">(Act, Section, Regulation reference)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.legalBasis}
                    onChange={(e) => setFormData({ ...formData, legalBasis: e.target.value })}
                    placeholder="e.g., Road Traffic Act 2004 (Act 683), Section 15(1)"
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Min Fine (GH₵) *</label>
                    <input
                      type="number"
                      value={formData.minFine}
                      onChange={(e) => setFormData({ ...formData, minFine: Number(e.target.value) })}
                      min={0}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Default Fine (GH₵) *</label>
                    <input
                      type="number"
                      value={formData.defaultFine}
                      onChange={(e) => setFormData({ ...formData, defaultFine: Number(e.target.value) })}
                      min={formData.minFine}
                      max={formData.maxFine}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Fine (GH₵) *</label>
                    <input
                      type="number"
                      value={formData.maxFine}
                      onChange={(e) => setFormData({ ...formData, maxFine: Number(e.target.value) })}
                      min={formData.minFine}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Penalty Points (Optional)</label>
                  <input
                    type="number"
                    value={formData.points || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, points: e.target.value ? Number(e.target.value) : undefined })
                    }
                    min={0}
                    max={12}
                    placeholder="0-12 points"
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#1A1F3A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 p-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#1A1F3A',
                    backgroundColor: 'white',
                    border: '2px solid #1A1F3A',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'white',
                    backgroundColor: '#1A1F3A',
                    cursor: 'pointer',
                  }}
                >
                  {editingOffence ? 'Update Offence' : 'Add Offence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OffencesPage;

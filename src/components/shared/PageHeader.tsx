import { Download } from 'lucide-react';
import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  
  // Back button
  backLabel?: string;
  onBack?: () => void;
  
  // Export button
  showExport?: boolean;
  onExport?: () => void;
  exportLabel?: string;
  
  // Custom actions slot
  actions?: ReactNode;
  
  // Status badge
  statusBadge?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  backLabel,
  onBack,
  showExport = false,
  onExport,
  exportLabel = 'Export',
  actions,
  statusBadge,
}: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {/* Back Button */}
      {onBack && backLabel && (
        <button 
          onClick={onBack}
          className="text-xs text-[#1A1F3A] hover:underline font-medium"
        >
          ← {backLabel}
        </button>
      )}

      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          {statusBadge}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {actions}
          
          {showExport && (
            <button 
              onClick={onExport}
              className="flex items-center gap-1.5 h-8 px-3 text-xs bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exportLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

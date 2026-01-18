import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmDisabled = false,
  size = 'md'
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className={`bg-white w-full ${sizeClasses[size]} m-4`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {children}
        </div>

        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            style={{ 
              height: '36px', 
              padding: '0 16px', 
              fontSize: '12px',
              fontWeight: 500,
              color: '#1A1F3A',
              backgroundColor: 'white',
              border: '2px solid #1A1F3A',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            style={{ 
              height: '36px', 
              padding: '0 16px', 
              fontSize: '12px',
              fontWeight: 500,
              color: 'white',
              backgroundColor: '#1A1F3A',
              cursor: confirmDisabled ? 'not-allowed' : 'pointer',
              opacity: confirmDisabled ? 0.5 : 1
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function ModalButton({ 
  variant = 'primary', 
  className,
  children,
  ...props 
}: ModalButtonProps) {
  const baseClasses = 'h-9 px-4 text-xs font-medium transition-colors';
  const variantClasses = variant === 'primary'
    ? 'text-white bg-[#1A1F3A] hover:bg-[#2a325a] disabled:opacity-50 disabled:cursor-not-allowed'
    : 'text-[#1A1F3A] bg-white border-2 border-[#1A1F3A] hover:bg-gray-50';
  
  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
}

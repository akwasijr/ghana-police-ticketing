import React, { type ElementType, type ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: ReactNode;
  icon: ElementType;
  subtitleColor?: 'green' | 'red' | 'gray';
}

const subtitleColorClasses = {
  green: 'text-green-600',
  red: 'text-red-600',
  gray: 'text-gray-500',
} as const;

export const KpiCard = React.memo<KpiCardProps>(function KpiCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  subtitleColor = 'gray' 
}) {
  const subtitleColorClass = subtitleColorClasses[subtitleColor];

  return (
    <div className="bg-white p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{title}</span>
        <Icon className="h-4 w-4 text-[#1A1F3A]" />
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className={`text-[10px] mt-0.5 ${subtitleColorClass}`}>{subtitle}</p>
      )}
    </div>
  );
});

export default KpiCard;

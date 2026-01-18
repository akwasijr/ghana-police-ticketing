import { type ElementType } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ElementType;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="bg-gray-100 px-1 pt-1 pb-1 flex gap-1 border-b border-gray-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              backgroundColor: isActive ? '#1A1F3A' : 'transparent',
              color: isActive ? '#ffffff' : '#6b7280',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: isActive ? 500 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '0px',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.color = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            {Icon && <Icon style={{ width: '14px', height: '14px' }} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

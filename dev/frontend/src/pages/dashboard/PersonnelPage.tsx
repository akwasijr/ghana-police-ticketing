import { useState } from 'react';
import { Users, Building2 } from 'lucide-react';
import { OfficersPage } from './OfficersPage';
import { StationsPage } from './StationsPage';
import { Tabs } from '@/components/ui';

export function PersonnelPage() {
  const [activeTab, setActiveTab] = useState<'officers' | 'stations'>('officers');

  return (
    <div className="space-y-4">
      {/* Tab Switcher - Uses same Tabs component design */}
      <div className="bg-white border border-gray-200">
        <Tabs
          tabs={[
            { id: 'officers', label: 'Officers', icon: Users },
            { id: 'stations', label: 'Stations', icon: Building2 },
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'officers' | 'stations')}
        />
      </div>

      {/* Tab Content */}
      <div
        id="panel-officers"
        role="tabpanel"
        aria-labelledby="tab-officers"
        hidden={activeTab !== 'officers'}
      >
        <OfficersPage />
      </div>
      <div
        id="panel-stations"
        role="tabpanel"
        aria-labelledby="tab-stations"
        hidden={activeTab !== 'stations'}
      >
        <StationsPage />
      </div>
    </div>
  );
}

export default PersonnelPage;

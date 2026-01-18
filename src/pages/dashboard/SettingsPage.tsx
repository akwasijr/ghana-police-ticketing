import { useState } from 'react';
import { Settings, Bell, Shield, Database, Smartphone, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs } from '@/components/ui';
import { useSettingsStore } from '@/store/settings.store';
import { useToast } from '@/store/ui.store';

type SettingsTab = 'general' | 'notifications' | 'security' | 'data' | 'devices';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'devices', label: 'Devices', icon: Smartphone },
];

export function SettingsPage() {
  const { 
    ticket, 
    notifications, 
    security, 
    data,
    updateTicketSettings,
    updateNotificationSettings,
    updateSecuritySettings,
    updateDataSettings
  } = useSettingsStore();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  
  // Local form state synced with store
  const [autoIncrement, setAutoIncrement] = useState(ticket.autoIncrementTicketIds);
  const [requirePhotos, setRequirePhotos] = useState(ticket.requireEvidencePhotos);
  const [emailNotifications, setEmailNotifications] = useState(notifications.emailNotifications);
  const [smsNotifications, setSmsNotifications] = useState(notifications.smsNotifications);
  const [pushNotifications, setPushNotifications] = useState(notifications.pushNotifications);
  const [twoFactorAuth, setTwoFactorAuth] = useState(security.twoFactorAuth);
  const [sessionTimeout, setSessionTimeout] = useState(security.sessionTimeout.toString());
  const [autoBackup, setAutoBackup] = useState(data.autoBackup);
  const [dataRetention, setDataRetention] = useState(data.dataRetention.toString());

  // Save changes handler
  const handleSaveChanges = () => {
    updateTicketSettings({ autoIncrementTicketIds: autoIncrement, requireEvidencePhotos: requirePhotos });
    updateNotificationSettings({ emailNotifications, smsNotifications, pushNotifications });
    updateSecuritySettings({ twoFactorAuth, sessionTimeout: parseInt(sessionTimeout) as 15 | 30 | 60 | 120 });
    updateDataSettings({ autoBackup, dataRetention: parseInt(dataRetention) as 90 | 180 | 365 | 730 });
    toast.success('Settings Saved', 'Your changes have been saved successfully');
  };

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button 
      onClick={onToggle}
      className={cn(
        "w-9 h-5 relative cursor-pointer transition-colors",
        enabled ? "bg-[#1A1F3A]" : "bg-gray-300"
      )}
    >
      <div className={cn(
        "absolute top-0.5 w-4 h-4 bg-white transition-all",
        enabled ? "right-0.5" : "left-0.5"
      )} />
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">System Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">System Name</label>
                  <input 
                    type="text" 
                    defaultValue="Ghana Police Ticketing System"
                    className="w-full h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Currency</label>
                  <select className="w-full h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
                    <option>Ghana Cedi (GHS)</option>
                    <option>US Dollar (USD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Time Zone</label>
                  <select className="w-full h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
                    <option>GMT (Ghana)</option>
                    <option>WAT (West Africa)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Date Format</label>
                  <select className="w-full h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Ticket Configuration</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Auto-increment Ticket IDs</p>
                    <p className="text-[10px] text-gray-500">Generate sequential numbers</p>
                  </div>
                  <Toggle enabled={autoIncrement} onToggle={() => setAutoIncrement(!autoIncrement)} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Require Evidence Photos</p>
                    <p className="text-[10px] text-gray-500">Force photo capture</p>
                  </div>
                  <Toggle enabled={requirePhotos} onToggle={() => setRequirePhotos(!requirePhotos)} />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Fine Multiplier</label>
                  <select className="w-full h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
                    <option>1.0x (Standard)</option>
                    <option>1.5x (Holiday)</option>
                    <option>2.0x (Repeat)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Notification Channels</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Email</p>
                    <p className="text-[10px] text-gray-500">Receive via email</p>
                  </div>
                  <Toggle enabled={emailNotifications} onToggle={() => setEmailNotifications(!emailNotifications)} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-gray-900">SMS</p>
                    <p className="text-[10px] text-gray-500">Receive via SMS</p>
                  </div>
                  <Toggle enabled={smsNotifications} onToggle={() => setSmsNotifications(!smsNotifications)} />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Push</p>
                    <p className="text-[10px] text-gray-500">In-app notifications</p>
                  </div>
                  <Toggle enabled={pushNotifications} onToggle={() => setPushNotifications(!pushNotifications)} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Events</h3>
              <div className="space-y-1.5">
                {[
                  { label: 'New ticket issued', enabled: true },
                  { label: 'Payment received', enabled: true },
                  { label: 'Objection filed', enabled: true },
                  { label: 'Ticket overdue', enabled: false },
                  { label: 'Daily summary', enabled: true },
                ].map((event, i) => (
                  <label key={i} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={event.enabled}
                      className="w-3.5 h-3.5 accent-[#1A1F3A]"
                    />
                    <span className="text-xs text-gray-700">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Authentication</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Two-Factor Auth</p>
                    <p className="text-[10px] text-gray-500">Require 2FA for admins</p>
                  </div>
                  <Toggle enabled={twoFactorAuth} onToggle={() => setTwoFactorAuth(!twoFactorAuth)} />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Session Timeout</label>
                  <select 
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Password Policy</label>
                  <select className="w-full h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
                    <option>Strong (12+ chars)</option>
                    <option>Medium (8+ chars)</option>
                    <option>Basic (6+ chars)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Access Control</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Default Role</label>
                  <select className="w-full h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
                    <option>Field Officer</option>
                    <option>Senior Officer</option>
                    <option>Supervisor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">IP Whitelist</label>
                  <textarea 
                    placeholder="One IP per line"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] h-16 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Backup</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Auto Backups</p>
                    <p className="text-[10px] text-gray-500">Daily automated backups</p>
                  </div>
                  <Toggle enabled={autoBackup} onToggle={() => setAutoBackup(!autoBackup)} />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Frequency</label>
                  <select className="w-full h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button className="h-7 px-2.5 text-xs bg-[#1A1F3A] text-white hover:bg-[#2a325a]">
                    Backup Now
                  </button>
                  <button className="h-7 px-2.5 text-xs border border-gray-200 text-gray-700 hover:bg-gray-50">
                    Restore
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Retention</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Keep Data For</label>
                  <select 
                    value={dataRetention}
                    onChange={(e) => setDataRetention(e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
                  >
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">1 year</option>
                    <option value="730">2 years</option>
                    <option value="1825">5 years</option>
                  </select>
                </div>
                <p className="text-[10px] text-gray-500">
                  Older records archived automatically.
                </p>
              </div>
            </div>
          </div>
        );

      case 'devices':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Registered Devices</h3>
              <div className="space-y-2">
                {[
                  { name: 'iPhone 14 Pro', officer: 'Kwame Asante', lastActive: '2m ago', status: 'active' },
                  { name: 'Galaxy S23', officer: 'Ama Serwaa', lastActive: '15m ago', status: 'active' },
                  { name: 'iPad Air', officer: 'Station HQ', lastActive: '1h ago', status: 'active' },
                  { name: 'Nokia G50', officer: 'John Mensah', lastActive: '3d ago', status: 'inactive' },
                ].map((device, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 flex items-center justify-center">
                        <Smartphone className="h-3.5 w-3.5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{device.name}</p>
                        <p className="text-[10px] text-gray-500">{device.officer} • {device.lastActive}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-1.5 py-0.5 text-[10px] font-medium",
                        device.status === 'active' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {device.status}
                      </span>
                      <button className="text-red-600 text-[10px] hover:underline">Revoke</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Printer Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Printer Model</label>
                  <select className="w-full h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
                    <option>Zebra ZQ520</option>
                    <option>Brother RJ-4250WB</option>
                    <option>Epson TM-P80</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Paper Size</label>
                  <select className="w-full h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
                    <option>80mm (Standard)</option>
                    <option>58mm (Compact)</option>
                    <option>104mm (Wide)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
          <p className="text-xs text-gray-500">System configuration and preferences</p>
        </div>
        <button 
          onClick={handleSaveChanges}
          className="flex items-center gap-1.5 h-8 px-3 text-xs bg-[#1A1F3A] text-white hover:bg-[#2a325a]"
        >
          <Save className="h-3.5 w-3.5" />
          Save Changes
        </button>
      </div>

      {/* Horizontal Tabs */}
      <div className="bg-white border border-gray-200">
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as SettingsTab)}
        />

        {/* Content Area */}
        <div className="p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

import { useState } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle, ToggleLeft, ToggleRight, Sliders, Bell, Shield, Database, Printer } from 'lucide-react';
import { useToast } from '@/store';

interface SystemSettings {
  // Ticket Settings
  maxTicketAmount: number;
  ticketPrefix: string;
  ticketExpiryDays: number;
  allowOfflineMode: boolean;
  requirePhotoEvidence: boolean;
  
  // Security Settings
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireTwoFactor: boolean;
  
  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  supervisorAlerts: boolean;
  
  // System
  maintenanceMode: boolean;
  debugMode: boolean;
  dataRetentionDays: number;
}

const INITIAL_SETTINGS: SystemSettings = {
  maxTicketAmount: 1000,
  ticketPrefix: 'TKT',
  ticketExpiryDays: 30,
  allowOfflineMode: true,
  requirePhotoEvidence: false,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  requireTwoFactor: false,
  emailNotifications: true,
  smsNotifications: false,
  supervisorAlerts: true,
  maintenanceMode: false,
  debugMode: false,
  dataRetentionDays: 365,
};

interface SettingsSectionProps {
  title: string;
  icon: typeof Sliders;
  children: React.ReactNode;
}

function SettingsSection({ title, icon: Icon, children }: SettingsSectionProps) {
  return (
    <div className="bg-white border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
        <Icon className="w-5 h-5 text-[#1A1F3A]" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleField({ label, description, checked, onChange, disabled }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {checked ? (
          <ToggleRight className="w-8 h-8 text-green-600" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-gray-400" />
        )}
      </button>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  description?: string;
  type: 'text' | 'number';
  value: string | number;
  onChange: (value: string | number) => void;
  suffix?: string;
}

function InputField({ label, description, type, value, onChange, suffix }: InputFieldProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type={type}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
          className="w-32 px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] text-right"
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Settings Saved', 'System settings have been updated successfully');
    setIsSaving(false);
    setHasChanges(false);
  };

  const handleReset = () => {
    setSettings(INITIAL_SETTINGS);
    setHasChanges(false);
    toast.info('Settings Reset', 'All settings have been restored to defaults');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button 
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] text-white font-medium hover:bg-[#1A1F3A]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="flex items-center gap-3 bg-[#F9A825]/10 border border-[#F9A825]/30 px-4 py-3">
          <AlertCircle className="w-5 h-5 text-[#F9A825]" />
          <p className="text-sm text-gray-900">You have unsaved changes. Don't forget to save before leaving.</p>
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid gap-6">
        {/* Ticket Settings */}
        <SettingsSection title="Ticket Configuration" icon={Printer}>
          <InputField
            label="Maximum Ticket Amount"
            description="The maximum fine amount allowed per ticket"
            type="number"
            value={settings.maxTicketAmount}
            onChange={(v) => updateSetting('maxTicketAmount', v as number)}
            suffix="GHS"
          />
          <InputField
            label="Ticket Prefix"
            description="Prefix for ticket numbers (e.g., TKT-2024-0001)"
            type="text"
            value={settings.ticketPrefix}
            onChange={(v) => updateSetting('ticketPrefix', v as string)}
          />
          <InputField
            label="Ticket Expiry"
            description="Number of days before unpaid tickets escalate"
            type="number"
            value={settings.ticketExpiryDays}
            onChange={(v) => updateSetting('ticketExpiryDays', v as number)}
            suffix="days"
          />
          <ToggleField
            label="Allow Offline Mode"
            description="Enable officers to issue tickets without internet"
            checked={settings.allowOfflineMode}
            onChange={(v) => updateSetting('allowOfflineMode', v)}
          />
          <ToggleField
            label="Require Photo Evidence"
            description="Mandate photo evidence for all tickets"
            checked={settings.requirePhotoEvidence}
            onChange={(v) => updateSetting('requirePhotoEvidence', v)}
          />
        </SettingsSection>

        {/* Security Settings */}
        <SettingsSection title="Security" icon={Shield}>
          <InputField
            label="Session Timeout"
            description="Automatically log out after inactivity"
            type="number"
            value={settings.sessionTimeout}
            onChange={(v) => updateSetting('sessionTimeout', v as number)}
            suffix="minutes"
          />
          <InputField
            label="Max Login Attempts"
            description="Lock account after failed attempts"
            type="number"
            value={settings.maxLoginAttempts}
            onChange={(v) => updateSetting('maxLoginAttempts', v as number)}
            suffix="attempts"
          />
          <InputField
            label="Password Minimum Length"
            description="Minimum characters required for passwords"
            type="number"
            value={settings.passwordMinLength}
            onChange={(v) => updateSetting('passwordMinLength', v as number)}
            suffix="characters"
          />
          <ToggleField
            label="Require Two-Factor Authentication"
            description="Enable 2FA for all admin accounts"
            checked={settings.requireTwoFactor}
            onChange={(v) => updateSetting('requireTwoFactor', v)}
          />
        </SettingsSection>

        {/* Notification Settings */}
        <SettingsSection title="Notifications" icon={Bell}>
          <ToggleField
            label="Email Notifications"
            description="Send email alerts for important events"
            checked={settings.emailNotifications}
            onChange={(v) => updateSetting('emailNotifications', v)}
          />
          <ToggleField
            label="SMS Notifications"
            description="Send SMS alerts for critical events"
            checked={settings.smsNotifications}
            onChange={(v) => updateSetting('smsNotifications', v)}
          />
          <ToggleField
            label="Supervisor Alerts"
            description="Notify supervisors of voided tickets and anomalies"
            checked={settings.supervisorAlerts}
            onChange={(v) => updateSetting('supervisorAlerts', v)}
          />
        </SettingsSection>

        {/* System Settings */}
        <SettingsSection title="System" icon={Database}>
          <InputField
            label="Data Retention Period"
            description="How long to keep historical data"
            type="number"
            value={settings.dataRetentionDays}
            onChange={(v) => updateSetting('dataRetentionDays', v as number)}
            suffix="days"
          />
          <ToggleField
            label="Maintenance Mode"
            description="Put the system in maintenance mode (blocks all user access)"
            checked={settings.maintenanceMode}
            onChange={(v) => updateSetting('maintenanceMode', v)}
          />
          <ToggleField
            label="Debug Mode"
            description="Enable detailed logging for troubleshooting"
            checked={settings.debugMode}
            onChange={(v) => updateSetting('debugMode', v)}
          />
        </SettingsSection>
      </div>

      {/* System Info */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Version</p>
            <p className="font-medium text-gray-900">1.0.0</p>
          </div>
          <div>
            <p className="text-gray-500">Environment</p>
            <p className="font-medium text-gray-900">Production</p>
          </div>
          <div>
            <p className="text-gray-500">Last Update</p>
            <p className="font-medium text-gray-900">15 Jan 2024</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-medium text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Operational
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

import { useNavigate } from 'react-router-dom';
import { 
	ChevronLeft,
	Printer,
	HelpCircle,
	Info,
	Bell,
	Smartphone,
	RefreshCw
} from 'lucide-react';

export function SettingsPage() {
	const navigate = useNavigate();

	return (
		<div className="min-h-full flex flex-col" style={{ backgroundColor: '#F3F4F6' }}>
			{/* Header */}
			<div className="px-4 pt-4 pb-4" style={{ backgroundColor: '#1A1F3A' }}>
				<div className="flex items-center gap-3">
					<button 
						onClick={() => navigate('/handheld')}
						className="p-2 -ml-2"
						aria-label="Go back"
					>
						<ChevronLeft className="h-6 w-6" style={{ color: '#F9A825' }} />
					</button>
					<h1 className="text-xl font-bold text-white">Settings</h1>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 px-4 pt-4 pb-4 space-y-4">
        
				{/* App Settings */}
				<div className="bg-white">
					<div className="px-4 py-3" style={{ backgroundColor: '#F3F4F6' }}>
						<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">App Settings</p>
					</div>
					<div className="p-4 space-y-4">
						<button 
							onClick={() => navigate('/handheld/printer')}
							className="w-full flex items-center justify-between"
						>
							<div className="flex items-center gap-3">
								<Printer className="h-5 w-5 text-gray-400" />
								<span className="text-sm text-gray-600">Printer Settings</span>
							</div>
							<span className="font-medium text-gray-900">Configure →</span>
						</button>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Bell className="h-5 w-5 text-gray-400" />
								<span className="text-sm text-gray-600">Notifications</span>
							</div>
							<span className="font-medium text-gray-900">Enabled</span>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Smartphone className="h-5 w-5 text-gray-400" />
								<span className="text-sm text-gray-600">Device Permissions</span>
							</div>
							<span className="font-medium text-gray-900">All Granted</span>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<RefreshCw className="h-5 w-5 text-gray-400" />
								<span className="text-sm text-gray-600">Sync Data</span>
							</div>
							<span className="font-medium text-green-600">Synced</span>
						</div>
					</div>
				</div>

				{/* Support */}
				<div className="bg-white">
					<div className="px-4 py-3" style={{ backgroundColor: '#F3F4F6' }}>
						<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Support</p>
					</div>
					<div className="p-4 space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<HelpCircle className="h-5 w-5 text-gray-400" />
								<span className="text-sm text-gray-600">Help & Support</span>
							</div>
							<span className="font-medium text-gray-900">Contact →</span>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Info className="h-5 w-5 text-gray-400" />
								<span className="text-sm text-gray-600">About App</span>
							</div>
							<span className="font-medium text-gray-900">v1.0.0</span>
						</div>
					</div>
				</div>

				{/* App Version */}
				<div className="text-center py-2">
					<p className="text-xs text-gray-400">© 2026 Ghana Police Service</p>
				</div>
			</div>
		</div>
	);
}


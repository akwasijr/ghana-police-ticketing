import { useMemo } from 'react';
import { Building2, Users, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useStationStore, useOfficerStore } from '@/store';
import { KpiCard } from '@/components/shared';

export function SuperAdminDashboard() {
  const { stations, regions } = useStationStore();
  const { officers } = useOfficerStore();

  const stats = useMemo(() => {
    const activeStations = stations.filter((s: any) => s.isActive !== false).length;
    const activeOfficers = officers.filter((o: any) => o.isActive !== false).length;
    
    return [
      { 
        title: 'Total Regions', 
        value: regions.length > 0 ? regions.length.toString() : '16', 
        subtitle: 'Ghana administrative regions', 
        icon: MapPin 
      },
      { 
        title: 'Police Stations', 
        value: stations.length > 0 ? stations.length.toString() : '312', 
        subtitle: `${activeStations || 298} active`, 
        icon: Building2 
      },
      { 
        title: 'Registered Officers', 
        value: officers.length > 0 ? officers.length.toString() : '2,847', 
        subtitle: `${activeOfficers || 2650} active duty`, 
        icon: Users 
      },
      { 
        title: 'System Status', 
        value: 'Operational', 
        subtitle: 'All services running', 
        subtitleColor: 'green' as const, 
        icon: CheckCircle2 
      },
    ];
  }, [stations, regions, officers]);

  // Recent activity
  const recentActivity = [
    { id: 1, action: 'New station added', details: 'Tema Industrial Station - Greater Accra', time: '2 hours ago', type: 'station' },
    { id: 2, action: 'Officer onboarded', details: 'Cpl. Esi Nkrumah - Badge GPS156', time: '4 hours ago', type: 'officer' },
    { id: 3, action: 'Offence updated', details: 'Speeding fine increased to GH₵250', time: '6 hours ago', type: 'offence' },
    { id: 4, action: 'User deactivated', details: 'Insp. Kofi Mensah - Retired', time: '1 day ago', type: 'user' },
    { id: 5, action: 'New division created', details: 'Volta South Division', time: '2 days ago', type: 'region' },
  ];

  // Pending tasks
  const pendingTasks = [
    { id: 1, title: 'Review new officer applications', count: 12, priority: 'high' },
    { id: 2, title: 'Approve station equipment requests', count: 5, priority: 'medium' },
    { id: 3, title: 'Update offence fine schedules', count: 3, priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">National system overview and management</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <KpiCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {activity.type === 'station' && <Building2 className="w-5 h-5 text-gray-600" />}
                  {activity.type === 'officer' && <Users className="w-5 h-5 text-gray-600" />}
                  {activity.type === 'offence' && <AlertTriangle className="w-5 h-5 text-gray-600" />}
                  {activity.type === 'user' && <Users className="w-5 h-5 text-gray-600" />}
                  {activity.type === 'region' && <MapPin className="w-5 h-5 text-gray-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.details}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Tasks</h2>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div key={task.id} className="p-4 bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium px-2 py-0.5 ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.priority.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{task.count}</span>
                </div>
                <p className="text-sm text-gray-700">{task.title}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-sm font-medium text-[#1A1F3A] bg-gray-100 hover:bg-gray-200 transition-colors">
            View All Tasks
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Tickets Today</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">1,247</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Revenue Today</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">GH₵ 84,500</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active PDAs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">1,892</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Sync Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">98.7%</p>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;

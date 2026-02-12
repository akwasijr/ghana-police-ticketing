import { Mail, Phone, Shield, MapPin, Key } from 'lucide-react';
import { useAuthStore } from '@/store';

export function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Manage your account information</p>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="h-32 bg-[#1A1F3A]" />
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              <div className="w-24 h-24 bg-white p-1">
                <div className="w-full h-full bg-[#F9A825] flex items-center justify-center text-[#1A1F3A] text-3xl font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              </div>
              <div className="mb-1">
                <h2 className="text-2xl font-bold text-gray-900">{user?.fullName}</h2>
                <p className="text-gray-500 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {user?.role?.toUpperCase()}
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Email Address</p>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Phone Number</p>
                    <p className="font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Station</p>
                    <p className="font-medium text-gray-900">{user?.officer?.station?.name || 'Headquarters'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2">Security</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Password</p>
                      <p className="text-xs text-gray-500">Last changed 3 months ago</p>
                    </div>
                  </div>
                  <button className="text-sm text-[#1A1F3A] font-medium hover:underline">Change</button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Two-Factor Auth</p>
                      <p className="text-xs text-gray-500">Enabled via SMS</p>
                    </div>
                  </div>
                  <button className="text-sm text-[#1A1F3A] font-medium hover:underline">Configure</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;

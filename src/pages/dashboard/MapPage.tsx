import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';
import { useJurisdiction } from '@/store/auth.store';
import { DEMO_STATIONS, matchesJurisdiction } from '@/lib/demo/jurisdiction';

// Fix for default marker icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const RECENT_TICKETS = [
  { id: 'TKT-001', lat: 5.5520, lng: -0.1980, type: 'Speeding', time: '10 mins ago' },
  { id: 'TKT-002', lat: 5.5580, lng: -0.1850, type: 'Red Light', time: '25 mins ago' },
  { id: 'TKT-003', lat: 5.6050, lng: -0.1720, type: 'Illegal Parking', time: '1 hour ago' },
];

export function MapPage() {
  const [filter, setFilter] = useState('all'); // all, stations, tickets
  const [stationType, setStationType] = useState<'all' | 'HQ' | 'District'>('all');
  const jurisdiction = useJurisdiction();

  const scopedStations = DEMO_STATIONS.filter((s) => matchesJurisdiction(jurisdiction, s));
  const filteredStations = scopedStations.filter((s) => stationType === 'all' || s.type === stationType);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">Live Operations Map</h1>
          <p className="text-xs text-gray-500">Real-time view of stations and ticketing activity</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={stationType}
            onChange={(e) => setStationType(e.target.value as any)}
            className="h-8 px-2 text-xs border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#1A1F3A]"
            aria-label="Station type filter"
          >
            <option value="all">All Types</option>
            <option value="HQ">HQ</option>
            <option value="District">District</option>
          </select>
          <div className="flex items-center border border-gray-200 divide-x divide-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`h-8 px-3 text-xs font-medium transition-colors ${
                filter === 'all' ? 'bg-[#1A1F3A] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('stations')}
              className={`h-8 px-3 text-xs font-medium transition-colors ${
                filter === 'stations' ? 'bg-[#1A1F3A] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Stations
            </button>
            <button
              onClick={() => setFilter('tickets')}
              className={`h-8 px-3 text-xs font-medium transition-colors ${
                filter === 'tickets' ? 'bg-[#1A1F3A] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Tickets
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative z-0">
        <MapContainer 
          center={[5.5600, -0.1900]} 
          zoom={13} 
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Stations Markers */}
          {(filter === 'all' || filter === 'stations') && filteredStations.map(station => (
            <Marker 
              key={station.id} 
              position={[station.lat, station.lng]}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-gray-900">{station.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{station.type}  {station.districtName}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="h-3 w-3" />
                    <span>{station.officers} Officers Active</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Ticket Markers - Using a different icon color would be better, but standard for now */}
          {(filter === 'all' || filter === 'tickets') && RECENT_TICKETS.map(ticket => (
            <Marker 
              key={ticket.id} 
              position={[ticket.lat, ticket.lng]}
              opacity={0.8}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-red-600">{ticket.type}</h3>
                  <p className="text-xs text-gray-500">{ticket.time}</p>
                  <p className="text-xs font-mono mt-1">{ticket.id}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 right-6 bg-white p-4 border border-gray-200 z-[1000]">
          <h4 className="font-bold text-sm mb-2">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500"></div>
              <span className="text-xs text-gray-600">Police Station</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-300"></div>
              <span className="text-xs text-gray-600">Recent Ticket</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPage;

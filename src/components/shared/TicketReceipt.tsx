import { formatCurrency } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';

export interface TicketReceiptProps {
  ticket: {
    ticketNumber: string;
    createdAt: string;
    vehicle: {
      registrationNumber: string;
      type?: string;
      color?: string;
      make?: string;
    };
    driver: {
      firstName?: string;
      lastName?: string;
      name?: string;
      idNumber?: string;
      licenseNumber?: string;
      phone?: string;
    };
    offences: Array<{
      name: string;
      fine: number;
    }>;
    officer: {
      name: string;
      badgeNumber: string;
    };
    location?: {
      address?: string;
    } | any;
    notes?: string;
  };
  qrCodeUrl?: string;
  className?: string;
}

export function TicketReceipt({ ticket, qrCodeUrl, className }: TicketReceiptProps) {
  const dateObj = new Date(ticket.createdAt);
  const date = dateObj.toLocaleDateString('en-GB');
  const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const driverName = ticket.driver.firstName && ticket.driver.lastName 
    ? `${ticket.driver.firstName} ${ticket.driver.lastName}`
    : ticket.driver.name || 'Unknown';

  const driverId = ticket.driver.licenseNumber || ticket.driver.idNumber;

  const locationStr = typeof ticket.location === 'string' 
    ? ticket.location 
    : ticket.location?.address || '';

  const totalFine = ticket.offences.reduce((sum, o) => sum + o.fine, 0);

  return (
    <div 
      className={cn("font-mono text-xs overflow-hidden bg-white", className)}
      style={{ 
        border: '1px solid #000',
        maxWidth: '280px',
      }}
    >
      {/* Receipt Header */}
      <div className="text-center py-2 px-3" style={{ borderBottom: '1px dashed #000' }}>
        <img src="/icons/logo-bw.png" alt="GPS Logo" className="w-12 h-12 mx-auto mb-1" />
        <p className="font-bold text-sm" style={{ color: '#000' }}>GHANA POLICE SERVICE</p>
        <p className="text-xs" style={{ color: '#000' }}>TRAFFIC VIOLATION TICKET</p>
      </div>

      {/* Ticket Number */}
      <div className="text-center py-2" style={{ borderBottom: '1px dashed #000' }}>
        <p className="text-xs" style={{ color: '#000' }}>TICKET NO:</p>
        <p className="font-bold text-lg tracking-wider" style={{ color: '#000' }}>{ticket.ticketNumber}</p>
      </div>

      {/* Date/Time */}
      <div className="px-3 py-1 text-xs" style={{ borderBottom: '1px dashed #000', color: '#000' }}>
        <div className="flex justify-between">
          <span>DATE:</span>
          <span style={{ fontWeight: 600 }}>{date}</span>
        </div>
        <div className="flex justify-between">
          <span>TIME:</span>
          <span style={{ fontWeight: 600 }}>{time}</span>
        </div>
      </div>

      {/* Vehicle */}
      <div className="px-3 py-2" style={{ borderBottom: '1px dashed #000', color: '#000' }}>
        <p className="text-xs">VEHICLE:</p>
        <p className="font-bold text-base">{ticket.vehicle.registrationNumber}</p>
        {(ticket.vehicle.color || ticket.vehicle.type || ticket.vehicle.make) && (
          <p className="text-[10px] mt-0.5">
            {[ticket.vehicle.color, ticket.vehicle.type, ticket.vehicle.make].filter(Boolean).join(' • ')}
          </p>
        )}
      </div>

      {/* Driver */}
      <div className="px-3 py-2" style={{ borderBottom: '1px dashed #000', color: '#000' }}>
        <p className="text-xs">DRIVER: <span className="font-semibold">{driverName}</span></p>
        {driverId && <p className="text-xs">ID: {driverId}</p>}
        {ticket.driver.phone && <p className="text-xs">Phone: {ticket.driver.phone}</p>}
      </div>

      {/* Violations */}
      <div className="px-3 py-2" style={{ borderBottom: '1px dashed #000', color: '#000' }}>
        <p className="text-xs mb-1">OFFENCE(S):</p>
        {ticket.offences.map((o, idx) => (
          <div key={idx} className="flex justify-between text-xs">
            <span>{idx + 1}. {o.name}</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(o.fine)}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000', color: '#000' }}>
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL:</span>
          <span>{formatCurrency(totalFine)}</span>
        </div>
      </div>

      {/* Location */}
      {locationStr && (
        <div className="px-3 py-2" style={{ borderBottom: '1px dashed #000', color: '#000' }}>
          <p className="text-xs">LOCATION:</p>
          <p className="text-[10px]">{locationStr}</p>
        </div>
      )}

      {/* Notes */}
      {ticket.notes && (
        <div className="px-3 py-2" style={{ borderBottom: '1px dashed #000', color: '#000' }}>
          <p className="text-xs">NOTES:</p>
          <p className="text-[10px] italic">{ticket.notes}</p>
        </div>
      )}

      {/* Payment */}
      <div className="px-3 py-2 text-xs text-center" style={{ borderBottom: '1px dashed #000', color: '#000' }}>
        <p className="font-bold">PAY WITHIN 14 DAYS</p>
        <p>Mobile Money: *920*44#</p>
      </div>

      {/* QR Code */}
      <div className="py-2 flex flex-col items-center" style={{ borderBottom: '1px dashed #000' }}>
        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" style={{ filter: 'grayscale(100%)' }} />
        ) : (
          <div className="w-20 h-20 flex items-center justify-center border border-black">
            <span className="text-xs">QR</span>
          </div>
        )}
        <p className="text-xs mt-1" style={{ color: '#000' }}>Scan to verify</p>
      </div>

      {/* Footer */}
      <div className="text-center py-2 text-xs" style={{ color: '#000' }}>
        <p>Officer: {ticket.officer.name}</p>
        <p>Badge: {ticket.officer.badgeNumber}</p>
        <p className="mt-1">Drive Safely</p>
      </div>
    </div>
  );
}

// Thermal print utility for 80mm receipts
// Uses B&W logo from /public/icons/logo-bw.png

interface TicketPrintData {
  ticketNumber: string;
  date: string;
  time: string;
  vehicle: string;
  vehicleType?: string;
  vehicleColor?: string;
  driver: string;
  driverId: string;
  offenses: Array<{ name: string; fine: number }>;
  totalFine: number;
  location?: string;
  officerName: string;
  officerBadge: string;
  notes?: string;
}

// Logo path for thermal printing (relative to public folder)
const LOGO_PATH = '/icons/logo-bw.png';

export function generatePrintHTML(data: TicketPrintData): string {
  const offenseRows = data.offenses
    .map((o, idx) => `<div class="row-flex"><span>${idx + 1}. ${o.name}</span><span>GH¢${o.fine.toFixed(0)}</span></div>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket ${data.ticketNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px;
            width: 80mm;
            padding: 2mm;
            background: white;
            color: black;
          }
          .logo { text-align: center; padding: 4px 0; }
          .logo img { width: 50px; height: 50px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding: 4px 0 8px; }
          .header h1 { font-size: 13px; font-weight: bold; margin-top: 4px; }
          .header p { font-size: 10px; }
          .ticket-no { text-align: center; padding: 8px 0; border-bottom: 1px dashed #000; }
          .ticket-no span { font-size: 10px; }
          .ticket-no strong { font-size: 16px; letter-spacing: 1px; }
          .row { padding: 5px 0; border-bottom: 1px dashed #000; }
          .row-flex { display: flex; justify-content: space-between; }
          .label { font-size: 9px; color: #333; }
          .vehicle { font-size: 14px; font-weight: bold; }
          .total { padding: 6px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
          .payment { text-align: center; padding: 6px 0; border-bottom: 1px dashed #000; font-size: 10px; }
          .payment strong { font-size: 11px; }
          .footer { text-align: center; padding: 6px 0; font-size: 9px; }
          @media print {
            body { width: 80mm; }
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="logo">
          <img src="${LOGO_PATH}" alt="GPS" onerror="this.style.display='none'">
        </div>
        <div class="header">
          <h1>GHANA POLICE SERVICE</h1>
          <p>TRAFFIC VIOLATION TICKET</p>
        </div>
        <div class="ticket-no">
          <span>TICKET NO:</span><br>
          <strong>${data.ticketNumber}</strong>
        </div>
        <div class="row">
          <div class="row-flex"><span>DATE:</span><span>${data.date}</span></div>
          <div class="row-flex"><span>TIME:</span><span>${data.time}</span></div>
        </div>
        <div class="row">
          <span class="label">VEHICLE:</span><br>
          <span class="vehicle">${data.vehicle}</span>
          ${data.vehicleColor || data.vehicleType ? `<br><span>${[data.vehicleColor, data.vehicleType].filter(Boolean).join(' ')}</span>` : ''}
        </div>
        <div class="row">
          <span class="label">DRIVER:</span> ${data.driver}<br>
          <span class="label">ID:</span> ${data.driverId}
        </div>
        <div class="row">
          <span class="label">OFFENCE${data.offenses.length > 1 ? 'S' : ''}:</span><br>
          ${offenseRows}
        </div>
        ${data.location ? `
        <div class="row">
          <span class="label">LOCATION:</span><br>
          <span style="font-size:10px">${data.location}</span>
        </div>
        ` : ''}
        ${data.notes ? `
        <div class="row">
          <span class="label">NOTES:</span><br>
          <span style="font-size:10px">${data.notes}</span>
        </div>
        ` : ''}
        <div class="total">
          <div class="total-row"><span>TOTAL:</span><span>GH¢${data.totalFine.toFixed(2)}</span></div>
        </div>
        <div class="payment">
          <strong>PAY WITHIN 14 DAYS</strong><br>
          Mobile Money: *920*44#
        </div>
        <div class="qr-code" style="text-align: center; padding: 8px 0; border-bottom: 1px dashed #000;">
          <p style="font-size: 9px; color: #666; margin-bottom: 4px;">SCAN TO PAY</p>
          <img id="qrcode" style="width: 100px; height: 100px;" alt="QR Code">
          <p style="font-size: 8px; color: #999; margin-top: 2px;">pay.gps.gov.gh</p>
        </div>
        <div class="footer">
          <p>Officer: ${data.officerName}</p>
          <p>Badge: ${data.officerBadge}</p>
          <p style="margin-top: 3px;">Drive Safely</p>
        </div>
      </body>
    </html>
  `;
}

export async function printTicket(data: TicketPrintData): Promise<void> {
  // Check if we should use RawBT (Android Intent)
  // This is a common way to print from web apps on Android PDAs
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  if (isAndroid) {
    try {
      // Generate base64 content for RawBT
      const htmlContent = generatePrintHTML(data);
      const base64Content = btoa(unescape(encodeURIComponent(htmlContent)));
      
      // Construct RawBT intent URL
      // S.data: base64 encoded HTML
      // S.type: text/html
      const intentUrl = `intent:${base64Content}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.type=text/html;S.data=${base64Content};end;`;
      
      window.location.href = intentUrl;
      return;
    } catch (e) {
      console.error('Failed to launch RawBT intent:', e);
      // Fallback to standard browser print if intent fails
    }
  }

  // Create a hidden iframe for printing (Standard Browser Print)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.write(generatePrintHTML(data));
  doc.close();

  // Generate QR code for payment
  try {
    const QRCode = await import('qrcode');
    const paymentUrl = `https://pay.gps.gov.gh/ticket/${data.ticketNumber}`;
    const qrDataUrl = await QRCode.default.toDataURL(paymentUrl, { width: 100, margin: 1 });
    const qrImg = doc.getElementById('qrcode') as HTMLImageElement;
    if (qrImg) {
      qrImg.src = qrDataUrl;
    }
  } catch (err) {
    console.error('Failed to generate QR code:', err);
  }

  // Wait for images to load, then print
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    
    // Remove iframe after a delay
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 800);
}

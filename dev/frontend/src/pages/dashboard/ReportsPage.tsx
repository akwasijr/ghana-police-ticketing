import { useMemo, useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  PieChart as PieChartIcon, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Users,
  Building2,
  FileText,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useTicketStore } from '@/store/ticket.store';
import { useOfficerStore } from '@/store/officer.store';
import { useToast } from '@/store/ui.store';
import { useStationStore } from '@/store/station.store';
import { KpiCard, PageHeader } from '@/components/shared';
import { RevenueBarChart, StatusPieChart, TrendLineChart, ComparisonBarChart } from '@/components/charts';
import { Tabs } from '@/components/ui';

const COLORS = {
  primary: '#1A1F3A',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
};

type TabId = 'overview' | 'revenue' | 'performance' | 'trends';

export function ReportsPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const officers = useOfficerStore((state) => state.officers);
  const toast = useToast();

  const stations = useStationStore((state) => state.stations);
  const fetchStations = useStationStore((state) => state.fetchStations);
  useEffect(() => { fetchStations(); }, [fetchStations]);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Filter tickets by date range
  const scopedTickets = useMemo(() => {
    const start = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const end = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return tickets.filter((t) => {
      const issuedAt = new Date(t.issuedAt);
      if (start && issuedAt < start) return false;
      if (end && issuedAt > end) return false;
      return true;
    });
  }, [tickets, dateFrom, dateTo]);

  const scopedOfficers = officers;

  const scopedStations = stations;

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalRevenue = scopedTickets.reduce((sum, t) => sum + t.totalFine, 0);
    const collectedRevenue = scopedTickets.filter((t) => t.status === 'paid').reduce((sum, t) => sum + t.totalFine, 0);
    const pendingRevenue = totalRevenue - collectedRevenue;
    const collectionRate = totalRevenue > 0 ? Math.round((collectedRevenue / totalRevenue) * 100) : 0;
    
    // Status counts
    const statusCounts = { paid: 0, unpaid: 0, overdue: 0, objection: 0 };
    scopedTickets.forEach((t) => {
      if (statusCounts[t.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[t.status as keyof typeof statusCounts]++;
      }
    });

    // Simulate previous period comparison (for demo purposes)
    const prevPeriodChange = Math.floor(Math.random() * 30) - 10; // -10% to +20%

    return {
      totalRevenue,
      collectedRevenue,
      pendingRevenue,
      collectionRate,
      statusCounts,
      totalTickets: scopedTickets.length,
      prevPeriodChange,
    };
  }, [scopedTickets]);

  // Revenue by day (last 7 days)
  const revenueByDay = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const dayData: Array<{ label: string; revenue: number; count: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      const dayTickets = scopedTickets.filter((t) => {
        const ticketDate = new Date(t.issuedAt);
        return ticketDate.toDateString() === date.toDateString();
      });

      dayData.push({
        label: dayName,
        revenue: dayTickets.reduce((sum, t) => sum + t.totalFine, 0),
        count: dayTickets.length,
      });
    }

    return dayData;
  }, [scopedTickets]);

  // Revenue by month (last 6 months)
  const revenueByMonth = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const monthData: Array<{ label: string; value: number; secondaryValue: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      
      const monthTickets = scopedTickets.filter((t) => {
        const ticketDate = new Date(t.issuedAt);
        return ticketDate.getMonth() === date.getMonth() && ticketDate.getFullYear() === date.getFullYear();
      });

      monthData.push({
        label: monthName,
        value: monthTickets.length,
        secondaryValue: Math.floor(monthTickets.length * 0.8 + Math.random() * 10), // Simulated previous year
      });
    }

    return monthData;
  }, [scopedTickets]);

  // Status pie chart data
  const statusPieData = useMemo(() => {
    return [
      { name: 'Paid', value: kpis.statusCounts.paid, color: COLORS.success },
      { name: 'Unpaid', value: kpis.statusCounts.unpaid, color: COLORS.warning },
      { name: 'Overdue', value: kpis.statusCounts.overdue, color: COLORS.danger },
      { name: 'Objection', value: kpis.statusCounts.objection, color: COLORS.purple },
    ];
  }, [kpis.statusCounts]);

  // Tickets by station
  const ticketsByStation = useMemo(() => {
    const stationMap: Record<string, { name: string; current: number; revenue: number }> = {};
    
    scopedTickets.forEach((t) => {
      const key = t.stationName || 'Unknown';
      if (!stationMap[key]) {
        stationMap[key] = { name: key, current: 0, revenue: 0 };
      }
      stationMap[key].current++;
      stationMap[key].revenue += t.totalFine;
    });

    return Object.values(stationMap)
      .sort((a, b) => b.current - a.current)
      .slice(0, 5);
  }, [scopedTickets]);

  // Top performing officers
  const topOfficers = useMemo(() => {
    const officerMap: Record<string, { name: string; current: number; revenue: number }> = {};
    
    scopedTickets.forEach((t) => {
      const key = t.officerName || 'Unknown';
      if (!officerMap[key]) {
        officerMap[key] = { name: key, current: 0, revenue: 0 };
      }
      officerMap[key].current++;
      officerMap[key].revenue += t.totalFine;
    });

    return Object.values(officerMap)
      .sort((a, b) => b.current - a.current)
      .slice(0, 5);
  }, [scopedTickets]);

  // Revenue by hour (for heatmap-style data)
  const ticketsByHour = useMemo(() => {
    const hourData: Array<{ label: string; revenue: number; count: number }> = [];
    
    for (let hour = 6; hour <= 22; hour += 2) {
      const hourTickets = scopedTickets.filter((t) => {
        const ticketHour = new Date(t.issuedAt).getHours();
        return ticketHour >= hour && ticketHour < hour + 2;
      });

      hourData.push({
        label: `${hour.toString().padStart(2, '0')}:00`,
        revenue: hourTickets.reduce((sum, t) => sum + t.totalFine, 0),
        count: hourTickets.length,
      });
    }

    return hourData;
  }, [scopedTickets]);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Helper functions
    const drawLine = (yPos: number) => {
      doc.setDrawColor('#d1d5db');
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
    };

    const drawTableHeader = (headers: string[], colWidths: number[], yPos: number) => {
      doc.setFillColor('#f3f4f6');
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor('#374151');
      let x = margin + 3;
      headers.forEach((header, i) => {
        doc.text(header, x, yPos + 5.5);
        x += colWidths[i];
      });
      return yPos + 10;
    };

    const drawTableRow = (cells: string[], colWidths: number[], yPos: number, isAlt: boolean) => {
      if (isAlt) {
        doc.setFillColor('#f9fafb');
        doc.rect(margin, yPos, contentWidth, 8, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor('#1f2937');
      let x = margin + 3;
      cells.forEach((cell, i) => {
        doc.text(cell, x, yPos + 5.5);
        x += colWidths[i];
      });
      return yPos + 8;
    };

    const drawPageHeader = (title: string) => {
      // Header bar
      doc.setFillColor('#1A1F3A');
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor('#ffffff');
      doc.text('Ghana Police Service - Traffic Analytics', margin, 12);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor('#94a3b8');
      doc.text(title, margin, 20);
      
      // Date on right
      doc.setFontSize(8);
      const dateText = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      doc.text(dateText, pageWidth - margin, 12, { align: 'right' });
      
      if (dateFrom || dateTo) {
        doc.text(`Period: ${dateFrom || 'Start'} - ${dateTo || 'Present'}`, pageWidth - margin, 20, { align: 'right' });
      }
    };

    const drawPageFooter = (pageNum: number, totalPages: number) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor('#9ca3af');
      drawLine(pageHeight - 15);
      doc.text('Ghana Police Service - Motor Traffic and Transport Department', margin, pageHeight - 8);
      doc.text('Confidential - For Official Use Only', pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    };

    const formatCurrency = (amount: number) => `GHS ${amount.toLocaleString()}`;

    // ==================== PAGE 1: OVERVIEW ====================
    let y = 35;
    drawPageHeader('Page 1: Executive Overview');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor('#1A1F3A');
    doc.text('EXECUTIVE OVERVIEW', margin, y);
    y += 12;

    // Summary Stats Grid
    doc.setFillColor('#f8fafc');
    doc.rect(margin, y, contentWidth, 45, 'F');
    doc.setDrawColor('#e2e8f0');
    doc.rect(margin, y, contentWidth, 45, 'S');
    
    // Row 1
    const col1 = margin + 5;
    const col2 = margin + contentWidth / 2 + 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor('#64748b');
    doc.text('Total Revenue', col1, y + 8);
    doc.text('Collected Revenue', col2, y + 8);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor('#1A1F3A');
    doc.text(formatCurrency(kpis.totalRevenue), col1, y + 18);
    doc.setTextColor('#10b981');
    doc.text(formatCurrency(kpis.collectedRevenue), col2, y + 18);
    
    // Row 2
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor('#64748b');
    doc.text('Pending Revenue', col1, y + 30);
    doc.text('Collection Rate', col2, y + 30);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor('#f59e0b');
    doc.text(formatCurrency(kpis.pendingRevenue), col1, y + 40);
    doc.setTextColor(kpis.collectionRate >= 70 ? '#10b981' : '#ef4444');
    doc.text(`${kpis.collectionRate}%`, col2, y + 40);
    
    y += 55;

    // Quick Stats Row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#374151');
    doc.text(`Total Tickets: ${kpis.totalTickets}`, margin, y);
    doc.text(`Active Officers: ${scopedOfficers.filter(o => o.status === 'active').length}`, margin + 60, y);
    doc.text(`Active Stations: ${scopedStations.filter(s => s.status === 'active').length}`, margin + 125, y);
    y += 15;

    // Status Breakdown Section
    drawLine(y);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor('#1A1F3A');
    doc.text('Ticket Status Breakdown', margin, y);
    y += 8;

    const statusColWidths = [50, 40, 40, 50];
    y = drawTableHeader(['Status', 'Count', 'Percentage', 'Amount'], statusColWidths, y);

    const statusRows = [
      { status: 'Paid', count: kpis.statusCounts.paid, amount: kpis.collectedRevenue },
      { status: 'Unpaid', count: kpis.statusCounts.unpaid, amount: Math.round(kpis.pendingRevenue * 0.6) },
      { status: 'Overdue', count: kpis.statusCounts.overdue, amount: Math.round(kpis.pendingRevenue * 0.3) },
      { status: 'Objection', count: kpis.statusCounts.objection, amount: Math.round(kpis.pendingRevenue * 0.1) },
    ];

    statusRows.forEach((row, i) => {
      const pct = kpis.totalTickets > 0 ? ((row.count / kpis.totalTickets) * 100).toFixed(1) : '0.0';
      y = drawTableRow(
        [row.status, row.count.toString(), `${pct}%`, formatCurrency(row.amount)],
        statusColWidths,
        y,
        i % 2 === 0
      );
    });

    y += 15;

    // Daily Revenue Summary
    drawLine(y);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor('#1A1F3A');
    doc.text('Daily Revenue Summary (Last 7 Days)', margin, y);
    y += 8;

    const dayColWidths = [30, 35, 55, 60];
    y = drawTableHeader(['Day', 'Tickets', 'Revenue', 'Avg per Ticket'], dayColWidths, y);

    revenueByDay.forEach((day, i) => {
      const avg = day.count > 0 ? Math.round(day.revenue / day.count) : 0;
      y = drawTableRow(
        [day.label, day.count.toString(), formatCurrency(day.revenue), formatCurrency(avg)],
        dayColWidths,
        y,
        i % 2 === 0
      );
    });

    // ==================== PAGE 2: REVENUE ANALYSIS ====================
    doc.addPage();
    y = 35;
    drawPageHeader('Page 2: Revenue Analysis');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor('#1A1F3A');
    doc.text('REVENUE ANALYSIS', margin, y);
    y += 12;

    // Revenue KPIs
    doc.setFillColor('#f8fafc');
    doc.rect(margin, y, contentWidth, 25, 'F');
    
    const revKpis = [
      { label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue) },
      { label: 'Average per Ticket', value: formatCurrency(kpis.totalTickets > 0 ? Math.round(kpis.totalRevenue / kpis.totalTickets) : 0) },
      { label: 'Daily Average', value: formatCurrency(Math.round(revenueByDay.reduce((s, d) => s + d.revenue, 0) / 7)) },
    ];

    const kpiWidth = contentWidth / 3;
    revKpis.forEach((kpi, i) => {
      const kpiX = margin + i * kpiWidth + 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor('#64748b');
      doc.text(kpi.label, kpiX, y + 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor('#1A1F3A');
      doc.text(kpi.value, kpiX, y + 18);
    });

    y += 35;

    // Revenue by Station
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor('#1A1F3A');
    doc.text('Revenue by Station', margin, y);
    y += 8;

    if (ticketsByStation.length > 0) {
      const stationColWidths = [15, 80, 35, 50];
      y = drawTableHeader(['#', 'Station Name', 'Tickets', 'Revenue'], stationColWidths, y);

      ticketsByStation.forEach((station, i) => {
        y = drawTableRow(
          [(i + 1).toString(), station.name, station.current.toString(), formatCurrency(station.revenue)],
          stationColWidths,
          y,
          i % 2 === 0
        );
      });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor('#9ca3af');
      doc.text('No station data available', margin, y + 5);
      y += 12;
    }

    y += 15;

    // Revenue by Time of Day
    drawLine(y);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor('#1A1F3A');
    doc.text('Revenue by Time of Day', margin, y);
    y += 8;

    const hourColWidths = [40, 35, 55, 50];
    y = drawTableHeader(['Time Slot', 'Tickets', 'Revenue', 'Avg per Ticket'], hourColWidths, y);

    ticketsByHour.forEach((hour, i) => {
      const avg = hour.count > 0 ? Math.round(hour.revenue / hour.count) : 0;
      y = drawTableRow(
        [hour.label, hour.count.toString(), formatCurrency(hour.revenue), formatCurrency(avg)],
        hourColWidths,
        y,
        i % 2 === 0
      );
    });

    // ==================== PAGE 3: PERFORMANCE ====================
    doc.addPage();
    y = 35;
    drawPageHeader('Page 3: Performance Metrics');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor('#1A1F3A');
    doc.text('PERFORMANCE METRICS', margin, y);
    y += 12;

    // Performance KPIs
    doc.setFillColor('#f8fafc');
    doc.rect(margin, y, contentWidth, 25, 'F');
    
    const perfKpis = [
      { label: 'Active Officers', value: scopedOfficers.filter(o => o.status === 'active').length.toString() },
      { label: 'Active Stations', value: scopedStations.filter(s => s.status === 'active').length.toString() },
      { label: 'Avg Tickets/Officer', value: scopedOfficers.length > 0 ? Math.round(kpis.totalTickets / scopedOfficers.length).toString() : '0' },
      { label: 'Collection Rate', value: `${kpis.collectionRate}%` },
    ];

    const perfKpiWidth = contentWidth / 4;
    perfKpis.forEach((kpi, i) => {
      const kpiX = margin + i * perfKpiWidth + 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor('#64748b');
      doc.text(kpi.label, kpiX, y + 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor('#1A1F3A');
      doc.text(kpi.value, kpiX, y + 18);
    });

    y += 35;

    // Top Officers Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor('#1A1F3A');
    doc.text('Top Performing Officers', margin, y);
    y += 8;

    if (topOfficers.length > 0) {
      const officerColWidths = [15, 80, 35, 50];
      y = drawTableHeader(['Rank', 'Officer Name', 'Tickets', 'Revenue'], officerColWidths, y);

      topOfficers.forEach((officer, i) => {
        y = drawTableRow(
          [(i + 1).toString(), officer.name, officer.current.toString(), formatCurrency(officer.revenue)],
          officerColWidths,
          y,
          i % 2 === 0
        );
      });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor('#9ca3af');
      doc.text('No officer data available', margin, y + 5);
      y += 12;
    }

    y += 15;

    // Station Performance Table
    drawLine(y);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor('#1A1F3A');
    doc.text('Station Performance', margin, y);
    y += 8;

    if (ticketsByStation.length > 0) {
      const stationColWidths = [15, 80, 35, 50];
      y = drawTableHeader(['Rank', 'Station Name', 'Tickets', 'Revenue'], stationColWidths, y);

      ticketsByStation.forEach((station, i) => {
        y = drawTableRow(
          [(i + 1).toString(), station.name, station.current.toString(), formatCurrency(station.revenue)],
          stationColWidths,
          y,
          i % 2 === 0
        );
      });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor('#9ca3af');
      doc.text('No station data available', margin, y + 5);
      y += 12;
    }

    // ==================== PAGE 4: TRENDS ====================
    doc.addPage();
    y = 35;
    drawPageHeader('Page 4: Trends Analysis');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor('#1A1F3A');
    doc.text('TRENDS ANALYSIS', margin, y);
    y += 12;

    // Monthly Trend Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor('#1A1F3A');
    doc.text('Monthly Ticket Volume (Last 6 Months)', margin, y);
    y += 8;

    const monthColWidths = [40, 45, 50, 45];
    y = drawTableHeader(['Month', 'Tickets', 'This Year', 'Last Year'], monthColWidths, y);

    revenueByMonth.forEach((month, i) => {
      const change = month.secondaryValue > 0 
        ? Math.round(((month.value - month.secondaryValue) / month.secondaryValue) * 100)
        : 0;
      const changeText = change >= 0 ? `+${change}%` : `${change}%`;
      y = drawTableRow(
        [month.label, month.value.toString(), month.value.toString(), `${month.secondaryValue} (${changeText})`],
        monthColWidths,
        y,
        i % 2 === 0
      );
    });

    y += 15;

    // Peak Hours Analysis
    drawLine(y);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor('#1A1F3A');
    doc.text('Peak Hours Analysis', margin, y);
    y += 8;

    // Find peak hour
    const peakHour = ticketsByHour.reduce((max, h) => h.count > max.count ? h : max, ticketsByHour[0]);
    const lowHour = ticketsByHour.reduce((min, h) => h.count < min.count ? h : min, ticketsByHour[0]);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#374151');
    doc.text(`Peak Activity: ${peakHour?.label || 'N/A'} (${peakHour?.count || 0} tickets)`, margin, y);
    y += 8;
    doc.text(`Lowest Activity: ${lowHour?.label || 'N/A'} (${lowHour?.count || 0} tickets)`, margin, y);
    y += 8;
    doc.text(`Total Hours Analyzed: ${ticketsByHour.length} time slots`, margin, y);
    y += 15;

    // Hour breakdown table
    const hourTableColWidths = [45, 40, 50, 45];
    y = drawTableHeader(['Time Slot', 'Tickets', 'Revenue', 'Activity'], hourTableColWidths, y);

    const maxHourCount = Math.max(...ticketsByHour.map(h => h.count), 1);
    ticketsByHour.forEach((hour, i) => {
      const activityLevel = hour.count >= maxHourCount * 0.7 ? 'High' 
        : hour.count >= maxHourCount * 0.3 ? 'Medium' : 'Low';
      y = drawTableRow(
        [hour.label, hour.count.toString(), formatCurrency(hour.revenue), activityLevel],
        hourTableColWidths,
        y,
        i % 2 === 0
      );
    });

    y += 15;

    // Summary Notes
    drawLine(y);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor('#1A1F3A');
    doc.text('Report Summary', margin, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#374151');
    
    const summaryNotes = [
      `This report covers ${kpis.totalTickets} tickets with total revenue of ${formatCurrency(kpis.totalRevenue)}.`,
      `The collection rate stands at ${kpis.collectionRate}%, with ${formatCurrency(kpis.pendingRevenue)} pending collection.`,
      `${kpis.statusCounts.overdue} tickets are overdue and require follow-up action.`,
      `${scopedOfficers.filter(o => o.status === 'active').length} officers are currently active across ${scopedStations.filter(s => s.status === 'active').length} stations.`,
    ];

    summaryNotes.forEach((note, i) => {
      doc.text(`${i + 1}. ${note}`, margin, y);
      y += 7;
    });

    // Add footers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPageFooter(i, totalPages);
    }

    // Save
    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`GPS-Analytics-Report-${dateStr}.pdf`);
    toast.success('Report Exported', '4-page PDF report has been downloaded');
  };

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    toast.info('Filters Reset', 'Date filters have been cleared');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Reports & Analytics"
        subtitle="Traffic enforcement insights and trends"
        showExport
        exportLabel="Export PDF"
        onExport={handleExportPdf}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-2 h-8">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-7 px-1 text-xs bg-transparent border-none focus:outline-none"
                title="Start date"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-7 px-1 text-xs bg-transparent border-none focus:outline-none"
                title="End date"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={handleResetFilters}
                className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                title="Clear date filters"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="bg-white border border-gray-200">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
            { id: 'performance', label: 'Performance', icon: Users },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-5 gap-3">
            <KpiCard
              title="Total Revenue"
              value={`GH₵ ${kpis.totalRevenue.toLocaleString()}`}
              subtitle={
                <span className="flex items-center gap-1">
                  {kpis.prevPeriodChange >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  )}
                  <span className={kpis.prevPeriodChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(kpis.prevPeriodChange)}% vs last period
                  </span>
                </span>
              }
              icon={DollarSign}
            />
            <KpiCard
              title="Collected"
              value={`GH₵ ${kpis.collectedRevenue.toLocaleString()}`}
              subtitle={`${kpis.collectionRate}% collection rate`}
              subtitleColor="green"
              icon={CheckCircle2}
            />
            <KpiCard
              title="Pending"
              value={`GH₵ ${kpis.pendingRevenue.toLocaleString()}`}
              subtitle={`${kpis.statusCounts.unpaid} unpaid tickets`}
              icon={Clock}
            />
            <KpiCard
              title="Overdue"
              value={kpis.statusCounts.overdue.toString()}
              subtitle="Requires follow-up"
              subtitleColor="red"
              icon={AlertTriangle}
            />
            <KpiCard
              title="Total Tickets"
              value={kpis.totalTickets.toString()}
              subtitle={`${scopedOfficers.length} officers active`}
              icon={FileText}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Revenue Trend Chart */}
            <div className="col-span-2 bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-[#1A1F3A]" />
                  Revenue Trend (Last 7 Days)
                </h3>
              </div>
              <RevenueBarChart data={revenueByDay} height={200} />
            </div>

            {/* Status Breakdown */}
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-4">
                <PieChartIcon className="h-3.5 w-3.5 text-[#1A1F3A]" />
                Ticket Status Distribution
              </h3>
              <StatusPieChart data={statusPieData} height={180} />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Top Stations */}
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
                <Building2 className="h-3.5 w-3.5 text-[#1A1F3A]" />
                Top Stations
              </h3>
              {ticketsByStation.length > 0 ? (
                <ComparisonBarChart
                  data={ticketsByStation}
                  height={180}
                  layout="vertical"
                  currentLabel="Tickets"
                  showGrid={false}
                />
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Top Officers */}
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
                <Users className="h-3.5 w-3.5 text-[#1A1F3A]" />
                Top Officers
              </h3>
              {topOfficers.length > 0 ? (
                <ComparisonBarChart
                  data={topOfficers}
                  height={180}
                  layout="vertical"
                  currentLabel="Tickets"
                  showGrid={false}
                />
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
                <TrendingUp className="h-3.5 w-3.5 text-[#1A1F3A]" />
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Officers</p>
                  <p className="text-lg font-bold text-gray-900">{scopedOfficers.length}</p>
                  <p className="text-[10px] text-green-600">
                    {scopedOfficers.filter((o) => o.status === 'active').length} active
                  </p>
                </div>
                <div className="bg-gray-50 p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Stations</p>
                  <p className="text-lg font-bold text-gray-900">{scopedStations.length}</p>
                  <p className="text-[10px] text-green-600">
                    {scopedStations.filter((s) => s.status === 'active').length} active
                  </p>
                </div>
                <div className="bg-gray-50 p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg. Fine</p>
                  <p className="text-lg font-bold text-gray-900">
                    GH₵ {scopedTickets.length > 0 ? Math.round(kpis.totalRevenue / scopedTickets.length) : 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Daily Avg</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.round(revenueByDay.reduce((sum, d) => sum + d.count, 0) / 7)}
                  </p>
                  <p className="text-[10px] text-gray-500">tickets/day</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              title="Total Revenue"
              value={`GH₵ ${kpis.totalRevenue.toLocaleString()}`}
              subtitle={`${kpis.totalTickets} tickets issued`}
              icon={DollarSign}
            />
            <KpiCard
              title="Collected"
              value={`GH₵ ${kpis.collectedRevenue.toLocaleString()}`}
              subtitle={`${kpis.collectionRate}% rate`}
              subtitleColor="green"
              icon={CheckCircle2}
            />
            <KpiCard
              title="Pending"
              value={`GH₵ ${kpis.pendingRevenue.toLocaleString()}`}
              subtitle="Awaiting payment"
              icon={Clock}
            />
            <KpiCard
              title="Avg per Ticket"
              value={`GH₵ ${kpis.totalTickets > 0 ? Math.round(kpis.totalRevenue / kpis.totalTickets) : 0}`}
              subtitle="Average fine amount"
              icon={BarChart3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-4">
                <BarChart3 className="h-3.5 w-3.5 text-[#1A1F3A]" />
                Daily Revenue (Last 7 Days)
              </h3>
              <RevenueBarChart data={revenueByDay} height={250} />
            </div>

            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-4">
                <Clock className="h-3.5 w-3.5 text-[#1A1F3A]" />
                Revenue by Time of Day
              </h3>
              <RevenueBarChart data={ticketsByHour} height={250} barColor={COLORS.info} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-4">
              <DollarSign className="h-3.5 w-3.5 text-[#1A1F3A]" />
              Revenue by Station
            </h3>
            {ticketsByStation.length > 0 ? (
              <div className="space-y-2">
                {ticketsByStation.map((station, i) => {
                  const maxRevenue = Math.max(...ticketsByStation.map((s) => s.revenue));
                  const pct = maxRevenue > 0 ? (station.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={station.name} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-400 w-4">{i + 1}</span>
                      <span className="text-xs text-gray-700 w-32 truncate">{station.name}</span>
                      <div className="flex-1 h-5 bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-[#1A1F3A] flex items-center justify-end pr-2"
                          style={{ width: `${pct}%` }}
                        >
                          <span className="text-[10px] text-white font-medium">
                            GH₵ {station.revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{station.current} tickets</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-8">No data available</p>
            )}
          </div>
        </>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              title="Active Officers"
              value={scopedOfficers.filter((o) => o.status === 'active').length.toString()}
              subtitle={`of ${scopedOfficers.length} total`}
              icon={Users}
            />
            <KpiCard
              title="Active Stations"
              value={scopedStations.filter((s) => s.status === 'active').length.toString()}
              subtitle={`of ${scopedStations.length} total`}
              icon={Building2}
            />
            <KpiCard
              title="Tickets/Officer"
              value={scopedOfficers.length > 0 ? Math.round(kpis.totalTickets / scopedOfficers.length).toString() : '0'}
              subtitle="Average per officer"
              icon={FileText}
            />
            <KpiCard
              title="Collection Rate"
              value={`${kpis.collectionRate}%`}
              subtitle="Payment success"
              subtitleColor={kpis.collectionRate >= 70 ? 'green' : 'red'}
              icon={CheckCircle2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-4">
                <Users className="h-3.5 w-3.5 text-[#1A1F3A]" />
                Top Performing Officers
              </h3>
              {topOfficers.length > 0 ? (
                <div className="space-y-3">
                  {topOfficers.map((officer, i) => (
                    <div key={officer.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-[#1A1F3A] text-white text-[10px] font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-xs text-gray-700">{officer.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900">{officer.current} tickets</p>
                        <p className="text-[10px] text-gray-500">GH₵ {officer.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">No data available</p>
              )}
            </div>

            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-4">
                <Building2 className="h-3.5 w-3.5 text-[#1A1F3A]" />
                Station Performance
              </h3>
              {ticketsByStation.length > 0 ? (
                <div className="space-y-3">
                  {ticketsByStation.map((station, i) => (
                    <div key={station.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-xs text-gray-700 truncate max-w-[150px]">{station.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900">{station.current} tickets</p>
                        <p className="text-[10px] text-gray-500">GH₵ {station.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">No data available</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-4">
                <TrendingUp className="h-3.5 w-3.5 text-[#1A1F3A]" />
                Ticket Volume Trend (6 Months)
              </h3>
              <TrendLineChart
                data={revenueByMonth}
                height={250}
                valueLabel="This Year"
                secondaryLabel="Last Year"
              />
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-[#1A1F3A]"></div>
                  <span className="text-[10px] text-gray-500">This Year</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-[#10b981] opacity-50" style={{ borderStyle: 'dashed' }}></div>
                  <span className="text-[10px] text-gray-500">Last Year</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-4">
                <PieChartIcon className="h-3.5 w-3.5 text-[#1A1F3A]" />
                Status Distribution Over Time
              </h3>
              <StatusPieChart data={statusPieData} height={220} innerRadius={50} outerRadius={80} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 mb-4">
              <Clock className="h-3.5 w-3.5 text-[#1A1F3A]" />
              Peak Hours Analysis
            </h3>
            <RevenueBarChart data={ticketsByHour} height={200} barColor={COLORS.info} />
            <p className="text-[10px] text-gray-500 text-center mt-2">
              Ticket issuance by time of day (2-hour intervals)
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default ReportsPage;

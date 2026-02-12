import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface RevenueBarChartProps {
  data: Array<{
    label: string;
    revenue: number;
    count?: number;
  }>;
  height?: number;
  barColor?: string;
  showGrid?: boolean;
}

const CHART_COLORS = {
  primary: '#1A1F3A',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export function RevenueBarChart({
  data,
  height = 200,
  barColor = CHART_COLORS.primary,
  showGrid = true,
}: RevenueBarChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `₵${(value / 1000).toFixed(1)}k`;
    }
    return `₵${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { count?: number } }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white px-3 py-2 text-xs shadow-lg">
          <p className="font-semibold">{label}</p>
          <p>Revenue: GH₵ {payload[0].value.toLocaleString()}</p>
          {payload[0].payload.count !== undefined && (
            <p>Tickets: {payload[0].payload.count}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        )}
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#6b7280' }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#6b7280' }}
          tickFormatter={formatCurrency}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={barColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

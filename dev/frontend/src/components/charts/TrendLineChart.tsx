import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

export interface TrendLineChartProps {
  data: Array<{
    label: string;
    value: number;
    secondaryValue?: number;
  }>;
  height?: number;
  lineColor?: string;
  secondaryColor?: string;
  showArea?: boolean;
  showGrid?: boolean;
  valueLabel?: string;
  secondaryLabel?: string;
}

const CHART_COLORS = {
  primary: '#1A1F3A',
  secondary: '#10b981',
};

export function TrendLineChart({
  data,
  height = 200,
  lineColor = CHART_COLORS.primary,
  secondaryColor = CHART_COLORS.secondary,
  showArea = true,
  showGrid = true,
  valueLabel = 'Value',
  secondaryLabel = 'Secondary',
}: TrendLineChartProps) {
  const hasSecondary = data.some((d) => d.secondaryValue !== undefined);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white px-3 py-2 text-xs shadow-lg">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'value' ? valueLabel : secondaryLabel}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {showArea && (
          <Area
            type="monotone"
            dataKey="value"
            fill={lineColor}
            fillOpacity={0.1}
            stroke="none"
          />
        )}
        
        <Line
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={2}
          dot={{ fill: lineColor, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        
        {hasSecondary && (
          <Line
            type="monotone"
            dataKey="secondaryValue"
            stroke={secondaryColor}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: secondaryColor, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

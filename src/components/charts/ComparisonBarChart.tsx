import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface ComparisonBarChartProps {
  data: Array<{
    name: string;
    current: number;
    previous?: number;
  }>;
  height?: number;
  currentColor?: string;
  previousColor?: string;
  currentLabel?: string;
  previousLabel?: string;
  showGrid?: boolean;
  layout?: 'vertical' | 'horizontal';
}

const CHART_COLORS = {
  primary: '#1A1F3A',
  secondary: '#94a3b8',
};

export function ComparisonBarChart({
  data,
  height = 200,
  currentColor = CHART_COLORS.primary,
  previousColor = CHART_COLORS.secondary,
  currentLabel = 'Current',
  previousLabel = 'Previous',
  showGrid = true,
  layout = 'horizontal',
}: ComparisonBarChartProps) {
  const hasPrevious = data.some((d) => d.previous !== undefined);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; fill: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white px-3 py-2 text-xs shadow-lg">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index}>
              {entry.dataKey === 'current' ? currentLabel : previousLabel}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          )}
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
          {hasPrevious && <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />}
          {hasPrevious && (
            <Bar
              dataKey="previous"
              name={previousLabel}
              fill={previousColor}
              radius={[0, 4, 4, 0]}
              maxBarSize={20}
            />
          )}
          <Bar
            dataKey="current"
            name={currentLabel}
            fill={currentColor}
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        )}
        <XAxis
          dataKey="name"
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        {hasPrevious && <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />}
        {hasPrevious && (
          <Bar
            dataKey="previous"
            name={previousLabel}
            fill={previousColor}
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
        )}
        <Bar
          dataKey="current"
          name={currentLabel}
          fill={currentColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

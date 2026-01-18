import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

export interface StatusPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

export function StatusPieChart({
  data,
  height = 200,
  showLegend = true,
  innerRadius = 40,
  outerRadius = 70,
}: StatusPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
    if (active && payload && payload.length) {
      const percentage = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-gray-900 text-white px-3 py-2 text-xs shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p>{payload[0].value} tickets ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = () => {
    return (
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[10px] text-gray-600">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-xs text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {!showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
      {showLegend && renderLegend()}
    </div>
  );
}

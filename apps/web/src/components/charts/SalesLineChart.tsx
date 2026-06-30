import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatUGX } from '@/lib/currency';

interface SalesData {
  date: string;
  amount: number;
}

interface SalesLineChartProps {
  data: SalesData[];
  title?: string;
}

const formatYAxis = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-blue-600">
          {formatUGX(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function SalesLineChart({ data }: SalesLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="amount"
          name="Sales"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#3b82f6' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

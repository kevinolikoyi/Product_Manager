interface KPIProps {
  title: string;
  value: number | string;
  color?: string;
  trend?: number;
}

export default function KPI({ title, value, color = 'blue', trend }: KPIProps) {
  const trendColor = trend && trend > 0 ? 'text-green-600' : trend && trend < 0 ? 'text-red-600' : 'text-gray-500';
  return (
    <div className={`rounded-lg bg-white p-6 shadow ${color === 'green' ? 'border-green-200 border-2' : color === 'red' ? 'border-red-200 border-2' : ''}`}>
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <p className={`text-sm ${trendColor}`}>
              {trend > 0 ? `+${trend}%` : `${trend}%`} ce mois
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

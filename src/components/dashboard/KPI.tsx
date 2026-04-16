interface KPIProps {
  title: string;
  value: number;
  color?: string;
}

export default function KPI({ title, value, color = 'blue' }: KPIProps) {
  return (
    <div className={`rounded-lg bg-white p-6 shadow`}>
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
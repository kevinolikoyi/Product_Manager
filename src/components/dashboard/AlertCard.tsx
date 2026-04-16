interface AlertCardProps {
  title: string;
  description: string;
  type: 'warning' | 'error' | 'info';
}

export default function AlertCard({ title, description, type }: AlertCardProps) {
  const colors = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[type]}`}>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm">{description}</p>
    </div>
  );
}
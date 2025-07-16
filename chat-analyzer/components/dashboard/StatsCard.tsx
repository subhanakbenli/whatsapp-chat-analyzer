interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string | null;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

export function StatsCard({ title, value, icon, change, changeType = 'neutral' }: StatsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'increase':
        return 'text-green-600 dark:text-green-400';
      case 'decrease':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatValue(value)}
          </p>
          {change && (
            <p className={`text-sm ${getChangeColor(changeType)} mt-1`}>
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-blue-600 dark:text-blue-400">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  text = 'Loading...', 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    purple: 'border-purple-500',
    gray: 'border-gray-500'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <p className={`${textSizes[size]} text-gray-600 dark:text-gray-300 text-center`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  );
}

export function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-4 gap-4 mb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 mb-2">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <ChartSkeleton />
              </div>
            ))}
          </div>

          {/* Large Chart Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
            <ChartSkeleton />
          </div>

          {/* Table Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
            <TableSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="animate-pulse">
        <div className="text-center mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto" />
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full w-1/3" />
          </div>
        </div>

        <div className="flex justify-between mb-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
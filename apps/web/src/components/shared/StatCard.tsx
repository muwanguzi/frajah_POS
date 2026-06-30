import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
  iconColor,
}: StatCardProps) {
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-500'
        : 'text-gray-400';

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
            {trendValue && (
              <div
                className={cn(
                  'flex items-center gap-1 mt-2 text-xs font-medium',
                  trendColor
                )}
              >
                <TrendIcon className="h-3 w-3" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                'p-3 rounded-xl',
                iconColor || 'bg-blue-50'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  iconColor ? 'text-white' : 'text-blue-600'
                )}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

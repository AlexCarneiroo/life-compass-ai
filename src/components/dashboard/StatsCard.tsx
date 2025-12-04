import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  emoji?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'energy';
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  emoji,
  trend, 
  variant = 'default',
  className 
}: StatsCardProps) {
  const gradientClasses = {
    default: 'bg-card',
    primary: 'gradient-primary',
    accent: 'gradient-accent',
    success: 'gradient-success',
    energy: 'gradient-energy',
  };

  const textClasses = {
    default: 'text-foreground',
    primary: 'text-primary-foreground',
    accent: 'text-accent-foreground',
    success: 'text-success-foreground',
    energy: 'text-energy-foreground',
  };

  const isGradient = variant !== 'default';

  return (
    <Card 
      variant={isGradient ? undefined : 'default'}
      className={cn(
        "p-5 card-hover",
        isGradient && gradientClasses[variant],
        isGradient && "shadow-md border-0",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn(
            "text-sm font-medium",
            isGradient ? `${textClasses[variant]} opacity-80` : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            isGradient ? textClasses[variant] : "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-xs",
              isGradient ? `${textClasses[variant]} opacity-70` : "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% vs semana passada</span>
            </div>
          )}
        </div>
        {(Icon || emoji) && (
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
            isGradient 
              ? "bg-white/20" 
              : "bg-muted"
          )}>
            {emoji ? emoji : Icon && <Icon className={cn("w-6 h-6", isGradient ? textClasses[variant] : "text-primary")} />}
          </div>
        )}
      </div>
    </Card>
  );
}

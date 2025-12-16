import { motion } from 'framer-motion';
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
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'energy' | 'blue' | 'orange' | 'pink' | 'cyan' | 'indigo';
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
    primary: 'gradient-primary', // Purple
    accent: 'gradient-accent', // Blue
    success: 'gradient-success', // Green
    energy: 'gradient-energy', // Orange
    blue: 'gradient-blue', // Blue
    orange: 'gradient-orange', // Orange
    pink: 'gradient-pink', // Pink
    cyan: 'gradient-cyan', // Cyan
    indigo: 'gradient-indigo', // Indigo
  };

  const textClasses = {
    default: 'text-foreground',
    primary: 'text-primary-foreground',
    accent: 'text-accent-foreground',
    success: 'text-success-foreground',
    energy: 'text-energy-foreground',
    blue: 'text-blue-foreground',
    orange: 'text-orange-foreground',
    pink: 'text-pink-foreground',
    cyan: 'text-cyan-foreground',
    indigo: 'text-indigo-foreground',
  };

  const isGradient = variant !== 'default';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        variant={isGradient ? undefined : 'default'}
        className={cn(
          "p-3 sm:p-5 card-hover rounded-xl h-full",
          isGradient && gradientClasses[variant],
          isGradient && "shadow-lg border-0",
          className
        )}
      >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
          <p className={cn(
            "text-xs sm:text-sm font-medium truncate",
            isGradient ? `${textClasses[variant]} opacity-80` : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className={cn(
            "text-xl sm:text-3xl font-bold tracking-tight",
            isGradient ? textClasses[variant] : "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-[10px] sm:text-xs truncate",
              isGradient ? `${textClasses[variant]} opacity-70` : "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] sm:text-xs font-medium",
              isGradient 
                ? "text-black/80" 
                : (trend.isPositive ? "text-success" : "text-destructive")
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% vs semana passada</span>
            </div>
          )}
        </div>
        {(Icon || emoji) && (
          <div className={cn(
            "w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-2xl flex-shrink-0",
            isGradient 
              ? "bg-white/20" 
              : "bg-muted"
          )}>
            {emoji ? emoji : Icon && <Icon className={cn("w-4 h-4 sm:w-6 sm:h-6", isGradient ? textClasses[variant] : "text-primary")} />}
          </div>
        )}
      </div>
    </Card>
    </motion.div>
  );
}

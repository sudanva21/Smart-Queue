import { motion } from 'framer-motion';
import { Location, LocationStatus } from '@/contexts/QueueContext';
import { Users, Clock, ChevronRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrowdCardProps {
  location: Location;
  delay: number;
  onClick: () => void;
  isCurrentLocation?: boolean;
}

const statusConfig: Record<LocationStatus, { color: string; bg: string; label: string }> = {
  safe: { color: 'text-status-safe', bg: 'bg-status-safe/10', label: 'Not Crowded' },
  busy: { color: 'text-status-busy', bg: 'bg-status-busy/10', label: 'Moderate' },
  crowded: { color: 'text-status-crowded', bg: 'bg-status-crowded/10', label: 'Very Crowded' },
};

const typeIcons: Record<string, string> = {
  canteen: '🍽️',
  library: '📚',
  office: '🏢',
  cafe: '☕',
};

export const CrowdCard = ({ location, delay, onClick, isCurrentLocation }: CrowdCardProps) => {
  const config = statusConfig[location.status];
  const occupancyPercent = Math.round((location.currentOccupancy / location.maxCapacity) * 100);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full bg-card rounded-2xl p-5 shadow-card border transition-colors text-left",
        isCurrentLocation
          ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10"
          : "border-border/50 hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{typeIcons[location.type] || '📍'}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-foreground">{location.name}</h3>
              {isCurrentLocation && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  You're here
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{location.currentOccupancy}/{location.maxCapacity}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{location.avgWaitTime} min wait</span>
              </div>
            </div>
          </div>
        </div>
        {!isCurrentLocation && (
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
          <span className="text-xs text-muted-foreground">{occupancyPercent}% full</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${occupancyPercent}%` }}
            transition={{ delay: delay * 0.1 + 0.2, duration: 0.5 }}
            className={cn(
              "h-full rounded-full",
              location.status === 'safe' && 'bg-status-safe',
              location.status === 'busy' && 'bg-status-busy',
              location.status === 'crowded' && 'bg-status-crowded'
            )}
          />
        </div>
      </div>
    </motion.button>
  );
};

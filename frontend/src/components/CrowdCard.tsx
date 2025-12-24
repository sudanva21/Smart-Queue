import { motion } from 'framer-motion';
import { Clock, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Location } from '@/contexts/QueueContext';
import { Badge } from '@/components/ui/badge';

interface CrowdCardProps {
  location: Location;
  onClick?: () => void;
  delay?: number;
}

const statusConfig = {
  safe: {
    label: 'Safe',
    bgClass: 'bg-status-safe-bg',
    textClass: 'text-status-safe',
    barClass: 'bg-status-safe',
  },
  busy: {
    label: 'Busy',
    bgClass: 'bg-status-busy-bg',
    textClass: 'text-status-busy',
    barClass: 'bg-status-busy',
  },
  crowded: {
    label: 'Crowded',
    bgClass: 'bg-status-crowded-bg',
    textClass: 'text-status-crowded',
    barClass: 'bg-status-crowded',
  },
};

const typeIcons = {
  canteen: '🍽️',
  library: '📚',
  office: '🏢',
  cafe: '☕',
};

export const CrowdCard = ({ location, onClick, delay = 0 }: CrowdCardProps) => {
  const occupancyPercent = Math.round((location.currentOccupancy / location.maxCapacity) * 100);
  const config = statusConfig[location.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-card rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer border border-border/50"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{typeIcons[location.type]}</span>
          <div>
            <h3 className="font-display font-medium text-foreground">{location.name}</h3>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="h-3 w-3" />
              <span>Campus Zone {location.id}</span>
            </div>
          </div>
        </div>
        <Badge 
          className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full border-0",
            config.bgClass,
            config.textClass
          )}
        >
          {config.label}
        </Badge>
      </div>

      {/* Occupancy Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            Occupancy
          </span>
          <span className={cn("text-sm font-semibold", config.textClass)}>
            {occupancyPercent}%
          </span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", config.barClass)}
            initial={{ width: 0 }}
            animate={{ width: `${occupancyPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: delay * 0.1 + 0.2 }}
          />
        </div>
      </div>

      {/* Wait Time */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-sm text-muted-foreground">Est. wait time</span>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" />
          <motion.span 
            key={location.avgWaitTime}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-display font-semibold text-foreground"
          >
            {location.avgWaitTime} mins
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
};

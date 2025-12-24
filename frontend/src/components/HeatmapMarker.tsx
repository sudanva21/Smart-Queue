import { motion } from 'framer-motion';
import { Location, LocationStatus } from '@/contexts/QueueContext';
import { cn } from '@/lib/utils';

interface HeatmapMarkerProps {
  location: Location;
  onClick: () => void;
}

const statusColors: Record<LocationStatus, string> = {
  safe: 'bg-status-safe',
  busy: 'bg-status-busy',
  crowded: 'bg-status-crowded',
};

const pulseColors: Record<LocationStatus, string> = {
  safe: 'bg-status-safe/40',
  busy: 'bg-status-busy/40',
  crowded: 'bg-status-crowded/40',
};

export const HeatmapMarker = ({ location, onClick }: HeatmapMarkerProps) => {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 focus:outline-none"
      style={{ left: `${location.position.x}%`, top: `${location.position.y}%` }}
    >
      {/* Outer pulse */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full",
          pulseColors[location.status]
        )}
        animate={{
          scale: [1, 2, 1],
          opacity: [0.7, 0, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ width: 48, height: 48, marginLeft: -12, marginTop: -12 }}
      />
      
      {/* Middle pulse */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full",
          pulseColors[location.status]
        )}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0.2, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
        style={{ width: 36, height: 36, marginLeft: -6, marginTop: -6 }}
      />

      {/* Core dot */}
      <div
        className={cn(
          "relative w-6 h-6 rounded-full shadow-lg flex items-center justify-center",
          statusColors[location.status]
        )}
      >
        <span className="text-xs text-primary-foreground font-bold">
          {Math.round((location.currentOccupancy / location.maxCapacity) * 100)}
        </span>
      </div>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-md whitespace-nowrap text-xs font-medium text-foreground border border-border/50"
      >
        {location.name}
      </motion.div>
    </motion.button>
  );
};

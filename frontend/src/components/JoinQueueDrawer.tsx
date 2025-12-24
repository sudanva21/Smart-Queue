import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Location, useQueue } from '@/contexts/QueueContext';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface JoinQueueDrawerProps {
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  safe: {
    label: 'Safe',
    bgClass: 'bg-status-safe-bg',
    textClass: 'text-status-safe',
  },
  busy: {
    label: 'Busy',
    bgClass: 'bg-status-busy-bg',
    textClass: 'text-status-busy',
  },
  crowded: {
    label: 'Crowded',
    bgClass: 'bg-status-crowded-bg',
    textClass: 'text-status-crowded',
  },
};

const typeIcons: Record<string, string> = {
  canteen: '🍽️',
  library: '📚',
  office: '🏢',
  cafe: '☕',
};

export const JoinQueueDrawer = ({ location, open, onOpenChange }: JoinQueueDrawerProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const { joinQueue, isUserAtLocation, userLocation } = useQueue();
  const navigate = useNavigate();

  if (!location) return null;

  const config = statusConfig[location.status];
  const occupancyPercent = Math.round((location.currentOccupancy / location.maxCapacity) * 100);
  const isAtThisLocation = isUserAtLocation(location.id);
  const isAtAnyLocation = !!userLocation;

  const handleJoinQueue = async () => {
    if (isAtThisLocation) {
      toast.error('You are already at this location');
      return;
    }
    if (isAtAnyLocation) {
      toast.error(`Exit ${userLocation?.name} first before joining another queue`);
      return;
    }

    setIsJoining(true);
    try {
      await joinQueue(location.id);
      toast.success('Joined queue successfully!');
      onOpenChange(false);
      navigate('/tickets');
    } catch (error: any) {
      console.error('Failed to join queue:', error);
      toast.error(error.message || 'Failed to join queue');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{typeIcons[location.type] || '📍'}</span>
            <div>
              <DrawerTitle className="font-display text-xl">{location.name}</DrawerTitle>
              <DrawerDescription className="flex items-center gap-1">
                <span className={cn("w-2 h-2 rounded-full",
                  location.status === 'safe' && 'bg-status-safe',
                  location.status === 'busy' && 'bg-status-busy',
                  location.status === 'crowded' && 'bg-status-crowded'
                )} />
                {config.label}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 space-y-4">
          {/* Warning if at another location */}
          {isAtAnyLocation && !isAtThisLocation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Exit {userLocation?.name} first
                </p>
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary rounded-2xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Current Crowd</span>
              </div>
              <p className="font-display text-xl font-bold text-foreground">
                {location.currentOccupancy}/{location.maxCapacity}
              </p>
              <p className="text-xs text-muted-foreground">{occupancyPercent}% capacity</p>
            </div>
            <div className="bg-secondary rounded-2xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Wait Time</span>
              </div>
              <p className="font-display text-xl font-bold text-foreground">
                {location.avgWaitTime} min
              </p>
              <p className="text-xs text-muted-foreground">estimated</p>
            </div>
          </div>

          {/* Capacity Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Capacity</span>
              <span className={cn("text-sm font-medium", config.textClass)}>{config.label}</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${occupancyPercent}%` }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "h-full rounded-full",
                  location.status === 'safe' && 'bg-status-safe',
                  location.status === 'busy' && 'bg-status-busy',
                  location.status === 'crowded' && 'bg-status-crowded'
                )}
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-accent/50 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Virtual Queue:</strong> Join the queue now and get notified when it's your turn.
              No need to wait in line!
            </p>
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={handleJoinQueue}
            disabled={isJoining || isAtThisLocation || isAtAnyLocation}
            className="w-full h-14 text-base font-medium rounded-2xl"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Joining...
              </>
            ) : isAtThisLocation ? (
              "You're already here"
            ) : isAtAnyLocation ? (
              "Exit current location first"
            ) : (
              "Join Virtual Queue"
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full rounded-2xl">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

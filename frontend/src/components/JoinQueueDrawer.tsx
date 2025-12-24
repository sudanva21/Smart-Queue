import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, MapPin, Loader2 } from 'lucide-react';
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

const typeIcons = {
  canteen: '🍽️',
  library: '📚',
  office: '🏢',
  cafe: '☕',
};

export const JoinQueueDrawer = ({ location, open, onOpenChange }: JoinQueueDrawerProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const { joinQueue } = useQueue();
  const navigate = useNavigate();

  if (!location) return null;

  const config = statusConfig[location.status];
  const occupancyPercent = Math.round((location.currentOccupancy / location.maxCapacity) * 100);

  const handleJoinQueue = async () => {
    setIsJoining(true);
    try {
      await joinQueue(location.id);
      onOpenChange(false);
      navigate('/tickets');
    } catch (error) {
      console.error('Failed to join queue:', error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{typeIcons[location.type]}</span>
            <div>
              <DrawerTitle className="font-display text-xl">{location.name}</DrawerTitle>
              <DrawerDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Campus Zone {location.id}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-4">
          {/* Status Badge */}
          <div className={cn(
            "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mb-4",
            config.bgClass,
            config.textClass
          )}>
            {config.label} • {occupancyPercent}% Full
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">Current</span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">
                {location.currentOccupancy}
                <span className="text-muted-foreground text-base font-normal">/{location.maxCapacity}</span>
              </p>
            </div>
            <div className="bg-secondary/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Wait Time</span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">
                {location.avgWaitTime}
                <span className="text-muted-foreground text-base font-normal"> mins</span>
              </p>
            </div>
          </div>

          {/* Info Text */}
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Join the virtual queue and get notified when it's your turn. No need to wait in line!
          </p>
        </div>

        <DrawerFooter className="pt-2">
          <Button
            onClick={handleJoinQueue}
            disabled={isJoining}
            className="w-full h-12 text-base font-medium rounded-2xl gradient-hero"
          >
            <AnimatePresence mode="wait">
              {isJoining ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Joining Queue...
                </motion.div>
              ) : (
                <motion.span
                  key="join"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Join Virtual Queue
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full h-12 rounded-2xl">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

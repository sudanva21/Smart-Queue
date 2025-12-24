import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ZapOff } from 'lucide-react';
import { useQueue } from '@/contexts/QueueContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const DemoModeToggle = () => {
  const { demoMode, setDemoMode } = useQueue();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-24 right-4 z-50"
    >
      <Button
        onClick={() => setDemoMode(!demoMode)}
        size="sm"
        className={cn(
          "rounded-full px-4 py-2 shadow-lg transition-all duration-300 font-medium",
          demoMode 
            ? "gradient-hero text-primary-foreground shadow-glow" 
            : "bg-muted text-muted-foreground hover:bg-secondary"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={demoMode ? 'on' : 'off'}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {demoMode ? (
              <>
                <Zap className="h-4 w-4" />
                <span>Live Demo</span>
              </>
            ) : (
              <>
                <ZapOff className="h-4 w-4" />
                <span>Demo Mode</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </Button>
    </motion.div>
  );
};

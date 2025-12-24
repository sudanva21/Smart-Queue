import { motion } from 'framer-motion';
import { Clock, TrendingDown } from 'lucide-react';
import { useQueue } from '@/contexts/QueueContext';
import { CrowdCard } from '@/components/CrowdCard';
import { AISuggestionBanner } from '@/components/AISuggestionBanner';
import { JoinQueueDrawer } from '@/components/JoinQueueDrawer';
import { useState } from 'react';
import { Location } from '@/contexts/QueueContext';

const Dashboard = () => {
  const { locations, demoMode } = useQueue();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const totalTimeSaved = locations.reduce((acc, loc) => {
    if (loc.status === 'safe') return acc + loc.avgWaitTime;
    return acc;
  }, 0);

  const handleCardClick = (location: Location) => {
    setSelectedLocation(location);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">SmartQueue</h1>
              <p className="text-sm text-muted-foreground">Campus Crowd Optimizer</p>
            </div>
            {demoMode && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
              >
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Live Data
              </motion.div>
            )}
          </motion.div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Quick Status */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 shadow-card border border-border/50"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent rounded-2xl">
              <TrendingDown className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Today's potential savings</p>
              <motion.p 
                key={totalTimeSaved}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="font-display text-2xl font-bold text-foreground"
              >
                You could save{' '}
                <span className="text-primary">{Math.max(15, totalTimeSaved)} minutes</span>{' '}
                today
              </motion.p>
            </div>
          </div>
        </motion.section>

        {/* AI Suggestion */}
        <AISuggestionBanner />

        {/* Live Crowd Cards */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Live Crowds</h2>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              <span>Updated just now</span>
            </div>
          </div>

          <div className="space-y-4">
            {locations.slice(0, 3).map((location, index) => (
              <CrowdCard
                key={location.id}
                location={location}
                delay={index}
                onClick={() => handleCardClick(location)}
              />
            ))}
          </div>
        </section>
      </main>

      <JoinQueueDrawer
        location={selectedLocation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};

export default Dashboard;

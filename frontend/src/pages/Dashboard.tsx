import { motion } from 'framer-motion';
import { Clock, TrendingDown, MapPin, LogOut, Loader2 } from 'lucide-react';
import { useQueue } from '@/contexts/QueueContext';
import { CrowdCard } from '@/components/CrowdCard';
import { AISuggestionBanner } from '@/components/AISuggestionBanner';
import { JoinQueueDrawer } from '@/components/JoinQueueDrawer';
import { useState } from 'react';
import { Location } from '@/contexts/QueueContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Dashboard = () => {
  const { locations, demoMode, userLocation, isLoading, exitLocation, isUserAtLocation } = useQueue();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const totalTimeSaved = locations.reduce((acc, loc) => {
    if (loc.status === 'safe') return acc + loc.avgWaitTime;
    return acc;
  }, 0);

  const handleCardClick = (location: Location) => {
    // Don't open drawer if user is already at this location
    if (isUserAtLocation(location.id)) {
      toast.info('You are already at this location');
      return;
    }
    setSelectedLocation(location);
    setDrawerOpen(true);
  };

  const handleExit = async () => {
    setIsExiting(true);
    try {
      await exitLocation();
      toast.success('Successfully checked out!');
    } catch (error) {
      console.error('Error exiting:', error);
      toast.error('Failed to check out');
    } finally {
      setIsExiting(false);
    }
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
            <div className="flex items-center gap-2">
              {demoMode && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                >
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Demo
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* User's Current Location - with Exit Button */}
        {userLocation && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/80">You're currently at</p>
                <p className="font-display text-xl font-bold text-white">{userLocation.name}</p>
              </div>
              <Button
                onClick={handleExit}
                disabled={isExiting}
                className="rounded-full bg-white/20 hover:bg-white/30 text-white border-0 px-6"
              >
                {isExiting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Exit
                  </>
                )}
              </Button>
            </div>
          </motion.section>
        )}

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
              <span>Real-time</span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-5 animate-pulse">
                  <div className="h-6 bg-secondary rounded w-1/3 mb-2" />
                  <div className="h-4 bg-secondary rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : locations.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center border border-border/50">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No locations available yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Admin needs to add locations first.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location, index) => (
                <CrowdCard
                  key={location.id}
                  location={location}
                  delay={index}
                  onClick={() => handleCardClick(location)}
                  isCurrentLocation={isUserAtLocation(location.id)}
                />
              ))}
            </div>
          )}
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

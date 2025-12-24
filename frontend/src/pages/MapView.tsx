import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Layers } from 'lucide-react';
import { useQueue, Location } from '@/contexts/QueueContext';
import { HeatmapMarker } from '@/components/HeatmapMarker';
import { JoinQueueDrawer } from '@/components/JoinQueueDrawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MapView = () => {
  const { locations, demoMode } = useQueue();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMarkerClick = (location: Location) => {
    setSelectedLocation(location);
    setDrawerOpen(true);
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-xl font-bold text-foreground mb-3">Campus Map</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-2xl bg-secondary/50 border-0"
              />
            </div>
          </motion.div>
        </div>
      </header>

      <main className="px-4 py-4">
        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4 mb-4"
        >
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-status-safe" />
            <span className="text-xs text-muted-foreground">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-status-busy" />
            <span className="text-xs text-muted-foreground">Busy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-status-crowded" />
            <span className="text-xs text-muted-foreground">Crowded</span>
          </div>
        </motion.div>

        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative bg-card rounded-3xl overflow-hidden shadow-card border border-border/50"
          style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
        >
          {/* Grid Background */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />

          {/* Campus outline */}
          <div className="absolute inset-4 border-2 border-dashed border-border/50 rounded-2xl" />

          {/* Building placeholders */}
          <div className="absolute top-[15%] left-[20%] w-16 h-20 bg-secondary/50 rounded-lg border border-border/30" />
          <div className="absolute top-[20%] right-[25%] w-24 h-16 bg-secondary/50 rounded-lg border border-border/30" />
          <div className="absolute bottom-[25%] left-[15%] w-20 h-14 bg-secondary/50 rounded-lg border border-border/30" />
          <div className="absolute bottom-[30%] right-[20%] w-16 h-20 bg-secondary/50 rounded-lg border border-border/30" />
          <div className="absolute top-[50%] left-[40%] w-28 h-12 bg-secondary/50 rounded-lg border border-border/30" />

          {/* Heatmap Markers */}
          {filteredLocations.map(location => (
            <HeatmapMarker
              key={location.id}
              location={location}
              onClick={() => handleMarkerClick(location)}
            />
          ))}

          {/* Demo Mode Indicator */}
          {demoMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-medium shadow-lg"
            >
              <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
              Simulating Live Data
            </motion.div>
          )}
        </motion.div>

        {/* Layer Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <Button 
            variant="secondary" 
            className="w-full h-12 rounded-2xl font-medium"
          >
            <Layers className="h-4 w-4 mr-2" />
            Toggle Heatmap Layers
          </Button>
        </motion.div>
      </main>

      <JoinQueueDrawer
        location={selectedLocation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};

export default MapView;

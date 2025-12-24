import { motion } from 'framer-motion';
import { Clock, MapPin, X, QrCode } from 'lucide-react';
import { Ticket } from '@/contexts/QueueContext';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface VirtualTicketProps {
  ticket: Ticket;
  onCancel: () => void;
}

export const VirtualTicket = ({ ticket, onCancel }: VirtualTicketProps) => {
  const [timeRemaining, setTimeRemaining] = useState(ticket.estimatedTime * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="relative bg-card rounded-3xl overflow-hidden shadow-xl border border-border"
    >
      {/* Header */}
      <div className="gradient-hero p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-foreground/80">Virtual Queue Ticket</p>
            <h3 className="font-display font-bold text-lg">{ticket.locationName}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Ticket Body */}
      <div className="p-5">
        {/* Position & Time */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="text-center p-4 bg-accent rounded-2xl">
            <p className="text-xs text-muted-foreground mb-1">Your Position</p>
            <motion.p
              key={ticket.positionInLine}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="font-display text-3xl font-bold text-primary"
            >
              #{ticket.positionInLine}
            </motion.p>
          </div>
          <div className="text-center p-4 bg-accent rounded-2xl">
            <p className="text-xs text-muted-foreground mb-1">Time to Service</p>
            <motion.p
              key={timeRemaining}
              className="font-display text-3xl font-bold text-foreground tabular-nums"
            >
              {formatTime(timeRemaining)}
            </motion.p>
          </div>
        </div>

        {/* QR Code Placeholder */}
        <div className="flex flex-col items-center py-4 border-t border-dashed border-border">
          <div className="w-32 h-32 bg-foreground/5 rounded-xl flex items-center justify-center mb-3 relative overflow-hidden">
            <div className="absolute inset-2 grid grid-cols-5 gap-1">
              {Array.from({ length: 25 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: Math.random() > 0.3 ? 1 : 0.2 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-foreground rounded-sm"
                />
              ))}
            </div>
            <QrCode className="h-8 w-8 text-foreground/20 absolute" />
          </div>
          <p className="text-xs text-muted-foreground font-mono">{ticket.id}</p>
        </div>

        {/* Details */}
        <div className="flex items-center justify-center gap-4 pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>Campus Zone</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{new Date(ticket.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Decorative edges */}
      <div className="absolute left-0 top-1/2 w-4 h-8 bg-background rounded-r-full -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute right-0 top-1/2 w-4 h-8 bg-background rounded-l-full -translate-y-1/2 translate-x-1/2" />
    </motion.div>
  );
};

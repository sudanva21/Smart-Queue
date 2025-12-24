import { motion, AnimatePresence } from 'framer-motion';
import { Ticket as TicketIcon, Clock, AlertCircle } from 'lucide-react';
import { useQueue } from '@/contexts/QueueContext';
import { VirtualTicket } from '@/components/VirtualTicket';

const MyTickets = () => {
  const { tickets, cancelTicket } = useQueue();

  const activeTickets = tickets.filter(t => t.status === 'active');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-xl font-bold text-foreground">My Tickets</h1>
            <p className="text-sm text-muted-foreground">
              {activeTickets.length} active {activeTickets.length === 1 ? 'ticket' : 'tickets'}
            </p>
          </motion.div>
        </div>
      </header>

      <main className="px-4 py-6">
        <AnimatePresence mode="popLayout">
          {activeTickets.length > 0 ? (
            <motion.div layout className="space-y-4">
              {activeTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <VirtualTicket
                    ticket={ticket}
                    onCancel={() => cancelTicket(ticket.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="p-6 bg-secondary/50 rounded-full mb-6">
                <TicketIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                No Active Tickets
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-6">
                Join a virtual queue from the Home or Map tab to get your digital ticket
              </p>

              <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-2xl max-w-xs">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Quick Tip</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Virtual tickets save you time by holding your spot in line while you're elsewhere on campus.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Past Tickets Section */}
        {tickets.length > activeTickets.length && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <h2 className="font-display font-semibold text-foreground mb-4">Past Tickets</h2>
            <div className="space-y-3">
              {tickets
                .filter(t => t.status !== 'active')
                .map(ticket => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary rounded-xl">
                        <TicketIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{ticket.locationName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{ticket.estimatedTime} mins</span>
                    </div>
                  </div>
                ))}
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
};

export default MyTickets;

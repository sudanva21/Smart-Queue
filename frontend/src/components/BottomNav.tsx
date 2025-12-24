import { Home, Map, Ticket, User, QrCode } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Map, label: 'Map', path: '/map' },
  { icon: QrCode, label: 'Scan', path: '/scan', isCenter: true },
  { icon: Ticket, label: 'Tickets', path: '/tickets' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto">
      <div className="bg-card/95 backdrop-blur-xl border-t border-border/50 px-4 py-2 shadow-lg">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            if (item.isCenter) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative -mt-6"
                >
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                      "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                  </motion.div>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <item.icon className="h-5 w-5" />
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

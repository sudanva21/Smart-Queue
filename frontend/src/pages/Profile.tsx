import { motion } from 'framer-motion';
import { User, Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueue } from '@/contexts/QueueContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const Profile = () => {
  const { tickets } = useQueue();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({ totalTimeSaved: 0, totalQueuesJoined: 0 });
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Real-time user stats from Firestore
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserStats({
          totalTimeSaved: data.totalTimeSaved || 0,
          totalQueuesJoined: data.totalQueuesJoined || 0,
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const menuItems = [
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Shield, label: 'Privacy Settings', path: '/privacy' },
    { icon: HelpCircle, label: 'Help & Support', path: '/help' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="gradient-hero pt-8 pb-16 px-4 rounded-b-3xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-20 h-20 rounded-full mx-auto mb-4 ring-4 ring-white/30 object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center ring-4 ring-white/30">
              <User className="h-10 w-10 text-primary-foreground" />
            </div>
          )}
          <h1 className="font-display text-xl font-bold text-primary-foreground">
            {user?.displayName || 'Student User'}
          </h1>
          <p className="text-sm text-primary-foreground/80">
            {user?.email || 'student@campus.edu'}
          </p>
        </motion.div>
      </header>

      <main className="px-4 -mt-8">
        {/* Stats Cards - Real-time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Time Saved</span>
            </div>
            <motion.p
              key={userStats.totalTimeSaved}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="font-display text-2xl font-bold text-foreground"
            >
              {userStats.totalTimeSaved} mins
            </motion.p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Queues Joined</span>
            </div>
            <motion.p
              key={userStats.totalQueuesJoined}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="font-display text-2xl font-bold text-foreground"
            >
              {userStats.totalQueuesJoined}
            </motion.p>
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
        >
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-xl">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">{item.label}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        {/* Settings Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <Button
            variant="secondary"
            onClick={() => navigate('/settings')}
            className="w-full h-12 rounded-2xl font-medium justify-start px-4"
          >
            <Settings className="h-5 w-5 mr-3" />
            App Settings
            <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground" />
          </Button>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <Button
            variant="ghost"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full h-12 rounded-2xl font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 mr-3" />
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 text-xs text-muted-foreground"
        >
          <p>SmartQueue v1.0.0</p>
          <p className="mt-1">Campus Crowd Optimization Tool</p>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;

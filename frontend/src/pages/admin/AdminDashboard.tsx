import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQueue } from '@/contexts/QueueContext';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    MapPin,
    QrCode,
    Users,
    LogOut,
    TrendingUp,
    Clock,
    Activity
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { locations } = useQueue();
    const [activeCheckins, setActiveCheckins] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);

    // Real-time stats
    useEffect(() => {
        // Active check-ins
        const checkinsRef = collection(db, 'checkins');
        const activeQuery = query(checkinsRef, where('status', '==', 'active'));
        const unsubCheckins = onSnapshot(activeQuery, (snapshot) => {
            setActiveCheckins(snapshot.size);
        });

        // Total users
        const usersRef = collection(db, 'users');
        const unsubUsers = onSnapshot(usersRef, (snapshot) => {
            setTotalUsers(snapshot.size);
        });

        return () => {
            unsubCheckins();
            unsubUsers();
        };
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/admin/login', { replace: true });
    };

    const totalOccupancy = locations.reduce((sum, loc) => sum + loc.currentOccupancy, 0);
    const avgOccupancyPercent = locations.length > 0
        ? Math.round(locations.reduce((sum, loc) => sum + (loc.currentOccupancy / loc.maxCapacity * 100), 0) / locations.length)
        : 0;

    const stats = [
        { label: 'Active Check-ins', value: activeCheckins, icon: Activity, color: 'text-green-500' },
        { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-blue-500' },
        { label: 'Campus Occupancy', value: totalOccupancy, icon: TrendingUp, color: 'text-orange-500' },
        { label: 'Avg. Capacity', value: `${avgOccupancyPercent}%`, icon: Clock, color: 'text-purple-500' },
    ];

    const menuItems = [
        { icon: MapPin, label: 'Manage Locations', description: 'Add, edit, delete locations', path: '/admin/locations' },
        { icon: QrCode, label: 'QR Codes', description: 'Generate and manage QR codes', path: '/admin/qrcodes' },
        { icon: Users, label: 'Users', description: 'View registered users', path: '/admin/users' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <header className="bg-slate-900 text-white px-4 py-6">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <LayoutDashboard className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="font-display text-xl font-bold">Admin Dashboard</h1>
                            <p className="text-sm text-white/70">{user?.email}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSignOut}
                        className="text-white hover:bg-white/10"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </motion.div>
            </header>

            <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-4"
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                <span className="text-xs text-muted-foreground">{stat.label}</span>
                            </div>
                            <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Location Status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="font-medium text-foreground">Location Status</h2>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {locations.map((location) => {
                            const percent = Math.round((location.currentOccupancy / location.maxCapacity) * 100);
                            return (
                                <div key={location.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">{location.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {location.currentOccupancy} / {location.maxCapacity}
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${location.status === 'safe' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            location.status === 'busy' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {percent}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                >
                    <h2 className="font-medium text-foreground">Quick Actions</h2>
                    {menuItems.map((item) => (
                        <Button
                            key={item.label}
                            variant="outline"
                            onClick={() => navigate(item.path)}
                            className="w-full h-auto py-4 justify-start rounded-2xl border-slate-200 dark:border-slate-700"
                        >
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl mr-3">
                                <item.icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-foreground">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                        </Button>
                    ))}
                </motion.div>
            </main>
        </div>
    );
};

export default AdminDashboard;

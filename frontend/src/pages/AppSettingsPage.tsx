import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Sun, Palette, Trash2, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '@/contexts/QueueContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const AppSettingsPage = () => {
    const navigate = useNavigate();
    const { seedLocations } = useQueue();
    const [darkMode, setDarkMode] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);

    useEffect(() => {
        // Check current theme
        setDarkMode(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        toast.success(`${newMode ? 'Dark' : 'Light'} mode enabled`);
    };

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            await seedLocations();
            toast.success('Location data refreshed!');
        } catch (error) {
            console.error('Error seeding data:', error);
            toast.error('Failed to refresh data');
        } finally {
            setIsSeeding(false);
        }
    };

    const handleClearCache = () => {
        localStorage.clear();
        sessionStorage.clear();
        toast.success('Cache cleared successfully');
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="px-4 py-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3"
                    >
                        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="font-display text-xl font-bold text-foreground">App Settings</h1>
                    </motion.div>
                </div>
            </header>

            <main className="px-4 py-6 space-y-6">
                {/* Appearance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
                >
                    <div className="p-4 border-b border-border/50">
                        <h2 className="font-medium text-foreground">Appearance</h2>
                    </div>
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary rounded-xl">
                                {darkMode ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
                            </div>
                            <div>
                                <p className="font-medium text-foreground">Dark Mode</p>
                                <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                            </div>
                        </div>
                        <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                    </div>
                </motion.div>

                {/* Data Management */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
                >
                    <div className="p-4 border-b border-border/50">
                        <h2 className="font-medium text-foreground">Data Management</h2>
                    </div>
                    <button
                        onClick={handleSeedData}
                        disabled={isSeeding}
                        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors border-b border-border/30"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary rounded-xl">
                                <Database className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-foreground">Refresh Location Data</p>
                                <p className="text-xs text-muted-foreground">Reset locations to default values</p>
                            </div>
                        </div>
                        <RefreshCw className={`h-4 w-4 text-muted-foreground ${isSeeding ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleClearCache}
                        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary rounded-xl">
                                <Trash2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-foreground">Clear Cache</p>
                                <p className="text-xs text-muted-foreground">Clear local storage and cached data</p>
                            </div>
                        </div>
                    </button>
                </motion.div>

                {/* About */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-2xl p-5 shadow-card border border-border/50"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl">
                            <Palette className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-foreground">SmartQueue</h3>
                            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        SmartQueue is a campus crowd optimization tool that helps you save time by providing real-time crowd information and virtual queuing.
                    </p>
                </motion.div>
            </main>
        </div>
    );
};

export default AppSettingsPage;

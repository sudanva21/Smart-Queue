import { motion } from 'framer-motion';
import { ArrowLeft, Bell, BellOff, Clock, Vibrate, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface NotificationSettings {
    enabled: boolean;
    queueUpdates: boolean;
    turnReminders: boolean;
    crowdAlerts: boolean;
    sound: boolean;
    vibration: boolean;
}

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [settings, setSettings] = useState<NotificationSettings>({
        enabled: true,
        queueUpdates: true,
        turnReminders: true,
        crowdAlerts: true,
        sound: true,
        vibration: true,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            if (user) {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        setSettings({
                            enabled: data.notificationsEnabled ?? true,
                            queueUpdates: data.queueUpdates ?? true,
                            turnReminders: data.turnReminders ?? true,
                            crowdAlerts: data.crowdAlerts ?? true,
                            sound: data.soundEnabled ?? true,
                            vibration: data.vibrationEnabled ?? true,
                        });
                    }
                } catch (error) {
                    console.error('Error fetching settings:', error);
                }
            }
            setIsLoading(false);
        };
        fetchSettings();
    }, [user]);

    const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
        setSettings(prev => ({ ...prev, [key]: value }));

        if (user) {
            try {
                const userRef = doc(db, 'users', user.uid);
                const fieldMap: Record<string, string> = {
                    enabled: 'notificationsEnabled',
                    queueUpdates: 'queueUpdates',
                    turnReminders: 'turnReminders',
                    crowdAlerts: 'crowdAlerts',
                    sound: 'soundEnabled',
                    vibration: 'vibrationEnabled',
                };
                await updateDoc(userRef, { [fieldMap[key]]: value });
                toast.success('Settings updated');
            } catch (error) {
                console.error('Error updating settings:', error);
                toast.error('Failed to update settings');
            }
        }
    };

    const notificationOptions = [
        { key: 'queueUpdates' as const, icon: Bell, label: 'Queue Updates', description: 'Get notified when your queue position changes' },
        { key: 'turnReminders' as const, icon: Clock, label: 'Turn Reminders', description: "Alert when it's almost your turn" },
        { key: 'crowdAlerts' as const, icon: BellOff, label: 'Crowd Alerts', description: 'Notify when locations become less crowded' },
    ];

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
                        <h1 className="font-display text-xl font-bold text-foreground">Notifications</h1>
                    </motion.div>
                </div>
            </header>

            <main className="px-4 py-6 space-y-6">
                {/* Master Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl p-5 shadow-card border border-border/50"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Bell className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">Enable Notifications</p>
                                <p className="text-sm text-muted-foreground">Receive all app notifications</p>
                            </div>
                        </div>
                        <Switch
                            checked={settings.enabled}
                            onCheckedChange={(checked) => updateSetting('enabled', checked)}
                            disabled={isLoading}
                        />
                    </div>
                </motion.div>

                {/* Notification Types */}
                {settings.enabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-border/50">
                            <h2 className="font-medium text-foreground">Notification Types</h2>
                        </div>
                        {notificationOptions.map((option) => (
                            <div key={option.key} className="flex items-center justify-between p-4 border-b border-border/30 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-secondary rounded-xl">
                                        <option.icon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{option.label}</p>
                                        <p className="text-xs text-muted-foreground">{option.description}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings[option.key]}
                                    onCheckedChange={(checked) => updateSetting(option.key, checked)}
                                    disabled={isLoading}
                                />
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Sound & Vibration */}
                {settings.enabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-border/50">
                            <h2 className="font-medium text-foreground">Sound & Vibration</h2>
                        </div>
                        <div className="flex items-center justify-between p-4 border-b border-border/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-secondary rounded-xl">
                                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <p className="font-medium text-foreground">Sound</p>
                            </div>
                            <Switch
                                checked={settings.sound}
                                onCheckedChange={(checked) => updateSetting('sound', checked)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-secondary rounded-xl">
                                    <Vibrate className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <p className="font-medium text-foreground">Vibration</p>
                            </div>
                            <Switch
                                checked={settings.vibration}
                                onCheckedChange={(checked) => updateSetting('vibration', checked)}
                                disabled={isLoading}
                            />
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default NotificationsPage;

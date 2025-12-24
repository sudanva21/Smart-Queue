import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, UserX, MapPin, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface PrivacySettings {
    showProfile: boolean;
    shareLocation: boolean;
    shareActivity: boolean;
    anonymousMode: boolean;
}

const PrivacyPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [settings, setSettings] = useState<PrivacySettings>({
        showProfile: true,
        shareLocation: true,
        shareActivity: true,
        anonymousMode: false,
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
                            showProfile: data.showProfile ?? true,
                            shareLocation: data.shareLocation ?? true,
                            shareActivity: data.shareActivity ?? true,
                            anonymousMode: data.anonymousMode ?? false,
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

    const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
        setSettings(prev => ({ ...prev, [key]: value }));

        if (user) {
            try {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { [key]: value });
                toast.success('Privacy settings updated');
            } catch (error) {
                console.error('Error updating settings:', error);
                toast.error('Failed to update settings');
            }
        }
    };

    const privacyOptions = [
        {
            key: 'showProfile' as const,
            icon: Eye,
            label: 'Show Profile',
            description: 'Allow others to see your profile information'
        },
        {
            key: 'shareLocation' as const,
            icon: MapPin,
            label: 'Share Location',
            description: 'Share your current location with the app'
        },
        {
            key: 'shareActivity' as const,
            icon: Activity,
            label: 'Share Activity',
            description: 'Include your activity in campus statistics'
        },
        {
            key: 'anonymousMode' as const,
            icon: UserX,
            label: 'Anonymous Mode',
            description: 'Hide your identity in queue listings'
        },
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
                        <h1 className="font-display text-xl font-bold text-foreground">Privacy Settings</h1>
                    </motion.div>
                </div>
            </header>

            <main className="px-4 py-6 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
                >
                    {privacyOptions.map((option, index) => (
                        <div
                            key={option.key}
                            className={`flex items-center justify-between p-4 ${index !== privacyOptions.length - 1 ? 'border-b border-border/30' : ''}`}
                        >
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

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-accent/50 rounded-2xl"
                >
                    <div className="flex items-start gap-3">
                        <EyeOff className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Your Privacy Matters</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                We only collect data necessary for the app to function. Your personal information is never sold to third parties.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default PrivacyPage;

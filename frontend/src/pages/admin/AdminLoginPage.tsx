import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const AdminLoginPage = () => {
    const { signInWithEmail, user, loading, isAdmin } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !loading) {
            if (isAdmin) {
                navigate('/admin', { replace: true });
            } else {
                toast.error('Access denied. Admin privileges required.');
            }
        }
    }, [user, loading, isAdmin, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please enter email and password');
            return;
        }

        setIsSigningIn(true);
        try {
            await signInWithEmail(email, password);
        } catch (error: any) {
            console.error('Sign in failed:', error);
            toast.error(error.message || 'Invalid credentials');
        } finally {
            setIsSigningIn(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Hero Section */}
            <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-6 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-24 h-24 bg-white/10 rounded-3xl mx-auto mb-6 flex items-center justify-center ring-4 ring-white/20 shadow-2xl"
                    >
                        <Shield className="h-12 w-12 text-white" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="font-display text-3xl font-bold text-white mb-2"
                    >
                        Admin Panel
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/70 text-base"
                    >
                        SmartQueue Management
                    </motion.p>
                </motion.div>
            </div>

            {/* Login Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card rounded-t-3xl -mt-6 px-6 py-8 shadow-card"
            >
                <div className="max-w-sm mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@smartqueue.app"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isSigningIn}
                            className="w-full h-14 text-base font-medium rounded-2xl bg-slate-900 hover:bg-slate-800"
                        >
                            {isSigningIn ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In to Admin'
                            )}
                        </Button>
                    </form>

                    <Button
                        variant="ghost"
                        onClick={() => navigate('/login')}
                        className="w-full mt-4 text-muted-foreground"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to User Login
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLoginPage;

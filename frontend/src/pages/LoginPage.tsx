import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

const LoginPage = () => {
    const { signInWithGoogle, user, loading } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !loading) {
            navigate('/', { replace: true });
        }
    }, [user, loading, navigate]);

    const handleGoogleSignIn = async () => {
        setIsSigningIn(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Sign in failed:', error);
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
            <div className="flex-1 gradient-hero flex flex-col items-center justify-center px-6 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-24 h-24 bg-white/20 rounded-3xl mx-auto mb-6 flex items-center justify-center ring-4 ring-white/30 shadow-2xl"
                    >
                        <Users className="h-12 w-12 text-primary-foreground" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="font-display text-4xl font-bold text-primary-foreground mb-3"
                    >
                        SmartQueue
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-primary-foreground/80 text-lg max-w-xs mx-auto"
                    >
                        Campus Crowd Optimizer
                    </motion.p>
                </motion.div>
            </div>

            {/* Login Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card rounded-t-3xl -mt-6 px-6 py-8 shadow-card"
            >
                <div className="max-w-sm mx-auto">
                    <h2 className="font-display text-2xl font-bold text-foreground text-center mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-muted-foreground text-center mb-8">
                        Sign in to skip the lines and save time
                    </p>

                    <Button
                        onClick={handleGoogleSignIn}
                        disabled={isSigningIn}
                        className="w-full h-14 text-base font-medium rounded-2xl bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-sm"
                    >
                        {isSigningIn ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-3" />
                        ) : (
                            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        )}
                        {isSigningIn ? 'Signing in...' : 'Continue with Google'}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-6">
                        By signing in, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;

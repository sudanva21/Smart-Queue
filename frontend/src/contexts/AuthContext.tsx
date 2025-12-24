import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    User,
    signInWithPopup,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // Check if user is admin
                if (firebaseUser.email) {
                    console.log('Checking admin status for:', firebaseUser.email);
                    try {
                        const adminRef = doc(db, 'admins', firebaseUser.email);
                        const adminSnap = await getDoc(adminRef);
                        const adminExists = adminSnap.exists();
                        const adminRole = adminSnap.data()?.role;
                        console.log('Admin doc exists:', adminExists, 'Role:', adminRole);

                        if (adminExists && adminRole === 'admin') {
                            console.log('✅ Admin access granted');
                            setIsAdmin(true);
                        } else {
                            console.log('❌ Not an admin');
                            setIsAdmin(false);
                        }
                    } catch (error) {
                        console.error('Error checking admin status:', error);
                        setIsAdmin(false);
                    }
                }

                // Create/update user document in Firestore
                try {
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            totalTimeSaved: 0,
                            totalQueuesJoined: 0,
                            notificationsEnabled: true,
                            currentLocationId: null,
                            createdAt: new Date(),
                        });
                    }
                } catch (error) {
                    console.error('Error creating user doc:', error);
                }
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Error signing in with email:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, signInWithGoogle, signInWithEmail, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

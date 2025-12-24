import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    QrCode,
    Camera,
    CheckCircle2,
    XCircle,
    MapPin,
    Loader2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    increment,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useQueue } from '@/contexts/QueueContext';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';

type ScanResult = {
    type: 'success' | 'error';
    message: string;
    locationName?: string;
};

const QRScannerPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { userLocation } = useQueue();
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const startScanning = async () => {
        try {
            setScanResult(null);
            setIsScanning(true);

            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode("qr-reader");
            }

            await scannerRef.current.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                handleScan,
                () => { }
            );
        } catch (error) {
            console.error('Error starting scanner:', error);
            toast.error('Could not access camera');
            setIsScanning(false);
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
            } catch (error) {
                console.error('Error stopping scanner:', error);
            }
        }
        setIsScanning(false);
    };

    const handleScan = async (decodedText: string) => {
        await stopScanning();
        setIsProcessing(true);

        try {
            // Parse QR code: smartqueue://scan/{locationId}/entry/{qrCode}
            const match = decodedText.match(/smartqueue:\/\/scan\/([^\/]+)\/entry\/(.+)/);

            if (!match) {
                setScanResult({ type: 'error', message: 'Invalid QR code format' });
                setIsProcessing(false);
                return;
            }

            const [, locationId, qrCode] = match;

            // Check if user is already somewhere else
            if (userLocation) {
                setScanResult({
                    type: 'error',
                    message: `You need to exit ${userLocation.name} first before checking in elsewhere`
                });
                setIsProcessing(false);
                return;
            }

            // Verify QR code matches location
            const locationsSnap = await getDocs(
                query(collection(db, 'locations'), where('__name__', '==', locationId))
            );

            if (locationsSnap.empty) {
                setScanResult({ type: 'error', message: 'Location not found' });
                setIsProcessing(false);
                return;
            }

            const locationData = locationsSnap.docs[0].data();
            const locationName = locationData.name;

            // Verify QR code
            if (qrCode !== locationData.entryQRCode) {
                setScanResult({ type: 'error', message: 'Invalid or expired QR code' });
                setIsProcessing(false);
                return;
            }

            // Check if user already has active check-in at this location
            const activeCheckin = await getDocs(
                query(
                    collection(db, 'checkins'),
                    where('userId', '==', user?.uid),
                    where('locationId', '==', locationId),
                    where('status', '==', 'active')
                )
            );

            if (!activeCheckin.empty) {
                setScanResult({ type: 'error', message: 'You are already checked in here' });
                setIsProcessing(false);
                return;
            }

            // Create check-in record
            await addDoc(collection(db, 'checkins'), {
                userId: user?.uid,
                locationId,
                locationName,
                entryTime: Timestamp.now(),
                exitTime: null,
                status: 'active',
            });

            // Increment location occupancy
            const locationRef = doc(db, 'locations', locationId);
            await updateDoc(locationRef, {
                currentOccupancy: increment(1),
            });

            // Update user's current location
            if (user) {
                await updateDoc(doc(db, 'users', user.uid), {
                    currentLocationId: locationId,
                    currentLocationName: locationName,
                });
            }

            setScanResult({
                type: 'success',
                message: 'Check-in successful!',
                locationName,
            });
        } catch (error) {
            console.error('Error processing scan:', error);
            setScanResult({ type: 'error', message: 'Failed to process scan' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="px-4 py-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3"
                    >
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="font-display text-xl font-bold text-foreground">Scan to Check In</h1>
                            <p className="text-sm text-muted-foreground">Scan entry QR at any location</p>
                        </div>
                    </motion.div>
                </div>
            </header>

            <main className="px-4 py-6 space-y-6">
                {/* Current Location Notice */}
                {userLocation && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-amber-600" />
                            <div>
                                <p className="font-medium text-amber-900 dark:text-amber-100">Already checked in</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    You're at {userLocation.name}. Exit from Dashboard first.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Scanner Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50"
                >
                    <div className="aspect-square relative bg-slate-900">
                        <div id="qr-reader" className="w-full h-full" />

                        {!isScanning && !scanResult && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                <div className="p-6 bg-white/10 rounded-full mb-6">
                                    <QrCode className="h-16 w-16 text-white" />
                                </div>
                                <h2 className="text-xl font-display font-bold text-white mb-2">
                                    Ready to Scan
                                </h2>
                                <p className="text-white/70 text-sm mb-6">
                                    Point your camera at an entry QR code
                                </p>
                                <Button
                                    onClick={startScanning}
                                    className="rounded-full px-8 h-12"
                                    disabled={!!userLocation}
                                >
                                    <Camera className="h-5 w-5 mr-2" />
                                    {userLocation ? 'Exit current location first' : 'Open Camera'}
                                </Button>
                            </div>
                        )}

                        {isScanning && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-64 border-2 border-white/50 rounded-2xl" />
                                </div>
                                <div className="absolute top-4 left-0 right-0 text-center">
                                    <span className="bg-black/50 text-white text-sm px-4 py-2 rounded-full">
                                        Scanning...
                                    </span>
                                </div>
                                <Button
                                    onClick={stopScanning}
                                    variant="secondary"
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full pointer-events-auto"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                <div className="text-center">
                                    <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
                                    <p className="text-white font-medium">Processing...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Result */}
                    {scanResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-6 ${scanResult.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
                        >
                            <div className="flex items-start gap-4">
                                {scanResult.type === 'success' ? (
                                    <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0" />
                                ) : (
                                    <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <p className={`font-medium ${scanResult.type === 'success' ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                                        {scanResult.message}
                                    </p>
                                    {scanResult.locationName && (
                                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            {scanResult.locationName}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <Button onClick={() => setScanResult(null)} variant="outline" className="flex-1 rounded-xl">
                                    Scan Another
                                </Button>
                                <Button onClick={() => navigate('/')} className="flex-1 rounded-xl">
                                    Go Home
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Instructions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-accent/50 rounded-2xl"
                >
                    <h3 className="font-medium text-foreground mb-2">How it works</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">1</span>
                            <span>Scan the QR code when entering a location</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">2</span>
                            <span>When leaving, just tap "Exit" on the Dashboard</span>
                        </li>
                    </ul>
                </motion.div>
            </main>
        </div>
    );
};

export default QRScannerPage;

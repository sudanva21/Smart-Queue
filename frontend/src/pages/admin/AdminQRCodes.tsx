import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, QrCode } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import QRCode from 'qrcode';

interface Location {
    id: string;
    name: string;
    type: string;
    entryQRCode: string;
}

const AdminQRCodes = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [qrImages, setQrImages] = useState<Record<string, string>>({});

    useEffect(() => {
        const locationParam = searchParams.get('location');
        if (locationParam) {
            setSelectedLocation(locationParam);
        }
    }, [searchParams]);

    useEffect(() => {
        const locationsRef = collection(db, 'locations');
        const unsubscribe = onSnapshot(locationsRef, async (snapshot) => {
            const locationData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Location[];
            setLocations(locationData);

            // Generate QR codes for each location (entry only)
            const qrData: Record<string, string> = {};
            for (const loc of locationData) {
                if (loc.entryQRCode) {
                    const entryUrl = `smartqueue://scan/${loc.id}/entry/${loc.entryQRCode}`;

                    try {
                        const entryQR = await QRCode.toDataURL(entryUrl, { width: 250, margin: 2 });
                        qrData[loc.id] = entryQR;
                    } catch (error) {
                        console.error('Error generating QR code:', error);
                    }
                }
            }
            setQrImages(qrData);
        });

        return () => unsubscribe();
    }, []);

    const handleDownload = (locationId: string) => {
        const location = locations.find(l => l.id === locationId);
        const qr = qrImages[locationId];
        if (!qr || !location) return;

        const link = document.createElement('a');
        link.download = `${location.name.replace(/\s+/g, '_')}_Entry_QR.png`;
        link.href = qr;
        link.click();
    };

    const handlePrint = (locationId: string) => {
        const location = locations.find(l => l.id === locationId);
        const qr = qrImages[locationId];
        if (!qr || !location) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>Entry QR - ${location.name}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; text-align: center; }
              .qr-box { display: inline-block; padding: 30px; border: 3px solid #22c55e; border-radius: 24px; }
              .qr-box img { width: 250px; height: 250px; }
              h1 { margin-bottom: 10px; color: #1f2937; }
              h2 { margin: 20px 0 5px; font-size: 24px; color: #22c55e; }
              p { color: #6b7280; margin: 5px 0; }
              .badge { display: inline-block; padding: 8px 20px; background: #22c55e; color: white; border-radius: 50px; font-size: 14px; font-weight: 600; margin-top: 15px; }
              .note { margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 12px; font-size: 14px; color: #4b5563; }
            </style>
          </head>
          <body>
            <h1>SmartQueue</h1>
            <div class="qr-box">
              <img src="${qr}" alt="Entry QR" />
              <h2>${location.name}</h2>
              <p>Scan to check in</p>
              <span class="badge">📍 ENTRY</span>
            </div>
            <div class="note">
              <strong>Note:</strong> Users exit directly from the app. No exit QR needed!
            </div>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const filteredLocations = selectedLocation
        ? locations.filter(l => l.id === selectedLocation)
        : locations;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <header className="bg-slate-900 text-white px-4 py-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                >
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-white hover:bg-white/10 rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="font-display text-xl font-bold">Entry QR Codes</h1>
                        <p className="text-sm text-white/70">Print for physical placement</p>
                    </div>
                </motion.div>
            </header>

            <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
                {/* Info Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4"
                >
                    <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>Simplified Flow:</strong> Users scan the entry QR to check in.
                        They exit directly from the app - no exit QR needed!
                    </p>
                </motion.div>

                {selectedLocation && (
                    <Button
                        variant="outline"
                        onClick={() => setSelectedLocation(null)}
                        className="rounded-full"
                    >
                        Show All Locations
                    </Button>
                )}

                {filteredLocations.map((location) => (
                    <motion.div
                        key={location.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="font-display font-bold text-foreground">{location.name}</h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrint(location.id)}
                                className="rounded-full"
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                        </div>

                        {/* Entry QR Only */}
                        <div className="p-6 text-center">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-4 inline-block">
                                {qrImages[location.id] ? (
                                    <img
                                        src={qrImages[location.id]}
                                        alt="Entry QR"
                                        className="w-48 h-48 mx-auto"
                                    />
                                ) : (
                                    <div className="w-48 h-48 mx-auto flex items-center justify-center">
                                        <QrCode className="h-12 w-12 text-muted-foreground animate-pulse" />
                                    </div>
                                )}
                            </div>
                            <p className="font-medium text-foreground text-lg">Entry QR Code</p>
                            <p className="text-sm text-muted-foreground mb-4">Place near the entrance</p>
                            <Button
                                variant="outline"
                                onClick={() => handleDownload(location.id)}
                                className="rounded-full"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download PNG
                            </Button>
                        </div>
                    </motion.div>
                ))}

                {locations.length === 0 && (
                    <div className="text-center py-12">
                        <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No locations found. Add locations first.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminQRCodes;

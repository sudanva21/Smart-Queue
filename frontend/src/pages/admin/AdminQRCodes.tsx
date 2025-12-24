import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, QrCode } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import QRCode from 'qrcode';

interface Location {
    id: string;
    name: string;
    type: string;
    entryQRCode: string;
    exitQRCode: string;
}

const AdminQRCodes = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [qrImages, setQrImages] = useState<Record<string, { entry: string; exit: string }>>({});
    const printRef = useRef<HTMLDivElement>(null);

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

            // Generate QR codes for each location
            const qrData: Record<string, { entry: string; exit: string }> = {};
            for (const loc of locationData) {
                if (loc.entryQRCode && loc.exitQRCode) {
                    const entryUrl = `smartqueue://scan/${loc.id}/entry/${loc.entryQRCode}`;
                    const exitUrl = `smartqueue://scan/${loc.id}/exit/${loc.exitQRCode}`;

                    try {
                        const entryQR = await QRCode.toDataURL(entryUrl, { width: 200, margin: 2 });
                        const exitQR = await QRCode.toDataURL(exitUrl, { width: 200, margin: 2 });
                        qrData[loc.id] = { entry: entryQR, exit: exitQR };
                    } catch (error) {
                        console.error('Error generating QR code:', error);
                    }
                }
            }
            setQrImages(qrData);
        });

        return () => unsubscribe();
    }, []);

    const handleDownload = (locationId: string, type: 'entry' | 'exit') => {
        const location = locations.find(l => l.id === locationId);
        const qr = qrImages[locationId]?.[type];
        if (!qr || !location) return;

        const link = document.createElement('a');
        link.download = `${location.name.replace(/\s+/g, '_')}_${type}_QR.png`;
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
            <title>QR Codes - ${location.name}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; }
              .container { display: flex; gap: 60px; justify-content: center; }
              .qr-box { text-align: center; padding: 20px; border: 2px solid #e5e7eb; border-radius: 16px; }
              .qr-box img { width: 200px; height: 200px; }
              h1 { text-align: center; margin-bottom: 40px; }
              h2 { margin: 0 0 10px; font-size: 18px; }
              p { color: #6b7280; margin: 0; font-size: 14px; }
              .type { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
              .entry { background: #d1fae5; color: #059669; }
              .exit { background: #fee2e2; color: #dc2626; }
            </style>
          </head>
          <body>
            <h1>${location.name}</h1>
            <div class="container">
              <div class="qr-box">
                <img src="${qr.entry}" alt="Entry QR" />
                <h2>Entry</h2>
                <p>Scan when entering</p>
                <span class="type entry">CHECK IN</span>
              </div>
              <div class="qr-box">
                <img src="${qr.exit}" alt="Exit QR" />
                <h2>Exit</h2>
                <p>Scan when leaving</p>
                <span class="type exit">CHECK OUT</span>
              </div>
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
                        <h1 className="font-display text-xl font-bold">QR Codes</h1>
                        <p className="text-sm text-white/70">Print or download for physical placement</p>
                    </div>
                </motion.div>
            </header>

            <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
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
                                Print Both
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
                            {/* Entry QR */}
                            <div className="p-4 text-center">
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-3">
                                    {qrImages[location.id]?.entry ? (
                                        <img
                                            src={qrImages[location.id].entry}
                                            alt="Entry QR"
                                            className="w-full max-w-[150px] mx-auto"
                                        />
                                    ) : (
                                        <div className="w-[150px] h-[150px] mx-auto flex items-center justify-center">
                                            <QrCode className="h-12 w-12 text-muted-foreground animate-pulse" />
                                        </div>
                                    )}
                                </div>
                                <p className="font-medium text-foreground">Entry</p>
                                <p className="text-xs text-muted-foreground mb-3">Scan when entering</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(location.id, 'entry')}
                                    className="rounded-full w-full"
                                >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                </Button>
                            </div>

                            {/* Exit QR */}
                            <div className="p-4 text-center">
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-3">
                                    {qrImages[location.id]?.exit ? (
                                        <img
                                            src={qrImages[location.id].exit}
                                            alt="Exit QR"
                                            className="w-full max-w-[150px] mx-auto"
                                        />
                                    ) : (
                                        <div className="w-[150px] h-[150px] mx-auto flex items-center justify-center">
                                            <QrCode className="h-12 w-12 text-muted-foreground animate-pulse" />
                                        </div>
                                    )}
                                </div>
                                <p className="font-medium text-foreground">Exit</p>
                                <p className="text-xs text-muted-foreground mb-3">Scan when leaving</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(location.id, 'exit')}
                                    className="rounded-full w-full"
                                >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                </Button>
                            </div>
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

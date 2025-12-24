import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    Plus,
    MapPin,
    Pencil,
    Trash2,
    QrCode,
    Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Location {
    id: string;
    name: string;
    type: 'canteen' | 'library' | 'office' | 'cafe';
    maxCapacity: number;
    currentOccupancy: number;
    avgWaitTime: number;
    position: { x: number; y: number };
    entryQRCode?: string;
    exitQRCode?: string;
}

const AdminLocations = () => {
    const navigate = useNavigate();
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'canteen' as const,
        maxCapacity: 100,
        positionX: 50,
        positionY: 50,
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const locationsRef = collection(db, 'locations');
        const unsubscribe = onSnapshot(locationsRef, (snapshot) => {
            const locationData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Location[];
            setLocations(locationData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const generateQRCode = () => {
        return `smartqueue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Please enter a location name');
            return;
        }

        setIsSaving(true);
        try {
            if (editingLocation) {
                // Update existing
                const locationRef = doc(db, 'locations', editingLocation.id);
                await updateDoc(locationRef, {
                    name: formData.name,
                    type: formData.type,
                    maxCapacity: formData.maxCapacity,
                    position: { x: formData.positionX, y: formData.positionY },
                    updatedAt: Timestamp.now(),
                });
                toast.success('Location updated');
            } else {
                // Create new
                const entryQRCode = generateQRCode();
                const exitQRCode = generateQRCode();

                await addDoc(collection(db, 'locations'), {
                    name: formData.name,
                    type: formData.type,
                    maxCapacity: formData.maxCapacity,
                    currentOccupancy: 0,
                    avgWaitTime: 5,
                    position: { x: formData.positionX, y: formData.positionY },
                    entryQRCode,
                    exitQRCode,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                });
                toast.success('Location created with QR codes');
            }

            setIsDialogOpen(false);
            setEditingLocation(null);
            setFormData({ name: '', type: 'canteen', maxCapacity: 100, positionX: 50, positionY: 50 });
        } catch (error) {
            console.error('Error saving location:', error);
            toast.error('Failed to save location');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (location: Location) => {
        setEditingLocation(location);
        setFormData({
            name: location.name,
            type: location.type,
            maxCapacity: location.maxCapacity,
            positionX: location.position.x,
            positionY: location.position.y,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (locationId: string) => {
        if (!confirm('Are you sure you want to delete this location?')) return;

        try {
            await deleteDoc(doc(db, 'locations', locationId));
            toast.success('Location deleted');
        } catch (error) {
            console.error('Error deleting location:', error);
            toast.error('Failed to delete location');
        }
    };

    const typeIcons: Record<string, string> = {
        canteen: '🍽️',
        library: '📚',
        office: '🏢',
        cafe: '☕',
    };

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
                        <h1 className="font-display text-xl font-bold">Manage Locations</h1>
                        <p className="text-sm text-white/70">{locations.length} locations</p>
                    </div>
                </motion.div>
            </header>

            <main className="px-4 py-6 space-y-4 max-w-lg mx-auto">
                {/* Add Button */}
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setEditingLocation(null);
                        setFormData({ name: '', type: 'canteen', maxCapacity: 100, positionX: 50, positionY: 50 });
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800">
                            <Plus className="h-5 w-5 mr-2" />
                            Add New Location
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Location Name</Label>
                                <Input
                                    placeholder="e.g., Main Canteen"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="canteen">🍽️ Canteen</SelectItem>
                                        <SelectItem value="library">📚 Library</SelectItem>
                                        <SelectItem value="office">🏢 Office</SelectItem>
                                        <SelectItem value="cafe">☕ Cafe</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Max Capacity</Label>
                                <Input
                                    type="number"
                                    value={formData.maxCapacity}
                                    onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Position X (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.positionX}
                                        onChange={(e) => setFormData({ ...formData, positionX: parseInt(e.target.value) || 0 })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Position Y (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.positionY}
                                        onChange={(e) => setFormData({ ...formData, positionY: parseInt(e.target.value) || 0 })}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleSave} disabled={isSaving} className="w-full rounded-xl">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {editingLocation ? 'Update Location' : 'Create Location'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Locations List */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {locations.map((location) => (
                            <motion.div
                                key={location.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{typeIcons[location.type]}</span>
                                        <div>
                                            <p className="font-medium text-foreground">{location.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Capacity: {location.maxCapacity} • Current: {location.currentOccupancy || 0}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/qrcodes?location=${location.id}`)} className="h-8 w-8">
                                            <QrCode className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(location)} className="h-8 w-8">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(location.id)} className="h-8 w-8 text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {location.entryQRCode && (
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-muted-foreground">
                                            Entry QR: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{location.entryQRCode.slice(0, 20)}...</code>
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminLocations;

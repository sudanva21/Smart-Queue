import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

interface LocationData {
    id: string;
    name: string;
    type: 'canteen' | 'library' | 'office' | 'cafe';
    currentOccupancy: number;
    maxCapacity: number;
    avgWaitTime: number;
    position: { x: number; y: number };
}

const locations: LocationData[] = [
    {
        id: 'main-canteen',
        name: 'Main Canteen',
        type: 'canteen',
        currentOccupancy: 78,
        maxCapacity: 100,
        avgWaitTime: 12,
        position: { x: 30, y: 40 },
    },
    {
        id: 'central-library',
        name: 'Central Library',
        type: 'library',
        currentOccupancy: 45,
        maxCapacity: 150,
        avgWaitTime: 5,
        position: { x: 60, y: 25 },
    },
    {
        id: 'admin-office',
        name: 'Admin Office',
        type: 'office',
        currentOccupancy: 92,
        maxCapacity: 100,
        avgWaitTime: 25,
        position: { x: 45, y: 65 },
    },
    {
        id: 'library-cafe',
        name: 'Library Cafe',
        type: 'cafe',
        currentOccupancy: 15,
        maxCapacity: 50,
        avgWaitTime: 2,
        position: { x: 75, y: 50 },
    },
    {
        id: 'science-cafeteria',
        name: 'Science Block Cafeteria',
        type: 'canteen',
        currentOccupancy: 65,
        maxCapacity: 80,
        avgWaitTime: 8,
        position: { x: 20, y: 70 },
    },
];

export async function seedLocations() {
    console.log('Seeding locations to Firestore...');

    for (const location of locations) {
        const locationRef = doc(db, 'locations', location.id);
        await setDoc(locationRef, {
            ...location,
            updatedAt: new Date(),
        });
        console.log(`Seeded: ${location.name}`);
    }

    console.log('Done seeding locations!');
}

// Export for manual running in browser console
if (typeof window !== 'undefined') {
    (window as any).seedLocations = seedLocations;
}

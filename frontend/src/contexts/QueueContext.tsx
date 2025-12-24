import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  increment,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';

export type LocationStatus = 'safe' | 'busy' | 'crowded';

export interface Location {
  id: string;
  name: string;
  type: 'canteen' | 'library' | 'office' | 'cafe';
  currentOccupancy: number;
  maxCapacity: number;
  avgWaitTime: number;
  status: LocationStatus;
  position: { x: number; y: number };
}

export interface Ticket {
  id: string;
  locationId: string;
  locationName: string;
  positionInLine: number;
  estimatedTime: number;
  createdAt: Date;
  status: 'active' | 'ready' | 'completed';
  userId?: string;
}

interface QueueContextType {
  locations: Location[];
  tickets: Ticket[];
  demoMode: boolean;
  setDemoMode: (mode: boolean) => void;
  joinQueue: (locationId: string) => Promise<Ticket>;
  cancelTicket: (ticketId: string) => void;
  getAISuggestion: () => { message: string; location: Location } | null;
  isLoading: boolean;
  seedLocations: () => Promise<void>;
}

// Initial location data for seeding
const initialLocations: Location[] = [
  {
    id: 'main-canteen',
    name: 'Main Canteen',
    type: 'canteen',
    currentOccupancy: 78,
    maxCapacity: 100,
    avgWaitTime: 12,
    status: 'busy',
    position: { x: 30, y: 40 },
  },
  {
    id: 'central-library',
    name: 'Central Library',
    type: 'library',
    currentOccupancy: 45,
    maxCapacity: 150,
    avgWaitTime: 5,
    status: 'safe',
    position: { x: 60, y: 25 },
  },
  {
    id: 'admin-office',
    name: 'Admin Office',
    type: 'office',
    currentOccupancy: 92,
    maxCapacity: 100,
    avgWaitTime: 25,
    status: 'crowded',
    position: { x: 45, y: 65 },
  },
  {
    id: 'library-cafe',
    name: 'Library Cafe',
    type: 'cafe',
    currentOccupancy: 15,
    maxCapacity: 50,
    avgWaitTime: 2,
    status: 'safe',
    position: { x: 75, y: 50 },
  },
  {
    id: 'science-cafeteria',
    name: 'Science Block Cafeteria',
    type: 'canteen',
    currentOccupancy: 65,
    maxCapacity: 80,
    avgWaitTime: 8,
    status: 'busy',
    position: { x: 20, y: 70 },
  },
];

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get user from auth context (may be null during initial load)
  let user: { uid: string } | null = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch {
    // Auth context not available yet
  }

  const getStatusFromOccupancy = (occupancy: number): LocationStatus => {
    if (occupancy < 50) return 'safe';
    if (occupancy < 80) return 'busy';
    return 'crowded';
  };

  // Seed locations to Firestore
  const seedLocations = useCallback(async () => {
    console.log('Seeding locations to Firestore...');
    for (const location of initialLocations) {
      const locationRef = doc(db, 'locations', location.id);
      await setDoc(locationRef, {
        ...location,
        updatedAt: Timestamp.now(),
      });
      console.log(`Seeded: ${location.name}`);
    }
    console.log('Done seeding locations!');
  }, []);

  // Subscribe to Firestore locations - real-time updates
  useEffect(() => {
    const locationsRef = collection(db, 'locations');
    const unsubscribe = onSnapshot(locationsRef, (snapshot) => {
      if (snapshot.empty) {
        // No locations yet - seed them automatically
        seedLocations().then(() => {
          console.log('Locations seeded automatically');
        });
      } else {
        const locationData = snapshot.docs.map(doc => {
          const data = doc.data();
          const occupancyPercent = (data.currentOccupancy / data.maxCapacity) * 100;
          return {
            id: doc.id,
            name: data.name,
            type: data.type,
            currentOccupancy: data.currentOccupancy,
            maxCapacity: data.maxCapacity,
            avgWaitTime: data.avgWaitTime,
            status: getStatusFromOccupancy(occupancyPercent),
            position: data.position,
          } as Location;
        });
        setLocations(locationData);
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching locations:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [seedLocations]);

  // Subscribe to user's tickets - real-time updates
  useEffect(() => {
    if (!user) {
      setTickets([]);
      return;
    }

    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          locationId: data.locationId,
          locationName: data.locationName,
          positionInLine: data.positionInLine,
          estimatedTime: data.estimatedTime,
          createdAt: data.createdAt?.toDate() || new Date(),
          status: data.status,
          userId: data.userId,
        } as Ticket;
      });
      setTickets(ticketData);
    }, (error) => {
      console.error('Error fetching tickets:', error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Demo mode simulation - simulates real-time crowd changes
  useEffect(() => {
    if (!demoMode || locations.length === 0) return;

    const interval = setInterval(async () => {
      // Update each location in Firestore with random crowd changes
      for (const loc of locations) {
        const change = Math.floor(Math.random() * 20) - 10;
        const newOccupancy = Math.max(5, Math.min(loc.maxCapacity - 2, loc.currentOccupancy + change));
        const newWaitTime = Math.max(1, Math.floor(loc.avgWaitTime + (Math.random() * 6 - 3)));

        const locationRef = doc(db, 'locations', loc.id);
        await updateDoc(locationRef, {
          currentOccupancy: newOccupancy,
          avgWaitTime: newWaitTime,
          updatedAt: Timestamp.now(),
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [demoMode, locations]);

  const joinQueue = useCallback(async (locationId: string): Promise<Ticket> => {
    const location = locations.find(l => l.id === locationId);
    if (!location) throw new Error('Location not found');
    if (!user) throw new Error('User not authenticated');

    // Calculate position based on current queue
    const ticketsRef = collection(db, 'tickets');
    const locationTicketsQuery = query(
      ticketsRef,
      where('locationId', '==', locationId),
      where('status', '==', 'active')
    );

    // Create ticket in Firestore
    const ticketData = {
      userId: user.uid,
      locationId,
      locationName: location.name,
      positionInLine: Math.floor(Math.random() * 5) + 1, // This would be calculated from actual queue
      estimatedTime: location.avgWaitTime,
      createdAt: Timestamp.now(),
      status: 'active' as const,
    };

    const docRef = await addDoc(ticketsRef, ticketData);

    // Update user stats
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      totalQueuesJoined: increment(1),
      totalTimeSaved: increment(Math.floor(location.avgWaitTime * 0.7)), // Estimate 70% time saved
    });

    return {
      id: docRef.id,
      ...ticketData,
      createdAt: new Date(),
    };
  }, [locations, user]);

  const cancelTicket = useCallback(async (ticketId: string) => {
    // Delete ticket from Firestore
    const ticketRef = doc(db, 'tickets', ticketId);
    await deleteDoc(ticketRef);
  }, []);

  const getAISuggestion = useCallback(() => {
    if (locations.length === 0) return null;

    const bestLocation = locations.reduce((best, loc) => {
      const score = ((100 - (loc.currentOccupancy / loc.maxCapacity) * 100) + (30 - loc.avgWaitTime)) / 2;
      const bestScore = ((100 - (best.currentOccupancy / best.maxCapacity) * 100) + (30 - best.avgWaitTime)) / 2;
      return score > bestScore ? loc : best;
    });

    const worstLocation = locations.reduce((worst, loc) => {
      const score = (loc.currentOccupancy / loc.maxCapacity) * 100;
      const worstScore = (worst.currentOccupancy / worst.maxCapacity) * 100;
      return score > worstScore ? loc : worst;
    });

    const timeSaved = worstLocation.avgWaitTime - bestLocation.avgWaitTime;

    if (timeSaved > 5) {
      return {
        message: `${bestLocation.name} is currently ${bestLocation.status === 'safe' ? 'empty' : 'less crowded'}. Head there to save ${timeSaved} mins!`,
        location: bestLocation,
      };
    }
    return null;
  }, [locations]);

  return (
    <QueueContext.Provider value={{
      locations,
      tickets,
      demoMode,
      setDemoMode,
      joinQueue,
      cancelTicket,
      getAISuggestion,
      isLoading,
      seedLocations,
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) throw new Error('useQueue must be used within QueueProvider');
  return context;
};

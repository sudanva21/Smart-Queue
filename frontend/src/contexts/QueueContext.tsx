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
  setDoc,
  getDocs
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
  entryQRCode?: string;
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
  userLocation: { id: string; name: string } | null;
  exitLocation: () => Promise<void>;
  isUserAtLocation: (locationId: string) => boolean;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ id: string; name: string } | null>(null);

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

  // Seed locations to Firestore (Admin function)
  const seedLocations = useCallback(async () => {
    const defaultLocations = [
      { id: 'main-canteen', name: 'Main Canteen', type: 'canteen', maxCapacity: 100, position: { x: 30, y: 40 } },
      { id: 'central-library', name: 'Central Library', type: 'library', maxCapacity: 150, position: { x: 60, y: 25 } },
      { id: 'admin-office', name: 'Admin Office', type: 'office', maxCapacity: 100, position: { x: 45, y: 65 } },
      { id: 'library-cafe', name: 'Library Cafe', type: 'cafe', maxCapacity: 50, position: { x: 75, y: 50 } },
      { id: 'science-cafeteria', name: 'Science Block Cafeteria', type: 'canteen', maxCapacity: 80, position: { x: 20, y: 70 } },
    ];

    console.log('Seeding locations to Firestore...');
    for (const location of defaultLocations) {
      const locationRef = doc(db, 'locations', location.id);
      const entryQRCode = `smartqueue-entry-${location.id}-${Date.now()}`;

      await setDoc(locationRef, {
        ...location,
        currentOccupancy: 0,
        avgWaitTime: 5,
        entryQRCode,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`Seeded: ${location.name}`);
    }
    console.log('Done seeding locations!');
  }, []);

  // Subscribe to Firestore locations - REAL-TIME updates
  useEffect(() => {
    const locationsRef = collection(db, 'locations');
    const unsubscribe = onSnapshot(locationsRef, (snapshot) => {
      const locationData = snapshot.docs.map(doc => {
        const data = doc.data();
        const occupancyPercent = data.maxCapacity > 0
          ? ((data.currentOccupancy || 0) / data.maxCapacity) * 100
          : 0;
        return {
          id: doc.id,
          name: data.name,
          type: data.type,
          currentOccupancy: data.currentOccupancy || 0,
          maxCapacity: data.maxCapacity,
          avgWaitTime: data.avgWaitTime || 5,
          status: getStatusFromOccupancy(occupancyPercent),
          position: data.position || { x: 50, y: 50 },
          entryQRCode: data.entryQRCode,
        } as Location;
      });
      setLocations(locationData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching locations:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  // Subscribe to user's current location (from QR check-ins)
  useEffect(() => {
    if (!user) {
      setUserLocation(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.currentLocationId && data.currentLocationName) {
          setUserLocation({
            id: data.currentLocationId,
            name: data.currentLocationName,
          });
        } else {
          setUserLocation(null);
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Check if user is at a specific location
  const isUserAtLocation = useCallback((locationId: string): boolean => {
    return userLocation?.id === locationId;
  }, [userLocation]);

  // Exit from current location (no QR needed!)
  const exitLocation = useCallback(async () => {
    if (!user || !userLocation) return;

    try {
      // Find active check-in for current location
      const checkinsRef = collection(db, 'checkins');
      const activeQuery = query(
        checkinsRef,
        where('userId', '==', user.uid),
        where('locationId', '==', userLocation.id),
        where('status', '==', 'active')
      );
      const activeCheckins = await getDocs(activeQuery);

      if (!activeCheckins.empty) {
        const checkinDoc = activeCheckins.docs[0];
        const entryTime = checkinDoc.data().entryTime?.toDate() || new Date();
        const timeSpent = Math.floor((Date.now() - entryTime.getTime()) / 60000);

        // Update check-in to completed
        await updateDoc(doc(db, 'checkins', checkinDoc.id), {
          exitTime: Timestamp.now(),
          status: 'completed',
        });

        // Decrement location occupancy
        const locationRef = doc(db, 'locations', userLocation.id);
        await updateDoc(locationRef, {
          currentOccupancy: increment(-1),
        });

        // Update user - clear location and add time saved
        await updateDoc(doc(db, 'users', user.uid), {
          currentLocationId: null,
          currentLocationName: null,
          totalTimeSaved: increment(Math.max(1, Math.floor(timeSpent * 0.3))),
        });
      } else {
        // No active check-in found, just clear user location
        await updateDoc(doc(db, 'users', user.uid), {
          currentLocationId: null,
          currentLocationName: null,
        });
      }
    } catch (error) {
      console.error('Error exiting location:', error);
      throw error;
    }
  }, [user, userLocation]);

  // Demo mode simulation
  useEffect(() => {
    if (!demoMode || locations.length === 0) return;

    const interval = setInterval(async () => {
      for (const loc of locations) {
        const change = Math.floor(Math.random() * 6) - 3;
        const newOccupancy = Math.max(0, Math.min(loc.maxCapacity, (loc.currentOccupancy || 0) + change));

        try {
          const locationRef = doc(db, 'locations', loc.id);
          await updateDoc(locationRef, {
            currentOccupancy: newOccupancy,
            avgWaitTime: Math.max(1, Math.floor(5 + (newOccupancy / loc.maxCapacity) * 20)),
            updatedAt: Timestamp.now(),
          });
        } catch (error) {
          console.error('Error updating location in demo mode:', error);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [demoMode, locations.length]);

  const joinQueue = useCallback(async (locationId: string): Promise<Ticket> => {
    const location = locations.find(l => l.id === locationId);
    if (!location) throw new Error('Location not found');
    if (!user) throw new Error('User not authenticated');

    // Don't allow joining queue if already at this location
    if (userLocation?.id === locationId) {
      throw new Error('You are already at this location');
    }

    const ticketData = {
      userId: user.uid,
      locationId,
      locationName: location.name,
      positionInLine: Math.max(1, Math.floor((location.currentOccupancy || 0) / 10) + 1),
      estimatedTime: location.avgWaitTime,
      createdAt: Timestamp.now(),
      status: 'active' as const,
    };

    const ticketsRef = collection(db, 'tickets');
    const docRef = await addDoc(ticketsRef, ticketData);

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      totalQueuesJoined: increment(1),
      totalTimeSaved: increment(Math.floor(location.avgWaitTime * 0.7)),
    });

    return {
      id: docRef.id,
      ...ticketData,
      createdAt: new Date(),
    };
  }, [locations, user, userLocation]);

  const cancelTicket = useCallback(async (ticketId: string) => {
    const ticketRef = doc(db, 'tickets', ticketId);
    await deleteDoc(ticketRef);
  }, []);

  const getAISuggestion = useCallback(() => {
    if (locations.length === 0) return null;

    // Filter out current location from suggestions
    const availableLocations = userLocation
      ? locations.filter(l => l.id !== userLocation.id)
      : locations;

    if (availableLocations.length === 0) return null;

    const bestLocation = availableLocations.reduce((best, loc) => {
      const score = ((100 - ((loc.currentOccupancy || 0) / loc.maxCapacity) * 100) + (30 - loc.avgWaitTime)) / 2;
      const bestScore = ((100 - ((best.currentOccupancy || 0) / best.maxCapacity) * 100) + (30 - best.avgWaitTime)) / 2;
      return score > bestScore ? loc : best;
    });

    const worstLocation = availableLocations.reduce((worst, loc) => {
      const score = ((loc.currentOccupancy || 0) / loc.maxCapacity) * 100;
      const worstScore = ((worst.currentOccupancy || 0) / worst.maxCapacity) * 100;
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
  }, [locations, userLocation]);

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
      userLocation,
      exitLocation,
      isUserAtLocation,
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

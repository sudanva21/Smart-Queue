import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  increment,
  Timestamp
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
}

const initialLocations: Location[] = [
  {
    id: '1',
    name: 'Main Canteen',
    type: 'canteen',
    currentOccupancy: 78,
    maxCapacity: 100,
    avgWaitTime: 12,
    status: 'busy',
    position: { x: 30, y: 40 },
  },
  {
    id: '2',
    name: 'Central Library',
    type: 'library',
    currentOccupancy: 45,
    maxCapacity: 150,
    avgWaitTime: 5,
    status: 'safe',
    position: { x: 60, y: 25 },
  },
  {
    id: '3',
    name: 'Admin Office',
    type: 'office',
    currentOccupancy: 92,
    maxCapacity: 100,
    avgWaitTime: 25,
    status: 'crowded',
    position: { x: 45, y: 65 },
  },
  {
    id: '4',
    name: 'Library Cafe',
    type: 'cafe',
    currentOccupancy: 15,
    maxCapacity: 50,
    avgWaitTime: 2,
    status: 'safe',
    position: { x: 75, y: 50 },
  },
  {
    id: '5',
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
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [useFirebase, setUseFirebase] = useState(false);

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

  // Check if Firebase is configured
  useEffect(() => {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (apiKey && apiKey !== 'your_api_key_here') {
      setUseFirebase(true);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to Firestore locations
  useEffect(() => {
    if (!useFirebase) return;

    const locationsRef = collection(db, 'locations');
    const unsubscribe = onSnapshot(locationsRef, (snapshot) => {
      if (snapshot.empty) {
        // No locations in Firestore, use initial data
        setLocations(initialLocations);
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
  }, [useFirebase]);

  // Subscribe to user's tickets
  useEffect(() => {
    if (!useFirebase || !user) return;

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
  }, [useFirebase, user]);

  // Demo mode simulation (only when not using Firebase or explicitly enabled)
  useEffect(() => {
    if (!demoMode) return;

    const interval = setInterval(() => {
      setLocations(prev =>
        prev.map(loc => {
          const change = Math.floor(Math.random() * 30) - 15;
          const newOccupancy = Math.max(10, Math.min(98, loc.currentOccupancy + change));
          const occupancyPercent = (newOccupancy / loc.maxCapacity) * 100;
          const newWaitTime = Math.max(1, Math.floor(loc.avgWaitTime + (Math.random() * 10 - 5)));

          return {
            ...loc,
            currentOccupancy: newOccupancy,
            avgWaitTime: newWaitTime,
            status: getStatusFromOccupancy(occupancyPercent),
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [demoMode]);

  const joinQueue = useCallback(async (locationId: string): Promise<Ticket> => {
    const location = locations.find(l => l.id === locationId);
    if (!location) throw new Error('Location not found');

    if (useFirebase && user) {
      // Create ticket in Firestore
      const ticketData = {
        userId: user.uid,
        locationId,
        locationName: location.name,
        positionInLine: Math.floor(Math.random() * 10) + 1,
        estimatedTime: location.avgWaitTime,
        createdAt: Timestamp.now(),
        status: 'active' as const,
      };

      const ticketsRef = collection(db, 'tickets');
      const docRef = await addDoc(ticketsRef, ticketData);

      // Update user stats
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        totalQueuesJoined: increment(1),
      });

      return {
        id: docRef.id,
        ...ticketData,
        createdAt: new Date(),
      };
    } else {
      // Local mode - simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newTicket: Ticket = {
        id: `TKT-${Date.now()}`,
        locationId,
        locationName: location.name,
        positionInLine: Math.floor(Math.random() * 10) + 1,
        estimatedTime: location.avgWaitTime,
        createdAt: new Date(),
        status: 'active',
      };

      setTickets(prev => [...prev, newTicket]);
      return newTicket;
    }
  }, [locations, useFirebase, user]);

  const cancelTicket = useCallback(async (ticketId: string) => {
    if (useFirebase) {
      // Delete ticket from Firestore
      const ticketRef = doc(db, 'tickets', ticketId);
      await deleteDoc(ticketRef);
    } else {
      // Local mode
      setTickets(prev => prev.filter(t => t.id !== ticketId));
    }
  }, [useFirebase]);

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

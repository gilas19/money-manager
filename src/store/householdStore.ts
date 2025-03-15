import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  arrayUnion, 
  arrayRemove,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Household } from '@/types';
import { Firestore } from 'firebase/firestore';

interface HouseholdState {
  households: Household[];
  invitations: Household[];
  currentHousehold: Household | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchHouseholds: (userId: string) => Promise<void>;
  fetchInvitations: (email: string) => Promise<void>;
  createHousehold: (household: Omit<Household, 'id'>) => Promise<string | null>;
  updateHousehold: (id: string, data: Partial<Household>) => Promise<void>;
  deleteHousehold: (id: string) => Promise<void>;
  inviteMember: (householdId: string, email: string) => Promise<void>;
  removeMember: (householdId: string, userId: string) => Promise<void>;
  joinHousehold: (householdId: string, userId: string, email: string) => Promise<void>;
  cancelInvitation: (householdId: string, email: string) => Promise<void>;
  quitHousehold: (householdId: string, userId: string) => Promise<void>;
  setCurrentHousehold: (household: Household | null) => void;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  households: [],
  invitations: [],
  currentHousehold: null,
  isLoading: false,
  error: null,
  
  fetchHouseholds: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      const householdsRef = collection(db, 'households');
      const q = query(
        householdsRef, 
        where('members', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const households: Household[] = [];
      
      querySnapshot.forEach((doc) => {
        households.push({ id: doc.id, ...doc.data() } as Household);
      });
      
      set({ households, isLoading: false });
      
      // Set current household if not set and households exist
      if (!get().currentHousehold && households.length > 0) {
        set({ currentHousehold: households[0] });
      }
    } catch (error) {
      console.error('Error fetching households:', error);
      set({ error: 'Failed to fetch households', isLoading: false });
    }
  },
  
  fetchInvitations: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      const householdsRef = collection(db, 'households');
      const q = query(
        householdsRef, 
        where('invitedEmails', 'array-contains', email)
      );
      
      const querySnapshot = await getDocs(q);
      const invitations: Household[] = [];
      
      querySnapshot.forEach((doc) => {
        invitations.push({ id: doc.id, ...doc.data() } as Household);
      });
      
      set({ invitations, isLoading: false });
    } catch (error) {
      console.error('Error fetching invitations:', error);
      set({ error: 'Failed to fetch invitations', isLoading: false });
    }
  },
  
  createHousehold: async (household) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      const householdsRef = collection(db, 'households');
      const docRef = await addDoc(householdsRef, household);
      
      // Refresh households
      await get().fetchHouseholds(household.ownerId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating household:', error);
      set({ error: 'Failed to create household', isLoading: false });
      return null;
    }
  },
  
  updateHousehold: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      const householdRef = doc(db, 'households', id);
      await updateDoc(householdRef, data);
      
      // Update local state
      const { households, currentHousehold } = get();
      const updatedHouseholds = households.map(h => 
        h.id === id ? { ...h, ...data } : h
      );
      
      set({ 
        households: updatedHouseholds, 
        currentHousehold: currentHousehold?.id === id 
          ? { ...currentHousehold, ...data } 
          : currentHousehold,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error updating household:', error);
      set({ error: 'Failed to update household', isLoading: false });
    }
  },
  
  deleteHousehold: async (id) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      const householdRef = doc(db, 'households', id);
      await deleteDoc(householdRef);
      
      // Update local state
      const { households, currentHousehold } = get();
      const updatedHouseholds = households.filter(h => h.id !== id);
      
      set({ 
        households: updatedHouseholds, 
        currentHousehold: currentHousehold?.id === id ? null : currentHousehold,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error deleting household:', error);
      set({ error: 'Failed to delete household', isLoading: false });
    }
  },
  
  inviteMember: async (householdId, email) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        invitedEmails: arrayUnion(email)
      });
      
      // Update local state
      const { households, currentHousehold } = get();
      const updatedHouseholds = households.map(h => {
        if (h.id === householdId) {
          return {
            ...h,
            invitedEmails: [...h.invitedEmails, email]
          };
        }
        return h;
      });
      
      set({ 
        households: updatedHouseholds,
        currentHousehold: currentHousehold?.id === householdId 
          ? { 
              ...currentHousehold, 
              invitedEmails: [...currentHousehold.invitedEmails, email] 
            } 
          : currentHousehold,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error inviting member:', error);
      set({ error: 'Failed to invite member', isLoading: false });
    }
  },
  
  removeMember: async (householdId, userId) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        members: arrayRemove(userId)
      });
      
      // Update local state
      const { households, currentHousehold } = get();
      const updatedHouseholds = households.map(h => {
        if (h.id === householdId) {
          return {
            ...h,
            members: h.members.filter(m => m !== userId)
          };
        }
        return h;
      });
      
      set({ 
        households: updatedHouseholds,
        currentHousehold: currentHousehold?.id === householdId 
          ? { 
              ...currentHousehold, 
              members: currentHousehold.members.filter(m => m !== userId) 
            } 
          : currentHousehold,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error removing member:', error);
      set({ error: 'Failed to remove member', isLoading: false });
    }
  },
  
  joinHousehold: async (householdId, userId, email) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        members: arrayUnion(userId),
        invitedEmails: arrayRemove(email)
      });
      
      // Update local state - remove from invitations
      const { invitations } = get();
      const updatedInvitations = invitations.filter(h => h.id !== householdId);
      set({ invitations: updatedInvitations });
      
      // Refresh households
      await get().fetchHouseholds(userId);
    } catch (error) {
      console.error('Error joining household:', error);
      set({ error: 'Failed to join household', isLoading: false });
    }
  },
  
  cancelInvitation: async (householdId, email) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      const householdRef = doc(db, 'households', householdId);
      await updateDoc(householdRef, {
        invitedEmails: arrayRemove(email)
      });
      
      // Update local state
      const { households, currentHousehold } = get();
      const updatedHouseholds = households.map(h => {
        if (h.id === householdId) {
          return {
            ...h,
            invitedEmails: h.invitedEmails.filter(e => e !== email)
          };
        }
        return h;
      });
      
      set({ 
        households: updatedHouseholds,
        currentHousehold: currentHousehold?.id === householdId 
          ? { 
              ...currentHousehold, 
              invitedEmails: currentHousehold.invitedEmails.filter(e => e !== email) 
            } 
          : currentHousehold,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error canceling invitation:', error);
      set({ error: 'Failed to cancel invitation', isLoading: false });
    }
  },
  
  quitHousehold: async (householdId, userId) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      // Get the household to check if the user is the owner
      const householdRef = doc(db as Firestore, 'households', householdId);
      const householdSnap = await getDoc(householdRef);
      
      if (!householdSnap.exists()) {
        throw new Error('Household not found');
      }
      
      const householdData = householdSnap.data() as Household;
      
      // If the user is the owner, delete the household
      if (householdData.ownerId === userId) {
        await get().deleteHousehold(householdId);
      } else {
        // Otherwise, just remove the user from the members
        await updateDoc(householdRef, {
          members: arrayRemove(userId)
        });
        
        // Update local state
        const { households, currentHousehold } = get();
        const updatedHouseholds = households.filter(h => h.id !== householdId);
        
        set({ 
          households: updatedHouseholds,
          currentHousehold: currentHousehold?.id === householdId ? null : currentHousehold,
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Error quitting household:', error);
      set({ error: 'Failed to quit household', isLoading: false });
    }
  },
  
  setCurrentHousehold: (household) => {
    set({ currentHousehold: household });
  }
})); 
import { create } from 'zustand';
import { Notification } from '@/lib/types';

interface AppState {
  darkMode: boolean;
  sidebarOpen: boolean;
  notifications: Notification[];
  setDarkMode: (dark: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  darkMode: false,
  sidebarOpen: false,
  notifications: [],
  setDarkMode: (dark) => set({ darkMode: dark }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addNotification: (notif) => set((state) => ({
    notifications: [{
      ...notif,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      read: false
    }, ...state.notifications]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
}));

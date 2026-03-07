import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SidebarContextType {
  /** Whether the desktop sidebar is visible */
  desktopOpen: boolean;
  /** Toggle desktop sidebar */
  toggleDesktop: () => void;
  /** Explicitly open desktop sidebar */
  openDesktop: () => void;
  /** Explicitly close desktop sidebar (for sub-sections) */
  closeDesktop: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [desktopOpen, setDesktopOpen] = useState(true);

  const toggleDesktop = useCallback(() => setDesktopOpen(p => !p), []);
  const openDesktop = useCallback(() => setDesktopOpen(true), []);
  const closeDesktop = useCallback(() => setDesktopOpen(false), []);

  return (
    <SidebarContext.Provider value={{ desktopOpen, toggleDesktop, openDesktop, closeDesktop }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useAppSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useAppSidebar must be used within SidebarProvider');
  return ctx;
}

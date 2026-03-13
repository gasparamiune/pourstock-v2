import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

// Mock supabase before importing useAuth
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => {
        mockOnAuthStateChange();
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signInWithPassword: (args: any) => mockSignIn(args),
      signUp: (args: any) => mockSignUp(args),
      signOut: () => mockSignOut(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

vi.mock('@/lib/hotel', () => ({
  DEFAULT_HOTEL_ID: 'test-hotel-id',
}));

import { AuthProvider, useAuth } from './useAuth';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  });

  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('returns loading=true initially then resolves', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Eventually loading should become false
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('returns correct default values when not authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isManager).toBe(false);
    expect(result.current.isStaff).toBe(false);
    expect(result.current.profile).toBeNull();
    expect(result.current.roles).toEqual([]);
    expect(result.current.departments).toEqual([]);
    expect(result.current.activeHotelId).toBe('test-hotel-id');
  });

  it('hasDepartment returns false when not authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.hasDepartment('restaurant')).toBe(false);
    expect(result.current.isDepartmentManager('reception')).toBe(false);
  });
});

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { APP_VERSION } from '@/lib/version';

export interface ReleaseAnnouncement {
  id: string;
  version: string;
  title: string;
  summary: string | null;
  content: any; // jsonb - string[]
  audience_type: string;
  audience_roles: string[] | null;
  audience_hotels: string[] | null;
  audience_modules: string[] | null;
  severity: string;
  is_mandatory: boolean;
  is_silent: boolean;
  is_published: boolean;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  source: string | null;
  raw_release_notes: string | null;
  user_facing_notes: string | null;
  generation_status?: string;
}

interface ReadState {
  release_id: string;
  dismissed_at: string | null;
  acknowledged_at: string | null;
}

// Session-level guard to prevent duplicate auto-creation calls
const _autoCreateAttempted = new Set<string>();

export function useReleaseAnnouncements() {
  const { user, activeHotelId, activeHotelRole, roles } = useAuth();
  const [releases, setReleases] = useState<ReleaseAnnouncement[]>([]);
  const [readStates, setReadStates] = useState<ReadState[]>([]);
  const [loading, setLoading] = useState(true);
  const autoCreateRef = useRef(false);

  // Trigger autonomous release creation if needed
  const triggerAutoRelease = useCallback(async () => {
    if (!user || !APP_VERSION) return;
    if (_autoCreateAttempted.has(APP_VERSION)) return;
    if (autoCreateRef.current) return;
    
    autoCreateRef.current = true;
    _autoCreateAttempted.add(APP_VERSION);

    try {
      // Check if release exists for current version
      const { data: existing } = await supabase
        .from('release_announcements')
        .select('id')
        .eq('version', APP_VERSION)
        .maybeSingle();

      if (existing) return; // Already exists

      // Call autonomous release creation edge function
      const { error } = await supabase.functions.invoke('create-autonomous-release', {
        body: { version: APP_VERSION },
      });

      if (error) {
        console.warn('[ReleaseAnnouncements] auto-create failed:', error);
      }
    } catch (err) {
      console.warn('[ReleaseAnnouncements] auto-create error:', err);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) {
      setReleases([]);
      setReadStates([]);
      setLoading(false);
      return;
    }

    try {
      const [releasesRes, readsRes] = await Promise.all([
        supabase
          .from('release_announcements')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false }),
        supabase
          .from('user_release_reads')
          .select('release_id, dismissed_at, acknowledged_at')
          .eq('user_id', user.id),
      ]);

      if (releasesRes.data) {
        setReleases(releasesRes.data as unknown as ReleaseAnnouncement[]);
      }
      if (readsRes.data) {
        setReadStates(readsRes.data as ReadState[]);
      }
    } catch (err) {
      console.warn('[ReleaseAnnouncements] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Trigger auto-release check after initial load
  useEffect(() => {
    if (!loading && user) {
      triggerAutoRelease().then(() => {
        // Refetch after potential auto-creation (small delay for DB propagation)
        setTimeout(() => fetchData(), 1500);
      });
    }
  }, [loading, user, triggerAutoRelease, fetchData]);

  // Filter releases relevant to this user
  const relevantReleases = releases.filter((r) => {
    if (r.audience_type === 'all') return true;

    if (r.audience_type === 'hotel' && r.audience_hotels?.length) {
      return r.audience_hotels.includes(activeHotelId);
    }

    if (r.audience_type === 'role' && r.audience_roles?.length) {
      const userRoleSet = new Set<string>([
        ...roles,
        ...(activeHotelRole ? [activeHotelRole] : []),
      ]);
      return r.audience_roles.some((role) => userRoleSet.has(role));
    }

    return true;
  });

  // Unread non-silent releases
  const readIds = new Set(readStates.map((r) => r.release_id));
  const unreadReleases = relevantReleases.filter(
    (r) => !r.is_silent && !readIds.has(r.id)
  );

  // The newest unread release to show
  const activeRelease = unreadReleases[0] ?? null;

  // Check if there's a mandatory unacknowledged release
  const mandatoryUnacknowledged = relevantReleases.find((r) => {
    if (!r.is_mandatory) return false;
    const state = readStates.find((s) => s.release_id === r.id);
    return !state?.acknowledged_at;
  });

  const markAsRead = useCallback(
    async (releaseId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('user_release_reads')
        .upsert(
          {
            release_id: releaseId,
            user_id: user.id,
            dismissed_at: new Date().toISOString(),
          } as any,
          { onConflict: 'release_id,user_id' }
        );
      if (!error) {
        setReadStates((prev) => [
          ...prev.filter((s) => s.release_id !== releaseId),
          { release_id: releaseId, dismissed_at: new Date().toISOString(), acknowledged_at: null },
        ]);
      }
    },
    [user]
  );

  const acknowledge = useCallback(
    async (releaseId: string) => {
      if (!user) return;
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('user_release_reads')
        .upsert(
          {
            release_id: releaseId,
            user_id: user.id,
            dismissed_at: now,
            acknowledged_at: now,
          } as any,
          { onConflict: 'release_id,user_id' }
        );
      if (!error) {
        setReadStates((prev) => [
          ...prev.filter((s) => s.release_id !== releaseId),
          { release_id: releaseId, dismissed_at: now, acknowledged_at: now },
        ]);
      }
    },
    [user]
  );

  return {
    releases: relevantReleases,
    activeRelease,
    mandatoryUnacknowledged: mandatoryUnacknowledged ?? null,
    unreadCount: unreadReleases.length,
    loading,
    markAsRead,
    acknowledge,
    refetch: fetchData,
  };
}

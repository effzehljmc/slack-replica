import { useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const UPDATE_THROTTLE = 2000; // Only update every 2 seconds
const ACTIVITY_BUFFER = 30000; // 30 seconds buffer before marking as away

export function useActivityStatus() {
  const { data: user } = useCurrentUser();
  const updateStatus = useMutation(api.users.updateStatus);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(Date.now());
  const pendingStatusRef = useRef<string | null>(null);
  const unmountingRef = useRef(false);
  
  // Get current status for comparison
  const currentStatus = useQuery(
    api.users.getUserStatus,
    user?._id ? { userId: user._id } : "skip"
  );

  const setStatus = useCallback(async (newStatus: 'online' | 'away' | 'offline') => {
    if (!user?._id || newStatus === currentStatus) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // If we're updating too frequently, store the pending status
    if (timeSinceLastUpdate < UPDATE_THROTTLE) {
      pendingStatusRef.current = newStatus;
      return;
    }

    // For 'away' status, ensure enough time has passed since last activity
    if (newStatus === 'away') {
      const timeSinceLastActivity = now - lastActivityRef.current;
      if (timeSinceLastActivity < ACTIVITY_BUFFER) {
        return;
      }
    }

    try {
      lastUpdateRef.current = now;
      pendingStatusRef.current = null;
      await updateStatus({ userId: user._id, status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }, [user?._id, updateStatus, currentStatus]);

  // Handle pending status updates
  useEffect(() => {
    if (!pendingStatusRef.current) return;

    const timer = setTimeout(() => {
      if (pendingStatusRef.current) {
        setStatus(pendingStatusRef.current as 'online' | 'away' | 'offline');
      }
    }, UPDATE_THROTTLE);

    return () => clearTimeout(timer);
  }, [setStatus]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only update to online if we were away and enough time has passed since last update
    if (currentStatus !== 'online' && (now - lastUpdateRef.current) >= UPDATE_THROTTLE) {
      setStatus('online');
    }
    
    timeoutRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity >= ACTIVITY_BUFFER) {
        setStatus('away');
      }
    }, INACTIVITY_TIMEOUT);
  }, [setStatus, currentStatus]);

  // Handle window unload to set offline status
  useEffect(() => {
    const handleUnload = () => {
      if (user?._id) {
        // Synchronous update for window close
        const beaconData = JSON.stringify({ userId: user._id, status: 'offline' });
        navigator.sendBeacon('/api/status', beaconData);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;

    // Reset unmounting flag when user changes
    unmountingRef.current = false;

    // Events to track
    const events = [
      'mousedown',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'input',
      'focus'
    ];

    // Throttled event handler
    let isHandling = false;
    const handleActivity = () => {
      if (isHandling) return;
      isHandling = true;
      
      resetTimer();
      
      setTimeout(() => {
        isHandling = false;
      }, 1000);
    };

    // Set initial status with delay if offline
    if (currentStatus === 'offline') {
      const timer = setTimeout(() => {
        setStatus('online');
      }, 2000);
      return () => clearTimeout(timer);
    } else if (!currentStatus) {
      setStatus('online');
    }

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Set up page visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setStatus('away');
      } else {
        resetTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Only set to offline if the window is actually closing
      if (unmountingRef.current) {
        setStatus('offline');
      } else {
        setStatus('away');
      }
    };
  }, [user?._id, resetTimer, setStatus, currentStatus]);

  // Set unmounting flag when component is about to unmount
  useEffect(() => {
    return () => {
      unmountingRef.current = true;
    };
  }, []);
} 
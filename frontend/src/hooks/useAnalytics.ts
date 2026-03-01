import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

const SESSION_KEY = 'bewithstar_session_id';

const getSessionId = () => {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
};

export const useAnalytics = () => {
    const location = useLocation();

    const trackEvent = useCallback(async (event_type: string, extra: any = {}) => {
        try {
            await axios.post(`${API_BASE_URL}/api/analytics/track`, {
                event_type,
                page: location.pathname,
                session_id: getSessionId(),
                ...extra
            });
        } catch (err) {
            // Silently fail to not interrupt user experience
        }
    }, [location.pathname]);

    useEffect(() => {
        // Track page view on route change
        trackEvent('page_view');

        // Track session duration using session start time
        const startTime = Date.now();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                const duration = Date.now() - startTime;
                const data = JSON.stringify({
                    event_type: 'page_exit',
                    page: location.pathname,
                    session_id: getSessionId(),
                    duration_ms: duration
                });

                const blob = new Blob([data], { type: 'application/json' });
                navigator.sendBeacon(`${API_BASE_URL}/api/analytics/track`, blob);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            // Send final duration on cleanup (component unmount/route change)
            const duration = Date.now() - startTime;
            if (duration > 1000) { // Only track if it was a significant stay
                trackEvent('page_stay', { duration_ms: duration });
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [location.pathname, trackEvent]);

    return { trackEvent };
};

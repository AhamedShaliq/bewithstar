const getApiBaseUrl = () => {
    // If running on server-side
    if (typeof window === 'undefined') {
        return 'https://api.dazzbit.com';
    }

    // Environment variable priority (e.g. from .env.production)
    if (import.meta.env && import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    const { hostname } = window.location;

    // Production domain fallback
    if (hostname.includes('dazzbit.com')) {
        return 'https://api.dazzbit.com';
    }

    // Local development fallback
    return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();
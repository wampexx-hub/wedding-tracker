import { useState, useEffect } from 'react';

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const CACHE_KEY = 'live_rates_cache_v2';

export const useLiveRates = () => {
    const [rates, setRates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Format timestamp as HH:mm
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Check if cached data is still valid
    const getCachedData = () => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;

            if (age < CACHE_DURATION) {
                console.log('[useLiveRates] Using cached rates (age: ' + Math.round(age / 1000 / 60) + ' minutes)');
                setLastUpdated(formatTime(timestamp));
                return data;
            }

            console.log('[useLiveRates] Cache expired, fetching fresh data');
            return null;
        } catch (err) {
            console.error('[useLiveRates] Cache read error:', err);
            return null;
        }
    };

    // Save data to cache
    const setCachedData = (data) => {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (err) {
            console.error('[useLiveRates] Cache write error:', err);
        }
    };

    // Fetch rates from BACKEND /api/rates (NOT external API)
    const fetchLiveRates = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first
            const cachedRates = getCachedData();
            if (cachedRates) {
                setRates(cachedRates);
                setLoading(false);
                return;
            }

            console.log('[useLiveRates] Fetching from backend /api/rates');

            // Fetch from BACKEND (same source as useExchangeRates)
            const response = await fetch('/api/rates', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error('Backend API request failed');
            }

            const data = await response.json();

            // Normalize GRAM_GOLD to GRAM for frontend compatibility
            if (data.GRAM_GOLD && !data.GRAM) {
                data.GRAM = data.GRAM_GOLD;
            }

            console.log('[useLiveRates] Received rates:', data);

            // Cache the result
            const now = Date.now();
            setCachedData(data);
            setRates(data);
            setLastUpdated(formatTime(now));
            setLoading(false);

        } catch (err) {
            console.error('[useLiveRates] Failed to fetch rates:', err);
            setError(err.message);

            // Try to use cached data even if expired
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { data } = JSON.parse(cached);
                    console.log('[useLiveRates] Using expired cache due to fetch error');
                    setRates(data);
                }
            } catch (cacheErr) {
                console.error('[useLiveRates] Cache fallback failed:', cacheErr);
            }

            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveRates();
    }, []);

    return { rates, loading, error, lastUpdated, refetch: fetchLiveRates };
};

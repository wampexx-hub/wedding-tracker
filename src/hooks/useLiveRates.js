import { useState, useEffect } from 'react';

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const CACHE_KEY = 'live_rates_cache';

export const useLiveRates = () => {
    const [rates, setRates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const API_HEADERS = {
        'authorization': 'apikey 3epid0rmlyrx2GwGtde3bc:27i7tCJtDNJA0VsofnBPk1',
        'content-type': 'application/json'
    };

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
                console.log('Using cached rates (age: ' + Math.round(age / 1000 / 60) + ' minutes)');
                setLastUpdated(formatTime(timestamp));
                return data;
            }

            console.log('Cache expired, fetching fresh data');
            return null;
        } catch (err) {
            console.error('Cache read error:', err);
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
            console.error('Cache write error:', err);
        }
    };

    // Normalize API response to internal format
    const normalizeRates = (goldData, currencyData) => {
        const normalized = {};

        // Map gold prices
        if (goldData?.result) {
            goldData.result.forEach(item => {
                const buying = parseFloat(item.buying);
                if (item.name === 'Gram Altın') normalized.GRAM = buying;
                else if (item.name === 'Çeyrek Altın') normalized.CEYREK = buying;
                else if (item.name === 'Yarım Altın') normalized.YARIM = buying;
                else if (item.name === 'Tam Altın') normalized.TAM = buying;
            });
        }

        // Map currency rates
        if (currencyData?.result) {
            currencyData.result.forEach(item => {
                const buying = parseFloat(item.buying);
                if (item.code === 'USD') normalized.USD = buying;
                else if (item.code === 'EUR') normalized.EUR = buying;
                else if (item.code === 'GBP') normalized.GBP = buying;
            });
        }

        return normalized;
    };

    // Fetch live rates from API
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

            // Fetch from both endpoints in parallel
            const [goldResponse, currencyResponse] = await Promise.all([
                fetch('https://api.collectapi.com/economy/goldPrice', {
                    method: 'GET',
                    headers: API_HEADERS
                }),
                fetch('https://api.collectapi.com/economy/allCurrency', {
                    method: 'GET',
                    headers: API_HEADERS
                })
            ]);

            if (!goldResponse.ok || !currencyResponse.ok) {
                throw new Error('API request failed');
            }

            const goldData = await goldResponse.json();
            const currencyData = await currencyResponse.json();

            // Normalize and combine data
            const normalizedRates = normalizeRates(goldData, currencyData);

            // Cache the result
            const now = Date.now();
            setCachedData(normalizedRates);
            setRates(normalizedRates);
            setLastUpdated(formatTime(now));
            setLoading(false);

        } catch (err) {
            console.error('Failed to fetch live rates:', err);
            setError(err.message);

            // Try to use cached data even if expired
            const cachedRates = getCachedData();
            if (cachedRates) {
                console.log('Using expired cache due to fetch error');
                setRates(cachedRates);
            }

            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveRates();
    }, []);

    return { rates, loading, error, lastUpdated, refetch: fetchLiveRates };
};

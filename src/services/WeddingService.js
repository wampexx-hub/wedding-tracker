const config = {
    apiUrl: ''
};

export const setApiUrl = (url) => { config.apiUrl = url; };

const WeddingService = {
    // Base URL from environment or configuration
    get API_URL() { return config.apiUrl; },

    // Simulate API delay
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    // Get all dashboard data
    getDashboardData: async (username) => {
        try {
            const response = await fetch(`${WeddingService.API_URL}/api/data?user=${username}`, {
                cache: 'no-store', // Force fresh data
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to fetch data');
            }

            const data = await response.json();

            // Get budgetIncluded from user settings
            const userResponse = await fetch(`${WeddingService.API_URL}/api/portfolio/${username}`);
            const userData = userResponse.ok ? await userResponse.json() : { budgetIncluded: false };

            return {
                expenses: data.expenses || [],
                budget: data.budget || 0,
                weddingDate: data.weddingDate || null,
                assets: data.assets || [],
                portfolio: data.portfolio || [], // Now from /api/data
                budgetIncluded: userData.budgetIncluded,
                usersMap: data.usersMap || {}
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            alert(`Error Dashboard:\nUser: "${username}"\nURL: ${WeddingService.API_URL}/api/data\nMessage: ${error.message}`);
            throw error;
        }
    },

    // Get Assets
    getAssets: async (username) => {
        // await WeddingService.delay(600); // Removed artificial delay
        try {
            // FIXED: Route should be /api/assets, not /api/user/assets
            const response = await fetch(`${WeddingService.API_URL}/api/assets?username=${username}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to fetch assets');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching assets:', error);
            alert(`Error Fetching Assets:\nUser: "${username}"\nMessage: ${error.message}`);
            throw error;
        }
    },

    // Add Asset
    // Add Asset (Real Backend)
    addAsset: async (username, asset) => {
        try {
            const response = await fetch(`${WeddingService.API_URL}/api/assets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, asset })
            });
            if (!response.ok) throw new Error('Failed to add asset');
            return await response.json();
        } catch (error) {
            console.error('Error adding asset:', error);
            throw error;
        }
    },

    // Delete Asset (Real Backend)
    deleteAsset: async (username, assetId) => {
        try {
            const response = await fetch(`${WeddingService.API_URL}/api/user/assets/${assetId}?username=${username}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete asset');
            return await response.json();
        } catch (error) {
            console.error('Error deleting asset:', error);
            throw error;
        }
    },

    // Update Asset
    updateAsset: async (username, assetId, asset) => {
        try {
            const response = await fetch(`${WeddingService.API_URL}/api/user/assets/${assetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, asset })
            });
            if (!response.ok) throw new Error('Failed to update asset');
            return await response.json();
        } catch (error) {
            console.error('Error updating asset:', error);
            throw error;
        }
    },

    // Set Wedding Date
    setWeddingDate: async (username, date) => {
        await WeddingService.delay(600); // Simulate network delay
        try {
            const response = await fetch(`${WeddingService.API_URL}/api/wedding-date`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, date })
            });
            if (!response.ok) throw new Error('Failed to set wedding date');
            return await response.json();
        } catch (error) {
            console.error('Error setting wedding date:', error);
            throw error;
        }
    },

    // Get Exchange Rates (from Backend - Cached)
    getExchangeRates: async () => {
        try {
            const response = await fetch(`${WeddingService.API_URL}/api/rates`);
            if (!response.ok) throw new Error('Failed to fetch exchange rates');
            const data = await response.json();
            if (data.GRAM_GOLD && !data.GRAM) {
                data.GRAM = data.GRAM_GOLD;
            }
            return data;
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            // Fallback to defaults if API fails
            return {
                USD: 35.80,
                EUR: 37.50,
                GBP: 44.00,
                GRAM_GOLD: 3100,
                CEYREK: 5100,
                YARIM: 10200,
                TAM: 20400,
                CUMHURIYET: 21000
            };
        }
    },

    // Get Pending Partnerships
    getPendingPartnerships: async (username) => {
        try {
            const response = await fetch(`${WeddingService.API_URL}/api/partnership/pending?username=${username}`);
            if (!response.ok) throw new Error('Failed to fetch pending partnerships');
            const data = await response.json();
            return data.invitations || [];
        } catch (error) {
            console.error('Error fetching pending partnerships:', error);
            return [];
        }
    }
};

export default WeddingService;


const WeddingService = {
    // Base URL from environment or empty for relative path
    API_URL: import.meta.env.VITE_API_BASE_URL || '',

    // Simulate API delay
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    // Get all dashboard data
    getDashboardData: async (username) => {
        // await WeddingService.delay(800); // Removed artificial delay
        try {
            const [dataResponse, portfolioResponse] = await Promise.all([
                fetch(`${WeddingService.API_URL}/api/data?user=${username}`),
                fetch(`${WeddingService.API_URL}/api/portfolio/${username}`)
            ]);

            if (!dataResponse.ok) {
                const errorText = await dataResponse.text();
                throw new Error(errorText || 'Failed to fetch data');
            }

            const data = await dataResponse.json();
            const portfolioData = portfolioResponse.ok ? await portfolioResponse.json() : { portfolio: [] };

            return {
                expenses: data.expenses || [],
                budget: data.budget || 0,
                weddingDate: data.weddingDate || null,
                assets: data.assets || [],
                portfolio: portfolioData.portfolio || []
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

    // Get Exchange Rates (Restored for Modal Calculation)
    // Get Exchange Rates (Live from finans.truncgil.com)
    getExchangeRates: async () => {
        try {
            const response = await fetch('https://finans.truncgil.com/today.json');
            if (!response.ok) throw new Error('Failed to fetch exchange rates');
            const data = await response.json();

            const parseTurkishNumber = (val) => {
                if (!val) return 0;
                // Remove dots (thousands separator) and replace comma with dot (decimal separator)
                return parseFloat(val.replace(/\./g, '').replace(',', '.'));
            };

            // Map API keys to internal keys
            // We use "Satış" (Selling) rate
            return {
                USD: parseTurkishNumber(data.USD.Satış),
                EUR: parseTurkishNumber(data.EUR.Satış),
                GRAM_GOLD: parseTurkishNumber(data['gram-altin'].Satış),
                CEYREK: parseTurkishNumber(data['ceyrek-altin'].Satış),
                YARIM: parseTurkishNumber(data['yarim-altin'].Satış),
                TAM: parseTurkishNumber(data['tam-altin'].Satış),
                CUMHURIYET: parseTurkishNumber(data['cumhuriyet-altini'].Satış)
            };
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            // Fallback to defaults if API fails
            return {
                USD: 35.80,
                EUR: 37.50,
                GRAM_GOLD: 3100,
                CEYREK: 5100,
                YARIM: 10200,
                TAM: 20400,
                CUMHURIYET: 21000
            };
        }
    }
};

export default WeddingService;

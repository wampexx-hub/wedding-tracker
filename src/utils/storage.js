/**
 * Default Web Storage Adapter using localStorage.
 * All methods are async to assume common interface with AsyncStorage.
 */
export const webStorage = {
    getItem: async (key) => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem(key);
        }
        return null;
    },
    setItem: async (key, value) => {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
        }
    },
    removeItem: async (key) => {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
        }
    }
};

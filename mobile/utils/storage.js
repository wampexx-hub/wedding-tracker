import AsyncStorage from '@react-native-async-storage/async-storage';

export const mobileStorage = {
    getItem: async (key) => {
        try {
            return await AsyncStorage.getItem(key);
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },
    setItem: async (key, value) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (e) {
            console.error('Storage set error:', e);
        }
    },
    removeItem: async (key) => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (e) {
            console.error('Storage remove error:', e);
        }
    }
};

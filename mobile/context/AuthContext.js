import React, { createContext, useState, useContext, useEffect } from 'react';
import { mobileStorage } from '../utils/storage';
import { Alert } from 'react-native';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const savedUser = await mobileStorage.getItem('wedding_app_user');
                if (savedUser) {
                    const parsedUser = JSON.parse(savedUser);
                    if (parsedUser && (parsedUser.username || parsedUser.email)) {
                        console.log('Loaded user from storage:', parsedUser.username);
                        setUser(parsedUser);
                    } else {
                        await mobileStorage.removeItem('wedding_app_user');
                    }
                } else {
                    setUser(null);
                }
            } catch (e) {
                console.error('Storage error:', e);
                await mobileStorage.removeItem('wedding_app_user');
            }
            setIsLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await fetch('https://dugunbutcem.com/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                await mobileStorage.setItem('wedding_app_user', JSON.stringify(data.user));
                return { success: true };
            } else {
                Alert.alert('Giriş Başarısız', data.message);
                return { success: false, message: data.message };
            }
        } catch {
            Alert.alert('Hata', 'Sunucu hatası.');
            return { success: false, message: 'Sunucu hatası.' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch('https://dugunbutcem.com/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                await mobileStorage.setItem('wedding_app_user', JSON.stringify(data.user));
                return { success: true };
            } else {
                Alert.alert('Kayıt Başarısız', data.message);
                return { success: false, message: data.message };
            }
        } catch {
            Alert.alert('Hata', 'Sunucu hatası.');
            return { success: false, message: 'Sunucu hatası.' };
        }
    };

    const logout = async () => {
        setUser(null);
        await mobileStorage.removeItem('wedding_app_user');
    };

    const updateUser = async (userData) => {
        const newUser = { ...user, ...userData };
        setUser(newUser);
        await mobileStorage.setItem('wedding_app_user', JSON.stringify(newUser));
    };

    console.log('AuthProvider rendering - user:', user?.username, 'isLoading:', isLoading);

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

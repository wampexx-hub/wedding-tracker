import React, { createContext, useState, useContext, useEffect } from 'react';
import { webStorage } from '../utils/storage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children, storage = webStorage }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const savedUser = await storage.getItem('wedding_app_user');
                if (savedUser) {
                    const parsedUser = JSON.parse(savedUser);
                    if (parsedUser && (parsedUser.username || parsedUser.email)) {
                        // Validate with server session
                        try {
                            const response = await fetch('/api/auth/validate');
                            if (response.ok) {
                                const data = await response.json();
                                if (data.success) {
                                    setUser(data.user);
                                } else {
                                    // Server session invalid, clear localStorage
                                    await storage.removeItem('wedding_app_user');
                                    setUser(null);
                                }
                            } else {
                                // Server session invalid, clear localStorage
                                await storage.removeItem('wedding_app_user');
                                setUser(null);
                            }
                        } catch (serverError) {
                            // Server unreachable, use localStorage (offline mode)
                            console.warn('Server validation failed, using cached user:', serverError);
                            setUser(parsedUser);
                        }
                    } else {
                        await storage.removeItem('wedding_app_user');
                    }
                } else {
                    // No localStorage, check if server session exists
                    try {
                        const response = await fetch('/api/auth/validate');
                        if (response.ok) {
                            const data = await response.json();
                            if (data.success) {
                                setUser(data.user);
                                await storage.setItem('wedding_app_user', JSON.stringify(data.user));
                            }
                        }
                    } catch (serverError) {
                        // Ignore server errors during validation
                    }
                }
            } catch (e) {
                await storage.removeItem('wedding_app_user');
            }
            setLoading(false);
        };
        loadUser();
    }, [storage]);

    const login = async (email, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                await storage.setItem('wedding_app_user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: 'Sunucu hatası.' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                await storage.setItem('wedding_app_user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: 'Sunucu hatası.' };
        }
    };

    const logout = async () => {
        try {
            // Call server logout to destroy session
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            // Continue with local logout even if server fails
            console.warn('Server logout failed:', error);
        }
        
        setUser(null);
        await storage.removeItem('wedding_app_user');
    };

    const updateUser = async (userData) => {
        const newUser = { ...user, ...userData };
        setUser(newUser);
        await storage.setItem('wedding_app_user', JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

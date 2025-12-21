import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(username, password);
        if (result.success) {
            // Check if user is actually admin
            // Since login updates the context, we can check the user object from context, 
            // but here we might need to wait for state update or check the returned user if login returned it.
            // However, the login function in AuthContext returns { success: true } but doesn't return the user object directly.
            // We can rely on the fact that if login is successful, the user is set.
            // But we need to check isAdmin. 
            // Let's assume the user object in localStorage/context has isAdmin.
            // We might need to refresh the page or rely on the updated context.
            // Actually, let's just navigate to /admin. The AdminRoute will handle the protection.
            navigate('/admin');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Girişi</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Kullanıcı Adı</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gray-800 text-white p-2 rounded hover:bg-gray-700 transition duration-200"
                    >
                        Giriş Yap
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;

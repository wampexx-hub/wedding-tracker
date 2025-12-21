import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Register from './Register';
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const googleUser = params.get('googleAuthUser');
        const errorParam = params.get('error');

        if (googleUser) {
            try {
                const user = JSON.parse(decodeURIComponent(googleUser));
                localStorage.setItem('wedding_app_user', JSON.stringify(user));
                window.location.href = '/';
            } catch (e) {
                console.error('Error parsing google user', e);
                setError('Google girişi başarısız oldu.');
            }
        } else if (errorParam) {
            setError('Google girişi başarısız oldu.');
        }
    }, []);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (email.trim() && password.trim()) {
            const result = await login(email.trim(), password.trim());
            if (result.success) {
                navigate('/');
            } else {
                setError(result.message);
            }
        }
        setIsLoading(false);
    };

    const handleGoogleLogin = () => {
        window.location.href = '/api/auth/google';
    };

    if (isRegistering) {
        return <Register onSwitchToLogin={() => setIsRegistering(false)} />;
    }

    return (
        <div className="flex min-h-screen relative">
            {/* Mobile Background Image (Absolute) */}
            <div className="absolute inset-0 md:hidden z-0">
                <img
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    alt="Wedding Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Left Side - Image Section (Desktop Only) */}
            <div className="hidden md:flex w-1/2 relative bg-gray-900 overflow-hidden z-10">
                <img
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    alt="Wedding Couple"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Logo - Top Left with Animation */}
                <div className="absolute top-10 left-10 z-20 flex items-center gap-4 animate-slide-down-fade">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                        <Heart className="text-white" size={24} fill="currentColor" />
                    </div>
                    <span className="text-white font-serif text-3xl font-medium tracking-wide drop-shadow-md">Düğün Bütçem</span>
                </div>

                <div className="relative z-10 flex flex-col justify-end p-16 text-white h-full pb-24">
                    <div className="mb-6">
                        <h1 className="font-serif text-5xl font-medium leading-tight mb-4 drop-shadow-lg">
                            Hayallerinizdeki düğünü,<br />bütçenizi aşmadan planlayın.
                        </h1>
                        <p className="text-gray-100 text-lg font-light max-w-md drop-shadow-md">
                            Düğün Bütçem ile her detayı kontrol altında tutun, sürpriz harcamalardan kaçının.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form Container */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-16 z-10 relative">
                {/* Card Wrapper: Glassmorphism on Mobile, Transparent on Desktop */}
                <div className="w-full max-w-md bg-white/85 backdrop-blur-md border border-white/60 md:bg-transparent md:backdrop-blur-none md:border-none rounded-[20px] md:rounded-none shadow-2xl md:shadow-none p-8 md:p-0">
                    {/* Mobile Logo (Inside Card) */}
                    <div className="flex md:hidden flex-col items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-champagne/10 rounded-full flex items-center justify-center">
                            <Heart className="text-champagne" size={24} fill="currentColor" />
                        </div>
                        <span className="text-gray-900 font-serif text-2xl font-medium tracking-wide">Düğün Bütçem</span>
                    </div>

                    <div className="text-center md:text-left">
                        <h2 className="font-serif text-4xl text-gray-900 mb-3">Hoşgeldiniz</h2>
                        <p className="text-gray-500 text-lg">Düğün ve ev kurma sürecinizi keyifle planlayın.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md mt-6">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                        <div className="space-y-5">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-champagne transition-colors" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full pl-11 pr-4 py-4 bg-[#F9FAFB] border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition-all duration-200"
                                    placeholder="E-posta Adresi"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-champagne transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full pl-11 pr-4 py-4 bg-[#F9FAFB] border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne transition-all duration-200"
                                    placeholder="Şifre"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-champagne focus:ring-champagne border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500">
                                    Beni hatırla
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-gray-600 hover:text-champagne transition-colors">
                                    Şifremi unuttum?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                background: 'linear-gradient(to right, #D4AF37, #C59D24)',
                                boxShadow: '0 4px 14px 0 rgba(212, 175, 55, 0.39)'
                            }}
                            className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-champagne transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </button>
                    </form>

                    <div className="relative mt-8 mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500 font-medium">veya</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        type="button"
                        className="w-full flex justify-center items-center py-4 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200"
                    >
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google ile Giriş Yap
                    </button>

                    <p className="text-center text-sm text-gray-500 mt-8">
                        Hesabınız yok mu?{' '}
                        <button
                            onClick={() => setIsRegistering(true)}
                            className="font-medium text-gray-900 hover:text-champagne transition-colors"
                        >
                            Hemen Kayıt Olun
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

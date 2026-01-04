import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { Calendar, MapPin, ArrowRight, Users, BarChart3, CalendarClock } from 'lucide-react';
import { getLocalTimeZone, today, parseDate } from '@internationalized/date';
import Select, { components } from 'react-select';
import { DatePicker } from './DatePicker';
import illustration from '../assets/minimalist-wedding.png';

const TURKISH_CITIES = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
    "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
    "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
    "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
    "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
    "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
    "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
].map(city => ({ value: city, label: city }));

const BUDGET_RANGES = [
    { value: '250k-', label: '250.000₺ Altı' },
    { value: '250k-500k', label: '250.000₺ - 500.000₺' },
    { value: '500k-1M', label: '500.000₺ - 1.000.000₺' },
    { value: '1M+', label: '1.000.000₺ Üstü' }
];

// Custom Dropdown Indicator for Untitled UI look
const DropdownIndicator = (props) => {
    return (
        <components.DropdownIndicator {...props}>
            <ArrowRight size={20} className="text-gray-500 rotate-90" />
        </components.DropdownIndicator>
    );
};

const Onboarding = () => {
    const { user, updateUser } = useAuth();
    const { triggerRefresh } = useExpenses();
    const navigate = useNavigate();

    // Default date: Today
    const [weddingDate, setWeddingDate] = useState(today(getLocalTimeZone()));
    const [city, setCity] = useState(null);
    const [budgetRange, setBudgetRange] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!user) return <Navigate to="/login" />;
    if (user.wedding_date && user.city) return <Navigate to="/" />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!weddingDate || !city || !budgetRange) {
            setError('Lütfen tüm alanları doldurun.');
            setLoading(false);
            return;
        }

        try {
            // Convert CalendarDate to DD.MM.YYYY format
            const dateString = `${weddingDate.year}-${String(weddingDate.month).padStart(2, '0')}-${String(weddingDate.day).padStart(2, '0')}`;

            const response = await fetch('/api/user/complete-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    weddingDate: dateString,
                    city: city.value,
                    budgetRange: budgetRange.value
                }),
            });

            const data = await response.json();

            if (data.success) {
                updateUser(data.user);
                // Trigger context refresh to load wedding date
                if (triggerRefresh) {
                    await triggerRefresh();
                }
                // Small delay to ensure data is loaded
                await new Promise(resolve => setTimeout(resolve, 300));
                navigate('/');
            } else {
                setError(data.error || 'Bir hata oluştu.');
            }
        } catch (err) {
            setError('Sunucu hatası.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        setLoading(true);
        try {
            // Set default values: 1 year from now, Istanbul, mid-range budget
            const defaultDate = today(getLocalTimeZone()).add({ months: 12 });
            const dateString = `${defaultDate.year}-${String(defaultDate.month).padStart(2, '0')}-${String(defaultDate.day).padStart(2, '0')}`;

            const response = await fetch('/api/user/complete-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    weddingDate: dateString,
                    city: 'İstanbul',
                    budgetRange: '250k-500k'
                }),
            });

            const data = await response.json();

            if (data.success) {
                updateUser(data.user);
                // Trigger context refresh
                if (triggerRefresh) {
                    await triggerRefresh();
                }
                await new Promise(resolve => setTimeout(resolve, 300));
                navigate('/');
            }
        } catch (err) {
            console.error('Skip error:', err);
            navigate('/'); // Navigate anyway
        } finally {
            setLoading(false);
        }
    };

    const setQuickDate = (monthsToAdd) => {
        const now = today(getLocalTimeZone());
        const newDate = now.add({ months: monthsToAdd });
        setWeddingDate(newDate);
    };

    const setNextSummer = () => {
        const now = today(getLocalTimeZone());
        const nextYear = now.year + 1;
        setWeddingDate(parseDate(`${nextYear}-06-15`));
    };

    // Custom styles for React Select (Non-searchable)
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: 'white',
            borderColor: state.isFocused ? '#D4AF37' : '#D0D5DD',
            borderRadius: '0.5rem',
            padding: isMobile ? '0.1rem' : '0.25rem',
            minHeight: '44px',
            boxShadow: state.isFocused ? '0 0 0 4px rgba(212, 175, 55, 0.1)' : '0 1px 2px rgba(16, 24, 40, 0.05)',
            fontSize: '16px',
            cursor: 'pointer',
            '&:hover': {
                borderColor: '#D4AF37'
            }
        }),
        input: (provided) => ({ ...provided, fontSize: '16px' }),
        singleValue: (provided) => ({ ...provided, fontSize: '16px', color: '#101828' }),
        placeholder: (provided) => ({ ...provided, color: '#667085' }),
        menu: (provided) => isMobile ? ({
            ...provided,
            position: 'fixed',
            top: 'auto !important',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            marginBottom: 0,
            borderRadius: '1.5rem 1.5rem 0 0',
            padding: '1rem',
            paddingBottom: '2rem',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
            zIndex: 99999,
            animation: 'slideUp 0.3s ease-out'
        }) : ({
            ...provided,
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 9999,
            marginTop: '4px'
        }),
        menuPortal: (base) => ({ ...base, zIndex: 99999 }),
        menuList: (provided) => isMobile ? ({
            ...provided,
            maxHeight: '40vh',
            paddingBottom: '20px'
        }) : provided,
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#F9FAFB' : state.isFocused ? '#F9FAFB' : 'white',
            color: state.isSelected ? '#101828' : '#344054',
            fontWeight: state.isSelected ? '500' : '400',
            cursor: 'pointer',
            padding: '10px 14px',
            fontSize: '16px',
            '&:active': {
                backgroundColor: '#F2F4F7'
            },
            backgroundImage: state.isSelected ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="%23D4AF37"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>')` : 'none',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            backgroundSize: '1.2em'
        })
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-0 md:p-8 bg-stone-50 overflow-hidden">

            {/* Dotted Background with Glow */}
            <div className="absolute inset-0 z-0 bg-dot-pattern opacity-40 pointer-events-none"></div>
            <div className="absolute inset-0 z-0 bg-gradient-to-tr from-amber-50/80 via-transparent to-stone-100/80 pointer-events-none"></div>

            {/* Center Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-champagne/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 bg-white/80 backdrop-blur-2xl border-none md:border border-white/60 shadow-none md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-none md:rounded-[2rem] w-full max-w-5xl flex flex-col md:flex-row h-full md:h-auto overflow-y-auto md:overflow-hidden">

                {/* Left Side: Illustration & Welcome */}
                <div className="md:w-5/12 p-5 pt-8 md:p-12 flex flex-row md:flex-col items-center md:justify-center text-left md:text-center bg-gradient-to-br from-white/50 to-amber-50/30 border-b md:border-b-0 md:border-r border-gray-100 gap-4 md:gap-0 shrink-0">
                    <div className="relative group shrink-0">
                        <div className="absolute inset-0 bg-champagne/20 rounded-full blur-2xl transform group-hover:scale-110 transition-transform duration-700 hidden md:block"></div>
                        <img src={illustration} alt="Wedding Planning" className="relative w-16 md:w-48 h-auto drop-shadow-sm transform group-hover:-translate-y-2 transition-transform duration-500" />
                    </div>

                    <div className="flex-1 md:flex-none w-full">
                        <h1 className="font-serif text-2xl md:text-4xl text-gray-900 mb-1 md:mb-4 tracking-tight leading-tight">
                            Düğün Bütçeni<br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-champagne to-amber-600"> Oluştur</span> 💰
                        </h1>
                        <p className="text-gray-500 text-sm md:text-lg leading-relaxed font-light md:max-w-xs mx-auto hidden md:block mb-8">
                            Düğün ve ev kurma masraflarını tek yerden yönet, sürprizlerle karşılaşma.
                        </p>
                        <p className="text-gray-500 text-xs leading-relaxed font-light md:hidden">
                            Masraflarını yönet, sürpriz yaşama.
                        </p>

                        {/* Feature Highlights - Desktop Only */}
                        <div className="hidden md:block space-y-4 text-left mt-6">
                            {/* Feature 1 - Outline Icons */}
                            <div className="flex items-start gap-3 group">
                                <div className="shrink-0 transform group-hover:scale-110 transition-transform">
                                    <Users size={24} className="text-champagne" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-serif text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-champagne to-amber-600 mb-0.5">
                                        Birlikte Yönet
                                    </h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Partnerini davet et, harcamaları ve bütçeyi eş zamanlı takip edin.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="flex items-start gap-3 group">
                                <div className="shrink-0 transform group-hover:scale-110 transition-transform">
                                    <BarChart3 size={24} className="text-champagne" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-serif text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-champagne to-amber-600 mb-0.5">
                                        Akıllı Analiz
                                    </h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Tüm giderler tek ekranda, sürpriz masraf yok.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="flex items-start gap-3 group">
                                <div className="shrink-0 transform group-hover:scale-110 transition-transform">
                                    <CalendarClock size={24} className="text-champagne" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-serif text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-champagne to-amber-600 mb-0.5">
                                        Taksit Takvimi
                                    </h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Ödemelerini gününde hatırla, nakit akışını yönet.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="md:w-7/12 p-5 md:p-12 bg-white/40 flex flex-col justify-start md:justify-center pb-32 md:pb-12 relative">

                    {/* Skip Button - Top Right */}
                    <button
                        onClick={handleSkip}
                        disabled={loading}
                        className="absolute top-4 right-4 text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        Şimdilik Atla →
                    </button>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                        {/* Date Picker Section */}
                        <div className="space-y-2 md:space-y-3">
                            <label className="block text-xs md:text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
                                <Calendar size={14} className="text-champagne" />
                                DÜĞÜN TARİHİ
                            </label>

                            <DatePicker
                                aria-label="Düğün Tarihi"
                                value={weddingDate}
                                onChange={setWeddingDate}
                            />

                            {/* Quick Pickers */}
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => setQuickDate(6)} className="px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">
                                    +6 Ay
                                </button>
                                <button type="button" onClick={() => setQuickDate(12)} className="px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">
                                    +1 Yıl
                                </button>
                                <button type="button" onClick={setNextSummer} className="px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm flex items-center gap-1">
                                    Gelecek Yaz ☀️
                                </button>
                            </div>
                        </div>

                        {/* City Select Section */}
                        <div className="space-y-2 md:space-y-3">
                            <label className="block text-xs md:text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
                                <MapPin size={14} className="text-champagne" />
                                YAŞADIĞINIZ ŞEHİR
                            </label>
                            <Select
                                options={TURKISH_CITIES}
                                value={city}
                                onChange={setCity}
                                placeholder="Şehir seçin..."
                                styles={customSelectStyles}
                                isClearable
                                isSearchable={false}
                                components={{ DropdownIndicator }}
                                menuPortalTarget={document.body}
                                menuPlacement="auto"
                                className="text-base"
                            />
                        </div>

                        {/* Budget Range Section */}
                        <div className="space-y-2 md:space-y-3">
                            <label className="block text-xs md:text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
                                <BarChart3 size={14} className="text-champagne" />
                                TAHMİNİ BÜTÇE
                            </label>
                            <Select
                                options={BUDGET_RANGES}
                                value={budgetRange}
                                onChange={setBudgetRange}
                                placeholder="Bütçe aralığı seçin..."
                                styles={customSelectStyles}
                                isClearable
                                isSearchable={false}
                                components={{ DropdownIndicator }}
                                menuPortalTarget={document.body}
                                menuPlacement="auto"
                                className="text-base"
                            />
                        </div>

                        {/* Sticky Bottom Button for Mobile */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-gray-100 z-50 md:static md:bg-transparent md:p-0 md:border-none pb-safe">
                            {/* Micro-copy above button */}
                            <p className="text-sm text-gray-500 font-normal mb-3 text-center md:text-left">
                                Kurulum tamamlandı! Saniyeler içinde bütçeni yönetmeye başla.
                            </p>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-champagne to-amber-500 hover:from-champagne-hover hover:to-amber-600 text-white font-bold py-4 md:py-5 rounded-xl md:rounded-2xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed text-base md:text-lg"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Bütçe Paneline Git <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;

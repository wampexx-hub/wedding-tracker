import React, { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import WeddingService from '../services/WeddingService';
import { Wallet, CreditCard, Calendar, TrendingUp, Edit2, X, Heart, Loader2, Coins, Banknote, DollarSign, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import ExpenseLineChart from './ExpenseLineChart';
import DashboardSkeleton from './DashboardSkeleton';
import CategoryDetailModal from './CategoryDetailModal';
import MonthlyPaymentChart from './MonthlyPaymentChart';
import BurnRateWidget from './BurnRateWidget';
import TopSpendersCard from './TopSpendersCard';
import { useLiveRates } from '../hooks/useLiveRates';

const Dashboard = ({ setActiveTab, setExpenseFilter }) => {
    const { expenses: contextExpenses, getSummary, updateBudget } = useExpenses();
    const { user } = useAuth();
    const { rates } = useLiveRates();

    // Get summary data from context to ensure consistency (especially for budget)
    const summary = getSummary();
    const contextTotalBudget = summary.budget;

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        expenses: [],
        budget: 0,
        weddingDate: null,
        assets: { gold: 0, usd: 0, tl: 0 },
        portfolio: []
    });

    // Modals
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [tempDate, setTempDate] = useState('');


    // Fetch Data on Mount
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const data = await WeddingService.getDashboardData(user.username);
                setDashboardData(data);
                updateBudget(data.budget);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Sync expenses from context for real-time updates
    useEffect(() => {
        if (contextExpenses && contextExpenses.length >= 0) {
            setDashboardData(prev => ({
                ...prev,
                expenses: contextExpenses
            }));
        }
    }, [contextExpenses]);

    // Handle Date Save
    const handleSaveDate = async () => {
        if (tempDate) {
            setIsLoading(true);
            try {
                await WeddingService.setWeddingDate(user.username, tempDate);
                setDashboardData(prev => ({ ...prev, weddingDate: tempDate }));
                setIsDateModalOpen(false);
            } catch (error) {
                console.error("Failed to save date", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Derived Data
    const { expenses, budget, weddingDate, assets, portfolio } = dashboardData;

    const totalSpent = expenses
        .filter(e => e.status === 'purchased')
        .reduce((acc, curr) => acc + Number(curr.price), 0);
    const remainingBudget = budget - totalSpent;
    const totalInstallments = expenses
        .filter(e => e.status === 'purchased')
        .reduce((acc, curr) => acc + (curr.isInstallment ? Number(curr.monthlyPayment) : 0), 0);
    const totalCount = expenses.length;

    // Calculate Total Assets Value (Portfolio based)
    const totalAssetsValue = (portfolio || []).reduce((acc, asset) => {
        const rate = asset.type === 'TRY_CASH' ? 1 : (rates?.[asset.type] || 0);
        return acc + (asset.amount * rate);
    }, 0);

    // New Metrics for Refactor
    const totalPlanned = expenses
        .filter(e => e.status === 'planned')
        .reduce((acc, curr) => acc + Number(curr.price), 0);
    const plannedCount = expenses.filter(e => e.status === 'planned').length;
    const spentCount = expenses.filter(e => e.status === 'purchased').length;

    // Chart Logic
    const COLORS = [
        '#EAB308', // Primary (Gold/Brand)
        '#0F766E', // Secondary (Deep Teal)
        '#BE123C', // Accent (Rose/Pink)
        '#65A30D', // Natural (Sage Green)
        '#78716C'  // Neutral (Warm Gray)
    ];

    const processCategoryData = () => {
        const categoryMap = expenses
            .filter(e => e.status === 'purchased')
            .reduce((acc, curr) => {
                acc[curr.category] = (acc[curr.category] || 0) + Number(curr.price);
                return acc;
            }, {});

        const total = Object.values(categoryMap).reduce((a, b) => a + b, 0);

        return Object.entries(categoryMap)
            .map(([name, value]) => ({
                name,
                value,
                percentage: total > 0 ? (value / total) * 100 : 0
            }))
            .sort((a, b) => b.value - a.value);
    };

    const categoryData = processCategoryData();

    // Date Logic Helpers
    const getDaysDiff = (dateString) => {
        if (!dateString) return null;
        const today = new Date();
        const target = new Date(dateString);
        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    const daysDiff = getDaysDiff(weddingDate);
    const isPast = daysDiff !== null && daysDiff < 0;

    // Calculate Start Date (earliest purchased expense date or null)
    const purchasedExpenses = expenses.filter(e => e.status === 'purchased');
    const startDate = purchasedExpenses.length > 0
        ? purchasedExpenses.reduce((min, p) => p.date < min ? p.date : min, purchasedExpenses[0].date)
        : null;

    // Calculate Budget Health
    const spendingPercentage = contextTotalBudget > 0 ? (totalSpent / contextTotalBudget) * 100 : 0;
    const excessAmount = totalSpent - contextTotalBudget;

    let budgetHealth = 'safe'; // safe (<80%), warning (80-100%), danger (>100%)
    if (spendingPercentage > 100) budgetHealth = 'danger';
    else if (spendingPercentage >= 80) budgetHealth = 'warning';

    const getHeroMessage = () => {
        if (!weddingDate) return "Düğün planlamanıza başlamak için tarihi belirleyin.";
        if (budgetHealth === 'danger') return `🚨 DİKKAT: Bütçe Aşıldı! Limitinizi ${excessAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })} aştınız.`;
        if (budgetHealth === 'warning') return "Dikkat, bütçe sınırlarına yaklaşıyorsunuz!";
        if (isPast) return "Mutluluğunuz daim olsun.";
        return "Büyük güne çok az kaldı. Planlamanız harika gidiyor.";
    };

    const heroMessage = getHeroMessage();
    const heroColorClass = budgetHealth === 'danger' ? 'text-red-600 font-bold' : (budgetHealth === 'warning' ? 'text-amber-600' : 'text-gray-500');

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative">
            {/* Quick Actions - REMOVED */}

            {/* Date Modal */}
            {isDateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-serif text-xl font-bold text-gray-900">Düğün Tarihini Belirle</h3>
                            <button onClick={() => setIsDateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-500 text-sm">Büyük gün ne zaman?</p>
                            <input
                                type="date"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-champagne/50"
                                value={tempDate}
                                onChange={(e) => setTempDate(e.target.value)}
                            />
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsDateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                            <button onClick={handleSaveDate} className="px-6 py-2 bg-champagne text-white rounded-lg hover:bg-champagne-hover">Kaydet</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Hero Card (Premium Dark UI) */}
            <div className="block md:hidden mx-4 mt-4">
                <div className="relative bg-gradient-to-br from-slate-900 to-black text-white rounded-2xl shadow-xl p-6 overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-champagne/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -ml-5 -mb-5 blur-xl"></div>

                    <div className="relative z-10">
                        <h1 className="font-serif text-2xl font-bold mb-4">
                            Merhaba, {user?.name || user?.username} 👋
                        </h1>

                        <div className="flex items-center gap-4">
                            {/* Left Side: Time (Interactive Countdown Circle) */}
                            <div
                                className="relative w-16 h-16 flex items-center justify-center cursor-pointer active:scale-95 transition-transform duration-200"
                                onClick={() => setIsDateModalOpen(true)}
                            >
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="32" cy="32" r="28" stroke="#333" strokeWidth="3" fill="none" />
                                    <circle
                                        cx="32" cy="32" r="28"
                                        stroke={budgetHealth === 'danger' ? '#DC2626' : "#D4AF37"}
                                        strokeWidth="3" fill="none"
                                        strokeDasharray="175.9"
                                        strokeDashoffset={175.9 - (175.9 * (Math.max(0, 365 - daysDiff) / 365))}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-bold text-white">{daysDiff}</span>
                                    <div className="flex items-center gap-0.5">
                                        <span className="text-[10px] text-gray-400">Gün</span>
                                        <Edit2 className="w-2.5 h-2.5 text-gray-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Vertical Divider */}
                            <div className="h-12 w-px bg-white/10"></div>

                            {/* Right Side: Money (Remaining Budget) */}
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mb-1">KALAN BÜTÇE</p>
                                <p className="text-2xl font-bold text-white">
                                    {remainingBudget.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                </p>
                                <p className={`text-xs mt-1 ${budgetHealth === 'danger' ? 'text-red-400' : (budgetHealth === 'warning' ? 'text-amber-400' : 'text-emerald-400')}`}>
                                    {budgetHealth === 'danger'
                                        ? `Bütçe Aşıldı`
                                        : `%${Math.round((remainingBudget / contextTotalBudget) * 100)} Mevcut`
                                    }
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-400/80 border-t border-white/10 pt-3 mt-4">
                            {daysDiff > 180
                                ? "Zamanın bol, bütçeni rahatça planlayabilirsin. ☕"
                                : daysDiff >= 100
                                    ? "Harika gidiyorsun! Planların rayına oturuyor. ✨"
                                    : daysDiff >= 50
                                        ? "Yolun yarısı bitti! Harcamaları gözden geçirme vakti. 📉"
                                        : daysDiff >= 10
                                            ? "Son düzlük! Heyecan dorukta. 🚀"
                                            : "Büyük gün kapıda! Tadını çıkar. 💍"
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Desktop Hero Section (Hidden on Mobile) */}
            <div className="hidden md:flex bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-champagne/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10">
                    <h1 className="font-serif text-3xl md:text-4xl text-gray-900 mb-2">
                        Merhaba, {user?.name || user?.username}!
                    </h1>
                    <p className={`text-lg font-light ${heroColorClass}`}>
                        {heroMessage}
                    </p>
                </div>

                <div className="flex items-center gap-6 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 relative group">
                    <button
                        onClick={() => { setTempDate(weddingDate); setIsDateModalOpen(true); }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center text-gray-400 hover:text-champagne opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                        <Edit2 size={14} />
                    </button>

                    {!weddingDate ? (
                        <button
                            onClick={() => setIsDateModalOpen(true)}
                            className="flex items-center gap-2 text-champagne font-medium hover:text-champagne-hover transition-colors"
                        >
                            <Calendar size={20} />
                            <span>📅 Düğün Tarihini Belirle</span>
                        </button>
                    ) : (
                        <>
                            <div className="text-right">
                                <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                                    {isPast ? "Mutluluğun" : "Kalan Süre"}
                                </p>
                                <p className="font-serif text-2xl font-bold text-gray-900">
                                    {isPast ? `${Math.abs(daysDiff)}. Günü` : `${daysDiff} Gün`}
                                </p>
                            </div>
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                {isPast ? (
                                    <div className="bg-rose-50 p-3 rounded-full">
                                        <Heart className="text-rose-500 fill-rose-500" size={24} />
                                    </div>
                                ) : (
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="32" cy="32" r="28" stroke="#eee" strokeWidth="4" fill="none" />
                                        <circle
                                            cx="32" cy="32" r="28"
                                            stroke={budgetHealth === 'danger' ? '#DC2626' : "#D4AF37"}
                                            strokeWidth="4" fill="none"
                                            strokeDasharray="175.9"
                                            strokeDashoffset={175.9 - (175.9 * (Math.max(0, 365 - daysDiff) / 365))}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 px-4 md:px-0">
                {/* Card 1: Total Spent (Realized) */}
                <div
                    className="bg-white p-3 md:p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-50 hover:shadow-md transition-shadow duration-300 cursor-pointer group"
                    onClick={() => {
                        if (setExpenseFilter) setExpenseFilter('purchased');
                        setActiveTab('expenses');
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl transition-colors ${budgetHealth === 'danger' ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white'}`}>
                            <Banknote size={24} />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-medium px-2 py-1 bg-gray-50 rounded-lg text-gray-500">Gerçekleşen</span>
                            {budgetHealth === 'danger' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded-full mt-1">Over Budget</span>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Toplam Harcama</p>
                    <h3 className={`font-sans text-2xl font-bold transition-colors ${budgetHealth === 'danger' ? 'text-red-600' : 'text-gray-900 group-hover:text-rose-500'}`}>
                        {totalSpent.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                    </h3>
                    <p className="text-xs text-gray-400 mt-2">{spentCount} İşlem</p>
                </div>

                {/* Card 2: Planned Spending (New) */}
                <div
                    className="bg-white p-3 md:p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-50 hover:shadow-md transition-shadow duration-300 cursor-pointer group"
                    onClick={() => {
                        if (setExpenseFilter) setExpenseFilter('planned');
                        setActiveTab('expenses');
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <Clock size={24} />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-50 rounded-lg text-gray-500">Planlanan</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Planlanan Harcama</p>
                    <h3 className="font-sans text-2xl font-bold text-gray-900 group-hover:text-amber-500 transition-colors">
                        {totalPlanned.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                    </h3>
                    <p className="text-xs text-gray-400 mt-2">{plannedCount} İşlem</p>
                </div>

                {/* Card 3: Monthly Installments (Moved here) */}
                <div
                    className="bg-white p-3 md:p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-50 hover:shadow-md transition-shadow duration-300 cursor-pointer group"
                    onClick={() => setActiveTab('calendar')}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Calendar size={24} />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-50 rounded-lg text-gray-500">Aylık</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Taksit Yükü</p>
                    <h3 className="font-sans text-2xl font-bold text-gray-900 group-hover:text-blue-500 transition-colors">
                        {totalInstallments.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                    </h3>
                    <p className="text-xs text-gray-400 mt-2 opacity-0">Spacer</p>
                </div>

                {/* Card 4: Total Assets (Moved to end) */}
                <div
                    className="bg-white p-3 md:p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-50 hover:shadow-md transition-shadow duration-300 cursor-pointer group"
                    onClick={() => setActiveTab('currency')}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <Wallet size={24} />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-50 rounded-lg text-gray-500">Varlıklar</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Toplam Varlık</p>
                    <h3 className="font-sans text-2xl font-bold text-gray-900 group-hover:text-emerald-500 transition-colors">
                        {totalAssetsValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                    </h3>
                    <p className="text-xs text-gray-400 mt-2 opacity-0">Spacer</p>
                </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Donut Chart - Categories */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <div className="w-full flex justify-between items-center mb-8">
                        <h3 className="font-serif text-xl font-bold text-gray-900">Kategori Dağılımı</h3>
                        <button
                            onClick={() => setIsDetailModalOpen(true)}
                            className="text-sm text-champagne hover:text-champagne-hover font-medium"
                        >
                            Detaylar
                        </button>
                    </div>

                    {/* Recharts Donut Chart */}
                    <div className="w-64 h-64">
                        <ResponsiveContainer width={256} height={256}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="#ffffff"
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Inner White Circle Content */}
                    <div className="absolute inset-0 m-auto w-32 h-32 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <p className="text-gray-400 text-xs font-medium uppercase">Toplam</p>
                            <p className="text-gray-900 font-bold text-xl">
                                {totalSpent >= 1000 ? `₺${(totalSpent / 1000).toFixed(1)}k` : `₺${totalSpent}`}
                            </p>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        {categoryData.slice(0, 4).map((item, index) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-sm text-gray-600">{item.name} (%{Math.round(item.percentage)})</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Area Chart - Spending Trend */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-serif text-xl font-bold text-gray-900">Harcama Özeti</h3>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-champagne"></span>
                            <span className="text-xs text-gray-500">Aylık Harcama</span>
                        </div>
                    </div>

                    <div className="h-[300px] w-full relative">
                        <ExpenseLineChart expenses={expenses.filter(e => e.status === 'purchased')} />
                    </div>
                </div>
            </div>

            {/* Row 3: Monthly Payments - Full Width */}
            <div className="mb-8 min-h-[400px]">
                <MonthlyPaymentChart expenses={expenses} />
            </div>

            {/* Row 4: Spending Speed + Top Spenders - 50/50 Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Spending Speed - Card Style */}
                <div className="col-span-1 h-[350px]">
                    <BurnRateWidget
                        totalBudget={contextTotalBudget}
                        spentAmount={totalSpent}
                        weddingDate={weddingDate}
                        startDate={startDate}
                    />
                </div>

                {/* Top Spenders */}
                <div className="col-span-1 h-[350px]">
                    <TopSpendersCard expenses={expenses} />
                </div>
            </div>


            {/* Category Detail Modal */}
            <CategoryDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                data={categoryData}
                colors={COLORS}
            />

            {/* Mobile Spacer */}
            <div className="h-32 w-full flex-shrink-0" aria-hidden="true" />
        </div >
    );
};

export default Dashboard;

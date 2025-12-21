import React, { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const BurnRateWidget = ({ totalBudget, spentAmount, weddingDate, startDate, variant = 'default' }) => {
    const [showInfo, setShowInfo] = useState(false);

    // Calculate Budget Progress
    const budgetProgress = totalBudget > 0 ? Math.min((spentAmount / totalBudget) * 100, 100) : 0;

    // Calculate Time Progress
    const calculateTimeProgress = () => {
        if (!weddingDate) return 0;

        const start = startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
        const end = new Date(weddingDate);
        const today = new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

        if (today > end) return 100;
        if (today < start) return 0;

        const totalDuration = end - start;
        const elapsed = today - start;

        if (totalDuration <= 0) return 0;

        return Math.min((elapsed / totalDuration) * 100, 100);
    };

    const timeProgress = calculateTimeProgress() || 0;
    const isSpendingFast = budgetProgress > timeProgress + 5;

    // Get health message based on spending vs time
    const getHealthMessage = () => {
        const diff = budgetProgress - timeProgress;
        if (diff < -10) return { text: "Bütçe dostu ilerliyorsun ✅", color: "text-emerald-700", bg: "bg-emerald-50" };
        if (diff > 10) return { text: "Harcama hızını yavaşlat ⚠️", color: "text-rose-700", bg: "bg-rose-50" };
        return { text: "Dengeli ilerliyorsun 👍", color: "text-blue-700", bg: "bg-blue-50" };
    };

    const healthMessage = getHealthMessage();

    // Slim variant - horizontal status bar
    if (variant === 'slim') {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Left: Budget Progress */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bütçe Kullanımı</p>
                            <span className="text-sm font-bold text-gray-900">{Math.round(budgetProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-3 rounded-full transition-all duration-1000 ${isSpendingFast ? 'bg-rose-500' : 'bg-champagne'}`}
                                style={{ width: `${budgetProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Center: Health Message */}
                    <div className="text-center">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${healthMessage.bg}`}>
                            <p className={`text-sm font-semibold ${healthMessage.color}`}>
                                {healthMessage.text}
                            </p>
                        </div>
                    </div>

                    {/* Right: Time Progress */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zaman Geçişi</p>
                            <span className="text-sm font-bold text-gray-900">{Math.round(timeProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-3 bg-blue-500 rounded-full transition-all duration-1000"
                                style={{ width: `${timeProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate Daily Average
    const calculateDailyAverage = () => {
        if (!startDate) return 0;
        const start = new Date(startDate);
        const today = new Date();

        if (isNaN(start.getTime())) return 0;

        const diffTime = Math.abs(today - start);
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))); // Ensure at least 1 day
        return spentAmount / diffDays;
    };

    const dailyAverage = calculateDailyAverage();

    // Default variant - original vertical design
    return (
        <div className="bg-white p-6 rounded-xl shadow-xl shadow-black/5 h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-gray-900">Harcama Hızı</h3>
                    {/* Info Icon with Tooltip */}
                    <div className="relative">
                        <button
                            onClick={() => setShowInfo(!showInfo)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Bilgi"
                        >
                            <Info size={16} className="text-gray-400" />
                        </button>

                        {/* Tooltip */}
                        {showInfo && (
                            <div className="absolute left-0 top-8 z-50 w-72 bg-gray-900 text-white text-sm p-4 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                <p className="leading-relaxed">
                                    Bu widget, düğüne kadar olan sürede bütçenizi dengeli harcayıp harcamadığınızı gösterir. Eğer zamanın %50'si geçmişken bütçenin %80'ini harcamışsanız, kalan zamanda sıkıntı yaşayabilirsiniz!
                                </p>
                                {/* Arrow */}
                                <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                            </div>
                        )}
                    </div>
                </div>
                <div className={`p-2 rounded-lg ${isSpendingFast ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                    <Clock size={20} />
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 justify-start">
                <div className="space-y-6">
                    {/* Time Progress */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500 font-medium">Zaman</span>
                            <span className="text-gray-900 font-bold">%{Math.round(timeProgress)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gray-400 rounded-full transition-all duration-1000"
                                style={{ width: `${timeProgress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Budget Progress */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500 font-medium">Bütçe</span>
                            <span className="text-gray-900 font-bold">%{Math.round(budgetProgress)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${isSpendingFast ? 'bg-rose-500' : 'bg-champagne'}`}
                                style={{ width: `${budgetProgress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Daily Average Metric */}
                <div>
                    <p className="text-xs text-gray-400 font-medium">
                        Günlük Ort: {dailyAverage.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                    </p>
                </div>
            </div>

            <div className={`mt-auto p-3 rounded-lg flex items-start gap-3 text-sm ${isSpendingFast ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {isSpendingFast ? (
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                ) : (
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                )}
                <p className="font-medium leading-tight">
                    {isSpendingFast
                        ? "Dikkat: Harcama hızınız zamanın ilerisinde! Bütçenizi gözden geçirin."
                        : "Harika! Harcamalarınız planlanan zaman çizelgesiyle uyumlu."}
                </p>
            </div>

            {/* Backdrop to close tooltip */}
            {showInfo && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowInfo(false)}
                ></div>
            )}
        </div>
    );
};

export default BurnRateWidget;

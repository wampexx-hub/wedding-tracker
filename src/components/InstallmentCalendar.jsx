import React, { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, TrendingUp, Grid, List, PlusCircle, RotateCcw } from 'lucide-react';

const InstallmentCalendar = () => {
    const { expenses } = useExpenses();
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
    const [paymentState, setPaymentState] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Load payment state from backend on mount
    useEffect(() => {
        if (user) {
            fetch(`/api/installment-payments?username=${user.username}`)
                .then(res => res.json())
                .then(data => {
                    setPaymentState(data || {});
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Error loading payment state:', error);
                    setIsLoading(false);
                });
        }
    }, [user]);

    // Save payment state to backend whenever it changes
    useEffect(() => {
        if (user && !isLoading) {
            fetch('/api/installment-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    payments: paymentState
                })
            })
                .catch(error => console.error('Error saving payment state:', error));
        }
    }, [paymentState, user, isLoading]);

    // Filter only installment expenses
    const installments = expenses.filter(expense => expense.isInstallment);

    // Calculate summary statistics
    const today = new Date();
    let totalInstallments = 0;
    let paidInstallments = 0;
    let ongoingInstallments = 0;
    let monthlyBurden = 0;
    let totalPaidAmount = 0;
    let totalOngoingAmount = 0;

    installments.forEach(expense => {
        const startDate = new Date(expense.date);
        const monthDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
        const baseStep = Math.min(Math.max(monthDiff + 1, 1), expense.installmentCount);
        const extraPayments = paymentState[expense.id] || 0;
        const currentStep = Math.min(baseStep + extraPayments, expense.installmentCount);
        const isCompleted = currentStep >= expense.installmentCount;

        totalInstallments += expense.installmentCount;
        paidInstallments += currentStep;
        totalPaidAmount += currentStep * Number(expense.monthlyPayment);

        if (!isCompleted) {
            const remaining = expense.installmentCount - currentStep;
            ongoingInstallments += remaining;
            totalOngoingAmount += remaining * Number(expense.monthlyPayment);
            monthlyBurden += Number(expense.monthlyPayment);
        }
    });

    const handlePayInstallment = (expenseId, totalInstallments, currentPaid) => {
        setPaymentState(prev => {
            const current = prev[expenseId] || 0;
            const newValue = Math.min(current + 1, totalInstallments - currentPaid);
            return { ...prev, [expenseId]: newValue };
        });
    };

    const handleUndo = (expenseId) => {
        setPaymentState(prev => {
            const current = prev[expenseId] || 0;
            const newValue = Math.max(current - 1, 0);
            if (newValue === 0) {
                const { [expenseId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [expenseId]: newValue };
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Desktop View (Yellow Design) */}
            <div className="hidden md:block">
                {/* Premium Analytics Widget - Hero Summary */}
                <div className="relative bg-gradient-to-br from-[#D4AF37] via-[#d4af37] to-[#c5a028] rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        {/* Header with Toggle */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/30 backdrop-blur-md rounded-xl">
                                    <TrendingUp size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold">Taksit Özeti</h2>
                                    <p className="text-white/80 text-sm">Genel durum ve aylık yük</p>
                                </div>
                            </div>

                            {/* View Switcher - Labeled Segmented Control */}
                            <div className="hidden md:flex bg-white/20 backdrop-blur-md rounded-full p-1 shadow-lg">
                                <button
                                    onClick={() => setViewMode('card')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${viewMode === 'card'
                                        ? 'bg-white text-[#D4AF37] shadow-md font-bold'
                                        : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    <Grid size={18} />
                                    <span className="text-sm">Kart</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${viewMode === 'table'
                                        ? 'bg-white text-[#D4AF37] shadow-md font-bold'
                                        : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    <List size={18} />
                                    <span className="text-sm">Liste</span>
                                </button>
                            </div>
                        </div>

                        {/* Bento Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            {/* Col 1: Donut Chart - Visual */}
                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px]">
                                <div className="relative w-40 h-40">
                                    {/* CSS Donut Chart */}
                                    <svg className="transform -rotate-90 w-40 h-40">
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="rgba(255,255,255,0.2)"
                                            strokeWidth="16"
                                            fill="none"
                                        />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="white"
                                            strokeWidth="16"
                                            fill="none"
                                            strokeDasharray={`${(paidInstallments / totalInstallments) * 440} 440`}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>

                                    {/* Center Percentage */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-4xl font-bold">
                                            {totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0}%
                                        </div>
                                        <div className="text-xs text-white/70 mt-1">Tamamlandı</div>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="mt-4 flex gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-white"></div>
                                        <span className="text-white/90">{paidInstallments} Ödendi</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-white/20"></div>
                                        <span className="text-white/90">{ongoingInstallments} Kalan</span>
                                    </div>
                                </div>
                            </div>

                            {/* Col 2 & 3: Stats Grid */}
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Card A - Critical: Monthly Burden */}
                                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 sm:col-span-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-white/70 text-sm font-medium mb-2 flex items-center gap-2">
                                                💰 Aylık Yük
                                            </p>
                                            <p className="text-4xl md:text-5xl font-bold text-white mb-1">
                                                {monthlyBurden.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                                            </p>
                                            <p className="text-white/60 text-sm">Bu ay ödemeniz gereken tutar</p>
                                        </div>
                                        <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3">
                                            <TrendingUp size={24} className="text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Card B1 - Status: Paid Amount */}
                                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5">
                                    <p className="text-white/70 text-xs font-medium mb-2">✅ Ödenen Borç</p>
                                    <p className="text-2xl md:text-3xl font-bold text-white">
                                        {totalPaidAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                                    </p>
                                    <p className="text-white/60 text-xs mt-1">{paidInstallments} taksit tamamlandı</p>
                                </div>

                                {/* Card B2 - Status: Remaining Debt */}
                                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5">
                                    <p className="text-white/70 text-xs font-medium mb-2">⏳ Kalan Borç</p>
                                    <p className="text-2xl md:text-3xl font-bold text-white">
                                        {totalOngoingAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                                    </p>
                                    <p className="text-white/60 text-xs mt-1">{ongoingInstallments} taksit devam ediyor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {installments.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm mt-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Taksit Bulunamadı</h3>
                        <p className="text-gray-500">Henüz taksitli bir harcama eklemediniz.</p>
                    </div>
                ) : (
                    <div className="mt-6">
                        {/* Card View */}
                        {viewMode === 'card' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {installments
                                    .sort((a, b) => {
                                        // Calculate completion status for sorting
                                        const getCompletion = (expense) => {
                                            const startDate = new Date(expense.date);
                                            const monthDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
                                            const baseStep = Math.min(Math.max(monthDiff + 1, 1), expense.installmentCount);
                                            const extraPayments = paymentState[expense.id] || 0;
                                            const currentStep = Math.min(baseStep + extraPayments, expense.installmentCount);
                                            return currentStep >= expense.installmentCount;
                                        };
                                        const aCompleted = getCompletion(a);
                                        const bCompleted = getCompletion(b);
                                        // Active first, completed last
                                        if (aCompleted && !bCompleted) return 1;
                                        if (!aCompleted && bCompleted) return -1;
                                        return 0;
                                    })
                                    .map(expense => (
                                        <InstallmentCard
                                            key={expense.id}
                                            expense={expense}
                                            extraPayments={paymentState[expense.id] || 0}
                                            onPay={() => {
                                                const startDate = new Date(expense.date);
                                                const monthDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
                                                const baseStep = Math.min(Math.max(monthDiff + 1, 1), expense.installmentCount);
                                                handlePayInstallment(expense.id, expense.installmentCount, baseStep);
                                            }}
                                            onUndo={() => handleUndo(expense.id)}
                                        />
                                    ))}
                            </div>
                        )}

                        {/* Table View */}
                        {viewMode === 'table' && (
                            <InstallmentTable
                                installments={installments}
                                paymentState={paymentState}
                                onPay={handlePayInstallment}
                                onUndo={handleUndo}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Mobile View (Dark Gradient Design) */}
            <div className="block md:hidden">
                {/* Mobile Component A: The Summary Card */}
                <div className="bg-gradient-to-br from-slate-900 to-black rounded-2xl shadow-xl p-5 mx-4 mt-4 text-white">
                    {/* Top Row */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 font-medium">Bu Ay Ödenecek</span>
                        {/* Small Gold Progress Circle */}
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <svg className="transform -rotate-90 w-10 h-10">
                                <circle
                                    cx="20"
                                    cy="20"
                                    r="16"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <circle
                                    cx="20"
                                    cy="20"
                                    r="16"
                                    stroke="#D4AF37"
                                    strokeWidth="3"
                                    fill="none"
                                    strokeDasharray={`${(paidInstallments / totalInstallments) * 100} 100`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute text-[10px] font-bold text-[#D4AF37]">
                                %{totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0}
                            </span>
                        </div>
                    </div>

                    {/* Middle: Monthly Burden */}
                    <div className="text-3xl font-bold tracking-tight mb-4">
                        {monthlyBurden.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                        <span className="text-sm text-red-400 font-medium">
                            Kalan Borç: {totalOngoingAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                        </span>
                    </div>
                </div>

                {/* Mobile Component B: The Compact List */}
                <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 mx-4 mt-4">
                    {installments.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            Henüz taksitli harcama yok.
                        </div>
                    ) : (
                        installments.map(expense => {
                            const startDate = new Date(expense.date);
                            const monthDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
                            const baseStep = Math.min(Math.max(monthDiff + 1, 1), expense.installmentCount);
                            const extraPayments = paymentState[expense.id] || 0;
                            const currentStep = Math.min(baseStep + extraPayments, expense.installmentCount);
                            const isCompleted = currentStep >= expense.installmentCount;
                            const canPay = currentStep < expense.installmentCount;

                            return (
                                <div key={expense.id} className="flex items-center justify-between py-3 px-4">
                                    {/* Left: Date Box */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-gray-50 rounded-lg border border-gray-100">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                                                {startDate.toLocaleDateString('tr-TR', { month: 'short' }).replace('.', '')}
                                            </span>
                                            <span className="text-sm font-bold text-gray-700">
                                                {startDate.getDate()}
                                            </span>
                                        </div>

                                        {/* Center: Title + Subtitle */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                                                {expense.title}
                                            </h4>
                                            <p className="text-xs text-gray-400">
                                                {currentStep}/{expense.installmentCount} Taksit
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Amount + Status */}
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-sm font-bold text-gray-900">
                                            {Number(expense.monthlyPayment).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                                        </span>

                                        {isCompleted ? (
                                            <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                                                Bitti
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    const startDate = new Date(expense.date);
                                                    const monthDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
                                                    const baseStep = Math.min(Math.max(monthDiff + 1, 1), expense.installmentCount);
                                                    handlePayInstallment(expense.id, expense.installmentCount, baseStep);
                                                }}
                                                disabled={!canPay}
                                                className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full active:scale-95 transition-transform"
                                            >
                                                Öde
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

// Card Component
const InstallmentCard = ({ expense, extraPayments, onPay, onUndo }) => {
    const today = new Date();
    const startDate = new Date(expense.date);
    const monthDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
    const baseStep = Math.min(Math.max(monthDiff + 1, 1), expense.installmentCount);
    const currentStep = Math.min(baseStep + extraPayments, expense.installmentCount);
    const totalSteps = expense.installmentCount;
    const isCompleted = currentStep >= totalSteps;
    const progressPercent = (currentStep / totalSteps) * 100;
    const remainingSteps = totalSteps - currentStep;
    const remainingDebt = remainingSteps * expense.monthlyPayment;
    const canPay = currentStep < totalSteps;
    const canUndo = extraPayments > 0;

    return (
        <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ${isCompleted ? 'opacity-60' : ''
            }`}>
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{expense.title}</h3>
                <p className="text-sm text-gray-500">{expense.category}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                        {currentStep} / {totalSteps} Ödendi
                    </span>
                    <span className="text-sm text-gray-500">
                        {Math.round(progressPercent)}%
                    </span>
                </div>

                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        style={{ width: `${progressPercent}%` }}
                        className={`h-full rounded-full transition-all duration-700 ease-out ${isCompleted
                            ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                            : 'bg-gradient-to-r from-[#D4AF37] to-[#f4d03f]'
                            }`}
                    />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-gray-100">
                {!isCompleted && (
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Kalan Borç:</p>
                            <p className="text-xl font-bold text-gray-900 transition-all duration-500">
                                {remainingDebt.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                            </p>
                        </div>
                    </div>
                )}

                {isCompleted ? (
                    // Celebration Badge
                    <div className="flex items-center justify-center py-3">
                        <div className="bg-gradient-to-r from-[#D4AF37] to-[#f4d03f] text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg animate-in zoom-in duration-500 flex items-center gap-2">
                            <span className="text-lg">🥳</span>
                            Borç Bitti!
                            <span className="text-lg">🥳</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={onPay}
                            disabled={!canPay}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${canPay
                                ? 'bg-[#D4AF37] hover:bg-[#c5a028] text-white active:scale-95'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <PlusCircle size={16} />
                            Bir Taksit Öde
                        </button>

                        {canUndo && (
                            <button
                                onClick={onUndo}
                                className="px-4 py-2.5 text-gray-500 hover:text-red-500 hover:bg-gray-50 rounded-xl transition-all flex items-center gap-1"
                            >
                                <RotateCcw size={14} />
                                <span className="text-xs">Geri Al</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Table Component
const InstallmentTable = ({ installments, paymentState, onPay, onUndo }) => {
    const today = new Date();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr className="border-b border-gray-200">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Harcama Adı
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Kategori
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                İlerleme
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Kalan Borç
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                İşlemler
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {installments
                            .sort((a, b) => {
                                // Calculate completion status for sorting
                                const getCompletion = (expense) => {
                                    const startDate = new Date(expense.date);
                                    const monthDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
                                    const baseStep = Math.min(Math.max(monthDiff + 1, 1), expense.installmentCount);
                                    const extraPayments = paymentState[expense.id] || 0;
                                    const currentStep = Math.min(baseStep + extraPayments, expense.installmentCount);
                                    return currentStep >= expense.installmentCount;
                                };
                                const aCompleted = getCompletion(a);
                                const bCompleted = getCompletion(b);
                                // Active first, completed last
                                if (aCompleted && !bCompleted) return 1;
                                if (!aCompleted && bCompleted) return -1;
                                return 0;
                            })
                            .map(expense => {
                                const startDate = new Date(expense.date);
                                const monthDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
                                const baseStep = Math.min(Math.max(monthDiff + 1, 1), expense.installmentCount);
                                const extraPayments = paymentState[expense.id] || 0;
                                const currentStep = Math.min(baseStep + extraPayments, expense.installmentCount);
                                const totalSteps = expense.installmentCount;
                                const remainingSteps = totalSteps - currentStep;
                                const remainingDebt = remainingSteps * expense.monthlyPayment;
                                const canPay = currentStep < totalSteps;
                                const canUndo = extraPayments > 0;

                                const isCompleted = currentStep >= totalSteps;

                                return (
                                    <tr
                                        key={expense.id}
                                        className={`hover:bg-gray-50 transition-colors ${isCompleted ? 'opacity-60' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">{expense.title}</div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600">{expense.category}</div>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-semibold text-gray-700">
                                                {currentStep}/{totalSteps}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-bold text-gray-900 font-mono transition-all duration-500">
                                                {remainingDebt.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {isCompleted ? (
                                                <div className="flex items-center justify-center">
                                                    <div className="bg-gradient-to-r from-[#D4AF37] to-[#f4d03f] text-white px-4 py-2 rounded-full font-bold text-xs shadow-md flex items-center gap-1">
                                                        🥳 Borç Bitti!
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => onPay(expense.id, totalSteps, baseStep)}
                                                        disabled={!canPay}
                                                        className={`p-2 rounded-lg transition-all ${canPay
                                                            ? 'text-[#D4AF37] hover:bg-[#D4AF37]/10 active:scale-95'
                                                            : 'text-gray-300 cursor-not-allowed'
                                                            }`}
                                                        title="Bir Taksit Öde"
                                                    >
                                                        <PlusCircle size={20} />
                                                    </button>

                                                    {canUndo && (
                                                        <button
                                                            onClick={() => onUndo(expense.id)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Geri Al"
                                                        >
                                                            <RotateCcw size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InstallmentCalendar;

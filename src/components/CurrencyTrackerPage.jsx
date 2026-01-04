import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { TrendingUp, Plus, MoreHorizontal, Trash2, ChevronUp, ChevronDown, Check, X, Loader2, FileText, Edit2, RefreshCw, DollarSign, Euro, PoundSterling, Banknote, Sparkles } from 'lucide-react';
import { useLiveRates } from '../hooks/useLiveRates';

// Custom Gold Icon Component
const GoldIcon = ({ type, className }) => {
    const baseClass = `w-6 h-6 ${className}`;

    if (type === 'quarter') {
        // Quarter Circle (Top Right Quadrant)
        return (
            <svg viewBox="0 0 24 24" className={baseClass} fill="currentColor">
                <path d="M12 12 L12 2 A10 10 0 0 1 22 12 Z" />
            </svg>
        );
    }

    if (type === 'half') {
        // Half Circle (Right Half)
        return (
            <svg viewBox="0 0 24 24" className={baseClass} fill="currentColor">
                <path d="M12 2 A10 10 0 0 1 12 22 Z" />
            </svg>
        );
    }

    if (type === 'full') {
        // Full Circle
        return (
            <svg viewBox="0 0 24 24" className={baseClass} fill="currentColor">
                <circle cx="12" cy="12" r="10" />
            </svg>
        );
    }

    return null;
};

// Custom Turkish Lira Icon Component
const TurkishLiraIcon = ({ className = "w-6 h-6" }) => {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 18V6" />
            <path d="M4 10h8" />
            <path d="M4 14h8" />
            <path d="M14 8c0 2-2 4-4 6" />
            <circle cx="16" cy="12" r="4" />
        </svg>
    );
};



const CurrencyTrackerPage = () => {
    const { user } = useAuth();
    // Destructure portfolio, usersMap, and budgetIncluded from Context
    const { triggerRefresh, portfolio: contextPortfolio, usersMap, budgetIncluded } = useExpenses();
    const { rates, loading: ratesLoading, error: ratesError, lastUpdated, refetch } = useLiveRates();

    // Local state for UI manipulation (optimistic updates could be done here, but usually we rely on Context for SSOT)
    // However, the existing code uses 'portfolio' state heavily. 
    // To minimize refactor risk, we sync Context -> State.
    const [portfolio, setPortfolio] = useState([]);
    const [rateChanges, setRateChanges] = useState({});
    const [activeMenu, setActiveMenu] = useState(null);
    const [includedInBudget, setIncludedInBudget] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [expandedAssetId, setExpandedAssetId] = useState(null); // For mobile accordion
    const [editForm, setEditForm] = useState({ amount: '', note: '' });


    // Asset type configurations
    const assetConfig = {
        TRY_CASH: { name: 'Türk Lirası', icon: <Banknote className="w-6 h-6 text-green-600" />, color: 'green', symbol: '₺', type: 'cash' },
        USD: { name: 'ABD Doları', icon: <DollarSign className="w-6 h-6 text-green-600" />, color: 'green', symbol: '$', type: 'market' },
        EUR: { name: 'Euro', icon: <Euro className="w-6 h-6 text-blue-600" />, color: 'blue', symbol: '€', type: 'market' },
        GBP: { name: 'İngiliz Sterlini', icon: <PoundSterling className="w-6 h-6 text-purple-600" />, color: 'purple', symbol: '£', type: 'market' },
        GRAM: { name: 'Gram Altın', icon: <Sparkles className="w-6 h-6 text-yellow-600" />, color: 'yellow', symbol: 'gr', type: 'market' },
        CEYREK: { name: 'Çeyrek Altın', icon: <Sparkles className="w-6 h-6 text-yellow-600" />, color: 'yellow', symbol: 'adet', type: 'market' },
        YARIM: { name: 'Yarım Altın', icon: <Sparkles className="w-6 h-6 text-yellow-600" />, color: 'yellow', symbol: 'adet', type: 'market' },
        TAM: { name: 'Tam Altın', icon: <Sparkles className="w-6 h-6 text-yellow-600" />, color: 'yellow', symbol: 'adet', type: 'market' }
    };

    // Quick Adder state
    const [quickAdd, setQuickAdd] = useState({
        type: 'TRY_CASH',
        amount: '',
        note: ''
    });

    // Sync with Context
    useEffect(() => {
        if (contextPortfolio) {
            setPortfolio(contextPortfolio);
        }
        if (budgetIncluded !== undefined) {
            setIncludedInBudget(budgetIncluded);
        }
    }, [contextPortfolio, budgetIncluded]);

    // Cleanup local fetch? Yes, removing the useEffect that fetches /api/portfolio
    // ... replaced by above sync ...

    // Save portfolio to backend
    const savePortfolio = async (newPortfolio) => {
        if (user) {
            setPortfolio(newPortfolio);
        }
    };

    // Handle budget toggle
    const handleBudgetToggle = async () => {
        const newState = !includedInBudget;
        setIncludedInBudget(newState);

        if (user) {
            try {
                await fetch(`/api/portfolio/${user.username}/budget-toggle`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ included: newState })
                });

                // Trigger context refresh to update sidebar immediately
                if (triggerRefresh) {
                    triggerRefresh();
                }
            } catch (err) {
                console.error('Failed to update budget toggle:', err);
            }
        }

        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Quick Add Asset
    const handleQuickAdd = async (e) => {
        e.preventDefault();
        if (!quickAdd.amount || parseFloat(quickAdd.amount) <= 0) return;

        const asset = {
            id: Date.now().toString(),
            type: quickAdd.type,
            amount: parseFloat(quickAdd.amount),
            addedAt: new Date().toISOString(),
            note: quickAdd.note || ''
        };

        try {
            const res = await fetch(`/api/portfolio/${user.username}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ asset })
            });
            const data = await res.json();

            if (data.success) {
                setPortfolio([...portfolio, data.asset]);
                setQuickAdd({ ...quickAdd, amount: '', note: '' });

                // Trigger refresh if budget is included OR if it's a cash asset (always included)
                if ((includedInBudget || asset.type === 'TRY_CASH') && triggerRefresh) {
                    triggerRefresh();
                }
            }
        } catch (err) {
            console.error('Failed to add asset:', err);
        }
    };

    // Delete asset with confirmation
    const handleDeleteAsset = async (id) => {
        if (window.confirm('Bu varlığı silmek istediğinizden emin misiniz?')) {
            try {
                const res = await fetch(`/api/portfolio/${user.username}/${id}`, {
                    method: 'DELETE'
                });
                const data = await res.json();

                if (data.success) {
                    setPortfolio(portfolio.filter(a => a.id !== id));

                    // Trigger refresh if budget is included OR if it was a cash asset
                    // We need to find the deleted asset type, but here we just refresh to be safe
                    if (triggerRefresh) {
                        triggerRefresh();
                    }
                }
            } catch (err) {
                console.error('Failed to delete asset:', err);
            }
        }
        setActiveMenu(null);
    };

    // Open edit modal
    const handleEditAsset = (asset) => {
        setEditingAsset(asset);
        setEditForm({
            amount: asset.amount.toString(),
            note: asset.note || ''
        });
        setActiveMenu(null);
    };

    // Save edited asset
    const handleSaveEdit = async () => {
        if (!editForm.amount || parseFloat(editForm.amount) <= 0) return;

        const updatedAsset = {
            ...editingAsset,
            amount: parseFloat(editForm.amount),
            note: editForm.note
        };

        try {
            // Update in backend
            const res = await fetch(`/api/portfolio/${user.username}/${editingAsset.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ asset: updatedAsset })
            });
            const data = await res.json();

            if (data.success) {
                setPortfolio(portfolio.map(a => a.id === editingAsset.id ? data.asset : a));
                setEditingAsset(null);
                setEditForm({ amount: '', note: '' });

                // Trigger refresh if budget is included OR if it's a cash asset
                if ((includedInBudget || editingAsset.type === 'TRY_CASH') && triggerRefresh) {
                    triggerRefresh();
                }
            }
        } catch (err) {
            console.error('Failed to update asset:', err);
        }
    };

    // Cancel edit
    const handleCancelEdit = () => {
        setEditingAsset(null);
        setExpandedAssetId(null);
        setEditForm({ amount: '', note: '' });
    };

    // Handle Mobile Accordion Toggle
    const toggleAccordion = (asset) => {
        if (expandedAssetId === asset.id) {
            handleCancelEdit();
        } else {
            setExpandedAssetId(asset.id);
            setEditingAsset(asset);
            setEditForm({
                amount: asset.amount.toString(),
                note: asset.note || ''
            });
        }
    };

    // ========================================
    // PORTFOLIO VALUE CALCULATION (REWRITTEN)
    // ========================================
    // Calculate TOTAL portfolio value: ALL assets in TL
    // This should ALWAYS show the sum of:
    // - All TRY_CASH (as-is)
    // - All forex (USD, EUR, GBP) × current rate
    // - All gold (GRAM, CEYREK, YARIM, TAM) × current rate

    const calculateTotalPortfolioValue = () => {
        if (!portfolio || portfolio.length === 0) return 0;
        if (!rates) return 0;

        let total = 0;

        portfolio.forEach(asset => {
            const amount = parseFloat(asset.amount) || 0;

            if (asset.type === 'TRY_CASH') {
                // Cash: 1:1
                total += amount;
            } else {
                // Forex & Gold: use current rate
                const rate = parseFloat(rates[asset.type]) || 0;
                const value = amount * rate;
                total += value;

                // Debug log
                console.log(`[Portfolio Calc] ${asset.type}: ${amount} × ${rate} = ${value.toFixed(2)} TL`);
            }
        });

        console.log(`[Portfolio Calc] TOTAL: ${total.toFixed(2)} TL`);
        return total;
    };

    const totalValue = calculateTotalPortfolioValue();

    // Get color classes based on asset type
    const getColorClasses = (color) => {
        const baseColors = {
            green: 'bg-green-50 border-green-500',
            blue: 'bg-blue-50 border-blue-500',
            purple: 'bg-purple-50 border-purple-500',
            yellow: 'bg-yellow-50 border-yellow-500'
        };
        return baseColors[color] || 'bg-gray-50 border-gray-500';
    };

    // Calculate quick add estimated value
    // Calculate quick add value (TRY_CASH uses rate = 1)
    const quickAddValue = quickAdd.amount
        ? parseFloat(quickAdd.amount) * (quickAdd.type === 'TRY_CASH' ? 1 : (rates?.[quickAdd.type] || 0))
        : 0;
    const isValidAmount = quickAdd.amount && parseFloat(quickAdd.amount) > 0;

    // Helper to render individual asset card
    const renderAssetCard = (asset) => {
        const config = assetConfig[asset.type];
        const isCash = asset.type === 'TRY_CASH';
        const rate = isCash ? 1 : (rates?.[asset.type] || 0);
        const value = asset.amount * rate;
        const isExpanded = expandedAssetId === asset.id;

        return (
            <React.Fragment key={asset.id}>
                {/* Mobile Accordion View */}
                <div className="md:hidden bg-white border-b border-gray-100 last:border-0 transition-all duration-200">
                    {/* Summary Row (Click to Expand) */}
                    <div
                        onClick={() => toggleAccordion(asset)}
                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                            {/* Icon */}
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${getColorClasses(config.color).replace('border-2', '').replace('p-6', '')} bg-opacity-20`}>
                                <span className="text-lg">{config.icon}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-900">{config.name}</span>
                                    {usersMap && asset.username && usersMap[asset.username] && (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                                            {/* Show first name only or 'Ben' if current user */}
                                            {asset.username === user.username ? 'Ben' : usersMap[asset.username].name.split(' ')[0]}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    {/* Amount / USD Equivalent */}
                                    <span>
                                        {isCash
                                            ? `$${(asset.amount / (rates?.USD || 1)).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                                            : `${asset.amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ${config.symbol}`
                                        }
                                    </span>
                                    {/* Note Preview (Inline) */}
                                    {asset.note && (
                                        <>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-gray-400 truncate max-w-[150px]">
                                                {asset.note}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-3">
                            <div className="text-right">
                                <div className="font-bold text-gray-900">
                                    {value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                                </div>
                            </div>
                            <ChevronDown
                                size={16}
                                className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                        </div>
                    </div>

                    {/* Expanded Edit Form */}
                    {isExpanded && (
                        <div className="px-4 pb-4 pt-0 bg-gray-50 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-3 pt-2">
                                {/* Amount Input */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 ml-1">Miktar</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editForm.amount}
                                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none md:[&::-webkit-inner-spin-button]:appearance-none md:[&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                </div>

                                {/* Note Input */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 ml-1">Not</label>
                                    <input
                                        type="text"
                                        value={editForm.note}
                                        onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                                        placeholder="Not ekle..."
                                        maxLength={50}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => handleDeleteAsset(asset.id)}
                                        className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={!editForm.amount || parseFloat(editForm.amount) <= 0}
                                        className={`flex-1 py-2.5 rounded-lg font-medium text-white shadow-sm transition-all ${editForm.amount && parseFloat(editForm.amount) > 0
                                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:shadow-md active:scale-95'
                                            : 'bg-gray-300 cursor-not-allowed'
                                            }`}
                                    >
                                        Güncelle
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Card View - Ultra Compact */}
                <div className={`hidden md:block bg-white rounded-xl md:p-4 p-6 border-2 transition-all duration-300 hover:shadow-lg relative ${getColorClasses(config.color)}`}>
                    {/* Header: Icon + Name + Menu */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="md:text-2xl text-3xl">{config.icon}</div>
                            <h3 className="font-bold text-gray-900 md:text-sm">{config.name}</h3>
                            {usersMap && asset.username && usersMap[asset.username] && (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded whitespace-nowrap hidden md:inline-block">
                                    {asset.username === user.username ? 'Ben' : usersMap[asset.username].name.split(' ')[0]}
                                </span>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setActiveMenu(activeMenu === asset.id ? null : asset.id)}
                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <MoreHorizontal size={20} />
                            </button>

                            {activeMenu === asset.id && (
                                <>
                                    <div className="absolute right-0 top-8 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button
                                            onClick={() => handleEditAsset(asset)}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-blue-600 flex items-center gap-2 transition-colors"
                                        >
                                            <Edit2 size={14} />
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAsset(asset.id)}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                            Sil
                                        </button>
                                    </div>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setActiveMenu(null)}
                                    ></div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Compact Body: Side-by-Side Values (Desktop) / Stacked (Mobile) */}
                    <div className="mb-2">
                        {/* Desktop: Side-by-Side */}
                        <div className="hidden md:flex items-baseline gap-2">
                            {/* Primary Value */}
                            <div className="text-xl font-bold text-gray-900">
                                {config.symbol === '$' || config.symbol === '€' || config.symbol === '£'
                                    ? `${config.symbol}${asset.amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`
                                    : `${asset.amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ${config.symbol}`
                                }
                            </div>
                            {/* Secondary Value - TL Equivalent */}
                            <div className="text-sm font-medium text-gray-500">
                                {asset.type === 'TRY_CASH'
                                    ? `≈ $${(asset.amount / (rates?.USD || 1)).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                                    : `≈ ${value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺`
                                }
                            </div>
                        </div>

                        {/* Mobile: Stacked (Original) */}
                        <div className="md:hidden">
                            <div className="text-2xl font-bold text-gray-900">
                                {config.symbol === '$' || config.symbol === '€' || config.symbol === '£'
                                    ? `${config.symbol}${asset.amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`
                                    : `${asset.amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ${config.symbol}`
                                }
                            </div>
                            <div className="mt-1">
                                <p className="text-xs text-gray-500 mb-0.5">
                                    {asset.type === 'TRY_CASH' ? 'Dolar Karşılığı' : 'Toplam Değer'}
                                </p>
                                <p className="text-xl font-bold text-gray-900">
                                    {asset.type === 'TRY_CASH'
                                        ? `$${(asset.amount / (rates?.USD || 1)).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                                        : `${value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Embedded Notes - Mini Footer (Desktop) / Original (Mobile) */}
                    {asset.note && (
                        <>
                            {/* Desktop: Mini Footer - Single Line with Truncation */}
                            <div className="hidden md:flex mt-3 pt-2 border-t border-gray-100 items-center gap-1.5 w-full">
                                <FileText size={12} className="text-gray-400 flex-shrink-0" />
                                <span className="text-[10px] text-gray-400 truncate leading-tight" title={asset.note}>{asset.note}</span>
                            </div>

                            {/* Mobile: Original */}
                            <div className="md:hidden mt-4 pt-3 border-t border-gray-50/50">
                                <div className="flex items-start gap-2">
                                    <FileText size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                    <p
                                        className="text-xs text-gray-500 italic truncate"
                                        title={asset.note}
                                    >
                                        {asset.note}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </React.Fragment>
        );
    };
    // Loading skeleton
    if (ratesLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-2xl">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={48} className="animate-spin text-white/50" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (ratesError && !rates) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
                    <h3 className="text-xl font-bold text-red-900 mb-2">Veri Yüklenemedi</h3>
                    <p className="text-red-700">Piyasa verileri alınamadı. Lütfen daha sonra tekrar deneyin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Global CSS to hide input spin buttons */}
            <style>{`
                /* Hide spin buttons for Webkit (Chrome, Safari, Edge) */
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                /* Hide spin buttons for Firefox */
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>

            {/* Premium Portfolio Card (Credit Card Style) */}
            <div className="relative bg-gradient-to-br from-slate-800 to-black rounded-2xl shadow-xl text-white overflow-hidden flex flex-col">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -ml-5 -mb-5 blur-xl"></div>

                {/* Content Wrapper with Padding */}
                <div className="p-5 md:p-8 relative z-10 flex-1">

                    {/* Toast Notification - Absolute positioned inside card */}
                    {showToast && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-full shadow-2xl border border-gray-200 py-2 px-4 w-auto animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${includedInBudget ? 'bg-green-100' : 'bg-gray-100'}`}>
                                {includedInBudget ? <Check size={12} className="text-green-600" /> : <X size={12} className="text-gray-600" />}
                            </div>
                            <p className="text-xs font-medium text-gray-900">
                                {includedInBudget ? 'Bütçeye Eklendi' : 'Bütçeden Çıkarıldı'}
                            </p>
                        </div>
                    )}

                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-2 md:mb-6 relative z-10">
                        <div className="flex flex-col">
                            {/* Mobile Title */}
                            <p className="block md:hidden text-sm text-gray-400 font-medium">Toplam Varlık</p>

                            {/* Desktop Title & Subtitle */}
                            <div className="hidden md:block">
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-2xl font-bold">Portföy Değeri</h2>
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                                        <span className="text-xs font-medium text-gray-300">
                                            Son Güncelleme: {lastUpdated || '--:--'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400">Toplam varlık değeriniz</p>
                            </div>
                        </div>

                        {/* Right Side: Rate Ticker (Desktop) / Icon (Mobile) */}
                        <div className="flex items-center gap-4">
                            {/* Desktop: Rate Ticker */}
                            <div className="hidden md:flex flex-col gap-1.5 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                {/* Forex Rates */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <DollarSign size={14} className="text-green-400" />
                                        <span className="text-xs font-medium text-gray-300">{(rates?.USD || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}₺</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Euro size={14} className="text-blue-400" />
                                        <span className="text-xs font-medium text-gray-300">{(rates?.EUR || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}₺</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <PoundSterling size={14} className="text-purple-400" />
                                        <span className="text-xs font-medium text-gray-300">{(rates?.GBP || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}₺</span>
                                    </div>
                                </div>
                                {/* Gold Rates */}
                                <div className="flex items-center gap-3 pt-1.5 border-t border-white/10">
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-yellow-400" />
                                        <span className="text-[10px] font-medium text-gray-400">Gr</span>
                                        <span className="text-xs font-medium text-gray-300">{(rates?.GRAM || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-medium text-gray-400">Ç</span>
                                        <span className="text-xs font-medium text-gray-300">{(rates?.CEYREK || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-medium text-gray-400">Y</span>
                                        <span className="text-xs font-medium text-gray-300">{(rates?.YARIM || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-medium text-gray-400">T</span>
                                        <span className="text-xs font-medium text-gray-300">{(rates?.TAM || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺</span>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Icon */}
                            <div className="hidden md:flex p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                                <TrendingUp size={24} className="text-white" />
                            </div>

                            {/* Mobile Chart Button */}
                            <button className="md:hidden bg-white/10 hover:bg-white/20 transition-colors rounded-full p-2 backdrop-blur-sm">
                                <TrendingUp size={20} className="text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Main Value (Hero) */}
                    <div className={`text-3xl md:text-5xl font-bold tracking-tight text-white mb-6 md:mb-8 relative z-10 ${includedInBudget ? 'drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]' : ''}`}>
                        {totalValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                    </div>

                    {/* Footer Section */}
                    <div className="relative z-10">
                        {/* Mobile Footer */}
                        <div className="flex md:hidden items-end justify-between">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Son Güncelleme</p>
                                <p className="text-xs font-medium text-gray-300">{lastUpdated || '--:--'}</p>
                            </div>

                            {/* Compact Budget Toggle Pill (Mobile) */}
                            <button
                                onClick={handleBudgetToggle}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md transition-all duration-300 border ${includedInBudget
                                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                    : 'bg-white/10 border-white/10 text-gray-300 hover:bg-white/15'
                                    }`}
                            >
                                <span className="text-[10px] font-semibold">Bütçeye Dahil</span>
                                <div className={`w-2 h-2 rounded-full transition-colors ${includedInBudget ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-gray-500'}`}></div>
                            </button>
                        </div>

                    </div>

                    {/* Desktop Footer (Rich Info) */}
                    <div className="hidden md:flex items-center justify-between border-t border-white/10 pt-6">
                        <p className="text-sm text-gray-400 font-medium">{portfolio.length} farklı varlık</p>

                        {/* Full Toggle Switch (Desktop) */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-300">Döviz ve Altınları Bütçeye Dahil Et</span>
                            <button
                                onClick={handleBudgetToggle}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${includedInBudget ? 'bg-green-500' : 'bg-gray-600'}`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${includedInBudget ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Rate Ticker - Separate White Box */}
            <div className="md:hidden bg-white border border-gray-100 rounded-xl mt-2 py-3 px-4 shadow-sm">
                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar" style={{ maskImage: 'linear-gradient(to right, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)' }}>
                    {/* USD */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
                        <DollarSign size={14} className="text-yellow-600" />
                        <span className="text-gray-900 font-bold text-xs">USD</span>
                        <span className="text-gray-500 font-medium text-xs ml-0.5">: {(rates?.USD || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}₺</span>
                    </div>
                    {/* EUR */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
                        <Euro size={14} className="text-yellow-600" />
                        <span className="text-gray-900 font-bold text-xs">EUR</span>
                        <span className="text-gray-500 font-medium text-xs ml-0.5">: {(rates?.EUR || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}₺</span>
                    </div>
                    {/* GBP */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
                        <PoundSterling size={14} className="text-yellow-600" />
                        <span className="text-gray-900 font-bold text-xs">GBP</span>
                        <span className="text-gray-500 font-medium text-xs ml-0.5">: {(rates?.GBP || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}₺</span>
                    </div>
                    {/* Gold - Gram */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
                        <Sparkles size={14} className="text-yellow-600" />
                        <span className="text-gray-900 font-bold text-xs">GR</span>
                        <span className="text-gray-500 font-medium text-xs ml-0.5">: {(rates?.GRAM || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺</span>
                    </div>
                    {/* Gold - Ceyrek */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
                        <span className="text-gray-900 font-bold text-xs">ÇEY</span>
                        <span className="text-gray-500 font-medium text-xs ml-0.5">: {(rates?.CEYREK || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺</span>
                    </div>
                </div>
            </div>

            {/* Soft Premium Asset Input Toolbar (Wide & Split) */}
            < form onSubmit={handleQuickAdd} className="w-full" >
                {/* Desktop Layout (Preserved) */}
                < div className="hidden md:flex h-24 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] items-center px-6 gap-6 relative z-20" >
                    {/* 1. Informative Pill Selector */}
                    < div className="relative flex-shrink-0 group" >
                        <div className="flex items-center justify-center gap-2 py-3 px-5 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors">
                            <span className="text-xl">{assetConfig[quickAdd.type].icon}</span>
                            <span className="font-semibold text-gray-700 text-sm">
                                {assetConfig[quickAdd.type].name}
                            </span>
                            <ChevronDown size={14} className="text-gray-400 w-4 h-4" />

                            <select
                                value={quickAdd.type}
                                onChange={(e) => setQuickAdd({ ...quickAdd, type: e.target.value })}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            >
                                <option value="TRY_CASH">Türk Lirası</option>
                                <optgroup label="Döviz">
                                    <option value="USD">Dolar</option>
                                    <option value="EUR">Euro</option>
                                    <option value="GBP">Sterlin</option>
                                </optgroup>
                                <optgroup label="Altın">
                                    <option value="GRAM">Gram Altın</option>
                                    <option value="CEYREK">Çeyrek Altın</option>
                                    <option value="YARIM">Yarım Altın</option>
                                    <option value="TAM">Tam Altın</option>
                                </optgroup>
                            </select>
                        </div>
                    </div >

                    {/* 2. Stacked Input Zone (Amount & Note) */}
                    < div className="flex-1 flex flex-col items-end justify-center gap-0" >
                        {/* Amount Input */}
                        < input
                            type="number"
                            step="0.01"
                            min="0"
                            value={quickAdd.amount}
                            onChange={(e) => setQuickAdd({ ...quickAdd, amount: e.target.value })}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    handleQuickAdd(e);
                                }
                            }}
                            placeholder="0"
                            className="w-full bg-transparent border-none text-3xl font-bold text-gray-900 placeholder-gray-300 focus:ring-0 p-0 text-right tracking-tight"
                        />

                        {/* Note Input */}
                        < input
                            type="text"
                            value={quickAdd.note || ''}
                            onChange={(e) => setQuickAdd({ ...quickAdd, note: e.target.value })}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleQuickAdd(e);
                                }
                            }}
                            placeholder="Not ekle..."
                            className="w-full bg-transparent border-none text-sm text-right text-gray-400 focus:text-gray-600 placeholder-gray-300 focus:ring-0 p-0 mt-1"
                        />
                    </div >

                    {/* 3. Wide Action Button */}
                    < button
                        type="submit"
                        disabled={!isValidAmount}
                        className={`flex-shrink-0 h-auto py-3 px-8 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 transition-all duration-200 ${isValidAmount
                            ? 'hover:scale-105 hover:shadow-lg'
                            : 'opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <Plus size={20} className="w-5 h-5" strokeWidth={3} />
                        <span className="font-bold text-white tracking-wide ml-1">Ekle</span>
                    </button >
                </div >

                {/* Mobile Layout ("Split Ticket") */}
                < div className="md:hidden w-full bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 relative z-20" >
                    {/* Top Row: Selector, Amount, Button */}
                    < div className="flex items-center justify-between p-3 gap-3" >
                        {/* Left: Selector (Icon Box) */}
                        < div className="relative flex-shrink-0" >
                            <div className="h-10 px-2 bg-gray-50 rounded-lg flex items-center justify-center gap-1 text-xl border border-gray-100 min-w-[3.5rem]">
                                {assetConfig[quickAdd.type].icon}
                                <ChevronDown size={14} className="text-gray-400" />
                            </div>
                            <select
                                value={quickAdd.type}
                                onChange={(e) => setQuickAdd({ ...quickAdd, type: e.target.value })}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            >
                                <option value="TRY_CASH">Türk Lirası</option>
                                <optgroup label="Döviz">
                                    <option value="USD">Dolar</option>
                                    <option value="EUR">Euro</option>
                                    <option value="GBP">Sterlin</option>
                                </optgroup>
                                <optgroup label="Altın">
                                    <option value="GRAM">Gram Altın</option>
                                    <option value="CEYREK">Çeyrek Altın</option>
                                    <option value="YARIM">Yarım Altın</option>
                                    <option value="TAM">Tam Altın</option>
                                </optgroup>
                            </select>
                        </div >

                        {/* Center: Amount Input */}
                        < div className="flex-1" >
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={quickAdd.amount}
                                onChange={(e) => setQuickAdd({ ...quickAdd, amount: e.target.value })}
                                placeholder="0"
                                className="w-full bg-transparent border-none text-center text-xl font-bold text-gray-900 placeholder-gray-300 focus:ring-0 p-0"
                            />
                        </div >

                        {/* Right: Add Button (Square) */}
                        < button
                            type="submit"
                            disabled={!isValidAmount}
                            className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-md flex items-center justify-center transition-all duration-200 ${isValidAmount
                                ? 'active:scale-95'
                                : 'opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <Plus size={20} strokeWidth={3} />
                        </button >
                    </div >

                    {/* Bottom Row: Note Input (Gray Bg) */}
                    < div className="w-full bg-gray-50/80 px-3 py-2 border-t border-gray-100 flex items-center" >
                        <span className="text-gray-400 mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                        </span>
                        <input
                            type="text"
                            value={quickAdd.note || ''}
                            onChange={(e) => setQuickAdd({ ...quickAdd, note: e.target.value })}
                            placeholder="Not ekle (Opsiyonel)..."
                            className="w-full bg-transparent border-none text-sm text-gray-600 placeholder-gray-400 focus:ring-0 p-0"
                        />
                    </div >
                </div >
            </form >


            {/* Asset Grid - 3 Columns */}
            < div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start" >

                {/* Column 1: Turkish Lira (Cash) */}
                < div className="flex flex-col gap-4" >
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 px-1">
                        <span className="w-2 h-6 bg-green-500 rounded-full"></span>
                        Nakit Varlıklar
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden md:bg-transparent md:shadow-none md:divide-y-0 md:space-y-4">
                        {portfolio
                            .filter(a => a.type === 'TRY_CASH')
                            .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                            .map(asset => renderAssetCard(asset))}
                    </div>
                    {
                        portfolio.filter(a => a.type === 'TRY_CASH').length === 0 && (
                            <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
                                Nakit varlık bulunmuyor
                            </div>
                        )
                    }
                </div >

                {/* Column 2: Foreign Currency */}
                < div className="flex flex-col gap-4" >
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 px-1">
                        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                        Döviz Varlıkları
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden md:bg-transparent md:shadow-none md:divide-y-0 md:space-y-4">
                        {portfolio
                            .filter(a => ['USD', 'EUR', 'GBP'].includes(a.type))
                            .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                            .map(asset => renderAssetCard(asset))}
                    </div>
                    {
                        portfolio.filter(a => ['USD', 'EUR', 'GBP'].includes(a.type)).length === 0 && (
                            <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
                                Döviz varlığı bulunmuyor
                            </div>
                        )
                    }
                </div >

                {/* Column 3: Gold */}
                < div className="flex flex-col gap-4" >
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 px-1">
                        <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
                        Altın Varlıkları
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden md:bg-transparent md:shadow-none md:divide-y-0 md:space-y-4">
                        {portfolio
                            .filter(a => ['GRAM', 'CEYREK', 'YARIM', 'TAM'].includes(a.type))
                            .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                            .map(asset => renderAssetCard(asset))}
                    </div>
                    {
                        portfolio.filter(a => ['GRAM', 'CEYREK', 'YARIM', 'TAM'].includes(a.type)).length === 0 && (
                            <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
                                Altın varlığı bulunmuyor
                            </div>
                        )
                    }
                </div >
            </div >

            {/* Edit Asset Modal (Desktop Only) */}
            {
                editingAsset && !expandedAssetId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Varlığı Düzenle</h2>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-6 space-y-5">
                                {/* Asset Type (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Varlık Tipi</label>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                                        <span className="text-2xl">{assetConfig[editingAsset.type]?.icon}</span>
                                        <span className="text-base font-medium text-gray-900">{assetConfig[editingAsset.type]?.name}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Varlık tipini değiştirmek için silip yeniden ekleyin</p>
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Miktar</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editForm.amount}
                                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                        className="w-full px-4 py-3 text-2xl font-bold text-gray-900 border-2 border-gray-200 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0"
                                    />
                                </div>

                                {/* Note Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notunuz</label>
                                    <textarea
                                        value={editForm.note}
                                        onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-3 text-sm text-gray-700 border-2 border-gray-200 rounded-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition-all resize-none"
                                        placeholder="Örn: Balayı parası, Acil durum fonu..."
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={handleCancelEdit}
                                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={!editForm.amount || parseFloat(editForm.amount) <= 0}
                                    className={`flex-1 px-4 py-3 text-sm font-medium text-white rounded-lg transition-all ${editForm.amount && parseFloat(editForm.amount) > 0
                                        ? 'bg-[#D4AF37] hover:bg-[#C4A037] shadow-lg shadow-yellow-500/30'
                                        : 'bg-gray-300 cursor-not-allowed'
                                        }`}
                                >
                                    Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CurrencyTrackerPage;

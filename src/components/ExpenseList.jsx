import React, { useState, useRef } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Trash2, Edit2, Filter, Calendar, CreditCard, CheckCircle, Clock, FileText, Download, Upload, AlertTriangle, X, Image as ImageIcon, Heart, Snowflake, Tv, UtensilsCrossed, Sofa, MoreHorizontal, Bed, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import SearchBar from './SearchBar';
import ExpenseCard from './ExpenseCard';

const ExpenseList = ({ onEdit, initialTab = 'purchased' }) => {
    const { expenses, deleteExpense, addExpense, addBatchExpenses } = useExpenses();
    const [filterCategory, setFilterCategory] = useState('All');
    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [showWizardModal, setShowWizardModal] = useState(false);

    // Sync activeTab with initialTab when it changes
    React.useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const filteredExpenses = expenses.filter(e => {
        const categoryMatch = filterCategory === 'All' || e.category === filterCategory;
        const statusMatch = e.status === activeTab;
        const searchMatch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.vendor && e.vendor.toLowerCase().includes(searchQuery.toLowerCase()));
        return categoryMatch && statusMatch && searchMatch;
    });

    // Define category order and icons
    const categoryConfig = {
        'Tüm Kategoriler': { icon: Filter, order: 0 },
        'Düğün': { icon: Heart, order: 1 },
        'Nişan': { icon: Sparkles, order: 2 },
        'Beyaz Eşya': { icon: Snowflake, order: 3 },
        'Elektronik Eşya': { icon: Tv, order: 4 },
        'Mobilya': { icon: Sofa, order: 5 },
        'Salon': { icon: Sofa, order: 6 },
        'Yatak Odası': { icon: Bed, order: 7 },
        'Mutfak': { icon: UtensilsCrossed, order: 8 },
        'Diğer': { icon: MoreHorizontal, order: 999 }
    };

    // Get unique categories from expenses and sort them
    const uniqueCategories = ['All', ...new Set(expenses.map(e => e.category))];
    const sortedCategories = uniqueCategories.sort((a, b) => {
        const aKey = a === 'All' ? 'Tüm Kategoriler' : a;
        const bKey = b === 'All' ? 'Tüm Kategoriler' : b;
        const aOrder = categoryConfig[aKey]?.order ?? 500;
        const bOrder = categoryConfig[bKey]?.order ?? 500;
        return aOrder - bOrder;
    });

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const handleCardClick = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteExpense(deleteId);
            setDeleteId(null);
        }
    };

    const handleWizardConfirm = async () => {
        const { DEFAULT_ITEMS } = await import('../constants/defaultExpenses');
        // Add date to items to fix "Invalid Date" issue
        const itemsWithDate = DEFAULT_ITEMS.map(item => ({
            ...item,
            date: new Date().toISOString()
        }));
        await addBatchExpenses(itemsWithDate);
        setShowWizardModal(false);
        setActiveTab('planned'); // Switch to planned tab to see new items
    };

    const handleExport = () => {
        const dataToExport = filteredExpenses.map(e => ({
            'Başlık': e.title,
            'Kategori': e.category,
            'Tutar': e.price,
            'Tarih': e.date,
            'Durum': e.status === 'purchased' ? 'Satın Alındı' : 'Planlanıyor',
            'Ödeme Kaynağı': e.source,
            'Satıcı': e.vendor,
            'Notlar': e.notes
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Harcamalar");
        XLSX.writeFile(wb, "dugun-butcesi.xlsx");
    };

    // Calculate counts for tabs
    const purchasedCount = expenses.filter(e => e.status === 'purchased').length;
    const plannedCount = expenses.filter(e => e.status === 'planned').length;

    // Lock body scroll when modal is open
    React.useEffect(() => {
        if (showWizardModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showWizardModal]);

    return (
        <>

            <div className="glass-panel p-4 md:p-8 w-full max-w-full overflow-hidden">
                {/* Header Section - Refactored into 2 Rows */}
                <div className="flex flex-col gap-6 mb-6 md:mb-8">

                    {/* Row 1: Title & Magic Button */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 m-0 truncate">Harcama Listesi</h2>

                        <button
                            id="tour-magic-list"
                            onClick={() => setShowWizardModal(true)}
                            className="btn-primary w-full sm:w-auto justify-center flex-shrink-0"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', border: 'none' }}
                        >
                            <Sparkles size={16} /> Sihirli Liste ✨
                        </button>
                    </div>

                    {/* Row 2: Toolbar (Search, Filter, Export) */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
                        {/* Search - Flex Grow */}
                        <div className="flex-grow min-w-0">
                            <SearchBar onSearch={setSearchQuery} />
                        </div>

                        <div className="flex gap-3">
                            {/* Filter */}
                            <div className="flex-1 sm:flex-none relative min-w-0">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #eee', height: '42px', width: '100%' }}>
                                    <Filter size={16} color="var(--text-light)" className="flex-shrink-0" />
                                    <select
                                        value={filterCategory}
                                        onChange={e => setFilterCategory(e.target.value)}
                                        style={{
                                            border: 'none',
                                            outline: 'none',
                                            background: 'transparent',
                                            color: 'var(--text-dark)',
                                            paddingRight: '1.5rem',
                                            cursor: 'pointer',
                                            width: '100%',
                                            minWidth: 0
                                        }}
                                    >
                                        {sortedCategories.map((c, index) => {
                                            const displayName = c === 'All' ? 'Tüm Kategoriler' : c;
                                            const Icon = categoryConfig[displayName]?.icon;
                                            return (
                                                <option
                                                    key={c}
                                                    value={c}
                                                    style={{
                                                        borderTop: index === 1 ? '1px solid #e5e7eb' : 'none',
                                                        paddingTop: index === 1 ? '0.5rem' : '0'
                                                    }}
                                                >
                                                    {displayName}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>

                            {/* Export Button */}
                            <button
                                onClick={handleExport}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors h-[42px] flex-shrink-0"
                            >
                                <Download size={16} />
                                <span className="hidden sm:inline">Dışa Aktar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 md:mb-8 border-b-2 border-gray-100 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-1 md:gap-2 min-w-full">
                        <button
                            onClick={() => setActiveTab('purchased')}
                            className={`flex-1 min-w-0 flex items-center justify-center gap-2 px-2 py-3 md:px-6 md:py-4 transition-all duration-200 border-b-[3px] whitespace-nowrap ${activeTab === 'purchased'
                                ? 'border-[#D4AF37] text-[#D4AF37] font-semibold bg-gray-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <CheckCircle size={18} className={`flex-shrink-0 ${activeTab === 'purchased' ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                            <span className="text-sm md:text-base truncate">Alınanlar</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold min-w-[24px] text-center flex-shrink-0 ${activeTab === 'purchased'
                                ? 'bg-[#D4AF37] text-white'
                                : 'bg-gray-200 text-gray-500'
                                }`}>
                                {purchasedCount}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('planned')}
                            className={`flex-1 min-w-0 flex items-center justify-center gap-2 px-2 py-3 md:px-6 md:py-4 transition-all duration-200 border-b-[3px] whitespace-nowrap ${activeTab === 'planned'
                                ? 'border-[#D4AF37] text-[#D4AF37] font-semibold bg-gray-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Clock size={18} className={`flex-shrink-0 ${activeTab === 'planned' ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                            <span className="text-sm md:text-base truncate">Planlananlar</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold min-w-[24px] text-center flex-shrink-0 ${activeTab === 'planned'
                                ? 'bg-[#D4AF37] text-white'
                                : 'bg-gray-200 text-gray-500'
                                }`}>
                                {plannedCount}
                            </span>
                        </button>
                    </div>
                </div>

                {
                    filteredExpenses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                            <p>Henüz harcama eklenmemiş.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col bg-white rounded-xl shadow-sm divide-y divide-gray-100 md:bg-transparent md:shadow-none md:divide-y-0 md:grid md:gap-4">
                            {filteredExpenses.map(expense => (
                                <div key={expense.id}>
                                    <ExpenseCard
                                        expense={expense}
                                        onEdit={(exp) => onEdit(exp)}
                                        onDelete={handleDeleteClick}
                                        onExpand={handleCardClick}
                                        isExpanded={expandedId === expense.id}
                                    />

                                    {/* Inline Delete Confirmation - Appears right below the card */}
                                    {deleteId === expense.id && (
                                        <div
                                            className="animate-in slide-in-from-top-2 fade-in duration-300"
                                            style={{
                                                marginTop: '0.5rem',
                                                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                                padding: '1.5rem',
                                                borderRadius: '12px',
                                                border: '2px solid #fca5a5',
                                                boxShadow: '0 4px 6px rgba(239, 68, 68, 0.1)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    background: '#ef4444',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <AlertTriangle size={24} color="white" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#991b1b', fontSize: '1.1rem', fontWeight: '600' }}>
                                                        Emin misiniz?
                                                    </h4>
                                                    <p style={{ color: '#7f1d1d', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>
                                                        <strong>{expense.title}</strong> kalemini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                        <button
                                                            onClick={() => setDeleteId(null)}
                                                            style={{
                                                                flex: 1,
                                                                padding: '0.75rem 1.5rem',
                                                                borderRadius: '8px',
                                                                border: '2px solid #dc2626',
                                                                background: 'white',
                                                                color: '#dc2626',
                                                                cursor: 'pointer',
                                                                fontWeight: '600',
                                                                fontSize: '0.95rem',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseOver={(e) => e.target.style.background = '#fef2f2'}
                                                            onMouseOut={(e) => e.target.style.background = 'white'}
                                                        >
                                                            İptal
                                                        </button>
                                                        <button
                                                            onClick={confirmDelete}
                                                            style={{
                                                                flex: 1,
                                                                padding: '0.75rem 1.5rem',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: '#dc2626',
                                                                color: 'white',
                                                                cursor: 'pointer',
                                                                fontWeight: '600',
                                                                fontSize: '0.95rem',
                                                                transition: 'all 0.2s',
                                                                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
                                                            }}
                                                            onMouseOver={(e) => e.target.style.background = '#b91c1c'}
                                                            onMouseOut={(e) => e.target.style.background = '#dc2626'}
                                                        >
                                                            Evet, Sil
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                }
                {/* Mobile Spacer */}
                <div className="h-32 w-full flex-shrink-0" aria-hidden="true" />
            </div>

            {/* Wizard Confirmation Modal - Moved outside glass-panel */}
            {showWizardModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles className="text-amber-500" size={24} />
                                Düğün Hazırlığına Hızlı Başla! 🚀
                            </h3>
                            <button onClick={() => setShowWizardModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                <p className="text-amber-800 font-medium">
                                    Senin için harika bir başlangıç listesi hazırladık!
                                </p>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Senin için gelinlikten beyaz eşyaya, en çok ihtiyaç duyulan 80+ kalemlik bir başlangıç listesi hazırladık. Bu listeyi <strong>'Planlananlar'</strong> kısmına ekleyip üzerinde değişiklik yapmaya ne dersin?
                            </p>
                            <p className="text-gray-500 text-xs">
                                * Merak etme, mevcut listene dokunmayacağız. Yeni kalemler listenin sonuna eklenir.
                            </p>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowWizardModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleWizardConfirm}
                                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 font-medium shadow-lg shadow-amber-200 transition-all"
                            >
                                Listeyi Getir 🤩
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExpenseList;

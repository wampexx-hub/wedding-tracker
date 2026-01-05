import React, { useState, useEffect, useRef } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Plus, Calendar, CreditCard, Tag, ShoppingBag, FileText, Save, X, Camera } from 'lucide-react';

const SOURCES = ['Nakit', 'Kredi Kartı', 'Kredi', 'Borç'];
const VENDORS = ['Mağaza', 'İnternet', 'Pazar', 'Hediye', 'Diğer'];

const ExpenseForm = ({ onSuccess, initialData, onCancel, isModal }) => {
    const { addExpense, updateExpense } = useExpenses();
    const [categories, setCategories] = useState([]); // Dynamic categories
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/admin/categories');
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error('Failed to fetch categories', error);
            } finally {
                setIsLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    const [formData, setFormData] = useState({
        title: '',
        category: '', // Will default to first category after fetch
        price: '',
        vendor: 'Mağaza',
        source: 'Kredi Kartı',
        date: new Date().toISOString().split('T')[0],
        isInstallment: false,
        installmentCount: 1,
        status: 'planned',
        notes: ''
    });

    // Set default category when loaded
    useEffect(() => {
        if (!formData.category && categories.length > 0 && !initialData) {
            setFormData(prev => ({ ...prev, category: categories[0].name }));
        }
    }, [categories, initialData]);

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                price: initialData.price.toString(),
                installmentCount: initialData.installmentCount || 1,
                notes: initialData.notes || '',
                status: initialData.status || 'planned'
            });
            if (initialData.imageUrl) {
                setImagePreview(`/api/images/${initialData.imageUrl.split('/').pop()}?t=${Date.now()}`);
            }
        }
    }, [initialData]);

    const processFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Ensure category is set
        const finalCategory = formData.category || (categories.length > 0 ? categories[0].name : 'Diğer');

        const expense = {
            ...formData,
            category: finalCategory,
            price: Number(formData.price) || 0,
            installmentCount: formData.isInstallment ? Number(formData.installmentCount) : 1,
            monthlyPayment: formData.isInstallment ? Number(formData.price) / Number(formData.installmentCount) : Number(formData.price)
        };

        const data = new FormData();
        data.append('data', JSON.stringify(expense));
        if (image) {
            data.append('image', image);
        }

        if (initialData) {
            await updateExpense(initialData.id, data);
        } else {
            await addExpense(data);
        }

        setFormData({
            title: '',
            category: categories.length > 0 ? categories[0].name : '',
            price: '',
            vendor: 'Mağaza',
            source: 'Kredi Kartı',
            date: new Date().toISOString().split('T')[0],
            isInstallment: false,
            installmentCount: 1,
            status: 'planned',
            notes: ''
        });
        setImage(null);
        setImagePreview(null);
        if (onSuccess) onSuccess();
    };

    const isPurchased = formData.status === 'purchased';

    // Mobile Compact Layout (iOS-style) - Only on mobile screens
    // Desktop: Use normal form layout even when isModal=true
    const [isMobileScreen, setIsMobileScreen] = useState(
        typeof window !== 'undefined' && window.innerWidth < 768
    );

    // Listen for window resize to update mobile/desktop state
    useEffect(() => {
        const handleResize = () => {
            setIsMobileScreen(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        // Initial check
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const shouldUseCompactLayout = isModal && isMobileScreen;

    if (shouldUseCompactLayout) {
        return (
            <div className="flex flex-col h-[85vh]">
                {/* Scrollable Body: Toggle + Amount + Fields (flex-1 overflow-y-auto) */}
                <div className="flex-1 overflow-y-auto px-4 pb-32">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Section A: Toggle */}
                        <div className="bg-gray-100 p-1 rounded-lg flex mb-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, status: 'planned' })}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!isPurchased ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Planlanıyor
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, status: 'purchased' })}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${isPurchased ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Satın Alındı
                            </button>
                        </div>

                        {/* Section B: Amount (Hero) */}
                        <div className="text-center py-4">
                            <input
                                required={isPurchased}
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                placeholder="0₺"
                                className="text-4xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 w-full placeholder-gray-300 text-center outline-none"
                            />
                        </div>

                        {/* Section C: Compact Grouped List */}
                        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 divide-y divide-gray-200">
                            {/* Name */}
                            <div className="flex items-center justify-between px-4 py-3 bg-white">
                                <label className="text-sm font-medium text-gray-500 w-1/3">Harcama Adı</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Örn: Gelinlik"
                                    className="text-right text-base font-semibold text-gray-900 bg-transparent border-none focus:ring-0 w-2/3 outline-none"
                                />
                            </div>

                            {/* Category */}
                            <div className="flex items-center justify-between px-4 py-3 bg-white">
                                <label className="text-sm font-medium text-gray-500 w-1/3">Kategori</label>
                                {isLoadingCategories ? (
                                    <div className="text-sm text-gray-400">Yükleniyor...</div>
                                ) : (
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="appearance-none text-right text-base font-semibold text-gray-900 bg-transparent border-none focus:ring-0 w-2/3 outline-none cursor-pointer"
                                        style={{ direction: 'rtl' }}
                                    >
                                        <option value="" disabled>Seçiniz</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                )}
                            </div>

                            {/* Vendor - Native Select */}
                            <div className="flex items-center justify-between px-4 py-3 bg-white">
                                <label className="text-sm font-medium text-gray-500 w-1/3">Satıcı</label>
                                <select
                                    value={formData.vendor}
                                    onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                                    className="appearance-none text-right text-base font-semibold text-gray-900 bg-transparent border-none focus:ring-0 w-2/3 outline-none cursor-pointer"
                                    style={{ direction: 'rtl' }}
                                >
                                    {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>

                            {/* Conditional: Payment Source & Date (Only if Purchased) */}
                            {isPurchased && (
                                <>
                                    <div className="flex items-center justify-between px-4 py-3 bg-white">
                                        <label className="text-sm font-medium text-gray-500 w-1/3">Ödeme</label>
                                        <select
                                            value={formData.source}
                                            onChange={e => setFormData({ ...formData, source: e.target.value })}
                                            className="appearance-none text-right text-base font-semibold text-gray-900 bg-transparent border-none focus:ring-0 w-2/3 outline-none cursor-pointer"
                                            style={{ direction: 'rtl' }}
                                        >
                                            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between px-4 py-3 bg-white">
                                        <label className="text-sm font-medium text-gray-500 w-1/3">Tarih</label>
                                        <input
                                            required
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="text-right text-base font-semibold text-gray-900 bg-transparent border-none focus:ring-0 w-2/3 outline-none"
                                        />
                                    </div>

                                    {/* Installment Toggle */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-white">
                                        <label className="text-sm font-medium text-gray-500">Taksitli</label>
                                        <input
                                            type="checkbox"
                                            checked={formData.isInstallment}
                                            onChange={e => setFormData({ ...formData, isInstallment: e.target.checked })}
                                            className="w-5 h-5 rounded cursor-pointer"
                                            style={{ accentColor: '#D4AF37' }}
                                        />
                                    </div>

                                    {/* Installment Count (Conditional) */}
                                    {formData.isInstallment && (
                                        <div className="flex items-center justify-between px-4 py-3 bg-white">
                                            <label className="text-sm font-medium text-gray-500 w-1/3">Taksit Sayısı</label>
                                            <input
                                                type="number"
                                                min="2"
                                                max="36"
                                                value={formData.installmentCount}
                                                onChange={e => setFormData({ ...formData, installmentCount: e.target.value })}
                                                className="text-right text-base font-semibold text-gray-900 bg-transparent border-none focus:ring-0 w-2/3 outline-none"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Notes & Photo Upload (Mobile) */}
                        <div className="flex gap-3">
                            {/* Photo Button */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex-none w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-colors ${imagePreview ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-200 bg-gray-50 active:bg-gray-100'
                                    }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera size={24} className="text-gray-400" />
                                )}
                            </div>

                            {/* Notes Textarea */}
                            <textarea
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Notlar..."
                                className="flex-1 bg-gray-50 rounded-xl p-3 text-base border-none resize-none h-20 outline-none focus:ring-2 focus:ring-yellow-500/20"
                            />
                        </div>
                    </form>
                </div>

                {/* Sticky Footer: Save Button (flex-none mt-auto) */}
                <div className="flex-none mt-auto w-full bg-white border-t border-gray-100 p-4 pb-24 z-50">
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform"
                    >
                        {initialData ? 'Kaydet' : 'Harcamayı Ekle'}
                    </button>
                </div>
            </div>
        );
    }

    // Desktop Layout (Original - Unchanged)
    return (
        <div className={`w-full ${isModal ? '' : 'min-h-screen bg-gray-50'} flex flex-col`}>
            {/* Scrollable Content Area */}
            <div className={`flex-1 overflow-y-auto ${isModal ? '' : 'pb-24 md:pb-8'}`}>
                <div className={`w-full max-w-2xl mx-auto ${isModal ? 'p-4' : 'p-4 md:p-8'}`}>

                    {/* Card Container */}
                    <div className={`${isModal ? '' : 'bg-white rounded-3xl shadow-xl shadow-gray-200/50'} ${isModal ? 'p-4' : 'p-6 md:p-10'}`}>

                        {/* Header - Inside Card */}
                        {/* Header - Inside Card */}
                        <div className={`flex justify-between items-center ${isModal ? 'mb-4' : 'mb-6 md:mb-8'}`}>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                                {initialData ? 'Harcamayı Düzenle' : 'Yeni Harcama'}
                            </h2>
                            {initialData && (
                                <button
                                    onClick={onCancel}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    style={{ minWidth: '48px', minHeight: '48px' }}
                                >
                                    <X size={24} className="text-gray-400" />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Premium Segmented Toggle */}
                            <div className="flex bg-gray-100 p-1 rounded-full gap-1">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'planned' })}
                                    className={`flex-1 py-3 px-4 rounded-full text-sm font-semibold transition-all ${!isPurchased
                                        ? 'bg-white text-gray-800 shadow-sm'
                                        : 'bg-transparent text-gray-500'
                                        }`}
                                    style={{ minHeight: '48px' }}
                                >
                                    Planlanıyor
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'purchased' })}
                                    className={`flex-1 py-3 px-4 rounded-full text-sm font-semibold transition-all ${isPurchased
                                        ? 'bg-white text-gray-800 shadow-sm'
                                        : 'bg-transparent text-gray-500'
                                        }`}
                                    style={{ minHeight: '48px' }}
                                >
                                    Satın Alındı
                                </button>
                            </div>

                            {/* Hero Amount Input */}
                            <div className={`text-center ${isModal ? 'my-4' : 'my-8'}`}>
                                <label className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
                                    {isPurchased ? 'Tutar' : 'Tahmini Tutar'}
                                </label>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-2xl md:text-3xl font-bold text-gray-400">₺</span>
                                    <input
                                        required={isPurchased}
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0"
                                        className="text-4xl md:text-5xl font-bold text-gray-900 border-none bg-transparent text-left outline-none w-auto max-w-[250px]"
                                        style={{ lineHeight: '1' }}
                                    />
                                </div>
                            </div>

                            {/* Visual Separator */}
                            <div className="border-b border-gray-100"></div>

                            {/* Common Fields - Filled Style */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">Harcama Adı</label>
                                    <input
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Örn: Gelinlik"
                                        className="w-full min-h-[48px] px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-2 border-transparent outline-none transition-all focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full min-h-[48px] px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-2 border-transparent outline-none transition-all focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer"
                                    >
                                        <option value="" disabled>Seçiniz</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">Satıcı</label>
                                <select
                                    value={formData.vendor}
                                    onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                                    className="w-full min-h-[48px] px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-2 border-transparent outline-none transition-all focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer"
                                >
                                    {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>

                            {/* Conditional Fields - Only show when Purchased */}
                            {isPurchased && (
                                <>
                                    {/* Payment Source & Date */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700">Ödeme Kaynağı</label>
                                            <select
                                                value={formData.source}
                                                onChange={e => setFormData({ ...formData, source: e.target.value })}
                                                className="w-full min-h-[48px] px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-2 border-transparent outline-none transition-all focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer"
                                            >
                                                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>

                                            {/* Touch-Optimized Installment Checkbox */}
                                            <label
                                                className="flex items-center gap-3 mt-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                                style={{ minHeight: '48px' }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isInstallment}
                                                    onChange={e => setFormData({ ...formData, isInstallment: e.target.checked })}
                                                    className="w-5 h-5 rounded cursor-pointer"
                                                    style={{ accentColor: '#D4AF37' }}
                                                />
                                                <span className="text-sm text-gray-700 flex-1 font-medium">Taksitli ödeme</span>
                                            </label>

                                            {formData.isInstallment && (
                                                <div className="mt-3 space-y-2">
                                                    <input
                                                        type="number"
                                                        min="2"
                                                        max="36"
                                                        placeholder="Taksit sayısı"
                                                        value={formData.installmentCount}
                                                        onChange={e => setFormData({ ...formData, installmentCount: e.target.value })}
                                                        className="w-full min-h-[44px] px-4 py-2 bg-gray-50 text-gray-900 rounded-xl border-2 border-transparent outline-none transition-all focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                                                    />
                                                    <p className="text-xs text-gray-600 px-1">
                                                        Aylık: <strong className="text-[#D4AF37]">
                                                            {formData.price && formData.installmentCount ? (Number(formData.price) / Number(formData.installmentCount)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : '₺0'}
                                                        </strong>
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700">Tarih</label>
                                            <input
                                                required
                                                type="date"
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full min-h-[48px] px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-2 border-transparent outline-none transition-all focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                                            />
                                        </div>
                                    </div>

                                </>
                            )}

                            {/* Compact Receipt Upload */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">Fiş / Fatura</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-all ${isDragging ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-200 bg-gray-50'
                                        }`}
                                    style={{ minHeight: '80px' }}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        className="hidden"
                                    />

                                    <div className="flex items-center gap-3">
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">Fotoğraf yüklendi</p>
                                                    <p className="text-xs text-gray-500">Değiştirmek için tıklayın</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                                    <Camera size={20} className="text-[#D4AF37]" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">Fotoğraf Ekle</p>
                                                    <p className="text-xs text-gray-400">Tıkla veya sürükle</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">Notlar</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Ürün linki veya notlar..."
                                    className="w-full min-h-[100px] p-4 bg-gray-50 text-gray-900 rounded-xl border-2 border-transparent outline-none resize-none transition-all focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                                />
                            </div>

                            {/* Desktop Submit Button - Sticky Footer in Modal */}
                            <div className={`${isModal ? 'sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100 mt-4 z-10' : ''}`}>
                                <button
                                    type="submit"
                                    className="hidden md:flex w-full items-center justify-center gap-2 py-4 bg-[#D4AF37] hover:bg-[#c5a028] text-white rounded-2xl font-semibold transition-colors"
                                    style={{ minHeight: '56px' }}
                                >
                                    {initialData ? <Save size={20} /> : <Plus size={20} />}
                                    {initialData ? 'Kaydet' : 'Harcamayı Ekle'}
                                </button>
                            </div>
                        </form>
                    </div>
                    {/* End Card Container */}

                </div>
            </div>

            {/* Mobile Sticky Bottom Button */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe z-50">
                <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-[#D4AF37] active:bg-[#c5a028] text-white rounded-2xl font-semibold transition-colors shadow-lg"
                    style={{ minHeight: '56px' }}
                >
                    {initialData ? <Save size={20} /> : <Plus size={20} />}
                    {initialData ? 'Kaydet' : 'Harcamayı Ekle'}
                </button>
            </div>
        </div>
    );
};

export default ExpenseForm;

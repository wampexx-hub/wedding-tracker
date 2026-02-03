import React from 'react';
import { Trash2, Edit2, Calendar, CreditCard, CheckCircle, Clock, Image as ImageIcon, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';

const ExpenseCard = ({ expense, onEdit, onDelete, onExpand, isExpanded, isSelectionMode, isSelected, onToggleSelection }) => {
    const { user } = useAuth();
    const { usersMap } = useExpenses();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate if installment is completed
    const isInstallmentCompleted = () => {
        if (!expense.isInstallment) return false;
        const today = new Date();
        const startDate = new Date(expense.date);
        const monthDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
        const currentStep = Math.min(Math.max(monthDiff + 1, 1), expense.installmentCount);
        return currentStep >= expense.installmentCount;
    };

    const installmentCompleted = isInstallmentCompleted();

    const renderNotes = (notes) => {
        if (!notes) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = notes.split(urlRegex);

        return (
            <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg flex gap-2 items-start">
                <span className="break-all">
                    {parts.map((part, i) =>
                        part.match(urlRegex) ? (
                            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-champagne underline hover:text-champagne-hover">
                                {part}
                            </a>
                        ) : part
                    )}
                </span>
            </div>
        );
    };

    return (
        <div
            className={`transition-all duration-200 cursor-pointer group p-3 md:p-5 md:rounded-xl md:border-2 md:bg-white
                ${installmentCompleted
                    ? 'md:border-transparent md:bg-gradient-to-r md:from-[#D4AF37]/10 md:to-[#f4d03f]/10 md:shadow-md bg-yellow-50/30'
                    : isExpanded
                        ? 'md:border-champagne md:shadow-md bg-gray-50'
                        : 'md:border-transparent md:hover:shadow-sm'
                }`}
            onClick={() => onExpand(expense.id)}
        >
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">

                {/* Mobile Compact Row */}
                <div className="flex md:hidden justify-between items-center w-full">
                    <div className="flex gap-3 items-center overflow-hidden flex-1">
                        {/* Selection checkbox (Mobile) */}
                        {isSelectionMode && (
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    onToggleSelection(expense.id);
                                }}
                                className="w-5 h-5 text-champagne rounded border-gray-300 focus:ring-champagne"
                            />
                        )}
                        
                        {/* Smaller Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base font-bold ${expense.status === 'purchased' ? 'bg-green-50 text-green-500' : 'bg-champagne/10 text-champagne'}`}>
                            {expense.status === 'purchased' ? <CheckCircle size={16} /> : <Clock size={16} />}
                        </div>

                        {/* Title & Date Stack */}
                        <div className="flex flex-col min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate text-sm leading-tight">{expense.title}</h4>
                            <span className="text-xs text-gray-400 mt-0.5">
                                {new Date(expense.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </span>
                        </div>
                    </div>

                    {/* Right Side: Price + Edit */}
                    <div className="flex items-center gap-3 ml-2">
                        <div className="font-bold text-base text-gray-900 font-sans whitespace-nowrap">
                            {formatCurrency(expense.price)}
                        </div>
                        {/* Subtle Edit Button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(expense); }}
                            className="text-gray-300 hover:text-champagne p-1 -mr-2"
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Desktop Left: Details */}
                <div className="hidden md:flex gap-4 items-center w-full md:w-auto">
                    {/* Selection checkbox (Desktop) */}
                    {isSelectionMode && (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                                e.stopPropagation();
                                onToggleSelection(expense.id);
                            }}
                            className="w-5 h-5 text-champagne rounded border-gray-300 focus:ring-champagne"
                        />
                    )}
                    
                    {/* Status Icon (Desktop) */}
                    <div className="relative">
                        <div className={`hidden md:flex w-12 h-12 rounded-xl items-center justify-center flex-shrink-0 text-xl font-bold ${expense.status === 'purchased' ? 'bg-green-50 text-green-500' : 'bg-champagne/10 text-champagne'}`}>
                            {expense.status === 'purchased' ? <CheckCircle size={24} /> : <Clock size={24} />}
                        </div>
                        {/* Owner Badge */}
                        {usersMap && expense.username && usersMap[expense.username] && (
                            <div className="absolute -bottom-2 -right-2 bg-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-gray-100 shadow-sm text-gray-500 flex items-center gap-0.5 whitespace-nowrap z-10">
                                {expense.username === user?.username ? 'Ben' : usersMap[expense.username].name.split(' ')[0]}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Title (Desktop) */}
                        <div className="flex items-center gap-2">
                            <h4 className="hidden md:block font-semibold text-gray-900 truncate">{expense.title}</h4>
                        </div>

                        {/* Details Grid */}
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} /> {new Date(expense.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\./g, '/')}
                            </span>
                            <span className="flex items-center gap-1">
                                <CreditCard size={14} /> {expense.source}
                            </span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                {expense.category}
                            </span>
                            {expense.vendor && (
                                <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-xs">
                                    {expense.vendor}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop Right: Price + Actions */}
                <div className="hidden md:flex items-center justify-between w-full md:w-auto gap-4 mt-2 md:mt-0">
                    <div className="text-right flex-1 md:flex-none hidden md:block">
                        <div className="font-bold text-lg text-gray-900 font-sans">
                            {formatCurrency(expense.price)}
                        </div>
                        {expense.isInstallment && (
                            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${installmentCompleted
                                ? 'bg-gradient-to-r from-[#D4AF37] to-[#f4d03f] text-white shadow-sm'
                                : 'bg-blue-50 text-blue-600'
                                }`}>
                                {installmentCompleted ? (
                                    <>🥳 Tamamlandı!</>
                                ) : (
                                    <>{expense.installmentCount} Taksit ({formatCurrency(expense.monthlyPayment)}/ay)</>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions (Visible on Mobile Bottom Right / Desktop Hover) */}
                    <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-auto md:ml-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(expense); }}
                            className="p-2 text-champagne hover:bg-champagne/10 rounded-lg transition-colors"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(e, expense.id); }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded Details - Redesigned */}
            {isExpanded && (
                <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left: Image Thumbnail */}
                        <div className="relative group w-full md:w-40 h-40 flex-shrink-0">
                            {expense.imageUrl ? (
                                <>
                                    <img
                                        src={`/api/images/${expense.imageUrl.split('/').pop()}?t=${new Date(expense.createdAt).getTime()}`}
                                        alt={expense.title}
                                        className="w-full h-full object-cover rounded-2xl border border-gray-200"
                                    />
                                    {/* Zoom Overlay */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center cursor-pointer">
                                        <ImageIcon size={32} className="text-white" />
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full bg-gray-100 rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-gray-400">
                                    <ImageIcon size={32} className="opacity-50 mb-2" />
                                    <p className="text-xs">Fotoğraf Yok</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Details Content */}
                        <div className="flex-1">
                            {/* Information Grid */}
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Kategori</label>
                                    <div className="text-base font-medium text-gray-800">{expense.category}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Satıcı</label>
                                    <div className="text-base font-medium text-gray-800">{expense.vendor}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Ödeme Kaynağı</label>
                                    <div className="text-base font-medium text-gray-800">{expense.source}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Tarih</label>
                                    <div className="text-base font-medium text-gray-800">{new Date(expense.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                </div>
                            </div>

                            {/* Installment Card */}
                            {expense.isInstallment && (
                                <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between border border-blue-100 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            {expense.installmentCount} Taksit
                                        </div>
                                        <div className="text-sm text-blue-700">
                                            Aylık: <span className="font-bold text-blue-900">{formatCurrency(expense.monthlyPayment)}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-blue-600 font-medium">
                                        Toplam: {formatCurrency(expense.price)}
                                    </div>
                                </div>
                            )}

                            {/* Notes Section */}
                            {expense.notes && (
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Notlar</label>
                                    <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg">
                                        {renderNotes(expense.notes)}
                                    </div>
                                </div>
                            )}

                            {/* Actions Footer */}
                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(expense); }}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-all duration-200"
                                >
                                    <Edit2 size={16} />
                                    <span className="text-sm font-medium">Düzenle</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(e, expense.id); }}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                >
                                    <Trash2 size={16} />
                                    <span className="text-sm font-medium">Sil</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseCard;

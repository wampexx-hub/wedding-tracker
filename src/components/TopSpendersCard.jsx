import React from 'react';
import { Trophy, ShoppingBag, Home, Camera, Music, Gift, Utensils, Car } from 'lucide-react';

const TopSpendersCard = ({ expenses }) => {
    // Aggregate expenses by category
    const categoryTotals = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.price);
        return acc;
    }, {});

    const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    const sortedCategories = Object.entries(categoryTotals)
        .map(([name, value]) => ({
            name,
            value,
            percentage: totalSpent > 0 ? (value / totalSpent) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

    // Helper to get icon
    const getIcon = (category) => {
        const lower = category.toLowerCase();
        if (lower.includes('mekan')) return <Home size={18} />;
        if (lower.includes('foto')) return <Camera size={18} />;
        if (lower.includes('gelinlik') || lower.includes('damatlık')) return <ShoppingBag size={18} />;
        if (lower.includes('müzik')) return <Music size={18} />;
        if (lower.includes('yemek')) return <Utensils size={18} />;
        if (lower.includes('araç')) return <Car size={18} />;
        return <Gift size={18} />;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-lg font-bold text-gray-900">En Çok Harcananlar</h3>
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <Trophy size={20} />
                </div>
            </div>

            {/* Mobile View: Compact Wallet List */}
            <div className="block md:hidden space-y-0 divide-y divide-gray-100 flex-1">
                {sortedCategories.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${index === 0 ? 'bg-champagne/10 text-champagne' : 'bg-gray-100 text-gray-500'}`}>
                                {getIcon(item.name)}
                            </div>
                            <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">
                            {item.value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                        </p>
                    </div>
                ))}
                {sortedCategories.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-4">
                        Henüz harcama verisi yok.
                    </div>
                )}
            </div>

            {/* Desktop View: Detailed List with Progress Bars */}
            <div className="hidden md:block space-y-5 flex-1">
                {sortedCategories.map((item, index) => {
                    const colors = ['bg-champagne', 'bg-blue-500', 'bg-purple-500'];
                    const barColor = colors[index % colors.length];

                    return (
                        <div key={item.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${index === 0 ? 'bg-champagne/10 text-champagne' : 'bg-gray-100 text-gray-500'}`}>
                                        {getIcon(item.name)}
                                    </div>
                                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                                </div>
                                <p className="font-bold text-gray-900 text-sm">
                                    {item.value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500">%{item.percentage.toFixed(1).replace('.', ',')} Toplam Payı</p>
                        </div>
                    );
                })}

                {sortedCategories.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-4">
                        Henüz harcama verisi yok.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopSpendersCard;

// API data normalization utilities
export const normalizeExpense = (expense) => {
    if (!expense) return null;

    return {
        id: expense.id,
        title: expense.title || '',
        category: expense.category || 'Diğer',
        amount: Number(expense.price || expense.amount || 0),
        date: expense.date,
        status: expense.status || 'planned',
        isInstallment: expense.is_installment || expense.isInstallment || false,
        installmentCount: Number(expense.installment_count || expense.installmentCount || 1),
        monthlyPayment: Number(expense.monthly_payment || expense.monthlyPayment || 0),
        vendor: expense.vendor || '',
        source: expense.source || '',
        notes: expense.notes || '',
        addedBy: expense.added_by || expense.username || '',
        imageUrl: expense.image_url || null,
        createdAt: expense.created_at || expense.createdAt,
        partnershipId: expense.partnership_id || expense.partnershipId
    };
};

export const normalizeAsset = (asset) => {
    if (!asset) return null;

    return {
        id: asset.id,
        type: asset.type,
        amount: Number(asset.amount || 0),
        note: asset.note || '',
        username: asset.username,
        addedAt: asset.added_at || asset.addedAt
    };
};

export const calculateTotals = (expenses) => {
    const normalized = expenses.map(normalizeExpense).filter(Boolean);

    const totalSpent = normalized
        .filter(e => e.status === 'purchased')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalPlanned = normalized
        .filter(e => e.status === 'planned')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalInstallments = normalized
        .filter(e => e.isInstallment && e.status === 'purchased')
        .reduce((acc, curr) => {
            const monthly = curr.installmentCount > 0
                ? curr.amount / curr.installmentCount
                : 0;
            return acc + monthly;
        }, 0);

    return {
        totalSpent,
        totalPlanned,
        totalInstallments,
        purchasedCount: normalized.filter(e => e.status === 'purchased').length,
        plannedCount: normalized.filter(e => e.status === 'planned').length
    };
};

export const formatCurrency = (amount, options = {}) => {
    const { showDecimals = false } = options;
    const value = Number(amount) || 0;

    try {
        const formatted = value.toLocaleString('tr-TR', {
            maximumFractionDigits: showDecimals ? 2 : 0,
            minimumFractionDigits: 0
        });
        return `₺${formatted}`;
    } catch (error) {
        return `₺${value.toFixed(0)}`;
    }
};

export const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short'
        });
    } catch (error) {
        return '';
    }
};

export const getCategoryColor = (category) => {
    const colors = {
        'Düğün': '#D4AF37',
        'Elektronik Eşya': '#3b82f6',
        'Yiyecek': '#ec4899',
        'Giyim': '#10b981',
        'Ulaşım': '#f59e0b',
        'Eğlence': '#8b5cf6'
    };

    return colors[category] || '#9ca3af';
};

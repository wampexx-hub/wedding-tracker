import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizeExpense, formatCurrency, formatDate, getCategoryColor } from '../utils/dataHelpers';
import ExpenseFormModal from '../components/ExpenseFormModal';

export default function ExpensesScreen({ route, user: userProp, refreshTrigger }) {
    const insets = useSafeAreaInsets();
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('purchased'); // purchased, planned, installments
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    // Modal state for editing
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    // Use the user prop passed from App.js, fallback to route params if needed (though App.js passes it as prop)
    const user = userProp || route.params?.user || { username: 'dummyy' };

    useEffect(() => {
        fetchExpenses();
    }, [refreshTrigger]);

    const fetchExpenses = async () => {
        try {
            console.log('ExpensesScreen: Current User Prop:', user);
            const apiUrl = `https://dugunbutcem.com/api/data?user=${user.username}`;
            console.log('ExpensesScreen: Fetching URL:', apiUrl);

            const response = await fetch(apiUrl);
            const data = await response.json();
            const normalized = (data.expenses || []).map(normalizeExpense).filter(Boolean);
            setExpenses(normalized);
        } catch (error) {
            console.error('Expenses fetch error:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchExpenses();
    };

    const handleEditExpense = (expense) => {
        setSelectedExpense(expense);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        setSelectedExpense(null);
    };

    // Filter expenses based on active tab
    const getFilteredExpenses = () => {
        let filtered = expenses;

        // Filter by tab
        if (activeTab === 'purchased') {
            filtered = filtered.filter(e => e.status === 'purchased');
        } else if (activeTab === 'planned') {
            filtered = filtered.filter(e => e.status === 'planned');
        } else if (activeTab === 'installments') {
            filtered = filtered.filter(e => e.isInstallment && e.status === 'purchased');
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.title?.toLowerCase().includes(query) ||
                e.category?.toLowerCase().includes(query) ||
                e.vendor?.toLowerCase().includes(query)
            );
        }

        // Filter by category
        if (filterCategory !== 'all') {
            filtered = filtered.filter(e => e.category === filterCategory);
        }

        return filtered;
    };

    const filteredExpenses = getFilteredExpenses();
    const purchasedCount = expenses.filter(e => e.status === 'purchased').length;
    const plannedCount = expenses.filter(e => e.status === 'planned').length;
    const installmentsCount = expenses.filter(e => e.isInstallment && e.status === 'purchased').length;

    const categories = ['all', ...new Set(expenses.map(e => e.category))];

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D4AF37" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <View style={styles.headerLeft}>
                    <LinearGradient
                        colors={['#D4AF37', '#C5A028']}
                        style={styles.headerLogo}
                    >
                        <Text style={styles.headerLogoIcon}>❤️</Text>
                    </LinearGradient>
                    <Text style={styles.headerTitle}>Harcamalar</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerButton}>
                        <Ionicons name="sparkles-outline" size={22} color="#D4AF37" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton}>
                        <Ionicons name="download-outline" size={22} color="#111827" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchSection}>
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={20} color="#9ca3af" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Ara..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="funnel-outline" size={20} color="#111827" />
                    <Text style={styles.filterText}>Tümü</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'purchased' && styles.tabActive]}
                    onPress={() => setActiveTab('purchased')}
                >
                    <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={activeTab === 'purchased' ? '#D4AF37' : '#9ca3af'}
                    />
                    <Text style={[styles.tabText, activeTab === 'purchased' && styles.tabTextActive]}>
                        Alınanlar
                    </Text>
                    {purchasedCount > 0 && (
                        <View style={[styles.tabBadge, activeTab === 'purchased' && styles.tabBadgeActive]}>
                            <Text style={[styles.tabBadgeText, activeTab === 'purchased' && styles.tabBadgeTextActive]}>
                                {purchasedCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'planned' && styles.tabActive]}
                    onPress={() => setActiveTab('planned')}
                >
                    <Ionicons
                        name="time-outline"
                        size={18}
                        color={activeTab === 'planned' ? '#D4AF37' : '#9ca3af'}
                    />
                    <Text style={[styles.tabText, activeTab === 'planned' && styles.tabTextActive]}>
                        Planlananlar
                    </Text>
                    {plannedCount > 0 && (
                        <View style={[styles.tabBadge, activeTab === 'planned' && styles.tabBadgeActive]}>
                            <Text style={[styles.tabBadgeText, activeTab === 'planned' && styles.tabBadgeTextActive]}>
                                {plannedCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'installments' && styles.tabActive]}
                    onPress={() => setActiveTab('installments')}
                >
                    <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={activeTab === 'installments' ? '#D4AF37' : '#9ca3af'}
                    />
                    <Text style={[styles.tabText, activeTab === 'installments' && styles.tabTextActive]}>
                        Taksit Takvimi
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
            >
                {activeTab === 'installments' ? (
                    // Installment Calendar View
                    <View style={styles.installmentView}>
                        <LinearGradient
                            colors={['#0f172a', '#000000']}
                            style={styles.installmentCard}
                        >
                            <View style={styles.installmentHeader}>
                                <Text style={styles.installmentTitle}>Bu Ay Ödenecek</Text>
                                <View style={styles.installmentBadge}>
                                    <Text style={styles.installmentBadgeText}>%0</Text>
                                </View>
                            </View>
                            <Text style={styles.installmentAmount}>₺0</Text>
                            <Text style={styles.installmentSubtitle}>Kalan Borç: ₺0</Text>
                        </LinearGradient>

                        {installmentsCount === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
                                <Text style={styles.emptyText}>Henüz taksitli harcama yok.</Text>
                            </View>
                        ) : (
                            filteredExpenses.map(expense => (
                                <ExpenseItem key={expense.id} expense={expense} showInstallmentInfo />
                            ))
                        )}
                    </View>
                ) : (
                    // Regular expense list
                    <View>
                        {filteredExpenses.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons
                                    name={activeTab === 'purchased' ? 'checkmark-circle-outline' : 'time-outline'}
                                    size={64}
                                    color="#d1d5db"
                                />
                                <Text style={styles.emptyText}>
                                    {searchQuery
                                        ? 'Arama kriterlerine uygun harcama bulunamadı.'
                                        : activeTab === 'purchased'
                                            ? 'Henüz alınmış harcama yok.'
                                            : 'Henüz planlanmış harcama yok.'}
                                </Text>
                            </View>
                        ) : (
                            filteredExpenses.map(expense => (
                                <ExpenseItem key={expense.id} expense={expense} onEdit={handleEditExpense} />
                            ))
                        )}
                    </View>
                )}

                {/* Bottom padding */}
                <View style={{ height: 100 }} />
            </ScrollView>
            {/* Expense Form Modal */}
            <ExpenseFormModal
                visible={modalVisible}
                onClose={handleModalClose}
                expense={selectedExpense}
                user={user}
                onExpenseAdded={() => { handleModalClose(); fetchExpenses(); }}
            />
        </View>
    );
}

// Expense Item Component
function ExpenseItem({ expense, showInstallmentInfo, onEdit }) {
    return (
        <View style={styles.expenseItem}>
            <View style={styles.expenseLeft}>
                <View style={[
                    styles.expenseIcon,
                    { backgroundColor: getCategoryColor(expense.category) + '20' }
                ]}>
                    <Ionicons
                        name={expense.status === 'purchased' ? 'checkmark-circle' : 'time-outline'}
                        size={20}
                        color={expense.status === 'purchased' ? '#10b981' : '#f59e0b'}
                    />
                </View>
                <View style={styles.expenseInfo}>
                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                    <View style={styles.expenseMeta}>
                        <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                        {expense.addedBy && (
                            <>
                                <Text style={styles.expenseMetaDot}>•</Text>
                                <Text style={styles.expenseUser}>{expense.addedBy}</Text>
                            </>
                        )}
                        {expense.isInstallment && (
                            <>
                                <Text style={styles.expenseMetaDot}>•</Text>
                                <Ionicons name="card-outline" size={12} color="#9ca3af" />
                                <Text style={styles.expenseInstallment}>{expense.installmentCount}x</Text>
                            </>
                        )}
                    </View>
                </View>
            </View>
            <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                {showInstallmentInfo && expense.isInstallment && (
                    <Text style={styles.expenseMonthly}>
                        {formatCurrency(expense.amount / expense.installmentCount)}/ay
                    </Text>
                )}
                <TouchableOpacity style={styles.expenseEditButton} onPress={() => onEdit && onEdit(expense)}>
                    <Ionicons name="create-outline" size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFBF7',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#FDFBF7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#FDFBF7',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerLogo: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerLogoIcon: {
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerButton: {
        padding: 8,
        borderRadius: 8,
    },
    // Search
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FDFBF7',
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#f9fafb',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f9fafb',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
    },
    filterText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f9fafb',
    },
    tabActive: {
        backgroundColor: '#fef3c7',
    },
    tabText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#D4AF37',
        fontWeight: '600',
    },
    tabBadge: {
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeActive: {
        backgroundColor: '#D4AF37',
    },
    tabBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    tabBadgeTextActive: {
        color: '#fff',
    },
    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    // Installment View
    installmentView: {
        gap: 12,
    },
    installmentCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
    },
    installmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    installmentTitle: {
        fontSize: 14,
        color: '#9ca3af',
    },
    installmentBadge: {
        backgroundColor: '#D4AF37',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    installmentBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    installmentAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    installmentSubtitle: {
        fontSize: 14,
        color: '#ef4444',
    },
    // Expense Item
    expenseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    expenseLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    expenseIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expenseInfo: {
        flex: 1,
    },
    expenseTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    expenseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    expenseDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    expenseMetaDot: {
        fontSize: 12,
        color: '#d1d5db',
    },
    expenseUser: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    expenseInstallment: {
        fontSize: 12,
        color: '#9ca3af',
    },
    expenseRight: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    expenseMonthly: {
        fontSize: 12,
        color: '#9ca3af',
    },
    expenseEditButton: {
        padding: 4,
        marginTop: 2,
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 16,
        textAlign: 'center',
    },
});

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import PieChart from 'react-native-chart-kit/dist/PieChart';
import LineChart from 'react-native-chart-kit/dist/line-chart/LineChart';
import { normalizeExpense, calculateTotals, formatCurrency, formatDate } from '../utils/dataHelpers';
import BudgetSetterModal from '../components/BudgetSetterModal';

const { width: screenWidth } = Dimensions.get('window');

export default function DashboardScreen({ user, onLogout, refreshTrigger }) {
    const insets = useSafeAreaInsets();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [budgetModalVisible, setBudgetModalVisible] = useState(false);

    const fetchData = async () => {
        if (!user?.username) {
            console.log('❌ No username found');
            setIsLoading(false);
            return;
        }
        try {
            const apiUrl = `https://dugunbutcem.com/api/data?user=${user.username}`;
            console.log('🔄 Fetching from:', apiUrl);
            const response = await fetch(apiUrl);
            const result = await response.json();
            console.log('✅ API Response:', JSON.stringify(result, null, 2));
            console.log('📊 Budget:', result?.budget);
            console.log('📝 Expenses count:', result?.expenses?.length);
            setData(result);
        } catch (error) {
            console.error('❌ Veri yüklenemedi:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [refreshTrigger]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D4AF37" />
            </View>
        );
    }

    const budget = data?.budget || 0;
    const expenses = (data?.expenses || []).map(normalizeExpense).filter(Boolean);
    const weddingDate = new Date(data?.weddingDate || Date.now());
    const today = new Date();
    const daysDiff = Math.ceil((weddingDate - today) / (1000 * 60 * 60 * 24));

    const { totalSpent, totalPlanned, totalInstallments, purchasedCount, plannedCount } = calculateTotals(data?.expenses || []);

    const remainingBudget = budget > 0 ? budget - totalSpent : 0;
    const budgetHealth = budget === 0 ? 'warning' : remainingBudget < 0 ? 'danger' : remainingBudget < budget * 0.2 ? 'warning' : 'safe';

    // Progress circle calculation
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const progress = budget > 0 ? Math.min((remainingBudget / budget), 1) : 0;
    const strokeDashoffset = circumference - (progress * circumference);

    // Category distribution for Donut Chart
    const categoryMap = {};
    expenses.filter(e => e.status === 'purchased').forEach(exp => {
        const cat = exp.category || 'Diğer';
        categoryMap[cat] = (categoryMap[cat] || 0) + Number(exp.amount);
    });

    const pieData = Object.keys(categoryMap).map((cat, idx) => ({
        name: cat,
        amount: categoryMap[cat] || 0,
        color: ['#D4AF37', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'][idx % 6],
        legendFontColor: '#6b7280',
        legendFontSize: 12
    })).filter(item => item.amount > 0);

    // Line chart data (spending over time - mock data for now)
    const lineData = {
        labels: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'],
        datasets: [{
            data: expenses.length > 0 && totalSpent > 0 ?
                [0, Math.max(totalSpent * 0.1, 1), Math.max(totalSpent * 0.3, 1), Math.max(totalSpent * 0.5, 1), Math.max(totalSpent * 0.8, 1), totalSpent] :
                [0, 10, 20, 30, 40, 50]
        }]
    };

    // Recent transactions (last 5)
    const recentExpenses = [...expenses]
        .filter(e => e.status === 'purchased')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    // Top expenses
    const topExpenses = [...expenses]
        .filter(e => e.status === 'purchased')
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 3);

    const getMessage = () => {
        if (budget === 0) return "Lütfen bütçenizi ayarlayın 💰";
        if (daysDiff < 30) return "Düğününüz çok yakında! 🎉";
        if (budgetHealth === 'danger') return "Bütçe aşıldı, harcamalara dikkat edin! ⚠️";
        if (budgetHealth === 'warning') return "Bütçenizin %80'ini kullandınız.";
        return "Her şey yolunda gidiyor! 💚";
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Mobile Header */}
            <View style={[styles.mobileHeader, { paddingTop: insets.top + 8 }]}>
                <View style={styles.headerLeft}>
                    <LinearGradient
                        colors={['#D4AF37', '#C5A028']}
                        style={styles.headerLogo}
                    >
                        <Text style={styles.headerLogoIcon}>❤️</Text>
                    </LinearGradient>
                    <Text style={styles.headerTitle}>Düğün Bütçem</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerButton}>
                        <Ionicons name="notifications-outline" size={22} color="#111827" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton}>
                        <Ionicons name="people-outline" size={22} color="#111827" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onLogout} style={styles.headerButton}>
                        <Ionicons name="log-out-outline" size={22} color="#111827" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
            >
                {/* Hero Card */}
                <LinearGradient
                    colors={['#0f172a', '#000000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroBlurRight} />
                    <View style={styles.heroBlurLeft} />

                    <View style={styles.heroContent}>
                        <Text style={styles.heroGreeting}>Merhaba, {user?.name || user?.username} 👋</Text>

                        <View style={styles.heroStatsRow}>
                            {/* Countdown Circle */}
                            <View style={styles.countdownContainer}>
                                <Svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: [{ rotate: '-90deg' }] }}>
                                    <Circle cx="32" cy="32" r={radius} stroke="#333" strokeWidth="3" fill="none" />
                                    <Circle
                                        cx="32" cy="32"
                                        r={radius}
                                        stroke={budgetHealth === 'danger' ? '#DC2626' : "#D4AF37"}
                                        strokeWidth="3"
                                        fill="none"
                                        strokeDasharray={`${circumference} ${circumference}`}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                    />
                                </Svg>
                                <View style={styles.countdownTextContainer}>
                                    <Text style={styles.countdownValue}>{daysDiff}</Text>
                                    <Text style={styles.countdownLabel}>Gün</Text>
                                </View>
                            </View>

                            <View style={styles.heroDivider} />

                            {/* Budget Info */}
                            <View style={styles.heroBudgetInfo}>
                                <Text style={styles.heroLabel}>KALAN BÜTÇE</Text>
                                <Text style={styles.heroValue}>
                                    {formatCurrency(remainingBudget)}
                                </Text>
                                <Text style={[
                                    styles.heroPercentage,
                                    budgetHealth === 'danger' && styles.budgetDanger,
                                    budgetHealth === 'safe' && styles.budgetSafe,
                                ]}>
                                    {budgetHealth === 'danger' ? 'Bütçe Aşıldı' : budget > 0 ? `%${Math.round((remainingBudget / budget) * 100)} Mevcut` : '%0 Mevcut'}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.heroMessage}>{getMessage()}</Text>
                        {budget === 0 && (
                            <TouchableOpacity
                                style={styles.setBudgetButton}
                                onPress={() => setBudgetModalVisible(true)}
                            >
                                <Ionicons name="wallet" size={18} color="#fff" />
                                <Text style={styles.setBudgetButtonText}>Bütçe Ayarla</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, budgetHealth === 'danger' && styles.statCardDanger]}>
                        <View style={styles.statHeader}>
                            <View style={[styles.statIcon, budgetHealth === 'danger' ? styles.statIconDanger : styles.statIconPink]}>
                                <Ionicons name="cash-outline" size={20} color={budgetHealth === 'danger' ? '#dc2626' : '#ec4899'} />
                            </View>
                            <View style={styles.statBadge}>
                                <Text style={styles.statBadgeText}>Gerçekleşen</Text>
                            </View>
                        </View>
                        <Text style={styles.statLabel}>Toplam Harcama</Text>
                        <Text style={[styles.statValue, budgetHealth === 'danger' && styles.statValueDanger]}>{formatCurrency(totalSpent)}</Text>
                        <Text style={styles.statInfo}>{expenses.filter(e => e.status === 'purchased').length} İşlem</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <View style={[styles.statIcon, styles.statIconYellow]}>
                                <Ionicons name="time-outline" size={20} color="#eab308" />
                            </View>
                            <View style={styles.statBadge}>
                                <Text style={styles.statBadgeText}>Planlanan</Text>
                            </View>
                        </View>
                        <Text style={styles.statLabel}>Planlanan Harcama</Text>
                        <Text style={styles.statValue}>{formatCurrency(totalPlanned)}</Text>
                        <Text style={styles.statInfo}>{expenses.filter(e => e.status === 'planned').length} İşlem</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <View style={[styles.statIcon, styles.statIconBlue]}>
                                <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
                            </View>
                            <View style={styles.statBadge}>
                                <Text style={styles.statBadgeText}>Aylık</Text>
                            </View>
                        </View>
                        <Text style={styles.statLabel}>Taksit Yükü</Text>
                        <Text style={styles.statValue}>{formatCurrency(totalInstallments)}</Text>
                        <Text style={[styles.statInfo, { opacity: 0 }]}>-</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <View style={[styles.statIcon, styles.statIconGreen]}>
                                <Ionicons name="wallet-outline" size={20} color="#10b981" />
                            </View>
                            <View style={styles.statBadge}>
                                <Text style={styles.statBadgeText}>Varlıklar</Text>
                            </View>
                        </View>
                        <Text style={styles.statLabel}>Kalan Bakiye</Text>
                        <Text style={styles.statValue}>{formatCurrency(remainingBudget)}</Text>
                        <Text style={styles.statInfo}>Güncel</Text>
                    </View>
                </View>

                {/* Category Distribution (Donut Chart) */}
                {pieData.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Kategori Dağılımı</Text>
                            <TouchableOpacity>
                                <Text style={styles.sectionLink}>Detaylar</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.chartCard}>
                            <PieChart
                                data={pieData}
                                width={screenWidth - 60}
                                height={200}
                                chartConfig={{
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                }}
                                accessor="amount"
                                backgroundColor="transparent"
                                paddingLeft="0"
                                center={[10, 0]}
                                absolute={false}
                                hasLegend={true}
                            />
                        </View>
                    </View>
                )}

                {/* Spending Over Time (Area Chart) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Harcama Özeti</Text>
                        <TouchableOpacity>
                            <Ionicons name="bar-chart-outline" size={20} color="#D4AF37" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.chartCard}>
                        <LineChart
                            data={lineData}
                            width={screenWidth - 60}
                            height={200}
                            chartConfig={{
                                backgroundColor: '#fff',
                                backgroundGradientFrom: '#fff',
                                backgroundGradientTo: '#fff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: {
                                    r: '4',
                                    strokeWidth: '2',
                                    stroke: '#D4AF37'
                                }
                            }}
                            bezier
                            style={{ borderRadius: 16 }}
                        />
                    </View>
                </View>

                {/* Recent Transactions */}
                {recentExpenses.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Gerçek Giderler</Text>
                            <TouchableOpacity>
                                <Text style={styles.sectionLink}>Tümünü Gör</Text>
                            </TouchableOpacity>
                        </View>
                        {recentExpenses.map((exp, idx) => (
                            <TouchableOpacity key={idx} style={styles.transactionItem}>
                                <View style={styles.transactionLeft}>
                                    <View style={styles.transactionIcon}>
                                        <Ionicons name="pricetag-outline" size={18} color="#D4AF37" />
                                    </View>
                                    <View>
                                        <Text style={styles.transactionTitle}>{exp.name}</Text>
                                        <Text style={styles.transactionDate}>
                                            {new Date(exp.date).toLocaleDateString('tr-TR')}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.transactionAmount}>{formatCurrency(exp.amount)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Budget Progress */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Harcama Hızı</Text>
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Bütçe Kullanımı</Text>
                            <Text style={styles.progressValue}>
                                {budget > 0 ? Math.round((totalSpent / budget) * 100) : 0}%
                            </Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${Math.min((totalSpent / budget) * 100, 100)}%`,
                                        backgroundColor: budgetHealth === 'danger' ? '#dc2626' : '#D4AF37'
                                    }
                                ]}
                            />
                        </View>
                        {budgetHealth === 'danger' && (
                            <View style={styles.alertBox}>
                                <Ionicons name="warning-outline" size={16} color="#dc2626" />
                                <Text style={styles.alertText}>
                                    Dikkat! Harcama bütçenizi aştı. Kalemlerinizi gözden geçirin.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Top Expenses */}
                {topExpenses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>En Çok Harcamalar</Text>
                        {topExpenses.map((exp, idx) => (
                            <View key={idx} style={styles.topExpenseItem}>
                                <View style={styles.topExpenseRank}>
                                    <Text style={styles.topExpenseRankText}>#{idx + 1}</Text>
                                </View>
                                <View style={styles.topExpenseInfo}>
                                    <Text style={styles.topExpenseTitle}>{exp.name}</Text>
                                    <Text style={styles.topExpenseCategory}>{exp.category}</Text>
                                </View>
                                <Text style={styles.topExpenseAmount}>{formatCurrency(exp.amount)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Partner Section (if applicable) */}
                {data?.partner && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Partner Harcama Dağılımı</Text>
                            <Ionicons name="people" size={20} color="#D4AF37" />
                        </View>
                        <View style={styles.partnerCard}>
                            <View style={styles.partnerRow}>
                                <View style={styles.partnerAvatar}>
                                    <Text style={styles.partnerInitial}>
                                        {data.partner.name?.[0] || 'P'}
                                    </Text>
                                </View>
                                <View style={styles.partnerInfo}>
                                    <Text style={styles.partnerName}>{data.partner.name}</Text>
                                    <Text style={styles.partnerAmount}>
                                        {formatCurrency(data.partner.totalSpent || 0)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Bottom Padding for Tab Bar */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Budget Setter Modal */}
            <BudgetSetterModal
                visible={budgetModalVisible}
                onClose={() => setBudgetModalVisible(false)}
                onBudgetSet={(newBudget) => {
                    setBudgetModalVisible(false);
                    fetchData();
                }}
                currentBudget={budget}
                user={user}
            />
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
    mobileHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    // Hero Card
    heroCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    heroBlurRight: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 128,
        height: 128,
        borderRadius: 999,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
    },
    heroBlurLeft: {
        position: 'absolute',
        bottom: -20,
        left: -20,
        width: 96,
        height: 96,
        borderRadius: 999,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    heroContent: {
        position: 'relative',
        zIndex: 10,
    },
    heroGreeting: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 24,
        color: '#FFFFFF',
        marginBottom: 20,
    },
    heroStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    countdownContainer: {
        width: 64,
        height: 64,
        position: 'relative',
    },
    countdownTextContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countdownValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    countdownLabel: {
        fontSize: 10,
        color: '#9ca3af',
    },
    heroDivider: {
        width: 1,
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    heroBudgetInfo: {
        flex: 1,
    },
    heroLabel: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: '600',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    heroValue: {
        fontFamily: 'Lato-Bold',
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    heroPercentage: {
        fontSize: 13,
        color: '#FFFFFF',
    },
    budgetDanger: {
        color: '#fca5a5',
    },
    budgetSafe: {
        color: '#6ee7b7',
    },
    heroMessage: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: 12,
    },
    setBudgetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#D4AF37',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 16,
        alignSelf: 'center',
    },
    setBudgetButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },

    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 3,
    },
    statCardDanger: {
        borderWidth: 2,
        borderColor: '#fecaca',
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statIconDanger: {
        backgroundColor: '#fee2e2',
    },
    statIconPink: {
        backgroundColor: '#fce7f3',
    },
    statIconYellow: {
        backgroundColor: '#fef3c7',
    },
    statIconBlue: {
        backgroundColor: '#dbeafe',
    },
    statIconGreen: {
        backgroundColor: '#d1fae5',
    },
    statBadge: {
        backgroundColor: '#f9fafb',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statBadgeText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    statLabel: {
        fontFamily: 'PlayfairDisplay-SemiBold',
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 6,
    },
    statValue: {
        fontFamily: 'Lato-Bold',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    statValueDanger: {
        color: '#dc2626',
    },
    statInfo: {
        fontSize: 12,
        color: '#9ca3af',
    },
    // Sections
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 18,
        color: '#111827',
    },
    sectionLink: {
        color: '#D4AF37',
        fontSize: 14,
        fontWeight: '600',
    },
    chartCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    // Transactions
    transactionItem: {
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
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    transactionAmount: {
        fontFamily: 'Lato-Bold',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    // Progress
    progressCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    progressValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    alertBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        padding: 12,
        backgroundColor: '#fee2e2',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#dc2626',
    },
    alertText: {
        flex: 1,
        fontSize: 12,
        color: '#991b1b',
    },
    // Top Expenses
    topExpenseItem: {
        flexDirection: 'row',
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
    topExpenseRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    topExpenseRankText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#D4AF37',
    },
    topExpenseInfo: {
        flex: 1,
    },
    topExpenseTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    topExpenseCategory: {
        fontSize: 12,
        color: '#9ca3af',
    },
    topExpenseAmount: {
        fontFamily: 'Lato-Bold',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    // Partner
    partnerCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    partnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    partnerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#D4AF37',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    partnerInitial: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    partnerInfo: {
        flex: 1,
    },
    partnerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    partnerAmount: {
        fontFamily: 'Lato-Bold',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D4AF37',
    },
});

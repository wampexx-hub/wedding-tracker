import { StatusBar } from 'expo-status-bar';
import { Alert, StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizeAsset, formatCurrency } from '../utils/dataHelpers';

// Asset Types Configuration
const ASSET_TYPES = [
    { id: 'TRY_CASH', label: 'Türk Lirası', icon: 'cash', symbol: '₺' },
    { id: 'USD', label: 'Amerikan Doları', icon: 'logo-usd', symbol: '$' },
    { id: 'EUR', label: 'Euro', icon: 'logo-euro', symbol: '€' },
    { id: 'GBP', label: 'İngiliz Sterlini', icon: 'logo-yen', symbol: '£' }, // Yen icon used as placeholder for generic currency if pound unavailable
    { id: 'GRAM', label: 'Gram Altın', icon: 'diamond', symbol: 'Gr' },
    { id: 'CEYREK', label: 'Çeyrek Altın', icon: 'diamond', symbol: 'Çeyrek' },
    { id: 'YARIM', label: 'Yarım Altın', icon: 'diamond', symbol: 'Yarım' },
    { id: 'TAM', label: 'Tam Altın', icon: 'diamond', symbol: 'Tam' },
];

export default function AssetsScreen({ route, user: userProp }) {
    const insets = useSafeAreaInsets();
    const [assets, setAssets] = useState([]);
    const [rates, setRates] = useState({});
    const [refreshing, setRefreshing] = useState(false);

    // User Settings
    const [budgetIncluded, setBudgetIncluded] = useState(true);

    // Form State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedType, setSelectedType] = useState(ASSET_TYPES[0]);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    const user = userProp || route.params?.user || { username: 'dummyy' };
    const username = user.username;

    const fetchUserSettings = useCallback(async () => {
        try {
            const response = await fetch(`https://dugunbutcem.com/api/portfolio/${username}`);
            if (response.ok) {
                const data = await response.json();
                setBudgetIncluded(data.budgetIncluded ?? true);
            }
        } catch (e) {
            console.error('Settings fetch error:', e);
        }
    }, [username]);

    const fetchAssets = useCallback(async () => {
        try {
            const response = await fetch(`https://dugunbutcem.com/api/data?user=${username}`);
            const data = await response.json();
            const normalized = (data.portfolio || []).map(normalizeAsset).filter(Boolean);
            setAssets(normalized);
        } catch (error) {
            console.error('Assets fetch error:', error);
        }
    }, [username]);

    const fetchRates = useCallback(async () => {
        try {
            const response = await fetch('https://dugunbutcem.com/api/rates');
            const data = await response.json();

            setRates({
                USD: data.USD || 0,
                EUR: data.EUR || 0,
                GBP: data.GBP || 0,
                GRAM: data.GRAM_GOLD || data.GRAM || 0,
                CEYREK: data.CEYREK || 0,
                YARIM: data.YARIM || 0,
                TAM: data.TAM || 0
            });
        } catch (error) {
            console.error('Rates fetch error:', error);
        }
    }, []);

    const fetchData = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchAssets(), fetchRates(), fetchUserSettings()]);
        setRefreshing(false);
    }, [fetchAssets, fetchRates, fetchUserSettings]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchRates, 60000);
        return () => clearInterval(interval);
    }, [fetchData, fetchRates]);

    const toggleBudgetInclusion = async () => {
        const newValue = !budgetIncluded;
        setBudgetIncluded(newValue); // Optimistic update
        try {
            await fetch(`https://dugunbutcem.com/api/portfolio/${user.username}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ budgetIncluded: newValue })
            });
        } catch (error) {
            console.error('Toggle error:', error);
            setBudgetIncluded(!newValue); // Revert on fail
        }
    };

    const handleAddAsset = async () => {
        // Validate and parse amount properly
        const parsedAmount = amount && amount.trim() !== '' ? parseFloat(amount) : 0;

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert('Hata', 'Lütfen geçerli bir miktar girin');
            return;
        }

        try {
            const endpoint = selectedType.id === 'TRY_CASH'
                ? 'https://dugunbutcem.com/api/assets'
                : `https://dugunbutcem.com/api/portfolio/${user.username}`;

            const payload = selectedType.id === 'TRY_CASH'
                ? {
                    username: user.username,
                    asset: {
                        category: 'Nakit',
                        name: 'Nakit',
                        amount: parsedAmount, // Use parsed float
                        value: parsedAmount,  // Use parsed float
                        date: new Date().toISOString()
                    }
                }
                : {
                    username: user.username,
                    type: selectedType.id,
                    amount: parsedAmount, // Use parsed float
                    note: note
                };

            console.log('🔍 Asset API Request:', {
                endpoint,
                method: 'POST',
                payload,
                amountType: typeof parsedAmount,
                amountValue: parsedAmount
            });

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('📡 Asset API Response:', {
                status: response.status,
                ok: response.ok
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error:', errorText);
                throw new Error(`Server error: ${errorText}`);
            }

            setModalVisible(false);
            setAmount('');
            setNote('');

            // Immediate state refresh
            await fetchData();

            Alert.alert('Başarılı', 'Varlık eklendi');

        } catch (e) {
            console.error('💥 Exception:', e);
            Alert.alert('Hata', `Varlık eklenemedi: ${e.message}`);
        }
    };

    const handleDelete = async (asset) => {
        Alert.alert('Sil', 'Bu varlığı silmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const isPortfolio = asset.type !== 'TRY_CASH' && asset.type !== 'Nakit';
                        const endpoint = isPortfolio
                            ? `https://dugunbutcem.com/api/portfolio/${user.username}/${asset.id}`
                            : `https://dugunbutcem.com/api/assets/${asset.id}?username=${user.username}`;

                        await fetch(endpoint, { method: 'DELETE' });
                        fetchData();
                    } catch {
                        Alert.alert('Hata', 'Silinemedi');
                    }
                }
            }
        ]);
    };

    const calculateTotal = () => {
        return assets.reduce((total, asset) => {
            if (asset.type === 'TRY_CASH' || asset.type === 'Nakit') {
                return total + asset.amount;
            } else if (budgetIncluded) {
                const rate = rates[asset.type] || 0;
                return total + (asset.amount * rate);
            }
            return total;
        }, 0);
    };

    // Grand total - always shows all assets regardless of toggle
    const calculateGrandTotal = () => {
        return assets.reduce((total, asset) => {
            if (asset.type === 'TRY_CASH' || asset.type === 'Nakit') {
                return total + asset.amount;
            } else {
                const rate = rates[asset.type] || 0;
                return total + (asset.amount * rate);
            }
        }, 0);
    };

    const renderAssetItem = ({ item }) => {
        const isCash = item.type === 'TRY_CASH' || item.type === 'Nakit';
        const rate = rates[item.type] || 1;
        const valueTRY = item.amount * (isCash ? 1 : rate);
        const typeConfig = ASSET_TYPES.find(t => t.id === item.type) || { label: item.type, icon: 'cash', symbol: '' };

        return (
            <View style={styles.assetItem}>
                <View style={styles.assetIcon}>
                    <Ionicons name={typeConfig.icon} size={24} color="#D4AF37" />
                </View>
                <View style={styles.assetInfo}>
                    <Text style={styles.assetName}>{typeConfig.label}</Text>
                    <Text style={styles.assetSub}>{item.note || formatDate(item.addedAt)}</Text>
                </View>
                <View style={styles.assetValueContainer}>
                    <Text style={styles.assetValueTRY}>{formatCurrency(valueTRY)}</Text>
                    {!isCash && (
                        <Text style={styles.assetAmountOriginal}>{item.amount} {typeConfig.symbol}</Text>
                    )}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('tr-TR');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.headerTitle}>Birikimlerim</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
            >
                {/* Total Budget Card */}
                <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Portföy Değeri</Text>
                    <Text style={styles.totalAmount}>{formatCurrency(calculateGrandTotal())}</Text>
                    <Text style={styles.totalSubtext}>Güncel kurlarla TL karşılığı</Text>

                    <View style={styles.budgetToggleRow}>
                        <Text style={styles.toggleLabel}>Döviz/Altın Bütçeye Dahil</Text>
                        <TouchableOpacity onPress={toggleBudgetInclusion}>
                            <Ionicons
                                name={budgetIncluded ? "toggle" : "toggle-outline"}
                                size={28}
                                color={budgetIncluded ? "#10b981" : "#9ca3af"}
                            />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Rates Ticker */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ticker}>
                    {Object.entries(rates).map(([key, val]) => (
                        <View key={key} style={styles.rateChip}>
                            <Text style={styles.rateKey}>{key}</Text>
                            <Text style={styles.rateVal}>{formatCurrency(val, { showDecimals: true }).replace('₺', '')}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Assets List */}
                <View style={styles.listContainer}>
                    {assets.map(item => (
                        <View key={item.id} style={styles.cardWrapper}>
                            {renderAssetItem({ item })}
                        </View>
                    ))}
                    {assets.length === 0 && (
                        <Text style={styles.emptyText}>Henüz varlık eklenmemiş.</Text>
                    )}
                </View>
            </ScrollView>

            {/* Add Asset Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Birikim Ekle</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {/* Type Selector */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                            {ASSET_TYPES.map(type => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[styles.typeChip, selectedType.id === type.id && styles.typeChipActive]}
                                    onPress={() => setSelectedType(type)}
                                >
                                    <Text style={[styles.typeText, selectedType.id === type.id && styles.typeTextActive]}>{type.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Miktar ({selectedType.symbol})</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0.00"
                            />
                        </View>

                        {selectedType.id !== 'TRY_CASH' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Not (Opsiyonel)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={note}
                                    onChangeText={setNote}
                                    placeholder="Örn: Yastık altı"
                                />
                            </View>
                        )}

                        <TouchableOpacity style={styles.saveButton} onPress={handleAddAsset}>
                            <Text style={styles.saveButtonText}>Kaydet</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFBF7' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f3f4f6'
    },
    headerTitle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, color: '#111827' },
    addButton: { backgroundColor: '#D4AF37', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20 },
    totalCard: { padding: 20, borderRadius: 20, marginBottom: 20 },
    totalLabel: { color: '#94a3b8', fontFamily: 'Lato-Regular', fontSize: 14 },
    totalAmount: { color: '#fff', fontFamily: 'Lato-Bold', fontSize: 32, marginVertical: 8 },
    totalSubtext: { color: '#cbd5e1', fontSize: 12, marginBottom: 8 },
    budgetToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12 },
    toggleLabel: { color: '#cbd5e1', fontSize: 14 },
    ticker: { maxHeight: 40, marginBottom: 20 },
    rateChip: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', gap: 6 },
    rateKey: { fontWeight: 'bold', color: '#64748b' },
    rateVal: { color: '#0f172a' },
    listContainer: { gap: 12 },
    emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
    cardWrapper: { backgroundColor: '#fff', borderRadius: 16, padding: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    assetItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    assetIcon: { width: 48, height: 48, backgroundColor: '#fffbeb', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    assetInfo: { flex: 1 },
    assetName: { fontFamily: 'Lato-Bold', fontSize: 16, color: '#1e293b' },
    assetSub: { fontSize: 12, color: '#64748b' },
    assetValueContainer: { alignItems: 'flex-end', marginRight: 12 },
    assetValueTRY: { fontFamily: 'Lato-Bold', fontSize: 16, color: '#111827' },
    assetAmountOriginal: { fontSize: 12, color: '#64748b' },
    deleteButton: { padding: 8 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold' },
    typeSelector: { flexDirection: 'row', marginBottom: 24, maxHeight: 50 },
    typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8, height: 36 },
    typeChipActive: { backgroundColor: '#D4AF37' },
    typeText: { color: '#4b5563' },
    typeTextActive: { color: '#fff', fontWeight: 'bold' },
    inputGroup: { marginBottom: 20 },
    label: { marginBottom: 8, color: '#374151', fontWeight: '500' },
    input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16 },
    saveButton: { backgroundColor: '#D4AF37', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

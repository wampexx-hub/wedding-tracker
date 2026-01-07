import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizeAsset, formatCurrency } from '../utils/dataHelpers';

export default function AssetsScreen({ route }) {
    const insets = useSafeAreaInsets();
    const [assets, setAssets] = useState([]);
    const [currencyRates, setCurrencyRates] = useState({ USD: 0, EUR: 0, GBP: 0 });
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [includeForeignInBudget, setIncludeForeignInBudget] = useState(true);

    // Add asset form state
    const [selectedAssetType, setSelectedAssetType] = useState('TRY_CASH');
    const [assetAmount, setAssetAmount] = useState('');
    const [assetNote, setAssetNote] = useState('');

    const user = route.params?.user || { username: 'dummyy' };

    useEffect(() => {
        fetchAssets();
        fetchCurrencyRates();
        const interval = setInterval(fetchCurrencyRates, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const fetchAssets = async () => {
        try {
            const response = await fetch(`https://dugunbutcem.com/api/data?user=${user.username}`);
            const data = await response.json();
            const normalized = (data.portfolio || []).map(normalizeAsset).filter(Boolean);
            setAssets(normalized);
        } catch (error) {
            console.error('Assets fetch error:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const fetchCurrencyRates = async () => {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
            const data = await response.json();

            setCurrencyRates({
                USD: (1 / data.rates.USD).toFixed(2),
                EUR: (1 / data.rates.EUR).toFixed(2),
                GBP: (1 / data.rates.GBP).toFixed(2)
            });

            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            setLastUpdate(`${hours}:${minutes}`);
        } catch (error) {
            console.error('Currency fetch error:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAssets();
        fetchCurrencyRates();
    };

    // Determine if asset type is portfolio (foreign currency or gold)
    const isPortfolioType = (type) => {
        return ['USD', 'EUR', 'GBP', 'GRAM', 'CEYREK', 'YARIM', 'TAM'].includes(type);
    };

    // Add new asset
    const handleAddAsset = async () => {
        if (!assetAmount || Number(assetAmount) <= 0) {
            Alert.alert('Hata', 'Lütfen geçerli bir miktar girin');
            return;
        }

        try {
            const isPortfolio = isPortfolioType(selectedAssetType);
            const endpoint = isPortfolio 
                ? `https://dugunbutcem.com/api/portfolio/${user.username}`
                : 'https://dugunbutcem.com/api/assets';

            const payload = isPortfolio
                ? { type: selectedAssetType, amount: Number(assetAmount), note: assetNote }
                : { 
                    username: user.username,
                    asset: { 
                        category: 'Nakit', 
                        name: selectedAssetType, 
                        amount: Number(assetAmount), 
                        value: Number(assetAmount), 
                        date: new Date().toISOString() 
                    }
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isPortfolio ? { username: user.username, ...payload } : payload)
            });

            if (!response.ok) throw new Error('Server error');

            // Reset form
            setAssetAmount('');
            setAssetNote('');
            
            // Refresh assets
            fetchAssets();
            
            Alert.alert('Başarılı', 'Varlık eklendi');
        } catch (error) {
            console.error('Add asset error:', error);
            Alert.alert('Hata', 'Varlık eklenemedi');
        }
    };

    // Delete asset
    const handleDeleteAsset = async (assetId, isPortfolio) => {
        Alert.alert(
            'Varlığı Sil',
            'Bu varlığı silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const endpoint = isPortfolio
                                ? `https://dugunbutcem.com/api/portfolio/${user.username}/${assetId}`
                                : `https://dugunbutcem.com/api/assets/${assetId}?username=${user.username}`;

                            const response = await fetch(endpoint, { method: 'DELETE' });
                            
                            if (!response.ok) throw new Error('Server error');
                            
                            fetchAssets();
                            Alert.alert('Başarılı', 'Varlık silindi');
                        } catch (error) {
                            console.error('Delete asset error:', error);
                            Alert.alert('Hata', 'Varlık silinemedi');
                        }
                    }
                }
            ]
        );
    };

    // Calculate total assets value
    const calculateTotalAssets = () => {
        let total = 0;
        assets.forEach(asset => {
            if (asset.type === 'TRY_CASH') {
                total += asset.amount;
            } else if (includeForeignInBudget) {
                // Convert foreign currencies to TRY
                if (asset.type === 'USD') total += asset.amount * Number(currencyRates.USD);
                else if (asset.type === 'EUR') total += asset.amount * Number(currencyRates.EUR);
                else if (asset.type === 'GBP') total += asset.amount * Number(currencyRates.GBP);
                // Gold conversions (simplified - would need real gold prices)
                else if (asset.type === 'GRAM') total += asset.amount * 3000; // Approximate
                else if (asset.type === 'CEYREK') total += asset.amount * 6000;
                else if (asset.type === 'YARIM') total += asset.amount * 12000;
                else if (asset.type === 'TAM') total += asset.amount * 24000;
            }
        });
        return total;
    };

    const totalAssets = calculateTotalAssets();

    // Group assets by type
    const cashAssets = assets.filter(a => a.type === 'TRY_CASH');
    const foreignAssets = assets.filter(a => ['USD', 'EUR', 'GBP'].includes(a.type));
    const goldAssets = assets.filter(a => ['GRAM', 'CEYREK', 'YARIM', 'TAM'].includes(a.type));

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
                    <Text style={styles.headerTitle}>Varlıklar</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
            >
                {/* Total Assets Card */}
                <LinearGradient
                    colors={['#0f172a', '#000000']}
                    style={styles.totalCard}
                >
                    <View style={styles.totalHeader}>
                        <Text style={styles.totalLabel}>Toplam Varlık</Text>
                        <TouchableOpacity>
                            <Ionicons name="trending-up" size={20} color="#10b981" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.totalAmount}>{formatCurrency(totalAssets)}</Text>
                    {lastUpdate && (
                        <Text style={styles.lastUpdate}>SON GÜNCELLEME {lastUpdate}</Text>
                    )}
                </LinearGradient>

                {/* Currency Rates Ticker */}
                <View style={styles.ratesTicker}>
                    <View style={styles.rateItem}>
                        <Ionicons name="logo-usd" size={16} color="#3b82f6" />
                        <Text style={styles.rateLabel}>USD</Text>
                        <Text style={styles.rateValue}>: {currencyRates.USD}₺</Text>
                    </View>
                    <View style={styles.rateItem}>
                        <Ionicons name="cash" size={16} color="#10b981" />
                        <Text style={styles.rateLabel}>EUR</Text>
                        <Text style={styles.rateValue}>: {currencyRates.EUR}₺</Text>
                    </View>
                    <View style={styles.rateItem}>
                        <Ionicons name="cash" size={16} color="#6366f1" />
                        <Text style={styles.rateLabel}>GBP</Text>
                        <Text style={styles.rateValue}>: {currencyRates.GBP}₺</Text>
                    </View>
                </View>

                {/* Budget Toggle */}
                <View style={styles.budgetToggle}>
                    <TouchableOpacity
                        style={[styles.toggleButton, includeForeignInBudget && styles.toggleButtonActive]}
                        onPress={() => setIncludeForeignInBudget(!includeForeignInBudget)}
                    >
                        <Ionicons
                            name={includeForeignInBudget ? "checkmark-circle" : "ellipse-outline"}
                            size={20}
                            color={includeForeignInBudget ? "#D4AF37" : "#9ca3af"}
                        />
                        <Text style={[styles.toggleText, includeForeignInBudget && styles.toggleTextActive]}>
                            Bütçeye Dahil
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Add New Asset */}
                <View style={styles.addAssetSection}>
                    <View style={styles.addAssetRow}>
                        <TouchableOpacity style={styles.currencySelector}>
                            <Ionicons name="cash" size={20} color="#10b981" />
                            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.amountInput}
                            value={assetAmount}
                            onChangeText={setAssetAmount}
                            placeholder="0"
                            keyboardType="numeric"
                            placeholderTextColor="#d1d5db"
                        />
                        <TouchableOpacity style={styles.addButton}>
                            <Ionicons name="add-circle" size={32} color="#D4AF37" />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={styles.noteInput}
                        value={assetNote}
                        onChangeText={setAssetNote}
                        placeholder="Not ekle (Opsiyonel)..."
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                {/* Nakit Varlıklar */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nakit Varlıklar</Text>
                    {cashAssets.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Nakit varlık bulunmuyor</Text>
                        </View>
                    ) : (
                        cashAssets.map(asset => (
                            <AssetItem key={asset.id} asset={asset} symbol="₺" onDelete={() => handleDeleteAsset(asset.id, false)} />
                        ))
                    )}
                </View>

                {/* Döviz Varlıkları */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Döviz Varlıkları</Text>
                    {foreignAssets.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Döviz varlığı bulunmuyor</Text>
                        </View>
                    ) : (
                        foreignAssets.map(asset => (
                            <AssetItem key={asset.id} asset={asset} rate={currencyRates[asset.type]} onDelete={() => handleDeleteAsset(asset.id, true)} />
                        ))
                    )}
                </View>

                {/* Altın Varlıkları */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Altın Varlıkları</Text>
                    {goldAssets.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Altın varlığı bulunmuyor</Text>
                        </View>
                    ) : (
                        goldAssets.map(asset => (
                            <AssetItem key={asset.id} asset={asset} onDelete={() => handleDeleteAsset(asset.id, true)} />
                        ))
                    )}
                </View>

                {/* Bottom padding */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

// Asset Item Component
function AssetItem({ asset, symbol, rate, onDelete }) {
    const getAssetIcon = (type) => {
        switch (type) {
            case 'TRY_CASH': return 'cash';
            case 'USD': return 'logo-usd';
            case 'EUR': return 'cash';
            case 'GBP': return 'cash';
            case 'GRAM':
            case 'CEYREK':
            case 'YARIM':
            case 'TAM':
                return 'diamond';
            default: return 'wallet';
        }
    };

    const getAssetLabel = (type) => {
        const labels = {
            'TRY_CASH': 'Türk Lirası',
            'USD': 'Amerikan Doları',
            'EUR': 'Euro',
            'GBP': 'İngiliz Sterlini',
            'GRAM': 'Gram Altın',
            'CEYREK': 'Çeyrek Altın',
            'YARIM': 'Yarım Altın',
            'TAM': 'Tam Altın'
        };
        return labels[type] || type;
    };

    return (
        <View style={styles.assetItem}>
            <View style={styles.assetLeft}>
                <View style={styles.assetIcon}>
                    <Ionicons name={getAssetIcon(asset.type)} size={20} color="#D4AF37" />
                </View>
                <View style={styles.assetInfo}>
                    <Text style={styles.assetLabel}>{getAssetLabel(asset.type)}</Text>
                    {asset.note && (
                        <Text style={styles.assetNote}>{asset.note}</Text>
                    )}
                </View>
            </View>
            {onDelete && (
                <TouchableOpacity onPress={onDelete} style={styles.assetDeleteButton}>
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
            )}
            <View style={styles.assetRight}>
                <Text style={styles.assetAmount}>
                    {asset.amount.toFixed(2)} {symbol || asset.type}
                </Text>
                {rate && (
                    <Text style={styles.assetTryValue}>
                        ≈ {formatCurrency(asset.amount * Number(rate))}
                    </Text>
                )}
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
    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    // Total Card
    totalCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    totalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    totalLabel: {
        fontSize: 14,
        color: '#9ca3af',
    },
    totalAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    lastUpdate: {
        fontSize: 11,
        color: '#6b7280',
    },
    // Currency Rates
    ratesTicker: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    rateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rateLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111827',
    },
    rateValue: {
        fontSize: 12,
        color: '#6b7280',
    },
    // Budget Toggle
    budgetToggle: {
        marginBottom: 16,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#f9fafb',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    toggleButtonActive: {
        backgroundColor: '#fef3c7',
    },
    toggleText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    toggleTextActive: {
        color: '#D4AF37',
        fontWeight: '600',
    },
    // Add Asset
    addAssetSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    addAssetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
    },
    currencySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f9fafb',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    addButton: {
        padding: 4,
    },
    noteInput: {
        backgroundColor: '#f9fafb',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        fontSize: 14,
        color: '#111827',
    },
    // Section
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    // Asset Item
    assetItem: {
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
    assetLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    assetIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    assetInfo: {
        flex: 1,
    },
    assetLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    assetNote: {
        fontSize: 12,
        color: '#9ca3af',
    },
    assetRight: {
        alignItems: 'flex-end',
    },
    assetAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    assetTryValue: {
        fontSize: 12,
        color: '#9ca3af',
    },
    // Empty State
    emptyState: {
        backgroundColor: '#f9fafb',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
    },
    assetDeleteButton: {
        padding: 8,
        marginLeft: 8,
    },
});

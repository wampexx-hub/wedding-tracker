import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VendorsScreen({ route }) {
    const insets = useSafeAreaInsets();
    const [vendors, setVendors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCity, setSelectedCity] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const categories = ['all', 'Düğün Mekanı', 'Fotoğrafçı', 'Organizasyon', 'Kuaför'];
    const cities = ['all', 'Adana', 'İstanbul', 'Ankara', 'İzmir'];

    useEffect(() => {
        fetchVendors();
    }, [selectedCity, selectedCategory]);

    const fetchVendors = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedCity !== 'all') params.append('city', selectedCity);
            if (selectedCategory !== 'all') params.append('category', selectedCategory);

            const response = await fetch(`https://dugunbutcem.com/api/vendors?${params.toString()}`);
            const data = await response.json();
            setVendors(data || []);
        } catch (error) {
            console.error('Vendors fetch error:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchVendors();
    };

    const filteredVendors = vendors.filter(v => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            v.name?.toLowerCase().includes(query) ||
            v.category?.toLowerCase().includes(query)
        );
    });

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
                    <Text style={styles.headerTitle}>Firmalar</Text>
                </View>
                {selectedCity && selectedCity !== 'all' && (
                    <View style={styles.cityBadge}>
                        <Ionicons name="location" size={14} color="#ec4899" />
                        <Text style={styles.cityBadgeText}>{selectedCity}</Text>
                    </View>
                )}
            </View>

            {/* Search */}
            <View style={styles.searchSection}>
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={20} color="#9ca3af" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Firma veya kategori ara..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>

            {/* Category Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}
                contentContainerStyle={styles.categoriesContent}
            >
                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                        onPress={() => setSelectedCategory(cat)}
                    >
                        <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                            {cat === 'all' ? 'Tümü' : cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
            >
                {filteredVendors.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="business-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>Bu kriterlerde firma bulunamadı.</Text>
                        <Text style={styles.emptySubtitle}>Farklı bir kategori veya şehir deneyin.</Text>
                    </View>
                ) : (
                    filteredVendors.map(vendor => (
                        <VendorCard key={vendor.id} vendor={vendor} />
                    ))
                )}

                {/* Bottom padding */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

// Vendor Card Component
function VendorCard({ vendor }) {
    return (
        <View style={styles.vendorCard}>
            <View style={styles.vendorHeader}>
                <View style={styles.vendorImagePlaceholder}>
                    <Ionicons name="business" size={32} color="#D4AF37" />
                </View>
                {vendor.rank && (
                    <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>#{vendor.rank}</Text>
                    </View>
                )}
            </View>
            <View style={styles.vendorBody}>
                <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
                <Text style={styles.vendorCategory}>{vendor.category}</Text>
                <View style={styles.vendorMeta}>
                    <Ionicons name="location-outline" size={14} color="#9ca3af" />
                    <Text style={styles.vendorCity}>{vendor.city}</Text>
                </View>
                <View style={styles.vendorActions}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="logo-instagram" size={18} color="#ec4899" />
                        <Text style={styles.actionText}>Instagram</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="call" size={18} color="#10b981" />
                        <Text style={styles.actionText}>Ara</Text>
                    </TouchableOpacity>
                </View>
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
    cityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fce7f3',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    cityBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ec4899',
    },
    // Search
    searchSection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FDFBF7',
    },
    searchBox: {
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
    // Categories
    categoriesScroll: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    categoriesContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f9fafb',
        alignSelf: 'flex-start',
    },
    categoryChipActive: {
        backgroundColor: '#0f172a',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    categoryTextActive: {
        color: '#fff',
    },
    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    // Vendor Card
    vendorCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    vendorHeader: {
        position: 'relative',
    },
    vendorImagePlaceholder: {
        height: 140,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#D4AF37',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    rankText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    vendorBody: {
        padding: 16,
    },
    vendorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    vendorCategory: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 8,
    },
    vendorMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
    },
    vendorCity: {
        fontSize: 13,
        color: '#9ca3af',
    },
    vendorActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#f9fafb',
        paddingVertical: 10,
        borderRadius: 8,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
    },
});

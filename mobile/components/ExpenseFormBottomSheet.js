import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Switch,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
    ActionSheetIOS,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useNavigationState } from '@react-navigation/native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85; // 85% of screen height

export default function ExpenseFormBottomSheet({ visible, onClose, onExpenseAdded, expense, user }) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Düğün');
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('Nakit');
    const [image, setImage] = useState(null);
    const [isInstallment, setIsInstallment] = useState(false);
    const [installmentCount, setInstallmentCount] = useState('1');
    const [status, setStatus] = useState('purchased');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const translateY = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const navigation = useNavigation();
    const currentRoute = useNavigationState(state => state?.routes[state.index]?.name);

    useEffect(() => {
        if (visible) {
            // Reset to closed position first
            translateY.setValue(BOTTOM_SHEET_HEIGHT);
            backdropOpacity.setValue(0);

            // Then animate to open position
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 10,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Load expense data if editing
            if (expense) {
                setTitle(expense.title || '');
                setCategory(expense.category || 'Düğün');
                setAmount(expense.amount?.toString() || '');
                setSource(expense.source || 'Nakit');
                setIsInstallment(expense.isInstallment || false);
                setInstallmentCount(expense.installmentCount?.toString() || '1');
                setStatus(expense.status || 'purchased');
                setNotes(expense.notes || '');
                setImage(expense.imageUrl ? `https://dugunbutcem.com${expense.imageUrl}` : null);
            } else {
                resetForm();
            }
        }
    }, [visible, expense]);

    // Close bottom sheet when navigating to different tab
    useEffect(() => {
        if (visible && currentRoute) {
            handleClose();
        }
    }, [currentRoute]);

    const resetForm = () => {
        setTitle('');
        setCategory('Düğün');
        setAmount('');
        setSource('Nakit');
        setImage(null);
        setIsInstallment(false);
        setInstallmentCount('1');
        setStatus('purchased');
        setNotes('');
    };

    const handleClose = () => {
        // Animate out first, then call onClose
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: BOTTOM_SHEET_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Call onClose after animation completes
            onClose();
        });
    };

    const handleBackdropPress = () => {
        handleClose();
    };

    const handleSubmit = async () => {
        // Validation
        if (!title.trim()) {
            Alert.alert('Hata', 'Lütfen harcama adı girin');
            return;
        }
        if (status === 'purchased' && (!amount || Number(amount) <= 0)) {
            Alert.alert('Hata', 'Satın alınan ürünler için geçerli bir tutar girin');
            return;
        }

        setIsSubmitting(true);

        try {
            const parsedAmount = amount && amount.trim() !== '' ? parseFloat(amount) : 0;
            const parsedInstallmentCount = isInstallment && installmentCount ? parseInt(installmentCount, 10) : 1;
            const monthlyPayment = isInstallment && parsedInstallmentCount > 0
                ? parseFloat((parsedAmount / parsedInstallmentCount).toFixed(2))
                : parsedAmount;

            const expenseData = {
                username: user?.username || 'dummyy',
                title: title.trim(),
                category,
                price: parsedAmount, // Backend expects 'price' not 'amount'
                vendor: '',
                source,
                date: expense?.date || new Date().toISOString(),
                is_installment: isInstallment,
                installment_count: parsedInstallmentCount,
                status,
                notes: notes.trim(),
                monthly_payment: monthlyPayment
            };

            const url = expense
                ? `https://dugunbutcem.com/api/expenses/${expense.id}`
                : 'https://dugunbutcem.com/api/expenses';

            console.log('🔍 Expense API Request:', {
                method: expense ? 'PUT' : 'POST',
                url,
                data: expenseData
            });

            const response = await fetch(url, {
                method: expense ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(expenseData)
            });

            console.log('📡 Expense API Response:', {
                status: response.status,
                ok: response.ok
            });

            if (response.ok) {
                Alert.alert('Başarılı', expense ? 'Harcama güncellendi' : 'Harcama eklendi');
                resetForm();
                onExpenseAdded?.();
                handleClose();
            } else {
                const errorText = await response.text();
                console.error('❌ API Error:', errorText);
                Alert.alert('Hata', `İşlem başarısız: ${response.status}\n${errorText.substring(0, 100)}`);
            }
        } catch (error) {
            console.error('💥 Exception:', error);
            Alert.alert('Hata', `Sunucuya bağlanılamadı: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const showImageOptions = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['İptal', 'Kamerayı Aç', 'Galeriden Seç'],
                    cancelButtonIndex: 0,
                },
                async (buttonIndex) => {
                    if (buttonIndex === 1) await openCamera();
                    else if (buttonIndex === 2) await pickImage();
                }
            );
        } else {
            Alert.alert('Fotoğraf Ekle', 'Nasıl eklemek istersiniz?', [
                { text: 'İptal', style: 'cancel' },
                { text: 'Kamerayı Aç', onPress: openCamera },
                { text: 'Galeriden Seç', onPress: pickImage },
            ]);
        }
    };

    const openCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Kamera izni vermeniz gerekiyor.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });
        if (!result.canceled) setImage(result.assets[0].uri);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Galeri izni vermeniz gerekiyor.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });
        if (!result.canceled) setImage(result.assets[0].uri);
    };

    if (!visible) return null;

    const categories = ['Düğün', 'Ev', 'Mobilya', 'Elektronik Eşya', 'Diğer'];
    const sources = ['Nakit', 'Kredi Kartı', 'Banka Kartı', 'Hediye'];
    const statuses = [
        { value: 'purchased', label: 'Alındı', icon: 'checkmark-circle' },
        { value: 'planned', label: 'Planlandı', icon: 'time' },
    ];

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={handleBackdropPress}>
                <Animated.View
                    style={[
                        styles.backdrop,
                        { opacity: backdropOpacity }
                    ]}
                />
            </TouchableWithoutFeedback>

            {/* Bottom Sheet */}
            <Animated.View
                style={[
                    styles.bottomSheet,
                    {
                        transform: [{ translateY }]
                    }
                ]}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    {/* Header */}
                    <LinearGradient
                        colors={['#D4AF37', '#C5A028']}
                        style={styles.header}
                    >
                        <Text style={styles.headerTitle}>
                            {expense ? 'Harcamayı Düzenle' : 'Yeni Harcama'}
                        </Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* Content */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                    >
                        {/* Status Tabs */}
                        <View style={styles.statusContainer}>
                            {statuses.map(s => (
                                <TouchableOpacity
                                    key={s.value}
                                    style={[styles.statusButton, status === s.value && styles.statusButtonActive]}
                                    onPress={() => setStatus(s.value)}
                                >
                                    <Ionicons
                                        name={s.icon}
                                        size={20}
                                        color={status === s.value ? '#fff' : '#9ca3af'}
                                    />
                                    <Text style={[styles.statusText, status === s.value && styles.statusTextActive]}>
                                        {s.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Title */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Harcama Adı *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Örn: Düğün Salonu"
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* Category */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Kategori</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.categoryContainer}>
                                    {categories.map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                                            onPress={() => setCategory(cat)}
                                        >
                                            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Amount */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Tutar {status === 'purchased' ? '*' : '(İsteğe Bağlı)'}
                            </Text>
                            <View style={styles.amountInput}>
                                <Text style={styles.currencySymbol}>₺</Text>
                                <TextInput
                                    style={styles.amountField}
                                    placeholder="0"
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="decimal-pad"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                            {status === 'planned' && (
                                <Text style={styles.helperText}>
                                    Fiyat araştırması yapılıyorsa boş bırakabilirsiniz
                                </Text>
                            )}
                        </View>

                        {/* Source */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ödeme Yöntemi</Text>
                            <View style={styles.sourceContainer}>
                                {sources.map(src => (
                                    <TouchableOpacity
                                        key={src}
                                        style={[styles.sourceButton, source === src && styles.sourceButtonActive]}
                                        onPress={() => setSource(src)}
                                    >
                                        <Text style={[styles.sourceText, source === src && styles.sourceTextActive]}>
                                            {src}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Installment */}
                        <View style={styles.inputGroup}>
                            <View style={styles.switchRow}>
                                <Text style={styles.label}>Taksitli mi?</Text>
                                <Switch
                                    value={isInstallment}
                                    onValueChange={setIsInstallment}
                                    trackColor={{ false: '#e5e7eb', true: '#D4AF37' }}
                                    thumbColor={isInstallment ? '#fff' : '#f4f3f4'}
                                />
                            </View>
                            {isInstallment && (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Taksit sayısı"
                                    value={installmentCount}
                                    onChangeText={setInstallmentCount}
                                    keyboardType="number-pad"
                                    placeholderTextColor="#9ca3af"
                                />
                            )}
                        </View>

                        {/* Photo */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Fotoğraf / Fiş (İsteğe Bağlı)</Text>
                            <TouchableOpacity style={styles.imagePicker} onPress={showImageOptions}>
                                {image ? (
                                    <>
                                        <Image source={{ uri: image }} style={styles.previewImage} />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => setImage(null)}
                                        >
                                            <Ionicons name="close-circle" size={24} color="#ef4444" />
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <View style={styles.imagePickerContent}>
                                        <Ionicons name="camera-outline" size={32} color="#9ca3af" />
                                        <Text style={styles.imagePickerText}>Fotoğraf Ekle</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Notes */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Notlar</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Ek bilgiler..."
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <View style={{ height: 20 }} />

                        {/* Footer - Inside ScrollView */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                            >
                                <LinearGradient
                                    colors={['#D4AF37', '#C5A028']}
                                    style={styles.submitGradient}
                                >
                                    <Text style={styles.submitButtonText}>
                                        {isSubmitting ? 'Kaydediliyor...' : (expense ? 'Güncelle' : 'Kaydet')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomSheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 80, // Tab bar height + extra space
        height: BOTTOM_SHEET_HEIGHT,
        backgroundColor: '#FDFBF7',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    statusContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statusButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    statusButtonActive: {
        backgroundColor: '#D4AF37',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    statusTextActive: {
        color: '#fff',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#fff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    categoryContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
    },
    categoryButtonActive: {
        backgroundColor: '#D4AF37',
    },
    categoryText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    categoryTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    amountInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D4AF37',
        marginRight: 8,
    },
    amountField: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    helperText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    sourceContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sourceButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    sourceButtonActive: {
        backgroundColor: '#D4AF37',
    },
    sourceText: {
        fontSize: 14,
        color: '#6b7280',
    },
    sourceTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    imagePicker: {
        height: 120,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    imagePickerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    imagePickerText: {
        fontSize: 14,
        color: '#9ca3af',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    footer: {
        padding: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

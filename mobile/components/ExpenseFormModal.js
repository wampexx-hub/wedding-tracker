import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ExpenseFormModal({ visible, onClose, onExpenseAdded, expense, user }) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Düğün');
    const [amount, setAmount] = useState('');
    const [vendor, setVendor] = useState('');
    const [source, setSource] = useState('Nakit');
    const [isInstallment, setIsInstallment] = useState(false);
    const [installmentCount, setInstallmentCount] = useState('1');
    const [status, setStatus] = useState('purchased');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['Düğün', 'Elektronik Eşya', 'Mobilya', 'Beyaz Eşya', 'Giyim', 'Yiyecek', 'Ulaşım', 'Eğlence', 'Diğer'];
    const sources = ['Nakit', 'Kredi Kartı', 'Banka Kartı', 'Havale'];
    const statuses = [
        { value: 'purchased', label: 'Alındı', icon: 'checkmark-circle' },
        { value: 'planned', label: 'Planlandı', icon: 'time' }
    ];

    useEffect(() => {
        if (expense) {
            // Edit mode - load existing expense
            setTitle(expense.title || '');
            setCategory(expense.category || 'Düğün');
            setAmount(expense.amount?.toString() || '');
            setVendor(expense.vendor || '');
            setSource(expense.source || 'Nakit');
            setIsInstallment(expense.isInstallment || false);
            setInstallmentCount(expense.installmentCount?.toString() || '1');
            setStatus(expense.status || 'purchased');
            setNotes(expense.notes || '');
        } else {
            // Create mode - reset form
            resetForm();
        }
    }, [expense, visible]);

    const resetForm = () => {
        setTitle('');
        setCategory('Düğün');
        setAmount('');
        setVendor('');
        setSource('Nakit');
        setIsInstallment(false);
        setInstallmentCount('1');
        setStatus('purchased');
        setNotes('');
    };

    const handleSubmit = async () => {
        // Validation
        if (!title.trim()) {
            Alert.alert('Hata', 'Lütfen harcama adı girin');
            return;
        }
        if (!amount || Number(amount) <= 0) {
            Alert.alert('Hata', 'Lütfen geçerli bir tutar girin');
            return;
        }

        setIsSubmitting(true);

        try {
            const expenseData = {
                username: user?.username || 'dummyy',
                title: title.trim(),
                category,
                price: Number(amount),
                vendor: vendor.trim() || 'Mağaza',
                source,
                date: new Date().toISOString(),
                is_installment: isInstallment,
                installment_count: isInstallment ? Number(installmentCount) : 1,
                status,
                notes: notes.trim(),
                monthly_payment: isInstallment ? (Number(amount) / Number(installmentCount)).toFixed(2) : amount
            };

            const url = expense
                ? `https://dugunbutcem.com/api/expenses/${expense.id}`
                : 'https://dugunbutcem.com/api/expenses';

            const method = expense ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(expenseData)
            });

            if (!response.ok) {
                throw new Error('Sunucu hatası');
            }

            Alert.alert(
                'Başarılı',
                expense ? 'Harcama güncellendi' : 'Harcama eklendi',
                [
                    {
                        text: 'Tamam',
                        onPress: () => {
                            resetForm();
                            onExpenseAdded();
                            onClose();
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Expense submit error:', error);
            Alert.alert('Hata', 'Harcama kaydedilemedi. Lütfen tekrar deneyin.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Harcamayı Sil',
            'Bu harcamayı silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`https://dugunbutcem.com/api/expenses/${expense.id}`, {
                                method: 'DELETE'
                            });

                            if (!response.ok) {
                                throw new Error('Sunucu hatası');
                            }

                            Alert.alert('Başarılı', 'Harcama silindi', [
                                {
                                    text: 'Tamam',
                                    onPress: () => {
                                        resetForm();
                                        onExpenseAdded();
                                        onClose();
                                    }
                                }
                            ]);
                        } catch (error) {
                            console.error('Expense delete error:', error);
                            Alert.alert('Hata', 'Harcama silinemedi');
                        }
                    }
                }
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalBackdrop}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                            <View style={styles.content}>
                                {/* Header */}
                                <LinearGradient
                                    colors={['#D4AF37', '#C5A028']}
                                    style={styles.header}
                                >
                                    <Text style={styles.headerTitle}>
                                        {expense ? 'Harcamayı Düzenle' : 'Yeni Harcama'}
                                    </Text>
                                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                        <Ionicons name="close" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </LinearGradient>

                                <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                                    {/* Status Selection */}
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
                                                    color={status === s.value ? '#D4AF37' : '#9ca3af'}
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
                                            placeholder="Örn: Gelinlik"
                                            value={title}
                                            onChangeText={setTitle}
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    {/* Category */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Kategori *</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View style={styles.categoryContainer}>
                                                {categories.map(cat => (
                                                    <TouchableOpacity
                                                        key={cat}
                                                        style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
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
                                        <Text style={styles.label}>Tutar *</Text>
                                        <View style={styles.amountInput}>
                                            <Text style={styles.currencySymbol}>₺</Text>
                                            <TextInput
                                                style={styles.amountField}
                                                placeholder="0"
                                                value={amount}
                                                onChangeText={setAmount}
                                                keyboardType="numeric"
                                                placeholderTextColor="#9ca3af"
                                            />
                                        </View>
                                    </View>

                                    {/* Vendor */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Firma</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Firma adı"
                                            value={vendor}
                                            onChangeText={setVendor}
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    {/* Source */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Ödeme Yöntemi</Text>
                                        <View style={styles.sourceContainer}>
                                            {sources.map(s => (
                                                <TouchableOpacity
                                                    key={s}
                                                    style={[styles.sourceButton, source === s && styles.sourceButtonActive]}
                                                    onPress={() => setSource(s)}
                                                >
                                                    <Text style={[styles.sourceText, source === s && styles.sourceTextActive]}>
                                                        {s}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Installment */}
                                    <View style={styles.inputGroup}>
                                        <View style={styles.switchRow}>
                                            <View>
                                                <Text style={styles.label}>Taksitli mi?</Text>
                                                <Text style={styles.helperText}>Aylık ödeme planı</Text>
                                            </View>
                                            <Switch
                                                value={isInstallment}
                                                onValueChange={setIsInstallment}
                                                trackColor={{ false: '#e5e7eb', true: '#fef3c7' }}
                                                thumbColor={isInstallment ? '#D4AF37' : '#f3f4f6'}
                                            />
                                        </View>
                                        {isInstallment && (
                                            <View style={styles.installmentInput}>
                                                <Text style={styles.installmentLabel}>Taksit Sayısı</Text>
                                                <TextInput
                                                    style={styles.installmentField}
                                                    placeholder="12"
                                                    value={installmentCount}
                                                    onChangeText={setInstallmentCount}
                                                    keyboardType="numeric"
                                                    placeholderTextColor="#9ca3af"
                                                />
                                                <Text style={styles.installmentInfo}>ay</Text>
                                            </View>
                                        )}
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

                                    <View style={{ height: 100 }} />
                                </ScrollView>

                                {/* Footer */}
                                <View style={styles.footer}>
                                    {expense && (
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={handleDelete}
                                            disabled={isSubmitting}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#dc2626" />
                                            <Text style={styles.deleteButtonText}>Sil</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                                        onPress={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        <LinearGradient
                                            colors={isSubmitting ? ['#9ca3af', '#6b7280'] : ['#D4AF37', '#C5A028']}
                                            style={styles.submitGradient}
                                        >
                                            <Text style={styles.submitButtonText}>
                                                {isSubmitting ? 'Kaydediliyor...' : (expense ? 'Güncelle' : 'Kaydet')}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        paddingTop: 40,
    },
    modalContainer: {
        flex: 1,
        maxHeight: '85%', // Leave space for tab bar
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#FDFBF7',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden',
    },
    container: {
        flex: 1,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FDFBF7',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
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
    form: {
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
        backgroundColor: '#f9fafb',
    },
    statusButtonActive: {
        backgroundColor: '#fef3c7',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    statusTextActive: {
        color: '#D4AF37',
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111827',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    categoryContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    categoryChipActive: {
        backgroundColor: '#fef3c7',
        borderColor: '#D4AF37',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280',
    },
    categoryTextActive: {
        color: '#D4AF37',
        fontWeight: '600',
    },
    amountInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
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
    sourceContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sourceButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    sourceButtonActive: {
        backgroundColor: '#fef3c7',
        borderColor: '#D4AF37',
    },
    sourceText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280',
    },
    sourceTextActive: {
        color: '#D4AF37',
        fontWeight: '600',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    helperText: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    installmentInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    installmentLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    installmentField: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        paddingVertical: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
    },
    installmentInfo: {
        fontSize: 14,
        color: '#9ca3af',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#fee2e2',
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#dc2626',
    },
    submitButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});

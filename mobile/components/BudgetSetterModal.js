import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function BudgetSetterModal({ visible, onClose, onBudgetSet, currentBudget, user }) {
    const [budgetAmount, setBudgetAmount] = useState(currentBudget?.toString() || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        const amount = Number(budgetAmount);

        if (!amount || amount <= 0) {
            Alert.alert('Hata', 'Lütfen geçerli bir bütçe girin');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('https://dugunbutcem.com/api/budget', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: user?.username || 'dummyy',
                    budget: amount
                })
            });

            if (!response.ok) {
                throw new Error('Sunucu hatası');
            }

            Alert.alert('Başarılı', 'Bütçe güncellendi', [
                {
                    text: 'Tamam',
                    onPress: () => {
                        onBudgetSet(amount);
                        onClose();
                    }
                }
            ]);
        } catch (error) {
            console.error('Budget set error:', error);
            Alert.alert('Hata', 'Bütçe güncellenemedi. Lütfen tekrar deneyin.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.backdrop}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <LinearGradient
                            colors={['#D4AF37', '#C5A028']}
                            style={styles.header}
                        >
                            <Text style={styles.headerTitle}>Bütçe Belirle</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <View style={styles.content}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="wallet" size={64} color="#D4AF37" />
                            </View>

                            <Text style={styles.description}>
                                Düğün için ayırdığınız toplam bütçeyi belirleyin.
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Toplam Bütçe</Text>
                                <View style={styles.amountInput}>
                                    <Text style={styles.currencySymbol}>₺</Text>
                                    <TextInput
                                        style={styles.amountField}
                                        placeholder="0"
                                        value={budgetAmount}
                                        onChangeText={setBudgetAmount}
                                        keyboardType="numeric"
                                        placeholderTextColor="#9ca3af"
                                        autoFocus
                                    />
                                </View>
                            </View>

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
                                        {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FDFBF7',
        borderRadius: 24,
        width: '90%',
        maxWidth: 400,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 24,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    description: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    amountInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#D4AF37',
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D4AF37',
        marginRight: 8,
    },
    amountField: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});

import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';

const ASSET_TYPES = [
    { value: 'TRY_CASH', label: 'Türk Lirası (Nakit)', unit: 'TL' },
    { value: 'USD', label: 'Amerikan Doları', unit: 'USD' },
    { value: 'EUR', label: 'Euro', unit: 'EUR' },
    { value: 'GBP', label: 'İngiliz Sterlini', unit: 'GBP' },
    { value: 'GRAM', label: 'Altın (Gram)', unit: 'Gram' },
    { value: 'CEYREK', label: 'Çeyrek Altın', unit: 'Adet' },
    { value: 'YARIM', label: 'Yarım Altın', unit: 'Adet' },
    { value: 'TAM', label: 'Tam Altın', unit: 'Adet' },
];

export default function AssetFormModal({ visible, onClose, initialData, user }) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: initialData?.type || 'TRY_CASH',
        amount: initialData?.amount?.toString() || '',
    });

    const handleSubmit = async () => {
        if (!formData.amount) {
            Alert.alert('Hata', 'Lütfen miktar girin');
            return;
        }

        setIsLoading(true);

        try {
            const asset = {
                type: formData.type,
                amount: Number(formData.amount),
            };

            const url = initialData
                ? `https://dugunbutcem.com/api/assets/${initialData.id}?user=${user.username}`
                : `https://dugunbutcem.com/api/assets?user=${user.username}`;

            const response = await fetch(url, {
                method: initialData ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(asset),
            });

            if (response.ok) {
                Alert.alert('Başarılı', initialData ? 'Varlık güncellendi' : 'Varlık eklendi');
                onClose(true);
            } else {
                Alert.alert('Hata', 'İşlem başarısız');
            }
        } catch (error) {
            Alert.alert('Hata', 'Sunucuya bağlanılamadı: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedType = ASSET_TYPES.find(t => t.value === formData.type);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={() => onClose(false)}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => onClose(false)} style={styles.closeButton}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {initialData ? 'Varlığı Düzenle' : 'Yeni Varlık'}
                    </Text>
                    <View style={styles.closeButton} />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Varlık Tipi</Text>
                        <View style={styles.typeGrid}>
                            {ASSET_TYPES.map(type => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.typeButton,
                                        formData.type === type.value && styles.typeButtonActive,
                                    ]}
                                    onPress={() => setFormData({ ...formData, type: type.value })}
                                >
                                    <Text
                                        style={[
                                            styles.typeText,
                                            formData.type === type.value && styles.typeTextActive,
                                        ]}
                                    >
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Miktar ({selectedType?.unit})</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={formData.amount}
                            onChangeText={text => setFormData({ ...formData, amount: text })}
                            placeholder="0"
                            placeholderTextColor="#d1d5db"
                            keyboardType="decimal-pad"
                        />
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>
                                {initialData ? 'Kaydet' : 'Varlığı Ekle'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFBF7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        fontSize: 24,
        color: '#6b7280',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 12,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    typeButtonActive: {
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
    },
    typeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    typeTextActive: {
        color: '#D4AF37',
        fontWeight: '600',
    },
    amountInput: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        backgroundColor: '#fff',
    },
    submitButton: {
        backgroundColor: '#FBBF24',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

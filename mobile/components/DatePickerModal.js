import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export default function DatePickerModal({ visible, onClose, onDateSelect, initialDate }) {
    const [date, setDate] = useState(initialDate ? new Date(initialDate) : new Date());
    const [showPicker, setShowPicker] = useState(Platform.OS === 'ios'); // iOS shows embedded, Android shows dialog on open

    const handleChange = (event, selectedDate) => {
        if (event.type === 'dismissed') {
            onClose();
            return;
        }
        const currentDate = selectedDate || date;
        setDate(currentDate);
        if (Platform.OS === 'android') {
            onDateSelect(currentDate);
        }
    };

    const handleConfirm = () => {
        onDateSelect(date);
    };

    if (Platform.OS === 'android' && !visible) return null;

    if (Platform.OS === 'android' && visible) {
        return (
            <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={handleChange}
            />
        );
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.cancelText}>İptal</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Tarih Seçin</Text>
                        <TouchableOpacity onPress={handleConfirm}>
                            <Text style={styles.confirmText}>Tamam</Text>
                        </TouchableOpacity>
                    </View>
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode="date"
                        is24Hour={true}
                        display="spinner"
                        onChange={handleChange}
                        textColor="#000"
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    cancelText: {
        color: '#666',
        fontSize: 16,
    },
    confirmText: {
        color: '#D4AF37',
        fontSize: 16,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
});

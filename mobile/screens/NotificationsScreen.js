import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bildirimler</Text>
                <View style={styles.backButton} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Ionicons name="notifications-outline" size={64} color="#D4AF37" />
                <Text style={styles.title}>Bildirimler</Text>
                <Text style={styles.subtitle}>Yapım Aşamasında</Text>
                <Text style={styles.description}>
                    Yakında düğün hatırlatmaları, ödeme bildirimleri ve daha fazlası burada olacak!
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFBF7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 10,
        backgroundColor: '#FDFBF7',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 8,
    },
    description: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 20,
    },
});

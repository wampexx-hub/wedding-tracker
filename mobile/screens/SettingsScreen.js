import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ayarlar</Text>
                <View style={styles.backButton} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Ionicons name="settings-outline" size={64} color="#D4AF37" />
                <Text style={styles.title}>Ayarlar</Text>
                <Text style={styles.subtitle}>Yapım Aşamasında</Text>
                <Text style={styles.description}>
                    Yakında profil ayarları, bildirim tercihleri ve daha fazlası burada olacak!
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 100, // Space for tab bar
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

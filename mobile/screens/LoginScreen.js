import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ImageBackground,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
    <View style={styles.googleIconBg}>
        <Text style={styles.googleIconText}>G</Text>
    </View>
);

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const authContext = useAuth();
    const login = authContext?.login;

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        try {
            await login(email, password);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Background Image with Overlay */}
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop' }}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                    style={styles.overlay}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.contentContainer}
                    >
                        {/* Logo & Text */}
                        <View style={styles.headerContainer}>
                            <View style={styles.logoContainer}>
                                <Text style={styles.logoIcon}>❤️</Text>
                            </View>
                            <Text style={styles.welcomeText}>Hoş Geldiniz</Text>
                            <Text style={styles.subText}>Düğün planlamanızı kolaylaştırın</Text>
                        </View>

                        {/* Form Container */}
                        <View style={styles.formCard}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>E-posta</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="ornek@email.com"
                                    placeholderTextColor="#9ca3af"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Şifre</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9ca3af"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#D4AF37', '#C5A028']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Text style={styles.loginButtonText}>
                                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>veya</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity style={styles.googleButton}>
                                <GoogleIcon />
                                <Text style={styles.googleButtonText}>Google ile Devam Et</Text>
                            </TouchableOpacity>

                            <View style={styles.registerContainer}>
                                <Text style={styles.registerText}>Hesabınız yok mu? </Text>
                                <TouchableOpacity>
                                    <Text style={styles.registerLink}>Kayıt Olun</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 64,
        height: 64,
        backgroundColor: '#D4AF37',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    logoIcon: {
        fontSize: 32,
    },
    welcomeText: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 32,
        color: '#fff',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subText: {
        fontFamily: 'Lato-Regular',
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
    },
    formCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 15,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontFamily: 'Lato-Bold',
        fontSize: 12,
        color: '#4b5563',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'Lato-Regular',
        color: '#1f2937',
    },
    loginButton: {
        marginTop: 8,
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    gradientButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontFamily: 'Lato-Bold',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        marginHorizontal: 12,
        color: '#9ca3af',
        fontSize: 14,
        fontFamily: 'Lato-Regular',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingVertical: 12,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    googleIconBg: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleIconText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4285F4', // Google Blue
    },
    googleButtonText: {
        fontSize: 14,
        fontFamily: 'Lato-Bold',
        color: '#374151',
        fontWeight: '600',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    registerText: {
        color: '#6b7280',
        fontFamily: 'Lato-Regular',
    },
    registerLink: {
        color: '#D4AF37',
        fontFamily: 'Lato-Bold',
        fontWeight: 'bold',
    },
});

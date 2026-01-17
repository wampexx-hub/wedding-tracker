import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';

import DashboardScreen from './screens/DashboardScreen';
import ExpensesScreen from './screens/ExpensesScreen';
import VendorsScreen from './screens/VendorsScreen';
import AssetsScreen from './screens/AssetsScreen';
import LoginScreen from './screens/LoginScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ExpenseFormBottomSheet from './components/ExpenseFormBottomSheet';

import {
  useFonts,
  PlayfairDisplay_700Bold as PlayfairDisplayBold,
  PlayfairDisplay_600SemiBold as PlayfairDisplaySemiBold,
} from '@expo-google-fonts/playfair-display';
import {
  Lato_400Regular,
  Lato_700Bold,
} from '@expo-google-fonts/lato';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Custom Tab Bar Button for FAB effect with cut-out
const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={{
      top: -30,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    }}
    onPress={onPress}
  >
    <View
      style={{
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FDFBF7',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#D4AF37',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: "rgba(255, 193, 7, 1)",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {children}
      </View>
    </View>
  </TouchableOpacity>
);

function MainTabs() {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get auth context - with safety check
  const authContext = useAuth();

  if (!authContext) {
    console.warn('MainTabs: authContext is undefined');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={{ marginTop: 16, color: '#6b7280' }}>Context loading...</Text>
      </View>
    );
  }

  const { user, logout } = authContext;

  const handleExpenseAdded = () => {
    setIsModalVisible(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FDFBF7',
            borderTopColor: '#f3f4f6',
            height: 70 + insets.bottom,
            paddingBottom: insets.bottom + 8,
            paddingTop: 8,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 10,
            position: 'absolute',
            zIndex: 1000, // Always keep tab bar on top
          },
          tabBarActiveTintColor: '#D4AF37',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarLabelStyle: {
            fontFamily: 'Lato-Regular',
            fontSize: 10,
            marginTop: 4,
          }
        }}
      >
        <Tab.Screen
          name="Dashboard"
          children={(props) => <DashboardScreen {...props} user={user} onLogout={logout} refreshTrigger={refreshTrigger} />}
          options={{
            tabBarLabel: 'Genel Bakış',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
            )
          }}
          listeners={{
            tabPress: () => {
              if (isModalVisible) setIsModalVisible(false);
            }
          }}
        />
        <Tab.Screen
          name="Expenses"
          children={(props) => <ExpensesScreen {...props} user={user} refreshTrigger={refreshTrigger} />}
          options={{
            tabBarLabel: 'Harcamalar',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "receipt" : "receipt-outline"} size={22} color={color} />
            )
          }}
          listeners={{
            tabPress: () => {
              if (isModalVisible) setIsModalVisible(false);
            }
          }}
        />
        <Tab.Screen
          name="Add"
          component={View}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add" size={32} color="#fff" />
              </View>
            ),
            tabBarButton: (props) => (
              <CustomTabBarButton {...props} onPress={() => {
                if (isModalVisible) {
                  setIsModalVisible(false);
                } else {
                  setIsModalVisible(true);
                }
              }} />
            ),
            tabBarLabel: '',
          }}
        />
        <Tab.Screen
          name="Vendors"
          children={(props) => <VendorsScreen {...props} user={user} />}
          options={{
            tabBarLabel: 'Satıcılar',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "people" : "people-outline"} size={22} color={color} />
            )
          }}
          listeners={{
            tabPress: () => {
              if (isModalVisible) setIsModalVisible(false);
            }
          }}
        />
        <Tab.Screen
          name="Assets"
          children={(props) => <AssetsScreen {...props} user={user} />}
          options={{
            tabBarLabel: 'Birikimler',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "wallet" : "wallet-outline"} size={22} color={color} />
            )
          }}
          listeners={{
            tabPress: () => {
              if (isModalVisible) setIsModalVisible(false);
            }
          }}
        />
      </Tab.Navigator>

      {/* Bottom Sheet Overlay - Always on top of tabs */}
      <ExpenseFormBottomSheet
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onExpenseAdded={handleExpenseAdded}
        user={user}
      />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-SemiBold': PlayfairDisplaySemiBold,
    'PlayfairDisplay-Bold': PlayfairDisplayBold,
    'Lato-Regular': Lato_400Regular,
    'Lato-Bold': Lato_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FDFBF7', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ExpenseProvider>
          <NavigationContainer>
            <AuthNavigator />
          </NavigationContainer>
        </ExpenseProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          presentation: 'card', // Changed from modal to card
          headerShown: false,   // Hide header to show tab bar
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: 'card', // Changed from modal to card
          headerShown: false,   // Hide header to show tab bar
        }}
      />
    </Stack.Navigator>
  );
}

function AuthNavigator() {
  const authContext = useAuth();

  // Safety check
  if (!authContext) {
    console.warn('AuthNavigator: authContext is undefined');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={{ marginTop: 16, fontSize: 14, color: '#9ca3af' }}>Yükleniyor...</Text>
      </View>
    );
  }

  const { user, isLoading } = authContext;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={{ marginTop: 16, fontSize: 14, color: '#9ca3af' }}>Yükleniyor...</Text>
      </View>
    );
  }

  return user ? <MainNavigator /> : <LoginScreen />;
}

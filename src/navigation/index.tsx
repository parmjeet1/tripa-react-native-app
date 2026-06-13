import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { MapPin, PlusCircle, ClipboardList } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, View, Image, StyleSheet } from 'react-native';

import { FindRideScreen } from '../screens/FindRideScreen';
import { PublishRideScreen } from '../screens/PublishRideScreen';
import { MyRidesScreen } from '../screens/MyRidesScreen';
import { COLORS, FONT_SIZE } from '../constants/theme';
import { useAuth } from '../services/auth';

const Tab = createBottomTabNavigator();

export const Navigation = () => {
  const { user, isLoading } = useAuth();
  const isDriver = user?.role === 'driver';
  const insets = useSafeAreaInsets();

  // Ensure at least 8px padding, but respect the device safe area
  const bottomPadding = Math.max(insets.bottom, 8);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require('../../assets/tripa_logo.png')}
          style={styles.loadingLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: COLORS.borderLight,
            elevation: 0,
            shadowOpacity: 0,
            backgroundColor: COLORS.white,
            height: 56 + bottomPadding,
            paddingBottom: bottomPadding,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="FindRide"
          component={FindRideScreen}
          options={{
            title: 'Find Ride',
            tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="PublishRide"
          component={PublishRideScreen}
          options={{
            title: 'Publish',
            tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
          }}
        />
        {/* My Rides tab — only visible for drivers */}
        {isDriver && (
          <Tab.Screen
            name="MyRides"
            component={MyRidesScreen}
            options={{
              title: 'My Rides',
              tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
            }}
          />
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 200,
    height: 70,
  },
});

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PublishRideScreen } from '../screens/PublishRideScreen';
import { FindRideScreen } from '../screens/FindRideScreen';
import { RootTabParamList } from '../types';
import { PlusCircle, Search } from 'lucide-react-native';
import { Platform } from 'react-native';

const Tab = createBottomTabNavigator<RootTabParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D97706', // amber-600
        tabBarInactiveTintColor: '#64748B', // slate-500
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
          marginBottom: Platform.OS === 'ios' ? 0 : 6,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tab.Screen
        name="FindRide"
        component={FindRideScreen}
        options={{
          tabBarLabel: 'Find Ride',
          tabBarIcon: ({ color, size }) => (
            <Search size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PublishRide"
        component={PublishRideScreen}
        options={{
          tabBarLabel: 'Publish Ride',
          tabBarIcon: ({ color, size }) => (
            <PlusCircle size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

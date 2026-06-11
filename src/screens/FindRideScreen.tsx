import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Modal,
  Linking,
  SafeAreaView,
  Pressable,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useIsFocused } from '@react-navigation/native';
import { dbService } from '../services/db';
import { travelerService } from '../services/traveler';
import { Ride } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { Phone, Copy, Car, Calendar, User, X, Briefcase } from 'lucide-react-native';

const TRAVELER_LOCATION_KEY = '@traveler_current_location';

const formatTravelDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const FindRideScreen: React.FC = () => {
  const isFocused = useIsFocused();

  // Search Inputs
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');

  // Results & Feeds State
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [uniqueLocations, setUniqueLocations] = useState<string[]>(['All']);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Traveler Profile State
  const [travelerPhone, setTravelerPhone] = useState('');
  const [tempTravelerPhone, setTempTravelerPhone] = useState('');
  const [tempTravelerName, setTempTravelerName] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [activeDriverPhone, setActiveDriverPhone] = useState('');

  // UI Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Load traveler phone and active rides when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      loadAllRides();
    }
  }, [isFocused]);

  const loadAllRides = async () => {
    setLoading(true);
    try {
      // 1. Fetch rides (will seed mock rides automatically if storage is empty)
      const data = await dbService.getRides();
      setAllRides(data);

      // 2. Extract unique start locations (case-insensitive deduplication, but preserve casing)
      const startLocMap = new Map<string, string>();
      data.forEach((r) => {
        const trimmed = r.fromLocation.trim();
        if (trimmed) {
          const lower = trimmed.toLowerCase();
          if (!startLocMap.has(lower)) {
            startLocMap.set(lower, trimmed);
          }
        }
      });
      const extractedLocs = ['All', ...Array.from(startLocMap.values())];
      setUniqueLocations(extractedLocs);

      // 3. Load saved location preference
      const savedLocation = await AsyncStorage.getItem(TRAVELER_LOCATION_KEY);
      if (savedLocation && extractedLocs.includes(savedLocation)) {
        setSelectedLocation(savedLocation);
      } else {
        setSelectedLocation('All');
      }

      // 4. Load saved phone from traveler profile JSON
      const profile = await travelerService.getProfile();
      if (profile && profile.phoneNumber) {
        setTravelerPhone(profile.phoneNumber);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
      setToastType('error');
      setToastMessage('Failed to fetch active rides.');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      const results = await dbService.findRides(fromLocation, toLocation);
      setRides(results);
      setHasSearched(true);
    } catch (error) {
      console.error(error);
      setToastType('error');
      setToastMessage('Failed to find rides. Please try again.');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = async (location: string) => {
    setSelectedLocation(location);
    setHasSearched(false);
    try {
      await AsyncStorage.setItem(TRAVELER_LOCATION_KEY, location);
    } catch (error) {
      console.error('Error saving traveler location:', error);
    }
  };

  const handleClearSearch = () => {
    setFromLocation('');
    setToLocation('');
    setHasSearched(false);
  };

  const displayedRides = hasSearched
    ? rides
    : selectedLocation === 'All'
    ? allRides
    : allRides.filter(
        (r) => r.fromLocation.trim().toLowerCase() === selectedLocation.trim().toLowerCase()
      );

  const handleCopyNumber = async (num: string) => {
    await Clipboard.setStringAsync(num);
    setToastType('success');
    setToastMessage(`Copied: ${num}`);
    setToastVisible(true);
  };

  const handleCallPress = async (driverPhone: string) => {
    setActiveDriverPhone(driverPhone);
    setIsNewCustomer(false);
    setTempTravelerName('');
    try {
      // First, directly check the JSON database storage
      const profile = await travelerService.getProfile();
      if (profile && profile.phoneNumber) {
        setTravelerPhone(profile.phoneNumber);
        makeCall(driverPhone);
      } else {
        setTempTravelerPhone('');
        setPhoneModalVisible(true);
      }
    } catch (error) {
      console.error('Error checking traveler profile on call:', error);
      setTempTravelerPhone('');
      setPhoneModalVisible(true);
    }
  };

  const makeCall = (driverPhone: string) => {
    const cleanPhone = driverPhone.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      setToastType('error');
      setToastMessage('Could not launch dialer. Please try copying the number.');
      setToastVisible(true);
    });
  };

  const handleSaveTravelerPhone = async () => {
    const cleanedPhone = tempTravelerPhone.trim();
    if (!cleanedPhone || cleanedPhone.length < 8) {
      alert('Please enter a valid phone number (minimum 8 digits).');
      return;
    }

    if (!isNewCustomer) {
      // 1. Check if customer is registered in our JSON database registry (await async check)
      const isRegistered = await travelerService.isRegistered(cleanedPhone);
      if (isRegistered) {
        try {
          await travelerService.saveProfile(cleanedPhone);
          setTravelerPhone(cleanedPhone);
          setPhoneModalVisible(false);
          makeCall(activeDriverPhone);
        } catch (error) {
          console.error('Error saving traveler phone:', error);
          alert('Something went wrong. Please try again.');
        }
      } else {
        // Not registered - transition modal to show registration form (Name Input)
        setIsNewCustomer(true);
      }
    } else {
      // 2. Register the new customer dynamically
      const cleanedName = tempTravelerName.trim();
      if (!cleanedName) {
        alert('Please enter your name to register.');
        return;
      }

      try {
        // Save to local registered customers directory
        await travelerService.registerCustomer(cleanedPhone, cleanedName);
        // Save active traveler session profile
        await travelerService.saveProfile(cleanedPhone);
        setTravelerPhone(cleanedPhone);
        setPhoneModalVisible(false);
        makeCall(activeDriverPhone);
      } catch (error) {
        console.error('Error registering new customer:', error);
        alert('Failed to register customer. Please try again.');
      }
    }
  };

  // Convert Frequency value to badge text and colors
  const getFrequencyDetails = (frequency: string) => {
    switch (frequency) {
      case 'every_day':
        return { label: 'Every Day', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' };
      case 'specific_date':
        return { label: 'Specific Date', bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700' };
      default:
        return { label: 'Today Only', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700' };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, overflow: 'hidden' }} className="flex-1 bg-white">
      <FlatList
        style={{ flex: 1 }}
        data={displayedRides}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 80,
        }}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View className="mb-6 mt-2">
              <Text className="text-3xl font-bold text-slate-900 tracking-tight">
                Find a Ride
              </Text>
              <Text className="text-slate-500 mt-1.5 text-base">
                Connect with active taxi drivers listed by route.
              </Text>
            </View>

            {/* Search Card Container */}
            <View className="bg-slate-50 border border-slate-200 rounded-3xl p-5 mb-5 shadow-sm" style={{ zIndex: 20 }}>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <LocationAutocomplete
                    label="From Location"
                    placeholder="e.g. Airport T3"
                    value={fromLocation}
                    onChangeText={setFromLocation}
                  />
                </View>
                <View className="flex-1">
                  <LocationAutocomplete
                    label="To Location"
                    placeholder="e.g. Connaught Place"
                    value={toLocation}
                    onChangeText={setToLocation}
                  />
                </View>
              </View>
              <Button
                title="Search Rides"
                onPress={handleSearch}
                loading={loading}
                className="mt-2"
              />
            </View>

            {/* Location Hub Selector Pills */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                📍 Current Location Hub ({uniqueLocations.length - 1} nearby)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
                className="flex-row py-1"
                keyboardShouldPersistTaps="handled"
              >
                {uniqueLocations.map((loc) => {
                  const isSelected = selectedLocation === loc;
                  return (
                    <Pressable
                      key={loc}
                      onPress={() => handleSelectLocation(loc)}
                      className={`mr-2.5 px-4.5 py-2.5 rounded-full border ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 shadow-sm'
                          : 'bg-slate-50 border-slate-200 active:bg-slate-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-slate-900 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {loc === 'All' ? '🌐 All Locations' : loc}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* List Header & Action Row */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-slate-800">
                {hasSearched ? 'Search Results' : `Active Rides (${displayedRides.length})`}
              </Text>
              {hasSearched && (
                <Pressable
                  onPress={handleClearSearch}
                  className="flex-row items-center bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full active:bg-slate-200"
                >
                  <X size={14} color="#475569" className="mr-1" />
                  <Text className="text-xs font-bold text-slate-600">
                    Clear Search
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="flex-grow justify-center items-center py-10 px-4">
            <View className="bg-slate-50 p-6 rounded-full mb-4">
              <Car size={32} color="#94A3B8" />
            </View>
            <Text className="text-slate-700 font-semibold text-lg text-center">
              No Active Rides Found
            </Text>
            <Text className="text-slate-400 text-sm text-center mt-1 max-w-[260px]">
              {hasSearched
                ? 'No drivers match your search criteria. Try a different route.'
                : `No drivers are currently active starting from "${selectedLocation}".`}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const freq = getFrequencyDetails(item.bookingNeed);
          return (
            <View className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-4">
              {/* Driver & Price Row */}
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="bg-slate-100 p-2.5 rounded-full mr-3">
                    <User size={20} color="#475569" />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-slate-900" numberOfLines={1}>
                      {item.driverName}
                    </Text>
                    <View className={`border rounded-full px-2.5 py-0.5 mt-1 self-start ${freq.bg}`}>
                      <Text className={`text-xs font-semibold ${freq.text}`}>
                        {freq.label}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="items-end">
                  {item.price ? (
                    <View className="bg-amber-50 px-3.5 py-2 rounded-2xl flex-row items-center border border-amber-100">
                      <Text className="text-amber-700 font-bold text-base">
                        ₹{item.price}
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100">
                      <Text className="text-slate-500 font-bold text-xs">
                        Price N/A
                      </Text>
                    </View>
                  )}
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                    {item.priceType === 'negotiable' ? 'Negotiable' : 'Fixed Price'}
                  </Text>
                </View>
              </View>

              {/* Route Details */}
              <View className="border-t border-b border-slate-100 py-3 mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-slate-500 text-xs uppercase font-semibold w-12">From</Text>
                    <Text className="text-slate-800 font-semibold text-sm flex-1" numberOfLines={1}>
                      {item.fromLocation}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-slate-500 text-xs uppercase font-semibold w-12">To</Text>
                    <Text className="text-slate-800 font-semibold text-sm flex-1" numberOfLines={1}>
                      {item.toLocation}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Travel Date & Vehicle */}
              <View className="flex-row justify-between items-center mb-5 gap-2">
                <View className="flex-row items-center flex-1">
                  <Calendar size={15} color="#94A3B8" className="mr-1.5" />
                  <Text className="text-slate-500 text-xs" numberOfLines={1}>
                    {formatTravelDate(item.travelDate)}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Car size={15} color="#94A3B8" className="mr-1.5" />
                  <Text className="text-slate-700 text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                    {item.vehicleNumber}
                  </Text>
                </View>
              </View>

              {/* Max Luggage (instead of notes) */}
              <View className="bg-slate-50 px-4 py-3.5 rounded-2xl mb-4 flex-row items-center border border-slate-100">
                <Briefcase size={16} color="#F59E0B" className="mr-3" />
                <Text className="text-slate-600 text-sm font-semibold">
                  Max Luggage Allowed: <Text className="text-slate-800 font-bold">{item.maxLuggage} kg</Text>
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="mt-2">
                <Pressable
                  onPress={() => handleCallPress(item.phoneNumber)}
                  className="w-full bg-amber-500 py-3.5 rounded-2xl flex-row justify-center items-center active:bg-amber-600"
                >
                  <Phone size={16} color="#0F172A" className="mr-2" />
                  <Text className="text-slate-900 font-bold text-sm">
                    Call Driver
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <Modal
        visible={phoneModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            onPress={() => setPhoneModalVisible(false)} 
          />
          <View className="bg-white rounded-t-[32px] p-6 pb-10">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mb-6" />
            
            <Text className="text-2xl font-bold text-slate-900 mb-2">
              {isNewCustomer ? 'Register Customer' : 'Verification Required'}
            </Text>
            <Text className="text-slate-500 mb-6 text-sm">
              {isNewCustomer 
                ? 'Please enter your name to register as a new traveler on Tripa.' 
                : 'Please provide your contact number. This connects you with the taxi driver.'}
            </Text>

            <Input
              label="Your Mobile Number"
              placeholder="e.g. +91 9999988888"
              value={tempTravelerPhone}
              onChangeText={setTempTravelerPhone}
              keyboardType="phone-pad"
              editable={!isNewCustomer}
              selectTextOnFocus={!isNewCustomer}
            />

            {isNewCustomer && (
              <Input
                label="Your Name"
                placeholder="e.g. Aarav Mehta"
                value={tempTravelerName}
                onChangeText={setTempTravelerName}
                autoFocus
              />
            )}

            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => setPhoneModalVisible(false)}
                className="flex-1 bg-slate-100 py-4 rounded-2xl justify-center items-center"
              >
                <Text className="text-slate-700 font-semibold text-base">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveTravelerPhone}
                className="flex-1 bg-amber-500 py-4 rounded-2xl justify-center items-center"
              >
                <Text className="text-slate-900 font-bold text-base">
                  {isNewCustomer ? 'Register & Call' : 'Submit'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
};

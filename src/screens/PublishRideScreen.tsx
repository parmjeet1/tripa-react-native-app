import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { dbService } from '../services/db';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Toast } from '../components/Toast';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { DateTimePickerWrapper } from '../components/DateTimePickerWrapper';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react-native';

type Step = 1 | 2 | 3;

export const PublishRideScreen: React.FC = () => {
  // Wizard State
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Form State
  const [driverName, setDriverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<'fixed' | 'negotiable'>('fixed');
  const [maxLuggage, setMaxLuggage] = useState<number>(0);
  const [bookingNeed, setBookingNeed] = useState<'every_day' | 'today_only' | 'specific_date'>('today_only');

  // Allowed database locations (for validation)
  const [allowedLocations, setAllowedLocations] = useState<string[]>([]);

  // UI State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const bookingOptions = [
    { label: 'Today Only', value: 'today_only' },
    { label: 'Every Day', value: 'every_day' },
    { label: 'Specific Date', value: 'specific_date' },
  ];

  // Fetch allowed locations on mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locs = await dbService.getLocations();
        setAllowedLocations(locs);
      } catch (err) {
        console.error('Failed to load locations for validation:', err);
      }
    };
    loadLocations();
  }, []);

  // Step validation
  const validateStep = (step: Step): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!driverName.trim()) newErrors.driverName = 'Driver Name is required';
      if (!phoneNumber.trim()) {
        newErrors.phoneNumber = 'Phone Number is required';
      } else if (phoneNumber.trim().replace(/\D/g, '').length < 8) {
        newErrors.phoneNumber = 'Enter a valid phone number (min 8 digits)';
      }
      if (!vehicleNumber.trim()) newErrors.vehicleNumber = 'Vehicle Number is required';
    } else if (step === 2) {
      if (!fromLocation.trim()) {
        newErrors.fromLocation = 'From Location is required';
      } else {
        const isValid = allowedLocations.some(
          (loc) => loc.toLowerCase() === fromLocation.trim().toLowerCase()
        );
        if (!isValid) {
          newErrors.fromLocation = 'Please select a location from the suggestions list';
        }
      }

      if (!toLocation.trim()) {
        newErrors.toLocation = 'To Location is required';
      } else {
        const isValid = allowedLocations.some(
          (loc) => loc.toLowerCase() === toLocation.trim().toLowerCase()
        );
        if (!isValid) {
          newErrors.toLocation = 'Please select a location from the suggestions list';
        }
      }
    } else if (step === 3) {
      if (!travelDate.trim()) newErrors.travelDate = 'Travel Date & Time is required';
      if (maxLuggage <= 0) {
        newErrors.maxLuggage = 'Please specify luggage capacity (minimum 1 kg)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => (prev + 1) as Step);
      setErrors({});
    } else {
      setToastType('error');
      setToastMessage('Please complete all required fields.');
      setToastVisible(true);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev - 1) as Step);
    setErrors({});
  };

  const handlePublish = async () => {
    if (!validateStep(3)) {
      setToastType('error');
      setToastMessage('Please complete all schedule requirements.');
      setToastVisible(true);
      return;
    }

    setLoading(true);
    try {
      await dbService.publishRide({
        driverName: driverName.trim(),
        phoneNumber: phoneNumber.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        fromLocation: fromLocation.trim(),
        toLocation: toLocation.trim(),
        travelDate: travelDate,
        bookingNeed,
        price: price.trim() || undefined,
        priceType,
        maxLuggage,
      });

      // Show Success Toast
      setToastType('success');
      setToastMessage('Ride published successfully');
      setToastVisible(true);

      // Reset Wizard & Form
      setCurrentStep(1);
      setDriverName('');
      setPhoneNumber('');
      setVehicleNumber('');
      setFromLocation('');
      setToLocation('');
      setTravelDate('');
      setPrice('');
      setPriceType('fixed');
      setMaxLuggage(0);
      setBookingNeed('today_only');
      setErrors({});
    } catch (error) {
      console.error(error);
      setToastType('error');
      setToastMessage('Failed to publish ride. Please try again.');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, overflow: 'hidden' }} className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        className="flex-1"
      >
        <View style={{ flex: 1 }} className="flex-1">
          {/* Scrollable Form Content */}
          <ScrollView
            style={{ flex: 1 }}
            className="flex-1 px-6 pt-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View className="mb-6 mt-2">
              <Text className="text-3xl font-bold text-slate-900 tracking-tight">
                Publish a Ride
              </Text>
              <Text className="text-slate-500 mt-1.5 text-base">
                Connect with travelers in just 3 simple steps.
              </Text>
            </View>

            {/* Progress Tracker UI */}
            <View className="flex-row items-center justify-between mb-8 px-2">
              {/* Step 1 Node */}
              <View className="items-center flex-1">
                <View
                  className={`w-10 h-10 rounded-full flex justify-center items-center ${
                    currentStep === 1
                      ? 'bg-amber-500 shadow-md shadow-amber-500/20'
                      : currentStep > 1
                      ? 'bg-slate-900'
                      : 'bg-slate-100 border border-slate-200'
                  }`}
                >
                  {currentStep > 1 ? (
                    <Check size={18} color="#F59E0B" />
                  ) : (
                    <Text className={`font-bold ${currentStep === 1 ? 'text-slate-900' : 'text-slate-400'}`}>1</Text>
                  )}
                </View>
                <Text className={`text-xs font-semibold mt-2 ${currentStep === 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                  Driver
                </Text>
              </View>

              {/* Progress Bar 1 */}
              <View
                className={`h-0.5 flex-1 mx-2 -mt-6 ${
                  currentStep > 1 ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              />

              {/* Step 2 Node */}
              <View className="items-center flex-1">
                <View
                  className={`w-10 h-10 rounded-full flex justify-center items-center ${
                    currentStep === 2
                      ? 'bg-amber-500 shadow-md shadow-amber-500/20'
                      : currentStep > 2
                      ? 'bg-slate-900'
                      : 'bg-slate-100 border border-slate-200'
                  }`}
                >
                  {currentStep > 2 ? (
                    <Check size={18} color="#F59E0B" />
                  ) : (
                    <Text className={`font-bold ${currentStep === 2 ? 'text-slate-900' : 'text-slate-400'}`}>2</Text>
                  )}
                </View>
                <Text className={`text-xs font-semibold mt-2 ${currentStep === 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                  Route
                </Text>
              </View>

              {/* Progress Bar 2 */}
              <View
                className={`h-0.5 flex-1 mx-2 -mt-6 ${
                  currentStep > 2 ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              />

              {/* Step 3 Node */}
              <View className="items-center flex-1">
                <View
                  className={`w-10 h-10 rounded-full flex justify-center items-center ${
                    currentStep === 3
                      ? 'bg-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Text className={`font-bold ${currentStep === 3 ? 'text-slate-900' : 'text-slate-400'}`}>3</Text>
                </View>
                <Text className={`text-xs font-semibold mt-2 ${currentStep === 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                  Schedule
                </Text>
              </View>
            </View>

            {/* Step Forms */}
            {currentStep === 1 && (
              <View>
                <Text className="text-xl font-bold text-slate-800 mb-4 ml-1">Driver Information</Text>
                <Input
                  label="Driver Name *"
                  placeholder="e.g. Rajesh Kumar"
                  value={driverName}
                  onChangeText={setDriverName}
                  error={errors.driverName}
                  autoCapitalize="words"
                />

                <Input
                  label="Phone Number *"
                  placeholder="e.g. +91 9876543210"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  error={errors.phoneNumber}
                  keyboardType="phone-pad"
                />

                <Input
                  label="Vehicle Number *"
                  placeholder="e.g. DL 1CA 1234"
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  error={errors.vehicleNumber}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {currentStep === 2 && (
              <View>
                <Text className="text-xl font-bold text-slate-800 mb-4 ml-1">Route Details</Text>
                <LocationAutocomplete
                  label="From Location *"
                  placeholder="Type to search e.g. Airport T3"
                  value={fromLocation}
                  onChangeText={setFromLocation}
                  error={errors.fromLocation}
                />

                <LocationAutocomplete
                  label="To Location *"
                  placeholder="Type to search e.g. Connaught Place"
                  value={toLocation}
                  onChangeText={setToLocation}
                  error={errors.toLocation}
                />
              </View>
            )}

            {currentStep === 3 && (
              <View>
                <Text className="text-xl font-bold text-slate-800 mb-4 ml-1">Schedule & Pricing</Text>
                
                <DateTimePickerWrapper
                  label="Travel Date / Time *"
                  value={travelDate}
                  onChangeText={setTravelDate}
                  error={errors.travelDate}
                />

                <Select
                  label="Booking Frequency *"
                  options={bookingOptions}
                  selectedValue={bookingNeed}
                  onValueChange={(val) => setBookingNeed(val as any)}
                  error={errors.bookingNeed}
                />

                <Input
                  label="Price (Optional)"
                  placeholder="e.g. 800"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />

                {/* Fixed vs Negotiable Pricing Option */}
                <View className="mb-4">
                  <Text className="text-slate-600 font-semibold text-sm mb-2 ml-1">
                    Pricing Model *
                  </Text>
                  <View className="flex-row bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                    <Pressable
                      onPress={() => setPriceType('fixed')}
                      className={`flex-1 py-3.5 rounded-xl items-center ${
                        priceType === 'fixed' ? 'bg-amber-500 shadow-sm shadow-amber-500/10' : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-base font-bold ${
                          priceType === 'fixed' ? 'text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        Fixed Price
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setPriceType('negotiable')}
                      className={`flex-1 py-3.5 rounded-xl items-center ${
                        priceType === 'negotiable' ? 'bg-amber-500 shadow-sm shadow-amber-500/10' : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-base font-bold ${
                          priceType === 'negotiable' ? 'text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        Negotiable
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Maximum Luggage Field */}
                <Input
                  label="Max Luggage Allowed (kg) *"
                  placeholder="e.g. 15"
                  value={maxLuggage > 0 ? maxLuggage.toString() : ''}
                  onChangeText={(text) => setMaxLuggage(Number(text.replace(/\D/g, '')) || 0)}
                  keyboardType="numeric"
                  error={errors.maxLuggage}
                />
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions Bar */}
          <View className="border-t border-slate-100 bg-white px-6 py-4 flex-row gap-3">
            {currentStep > 1 && (
              <Pressable
                onPress={handleBack}
                className="flex-1 border-2 border-slate-200 py-4 rounded-2xl flex-row justify-center items-center active:bg-slate-50"
              >
                <ChevronLeft size={20} color="#475569" className="mr-1" />
                <Text className="text-slate-700 font-semibold text-base">Back</Text>
              </Pressable>
            )}
            
            {currentStep < 3 ? (
              <Pressable
                onPress={handleNext}
                className="flex-2 bg-slate-900 py-4 rounded-2xl flex-row justify-center items-center active:bg-slate-800"
              >
                <Text className="text-amber-500 font-bold text-base mr-1">Next Step</Text>
                <ChevronRight size={20} color="#F59E0B" />
              </Pressable>
            ) : (
              <Pressable
                disabled={loading}
                onPress={handlePublish}
                className="flex-2 bg-amber-500 py-4 rounded-2xl flex-row justify-center items-center active:bg-amber-600"
              >
                <Text className="text-slate-900 font-bold text-base">
                  {loading ? 'Publishing...' : 'Publish Route'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
};

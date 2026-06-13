import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ridesApi } from '../services/api';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { Button } from '../components/Button';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { DateTimePickerWrapper } from '../components/DateTimePickerWrapper';
import { StepProgressBar } from '../components/StepProgressBar';
import { Select } from '../components/Select';

import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react-native';
import { COLORS, RADIUS, FONT_SIZE, SHADOW } from '../constants/theme';
import { useAuth } from '../services/auth';

type Step = 1 | 2 | 3;
type BookingFrequency = 'today_only' | 'every_day' | 'specific_date' | 'week_days';

const BOOKING_OPTIONS: { label: string; value: BookingFrequency }[] = [
  { label: 'Today Only', value: 'today_only' },
  { label: 'Every Day', value: 'every_day' },
  { label: 'Weekdays', value: 'week_days' },
  { label: 'Specific Date', value: 'specific_date' },
];

const WEEKDAYS = [
  { label: 'M', full: 'Monday', value: 'mon' },
  { label: 'T', full: 'Tuesday', value: 'tue' },
  { label: 'W', full: 'Wednesday', value: 'wed' },
  { label: 'T', full: 'Thursday', value: 'thu' },
  { label: 'F', full: 'Friday', value: 'fri' },
  { label: 'S', full: 'Saturday', value: 'sat' },
  { label: 'S', full: 'Sunday', value: 'sun' },
];

export const PublishRideScreen: React.FC = () => {
  const { user, register, login } = useAuth();
  const navigation = useNavigation<any>();

  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Form State
  const [driverName, setDriverName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.mobile || '');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [allowReverse, setAllowReverse] = useState(true);
  const [bookingNeed, setBookingNeed] = useState<BookingFrequency>('today_only');
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [travelDate, setTravelDate] = useState('');
  const [travelTime, setTravelTime] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<'fixed' | 'negotiable'>('fixed');
  const [rideType, setRideType] = useState<'sharing' | 'personal'>('sharing');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState<'from' | 'to' | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any });

  const validateStep = (step: Step): boolean => {
    const e: { [key: string]: string } = {};
    if (step === 1) {
      if (!driverName.trim()) e.driverName = 'Required';
      if (!phoneNumber.trim()) e.phoneNumber = 'Required';
      if (!vehicleName.trim()) e.vehicleName = 'Required';
    } else if (step === 2) {
      if (!fromLocation.trim()) e.fromLocation = 'Required';
      if (!toLocation.trim()) e.toLocation = 'Required';
    } else if (step === 3) {
      if (bookingNeed === 'specific_date' && !travelDate) e.travelDate = 'Please select a date';
      if (bookingNeed === 'week_days' && selectedWeekdays.length === 0) e.weekdays = 'Select at least one day';
      if (!travelTime) e.travelTime = 'Please enter departure time';
      if (!price.trim()) e.price = 'Price is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => (prev + 1) as Step);
      setErrors({});
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev - 1) as Step);
    setErrors({});
  };

  const handlePublish = async () => {
    if (!validateStep(3)) return;
    setLoading(true);

    try {
      // Auto-register/login the driver if they aren't logged in
      if (!user) {
        const pwd = `tripa_${phoneNumber.trim().replace(/\D/g, '')}`;
        let authRes = await register(driverName.trim(), phoneNumber.trim(), pwd, 'driver');
        if (!authRes.success && authRes.message?.toLowerCase().includes('already')) {
          authRes = await login(phoneNumber.trim(), pwd);
        }
        if (!authRes.success) {
          setToast({ visible: true, message: 'Could not auto-login driver. Try logging in manually.', type: 'error' });
          setLoading(false);
          return;
        }
      }

      // Get local date string instead of UTC
      const getLocalDateString = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
      };

      const res = await ridesApi.create({
        driverName: driverName.trim(),
        phoneNumber: phoneNumber.trim(),
        vehicleNumber: vehicleNumber.trim() ? vehicleNumber.trim().toUpperCase() : undefined,
        vehicleName: vehicleName.trim(),
        fromLocation: fromLocation.trim(),
        toLocation: toLocation.trim(),
        travelDate: bookingNeed === 'specific_date' ? travelDate : getLocalDateString(),
        travelTime: travelTime,
        bookingFrequency: bookingNeed,
        weekdays: bookingNeed === 'week_days' ? selectedWeekdays : undefined,
        price: price.trim(),
        priceMode: priceType,
        rideType: rideType,
        maxLuggage: 'medium',
        allowReverse: allowReverse,
      });

      if (res.success) {
        setToast({ visible: true, message: 'Ride published successfully! 🎉', type: 'success' });
        // Reset form
        setCurrentStep(1);
        setVehicleName('');
        setVehicleNumber('');
        setFromLocation('');
        setToLocation('');
        setAllowReverse(true);
        setTravelDate('');
        setTravelTime('');
        setPrice('');
        setBookingNeed('today_only');
        // Navigate to Find Ride tab after short delay so toast is visible
        setTimeout(() => {
          navigation.navigate('FindRide');
        }, 1200);
      } else {
        setToast({ visible: true, message: res.message || 'Failed', type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Network error.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Text style={styles.title}>Publish a Ride</Text>
            <Text style={styles.subtitle}>Connect with travelers in 3 simple steps.</Text>
          </View>

          <StepProgressBar currentStep={currentStep} />

          <View style={styles.card}>
            {/* ─── Step 1: Driver Info ─── */}
            {currentStep === 1 && (
              <View>
                <Text style={styles.stepTitle}>Driver Information</Text>
                <Input
                  label="Driver Name *"
                  placeholder="e.g. Raj Kumar"
                  value={driverName}
                  onChangeText={(t) => { setDriverName(t); if (t.trim()) setErrors(e => ({ ...e, driverName: undefined as any })); }}
                  error={errors.driverName}
                />
                <Input
                  label="Mobile Number *"
                  placeholder="e.g. +91 9876543210"
                  value={phoneNumber}
                  onChangeText={(t) => { setPhoneNumber(t); if (t.trim()) setErrors(e => ({ ...e, phoneNumber: undefined as any })); }}
                  keyboardType="phone-pad"
                  error={errors.phoneNumber}
                />
                <Input
                  label="Vehicle Name *"
                  placeholder="e.g. Swift Dzire / Ertiga"
                  value={vehicleName}
                  onChangeText={(t) => { setVehicleName(t); if (t.trim()) setErrors(e => ({ ...e, vehicleName: undefined as any })); }}
                  error={errors.vehicleName}
                />
                <Input
                  label="Vehicle Number"
                  placeholder="e.g. DL 1C AA 1234 (Optional)"
                  value={vehicleNumber}
                  onChangeText={(t) => setVehicleNumber(t)}
                  autoCapitalize="characters"
                  error={errors.vehicleNumber}
                />
              </View>
            )}

            {/* ─── Step 2: Route ─── */}
            {currentStep === 2 && (
              <View style={{ zIndex: 10 }}>
                <Text style={styles.stepTitle}>Route Details</Text>
                <View style={{ zIndex: activeInput === 'from' ? 20 : 10, elevation: activeInput === 'from' ? 20 : 10 }}>
                  <LocationAutocomplete
                    label="From Location *"
                    placeholder="e.g. Airport T3"
                    value={fromLocation}
                    onChangeText={(t) => { setFromLocation(t); if (t.trim()) setErrors(e => ({ ...e, fromLocation: undefined as any })); }}
                    error={errors.fromLocation}
                    onFocus={() => setActiveInput('from')}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
                <View style={{ zIndex: activeInput === 'to' ? 20 : 9, elevation: activeInput === 'to' ? 20 : 9 }}>
                  <LocationAutocomplete
                    label="To Location *"
                    placeholder="e.g. Connaught Place"
                    value={toLocation}
                    onChangeText={(t) => { setToLocation(t); if (t.trim()) setErrors(e => ({ ...e, toLocation: undefined as any })); }}
                    error={errors.toLocation}
                    onFocus={() => setActiveInput('to')}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>

                {fromLocation !== '' && toLocation !== '' && (
                  <View style={styles.reverseRouteContainer}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.reverseRouteLabel}>Available for return journey?</Text>
                      <Text style={styles.reverseRouteSub}>Also show ride for {toLocation} ➔ {fromLocation}</Text>
                    </View>
                    <Switch
                      value={allowReverse}
                      onValueChange={setAllowReverse}
                      trackColor={{ false: '#cbd5e1', true: COLORS.primary }}
                      thumbColor={Platform.OS === 'ios' ? undefined : (allowReverse ? COLORS.white : '#f4f3f4')}
                    />
                  </View>
                )}
              </View>
            )}

            {/* ─── Step 3: Schedule & Pricing ─── */}
            {currentStep === 3 && (
              <View>
                <Text style={styles.stepTitle}>Schedule & Pricing</Text>

                <View style={{ zIndex: 11 }}>
                  <Select
                    label="Ride frequency *"
                    options={BOOKING_OPTIONS}
                    selectedValue={bookingNeed}
                    onValueChange={(val) => {
                      setBookingNeed(val as BookingFrequency);
                      setErrors(e => ({ ...e, travelDate: undefined as any }));
                    }}
                  />
                </View>

                {/* Weekdays — shown only when Weekdays selected */}
                {bookingNeed === 'week_days' && (
                  <View style={styles.weekdayContainer}>
                    <Text style={styles.weekdayError}>{errors.weekdays || ''}</Text>
                    <View style={styles.weekdayRow}>
                      {WEEKDAYS.map((day) => {
                        const checked = selectedWeekdays.includes(day.value);
                        return (
                          <TouchableOpacity
                            key={day.value}
                            style={[styles.dayCircle, checked && styles.dayCircleSelected]}
                            onPress={() => {
                              setSelectedWeekdays(prev =>
                                checked ? prev.filter(d => d !== day.value) : [...prev, day.value]
                              );
                              setErrors(e => ({ ...e, weekdays: undefined as any }));
                            }}
                          >
                            <Text style={[styles.dayLabel, checked && styles.dayLabelSelected]}>{day.label}</Text>
                            <Text style={[styles.dayFull, checked && styles.dayFullSelected]}>{day.full.slice(0,3)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Specific Date — shown only when Specific Date selected */}
                {bookingNeed === 'specific_date' && (
                  <View style={{ marginTop: 8 }}>
                    <DateTimePickerWrapper
                      label="Travel Date *"
                      value={travelDate}
                      onChangeText={(t) => { setTravelDate(t); if (t) setErrors(e => ({ ...e, travelDate: undefined as any })); }}
                      error={errors.travelDate}
                      mode="date"
                    />
                  </View>
                )}

                {/* Departure Time — always shown */}
                <View style={{ marginTop: bookingNeed !== 'specific_date' ? 12 : 0 }}>
                  <DateTimePickerWrapper
                    label="Departure Time *"
                    value={travelTime}
                    onChangeText={(t) => { setTravelTime(t); if (t) setErrors(e => ({ ...e, travelTime: undefined as any })); }}
                    error={errors.travelTime}
                    mode="time"
                  />
                </View>

                {/* Cab Option selection */}
                <Text style={styles.fieldLabel}>Cab Option *</Text>
                <View style={styles.cabTypeContainer}>
                  {(['sharing', 'personal'] as const).map((ct) => (
                    <TouchableOpacity
                      key={ct}
                      style={[styles.cabTypeCard, rideType === ct && styles.cabTypeCardSelected]}
                      onPress={() => setRideType(ct)}
                    >
                      <Text style={[styles.cabTypeCardTitle, rideType === ct && styles.cabTypeCardTitleSelected]}>
                        {ct === 'sharing' ? 'Sharing Cab' : 'Personal Cab'}
                      </Text>
                      <Text style={[styles.cabTypeCardDesc, rideType === ct && styles.cabTypeCardDescSelected]}>
                        {ct === 'sharing' ? 'Priced per seat (passengers share cab)' : 'Priced for full vehicle (private cab)'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Price — required */}
                <Text style={styles.fieldLabel}>
                  {rideType === 'sharing' ? 'Price per seat *' : 'Price for full cab *'}
                </Text>
                <View style={styles.priceRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Input
                      label=""
                      placeholder="e.g. 500"
                      value={price}
                      onChangeText={(t) => { setPrice(t); if (t.trim()) setErrors(e => ({ ...e, price: undefined as any })); }}
                      keyboardType="numeric"
                      error={errors.price}
                    />
                  </View>
                  {/* Price Type — pill style */}
                  <View style={styles.priceTypePills}>
                    {(['fixed', 'negotiable'] as const).map((pt) => (
                      <TouchableOpacity
                        key={pt}
                        style={[styles.smallPill, priceType === pt && styles.smallPillSelected]}
                        onPress={() => setPriceType(pt)}
                      >
                        <Text style={[styles.smallPillText, priceType === pt && styles.smallPillTextSelected]}>
                          {pt === 'fixed' ? 'Fixed' : 'Negotiable'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {currentStep > 1 && (
            <Button title="Back" variant="outline" onPress={handleBack} style={{ flex: 1, marginRight: 12 }} icon={<ChevronLeft size={20} color={COLORS.primary} />} />
          )}
          {currentStep < 3 ? (
            <Button title="Next Step" onPress={handleNext} style={{ flex: currentStep > 1 ? 2 : 1 }} icon={<ChevronRight size={20} color={COLORS.white} />} />
          ) : (
            <Button title="Publish Ride" onPress={handlePublish} loading={loading} style={{ flex: 2 }} />
          )}
        </View>
      </KeyboardAvoidingView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  header: { marginBottom: 24 },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eef2f6',
    ...SHADOW.sm,
  },
  stepTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginTop: 4,
    marginLeft: 2,
  },

  // Booking frequency pills
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  pillSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  pillLabelSelected: { color: COLORS.white },
  pillDesc: { display: 'none' as any },
  pillDescSelected: { display: 'none' as any },

  // Price row
  priceRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  priceTypePills: { flexDirection: 'column', gap: 6, paddingTop: 4 },
  smallPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  smallPillSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryUltraLight,
  },
  smallPillText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  smallPillTextSelected: { color: COLORS.primary },

  // Weekday selector
  weekdayContainer: { marginBottom: 16 },
  weekdayError: { fontSize: FONT_SIZE.xs, color: COLORS.error, marginBottom: 6, minHeight: 16 },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  dayLabel: { fontSize: 13, fontWeight: '700', color: '#334155' },
  dayLabelSelected: { color: COLORS.white },
  dayFull: { fontSize: 8, color: '#94a3b8' },
  dayFullSelected: { color: 'rgba(255,255,255,0.75)' },

  cabTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cabTypeCard: {
    flex: 1,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  cabTypeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryUltraLight,
  },
  cabTypeCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  cabTypeCardTitleSelected: {
    color: COLORS.primary,
  },
  cabTypeCardDesc: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
  },
  cabTypeCardDescSelected: {
    color: COLORS.textSecondary,
  },
  reverseRouteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryUltraLight,
    padding: 12,
    borderRadius: RADIUS.md,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  reverseRouteLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  reverseRouteSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },

  footer: {
    backgroundColor: COLORS.white,
    padding: 20,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eef2f6',
  },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Linking, TouchableOpacity, Image, Alert, Platform, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ridesApi } from '../services/api';
import { Ride } from '../types';
import { Button } from '../components/Button';
import { RideCard } from '../components/RideCard';
import { Toast } from '../components/Toast';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { DateTimePickerWrapper } from '../components/DateTimePickerWrapper';
import { QuickRegisterModal } from '../components/QuickRegisterModal';
import { Search, ArrowDownUp, SlidersHorizontal, LogOut, X } from 'lucide-react-native';
import { COLORS, RADIUS, FONT_SIZE, SHADOW } from '../constants/theme';
import { useAuth } from '../services/auth';
import * as Location from 'expo-location';

export const FindRideScreen: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuth();

  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [userLat, setUserLat] = useState<number | undefined>();
  const [userLng, setUserLng] = useState<number | undefined>();
  const [notifyText, setNotifyText] = useState('');
  const notifyOpacity = useRef(new Animated.Value(0)).current;
  const [selectedRideType, setSelectedRideType] = useState<'all' | 'sharing' | 'personal'>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Active Input State (for dynamic zIndex stacking context)
  const [activeInput, setActiveInput] = useState<'from' | 'to' | null>(null);

  // Quick Register Modal State
  const [showRegister, setShowRegister] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingRideId, setPendingRideId] = useState('');

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any });

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        logout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: logout },
        ]
      );
    }
  };

  const getLocalDateString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [dateStr, setDateStr] = useState(getLocalDateString());

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({});
        setUserLat(location.coords.latitude);
        setUserLng(location.coords.longitude);
      } catch (error) {
        console.log('Error fetching location', error);
      }
    })();
  }, []);

  useEffect(() => {
    const passengers = ['Rahul', 'Aman', 'Priya', 'Vikram', 'Sneha', 'Karan', 'Anjali', 'Deepak', 'Neha', 'Rohan'];
    const destinations = ['Dehradun', 'Joshimath', 'Rishikesh', 'Haridwar', 'Delhi', 'Srinagar', 'Rudraprayag'];
    const drivers = ['Raj Kumar', 'Satish', 'Amit Singh', 'Vijay', 'Sanjay', 'Ramesh'];

    const showRandomNotification = () => {
      const p = passengers[Math.floor(Math.random() * passengers.length)];
      const d = destinations[Math.floor(Math.random() * destinations.length)];
      const dr = drivers[Math.floor(Math.random() * drivers.length)];
      
      // setNotifyText(`${p} booked a ride with ${dr} to ${d}`);
      setNotifyText(`Someone booked a ride with ${dr} to ${d}`);

      Animated.timing(notifyOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(notifyOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setNotifyText('');
        });
      }, 6000);
    };

    const initialTimeout = setTimeout(showRandomNotification, 8000);
    const interval = setInterval(showRandomNotification, 32000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const fetchRides = async (isRefresh = false, useCurrentInputs = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await ridesApi.list({
        fromLocation: useCurrentInputs ? fromLocation : (hasSearched ? fromLocation : undefined),
        toLocation: useCurrentInputs ? toLocation : (hasSearched ? toLocation : undefined),
        travelDate: useCurrentInputs ? dateStr : (hasSearched ? dateStr : undefined),
        userLat,
        userLng,
        rideType: selectedRideType !== 'all' ? selectedRideType : undefined,
        page: 1,
        limit: 15,
      });

      if (res.success && res.data) {
        // Deduplicate rides to prevent showing accidental double-submissions from the same driver
        const uniqueRides = res.data.filter((ride, index, self) =>
          index === self.findIndex((r) => (
            r.phoneNumber === ride.phoneNumber &&
            r.fromLocation === ride.fromLocation &&
            r.toLocation === ride.toLocation &&
            r.travelDate === ride.travelDate &&
            r.travelTime === ride.travelTime
          ))
        );
        setRides(uniqueRides);
        setPage(1);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        } else {
          setTotalPages(1);
        }
      } else {
        setToast({ visible: true, message: res.message || 'Failed to fetch rides', type: 'error' });
      }
    } catch (error) {
      setToast({ visible: true, message: 'Network error. Check connection.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMoreRides = async () => {
    if (loading || loadingMore || refreshing || page >= totalPages) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await ridesApi.list({
        fromLocation: hasSearched ? fromLocation : undefined,
        toLocation: hasSearched ? toLocation : undefined,
        travelDate: hasSearched ? dateStr : undefined,
        userLat,
        userLng,
        rideType: selectedRideType !== 'all' ? selectedRideType : undefined,
        page: nextPage,
        limit: 15,
      });

      if (res.success && res.data) {
        setRides((prevRides) => {
          const combined = [...prevRides, ...res.data!];
          // Deduplicate rides across all loaded pages
          return combined.filter((ride, index, self) =>
            index === self.findIndex((r) => (
              r.phoneNumber === ride.phoneNumber &&
              r.fromLocation === ride.fromLocation &&
              r.toLocation === ride.toLocation &&
              r.travelDate === ride.travelDate &&
              r.travelTime === ride.travelTime
            ))
          );
        });
        setPage(nextPage);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.warn('Error fetching next page of rides:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchRidesRef = React.useRef(fetchRides);
  fetchRidesRef.current = fetchRides;

  useFocusEffect(
    useCallback(() => {
      // Fetch on focus without re-triggering on every text input keystroke
      fetchRidesRef.current();
    }, []) 
  );

  useEffect(() => {
    // Also fetch automatically once the GPS location resolves, if the user hasn't started searching manually
    if (userLat !== undefined && userLng !== undefined && !hasSearched) {
      fetchRidesRef.current();
    }
  }, [userLat, userLng]);

  useEffect(() => {
    fetchRides();
  }, [selectedRideType]);

  const handleSearch = () => {
    setHasSearched(true);
    fetchRides(false, true); // explicitly tell it to use current inputs right now!
  };

  const handleSwap = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const dialPhone = (phoneNumber: string, rideId: string) => {
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      setToast({ visible: true, message: 'Could not launch dialer.', type: 'error' });
    });

    if (rideId) {
      ridesApi.incrementCallCount(rideId).catch((err) => {
        console.warn('Failed to increment call count:', err);
      });
    }
  };

  // When Call Driver is pressed: if not logged in, show Quick Register first
  const handleCallDriver = (phoneNumber: string, rideId: string) => {
    if (!isLoggedIn) {
      setPendingPhone(phoneNumber);
      setPendingRideId(rideId);
      setShowRegister(true);
    } else {
      dialPhone(phoneNumber, rideId);
    }
  };

  // After successful quick registration, place the call
  const handleRegisterSuccess = () => {
    setShowRegister(false);
    if (pendingPhone) {
      dialPhone(pendingPhone, pendingRideId);
      setPendingPhone('');
      setPendingRideId('');
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        {isLoggedIn && (
          <View style={styles.headerUserRow}>
            {user?.name && (
              <Text style={styles.headerUsername} numberOfLines={1}>
                {user.name}
              </Text>
            )}
            <TouchableOpacity style={styles.headerLogoutButton} onPress={handleLogout}>
              <LogOut size={13} color="#ef4444" style={{ marginRight: 4 }} />
              <Text style={styles.headerLogoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Search Card */}
      <View style={styles.searchCard}>

        {/* From Location */}
        <View style={{ zIndex: activeInput === 'from' ? 30 : 10, elevation: activeInput === 'from' ? 30 : 10 }}>
          <LocationAutocomplete
            label=""
            placeholder="From Location"
            value={fromLocation}
            onChangeText={setFromLocation}
            onFocus={() => setActiveInput('from')}
            onBlur={() => setActiveInput(null)}
          />
        </View>

        {/* Swap Button — floats between From and To */}
        <View style={[styles.swapRow, { zIndex: 1, elevation: 1 }]}>
          <View style={styles.dividerLine} />
          <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
            <ArrowDownUp size={15} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.dividerLine} />
        </View>

        {/* To Location */}
        <View style={{ zIndex: activeInput === 'to' ? 30 : 9, elevation: activeInput === 'to' ? 30 : 9 }}>
          <LocationAutocomplete
            label=""
            placeholder="To Location"
            value={toLocation}
            onChangeText={setToLocation}
            onFocus={() => setActiveInput('to')}
            onBlur={() => setActiveInput(null)}
          />
        </View>

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Date */}
        <DateTimePickerWrapper
          label=""
          value={dateStr}
          onChangeText={setDateStr}
          mode="date"
        />

        {/* Search Button */}
        <Button
          title="Search Ride"
          icon={<Search size={18} color={COLORS.white} />}
          onPress={handleSearch}
          loading={loading}
          style={styles.searchButton}
        />
      </View>

      {/* List Header */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listTitle}>Available Rides</Text>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setShowFilterPanel(!showFilterPanel)}
        >
          <Text style={[styles.filterText, selectedRideType !== 'all' && { color: COLORS.primary, fontWeight: '700' }]}>
            {selectedRideType === 'all' ? 'Filter' : selectedRideType === 'sharing' ? 'Sharing' : 'Personal'}
          </Text>
          <SlidersHorizontal size={16} color={selectedRideType !== 'all' ? COLORS.primary : COLORS.primaryDark} />
        </TouchableOpacity>
      </View>

      {showFilterPanel && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Cab Option:</Text>
          <View style={styles.filterPillRow}>
            {([
              { label: 'All', value: 'all' },
              { label: 'Sharing', value: 'sharing' },
              { label: 'Personal', value: 'personal' }
            ] as const).map((opt) => {
              const active = selectedRideType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                  onPress={() => setSelectedRideType(opt.value)}
                >
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Rides Found</Text>
      <Text style={styles.emptySubtitle}>No active rides match your current criteria.</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        ListHeaderComponent={renderHeader()}
        data={rides}
        style={{ flex: 1 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RideCard ride={item} onCallDriver={handleCallDriver} />}
        ListEmptyComponent={!loading ? renderEmpty() : null}
        contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRides(true)} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreRides}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        keyboardShouldPersistTaps="handled"
      />

      <QuickRegisterModal
        visible={showRegister}
        onClose={() => { setShowRegister(false); setPendingPhone(''); }}
        onSuccess={handleRegisterSuccess}
      />

      {notifyText !== '' && (
        <Animated.View style={[styles.bookingPopup, { opacity: notifyOpacity }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookingPopupText}>{notifyText}</Text>
          </View>
          <TouchableOpacity onPress={() => {
            Animated.timing(notifyOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
              setNotifyText('');
            });
          }}>
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  listContent: { padding: 16, paddingBottom: 40 },
  headerContainer: { marginBottom: 16, zIndex: 10 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  logoImage: {
    height: 40,
    width: 140,
  },
  headerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  headerLogoutText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  searchCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eef2f6',
    ...SHADOW.sm,
    zIndex: 10,
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    zIndex: 11,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  swapButton: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    ...SHADOW.sm,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  rowInputs: { flexDirection: 'row', alignItems: 'center' },
  searchButton: {
    marginTop: 8,
    backgroundColor: '#0c6b8a',
    borderRadius: RADIUS.md,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  filterButton: { flexDirection: 'row', alignItems: 'center' },
  filterText: { fontSize: 14, color: COLORS.primaryDark, marginRight: 6, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingPopup: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#334155',
    ...SHADOW.md,
  },
  bookingPopupText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingPopupSub: {
    color: '#94a3b8',
    fontSize: 8,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterPanel: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eef2f6',
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: 12,
  },
  filterPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  filterPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryUltraLight,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

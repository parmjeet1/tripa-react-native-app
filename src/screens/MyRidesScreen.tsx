import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, Modal, ScrollView, RefreshControl, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Pencil, Trash2, Car, MapPin, Calendar, Clock, IndianRupee, X, CheckCircle2, LogOut, Phone } from 'lucide-react-native';
import { ridesApi, driverApi } from '../services/api';
import { useAuth } from '../services/auth';
import { Ride } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { QuickRegisterModal } from '../components/QuickRegisterModal';
import { COLORS, RADIUS, FONT_SIZE, SHADOW } from '../constants/theme';

export const MyRidesScreen: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const navigation = useNavigation<any>();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Edit Modal State
  const [editRide, setEditRide] = useState<Ride | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editFrom, setEditFrom] = useState('');
  const [editTo, setEditTo] = useState('');
  const [editSaving, setEditSaving] = useState(false);

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

  const fetchMyRides = async (isRefresh = false) => {
    if (!isLoggedIn) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const driverRes = await driverApi.myRides();
      if (driverRes.success && driverRes.data) {
        setRides(driverRes.data);
      } else {
        setToast({ visible: true, message: driverRes.message || 'Failed to load rides', type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Network error. Check your connection.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) fetchMyRides();
    }, [isLoggedIn])
  );

  const handleDelete = (ride: Ride) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete ride from ${ride.fromLocation} to ${ride.toLocation}?`)) {
        doDelete(ride.id);
      }
    } else {
      Alert.alert(
        'Delete Ride',
        `Delete ride from ${ride.fromLocation} to ${ride.toLocation}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => doDelete(ride.id) },
        ]
      );
    }
  };

  const doDelete = async (id: string) => {
    try {
      const res = await ridesApi.remove(id);
      if (res.success) {
        setRides(prev => prev.filter(r => r.id !== id));
        setToast({ visible: true, message: 'Ride deleted successfully', type: 'success' });
      } else {
        setToast({ visible: true, message: res.message || 'Delete failed', type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Network error', type: 'error' });
    }
  };

  const openEdit = (ride: Ride) => {
    setEditRide(ride);
    setEditFrom(ride.fromLocation);
    setEditTo(ride.toLocation);
    setEditPrice(ride.price ? String(ride.price) : '');
  };

  const handleSaveEdit = async () => {
    if (!editRide) return;
    setEditSaving(true);
    try {
      const res = await ridesApi.update(editRide.id, {
        fromLocation: editFrom.trim(),
        toLocation: editTo.trim(),
        price: editPrice ? parseFloat(editPrice) : undefined,
      });
      if (res.success) {
        setRides(prev => prev.map(r => r.id === editRide.id ? { ...r, fromLocation: editFrom, toLocation: editTo, price: editPrice ? parseFloat(editPrice) : null } : r));
        setEditRide(null);
        setToast({ visible: true, message: 'Ride updated!', type: 'success' });
      } else {
        setToast({ visible: true, message: res.message || 'Update failed', type: 'error' });
      }
    } catch {
      setToast({ visible: true, message: 'Network error', type: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleStatus = async (ride: Ride) => {
    const newStatus = ride.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await ridesApi.update(ride.id, { status: newStatus });
      if (res.success) {
        setRides(prev => prev.map(r => r.id === ride.id ? { ...r, status: newStatus } : r));
        setToast({ visible: true, message: `Ride ${newStatus === 'active' ? 'activated' : 'deactivated'}`, type: 'success' });
      }
    } catch {
      setToast({ visible: true, message: 'Update failed', type: 'error' });
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  };

  const formatTime = (t: string) => {
    try {
      if (!t || t === '00:00:00') return '—';
      const [h, m] = t.split(':');
      const date = new Date(); date.setHours(+h); date.setMinutes(+m);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch { return t; }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.guestContainer}>
          <Car size={56} color={COLORS.primaryMuted} style={{ marginBottom: 16 }} />
          <Text style={styles.guestTitle}>Driver Area</Text>
          <Text style={styles.guestSubtitle}>Register or log in to view and manage your published rides.</Text>
          <Button title="Get Started" onPress={() => setShowRegister(true)} style={{ marginTop: 24, paddingHorizontal: 40 }} />
        </View>
        <QuickRegisterModal visible={showRegister} onClose={() => setShowRegister(false)} onSuccess={() => { setShowRegister(false); fetchMyRides(); }} />
      </SafeAreaView>
    );
  }

  const renderRide = ({ item: ride }: { item: Ride }) => (
    <View style={[styles.rideCard, ride.status === 'inactive' && styles.rideCardInactive]}>
      {/* Status + Actions */}
      <View style={styles.cardHeader}>
        <TouchableOpacity onPress={() => handleToggleStatus(ride)} style={[styles.statusBadge, ride.status === 'active' ? styles.statusActive : styles.statusInactive]}>
          <CheckCircle2 size={12} color={ride.status === 'active' ? '#15803d' : '#94a3b8'} style={{ marginRight: 4 }} />
          <Text style={[styles.statusText, ride.status === 'active' ? styles.statusTextActive : styles.statusTextInactive]}>
            {ride.status === 'active' ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(ride)}>
            <Pencil size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDelete]} onPress={() => handleDelete(ride)}>
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeRow}>
        <MapPin size={14} color={COLORS.primary} />
        <Text style={styles.routeText} numberOfLines={1}>{ride.fromLocation}</Text>
        <Text style={styles.routeArrow}>→</Text>
        <Text style={styles.routeText} numberOfLines={1}>{ride.toLocation}</Text>
      </View>

      {/* Meta */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Car size={13} color={COLORS.textMuted} />
          <Text style={styles.metaText}>
            {ride.vehicleName
              ? `${ride.vehicleName} (${ride.vehicleNumber || '*****'})`
              : (ride.vehicleNumber || '*****')}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Calendar size={13} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{ride.bookingFrequency === 'today_only' ? formatDate(ride.travelDate) : ride.bookingFrequency === 'every_day' ? 'Every Day' : ride.bookingFrequency === 'week_days' ? 'Weekdays' : formatDate(ride.travelDate)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={13} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{formatTime(ride.travelTime)}</Text>
        </View>
        {ride.price && (
          <View style={styles.metaItem}>
            <IndianRupee size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{ride.price} {ride.rideType === 'personal' ? '(Private)' : '(Sharing)'}</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <Phone size={13} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{ride.callCount || 0} Click{ride.callCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={rides}
        keyExtractor={r => r.id}
        renderItem={renderRide}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.headerTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pageTitle}>My Rides</Text>
                <Text style={styles.pageSubtitle}>{rides.length} ride{rides.length !== 1 ? 's' : ''} published</Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut size={15} color="#ef4444" style={{ marginRight: 4 }} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
            {user && (
              <View style={styles.driverInfoBanner}>
                <Text style={styles.driverInfoText}>
                  Driver account: <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>{user.name}</Text> ({user.mobile})
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Car size={44} color={COLORS.primaryMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No rides yet</Text>
              <Text style={styles.emptySubtitle}>Publish your first ride from the "Publish Ride" tab.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMyRides(true)} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Edit Modal */}
      <Modal visible={!!editRide} transparent animationType="slide" onRequestClose={() => setEditRide(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setEditRide(null)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Ride</Text>
              <TouchableOpacity onPress={() => setEditRide(null)}>
                <X size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Input label="From Location" value={editFrom} onChangeText={setEditFrom} placeholder="From" />
              <Input label="To Location" value={editTo} onChangeText={setEditTo} placeholder="To" />
              <Input label="Price (₹)" value={editPrice} onChangeText={setEditPrice} placeholder="e.g. 500" keyboardType="numeric" />
              <Button title="Save Changes" onPress={handleSaveEdit} loading={editSaving} style={{ marginTop: 8 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  listContent: { padding: 16, paddingBottom: 40 },
  listHeader: { marginBottom: 16, marginTop: 8 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  pageSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  driverInfoBanner: {
    backgroundColor: COLORS.primaryUltraLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  driverInfoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  rideCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eef2f6',
    ...SHADOW.sm,
  },
  rideCardInactive: { opacity: 0.6 },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusActive: { backgroundColor: '#dcfce7' },
  statusInactive: { backgroundColor: '#f1f5f9' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextActive: { color: '#15803d' },
  statusTextInactive: { color: '#94a3b8' },

  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primaryUltraLight,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnDelete: { backgroundColor: '#fef2f2' },

  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  routeText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#334155', marginHorizontal: 6 },
  routeArrow: { fontSize: 14, color: COLORS.textMuted },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#475569' },

  // Guest view
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  guestTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  guestSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Empty state
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },

  // Edit modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...SHADOW.lg,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalBody: { paddingHorizontal: 20, paddingTop: 8 },
});

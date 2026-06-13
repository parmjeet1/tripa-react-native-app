import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Calendar, Clock, Car, Briefcase, Phone } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOW, FONT_SIZE } from '../constants/theme';
import { Button } from './Button';
import { Ride } from '../types';

interface RideCardProps {
  ride: Ride;
  onCallDriver: (phoneNumber: string, rideId: string) => void;
}

const getDeterministicValue = (id: string, min: number, max: number, decimals = 0) => {
  let hash = 0;
  const seed = id || 'fallback-seed';
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rand = Math.abs(Math.sin(hash));
  const value = min + rand * (max - min);
  return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value);
};

const getRating = (id: string) => getDeterministicValue(id, 4.2, 4.9, 1).toFixed(1);
const getReviewCount = (id: string) => getDeterministicValue(id, 10, 190);

export const RideCard: React.FC<RideCardProps> = ({ ride, onCallDriver }) => {
  const formatTravelDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return timeStr;
    }
  };

  return (
    <View style={styles.card}>
      {/* Header: Driver Info & Price */}
      <View style={styles.headerRow}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{ride.driverName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.driverName}>{ride.driverName}</Text>
            <Text style={styles.ratingText}>⭐ {getRating(ride.id)} ({getReviewCount(ride.id)} reviews)</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          {ride.price ? (
            <Text style={styles.priceText}>
              ₹{ride.price}
              <Text style={styles.priceUnitText}>
                {ride.rideType === 'personal' ? ' / full cab' : ' / seat'}
              </Text>
            </Text>
          ) : (
            <Text style={styles.priceTextNA}>N/A</Text>
          )}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, ride.priceMode === 'negotiable' ? styles.badgeNegotiable : styles.badgeFixed, { marginRight: 4 }]}>
              <Text style={[styles.badgeText, ride.priceMode === 'negotiable' ? styles.badgeTextNegotiable : styles.badgeTextFixed]}>
                {ride.priceMode.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.badge, ride.rideType === 'personal' ? styles.badgePersonal : styles.badgeSharing]}>
              <Text style={[styles.badgeText, ride.rideType === 'personal' ? styles.badgeTextPersonal : styles.badgeTextSharing]}>
                {ride.rideType === 'personal' ? 'PRIVATE' : 'SHARING'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Route Info */}
      <View style={styles.routeContainer}>
        {/* Timeline graphics */}
        <View style={styles.timeline}>
          <View style={styles.timelineDotHollow} />
          <View style={styles.timelineLine} />
          <View style={styles.timelineDotSolid} />
        </View>
        
        {/* Route Details */}
        <View style={styles.routeDetails}>
          <View style={styles.locationItem}>
            <Text style={styles.locationLabel}>From</Text>
            <Text style={styles.locationText}>{ride.fromLocation}</Text>
          </View>
          <View style={[styles.locationItem, { marginBottom: 0 }]}>
            <Text style={styles.locationLabel}>To</Text>
            <Text style={styles.locationText}>{ride.toLocation}</Text>
          </View>
        </View>
      </View>

      {/* Meta Info Grid */}
      <View style={styles.metaGrid}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={COLORS.textPrimary} style={styles.metaIcon} />
            <Text style={styles.metaText}>{formatTravelDate(ride.travelDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={14} color={COLORS.textPrimary} style={styles.metaIcon} />
            <Text style={styles.metaText}>{formatTime(ride.travelTime)}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Car size={14} color={COLORS.textPrimary} style={styles.metaIcon} />
            <Text style={styles.metaText}>
              {ride.vehicleName
                ? `${ride.vehicleName} (${ride.vehicleNumber || '*****'})`
                : (ride.vehicleNumber || '*****')}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Briefcase size={14} color={COLORS.textPrimary} style={styles.metaIcon} />
            <Text style={styles.metaText}>Max {ride.maxLuggage === 'none' ? '0' : ride.maxLuggage === 'small' ? '1' : ride.maxLuggage === 'medium' ? '2' : '3+'} Bags</Text>
          </View>
        </View>
      </View>

      {/* Call Driver Button */}
      <Button
        title="Call Driver"
        icon={<Phone size={16} color={COLORS.white} />}
        onPress={() => onCallDriver(ride.phoneNumber, ride.id)}
        style={{ borderRadius: RADIUS.md }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eef2f6',
    ...SHADOW.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
  },
  driverName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  ratingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#1a5f7a', // dark blue for price
    marginBottom: 4,
  },
  priceTextNA: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  priceUnitText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgePersonal: {
    backgroundColor: '#f3e8ff',
  },
  badgeSharing: {
    backgroundColor: '#e0f2fe',
  },
  badgeTextPersonal: {
    color: '#7e22ce',
  },
  badgeTextSharing: {
    color: '#0369a1',
  },
  badgeFixed: {
    backgroundColor: COLORS.primaryUltraLight,
  },
  badgeNegotiable: {
    backgroundColor: COLORS.warningLight,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeTextFixed: {
    color: COLORS.primaryDark,
  },
  badgeTextNegotiable: {
    color: '#b45309', // darker orange text
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timeline: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  timelineDotHollow: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1a5f7a',
    backgroundColor: COLORS.white,
    zIndex: 2,
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: '#cbd5e1',
    marginVertical: 2,
  },
  timelineDotSolid: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1a5f7a',
    zIndex: 2,
  },
  routeDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  locationItem: {
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  locationText: {
    fontSize: FONT_SIZE.md,
    color: '#334155',
    fontWeight: '400',
  },
  metaGrid: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 8,
    color: '#64748b',
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
  },
});

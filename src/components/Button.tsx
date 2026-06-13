import React, { useRef } from 'react';
import {
  Pressable, Text, ActivityIndicator, View,
  Animated, StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'solid', loading = false,
  disabled = false, icon, size = 'md', style, textStyle, fullWidth = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: false, speed: 50, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: false, speed: 30, bounciness: 6 }).start();
  };

  const paddingMap = {
    sm: { paddingVertical: 10, paddingHorizontal: 20 },
    md: { paddingVertical: 15, paddingHorizontal: 24 },
    lg: { paddingVertical: 18, paddingHorizontal: 28 },
  };
  const fontSizeMap = { sm: 13, md: 15, lg: 17 };

  const containerStyle =
    variant === 'solid' ? (isDisabled ? styles.solidDisabled : styles.solid)
    : variant === 'outline' ? (isDisabled ? styles.outlineDisabled : styles.outline)
    : styles.ghost;

  const textColor =
    variant === 'solid' ? COLORS.white
    : variant === 'outline' ? (isDisabled ? COLORS.primaryMuted : COLORS.primary)
    : COLORS.primary;

  const flattenedStyle = StyleSheet.flatten(style);
  const wrapperStyle = { ...flattenedStyle };
  const customPressableStyle: any = {};

  if (wrapperStyle.backgroundColor) {
    customPressableStyle.backgroundColor = wrapperStyle.backgroundColor;
    delete wrapperStyle.backgroundColor;
  }
  if (wrapperStyle.borderRadius) {
    customPressableStyle.borderRadius = wrapperStyle.borderRadius;
    delete wrapperStyle.borderRadius;
  }

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { width: '100%' }, wrapperStyle]}>
      <Pressable
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.base, containerStyle, paddingMap[size], customPressableStyle, !fullWidth && { width: 'auto' }]}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'solid' ? COLORS.white : COLORS.primary} size="small" />
        ) : (
          <View style={styles.innerRow}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.label, { fontSize: fontSizeMap[size], color: textColor }, textStyle]}>
              {title}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  solid: {
    backgroundColor: COLORS.primary,
    ...SHADOW.md,
  },
  solidDisabled: {
    backgroundColor: COLORS.primaryMuted,
    elevation: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  outlineDisabled: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primaryMuted,
  },
  ghost: {
    backgroundColor: COLORS.primaryUltraLight,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconWrap: { marginRight: 2 },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});

import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  Animated,
  StyleSheet,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: object;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'solid',
  loading = false,
  disabled = false,
  icon,
  size = 'md',
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const paddingMap = {
    sm: { paddingVertical: 10, paddingHorizontal: 20 },
    md: { paddingVertical: 16, paddingHorizontal: 28 },
    lg: { paddingVertical: 20, paddingHorizontal: 32 },
  };

  const fontSizeMap = { sm: 13, md: 16, lg: 18 };

  const solidStyle = isDisabled
    ? styles.solidDisabled
    : styles.solid;
  const outlineStyle = isDisabled
    ? styles.outlineDisabled
    : styles.outline;
  const ghostStyle = isDisabled ? styles.ghostDisabled : styles.ghost;

  const containerStyle =
    variant === 'solid'
      ? solidStyle
      : variant === 'outline'
      ? outlineStyle
      : ghostStyle;

  const textColor =
    variant === 'solid'
      ? isDisabled
        ? '#7C3AED40'
        : '#0F172A'
      : variant === 'outline'
      ? isDisabled
        ? '#F59E0B60'
        : '#D97706'
      : isDisabled
      ? '#94A3B8'
      : '#F59E0B';

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.base, containerStyle, paddingMap[size]]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'solid' ? '#0F172A' : '#F59E0B'}
            size="small"
          />
        ) : (
          <View style={styles.innerRow}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text
              style={[
                styles.label,
                { fontSize: fontSizeMap[size], color: textColor },
              ]}
            >
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
    width: '100%',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  solid: {
    backgroundColor: '#F59E0B',
    // Layered shadow for depth
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  solidDisabled: {
    backgroundColor: '#FDE68A',
    shadowColor: 'transparent',
    elevation: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  outlineDisabled: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FDE68A',
    elevation: 0,
  },
  ghost: {
    backgroundColor: '#FFF7ED',
  },
  ghostDisabled: {
    backgroundColor: '#F8FAFC',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconWrap: {
    marginRight: 2,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});

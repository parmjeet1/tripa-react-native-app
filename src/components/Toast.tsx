import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOW, FONT_SIZE } from '../constants/theme';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning';
  onHide: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible, message, type = 'success', onHide, duration = 3000
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: false }),
        Animated.spring(translateY, { toValue: 0, speed: 20, bounciness: 6, useNativeDriver: false })
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: false }),
          Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: false })
        ]).start(() => {
          onHide();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, message]);

  if (!visible) return null;

  const bgColors = {
    success: COLORS.successLight,
    error: COLORS.errorLight,
    warning: COLORS.warningLight,
  };

  const textColors = {
    success: COLORS.success,
    error: COLORS.error,
    warning: COLORS.warning,
  };

  const iconColors = {
    success: COLORS.success,
    error: COLORS.error,
    warning: COLORS.warning,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColors[type], opacity, transform: [{ translateY }] }
      ]}
    >
      <View style={styles.iconContainer}>
        {type === 'success' ? (
          <CheckCircle2 size={20} color={iconColors[type]} />
        ) : (
          <AlertCircle size={20} color={iconColors[type]} />
        )}
      </View>
      <Text style={[styles.text, { color: textColors[type] }]}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    ...SHADOW.md,
  },
  iconContainer: { marginRight: 12 },
  text: { flex: 1, fontWeight: '600', fontSize: FONT_SIZE.md },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error';
  onHide: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  onHide,
  duration = 3000,
}) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  const isSuccess = type === 'success';

  return (
    <View style={styles.container} className="w-full px-6 pointer-events-none">
      <View
        className={`w-full py-4 px-5 rounded-2xl flex-row items-center border shadow-lg ${
          isSuccess
            ? 'bg-slate-900 border-slate-800'
            : 'bg-red-500 border-red-400'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 size={20} color="#F59E0B" className="mr-3" />
        ) : (
          <AlertCircle size={20} color="#FFFFFF" className="mr-3" />
        )}
        <Text
          className={`flex-1 text-base font-semibold ${
            isSuccess ? 'text-amber-400' : 'text-white'
          }`}
        >
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    zIndex: 9999,
    alignSelf: 'center',
  },
});

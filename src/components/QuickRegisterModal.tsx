import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, Pressable, KeyboardAvoidingView,
  Platform, ActivityIndicator, ScrollView
} from 'react-native';
import { X, Phone, User } from 'lucide-react-native';
import { Input } from './Input';
import { Button } from './Button';
import { COLORS, RADIUS, FONT_SIZE, SHADOW } from '../constants/theme';
import { useAuth } from '../services/auth';

interface QuickRegisterModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role?: 'driver' | 'rider'; // 'rider' for passengers, 'driver' for publish flow
}

export const QuickRegisterModal: React.FC<QuickRegisterModalProps> = ({
  visible, onClose, onSuccess, role = 'rider',
}) => {
  const { register, login } = useAuth();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [errors, setErrors] = useState<{ name?: string; mobile?: string }>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e: { name?: string; mobile?: string } = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!mobile.trim()) e.mobile = 'Mobile number is required';
    else if (mobile.replace(/\D/g, '').length < 8) e.mobile = 'Enter a valid mobile number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      // Use mobile as password (auto-generated)
      const password = `tripa_${mobile.replace(/\D/g, '')}`;
      let res = await register(name.trim(), mobile.trim(), password, role);
      
      if (!res.success && res.message?.toLowerCase().includes('already')) {
        // If already registered, log them in automatically
        res = await login(mobile.trim(), password);
      }

      if (res.success) {
        setName('');
        setMobile('');
        setErrors({});
        onSuccess();
      } else {
        setApiError(res.message || 'Action failed. Try again.');
      }
    } catch {
      setApiError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={styles.sheet}>
          <Pressable style={styles.sheetContent}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Quick Register</Text>
                <Text style={styles.subtitle}>To call a driver, we need your details.</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            {/* Form */}
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
              <Input
                label="Your Name *"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChangeText={(t) => { setName(t); setErrors(e => ({ ...e, name: undefined })); }}
                error={errors.name}
                icon={<User size={18} color={COLORS.textMuted} />}
              />
              <Input
                label="Mobile Number *"
                placeholder="e.g. +91 9876543210"
                value={mobile}
                onChangeText={(t) => { setMobile(t); setErrors(e => ({ ...e, mobile: undefined })); }}
                keyboardType="phone-pad"
                error={errors.mobile}
                icon={<Phone size={18} color={COLORS.textMuted} />}
              />

              {apiError ? (
                <Text style={styles.apiError}>{apiError}</Text>
              ) : null}

              <Button
                title="Continue & Call Driver"
                onPress={handleSubmit}
                loading={loading}
                style={{ marginTop: 8 }}
              />

              <Text style={styles.disclaimer}>
                Your info is saved so you only need to do this once.
              </Text>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
    ...SHADOW.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  apiError: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    marginBottom: 12,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});

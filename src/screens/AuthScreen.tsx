import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/auth';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { COLORS, RADIUS, FONT_SIZE, SHADOW } from '../constants/theme';
import { Phone, Lock, User } from 'lucide-react-native';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const navigation = useNavigation<any>();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any });

  const validate = () => {
    const newErrors: any = {};
    if (!isLogin && !name.trim()) newErrors.name = 'Name is required';
    if (!mobile.trim()) newErrors.mobile = 'Mobile number is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await login(mobile, password);
      } else {
        res = await register(name, mobile, password);
      }

      if (res.success) {
        setToast({ visible: true, message: isLogin ? 'Login successful' : 'Registration successful', type: 'success' });
        setTimeout(() => {
          navigation.goBack(); // Return to previous screen
        }, 1000);
      } else {
        setToast({ visible: true, message: res.message || 'Authentication failed', type: 'error' });
      }
    } catch (error) {
      setToast({ visible: true, message: 'Network error.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Tripa RideConnect</Text>
            <Text style={styles.subtitle}>{isLogin ? 'Welcome back, Driver!' : 'Join as a Driver'}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tabRow}>
              <TouchableOpacity style={[styles.tab, isLogin && styles.tabActive]} onPress={() => { setIsLogin(true); setErrors({}); }}>
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, !isLogin && styles.tabActive]} onPress={() => { setIsLogin(false); setErrors({}); }}>
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Register</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {!isLogin && (
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={name}
                  onChangeText={setName}
                  error={errors.name}
                  icon={<User size={18} color={COLORS.textMuted} />}
                />
              )}
              
              <Input
                label="Mobile Number"
                placeholder="+91 9876543210"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                error={errors.mobile}
                icon={<Phone size={18} color={COLORS.textMuted} />}
              />

              <Input
                label="Password"
                placeholder="********"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
                icon={<Lock size={18} color={COLORS.textMuted} />}
              />

              <Button
                title={isLogin ? "Login" : "Create Account"}
                onPress={handleSubmit}
                loading={loading}
                style={{ marginTop: 16 }}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({...toast, visible: false})} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primaryUltraLight },
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: FONT_SIZE.xxxl, fontWeight: '800', color: COLORS.primaryDark, marginBottom: 8 },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: '500' },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.lg },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },
  form: { padding: 24 },
});

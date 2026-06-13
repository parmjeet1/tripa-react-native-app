import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Platform, StyleSheet, Modal } from 'react-native';
// @ts-ignore
import { createElement } from 'react-native-web';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, ChevronDown } from 'lucide-react-native';
import { COLORS, RADIUS, FONT_SIZE } from '../constants/theme';

interface DateTimePickerProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  mode?: 'date' | 'time' | 'datetime';
}

export const DateTimePickerWrapper: React.FC<DateTimePickerProps> = ({
  label, value, onChangeText, error, mode = 'datetime'
}) => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [currentMode, setCurrentMode] = useState<'date' | 'time'>('date');

  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setDate(parsed);
      }
    }
  }, [value]);

  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    
    if (selectedDate) {
      setDate(selectedDate);
      if (mode === 'datetime' && currentMode === 'date' && Platform.OS === 'android') {
        setCurrentMode('time');
        setShow(true); // Open time picker after date on Android
      } else {
        onChangeText(selectedDate.toISOString());
      }
    }
  };

  const showPicker = () => {
    setCurrentMode(mode === 'time' ? 'time' : 'date');
    setShow(true);
  };

  const displayValue = value ? new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: mode !== 'date' ? 'numeric' : undefined,
    minute: mode !== 'date' ? '2-digit' : undefined,
    hour12: true
  }) : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {Platform.OS === 'web' ? (
        <View style={[styles.inputContainer, error && styles.inputError]}>
          <View style={styles.iconContainer}>
            {mode === 'time' ? (
              <Clock size={18} color={value ? COLORS.primary : COLORS.textMuted} />
            ) : (
              <Calendar size={18} color={value ? COLORS.primary : COLORS.textMuted} />
            )}
          </View>
          {createElement('input', {
            type: mode === 'date' ? 'date' : mode === 'time' ? 'time' : 'datetime-local',
            // For time mode: value is already 'HH:MM'. For date/datetime: convert from ISO.
            value: (() => {
              if (!value) return '';
              if (mode === 'time') return value; // already HH:MM
              try {
                const d = new Date(value);
                if (isNaN(d.getTime())) return '';
                return d.toISOString().slice(0, mode === 'datetime' ? 16 : 10);
              } catch { return ''; }
            })(),
            onChange: (e: any) => {
              const v = e.target.value;
              if (!v) { onChangeText(''); return; }
              if (mode === 'time') {
                // Store plain HH:MM, don't parse to ISO
                onChangeText(v);
              } else {
                try {
                  const newDate = new Date(v);
                  onChangeText(newDate.toISOString());
                } catch { onChangeText(v); }
              }
            },
            style: {
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: FONT_SIZE.base,
              color: COLORS.textPrimary,
              outline: 'none',
              fontFamily: 'inherit',
            }
          })}
        </View>
      ) : (
        <Pressable 
          onPress={showPicker}
          style={[styles.inputContainer, error && styles.inputError]}
        >
          <View style={styles.iconContainer}>
            {mode === 'time' ? (
              <Clock size={18} color={displayValue ? COLORS.primary : COLORS.textMuted} />
            ) : (
              <Calendar size={18} color={displayValue ? COLORS.primary : COLORS.textMuted} />
            )}
          </View>
          
          <Text style={[styles.valueText, !displayValue && styles.placeholderText]}>
            {displayValue || 'Select Date & Time'}
          </Text>
          
          <ChevronDown size={18} color={COLORS.textMuted} />
        </Pressable>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {show && Platform.OS !== 'web' && (
        <View>
          {Platform.OS === 'ios' ? (
            <Modal transparent animationType="slide">
              <Pressable style={styles.modalOverlay} onPress={() => setShow(false)}>
                <Pressable style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Pressable onPress={() => setShow(false)}>
                      <Text style={styles.modalDone}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={date}
                    mode={mode === 'datetime' ? currentMode : mode}
                    display="spinner"
                    onChange={onChange}
                    minimumDate={new Date()}
                    textColor={COLORS.textPrimary}
                  />
                </Pressable>
              </Pressable>
            </Modal>
          ) : (
            <DateTimePicker
              value={date}
              mode={mode === 'datetime' ? currentMode : mode}
              display="default"
              onChange={onChange}
              minimumDate={new Date()}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONT_SIZE.sm, marginBottom: 6, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6fbfd',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputError: { borderColor: COLORS.error, backgroundColor: '#fef2f2' },
  iconContainer: { marginRight: 10 },
  valueText: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZE.base },
  placeholderText: { color: COLORS.textMuted },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.xs, marginTop: 4, marginLeft: 4, fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: COLORS.white, paddingBottom: 20, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg },
  modalHeader: { padding: 16, alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  modalDone: { color: COLORS.primary, fontWeight: 'bold', fontSize: FONT_SIZE.md },
});

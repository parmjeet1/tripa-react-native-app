import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';

interface DateTimePickerWrapperProps {
  label: string;
  value: string; // ISO String or datetime-local format
  onChangeText: (value: string) => void;
  error?: string;
}

export const DateTimePickerWrapper: React.FC<DateTimePickerWrapperProps> = ({
  label,
  value,
  onChangeText,
  error,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Format date for display on native
  const getDisplayValue = () => {
    if (!value) return 'Select Date & Time *';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
  };

  const handlePress = () => {
    const current = value ? new Date(value) : new Date();
    setTempDate(isNaN(current.getTime()) ? new Date() : current);
    setPickerMode('date');
    setShowPicker(true);
  };

  const handlePickerChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    if (selectedDate) {
      if (pickerMode === 'date') {
        const nextDate = new Date(tempDate);
        nextDate.setFullYear(selectedDate.getFullYear());
        nextDate.setMonth(selectedDate.getMonth());
        nextDate.setDate(selectedDate.getDate());
        setTempDate(nextDate);
        
        // Android stability: close date picker before opening time picker
        if (Platform.OS === 'android') {
          setShowPicker(false);
          setPickerMode('time');
          setTimeout(() => {
            setShowPicker(true);
          }, 150);
        } else {
          setPickerMode('time');
        }
      } else {
        const finalDate = new Date(tempDate);
        finalDate.setHours(selectedDate.getHours());
        finalDate.setMinutes(selectedDate.getMinutes());
        onChangeText(finalDate.toISOString());
        setShowPicker(false);
      }
    } else {
      setShowPicker(false);
    }
  };

  if (Platform.OS === 'web') {
    // Standard datetime-local input for Web
    // Ensure value is in YYYY-MM-DDTHH:MM format for html input
    let htmlValue = '';
    if (value) {
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          // Adjust timezone offset to output local ISO string
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
          htmlValue = localISOTime;
        } else {
          htmlValue = value;
        }
      } catch {
        htmlValue = value;
      }
    }

    return (
      <View className="mb-4">
        <Text className="text-slate-600 font-semibold text-sm mb-1.5 ml-1">
          {label}
        </Text>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="datetime-local"
            value={htmlValue}
            onChange={(e) => {
              const selectedVal = e.target.value;
              if (selectedVal) {
                onChangeText(new Date(selectedVal).toISOString());
              } else {
                onChangeText('');
              }
            }}
            style={{
              width: '100%',
              backgroundColor: '#F8FAFC',
              borderColor: error ? '#EF4444' : '#E2E8F0',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: '16px',
              padding: '14px 16px',
              color: '#334155',
              fontSize: '16px',
              fontWeight: '600',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {error && (
          <Text className="text-red-500 text-xs mt-1.5 ml-1.5 font-medium">
            {error}
          </Text>
        )}
      </View>
    );
  }

  // Native pressable selection
  return (
    <View className="mb-4">
      <Text className="text-slate-600 font-semibold text-sm mb-1.5 ml-1">
        {label}
      </Text>
      
      <Pressable
        onPress={handlePress}
        className={`w-full bg-slate-50 border rounded-2xl px-4 py-4 flex-row items-center justify-between active:bg-slate-100 ${
          error ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
        }`}
      >
        <Text className={`text-base font-semibold ${value ? 'text-slate-800' : 'text-slate-400'}`}>
          {getDisplayValue()}
        </Text>
        <View className="flex-row gap-2">
          <Calendar size={18} color="#94A3B8" />
          <Clock size={18} color="#94A3B8" />
        </View>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode={pickerMode}
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
        />
      )}

      {error && (
        <Text className="text-red-500 text-xs mt-1.5 ml-1.5 font-medium">
          {error}
        </Text>
      )}
    </View>
  );
};

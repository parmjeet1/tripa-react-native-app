import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from 'react-native';
import { MapPin, ChevronDown } from 'lucide-react-native';
import { ridesApi } from '../services/api';
import { COLORS, RADIUS, FONT_SIZE, SHADOW } from '../constants/theme';

interface LocationAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  label, placeholder, value, onChangeText, error, onFocus, onBlur,
}) => {
  const [filtered, setFiltered] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (value.length >= 3) {
      debounceTimer.current = setTimeout(async () => {
        try {
          const res = await ridesApi.locations(value);
          if (res.success && res.data) {
            setFiltered(res.data.length > 0 ? res.data : [value]);
            setShowDropdown(true);
          }
        } catch (err) {
          setFiltered([value]);
        }
      }, 300);
    } else {
      setFiltered([]);
      setShowDropdown(false);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [value]);

  const handleTextChange = (text: string) => {
    onChangeText(text);
    if (blurTimer.current) clearTimeout(blurTimer.current);
  };

  const handleFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    if (value.length >= 3) setShowDropdown(true);
    if (onFocus) onFocus();
  };
  
  const handleSelect = (selectedLoc: string) => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    onChangeText(selectedLoc);
    setShowDropdown(false);
    if (onBlur) onBlur();
  };

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => setShowDropdown(false), 200);
    if (onBlur) onBlur();
  };

  const visibleItems = filtered.slice(0, 5);

  return (
    <View style={[styles.container, { zIndex: showDropdown ? 999 : 1, elevation: showDropdown ? 999 : 1 }]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={{ position: 'relative', zIndex: showDropdown ? 999 : 1, elevation: showDropdown ? 999 : 1 }}>
        <View
          style={[
            styles.inputContainer,
            showDropdown && styles.inputActive,
            error ? styles.inputError : null
          ]}
        >
          <MapPin size={18} color={showDropdown ? COLORS.primary : COLORS.textMuted} style={styles.icon} />
          <View style={{ flex: 1 }}>
            <TextInput
              placeholder={placeholder}
              placeholderTextColor={COLORS.textMuted}
              value={value}
              onChangeText={handleTextChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={[styles.innerInput, { outlineStyle: 'none' } as any]}
            />
          </View>
          <ChevronDown size={18} color={COLORS.textMuted} style={{ transform: [{ rotate: showDropdown ? '180deg' : '0deg' }] }} />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {showDropdown && visibleItems.length > 0 && (
          <View style={styles.dropdown}>
            {visibleItems.map((item, index) => (
              <Pressable
                key={item}
                onPressIn={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.dropdownItemPressable,
                  pressed && styles.dropdownItemPressed,
                ]}
              >
                <View
                  style={[
                    styles.dropdownItemContainer,
                    index < visibleItems.length - 1 && styles.dropdownItemBorder
                  ]}
                >
                  <MapPin size={16} color={COLORS.primary} style={styles.itemIcon} />
                  <Text 
                    style={[styles.itemText, item === value && styles.itemTextSelected]} 
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item}
                  </Text>
                  {item === value && <View style={styles.selectedDot} />}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16, position: 'relative' },
  label: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONT_SIZE.sm, marginBottom: 6, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6fbfd',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
  },
  inputActive: { borderColor: COLORS.primary, backgroundColor: COLORS.white },
  inputError: { borderColor: COLORS.error, backgroundColor: '#fef2f2' },
  icon: { marginRight: 8 },
  innerInput: { flex: 1, paddingVertical: 14, fontSize: FONT_SIZE.base, color: COLORS.textPrimary },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.xs, marginTop: 4, marginLeft: 4, fontWeight: '500' },
  dropdown: {
    position: 'absolute',
    top: 56, // Just below the input container (approx 52px height + 4px gap)
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.lg,
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    zIndex: 999,
  },
  dropdownItemPressable: {
    backgroundColor: COLORS.white,
    width: '100%',
  },
  dropdownItemPressed: { 
    backgroundColor: COLORS.primaryUltraLight 
  },
  dropdownItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemBorder: { 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.borderLight 
  },
  itemIcon: { marginRight: 12 },
  itemText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '500', flex: 1 },
  itemTextSelected: { color: COLORS.primary, fontWeight: '700' },
  selectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
});

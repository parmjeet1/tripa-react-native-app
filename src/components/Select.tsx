import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { COLORS, RADIUS, FONT_SIZE, SHADOW } from '../constants/theme';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label, options, selectedValue, onValueChange, error
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find((opt) => opt.value === selectedValue)?.label;

  const handleSelect = (val: string) => {
    onValueChange(val);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, { zIndex: isOpen ? 99 : 1 }]}>
      <Text style={styles.label}>{label}</Text>
      
      <Pressable 
        style={[styles.selectBox, isOpen && styles.selectBoxActive, error && styles.selectBoxError]} 
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[styles.valueText, !selectedLabel && styles.placeholderText]}>
          {selectedLabel || 'Select an option'}
        </Text>
        <ChevronDown size={18} color={COLORS.textMuted} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
      </Pressable>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {isOpen && (
        <View style={styles.dropdown}>
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.optionItem,
                  isSelected && styles.optionItemSelected,
                  index < options.length - 1 && styles.optionItemBorder
                ]}
                onPress={() => handleSelect(option.value)}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
                {isSelected && <Check size={18} color={COLORS.primary} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16, position: 'relative' },
  label: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONT_SIZE.sm, marginBottom: 6, marginLeft: 4 },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f6fbfd',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectBoxActive: { borderColor: COLORS.primary, backgroundColor: COLORS.white },
  selectBoxError: { borderColor: COLORS.error, backgroundColor: '#fef2f2' },
  valueText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.base, flex: 1 },
  placeholderText: { color: COLORS.textMuted },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.xs, marginTop: 4, marginLeft: 4, fontWeight: '500' },
  dropdown: {
    position: 'absolute',
    top: 75,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    ...SHADOW.md,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
  },
  optionItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  optionItemSelected: { backgroundColor: COLORS.primaryUltraLight },
  optionText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '500' },
  optionTextSelected: { color: COLORS.primary, fontWeight: '700' },
});

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { dbService } from '../services/db';
import { Input } from './Input';
import { MapPin, ChevronDown } from 'lucide-react-native';

interface LocationAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
}) => {
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load locations on mount
  useEffect(() => {
    let active = true;
    const fetchLocs = async () => {
      try {
        const locs = await dbService.getLocations();
        if (active) setAllLocations(locs);
      } catch (err) {
        console.error('Failed to load locations:', err);
      }
    };
    fetchLocs();
    return () => {
      active = false;
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  const handleTextChange = (text: string) => {
    onChangeText(text);
    const matches = text.trim()
      ? allLocations.filter((loc) => loc.toLowerCase().includes(text.toLowerCase()))
      : allLocations;
    setFiltered(matches);
    setShowDropdown(true);
  };

  const handleFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    const matches = value.trim()
      ? allLocations.filter((loc) => loc.toLowerCase().includes(value.toLowerCase()))
      : allLocations;
    setFiltered(matches);
    setShowDropdown(true);
  };

  const handleSelect = (selectedLoc: string) => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    onChangeText(selectedLoc);
    setShowDropdown(false);
  };

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => setShowDropdown(false), 200);
  };

  const visibleItems = filtered.slice(0, 6); // cap to 6 so no scroll needed

  return (
    <View style={{ marginBottom: 16, zIndex: showDropdown ? 999 : 1, position: 'relative' }}>
      {/* Label */}
      <Text style={{ color: '#475569', fontWeight: '600', fontSize: 13, marginBottom: 6, marginLeft: 4 }}>
        {label}
      </Text>

      {/* Input row */}
      <Pressable
        onPress={handleFocus}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            borderWidth: 1.5,
            borderColor: error ? '#EF4444' : showDropdown ? '#F59E0B' : '#E2E8F0',
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 4,
          },
        ]}
      >
        <MapPin size={16} color={showDropdown ? '#F59E0B' : '#94A3B8'} style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Input
            label=""
            placeholder={placeholder}
            value={value}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              borderWidth: 0,
              backgroundColor: 'transparent',
              paddingHorizontal: 0,
              paddingVertical: 10,
              marginBottom: 0,
            }}
          />
        </View>
        <ChevronDown
          size={16}
          color="#94A3B8"
          style={{ transform: [{ rotate: showDropdown ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {error ? (
        <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4, fontWeight: '500' }}>
          {error}
        </Text>
      ) : null}

      {/* Dropdown — absolutely positioned, no scroll needed (capped at 6 items) */}
      {showDropdown && visibleItems.length > 0 && (
        <View
          style={{
            position: 'absolute',
            top: label ? 88 : 56,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderWidth: 1.5,
            borderColor: '#E2E8F0',
            borderRadius: 16,
            zIndex: 9999,
            // Shadow
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 12,
            overflow: 'hidden',
          }}
        >
          {visibleItems.map((item, index) => (
            <Pressable
              key={item}
              onPress={() => handleSelect(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 13,
                backgroundColor: pressed ? '#FFF7ED' : '#FFFFFF',
                borderBottomWidth: index < visibleItems.length - 1 ? 1 : 0,
                borderBottomColor: '#F1F5F9',
              })}
            >
              <MapPin size={15} color="#F59E0B" style={{ marginRight: 10 }} />
              <Text
                style={{
                  color: item === value ? '#F59E0B' : '#334155',
                  fontSize: 14,
                  fontWeight: item === value ? '700' : '500',
                  flex: 1,
                }}
              >
                {item}
              </Text>
              {item === value && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#F59E0B',
                  }}
                />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

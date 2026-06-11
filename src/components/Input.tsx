import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-slate-600 font-medium text-sm mb-1.5 ml-1">
        {label}
      </Text>
      <View
        className={`w-full bg-slate-50 border rounded-2xl px-4 py-3.5 flex-row items-center transition-all ${
          error
            ? 'border-red-500 bg-red-50/10'
            : isFocused
            ? 'border-amber-500 bg-white ring-1 ring-amber-500'
            : 'border-slate-200'
        }`}
      >
        <TextInput
          className="flex-1 text-slate-800 text-base font-normal p-0"
          placeholderTextColor="#94A3B8"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[{ outlineStyle: 'none' } as any, props.style]}
          {...props}
        />
      </View>
      {error && (
        <Text className="text-red-500 text-xs mt-1.5 ml-1.5 font-medium">
          {error}
        </Text>
      )}
    </View>
  );
};

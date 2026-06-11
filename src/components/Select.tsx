import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  options: Option[];
  selectedValue: string;
  onValueChange: (value: any) => void;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  selectedValue,
  onValueChange,
  error,
}) => {
  return (
    <View className="mb-4">
      <Text className="text-slate-600 font-medium text-sm mb-2 ml-1">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onValueChange(option.value)}
              className={`flex-1 min-w-[100px] border rounded-2xl py-3.5 px-3 flex-row justify-center items-center active:scale-[0.98] transition-all ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <Text
                className={`text-sm font-semibold text-center ${
                  isSelected ? 'text-amber-800' : 'text-slate-600'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error && (
        <Text className="text-red-500 text-xs mt-1.5 ml-1.5 font-medium">
          {error}
        </Text>
      )}
    </View>
  );
};

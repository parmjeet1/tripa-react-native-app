import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { COLORS, FONT_SIZE } from '../constants/theme';

interface StepProgressBarProps {
  currentStep: number;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep }) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepContainer}>
        <View style={[styles.node, currentStep >= 1 ? styles.nodeActive : styles.nodeInactive]}>
          {currentStep > 1 ? <Check size={18} color={COLORS.white} /> : <Text style={[styles.nodeText, currentStep === 1 ? styles.textActive : styles.textInactive]}>1</Text>}
        </View>
        <Text style={[styles.label, currentStep >= 1 ? styles.labelActive : styles.labelInactive]}>Driver</Text>
      </View>

      <View style={[styles.line, currentStep > 1 ? styles.lineActive : styles.lineInactive]} />

      <View style={styles.stepContainer}>
        <View style={[styles.node, currentStep >= 2 ? styles.nodeActive : styles.nodeInactive]}>
          {currentStep > 2 ? <Check size={18} color={COLORS.white} /> : <Text style={[styles.nodeText, currentStep === 2 ? styles.textActive : styles.textInactive]}>2</Text>}
        </View>
        <Text style={[styles.label, currentStep >= 2 ? styles.labelActive : styles.labelInactive]}>Route</Text>
      </View>

      <View style={[styles.line, currentStep > 2 ? styles.lineActive : styles.lineInactive]} />

      <View style={styles.stepContainer}>
        <View style={[styles.node, currentStep === 3 ? styles.nodeActive : styles.nodeInactive]}>
          <Text style={[styles.nodeText, currentStep === 3 ? styles.textActive : styles.textInactive]}>3</Text>
        </View>
        <Text style={[styles.label, currentStep === 3 ? styles.labelActive : styles.labelInactive]}>Schedule</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  node: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nodeInactive: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  nodeText: {
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  textActive: {
    color: COLORS.white,
  },
  textInactive: {
    color: COLORS.textMuted,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  labelActive: {
    color: COLORS.textPrimary,
  },
  labelInactive: {
    color: COLORS.textMuted,
  },
  line: {
    height: 2,
    flex: 1,
    marginHorizontal: -12,
    marginTop: -24,
  },
  lineActive: {
    backgroundColor: COLORS.primary,
  },
  lineInactive: {
    backgroundColor: COLORS.border,
  },
});

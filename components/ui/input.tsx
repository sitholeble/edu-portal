import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
  required?: boolean;
  containerStyle?: View['props']['style'];
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = true,
  variant = 'default',
  required,
  style,
  containerStyle,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          borderWidth: isFocused ? 2 : 1,
          borderColor: error ? '#dc3545' : isFocused ? '#0a7ea4' : textColor + '30',
          backgroundColor: backgroundColor,
        };
      case 'filled':
        return {
          borderWidth: 0,
          borderBottomWidth: isFocused ? 2 : 1,
          borderColor: error ? '#dc3545' : isFocused ? '#0a7ea4' : textColor + '20',
          backgroundColor: textColor + '08',
        };
      default:
        return {
          borderWidth: 1,
          borderColor: error ? '#dc3545' : isFocused ? '#0a7ea4' : textColor + '30',
          backgroundColor: backgroundColor,
        };
    }
  };

  return (
    <View style={[fullWidth && styles.container, containerStyle]}>
      {label && (
        <ThemedText style={styles.label}>
          {label}
          {required && <ThemedText style={styles.required}> *</ThemedText>}
        </ThemedText>
      )}
      <View style={styles.inputContainer}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            getVariantStyles(),
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            { color: textColor },
            style,
          ]}
          placeholderTextColor={textColor + '60'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {(error || helperText) && (
        <ThemedText style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {
    color: '#dc3545',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 40,
  },
  inputWithRightIcon: {
    paddingRight: 40,
  },
  leftIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  errorText: {
    color: '#dc3545',
    opacity: 1,
  },
});


import { StyleSheet, type ViewProps } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export function Card({ variant = 'default', padding = 'medium', style, children, ...props }: CardProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: backgroundColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        };
      case 'outlined':
        return {
          backgroundColor: backgroundColor,
          borderWidth: 1,
          borderColor: textColor + '20',
        };
      case 'flat':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {
          backgroundColor: backgroundColor,
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return {};
      case 'small':
        return { padding: 8 };
      case 'medium':
        return { padding: 16 };
      case 'large':
        return { padding: 24 };
      default:
        return {};
    }
  };

  return (
    <ThemedView
      style={[
        styles.card,
        getVariantStyles(),
        getPaddingStyles(),
        style,
      ]}
      {...props}
    >
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
  },
});


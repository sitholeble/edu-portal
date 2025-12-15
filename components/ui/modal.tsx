import { Modal as RNModal, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  footer,
  animationType = 'slide',
  transparent = true,
}: ModalProps) {
  const backgroundColor = useThemeColor({}, 'background');

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: '80%', maxWidth: 300 };
      case 'medium':
        return { width: '90%', maxWidth: 500 };
      case 'large':
        return { width: '95%', maxWidth: 700 };
      case 'fullscreen':
        return { width: '100%', height: '100%' };
      default:
        return {};
    }
  };

  return (
    <RNModal
      visible={visible}
      animationType={animationType}
      transparent={transparent}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <ThemedView
          style={[
            styles.modal,
            getSizeStyles(),
            size === 'fullscreen' && styles.fullscreen,
          ]}
        >
          {(title || showCloseButton) && (
            <View style={styles.header}>
              {title && (
                <ThemedText type="title" style={styles.title}>
                  {title}
                </ThemedText>
              )}
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <ThemedText style={styles.closeButtonText}>✕</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.content}>{children}</View>
          {footer && <View style={styles.footer}>{footer}</View>}
        </ThemedView>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  fullscreen: {
    borderRadius: 0,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    flex: 1,
    fontSize: 24,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    opacity: 0.5,
  },
  content: {
    padding: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});


import { useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Card } from './card';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: SelectOption[];
  selectedValues?: (string | number)[];
  onSelectionChange: (selectedValues: (string | number)[]) => void;
  placeholder?: string;
  label?: string;
  searchPlaceholder?: string;
  maxHeight?: number;
  disabled?: boolean;
  error?: string;
}

export function MultiSelect({
  options,
  selectedValues = [],
  onSelectionChange,
  placeholder = 'Select items...',
  label,
  searchPlaceholder = 'Search...',
  maxHeight = 300,
  disabled = false,
  error,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value)
  );

  const toggleSelection = (value: string | number) => {
    if (disabled) return;

    const isSelected = selectedValues.includes(value);
    if (isSelected) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const handleToggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (selectedValues.length === 1) {
      const selected = options.find((opt) => opt.value === selectedValues[0]);
      return selected?.label || placeholder;
    }
    return `${selectedValues.length} items selected`;
  };

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={styles.label}>
          {label}
        </ThemedText>
      )}

      <TouchableOpacity
        onPress={handleToggleDropdown}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Card
          variant="outlined"
          padding="medium"
          style={[
            styles.selectButton,
            isOpen && styles.selectButtonOpen,
            error && styles.selectButtonError,
            disabled && styles.selectButtonDisabled,
          ]}
        >
          <View style={styles.selectButtonContent}>
            <ThemedText
              style={[
                styles.selectButtonText,
                selectedValues.length === 0 && styles.placeholderText,
                disabled && styles.disabledText,
              ]}
            >
              {getDisplayText()}
            </ThemedText>
            <ThemedText style={styles.chevron}>{isOpen ? '▲' : '▼'}</ThemedText>
          </View>
        </Card>
      </TouchableOpacity>

      {error && (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      )}

      {isOpen && (
        <Card
          variant="elevated"
          padding="none"
          style={[styles.dropdown, { maxHeight, backgroundColor }]}
        >
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchInput,
                { color: textColor, backgroundColor: backgroundColor },
              ]}
              placeholder={searchPlaceholder}
              placeholderTextColor={textColor + '60'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          {/* Selected Count */}
          {selectedValues.length > 0 && (
            <View style={styles.selectedCountContainer}>
              <ThemedText style={styles.selectedCount}>
                {selectedValues.length} selected
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  onSelectionChange([]);
                  setSearchQuery('');
                }}
              >
                <ThemedText style={styles.clearAll}>Clear all</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Options List */}
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => String(item.value)}
            style={styles.list}
            nestedScrollEnabled
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No options found</ThemedText>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedValues.includes(item.value);
              const isDisabled = item.disabled || disabled;

              return (
                <TouchableOpacity
                  onPress={() => !isDisabled && toggleSelection(item.value)}
                  disabled={isDisabled}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                    isDisabled && styles.optionDisabled,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                        isDisabled && styles.checkboxDisabled,
                      ]}
                    >
                      {isSelected && (
                        <ThemedText style={styles.checkmark}>✓</ThemedText>
                      )}
                    </View>
                    <ThemedText
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                        isDisabled && styles.optionTextDisabled,
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  selectButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  selectButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectButtonError: {
    borderColor: '#dc3545',
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    flex: 1,
    fontSize: 16,
  },
  placeholderText: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.5,
  },
  chevron: {
    fontSize: 12,
    opacity: 0.6,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: -1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  selectedCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedCount: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  clearAll: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  list: {
    maxHeight: 200,
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionSelected: {
    backgroundColor: '#f0f7ff',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#0a7ea4',
  },
  optionTextDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
  },
});


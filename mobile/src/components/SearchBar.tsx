import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../styles/theme';

interface SearchBarProps extends Omit<TextInputProps, 'onChange'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFiltersPress?: () => void;
  showFiltersButton?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search recipes...',
  onFiltersPress,
  showFiltersButton = false,
  ...inputProps
}) => (
  <View style={styles.container}>
    <Feather name="search" size={20} color={colors.text.secondary} style={styles.icon} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.text.tertiary}
      style={styles.input}
      returnKeyType="search"
      {...inputProps}
    />
    {showFiltersButton && (
      <TouchableOpacity style={styles.filterButton} onPress={onFiltersPress} accessibilityLabel="Filter results">
        <Feather name="sliders" size={18} color={colors.text.inverse} />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glass.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  filterButton: {
    backgroundColor: colors.olive,
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
});

export default SearchBar;




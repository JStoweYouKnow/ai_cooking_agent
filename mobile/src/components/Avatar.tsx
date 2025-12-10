import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, borderRadius, typography } from '../styles/theme';

interface AvatarProps {
  name: string;
  size?: number;
  imageUrl?: string;
  style?: ViewStyle;
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 48, imageUrl, style }) => {
  const [hasImageError, setHasImageError] = useState(false);

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  if (imageUrl && !hasImageError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.avatar(size), style]}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <View style={[styles.avatar(size), styles.fallback, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials || '?'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: (size: number) => ({
    width: size,
    height: size,
    borderRadius: borderRadius.full,
  }),
  fallback: {
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold as any,
  },
});

export default Avatar;




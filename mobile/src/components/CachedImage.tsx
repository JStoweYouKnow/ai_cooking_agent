/**
 * Cached Image Component
 * Uses expo-image with filesystem-backed offline cache for recipe images.
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Image, ImageContentFit } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, borderRadius } from "../styles/theme";
import { getImageUriForDisplay, cacheImageAfterLoad } from "../utils/imageUrl";

// Blurhash placeholder for loading state
const DEFAULT_BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

interface CachedImageProps {
  /** Image source URI */
  uri: string | null | undefined;
  /** Image width */
  width?: number | string;
  /** Image height */
  height?: number | string;
  /** Border radius */
  borderRadiusValue?: number;
  /** Content fit mode */
  contentFit?: ImageContentFit;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  /** Placeholder icon name when no image */
  placeholderIcon?: keyof typeof Ionicons.glyphMap;
  /** Placeholder icon size */
  placeholderIconSize?: number;
  /** Placeholder icon color */
  placeholderIconColor?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Enable blur effect while loading */
  enableBlurHash?: boolean;
  /** Custom blurhash string */
  blurhash?: string;
  /** Transition duration in ms */
  transitionDuration?: number;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
}

const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  width = "100%",
  height = 200,
  borderRadiusValue = borderRadius.md,
  contentFit = "cover",
  style,
  placeholderIcon = "image-outline",
  placeholderIconSize = 48,
  placeholderIconColor = colors.text.tertiary,
  accessibilityLabel,
  enableBlurHash = true,
  blurhash = DEFAULT_BLURHASH,
  transitionDuration = 300,
  onLoad,
  onError,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayUri, setDisplayUri] = useState<string | null>(uri ?? null);

  useEffect(() => {
    if (!uri) {
      setDisplayUri(null);
      return;
    }
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      getImageUriForDisplay(uri).then((u) => setDisplayUri(u ?? uri));
    } else {
      setDisplayUri(uri);
    }
  }, [uri]);

  const handleLoad = () => {
    if (uri && (uri.startsWith("http://") || uri.startsWith("https://"))) {
      cacheImageAfterLoad(uri);
    }
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const effectiveUri = displayUri ?? uri;

  if (!effectiveUri || hasError) {
    return (
      <View
        style={[
          styles.placeholder,
          {
            width,
            height,
            borderRadius: borderRadiusValue,
          },
          style,
        ]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel || "No image available"}
      >
        <Ionicons name={placeholderIcon} size={placeholderIconSize} color={placeholderIconColor} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: effectiveUri }}
      style={[
        {
          width,
          height,
          borderRadius: borderRadiusValue,
        },
        style,
      ]}
      contentFit={contentFit}
      placeholder={enableBlurHash ? { blurhash } : undefined}
      transition={transitionDuration}
      cachePolicy="memory-disk"
      onLoad={handleLoad}
      onError={handleError}
      accessibilityLabel={accessibilityLabel}
    />
  );
};

/**
 * Avatar variant with circular shape
 */
export const CachedAvatar: React.FC<
  Omit<CachedImageProps, "borderRadiusValue"> & { size?: number }
> = ({ size = 48, ...props }) => (
  <CachedImage
    {...props}
    width={size}
    height={size}
    borderRadiusValue={size / 2}
    placeholderIcon="person-circle-outline"
    contentFit="cover"
  />
);

/**
 * Recipe card image with standard dimensions
 */
export const RecipeCardImage: React.FC<
  Omit<CachedImageProps, "width" | "height" | "placeholderIcon">
> = (props) => (
  <CachedImage
    {...props}
    width="100%"
    height={150}
    placeholderIcon="restaurant-outline"
    borderRadiusValue={borderRadius.md}
  />
);

/**
 * Recipe detail hero image
 */
export const RecipeHeroImage: React.FC<
  Omit<CachedImageProps, "width" | "height" | "placeholderIcon">
> = (props) => (
  <CachedImage
    {...props}
    width="100%"
    height={250}
    placeholderIcon="restaurant-outline"
    borderRadiusValue={0}
  />
);

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CachedImage;

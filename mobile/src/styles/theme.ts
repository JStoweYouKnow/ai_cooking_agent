// Design system matching web app
export const colors = {
  // Primary palette
  navy: '#1E2A38',
  olive: '#77856A',
  tan: '#D4C3A9',
  russet: '#854D3D',
  cream: '#FAF8F4',

  // Semantic colors
  primary: '#77856A',
  secondary: '#854D3D',
  background: '#FAF8F4',
  surface: '#FFFFFF',

  // Text
  text: {
    primary: '#1E2A38',
    secondary: '#666666',
    tertiary: '#999999',
    inverse: '#FFFFFF',
  },

  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // UI elements
  border: '#E0E0E0',
  divider: '#F0F0F0',
  shadow: 'rgba(0, 0, 0, 0.1)',

  // Glassmorphism
  glass: {
    background: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(255, 255, 255, 0.18)',
    shadow: 'rgba(31, 38, 135, 0.37)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glass: {
    shadowColor: 'rgba(31, 38, 135, 0.37)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 10,
  },
  premium: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const animations = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    default: 'ease-in-out',
    spring: 'spring',
  },
};

export const gradients = {
  primary: ['#77856A', '#5F6D56'],
  secondary: ['#854D3D', '#6B3E31'],
  olive: ['#77856A', '#8B9A7E'],
  premium: ['#1E2A38', '#2A3A4A'],
  accent: ['#D4C3A9', '#C4B399'],
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  animations,
  gradients,
};

export type Theme = typeof theme;

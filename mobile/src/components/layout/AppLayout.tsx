import React from "react";
import { StyleSheet, View, ScrollView, ViewStyle, StyleProp, ScrollViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../styles/theme";

interface AppLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  scrollProps,
}) => {
  const Wrapper = scrollable ? ScrollView : View;

  const wrapperStyle = scrollable ? [styles.scrollWrapper, style] : [styles.content, style];
  const wrapperProps = scrollable
    ? {
        contentContainerStyle: [styles.scrollContent, contentContainerStyle],
        ...scrollProps,
      }
    : {};

  return (
    <LinearGradient colors={[colors.cream, "#FFFFFF"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <Wrapper style={wrapperStyle} {...wrapperProps}>
          {children}
        </Wrapper>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
});

export default AppLayout;


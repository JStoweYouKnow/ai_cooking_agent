import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * Simple test component to verify React Native rendering works
 * This should always render if React Native is functioning
 */
export const RenderTest: React.FC = () => {
  console.log("[RenderTest] Component rendering - React Native is working!");
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>React Native Render Test</Text>
      <Text style={styles.subtext}>If you see this, React Native is working</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F0",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6B8E23",
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: "#666",
  },
});

export default RenderTest;


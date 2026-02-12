import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { isDemoMode } from "../constants/demo";

const DemoBanner: React.FC = () => {
  if (!isDemoMode()) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Demo Mode — All features unlocked</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#6B8E23",
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  text: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default DemoBanner;

/**
 * AR Cooking Assistant Component
 * Real-time ingredient recognition overlay for cooking assistance
 * Note: Full AR requires native modules. This is a simplified version using camera overlay.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import GlassCard from "./GlassCard";
import GradientButton from "./GradientButton";
import { colors, spacing, typography, borderRadius, shadows } from "../styles/theme";
import { trpc } from "../api/trpc";
import { mediumImpact, successNotification } from "../utils/haptics";

interface ARCookingAssistantProps {
  recipeId: number;
  ingredients: Array<{ name: string; quantity?: string; unit?: string }>;
  visible: boolean;
  onClose: () => void;
}

interface RecognizedIngredient {
  name: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

const ARCookingAssistant: React.FC<ARCookingAssistantProps> = ({
  recipeId,
  ingredients,
  visible,
  onClose,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [recognizedIngredients, setRecognizedIngredients] = useState<RecognizedIngredient[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const recognizeMutation = trpc.ingredients.recognizeFromImage.useMutation({
    onSuccess: (data) => {
      setRecognizedIngredients(
        data.map((ing: any) => ({
          name: ing.name,
          confidence: 0.8, // Mock confidence
        }))
      );
      setIsScanning(false);
      successNotification();
    },
    onError: () => {
      setIsScanning(false);
    },
  });

  useEffect(() => {
    if (!permission?.granted && visible) {
      requestPermission();
    }
  }, [visible, permission]);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    setIsScanning(true);
    try {
      // In a real implementation, you would capture the frame
      // For now, we'll use a placeholder
      // This would require expo-camera's takePictureAsync or similar
      Alert.alert(
        "AR Recognition",
        "Full AR recognition requires native camera access. This is a simplified version."
      );
      setIsScanning(false);
    } catch (error) {
      console.error("[ARCookingAssistant] Capture error:", error);
      setIsScanning(false);
    }
  };

  const checkIngredient = (ingredientName: string): boolean => {
    return recognizedIngredients.some(
      (rec) => rec.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
               ingredientName.toLowerCase().includes(rec.name.toLowerCase())
    );
  };

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.permissionCard}>
            <Ionicons name="camera-outline" size={64} color={colors.olive} />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              AR Cooking Assistant needs camera access to recognize ingredients in real-time.
            </Text>
            <GradientButton
              title="Grant Permission"
              onPress={requestPermission}
              style={styles.permissionButton}
            />
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Camera View */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          {/* Overlay */}
          <View style={styles.overlay}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={colors.text.inverse} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>AR Cooking Assistant</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Ingredient Checklist Overlay */}
            <View style={styles.checklistOverlay}>
              <Text style={styles.checklistTitle}>Ingredients Needed</Text>
              <View style={styles.checklist}>
                {ingredients.map((ing, index) => {
                  const hasIngredient = checkIngredient(ing.name);
                  return (
                    <View
                      key={index}
                      style={[
                        styles.checklistItem,
                        hasIngredient && styles.checklistItemFound,
                      ]}
                    >
                      <Ionicons
                        name={hasIngredient ? "checkmark-circle" : "ellipse-outline"}
                        size={20}
                        color={hasIngredient ? colors.success : colors.text.inverse}
                      />
                      <Text
                        style={[
                          styles.checklistText,
                          hasIngredient && styles.checklistTextFound,
                        ]}
                      >
                        {ing.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Capture Button */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
                disabled={isScanning}
              >
                {isScanning ? (
                  <ActivityIndicator size="large" color={colors.text.inverse} />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
              <Text style={styles.captureHint}>
                Tap to scan ingredients
              </Text>
            </View>
          </View>
        </CameraView>

        {/* Recognition Results */}
        {recognizedIngredients.length > 0 && (
          <View style={styles.resultsPanel}>
            <Text style={styles.resultsTitle}>Recognized Ingredients</Text>
            <View style={styles.resultsList}>
              {recognizedIngredients.map((ing, index) => (
                <View key={index} style={styles.resultItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.resultText}>{ing.name}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setRecognizedIngredients([])}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    paddingTop: spacing.xl,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  placeholder: {
    width: 44,
  },
  checklistOverlay: {
    position: "absolute",
    top: 100,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    maxHeight: 300,
  },
  checklistTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginBottom: spacing.sm,
  },
  checklist: {
    gap: spacing.xs,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checklistItemFound: {
    opacity: 0.6,
  },
  checklistText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse,
  },
  checklistTextFound: {
    textDecorationLine: "line-through",
    color: colors.success,
  },
  controls: {
    position: "absolute",
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.text.inverse,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: colors.olive,
    ...shadows.large,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.olive,
  },
  captureHint: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse,
    textAlign: "center",
  },
  resultsPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: 300,
  },
  resultsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  resultsList: {
    gap: spacing.sm,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  resultText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  clearButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  permissionCard: {
    padding: spacing.xl,
    alignItems: "center",
    maxWidth: 400,
  },
  permissionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.md,
  },
  permissionButton: {
    width: "100%",
    marginBottom: spacing.md,
  },
  cancelButton: {
    padding: spacing.md,
  },
  cancelText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default ARCookingAssistant;

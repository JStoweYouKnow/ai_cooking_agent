/**
 * Photo Journal Component
 * "I Made This!" - capture and display cooking memories
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "./GlassCard";
import GradientButton from "./GradientButton";
import { colors, spacing, typography, borderRadius, shadows, gradients } from "../styles/theme";
import { mediumImpact, successNotification } from "../utils/haptics";

interface RecipePhoto {
  id: number;
  recipeId: number;
  imageUrl: string;
  caption?: string | null;
  rating?: number | null;
  notes?: string | null;
  cookedAt: string;
}

interface PhotoJournalProps {
  recipeId: number;
  recipeName: string;
  photos: RecipePhoto[];
  onAddPhoto: (photo: { imageUri: string; caption?: string; rating?: number; notes?: string }) => Promise<void>;
  onDeletePhoto?: (photoId: number) => Promise<void>;
  isLoading?: boolean;
}

const PhotoJournal: React.FC<PhotoJournalProps> = ({
  recipeId,
  recipeName,
  photos,
  onAddPhoto,
  onDeletePhoto,
  isLoading = false,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<RecipePhoto | null>(null);

  const pickImage = async (useCamera: boolean) => {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Camera access is needed to take photos of your cooking."
          );
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Photo library access is needed to select images."
          );
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        await mediumImpact();
        setSelectedImage(result.assets[0].uri);
        setShowAddModal(true);
      }
    } catch (error) {
      console.error("[PhotoJournal] Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleShowImagePicker = () => {
    Alert.alert(
      "Add Photo",
      "How would you like to add a photo?",
      [
        { text: "Take Photo", onPress: () => pickImage(true) },
        { text: "Choose from Library", onPress: () => pickImage(false) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleSubmitPhoto = async () => {
    if (!selectedImage) return;

    setIsSubmitting(true);
    try {
      await onAddPhoto({
        imageUri: selectedImage,
        caption: caption.trim() || undefined,
        rating: rating > 0 ? rating : undefined,
        notes: notes.trim() || undefined,
      });
      await successNotification();
      resetForm();
    } catch (error) {
      console.error("[PhotoJournal] Error adding photo:", error);
      Alert.alert("Error", "Failed to save photo. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowAddModal(false);
    setSelectedImage(null);
    setCaption("");
    setRating(0);
    setNotes("");
  };

  const handleDeletePhoto = (photo: RecipePhoto) => {
    if (!onDeletePhoto) return;

    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await onDeletePhoto(photo.id);
            } catch (error) {
              Alert.alert("Error", "Failed to delete photo.");
            }
          },
        },
      ]
    );
  };

  const renderRatingStars = (
    currentRating: number,
    onSelect?: (rating: number) => void,
    size: number = 24
  ) => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onSelect?.(star)}
            disabled={!onSelect}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Ionicons
              name={star <= currentRating ? "star" : "star-outline"}
              size={size}
              color={star <= currentRating ? "#FFD700" : colors.text.tertiary}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPhoto = useCallback(
    ({ item }: { item: RecipePhoto }) => (
      <TouchableOpacity
        style={styles.photoItem}
        onPress={() => setViewingPhoto(item)}
        onLongPress={() => handleDeletePhoto(item)}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.photoImage} />
        {item.rating && (
          <View style={styles.photoRating}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.photoRatingText}>{item.rating}</Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [onDeletePhoto]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>I Made This!</Text>
          <Text style={styles.subtitle}>
            {photos.length === 0
              ? "Capture your cooking memories"
              : `${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleShowImagePicker}
        >
          <LinearGradient
            colors={gradients.primary}
            style={styles.addButtonGradient}
          >
            <Ionicons name="camera" size={20} color={colors.text.inverse} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {photos.length > 0 ? (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoList}
        />
      ) : (
        <TouchableOpacity
          style={styles.emptyState}
          onPress={handleShowImagePicker}
        >
          <Ionicons name="images-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>
            Tap to add your first photo
          </Text>
        </TouchableOpacity>
      )}

      {/* Add Photo Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Photo</Text>
              <TouchableOpacity onPress={resetForm}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                />
              )}

              <Text style={styles.inputLabel}>Rate your creation</Text>
              {renderRatingStars(rating, setRating, 32)}

              <Text style={styles.inputLabel}>Caption</Text>
              <TextInput
                style={styles.input}
                placeholder="How did it turn out?"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={200}
              />

              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Any adjustments you made or tips for next time..."
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={500}
              />

              <GradientButton
                title={isSubmitting ? "Saving..." : "Save Photo"}
                onPress={handleSubmitPhoto}
                disabled={!selectedImage || isSubmitting}
                style={styles.saveButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* View Photo Modal */}
      <Modal
        visible={!!viewingPhoto}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setViewingPhoto(null)}
      >
        <TouchableOpacity
          style={styles.viewModalOverlay}
          activeOpacity={1}
          onPress={() => setViewingPhoto(null)}
        >
          <View style={styles.viewModalContent}>
            {viewingPhoto && (
              <>
                <Image
                  source={{ uri: viewingPhoto.imageUrl }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
                <View style={styles.viewModalInfo}>
                  {viewingPhoto.rating &&
                    renderRatingStars(viewingPhoto.rating, undefined, 20)}
                  {viewingPhoto.caption && (
                    <Text style={styles.viewModalCaption}>
                      {viewingPhoto.caption}
                    </Text>
                  )}
                  <Text style={styles.viewModalDate}>
                    {formatDate(viewingPhoto.cookedAt)}
                  </Text>
                  {viewingPhoto.notes && (
                    <Text style={styles.viewModalNotes}>
                      {viewingPhoto.notes}
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  addButton: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...shadows.small,
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  photoList: {
    paddingVertical: spacing.xs,
  },
  photoItem: {
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    ...shadows.small,
  },
  photoImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
  },
  photoRating: {
    position: "absolute",
    bottom: spacing.xs,
    right: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  photoRatingText: {
    color: "#FFD700",
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    backgroundColor: colors.divider,
    borderRadius: borderRadius.md,
  },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.divider,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    minHeight: 48,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  viewModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewModalContent: {
    width: "100%",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "60%",
  },
  viewModalInfo: {
    padding: spacing.lg,
    alignItems: "center",
  },
  viewModalCaption: {
    fontSize: typography.fontSize.lg,
    color: colors.text.inverse,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  viewModalDate: {
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.6)",
    marginTop: spacing.xs,
  },
  viewModalNotes: {
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: spacing.md,
    fontStyle: "italic",
  },
});

export default PhotoJournal;

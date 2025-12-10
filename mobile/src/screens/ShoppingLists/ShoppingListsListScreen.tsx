import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ShoppingListStackScreenProps } from "../../navigation/types";
import { trpc } from "../../api/trpc";
import GlassCard from "../../components/GlassCard";
import SearchBar from "../../components/SearchBar";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";

type Props = ShoppingListStackScreenProps<"ShoppingListsList">;

const ShoppingListsListScreen: React.FC<Props> = ({ navigation }) => {
  // @ts-ignore - tRPC types are complex, runtime works correctly
  const utils = trpc.useUtils();
  // @ts-ignore - tRPC types are complex, runtime works correctly
  const { data: shoppingLists, isLoading } = trpc.shoppingLists.list.useQuery();
  // @ts-ignore - tRPC types are complex, runtime works correctly
  const deleteList = trpc.shoppingLists.delete.useMutation({
    onSuccess: () => utils.shoppingLists.list.invalidate(),
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredLists = useMemo(() => {
    if (!shoppingLists || !searchQuery.trim()) return shoppingLists || [];
    return shoppingLists.filter((list: any) =>
      list.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [shoppingLists, searchQuery]);

  const handleDelete = (id: number, name: string) => {
    Alert.alert("Delete List", `Delete "${name}"? This removes all items.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteList.mutate({ id }),
      },
    ]);
  };

  const renderListCard = ({ item }: { item: any }) => (
    <GlassCard style={styles.listCard}>
      <TouchableOpacity onPress={() => navigation.navigate("ShoppingListDetail", { id: item.id })}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <Ionicons name="cart" size={20} color={colors.olive} />
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
            <Ionicons name="trash-outline" size={20} color={colors.russet} />
          </TouchableOpacity>
        </View>
        <Text style={styles.listName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.listDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : (
          <Text style={styles.listDescriptionMuted}>No description</Text>
        )}
      </TouchableOpacity>
    </GlassCard>
  );

  const renderSkeletons = () => (
    <View style={styles.skeletonWrapper}>
      {Array.from({ length: 3 }).map((_, idx) => (
        <GlassCard key={idx} style={styles.listCard}>
          <LoadingSkeleton height={18} width="60%" />
          <LoadingSkeleton height={14} width="40%" />
        </GlassCard>
      ))}
    </View>
  );

  return (
    <AppLayout style={styles.screen}>
      <View style={styles.body}>
        <ScreenHeader
          title="Shopping Lists"
          subtitle={shoppingLists ? `${shoppingLists.length} lists` : "Keeping your pantry stocked"}
          actionLabel="New List"
          onActionPress={() => navigation.navigate("CreateShoppingList")}
          showSearch
        />

        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search lists..." />

        {isLoading ? (
          renderSkeletons()
        ) : filteredLists.length > 0 ? (
          <FlatList
            data={filteredLists}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderListCard}
            contentContainerStyle={styles.listContentContainer}
          />
        ) : (
          <EmptyState
            title="No shopping lists"
            description="Create a list for your next grocery run."
            primaryActionLabel="Create List"
            onPrimaryAction={() => navigation.navigate("CreateShoppingList")}
          />
        )}
      </View>

      {deleteList.isPending && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.deletingText}>Deleting list...</Text>
        </View>
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  skeletonWrapper: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  listContentContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  listCard: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
  },
  listName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  listDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
  },
  listDescriptionMuted: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
    marginTop: 4,
  },
  deletingOverlay: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  deletingText: {
    color: "#fff",
  },
});

export default ShoppingListsListScreen;

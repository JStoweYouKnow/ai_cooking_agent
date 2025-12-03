import { boolean, index, integer, pgEnum, pgTable, text, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";

/**
 * Postgres schema for ai_cooking_agent
 * This mirrors the MySQL schema but uses Postgres-specific types
 */

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 255 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  dietaryPreferences: text("dietaryPreferences"),
  allergies: text("allergies"),
  goals: text("goals"),
  calorieBudget: integer("calorieBudget"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  openIdIdx: index("users_openId_idx").on(table.openId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const recipes = pgTable("recipes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  externalId: varchar("externalId", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  imageUrl: text("imageUrl"),
  cuisine: varchar("cuisine", { length: 100 }),
  category: varchar("category", { length: 100 }),
  cookingTime: integer("cookingTime"),
  servings: integer("servings"),
  caloriesPerServing: integer("caloriesPerServing"),
  sourceUrl: text("sourceUrl"),
  source: varchar("source", { length: 100 }).default("user_import"),
  isFavorite: boolean("isFavorite").default(false),
  isShared: boolean("isShared").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  // Additional columns for imported recipes
  recipe_id: text("recipe_id"),
  yield_text: text("yield_text"),
  prep_time_minutes: integer("prep_time_minutes"),
  cook_time_minutes: integer("cook_time_minutes"),
  tags: text("tags").array(),
  categories: text("categories").array(),
  nutrition: jsonb("nutrition"),
  ingredients: jsonb("ingredients"),
  steps: jsonb("steps"),
  html: text("html"),
}, (table) => ({
  userIdIdx: index("recipes_userId_idx").on(table.userId),
  externalIdIdx: index("recipes_externalId_idx").on(table.externalId),
  cuisineIdx: index("recipes_cuisine_idx").on(table.cuisine),
  categoryIdx: index("recipes_category_idx").on(table.category),
  isFavoriteIdx: index("recipes_isFavorite_idx").on(table.isFavorite),
}));

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

export const ingredients = pgTable("ingredients", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 100 }),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("ingredients_name_idx").on(table.name),
}));

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = typeof ingredients.$inferInsert;

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  recipeId: integer("recipeId").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredientId").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: varchar("quantity", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  recipeIdIdx: index("recipe_ingredients_recipeId_idx").on(table.recipeId),
  ingredientIdIdx: index("recipe_ingredients_ingredientId_idx").on(table.ingredientId),
}));

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = typeof recipeIngredients.$inferInsert;

export const userIngredients = pgTable("user_ingredients", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredientId").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: varchar("quantity", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_ingredients_userId_idx").on(table.userId),
  ingredientIdIdx: index("user_ingredients_ingredientId_idx").on(table.ingredientId),
}));

export type UserIngredient = typeof userIngredients.$inferSelect;
export type InsertUserIngredient = typeof userIngredients.$inferInsert;

export const shoppingLists = pgTable("shopping_lists", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("shopping_lists_userId_idx").on(table.userId),
}));

export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingList = typeof shoppingLists.$inferInsert;

export const shoppingListItems = pgTable("shopping_list_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  shoppingListId: integer("shoppingListId").notNull().references(() => shoppingLists.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredientId").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: varchar("quantity", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  isChecked: boolean("isChecked").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  shoppingListIdIdx: index("shopping_list_items_shoppingListId_idx").on(table.shoppingListId),
  ingredientIdIdx: index("shopping_list_items_ingredientId_idx").on(table.ingredientId),
}));

export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type InsertShoppingListItem = typeof shoppingListItems.$inferInsert;

export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  isRead: boolean("isRead").default(false),
  actionUrl: text("actionUrl"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notifications_userId_idx").on(table.userId),
  isReadIdx: index("notifications_isRead_idx").on(table.isRead),
  createdAtIdx: index("notifications_createdAt_idx").on(table.createdAt),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const pushTokens = pgTable("push_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index("push_tokens_token_idx").on(table.token),
  userIdx: index("push_tokens_user_idx").on(table.userId),
}));

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user1Id: integer("user1Id").notNull().references(() => users.id, { onDelete: "cascade" }),
  user2Id: integer("user2Id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  user1IdIdx: index("conversations_user1Id_idx").on(table.user1Id),
  user2IdIdx: index("conversations_user2Id_idx").on(table.user2Id),
  lastMessageAtIdx: index("conversations_lastMessageAt_idx").on(table.lastMessageAt),
}));

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: integer("senderId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index("messages_conversationId_idx").on(table.conversationId),
  senderIdIdx: index("messages_senderId_idx").on(table.senderId),
  createdAtIdx: index("messages_createdAt_idx").on(table.createdAt),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// Stripe subscription and payment tables
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "trialing",
  "unpaid",
  "paused",
]);

export const subscriptions = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull().unique(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).unique(),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  status: subscriptionStatusEnum("status").notNull().default("incomplete"),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  canceledAt: timestamp("canceledAt"),
  trialStart: timestamp("trialStart"),
  trialEnd: timestamp("trialEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("subscriptions_userId_idx").on(table.userId),
  stripeCustomerIdIdx: index("subscriptions_stripeCustomerId_idx").on(table.stripeCustomerId),
  stripeSubscriptionIdIdx: index("subscriptions_stripeSubscriptionId_idx").on(table.stripeSubscriptionId),
  statusIdx: index("subscriptions_status_idx").on(table.status),
}));

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  stripeChargeId: varchar("stripeChargeId", { length: 255 }),
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // succeeded, pending, failed, etc.
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("payments_userId_idx").on(table.userId),
  stripePaymentIntentIdIdx: index("payments_stripePaymentIntentId_idx").on(table.stripePaymentIntentId),
  statusIdx: index("payments_status_idx").on(table.status),
  createdAtIdx: index("payments_createdAt_idx").on(table.createdAt),
}));

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

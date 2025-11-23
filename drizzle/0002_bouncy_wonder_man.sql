CREATE INDEX `recipe_ingredients_recipeId_idx` ON `recipe_ingredients` (`recipeId`);--> statement-breakpoint
CREATE INDEX `recipe_ingredients_ingredientId_idx` ON `recipe_ingredients` (`ingredientId`);--> statement-breakpoint
CREATE INDEX `recipes_userId_idx` ON `recipes` (`userId`);--> statement-breakpoint
CREATE INDEX `recipes_externalId_idx` ON `recipes` (`externalId`);--> statement-breakpoint
CREATE INDEX `recipes_cuisine_idx` ON `recipes` (`cuisine`);--> statement-breakpoint
CREATE INDEX `recipes_category_idx` ON `recipes` (`category`);--> statement-breakpoint
CREATE INDEX `recipes_isFavorite_idx` ON `recipes` (`isFavorite`);--> statement-breakpoint
CREATE INDEX `shopping_list_items_shoppingListId_idx` ON `shopping_list_items` (`shoppingListId`);--> statement-breakpoint
CREATE INDEX `shopping_list_items_ingredientId_idx` ON `shopping_list_items` (`ingredientId`);--> statement-breakpoint
CREATE INDEX `shopping_lists_userId_idx` ON `shopping_lists` (`userId`);--> statement-breakpoint
CREATE INDEX `user_ingredients_userId_idx` ON `user_ingredients` (`userId`);--> statement-breakpoint
CREATE INDEX `user_ingredients_ingredientId_idx` ON `user_ingredients` (`ingredientId`);
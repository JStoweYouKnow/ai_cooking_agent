CREATE INDEX `recipeId_idx` ON `recipe_ingredients` (`recipeId`);--> statement-breakpoint
CREATE INDEX `ingredientId_idx` ON `recipe_ingredients` (`ingredientId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `recipes` (`userId`);--> statement-breakpoint
CREATE INDEX `externalId_idx` ON `recipes` (`externalId`);--> statement-breakpoint
CREATE INDEX `cuisine_idx` ON `recipes` (`cuisine`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `recipes` (`category`);--> statement-breakpoint
CREATE INDEX `isFavorite_idx` ON `recipes` (`isFavorite`);--> statement-breakpoint
CREATE INDEX `shoppingListItems_shoppingListId_idx` ON `shopping_list_items` (`shoppingListId`);--> statement-breakpoint
CREATE INDEX `shoppingListItems_ingredientId_idx` ON `shopping_list_items` (`ingredientId`);--> statement-breakpoint
CREATE INDEX `shoppingLists_userId_idx` ON `shopping_lists` (`userId`);--> statement-breakpoint
CREATE INDEX `userIngredients_userId_idx` ON `user_ingredients` (`userId`);--> statement-breakpoint
CREATE INDEX `userIngredients_ingredientId_idx` ON `user_ingredients` (`ingredientId`);
CREATE TABLE `ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`),
	CONSTRAINT `ingredients_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipeId` int NOT NULL,
	`ingredientId` int NOT NULL,
	`quantity` varchar(100),
	`unit` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recipe_ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`externalId` varchar(255),
	`name` varchar(255) NOT NULL,
	`description` text,
	`instructions` text,
	`imageUrl` text,
	`cuisine` varchar(100),
	`category` varchar(100),
	`cookingTime` int,
	`servings` int,
	`sourceUrl` text,
	`source` varchar(100) DEFAULT 'user_import',
	`isFavorite` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shopping_list_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shoppingListId` int NOT NULL,
	`ingredientId` int NOT NULL,
	`quantity` varchar(100),
	`unit` varchar(50),
	`isChecked` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shopping_list_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shopping_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopping_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ingredientId` int NOT NULL,
	`quantity` varchar(100),
	`unit` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `recipe_ingredients` ADD CONSTRAINT `recipe_ingredients_recipeId_recipes_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `recipes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipe_ingredients` ADD CONSTRAINT `recipe_ingredients_ingredientId_ingredients_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shopping_list_items` ADD CONSTRAINT `shopping_list_items_shoppingListId_shopping_lists_id_fk` FOREIGN KEY (`shoppingListId`) REFERENCES `shopping_lists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shopping_list_items` ADD CONSTRAINT `shopping_list_items_ingredientId_ingredients_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shopping_lists` ADD CONSTRAINT `shopping_lists_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_ingredients` ADD CONSTRAINT `user_ingredients_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_ingredients` ADD CONSTRAINT `user_ingredients_ingredientId_ingredients_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE cascade ON UPDATE no action;
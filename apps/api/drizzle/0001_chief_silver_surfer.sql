PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_player` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`equipped_skin_id` text DEFAULT 'gray-wolf' NOT NULL,
	`total_score` integer DEFAULT 0 NOT NULL,
	`total_distance` real DEFAULT 0 NOT NULL,
	`total_obstacles_cleared` integer DEFAULT 0 NOT NULL,
	`games_played` integer DEFAULT 0 NOT NULL,
	`races_played` integer DEFAULT 0 NOT NULL,
	`races_won` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_player`("id", "user_id", "equipped_skin_id", "total_score", "total_distance", "total_obstacles_cleared", "games_played", "races_played", "races_won", "created_at", "updated_at") SELECT "id", "user_id", "equipped_skin_id", "total_score", "total_distance", "total_obstacles_cleared", "games_played", "races_played", "races_won", "created_at", "updated_at" FROM `player`;--> statement-breakpoint
DROP TABLE `player`;--> statement-breakpoint
ALTER TABLE `__new_player` RENAME TO `player`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `player_user_id_unique` ON `player` (`user_id`);--> statement-breakpoint
ALTER TABLE `score` ADD `duration` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `score_player_id_idx` ON `score` (`player_id`);--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'user' NOT NULL CHECK(`role` IN ('user', 'admin', 'dev'));--> statement-breakpoint
ALTER TABLE `user` ADD `banned` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `ban_reason` text;--> statement-breakpoint
ALTER TABLE `user` ADD `ban_expires` integer;--> statement-breakpoint
CREATE INDEX `race_history_player_id_idx` ON `race_history` (`player_id`);
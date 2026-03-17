ALTER TABLE `player` ADD `profile_public` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `race_history` ADD `cheated` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `score` ADD `cheated` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `deletion_requested_at` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `deletion_scheduled_for` integer;
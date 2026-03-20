ALTER TABLE `race_history` ADD `mods` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `score` ADD `mods` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `score_mods_idx` ON `score` (`mods`);

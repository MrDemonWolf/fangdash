ALTER TABLE `score` ADD `difficulty` text DEFAULT 'easy' NOT NULL;--> statement-breakpoint
CREATE INDEX `score_difficulty_idx` ON `score` (`difficulty`);
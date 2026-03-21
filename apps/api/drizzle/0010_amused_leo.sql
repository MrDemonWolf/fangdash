CREATE INDEX `race_history_race_id_idx` ON `race_history` (`race_id`);--> statement-breakpoint
CREATE INDEX `race_history_created_at_idx` ON `race_history` (`created_at`);--> statement-breakpoint
CREATE INDEX `score_cheated_idx` ON `score` (`cheated`);--> statement-breakpoint
CREATE INDEX `score_leaderboard_idx` ON `score` (`player_id`,`cheated`,`difficulty`);
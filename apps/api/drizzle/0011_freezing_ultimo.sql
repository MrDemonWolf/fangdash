-- Dedupe existing rows before adding unique constraints: keep the best (highest
-- score, earliest) per (player_id, seed), and the earliest result per (race_id, player_id).
DELETE FROM `score` WHERE `id` IN (
	SELECT `id` FROM (
		SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `player_id`, `seed` ORDER BY `score` DESC, `created_at` ASC) AS `rn` FROM `score`
	) WHERE `rn` > 1
);--> statement-breakpoint
DELETE FROM `race_history` WHERE `id` IN (
	SELECT `id` FROM (
		SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `race_id`, `player_id` ORDER BY `created_at` ASC) AS `rn` FROM `race_history`
	) WHERE `rn` > 1
);--> statement-breakpoint
CREATE UNIQUE INDEX `race_history_race_player_unique` ON `race_history` (`race_id`,`player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `score_player_seed_unique` ON `score` (`player_id`,`seed`);

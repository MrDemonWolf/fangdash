ALTER TABLE `user` ADD `deletion_requested_at` integer;
ALTER TABLE `user` ADD `deletion_scheduled_for` integer;
ALTER TABLE `player` ADD `profile_public` integer NOT NULL DEFAULT 1;

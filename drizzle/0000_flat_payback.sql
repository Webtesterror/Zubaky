CREATE TABLE `content` (
	`id` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `administrator` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL
);

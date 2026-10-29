CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(191) NOT NULL,
	`phone` varchar(20),
	`order_number` varchar(20),
	`subject` varchar(160) NOT NULL,
	`message` text NOT NULL,
	`status` enum('new','replied','closed') NOT NULL DEFAULT 'new',
	`ip` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `counters` (
	`key` varchar(40) NOT NULL,
	`value` int NOT NULL DEFAULT 0,
	CONSTRAINT `counters_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `replacement_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`user_id` int,
	`items` json NOT NULL,
	`reason` enum('damaged','leaked','wrong_item','missing_item','other') NOT NULL,
	`details` text NOT NULL,
	`photos` json NOT NULL,
	`video_url` varchar(500),
	`status` enum('requested','approved','rejected','completed') NOT NULL DEFAULT 'requested',
	`admin_note` varchar(500),
	`replacement_order_id` int,
	`decided_by` int,
	`decided_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `replacement_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`user_id` int,
	`name` varchar(120) NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(160) NOT NULL DEFAULT '',
	`body` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`verified_purchase` boolean NOT NULL DEFAULT false,
	`admin_reply` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wishlist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`product_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlist_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `wishlist_user_product_uq` UNIQUE(`user_id`,`product_id`)
);
--> statement-breakpoint
ALTER TABLE `coupons` ADD `gift_size` varchar(20);--> statement-breakpoint
ALTER TABLE `order_items` ADD `is_gift` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `kind` enum('standard','replacement') DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `parent_order_id` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `invoice_number` varchar(30);--> statement-breakpoint
ALTER TABLE `orders` ADD `invoiced_at` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancellation_charge` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `refunded_amount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancel_reason` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_reminder_sent_at` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_invoice_uq` UNIQUE(`invoice_number`);--> statement-breakpoint
CREATE INDEX `contact_status_idx` ON `contact_messages` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `replacements_order_idx` ON `replacement_requests` (`order_id`);--> statement-breakpoint
CREATE INDEX `replacements_status_idx` ON `replacement_requests` (`status`);--> statement-breakpoint
CREATE INDEX `reviews_product_idx` ON `reviews` (`product_id`,`status`);--> statement-breakpoint
CREATE INDEX `reviews_user_idx` ON `reviews` (`user_id`);
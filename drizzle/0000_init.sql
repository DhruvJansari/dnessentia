CREATE TABLE `addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`line1` varchar(255) NOT NULL,
	`line2` varchar(255),
	`city` varchar(100) NOT NULL,
	`state` varchar(100) NOT NULL,
	`pincode` varchar(10) NOT NULL,
	`is_default` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actor_id` int,
	`actor_email` varchar(191),
	`action` varchar(80) NOT NULL,
	`entity_type` varchar(40) NOT NULL,
	`entity_id` varchar(40),
	`summary` varchar(500) NOT NULL,
	`changes` json,
	`ip` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_tokens` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`purpose` enum('password_reset','verify_email') NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auth_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`description` varchar(255) NOT NULL DEFAULT '',
	`type` enum('percent','fixed','free_gift') NOT NULL,
	`value` int NOT NULL DEFAULT 0,
	`min_order` int NOT NULL DEFAULT 0,
	`max_uses` int,
	`used_count` int NOT NULL DEFAULT 0,
	`starts_at` timestamp,
	`ends_at` timestamp,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_uq` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`to` varchar(191) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`template` varchar(60) NOT NULL,
	`status` enum('sent','failed','skipped') NOT NULL,
	`error` text,
	`message_id` varchar(255),
	`order_id` int,
	`user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`type` enum('created','status','payment','shipment','email','note','stock') NOT NULL,
	`message` varchar(500) NOT NULL,
	`data` json,
	`actor_type` enum('system','customer','admin','webhook') NOT NULL,
	`actor_id` int,
	`is_internal` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`variant_label` varchar(60) NOT NULL,
	`sku` varchar(60) NOT NULL,
	`image` varchar(255) NOT NULL,
	`unit_price` int NOT NULL,
	`quantity` int NOT NULL,
	`line_total` int NOT NULL,
	`selections` json,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_number` varchar(20) NOT NULL,
	`access_token_hash` varchar(64) NOT NULL,
	`user_id` int,
	`email` varchar(191) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`customer_name` varchar(120) NOT NULL,
	`ship_line1` varchar(255) NOT NULL,
	`ship_line2` varchar(255),
	`ship_city` varchar(100) NOT NULL,
	`ship_state` varchar(100) NOT NULL,
	`ship_pincode` varchar(10) NOT NULL,
	`status` enum('pending','confirmed','processing','shipped','delivered','cancelled','returned') NOT NULL DEFAULT 'pending',
	`payment_status` enum('unpaid','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
	`payment_method` enum('razorpay','cod') NOT NULL,
	`subtotal` int NOT NULL,
	`discount` int NOT NULL DEFAULT 0,
	`shipping_fee` int NOT NULL DEFAULT 0,
	`cod_fee` int NOT NULL DEFAULT 0,
	`total` int NOT NULL,
	`coupon_code` varchar(40),
	`gift_note` varchar(255),
	`customer_note` varchar(500),
	`razorpay_order_id` varchar(60),
	`razorpay_payment_id` varchar(60),
	`shiprocket_order_id` varchar(40),
	`shiprocket_shipment_id` varchar(40),
	`awb_code` varchar(60),
	`courier_name` varchar(120),
	`tracking_status` varchar(120),
	`stock_deducted` boolean NOT NULL DEFAULT false,
	`paid_at` timestamp,
	`shipped_at` timestamp,
	`delivered_at` timestamp,
	`cancelled_at` timestamp,
	`ip` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_number_uq` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`provider` enum('razorpay','cod') NOT NULL,
	`provider_order_id` varchar(60),
	`provider_payment_id` varchar(60),
	`amount` int NOT NULL,
	`status` enum('created','captured','failed','refunded') NOT NULL,
	`method` varchar(40),
	`raw` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`label` varchar(60) NOT NULL,
	`sku` varchar(60) NOT NULL,
	`price` int NOT NULL,
	`compare_at_price` int,
	`stock` int NOT NULL DEFAULT 0,
	`weight_grams` int NOT NULL DEFAULT 50,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `variants_sku_uq` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`type` enum('attar','combo') NOT NULL,
	`name` varchar(160) NOT NULL,
	`character` varchar(160) NOT NULL DEFAULT '',
	`best_for` varchar(255) NOT NULL DEFAULT '',
	`about` text NOT NULL,
	`notes` json,
	`categories` json NOT NULL,
	`images` json NOT NULL,
	`pick_count` int,
	`size_ml` int,
	`includes` json,
	`perfect_for` json,
	`how_to_use` text,
	`why_choose` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`is_best_seller` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`seo_title` varchar(160),
	`seo_description` varchar(320),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`expires_at` timestamp NOT NULL,
	`ip` varchar(64),
	`user_agent` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(80) NOT NULL,
	`value` json NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(191) NOT NULL,
	`name` varchar(120) NOT NULL DEFAULT '',
	`phone` varchar(20),
	`password_hash` varchar(100),
	`role` enum('customer','staff','admin') NOT NULL DEFAULT 'customer',
	`is_active` boolean NOT NULL DEFAULT true,
	`email_verified_at` timestamp,
	`last_login_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('razorpay','shiprocket') NOT NULL,
	`event_type` varchar(80) NOT NULL,
	`external_id` varchar(120),
	`payload` json NOT NULL,
	`status` enum('received','processed','ignored','failed') NOT NULL DEFAULT 'received',
	`error` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `addresses_user_idx` ON `addresses` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `auth_tokens_user_idx` ON `auth_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_logs_order_idx` ON `email_logs` (`order_id`);--> statement-breakpoint
CREATE INDEX `email_logs_created_idx` ON `email_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `order_events_order_idx` ON `order_events` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_email_idx` ON `orders` (`email`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_created_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `orders_rzp_idx` ON `orders` (`razorpay_order_id`);--> statement-breakpoint
CREATE INDEX `orders_awb_idx` ON `orders` (`awb_code`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`order_id`);--> statement-breakpoint
CREATE INDEX `payments_provider_payment_idx` ON `payments` (`provider_payment_id`);--> statement-breakpoint
CREATE INDEX `variants_product_idx` ON `product_variants` (`product_id`);--> statement-breakpoint
CREATE INDEX `products_type_idx` ON `products` (`type`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `webhooks_provider_idx` ON `webhook_events` (`provider`,`created_at`);
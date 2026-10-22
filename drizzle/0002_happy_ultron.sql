PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`status` text NOT NULL,
	`total` integer NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`bay` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`request_key` text NOT NULL,
	`request_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "order_total_nonnegative" CHECK("__new_orders"."total" >= 0),
	CONSTRAINT "order_status_valid" CHECK("__new_orders"."status" IN ('requested','waiting','working','ready','delivered','cancelled')),
	CONSTRAINT "working_bay_required" CHECK("__new_orders"."status" != 'working' OR ("__new_orders"."bay" IS NOT NULL AND "__new_orders"."bay" BETWEEN 1 AND 5))
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "owner_id", "vehicle_id", "status", "total", "payment_status", "bay", "version", "request_key", "request_hash", "created_at", "updated_at") SELECT "id", "owner_id", "vehicle_id", "status", "total", "payment_status", "bay", "version", "request_key", "request_hash", "created_at", "updated_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `owner_request_key` ON `orders` (`owner_id`,`request_key`);--> statement-breakpoint
CREATE INDEX `owner_order_date` ON `orders` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `one_working_order_per_bay` ON `orders` (`bay`) WHERE "orders"."status" = 'working';
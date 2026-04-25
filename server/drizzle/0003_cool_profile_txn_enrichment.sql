ALTER TABLE `user_profile` ADD `age` int;
--> statement-breakpoint
ALTER TABLE `user_profile` ADD `income_group` varchar(20);
--> statement-breakpoint
ALTER TABLE `user_profile` ADD `region` varchar(255);
--> statement-breakpoint
ALTER TABLE `user_profile` ADD `home_lon` decimal(10,6);
--> statement-breakpoint
ALTER TABLE `user_profile` ADD `home_lat` decimal(10,6);
--> statement-breakpoint
ALTER TABLE `user_profile` ADD `subsidies` json;
--> statement-breakpoint
ALTER TABLE `user_profile` ADD `spending_by_category` json;
--> statement-breakpoint
ALTER TABLE `transaction_data` ADD `external_transaction_id` varchar(64);
--> statement-breakpoint
ALTER TABLE `transaction_data` ADD `merchant` varchar(255);
--> statement-breakpoint
ALTER TABLE `transaction_data` ADD `category` varchar(100);
--> statement-breakpoint
ALTER TABLE `transaction_data` ADD `region` varchar(255);
--> statement-breakpoint
ALTER TABLE `transaction_data` ADD `lon` decimal(10,6);
--> statement-breakpoint
ALTER TABLE `transaction_data` ADD `lat` decimal(10,6);
--> statement-breakpoint
ALTER TABLE `transaction_data` ADD `timestamp_ms` bigint;
--> statement-breakpoint
ALTER TABLE `transaction_data` ADD `payment_method` varchar(100);
--> statement-breakpoint
ALTER TABLE `transaction_data` ADD `reference` varchar(64);

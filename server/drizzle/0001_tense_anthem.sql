CREATE TABLE `transaction_data` (
	`transaction_id` int AUTO_INCREMENT NOT NULL,
	`sender_id` int NOT NULL,
	`receiver_id` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`transaction_type` enum('SEND','RECEIVE','BILL_PAYMENT') NOT NULL,
	`transaction_status` enum('PENDING','COMPLETED','FAILED') NOT NULL,
	`transaction_date` timestamp NOT NULL DEFAULT (now()),
	`description` text,
	CONSTRAINT `transaction_data_transaction_id` PRIMARY KEY(`transaction_id`)
);
--> statement-breakpoint
CREATE TABLE `user_faces_metadata` (
	`face_id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`image_id` varchar(255),
	`face_match_score` decimal(5,2),
	`rekognition_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_faces_metadata_face_id` PRIMARY KEY(`face_id`)
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`user_id` int AUTO_INCREMENT NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone_number` varchar(20),
	`date_of_birth` date,
	`address` text,
	`ic_number` varchar(12),
	`passport_number` varchar(20),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profile_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `user_profile_email_unique` UNIQUE(`email`),
	CONSTRAINT `user_profile_ic_number_unique` UNIQUE(`ic_number`),
	CONSTRAINT `user_profile_passport_number_unique` UNIQUE(`passport_number`)
);
--> statement-breakpoint
CREATE TABLE `wallet_balance` (
	`user_id` int NOT NULL,
	`balance` decimal(15,2) NOT NULL DEFAULT '0.00',
	`currency` varchar(10) NOT NULL DEFAULT 'MYR',
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallet_balance_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `transaction_data` ADD CONSTRAINT `transaction_data_sender_id_user_profile_user_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `user_profile`(`user_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_data` ADD CONSTRAINT `transaction_data_receiver_id_user_profile_user_id_fk` FOREIGN KEY (`receiver_id`) REFERENCES `user_profile`(`user_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_faces_metadata` ADD CONSTRAINT `user_faces_metadata_user_id_user_profile_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_profile`(`user_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallet_balance` ADD CONSTRAINT `wallet_balance_user_id_user_profile_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_profile`(`user_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `txn_sender_idx` ON `transaction_data` (`sender_id`);--> statement-breakpoint
CREATE INDEX `txn_receiver_idx` ON `transaction_data` (`receiver_id`);--> statement-breakpoint
CREATE INDEX `txn_date_idx` ON `transaction_data` (`transaction_date`);--> statement-breakpoint
CREATE INDEX `faces_user_idx` ON `user_faces_metadata` (`user_id`);
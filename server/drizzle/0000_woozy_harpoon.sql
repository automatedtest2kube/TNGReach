CREATE TABLE `cloud_jobs` (
	`id` varchar(36) NOT NULL,
	`job_type` varchar(64) NOT NULL,
	`provider` varchar(32) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'PENDING',
	`input_ref` text,
	`result_ref` text,
	`error_message` text,
	`metadata` json,
	`request_id` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cloud_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `cloud_jobs_status_idx` ON `cloud_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `cloud_jobs_type_idx` ON `cloud_jobs` (`job_type`);
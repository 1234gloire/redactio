CREATE TABLE `medical_terms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`term` varchar(512) NOT NULL,
	`category` enum('medicament','pathologie','symptome','anatomie','biologie','procedure','autre') NOT NULL DEFAULT 'autre',
	`synonyms` json,
	`definition` text,
	`source` varchar(64) DEFAULT 'manuel',
	`code` varchar(64),
	`active` boolean NOT NULL DEFAULT true,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medical_terms_id` PRIMARY KEY(`id`)
);

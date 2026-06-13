CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(128) NOT NULL,
	`resource` varchar(128),
	`resourceId` varchar(64),
	`metadata` json,
	`ipAddress` varchar(45),
	`userAgent` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organisations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`type` varchar(64) DEFAULT 'hopital',
	`address` text,
	`siret` varchar(14),
	`contactEmail` varchar(320),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organisations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organisations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `prompt_bases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(32) NOT NULL,
	`content` text NOT NULL,
	`status` enum('brouillon','candidat','publie','retire') NOT NULL DEFAULT 'brouillon',
	`validatedClinical` boolean NOT NULL DEFAULT false,
	`validatedClinicalBy` int,
	`validatedClinicalAt` timestamp,
	`validatedConformite` boolean NOT NULL DEFAULT false,
	`validatedConformiteBy` int,
	`validatedConformiteAt` timestamp,
	`publishedAt` timestamp,
	`retiredAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`changelog` text,
	CONSTRAINT `prompt_bases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompt_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`volet` enum('courrier_sortie','conciliation','correspondance') NOT NULL,
	`version` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`status` enum('brouillon','candidat','publie','retire') NOT NULL DEFAULT 'brouillon',
	`validatedClinical` boolean NOT NULL DEFAULT false,
	`validatedClinicalBy` int,
	`validatedClinicalAt` timestamp,
	`validatedConformite` boolean NOT NULL DEFAULT false,
	`validatedConformiteBy` int,
	`validatedConformiteAt` timestamp,
	`publishedAt` timestamp,
	`retiredAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`changelog` text,
	CONSTRAINT `prompt_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`plan` enum('essai','standard','premium','entreprise') NOT NULL DEFAULT 'essai',
	`status` enum('actif','suspendu','expire','annule') NOT NULL DEFAULT 'actif',
	`seats` int NOT NULL DEFAULT 1,
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promptTemplateId` int NOT NULL,
	`promptBaseId` int NOT NULL,
	`status` enum('en_cours','reussie','echouee') NOT NULL DEFAULT 'en_cours',
	`totalCases` int NOT NULL DEFAULT 0,
	`passedCases` int NOT NULL DEFAULT 0,
	`failedCases` int NOT NULL DEFAULT 0,
	`results` json,
	`runBy` int NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `test_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`volet` enum('courrier_sortie','conciliation','correspondance') NOT NULL,
	`name` varchar(255) NOT NULL,
	`inputData` text NOT NULL,
	`criteria` json,
	`active` boolean NOT NULL DEFAULT true,
	`version` int NOT NULL DEFAULT 1,
	`parentId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `test_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('praticien','editeur_medical','relecteur_clinique','responsable_conformite','admin') NOT NULL DEFAULT 'praticien';--> statement-breakpoint
ALTER TABLE `users` ADD `organisationId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `specialite` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `rpps` varchar(11);--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorSecret` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `active` boolean DEFAULT true NOT NULL;
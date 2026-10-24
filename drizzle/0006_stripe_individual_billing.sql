ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionStatus` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCurrentPeriodEnd` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeTrialEnd` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCancelAtPeriodEnd` boolean DEFAULT false NOT NULL;

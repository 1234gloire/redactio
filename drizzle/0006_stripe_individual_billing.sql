ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);
ALTER TABLE `users` ADD `stripeSubscriptionStatus` varchar(64);
ALTER TABLE `users` ADD `stripeCurrentPeriodEnd` timestamp;
ALTER TABLE `users` ADD `stripeTrialEnd` timestamp;
ALTER TABLE `users` ADD `stripeCancelAtPeriodEnd` boolean DEFAULT false NOT NULL;
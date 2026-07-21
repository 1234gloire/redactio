ALTER TABLE `users` MODIFY `role` enum('praticien','org_admin','editeur_medical','relecteur_clinique','responsable_conformite','admin') DEFAULT 'praticien' NOT NULL;

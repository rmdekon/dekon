CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`audience` text DEFAULT 'ALL' NOT NULL,
	`author_id` text,
	`is_pinned` integer DEFAULT false NOT NULL,
	`published_at` integer NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `announcement_audience_idx` ON `announcements` (`audience`,`published_at`);--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`classroom_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`teacher_id` text,
	`due_date` integer NOT NULL,
	`max_score` real DEFAULT 100 NOT NULL,
	`attachment_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `assignment_class_idx` ON `assignments` (`classroom_id`);--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`classroom_id` text NOT NULL,
	`date` text NOT NULL,
	`status` text DEFAULT 'PRESENT' NOT NULL,
	`note` text,
	`marked_by_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`marked_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_student_date_idx` ON `attendance` (`student_id`,`date`);--> statement-breakpoint
CREATE INDEX `attendance_class_date_idx` ON `attendance` (`classroom_id`,`date`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`metadata` text,
	`ip` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_logs` (`entity`,`created_at`);--> statement-breakpoint
CREATE TABLE `book_loans` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`student_id` text NOT NULL,
	`issued_at` integer NOT NULL,
	`due_at` integer NOT NULL,
	`returned_at` integer,
	`fine` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `loan_book_idx` ON `book_loans` (`book_id`);--> statement-breakpoint
CREATE INDEX `loan_student_idx` ON `book_loans` (`student_id`);--> statement-breakpoint
CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`isbn` text NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`category` text,
	`publisher` text,
	`published_year` integer,
	`total_copies` integer DEFAULT 1 NOT NULL,
	`shelf` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `books_isbn_unique` ON `books` (`isbn`);--> statement-breakpoint
CREATE TABLE `class_subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`classroom_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`teacher_id` text,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `class_subject_idx` ON `class_subjects` (`classroom_id`,`subject_id`);--> statement-breakpoint
CREATE TABLE `classrooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`section` text DEFAULT 'A' NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`capacity` integer DEFAULT 40 NOT NULL,
	`room` text,
	`academic_year` text DEFAULT '2025/2026' NOT NULL,
	`class_teacher_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`class_teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `classrooms_name_section_year_idx` ON `classrooms` (`name`,`section`,`academic_year`);--> statement-breakpoint
CREATE TABLE `exam_results` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text NOT NULL,
	`student_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`score` real NOT NULL,
	`max_score` real DEFAULT 100 NOT NULL,
	`grade` text,
	`remark` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exam_result_idx` ON `exam_results` (`exam_id`,`student_id`,`subject_id`);--> statement-breakpoint
CREATE INDEX `exam_result_student_idx` ON `exam_results` (`student_id`);--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`term` text DEFAULT 'TERM_1' NOT NULL,
	`academic_year` text DEFAULT '2025/2026' NOT NULL,
	`type` text DEFAULT 'FINAL' NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fee_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_no` text NOT NULL,
	`student_id` text NOT NULL,
	`term` text DEFAULT 'TERM_1' NOT NULL,
	`academic_year` text DEFAULT '2025/2026' NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'UNPAID' NOT NULL,
	`due_date` integer NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fee_invoices_invoice_no_unique` ON `fee_invoices` (`invoice_no`);--> statement-breakpoint
CREATE INDEX `invoice_student_idx` ON `fee_invoices` (`student_id`);--> statement-breakpoint
CREATE INDEX `invoice_status_idx` ON `fee_invoices` (`status`);--> statement-breakpoint
CREATE TABLE `guardian_students` (
	`id` text PRIMARY KEY NOT NULL,
	`guardian_id` text NOT NULL,
	`student_id` text NOT NULL,
	`relation` text DEFAULT 'GUARDIAN' NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_student_idx` ON `guardian_students` (`guardian_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `guardians` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone` text,
	`address` text,
	`occupation` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guardians_user_id_unique` ON `guardians` (`user_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `message_recipient_idx` ON `messages` (`recipient_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text DEFAULT 'INFO' NOT NULL,
	`channel` text DEFAULT 'IN_APP' NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`link` text,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notification_user_idx` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`amount` real NOT NULL,
	`method` text DEFAULT 'CASH' NOT NULL,
	`reference` text,
	`paid_at` integer NOT NULL,
	`recorded_by` text,
	FOREIGN KEY (`invoice_id`) REFERENCES `fee_invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payment_invoice_idx` ON `payments` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_id` text NOT NULL,
	`user_agent` text,
	`ip` text,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_id_unique` ON `sessions` (`token_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`admission_no` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`date_of_birth` integer,
	`gender` text DEFAULT 'OTHER' NOT NULL,
	`address` text,
	`phone` text,
	`blood_group` text,
	`photo_url` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`admission_date` integer NOT NULL,
	`classroom_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_user_id_unique` ON `students` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_admission_no_unique` ON `students` (`admission_no`);--> statement-breakpoint
CREATE INDEX `students_classroom_idx` ON `students` (`classroom_id`);--> statement-breakpoint
CREATE INDEX `students_status_idx` ON `students` (`status`);--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`credit_hours` integer DEFAULT 1 NOT NULL,
	`is_elective` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_code_unique` ON `subjects` (`code`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`student_id` text NOT NULL,
	`content` text,
	`file_url` text,
	`submitted_at` integer NOT NULL,
	`score` real,
	`feedback` text,
	`graded_at` integer,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `submission_idx` ON `submissions` (`assignment_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`staff_no` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`qualification` text,
	`specialization` text,
	`phone` text,
	`address` text,
	`employment_type` text DEFAULT 'FULL_TIME' NOT NULL,
	`hire_date` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teachers_user_id_unique` ON `teachers` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `teachers_staff_no_unique` ON `teachers` (`staff_no`);--> statement-breakpoint
CREATE TABLE `timetable_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`classroom_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`teacher_id` text,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`room` text,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `timetable_class_day_idx` ON `timetable_slots` (`classroom_id`,`day_of_week`);--> statement-breakpoint
CREATE INDEX `timetable_teacher_day_idx` ON `timetable_slots` (`teacher_id`,`day_of_week`);--> statement-breakpoint
CREATE TABLE `transport_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`route_id` text NOT NULL,
	`pickup_stop` text,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`route_id`) REFERENCES `transport_routes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transport_assignment_idx` ON `transport_assignments` (`student_id`,`route_id`);--> statement-breakpoint
CREATE TABLE `transport_routes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`stops` text DEFAULT '' NOT NULL,
	`fare` real DEFAULT 0 NOT NULL,
	`vehicle_id` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'STUDENT' NOT NULL,
	`phone` text,
	`avatar_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`mfa_enabled` integer DEFAULT false NOT NULL,
	`mfa_secret` text,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`reg_number` text NOT NULL,
	`model` text NOT NULL,
	`capacity` integer DEFAULT 30 NOT NULL,
	`driver_name` text NOT NULL,
	`driver_phone` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_reg_number_unique` ON `vehicles` (`reg_number`);
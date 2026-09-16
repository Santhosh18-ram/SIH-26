-- ==========================================================
-- MPLAD AI MONITOR — MySQL Database Schema & Seed Data
-- Compatible with MySQL 8.0 & MySQL Workbench 8.0 CE
-- Problem Statement: Smart India Hackathon 2026 (SIH26102)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `mplad_monitor` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `mplad_monitor`;

-- Drop existing tables in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `static_stats`;
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `worker_updates`;
DROP TABLE IF EXISTS `risk_assessments`;
DROP TABLE IF EXISTS `fund_requests`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `reference_projects`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) UNIQUE NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `role` VARCHAR(50) NOT NULL, -- mla_admin, field_worker, public
  `constituency` VARCHAR(100) DEFAULT NULL,
  `district` VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Public Reference Projects Table (mplads.gov.in Dataset)
CREATE TABLE `reference_projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `scope_unit` VARCHAR(50) NOT NULL,
  `scope_value` DOUBLE NOT NULL,
  `terrain_type` VARCHAR(50) NOT NULL DEFAULT 'Rural',
  `district` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
  `sanctioned_cost` DOUBLE NOT NULL,
  `actual_completion_cost` DOUBLE NOT NULL,
  `cost_per_unit` DOUBLE NOT NULL,
  `duration_days` INT NOT NULL,
  `source` VARCHAR(100) NOT NULL DEFAULT 'mplads.gov.in',
  `completion_year` INT DEFAULT 2025,
  `created_at` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Projects Table
CREATE TABLE `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `scope_unit` VARCHAR(50) NOT NULL,
  `scope_value` DOUBLE NOT NULL,
  `terrain_type` VARCHAR(50) NOT NULL DEFAULT 'Rural',
  `constituency` VARCHAR(100) NOT NULL,
  `district` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
  `lat` DOUBLE NOT NULL,
  `lng` DOUBLE NOT NULL,
  `sanctioned_fund` DOUBLE NOT NULL,
  `estimated_fund` DOUBLE NOT NULL,
  `estimated_days` INT NOT NULL,
  `spent_fund` DOUBLE NOT NULL DEFAULT 0.0,
  `actual_start_date` VARCHAR(50) NOT NULL,
  `expected_completion_date` VARCHAR(50) NOT NULL,
  `actual_completion_date` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'In Progress',
  `assigned_worker_id` INT DEFAULT NULL,
  `worker_name` VARCHAR(150) DEFAULT NULL,
  `current_progress_pct` DOUBLE DEFAULT 0.0,
  `agency_name` VARCHAR(150) NOT NULL,
  `contractor_name` VARCHAR(150) NOT NULL,
  `trees_to_cut` INT DEFAULT 0,
  `buildings_to_demolish` INT DEFAULT 0,
  `demolition_details` TEXT DEFAULT NULL,
  `is_over_sanction_flag` TINYINT(1) DEFAULT 0,
  `peer_comparison_json` TEXT DEFAULT NULL,
  `proposer_agency` VARCHAR(150) DEFAULT NULL,
  `proposer_contact` VARCHAR(150) DEFAULT NULL,
  `approved_by` VARCHAR(150) DEFAULT NULL,
  `approval_notes` TEXT DEFAULT NULL,
  `rejection_reason` TEXT DEFAULT NULL,
  `future_visualization_url` VARCHAR(500) DEFAULT NULL,
  `before_photo_url` VARCHAR(500) DEFAULT NULL,
  `photos_json` TEXT DEFAULT NULL,
  `created_at` VARCHAR(50) DEFAULT NULL,
  CONSTRAINT `fk_project_worker` FOREIGN KEY (`assigned_worker_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Fund Requests Table
CREATE TABLE `fund_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `scope_unit` VARCHAR(50) NOT NULL,
  `scope_value` DOUBLE NOT NULL,
  `terrain_type` VARCHAR(50) NOT NULL DEFAULT 'Rural',
  `district` VARCHAR(100) NOT NULL,
  `constituency` VARCHAR(100) NOT NULL,
  `requested_amount` DOUBLE NOT NULL,
  `requested_by` VARCHAR(150) NOT NULL,
  `trees_to_cut` INT DEFAULT 0,
  `buildings_to_demolish` INT DEFAULT 0,
  `demolition_details` TEXT DEFAULT NULL,
  `future_visualization_url` VARCHAR(500) DEFAULT NULL,
  `is_over_sanction_flag` TINYINT(1) DEFAULT 0,
  `peer_comparison_json` TEXT DEFAULT NULL,
  `override_justification` TEXT DEFAULT NULL,
  `estimation_result_json` TEXT DEFAULT NULL,
  `duplicate_warnings_json` TEXT DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `created_at` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Risk Assessments Table
CREATE TABLE `risk_assessments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `score` DOUBLE NOT NULL,
  `band` VARCHAR(50) NOT NULL,
  `signals_json` TEXT NOT NULL,
  `primary_signal` VARCHAR(100) NOT NULL,
  `explanation_json` TEXT NOT NULL,
  `ml_anomaly_score` DOUBLE DEFAULT NULL,
  `computed_at` VARCHAR(50) DEFAULT NULL,
  CONSTRAINT `fk_risk_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Field Worker Updates Table
CREATE TABLE `worker_updates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `worker_id` INT NOT NULL,
  `worker_name` VARCHAR(150) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `progress_pct` DOUBLE NOT NULL,
  `expenditure_so_far` DOUBLE NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `photo_url` VARCHAR(500) NOT NULL,
  `geotag_lat` DOUBLE DEFAULT NULL,
  `geotag_lng` DOUBLE DEFAULT NULL,
  `timestamp` VARCHAR(50) DEFAULT NULL,
  CONSTRAINT `fk_update_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_update_worker` FOREIGN KEY (`worker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Citizen Complaints Table
CREATE TABLE `complaints` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `worker_update_id` INT DEFAULT NULL,
  `citizen_name` VARCHAR(150) DEFAULT 'Anonymous Citizen',
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `photo_url` VARCHAR(500) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Open',
  `mla_response` TEXT DEFAULT NULL,
  `tracking_code` VARCHAR(50) UNIQUE NOT NULL,
  `created_at` VARCHAR(50) DEFAULT NULL,
  CONSTRAINT `fk_complaint_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Constituency Static Stats Table
CREATE TABLE `static_stats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constituency` VARCHAR(100) UNIQUE NOT NULL,
  `district` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
  `schools_built` INT DEFAULT 0,
  `roads_built_km` DOUBLE DEFAULT 0.0,
  `community_halls_built` INT DEFAULT 0,
  `healthcare_centers` INT DEFAULT 0,
  `total_funds_sanctioned` DOUBLE DEFAULT 0.0,
  `total_funds_utilised` DOUBLE DEFAULT 0.0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Audit Logs Table
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `actor` VARCHAR(150) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `action_type` VARCHAR(100) NOT NULL,
  `target_type` VARCHAR(100) NOT NULL,
  `target_id` INT DEFAULT NULL,
  `details` TEXT NOT NULL,
  `timestamp` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================
-- SEED DATA INSERTION
-- ==========================================================

-- Insert Users
INSERT INTO `users` (`id`, `username`, `name`, `email`, `role`, `constituency`, `district`) VALUES
(1, 'mla_admin', 'Hon. MLA Rajesh Sharma', 'mla.varanasi@gov.in', 'mla_admin', 'Varanasi Cantt', 'Varanasi'),
(2, 'worker_suresh', 'Suresh Kumar (Junior Engineer)', 'suresh.field@gov.in', 'field_worker', 'Varanasi Cantt', 'Varanasi'),
(3, 'worker_ramesh', 'Ramesh Patel (Site Supervisor)', 'ramesh.field@gov.in', 'field_worker', 'Jaipur Rural', 'Jaipur'),
(4, 'worker_anita', 'Anita Singh (District Inspector)', 'anita.field@gov.in', 'field_worker', 'Bengaluru South', 'Bengaluru Urban'),
(5, 'citizen_priya', 'Priya Sharma (Citizen)', 'priya@citizen.org', 'public', 'Varanasi Cantt', 'Varanasi');

-- Insert Public Reference Projects (mplads.gov.in records)
INSERT INTO `reference_projects` (`id`, `project_title`, `category`, `scope_unit`, `scope_value`, `terrain_type`, `district`, `state`, `sanctioned_cost`, `actual_completion_cost`, `cost_per_unit`, `duration_days`, `source`, `completion_year`, `created_at`) VALUES
(1, 'PMGSY All-Weather Bituminous Road, Mirzapur', 'Roads & Bridges', 'km', 4.0, 'Rural', 'Mirzapur', 'Uttar Pradesh', 98.0, 96.5, 24.125, 180, 'mplads.gov.in', 2024, '2026-03-01 10:00:00'),
(2, 'Panchayat Link Road Construction, Chandauli', 'Roads & Bridges', 'km', 2.5, 'Rural', 'Chandauli', 'Uttar Pradesh', 62.0, 61.0, 24.4, 120, 'mplads.gov.in', 2024, '2026-03-01 10:00:00'),
(3, 'Rural Asphalt Connector, Ghazipur', 'Roads & Bridges', 'km', 3.0, 'Rural', 'Ghazipur', 'Uttar Pradesh', 75.0, 74.0, 24.67, 140, 'mplads.gov.in', 2025, '2026-03-01 10:00:00'),
(4, 'Urban Arterial Concrete Paving, Varanasi City', 'Roads & Bridges', 'km', 2.0, 'Urban', 'Varanasi', 'Uttar Pradesh', 58.0, 57.5, 28.75, 100, 'State PWD', 2025, '2026-03-01 10:00:00'),
(5, 'Jaipur Ring Connector Urban Road', 'Roads & Bridges', 'km', 5.0, 'Urban', 'Jaipur', 'Rajasthan', 142.0, 140.0, 28.0, 210, 'mplads.gov.in', 2024, '2026-03-01 10:00:00'),
(6, 'Hill Slope Paved Road, Almora', 'Roads & Bridges', 'km', 2.0, 'Hilly / Mountainous', 'Almora', 'Uttarakhand', 70.0, 72.0, 36.0, 160, 'PMGSY', 2024, '2026-03-01 10:00:00'),
(7, 'Flood-Embankment Reinforced Road, Ballia', 'Roads & Bridges', 'km', 3.5, 'Flood-Prone / Coastal', 'Ballia', 'Uttar Pradesh', 112.0, 110.0, 31.43, 175, 'mplads.gov.in', 2025, '2026-03-01 10:00:00'),
(8, 'Gram Panchayat Public Hall, Phulpur', 'Community Halls', 'sqft', 5000.0, 'Rural', 'Prayagraj', 'Uttar Pradesh', 20.0, 19.8, 0.00396, 130, 'mplads.gov.in', 2024, '2026-03-01 10:00:00'),
(9, 'Village Community Centre, Sarnath Rural', 'Community Halls', 'sqft', 6000.0, 'Rural', 'Varanasi', 'Uttar Pradesh', 24.0, 23.5, 0.00392, 150, 'mplads.gov.in', 2025, '2026-03-01 10:00:00'),
(10, 'Block Samiti Community Hall, Amber', 'Community Halls', 'sqft', 8000.0, 'Rural', 'Jaipur', 'Rajasthan', 32.0, 31.8, 0.003975, 180, 'mplads.gov.in', 2024, '2026-03-01 10:00:00'),
(11, 'Urban Cultural Hall & Library, Lucknow', 'Community Halls', 'sqft', 8000.0, 'Urban', 'Lucknow', 'Uttar Pradesh', 36.8, 36.0, 0.0045, 190, 'State PWD', 2025, '2026-03-01 10:00:00'),
(12, 'Primary School 6-Classroom Block, Jaunpur', 'Schools & Education', 'sqft', 8000.0, 'Rural', 'Jaunpur', 'Uttar Pradesh', 36.0, 35.5, 0.00444, 180, 'mplads.gov.in', 2024, '2026-03-01 10:00:00'),
(13, 'Primary Health Centre OPD Wing, Sanganer', 'Health & Hospitals', 'sqft', 6000.0, 'Rural', 'Jaipur', 'Rajasthan', 39.0, 38.5, 0.00642, 170, 'mplads.gov.in', 2024, '2026-03-01 10:00:00'),
(14, 'Solar Dual-Pump Water Facility, Bikaner', 'Water & Sanitation', 'units', 2.0, 'Rural', 'Bikaner', 'Rajasthan', 24.0, 23.4, 11.7, 90, 'mplads.gov.in', 2025, '2026-03-01 10:00:00'),
(15, 'Village Solar LED Light Grid, Tonk', 'Street Lighting', 'units', 100.0, 'Rural', 'Tonk', 'Rajasthan', 40.0, 39.5, 0.395, 60, 'mplads.gov.in', 2025, '2026-03-01 10:00:00');

-- Insert Projects
INSERT INTO `projects` (`id`, `title`, `description`, `category`, `scope_unit`, `scope_value`, `terrain_type`, `constituency`, `district`, `state`, `lat`, `lng`, `sanctioned_fund`, `estimated_fund`, `estimated_days`, `spent_fund`, `actual_start_date`, `expected_completion_date`, `actual_completion_date`, `status`, `assigned_worker_id`, `worker_name`, `current_progress_pct`, `agency_name`, `contractor_name`, `trees_to_cut`, `buildings_to_demolish`, `demolition_details`, `is_over_sanction_flag`, `override_justification`, `future_visualization_url`, `before_photo_url`, `photos_json`, `created_at`) VALUES
(1, 'Widening & Paving of Village Main Road, Shivpur', 'Construction of 3.2 km double-lane asphalt road connecting Shivpur Market to National Highway 19, including concrete drainage channels on both sides.', 'Roads & Bridges', 'km', 3.2, 'Rural', 'Varanasi Cantt', 'Varanasi', 'Uttar Pradesh', 25.352, 82.965, 145.0, 80.0, 144, 115.0, '2026-01-10', '2026-06-15', NULL, 'In Progress', 2, 'Suresh Kumar', 35.0, 'UP State Bridge Corporation', 'M/s Purvanchal Infra Pvt Ltd', 18, 2, 'Demolition of 2 encroaching roadside boundary sheds.', 1, 'Sanctioned at 1.8x peer rate citing expedited completion and subgrade soil stabilization requirements.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80', '["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80", "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80"]', '2026-03-01 10:00:00'),
(2, 'Shivpur Village Main Road Paving Work', 'Asphalt paving and repair of 3.0 km main road near Shivpur Market connecting NH-19.', 'Roads & Bridges', 'km', 3.0, 'Rural', 'Varanasi Cantt', 'Varanasi', 'Uttar Pradesh', 25.3535, 82.967, 75.0, 75.0, 135, 20.0, '2026-02-01', '2026-07-01', NULL, 'In Progress', 2, 'Suresh Kumar', 25.0, 'Public Works Dept (PWD) Varanasi', 'Kashi Infra Projects', 5, 0, 'None required.', 0, NULL, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80', '["https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80"]', '2026-03-01 10:00:00'),
(3, 'Construction of Smart Primary School Building, Lahartara', '2-storey school building with 12 smart classrooms, computer laboratory, solar panel roof, and clean drinking water filtration plant.', 'Schools & Education', 'sqft', 12000.0, 'Urban', 'Varanasi Cantt', 'Varanasi', 'Uttar Pradesh', 25.312, 82.969, 54.0, 54.0, 240, 38.0, '2025-11-01', '2026-07-01', NULL, 'In Progress', 2, 'Suresh Kumar', 70.0, 'UP Rajkiya Nirman Nigam', 'Varanasi Builders Corp', 4, 1, 'Demolition of old dilapidated single-room brick storehouse.', 0, NULL, 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80', 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80', '["https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80"]', '2026-03-01 10:00:00'),
(4, 'Community Cultural Centre & Library, Sigra', 'Multi-purpose community auditorium with 400 seating capacity, public digital library, and air-conditioned conference hall.', 'Community Halls', 'sqft', 8000.0, 'Urban', 'Varanasi Cantt', 'Varanasi', 'Uttar Pradesh', 25.318, 82.985, 32.0, 32.0, 200, 32.0, '2025-08-01', '2026-03-01', NULL, 'Completed', 2, 'Suresh Kumar', 100.0, 'Varanasi Development Authority', 'Apex Constructions', 0, 0, 'None.', 0, NULL, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=800&q=80', '["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"]', '2026-03-01 10:00:00'),
(5, 'Primary Health Centre Upgrade & ICU Wing, Amer', 'Construction of a 30-bed emergency extension wing, modern pathology lab, and solar power backup at Amer Community Health Centre.', 'Health & Hospitals', 'sqft', 6000.0, 'Hilly / Mountainous', 'Jaipur Rural', 'Jaipur', 'Rajasthan', 26.9855, 75.8513, 95.0, 39.0, 180, 65.0, '2025-09-15', '2026-04-15', NULL, 'Delayed', 3, 'Ramesh Patel', 40.0, 'Rajasthan Medical Services Corp', 'M/s Marwar Engineering', 8, 1, 'Demolition of abandoned old dispensary quarter.', 1, 'Over-sanction approved citing specialized medical oxygen piping and terrain gradient work.', 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&q=80', 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80', '["https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80"]', '2026-03-01 10:00:00'),
(6, 'Overhead Water Tank & Pipeline Grid, Shahpura', '500,000 Litres capacity elevated RCC water reservoir and 8.5 km underground distribution pipeline grid for clean drinking water supply.', 'Water & Sanitation', 'units', 1.0, 'Rural', 'Jaipur Rural', 'Jaipur', 'Rajasthan', 27.387, 75.962, 14.0, 12.0, 90, 9.5, '2026-01-05', '2026-05-10', NULL, 'In Progress', 3, 'Ramesh Patel', 65.0, 'PHED Rajasthan', 'PinkCity Infra Solutions', 2, 0, 'None.', 0, NULL, 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80', '["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80"]', '2026-03-01 10:00:00'),
(7, 'Government Higher Secondary School STEM Lab Building, Jayanagar', 'Constructing a 3-storey dedicated STEM & Innovation Block with 4 laboratories, robotic workshop, and green terrace.', 'Schools & Education', 'sqft', 15000.0, 'Urban', 'Bengaluru South', 'Bengaluru Urban', 'Karnataka', 12.925, 77.5938, 67.5, 67.5, 300, 45.0, '2025-10-01', '2026-08-01', NULL, 'In Progress', 4, 'Anita Singh', 60.0, 'BBMP Education Infra Division', 'Deccan Construction Ltd', 6, 0, 'None.', 0, NULL, 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80', 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=800&q=80', '["https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80"]', '2026-03-01 10:00:00'),
(8, 'Smart Solar Street Lighting Grid, Banashankari Phase 3', 'Installation of 350 automated energy-efficient solar LED streetlight poles with smart central monitoring sensor nodes.', 'Street Lighting', 'units', 350.0, 'Urban', 'Bengaluru South', 'Bengaluru Urban', 'Karnataka', 12.918, 77.555, 140.0, 140.0, 525, 135.0, '2025-06-01', '2026-01-15', NULL, 'Delayed', 4, 'Anita Singh', 85.0, 'BESCOM Renewable Energy Cell', 'GreenTech Lighting India', 0, 0, 'None.', 0, NULL, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80', '["https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80"]', '2026-03-01 10:00:00'),
(9, 'Integrated Ayush Wellness Centre & Herbal Garden, Sarnath', 'Sanctioned project for building a holistic AYUSH health centre with 15 OPD rooms, yoga hall, and public botanical garden.', 'Health & Hospitals', 'sqft', 10000.0, 'Rural', 'Varanasi Cantt', 'Varanasi', 'Uttar Pradesh', 25.376, 83.022, 65.0, 65.0, 300, 0.0, '2026-10-01', '2027-08-01', NULL, 'Planned/Upcoming', 2, 'Suresh Kumar', 0.0, 'UP Public Health Dept', 'To Be Tendered', 3, 0, 'None.', 0, NULL, 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&q=80', 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=800&q=80', '[]', '2026-03-01 10:00:00');

-- Insert Risk Assessments
INSERT INTO `risk_assessments` (`id`, `project_id`, `score`, `band`, `signals_json`, `primary_signal`, `explanation_json`, `ml_anomaly_score`, `computed_at`) VALUES
(1, 1, 82.5, 'Critical', '{"Cost Anomaly": 100.0, "Schedule Delay": 35.0, "Fund/Progress Mismatch": 92.0, "Duplicate Suspect": 82.0, "Agency History Pattern": 20.0}', 'Cost Anomaly', '["Sanction-Time Over-Sanction Flag: Sanctioned budget was identified as a peer-group outlier against public MPLADS records prior to approval.", "Cost Anomaly: Sanctioned budget of ₹145.0 Lakhs is 81.3% above the district baseline for Roads & Bridges projects (₹80.0 Lakhs estimated).", "Fund Utilisation Mismatch: 79.3% of sanctioned funds spent (₹115.0 Lakhs), but physical completion progress stands at only 35.0%.", "Duplicate Suspect: High similarity (88.0%) and geographic proximity (0.32 km) to existing project \'Shivpur Village Main Road Paving Work\'."]', 88.5, '2026-03-01 10:00:00'),
(2, 2, 22.0, 'Low', '{"Cost Anomaly": 15.0, "Schedule Delay": 10.0, "Fund/Progress Mismatch": 5.0, "Duplicate Suspect": 30.0, "Agency History Pattern": 15.0}', 'Duplicate Suspect', '["Normal Execution Pattern: All cost, schedule, fund utilisation, and duplicate signals are within expected statistical variance bands."]', 12.0, '2026-03-01 10:00:00'),
(3, 3, 18.5, 'Low', '{"Cost Anomaly": 12.0, "Schedule Delay": 10.0, "Fund/Progress Mismatch": 8.0, "Duplicate Suspect": 10.0, "Agency History Pattern": 15.0}', 'Agency History Pattern', '["Normal Execution Pattern: All cost, schedule, fund utilisation, and duplicate signals are within expected statistical variance bands."]', 10.0, '2026-03-01 10:00:00'),
(4, 4, 10.0, 'Low', '{"Cost Anomaly": 5.0, "Schedule Delay": 5.0, "Fund/Progress Mismatch": 0.0, "Duplicate Suspect": 5.0, "Agency History Pattern": 15.0}', 'Agency History Pattern', '["Normal Execution Pattern: All cost, schedule, fund utilisation, and duplicate signals are within expected statistical variance bands."]', 8.0, '2026-03-01 10:00:00'),
(5, 5, 78.0, 'High', '{"Cost Anomaly": 100.0, "Schedule Delay": 75.0, "Fund/Progress Mismatch": 58.0, "Duplicate Suspect": 15.0, "Agency History Pattern": 25.0}', 'Cost Anomaly', '["Sanction-Time Over-Sanction Flag: Sanctioned budget was identified as a peer-group outlier against public MPLADS records prior to approval.", "Cost Anomaly: Sanctioned budget of ₹95.0 Lakhs is 143.6% above the district baseline for Health & Hospitals projects (₹39.0 Lakhs estimated).", "Schedule Slippage: Expected duration was 180 days. Project has reached 90.0% elapsed schedule time with only 40.0% progress recorded."]', 76.0, '2026-03-01 10:00:00');

-- Insert Field Worker Updates
INSERT INTO `worker_updates` (`id`, `project_id`, `worker_id`, `worker_name`, `status`, `progress_pct`, `expenditure_so_far`, `notes`, `photo_url`, `geotag_lat`, `geotag_lng`, `timestamp`) VALUES
(1, 1, 2, 'Suresh Kumar', 'In Progress', 35.0, 115.0, 'Completed sub-grade leveling for 1.2 km section. Laying stone aggregate base layer. Drainage work delayed due to utility cable obstruction.', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', 25.3521, 82.9652, '2026-03-01 10:30:00'),
(2, 1, 2, 'Suresh Kumar', 'In Progress', 25.0, 70.0, 'Initial ground clearance complete. Felled 12 cleared trees with forest clearance permit #FC-892.', 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80', 25.352, 82.965, '2026-02-15 14:15:00'),
(3, 3, 2, 'Suresh Kumar', 'In Progress', 70.0, 38.0, 'Roof casting complete for 2nd floor classrooms. Plastering and electrical conduit wiring in progress.', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80', 25.3121, 82.9691, '2026-03-05 11:45:00'),
(4, 5, 3, 'Ramesh Patel', 'Delayed', 40.0, 65.0, 'Pillar casting completed. Foundation reinforcement delayed due to monsoon waterlogging and cement delivery delays.', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80', 26.9856, 75.8514, '2026-03-08 09:20:00');

-- Insert Complaints
INSERT INTO `complaints` (`id`, `project_id`, `worker_update_id`, `citizen_name`, `category`, `description`, `photo_url`, `status`, `mla_response`, `tracking_code`, `created_at`) VALUES
(1, 1, 1, 'Vikas Dubey', 'Fake/Wrong Photo', 'The field worker uploaded a photo of a asphalt roller machine, but on actual ground in Shivpur Village near the market, no work has happened for the last 2 weeks and the site is lying abandoned.', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', 'Open', 'Investigation initiated. Assigned District Magistrate inspector to verify ground status.', 'CMP-2026-8812', '2026-03-02 16:20:00'),
(2, 1, NULL, 'Ritu Srivastava', 'Cost Overrun & Trees Felling', 'The project sanctioned cost of ₹145 Lakhs for 3.2km road is extremely high compared to normal PWD rates. Also, contractors cut down 22 trees instead of the approved limit of 18 trees!', 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80', 'In Progress', 'Audit team dispatched to inspect tree felling count against forestry permit.', 'CMP-2026-9041', '2026-03-04 11:10:00'),
(3, 5, 4, 'Mahesh Meena', 'Delay', 'Amer Hospital ICU extension has been stuck at 40% progress for over 4 months despite ₹65 Lakhs spending. Patients are facing severe inconvenience.', '', 'Open', NULL, 'CMP-2026-1029', '2026-03-09 15:45:00');

-- Insert Static Stats
INSERT INTO `static_stats` (`id`, `constituency`, `district`, `state`, `schools_built`, `roads_built_km`, `community_halls_built`, `healthcare_centers`, `total_funds_sanctioned`, `total_funds_utilised`) VALUES
(1, 'Varanasi Cantt', 'Varanasi', 'Uttar Pradesh', 24, 86.5, 12, 8, 1850.0, 1420.0),
(2, 'Jaipur Rural', 'Jaipur', 'Rajasthan', 19, 112.0, 9, 6, 1620.0, 1180.0),
(3, 'Bengaluru South', 'Bengaluru Urban', 'Karnataka', 31, 45.2, 15, 14, 2400.0, 2050.0),
(4, 'Thane Central', 'Thane', 'Maharashtra', 15, 62.8, 8, 5, 1450.0, 990.0);

-- Insert Audit Logs
INSERT INTO `audit_logs` (`id`, `actor`, `role`, `action_type`, `target_type`, `target_id`, `details`, `timestamp`) VALUES
(1, 'Hon. MLA Rajesh Sharma', 'mla_admin', 'OVER_SANCTION_CHECK', 'FundRequest', 1, 'Sanction-Time Check flagged request #1 (Babatpur Hall): 2.4x typical cost (₹58L vs ₹24L typical). Override justification requested.', '2026-03-01 09:00:00'),
(2, 'Hon. MLA Rajesh Sharma', 'mla_admin', 'REVIEW_RISK', 'Project', 1, 'Reviewed High Risk Flag (Score 82.5) for Shivpur Road. Directed field worker re-verification.', '2026-03-02 17:00:00');

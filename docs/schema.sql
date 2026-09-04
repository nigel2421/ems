-- ====================================================================
-- CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS)
-- Relational Database DDL Schema (SQLite / PostgreSQL / MySQL)
-- ====================================================================

-- 1. Roles & Permissions (RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  level INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id VARCHAR(50) NOT NULL,
  phone VARCHAR(50),
  assigned_region VARCHAR(100),
  entity_name VARCHAR(150),
  avatar_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'Active',
  two_factor_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 2. Polling Station Intelligence
CREATE TABLE IF NOT EXISTS polling_stations (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  county VARCHAR(100) NOT NULL,
  constituency VARCHAR(100) NOT NULL,
  ward VARCHAR(100) NOT NULL,
  village VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  registered_voters INT DEFAULT 0,
  active_voters INT DEFAULT 0,
  historical_turnout_pct DECIMAL(5, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS polling_station_intelligence (
  station_id VARCHAR(50) PRIMARY KEY,
  party_advantage_score INT DEFAULT 50, -- 0 (Opponent stronghold) to 100 (Our stronghold)
  incumbency_score INT DEFAULT 50,
  opposition_strength INT DEFAULT 50,
  public_perception_rating DECIMAL(3, 2) DEFAULT 3.5, -- 1.0 to 5.0
  competitor_activity_level VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High, Critical
  strategic_importance VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High
  risk_level VARCHAR(20) DEFAULT 'Low', -- Low, Medium, High, Severe
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES polling_stations(id) ON DELETE CASCADE
);

-- 3. Agent Management
CREATE TABLE IF NOT EXISTS agents (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  region VARCHAR(100) NOT NULL,
  supervisor_id VARCHAR(50),
  status VARCHAR(20) DEFAULT 'Active', -- Active, Inactive, On Duty, Offline
  performance_rating DECIMAL(3, 2) DEFAULT 4.50, -- 1.00 to 5.00
  last_activity_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (supervisor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS agent_station_assignments (
  id VARCHAR(50) PRIMARY KEY,
  agent_id VARCHAR(50) NOT NULL,
  polling_station_id VARCHAR(50) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (polling_station_id) REFERENCES polling_stations(id) ON DELETE CASCADE
);

-- 4. Survey & Polling Engine
CREATE TABLE IF NOT EXISTS surveys (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL, -- Anonymous Public, Targeted, Candidate Preference, Issue-Based
  target_audience VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Active', -- Draft, Active, Closed
  public_slug VARCHAR(100) UNIQUE,
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id VARCHAR(50) PRIMARY KEY,
  survey_id VARCHAR(50) NOT NULL,
  question_text TEXT NOT NULL,
  type VARCHAR(30) NOT NULL, -- Single Choice, Multi Choice, Text, Rating, Number
  options_json TEXT, -- JSON array of choices if choice type
  order_index INT DEFAULT 0,
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id VARCHAR(50) PRIMARY KEY,
  survey_id VARCHAR(50) NOT NULL,
  agent_id VARCHAR(50), -- NULL if anonymous public
  respondent_token VARCHAR(100),
  answers_json TEXT NOT NULL, -- JSON key-value store of question_id -> response
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

-- 5. Field Reporting
CREATE TABLE IF NOT EXISTS field_reports (
  id VARCHAR(50) PRIMARY KEY,
  agent_id VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL, -- Mobilization, Campaign, Incident, Opponent Activity, Community Sentiment
  title VARCHAR(200) NOT NULL,
  notes TEXT NOT NULL,
  severity_level VARCHAR(20) DEFAULT 'Low', -- Low, Medium, High, Critical
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS report_media (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_size_kb INT NOT NULL,
  compressed_size_kb INT NOT NULL,
  thumbnail_url TEXT,
  media_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES field_reports(id) ON DELETE CASCADE
);

-- 6. Team Mobilization & Stakeholder Network
CREATE TABLE IF NOT EXISTS stakeholders (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL, -- Village Elders, Clergy, Youth Mobilizers, Women Leaders, Bodaboda Leaders, Business Leaders, Community Organizers
  county VARCHAR(100) NOT NULL,
  ward VARCHAR(100) NOT NULL,
  village VARCHAR(100),
  influence_rating INT DEFAULT 5, -- 1 to 10
  reach_estimate INT DEFAULT 100, -- Number of voters influenced
  assigned_coordinator_id VARCHAR(50),
  status VARCHAR(30) DEFAULT 'Supportive', -- Engaged, Supportive, Neutral, Opposed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_coordinator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS stakeholder_activities (
  id VARCHAR(50) PRIMARY KEY,
  stakeholder_id VARCHAR(50) NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  notes TEXT,
  follow_up_date DATE,
  logged_by VARCHAR(50) NOT NULL,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stakeholder_id) REFERENCES stakeholders(id) ON DELETE CASCADE
);

-- 7. Campaign Strategy & Operations
CREATE TABLE IF NOT EXISTS campaign_phases (
  id VARCHAR(50) PRIMARY KEY,
  phase_number INT NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL, -- Announcement, Team Formation, Voter Mobilization, Mass Campaign, GOTV
  description TEXT,
  start_date DATE,
  end_date DATE,
  progress_pct INT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Pending' -- Pending, Active, Completed
);

CREATE TABLE IF NOT EXISTS campaign_tasks (
  id VARCHAR(50) PRIMARY KEY,
  phase_id VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  assigned_team VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High, Urgent
  status VARCHAR(20) DEFAULT 'Todo', -- Todo, In Progress, Completed
  kpi_target VARCHAR(100),
  kpi_current VARCHAR(100),
  due_date DATE,
  FOREIGN KEY (phase_id) REFERENCES campaign_phases(id) ON DELETE CASCADE
);

-- 8. Election Day Operations (Tally Center)
CREATE TABLE IF NOT EXISTS tally_results (
  id VARCHAR(50) PRIMARY KEY,
  polling_station_id VARCHAR(50) NOT NULL UNIQUE,
  agent_id VARCHAR(50) NOT NULL,
  cand_a_votes INT DEFAULT 0,
  cand_b_votes INT DEFAULT 0,
  cand_c_votes INT DEFAULT 0,
  rejected_votes INT DEFAULT 0,
  total_votes_cast INT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Submitted', -- Submitted, Mismatch, Verified, Approved
  approval_comment TEXT,
  verified_by VARCHAR(50),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (polling_station_id) REFERENCES polling_stations(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS tally_evidence (
  id VARCHAR(50) PRIMARY KEY,
  tally_id VARCHAR(50) NOT NULL,
  form_type VARCHAR(20) DEFAULT 'Form 34A',
  ocr_extracted_json TEXT,
  image_url TEXT NOT NULL,
  thumb_url TEXT,
  hash_signature VARCHAR(64) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tally_id) REFERENCES tally_results(id) ON DELETE CASCADE
);

-- 9. AI Intelligence & Audit Logging
CREATE TABLE IF NOT EXISTS ai_conversations (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(50),
  user_name VARCHAR(150),
  role VARCHAR(50),
  ip_address VARCHAR(45),
  action VARCHAR(100) NOT NULL,
  details TEXT
);

-- Indices for rapid querying over 20,000+ polling stations
CREATE INDEX IF NOT EXISTS idx_ps_county ON polling_stations(county);
CREATE INDEX IF NOT EXISTS idx_ps_constituency ON polling_stations(constituency);
CREATE INDEX IF NOT EXISTS idx_ps_ward ON polling_stations(ward);
CREATE INDEX IF NOT EXISTS idx_psi_risk ON polling_station_intelligence(risk_level);
CREATE INDEX IF NOT EXISTS idx_reports_agent ON field_reports(agent_id);
CREATE INDEX IF NOT EXISTS idx_reports_category ON field_reports(category);
CREATE INDEX IF NOT EXISTS idx_tally_ps ON tally_results(polling_station_id);

-- ====================================================================
-- PostgreSQL Database Schema for Campaign Intelligence & EMS (wemisico_ems)
-- Database: wemisico_ems
-- Owner/User: wemisico_adminuser
-- ====================================================================

-- 1. Counties
CREATE TABLE IF NOT EXISTS counties (
    id VARCHAR(20) PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    registered_voters INT DEFAULT 0
);

-- 2. Constituencies
CREATE TABLE IF NOT EXISTS constituencies (
    id VARCHAR(20) PRIMARY KEY,
    county_id VARCHAR(20) REFERENCES counties(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    registered_voters INT DEFAULT 0
);

-- 3. Wards
CREATE TABLE IF NOT EXISTS wards (
    id VARCHAR(20) PRIMARY KEY,
    constituency_id VARCHAR(20) REFERENCES constituencies(id) ON DELETE CASCADE,
    county_id VARCHAR(20) REFERENCES counties(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    registered_voters INT DEFAULT 0,
    polling_stations_count INT DEFAULT 0
);

-- 4. Polling Stations
CREATE TABLE IF NOT EXISTS polling_stations (
    id VARCHAR(20) PRIMARY KEY,
    ward_id VARCHAR(20) REFERENCES wards(id) ON DELETE CASCADE,
    constituency_id VARCHAR(20) REFERENCES constituencies(id) ON DELETE CASCADE,
    county_id VARCHAR(20) REFERENCES counties(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    registered_voters INT DEFAULT 0
);

-- 5. Polling Station Intelligence Scores
CREATE TABLE IF NOT EXISTS station_intelligence (
    station_id VARCHAR(20) PRIMARY KEY REFERENCES polling_stations(id) ON DELETE CASCADE,
    party_advantage_score INT DEFAULT 50,
    incumbency_score INT DEFAULT 50,
    opposition_strength INT DEFAULT 50,
    public_perception_rating NUMERIC(3,2) DEFAULT 3.5,
    competitor_activity_level VARCHAR(20) DEFAULT 'Medium',
    strategic_importance VARCHAR(20) DEFAULT 'Medium',
    risk_level VARCHAR(20) DEFAULT 'Low',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Agents Directory
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(100),
    assigned_stations JSONB DEFAULT '[]'::jsonb,
    role VARCHAR(50) DEFAULT 'Field Agent',
    status VARCHAR(20) DEFAULT 'Active',
    constituency VARCHAR(100),
    ward VARCHAR(100),
    reports_submitted_count INT DEFAULT 0,
    surveys_completed_count INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Surveys & Polls
CREATE TABLE IF NOT EXISTS surveys (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    type VARCHAR(50) DEFAULT 'Voter Perception',
    status VARCHAR(20) DEFAULT 'Active',
    public_slug VARCHAR(255),
    questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_count INT DEFAULT 0
);

-- 8. Field Incidents & Intelligence Reports
CREATE TABLE IF NOT EXISTS field_reports (
    id VARCHAR(50) PRIMARY KEY,
    agent_id VARCHAR(50),
    agent_name VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    severity_level VARCHAR(20) DEFAULT 'Low',
    description TEXT,
    location VARCHAR(255),
    media JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Stakeholders & Influence Network
CREATE TABLE IF NOT EXISTS stakeholders (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    category VARCHAR(100),
    location VARCHAR(255),
    influence_score INT DEFAULT 50,
    alignment VARCHAR(50) DEFAULT 'Neutral',
    contact VARCHAR(100),
    activities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Campaign Strategy Phases
CREATE TABLE IF NOT EXISTS campaign_phases (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration VARCHAR(50),
    progress_pct INT DEFAULT 0,
    tasks JSONB DEFAULT '[]'::jsonb
);

-- 11. Tally Center Results
CREATE TABLE IF NOT EXISTS tally_results (
    id VARCHAR(50) PRIMARY KEY,
    polling_station_id VARCHAR(20) REFERENCES polling_stations(id) ON DELETE CASCADE,
    polling_station_code VARCHAR(50),
    cand_a_votes INT DEFAULT 0,
    cand_b_votes INT DEFAULT 0,
    cand_c_votes INT DEFAULT 0,
    rejected_votes INT DEFAULT 0,
    total_votes_cast INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_comment TEXT,
    verified_by VARCHAR(100)
);

-- 12. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    role VARCHAR(50),
    ip_address VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    details TEXT
);

-- Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_constituencies_county ON constituencies(county_id);
CREATE INDEX IF NOT EXISTS idx_wards_constituency ON wards(constituency_id);
CREATE INDEX IF NOT EXISTS idx_polling_stations_ward ON polling_stations(ward_id);
CREATE INDEX IF NOT EXISTS idx_field_reports_agent ON field_reports(agent_id);
CREATE INDEX IF NOT EXISTS idx_tally_station ON tally_results(polling_station_id);

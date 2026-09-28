-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Roles Table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 2. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    state VARCHAR(100),
    district VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Parcels Table (Spatial)
CREATE TABLE parcels (
    id SERIAL PRIMARY KEY,
    survey_no VARCHAR(100) NOT NULL,
    area_acres DECIMAL(10, 2) NOT NULL,
    village VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    land_use VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pending',
    owner_name VARCHAR(255),
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    state VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Documents Table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    parcel_id INTEGER REFERENCES parcels(id),
    project_id INTEGER REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending Approval',
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. R&R Beneficiaries Table
CREATE TABLE rr_beneficiaries (
    id SERIAL PRIMARY KEY,
    parcel_id INTEGER REFERENCES parcels(id),
    beneficiary_name VARCHAR(255) NOT NULL,
    entitlement_amount DECIMAL(15, 2) NOT NULL,
    amount_disbursed DECIMAL(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending Verification',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Workflow Audit Logs
CREATE TABLE workflow_logs (
    id SERIAL PRIMARY KEY,
    parcel_id INTEGER REFERENCES parcels(id),
    document_id INTEGER REFERENCES documents(id),
    actor_id INTEGER REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SEED DATA

-- Roles
INSERT INTO roles (name) VALUES 
('Central Admin'), 
('State Officer'), 
('District Officer'), 
('Field Agent'), 
('Citizen');

-- Users
INSERT INTO users (name, email, password_hash, role_id, state, district) VALUES 
('Central Nodal Admin', 'admin@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 1, 'National', 'National'),
-- Karnataka
('Karnataka State Admin', 'karnataka@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 2, 'Karnataka', 'ALL'),
('Tumkur District Admin', 'tumkur@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 3, 'Karnataka', 'Tumkur'),
-- Maharashtra
('Maharashtra State Admin', 'maharashtra@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 2, 'Maharashtra', 'ALL'),
('Pune District Admin', 'pune@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 3, 'Maharashtra', 'Pune'),
-- Uttar Pradesh
('Uttar Pradesh State Admin', 'up@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 2, 'Uttar Pradesh', 'ALL'),
('Varanasi District Admin', 'varanasi@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 3, 'Uttar Pradesh', 'Varanasi'),
-- Gujarat
('Gujarat State Admin', 'gujarat@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 2, 'Gujarat', 'ALL'),
('Ahmedabad District Admin', 'ahmedabad@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 3, 'Gujarat', 'Ahmedabad'),
-- Tamil Nadu
('Tamil Nadu State Admin', 'tamilnadu@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 2, 'Tamil Nadu', 'ALL'),
('Coimbatore District Admin', 'coimbatore@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 3, 'Tamil Nadu', 'Coimbatore'),
-- Rajasthan
('Rajasthan State Admin', 'rajasthan@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 2, 'Rajasthan', 'ALL'),
('Jaipur District Admin', 'jaipur@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 3, 'Rajasthan', 'Jaipur'),
-- West Bengal
('West Bengal State Admin', 'westbengal@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 2, 'West Bengal', 'ALL'),
('Hooghly District Admin', 'hooghly@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 3, 'West Bengal', 'Hooghly'),
-- Punjab
('Punjab State Admin', 'punjab@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 2, 'Punjab', 'ALL'),
('Ludhiana District Admin', 'ludhiana@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 3, 'Punjab', 'Ludhiana'),
-- Field Agent
('Field Agent Ramesh', 'ramesh@sih.gov.in', '$2a$10$XQYx3fVnQ.XkYc9YqT9yLu2D1QyJ9YqT9yLu2D1QyJ9YqT9yLu2D1', 4, 'Karnataka', 'Tumkur');

-- Note: passwords above are dummies, they won't actually hash correctly with bcrypt but it's okay for seed schema initialization

-- Parcels
-- Pilot parcel in Tumkur, Karnataka; village Shivapura; survey no. 123/4
INSERT INTO parcels (survey_no, area_acres, village, district, state, land_use, status, owner_name, geom)
VALUES (
    '123/4', 
    2.35, 
    'Shivapura', 
    'Tumkur', 
    'Karnataka', 
    'Agricultural', 
    'Under Acquisition', 
    'Ramesh Kumar',
    ST_GeomFromText('POLYGON((77.100 13.330, 77.102 13.330, 77.102 13.332, 77.100 13.332, 77.100 13.330))', 4326)
);

-- We can run an additional seed script later to generate 200 parcels.

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ margin: 40, size: 'A4' });
const pdfPath = path.join(__dirname, '..', 'Execution_Plan_SIH26016.pdf');
const stream = fs.createWriteStream(pdfPath);
doc.pipe(stream);

// Primary Palette
const PRIMARY = '#0B1F5C';
const ACCENT = '#F59E0B';
const DARK = '#1E293B';
const LIGHT_BG = '#F1F5F9';

// Header
doc.rect(0, 0, doc.page.width, 100).fill(PRIMARY);
doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('SIH 2026 | PROBLEM STATEMENT SIH26016', 40, 25);
doc.fillColor(ACCENT).fontSize(14).text('Unified Geo-Aware Land Management Portal', 40, 52);
doc.fillColor('#93C5FD').fontSize(10).font('Helvetica').text('Master System Execution Plan & Function Architecture Inventory', 40, 72);

doc.moveDown(3);

// Function for section headers
function addSectionHeader(title) {
  doc.moveDown(1);
  doc.rect(40, doc.y, doc.page.width - 80, 24).fill('#E2E8F0');
  doc.fillColor(PRIMARY).fontSize(12).font('Helvetica-Bold').text(title, 48, doc.y - 18);
  doc.moveDown(0.8);
}

// Section 1: Executive Summary & System Objectives
addSectionHeader('1. EXECUTIVE SUMMARY & SYSTEM OBJECTIVES');
doc.fillColor(DARK).fontSize(9.5).font('Helvetica').text(
  'The Unified Geo-Aware Land Management Portal is designed to modernize and unify land acquisition, cadastral mapping, and Resettlement & Rehabilitation (R&R) workflows across India under DILRMP. It guarantees zero boundary overlap (PostGIS spatial topology), 100% unique titleholders per land parcel, and automated RFCTLARR 2013 statutory compliance.',
  40, doc.y, { width: 515, align: 'justify' }
);

// Section 2: Phased Execution Plan (Timeline & Milestones)
addSectionHeader('2. PHASED EXECUTION PLAN & MILESTONES');

const phases = [
  { phase: 'Phase 1: Foundation & Spatial Data Architecture', duration: 'Weeks 1 - 2', tasks: 'Set up Node.js Express server, PostGIS spatial database, spatial tessellation engine (ST_Touches/ST_Disjoint), and 8 Pan-India regional cadastral hubs.' },
  { phase: 'Phase 2: Authentication & Regional Access Control', duration: 'Weeks 3 - 4', tasks: 'Implement JWT authentication with place-based RBAC (Central Admin, 8 State Admins, 8 District Admins, Field Agents). Multi-tier jurisdiction filtering.' },
  { phase: 'Phase 3: Interactive Cadastral Map & Document Hub', duration: 'Weeks 5 - 6', tasks: 'Develop Leaflet GIS map viewer, ULPIN Bhu-Aadhaar search, 6-in-1 legal document bundle viewer (RoR 7/12, Sale Deed, Mutation, EC, Property Card, Cadastral Sketch).' },
  { phase: 'Phase 4: Workflows, R&R & Field Agent App', duration: 'Weeks 7 - 8', tasks: 'Build Sec 11/19/23 acquisition workflow tracker, Direct Benefit Transfer (DBT) compensation engine, and mobile-ready DGPS surveyor verification app.' },
  { phase: 'Phase 5: Performance Optimization & SIH Deployment', duration: 'Weeks 9 - 10', tasks: 'Docker Compose containerization, WebSocket real-time event broadcasting, UI polish, and full system audit verification.' }
];

phases.forEach(p => {
  doc.fillColor(PRIMARY).fontSize(10).font('Helvetica-Bold').text(`${p.phase} (${p.duration})`, 45, doc.y);
  doc.fillColor(DARK).fontSize(9).font('Helvetica').text(p.tasks, 45, doc.y + 2, { width: 505 });
  doc.moveDown(0.6);
});

// Add new page for Function Inventory
doc.addPage();

// Function Inventory Header
doc.rect(0, 0, doc.page.width, 60).fill(PRIMARY);
doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('COMPLETE FUNCTION ARCHITECTURE INVENTORY', 40, 20);
doc.fillColor(ACCENT).fontSize(10).text('Detailed technical breakdown of all API Endpoints, Server Logic & React Components', 40, 42);

doc.y = 80;

addSectionHeader('3. BACKEND API ROUTES & SERVER FUNCTIONS (Node.js / Express)');

const backendFunctions = [
  { name: 'POST /api/auth/login', file: 'server/routes/auth.js', desc: 'Validates officer credentials, assigns jurisdiction (State/District), generates 24h JWT token.' },
  { name: 'GET /api/auth/accounts', file: 'server/routes/auth.js', desc: 'Returns pre-configured place admin accounts across all 8 states & national level.' },
  { name: 'GET /api/dashboard/kpi', file: 'server/routes/dashboard.js', desc: 'Computes national & regional land acquisition metrics, total acres, land-use ratios, state leaderboard.' },
  { name: 'GET /api/dashboard/recent-activity', file: 'server/routes/dashboard.js', desc: 'Fetches real-time system audit logs (ULPIN verification, mutations, DBT payments).' },
  { name: 'generateCadastralHub(...)', file: 'server/routes/parcels.js', desc: 'Spatial mesh generator producing non-overlapping contiguous PostGIS cadastral polygons.' },
  { name: 'logActivity(...)', file: 'server/routes/parcels.js', desc: 'Creates audit trail records for parcel acquisition status transitions.' },
  { name: 'startSimulator(io)', file: 'server/routes/parcels.js', desc: 'WebSocket live activity broadcast loop emitting real-time updates every 14 seconds.' },
  { name: 'GET /api/parcels', file: 'server/routes/parcels.js', desc: 'Returns Pan-India Cadastral GeoJSON FeatureCollection filtered by state.' },
  { name: 'GET /api/parcels/:id', file: 'server/routes/parcels.js', desc: 'Fetches single parcel data along with 6 complete legal land paper bundles.' },
  { name: 'PATCH /api/parcels/:id/status', file: 'server/routes/parcels.js', desc: 'Updates acquisition status and broadcasts change via WebSocket.' },
  { name: 'seedFromParcels(...)', file: 'server/routes/rr.js', desc: 'Seeds R&R beneficiary dataset under LARR Act 2013 rules.' },
  { name: 'GET /api/rr/beneficiaries', file: 'server/routes/rr.js', desc: 'Fetches R&R entitlement records with filtering.' },
  { name: 'POST /api/rr/disburse/:id', file: 'server/routes/rr.js', desc: 'Executes simulated Direct Benefit Transfer (DBT) payment to beneficiary bank account.' },
  { name: 'POST /api/rr/field-surveys', file: 'server/routes/rr.js', desc: 'Submits DGPS surveyor data, geo-tagged site photos, and flags encroachments.' }
];

backendFunctions.forEach(fn => {
  doc.fillColor(PRIMARY).fontSize(9.5).font('Helvetica-Bold').text(fn.name, 45, doc.y);
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Oblique').text(` [File: ${fn.file}]`, doc.x + 10, doc.y);
  doc.fillColor(DARK).fontSize(8.5).font('Helvetica').text(fn.desc, 45, doc.y + 2, { width: 505 });
  doc.moveDown(0.5);
});

// Add third page for Frontend Functions
doc.addPage();

// Frontend Functions Header
doc.rect(0, 0, doc.page.width, 60).fill(PRIMARY);
doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('FRONTEND COMPONENTS & HOOKS (React + Material UI)', 40, 20);
doc.fillColor(ACCENT).fontSize(10).text('Client-side application structure and UI handlers', 40, 42);

doc.y = 80;

addSectionHeader('4. FRONTEND COMPONENTS & HOOKS INVENTORY');

const frontendFunctions = [
  { name: 'AuthProvider ({ children })', file: 'client/src/context/AuthContext.jsx', desc: 'Global authentication provider context managing user state, tokens, and local storage.' },
  { name: 'login(userData, token) / logout()', file: 'client/src/context/AuthContext.jsx', desc: 'Auth state mutation handlers for session creation and termination.' },
  { name: 'MainLayout Component', file: 'client/src/layouts/MainLayout.jsx', desc: 'Application shell with Tricolor bar, accessibility font resizer, language switcher, ticker ribbon, and sidebar navigation.' },
  { name: 'Login Component', file: 'client/src/pages/Login.jsx', desc: 'Officer login portal featuring Quick Switch place admin selector chips and dropdown.' },
  { name: 'Dashboard Component', file: 'client/src/pages/Dashboard.jsx', desc: 'Command center rendering KPI cards, pipeline stepper, land-use distribution chart, and state performance leaderboard.' },
  { name: 'MapViewer Component', file: 'client/src/pages/MapViewer.jsx', desc: 'Interactive Leaflet GIS map rendering cadastral polygons, layer controls, and ULPIN search.' },
  { name: 'onEachFeature / styleFeature', file: 'client/src/pages/MapViewer.jsx', desc: 'Map polygon color-coding and popup/click event handlers.' },
  { name: 'LandRecords Component', file: 'client/src/pages/LandRecords.jsx', desc: 'Master searchable dataset of 288+ parcels with legal document drawer modal.' },
  { name: 'Workflows Component', file: 'client/src/pages/Workflows.jsx', desc: 'RFCTLARR Act 2013 acquisition progress manager with Gazette notice viewer.' },
  { name: 'RRTracker Component', file: 'client/src/pages/RRTracker.jsx', desc: 'Resettlement & Rehabilitation manager with direct DBT payment trigger button.' },
  { name: 'FieldAgent Component', file: 'client/src/pages/FieldAgent.jsx', desc: 'Mobile-responsive DGPS surveyor app with HTML5 geolocation capture and photo uploads.' }
];

frontendFunctions.forEach(fn => {
  doc.fillColor(PRIMARY).fontSize(9.5).font('Helvetica-Bold').text(fn.name, 45, doc.y);
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Oblique').text(` [File: ${fn.file}]`, doc.x + 10, doc.y);
  doc.fillColor(DARK).fontSize(8.5).font('Helvetica').text(fn.desc, 45, doc.y + 2, { width: 505 });
  doc.moveDown(0.5);
});

addSectionHeader('5. VERIFICATION & QUALITY ASSURANCE');
doc.fillColor(DARK).fontSize(9).font('Helvetica').text(
  'All backend API endpoints and frontend components have been built, linted with Oxlint/Vite, verified syntax-clean, and tested against live node server environments.',
  45, doc.y, { width: 505 }
);

doc.end();

stream.on('finish', () => {
  console.log('PDF generated successfully at: ' + pdfPath);
});

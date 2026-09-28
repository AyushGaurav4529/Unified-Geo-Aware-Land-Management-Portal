const express = require('express');
const router  = express.Router();

// ── R&R Compensation Data (seeded from actual parcel data) ────────────────────
// This module generates realistic R&R (Rehabilitation & Resettlement) beneficiary
// records under the Right to Fair Compensation and Transparency in Land
// Acquisition, Rehabilitation and Resettlement Act, 2013 (LARR Act 2013).

const COMPENSATION_TYPES = [
  'Market Value Compensation',
  'Solatium (100% of Market Value)',
  'Resettlement Allowance',
  'Subsistence Grant (12 months)',
  'Transportation Allowance',
  'Cattle Shed Compensation',
  'Artisan/Small Trader Grant',
  'Stamp Duty & Registration Reimbursement'
];

const ACQUISITION_PURPOSES = [
  'National Highway Expansion (NHAI)',
  'Railway Line Doubling (Indian Railways)',
  'Smart City Mission Infrastructure',
  'Industrial Corridor Development',
  'Irrigation Canal Construction',
  'Affordable Housing (PMAY)',
  'Metro Rail Transit System',
  'Defence Cantonment Expansion'
];

const DISBURSEMENT_MODES = ['RTGS', 'NEFT', 'Direct Benefit Transfer (DBT)', 'Demand Draft'];

const RR_STATUSES = [
  'SIA Notification Issued',      // Social Impact Assessment
  'Public Hearing Scheduled',
  'Preliminary Notification (Sec 11)',
  'Survey & Measurement Complete',
  'Market Value Assessed',
  'Award Declared (Sec 23)',
  'Compensation Offered',
  'Partial Disbursement',
  'Fully Compensated',
  'R&R Benefits Delivered',
  'Objection Filed',
  'Referred to LARR Authority'
];

// ── In-memory Store ───────────────────────────────────────────────────────────
let beneficiaries = [];
let nextBeneficiaryId = 1;
let fieldSurveys = [];
let nextSurveyId = 1;
const offlineQueue = []; // simulated offline-first queue

// ── Seed from parcels on first request ────────────────────────────────────────
let seeded = false;
function seedFromParcels(parcelsMap) {
  if (seeded) return;
  seeded = true;

  const allParcels = [...parcelsMap.values()];
  // Pick parcels that are 'Under Acquisition', 'Acquired', or 'Compensated' for R&R
  const rrParcels = allParcels.filter(p =>
    ['Under Acquisition', 'Acquired', 'Compensated', 'Pending'].includes(p.properties.status)
  );

  // Take up to 40 parcels to create realistic beneficiary records
  const selected = rrParcels.slice(0, 40);

  selected.forEach((parcel, idx) => {
    const props = parcel.properties;
    const marketRate = getMarketRate(props.land_use, props.state);
    const marketValue = Math.round(props.area_acres * marketRate);
    const solatium = Math.round(marketValue * 1.0); // 100% as per LARR 2013
    const totalEntitlement = marketValue + solatium;

    // Determine disbursement based on status
    let disbursed = 0;
    let rrStatus = RR_STATUSES[idx % RR_STATUSES.length];

    if (props.status === 'Compensated') {
      disbursed = totalEntitlement;
      rrStatus = 'Fully Compensated';
    } else if (props.status === 'Acquired') {
      disbursed = Math.round(totalEntitlement * (0.4 + Math.random() * 0.4));
      rrStatus = 'Partial Disbursement';
    } else if (props.status === 'Under Acquisition') {
      disbursed = Math.round(totalEntitlement * Math.random() * 0.25);
      rrStatus = RR_STATUSES[Math.min(idx % 6, 6)];
    }

    const acquisitionPurpose = ACQUISITION_PURPOSES[idx % ACQUISITION_PURPOSES.length];

    beneficiaries.push({
      id: nextBeneficiaryId++,
      parcel_id: parcel.id,
      survey_no: props.survey_no,
      land_name: props.land_name,
      ulpin: props.ulpin,
      state: props.state,
      state_code: props.state_code,
      district: props.district,
      taluk: props.taluk,
      village: props.village,
      // Beneficiary info
      beneficiary_name: props.owner_name,
      beneficiary_relation: props.owner_relation,
      aadhaar_masked: props.owner_aadhaar_masked,
      pan_masked: props.owner_pan_masked,
      bank_account: `XXXX-XXXX-${String(3000 + parcel.id).slice(-4)}`,
      bank_ifsc: `SBIN00${String(10000 + parcel.id).slice(-5)}`,
      bank_name: ['State Bank of India', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India'][idx % 5],
      // Land details
      area_acres: props.area_acres,
      area_sqm: props.area_sqm,
      land_use: props.land_use,
      // Compensation
      market_rate_per_acre: marketRate,
      market_value: marketValue,
      solatium_amount: solatium,
      additional_benefits: getAdditionalBenefits(props, idx),
      total_entitlement: totalEntitlement + getAdditionalBenefits(props, idx).reduce((s, b) => s + b.amount, 0),
      disbursed_amount: disbursed,
      pending_amount: totalEntitlement + getAdditionalBenefits(props, idx).reduce((s, b) => s + b.amount, 0) - disbursed,
      // Acquisition
      acquisition_purpose: acquisitionPurpose,
      acquiring_body: getAcquiringBody(acquisitionPurpose),
      la_case_no: `LA/${props.state_code}/${props.district.slice(0, 3).toUpperCase()}/2024/${String(5000 + parcel.id).padStart(6, '0')}`,
      notification_date: randomDate(2023, 2024),
      award_date: randomDate(2024, 2025),
      // Status
      rr_status: rrStatus,
      disbursement_mode: DISBURSEMENT_MODES[idx % DISBURSEMENT_MODES.length],
      disbursement_history: generateDisbursementHistory(disbursed, totalEntitlement, parcel.id),
      grievance_status: idx % 7 === 0 ? 'Objection Pending' : 'No Grievance',
      rehabilitation_package: getRehabPackage(props, idx),
      last_updated: new Date().toISOString()
    });
  });
}

function getMarketRate(landUse, state) {
  const baseRates = {
    'Agricultural (Wet)': 1800000,
    'Agricultural (Dry)': 1200000,
    'Residential / Abadi': 4500000,
    'Commercial Hub': 7500000,
    'Industrial Corridor': 5500000
  };
  const stateMultiplier = {
    'Karnataka': 1.1, 'Maharashtra': 1.4, 'Tamil Nadu': 1.2,
    'Rajasthan': 0.8, 'Gujarat': 1.0, 'Uttar Pradesh': 0.75,
    'West Bengal': 0.85, 'Punjab': 0.95
  };
  return Math.round((baseRates[landUse] || 2000000) * (stateMultiplier[state] || 1.0));
}

function getAdditionalBenefits(props, idx) {
  const benefits = [];
  if (props.land_use.includes('Agricultural')) {
    benefits.push({ type: 'Subsistence Grant (12 months)', amount: 36000 });
    benefits.push({ type: 'Cattle Shed Compensation', amount: 25000 });
  }
  if (idx % 3 === 0) {
    benefits.push({ type: 'Artisan/Small Trader Grant', amount: 25000 });
  }
  benefits.push({ type: 'Transportation Allowance', amount: 50000 });
  benefits.push({ type: 'Stamp Duty Reimbursement', amount: Math.round(props.area_acres * 5000) });
  return benefits;
}

function getAcquiringBody(purpose) {
  if (purpose.includes('NHAI')) return 'National Highways Authority of India';
  if (purpose.includes('Railway')) return 'Ministry of Railways, Govt. of India';
  if (purpose.includes('Smart City')) return 'Smart City Mission SPV';
  if (purpose.includes('Industrial')) return 'Delhi-Mumbai Industrial Corridor Dev. Corp.';
  if (purpose.includes('Irrigation')) return 'State Water Resources Department';
  if (purpose.includes('PMAY')) return 'Pradhan Mantri Awas Yojana (Urban)';
  if (purpose.includes('Metro')) return 'Metro Rail Corporation Ltd.';
  if (purpose.includes('Defence')) return 'Ministry of Defence, Govt. of India';
  return 'State Revenue Department';
}

function getRehabPackage(props, idx) {
  const packages = [];
  packages.push({ benefit: 'Alternative Plot Allotment', status: idx % 3 === 0 ? 'Allotted' : 'Pending' });
  packages.push({ benefit: 'Employment to One Family Member', status: idx % 4 === 0 ? 'Placed' : 'Under Process' });
  packages.push({ benefit: 'Annuity for 20 Years', status: idx % 2 === 0 ? 'Active' : 'Not Started' });
  if (props.land_use.includes('Agricultural')) {
    packages.push({ benefit: 'Agricultural Land (Replacement)', status: idx % 5 === 0 ? 'Allotted' : 'Identification in Progress' });
  }
  packages.push({ benefit: 'Skill Development Training', status: idx % 3 === 0 ? 'Completed' : 'Scheduled' });
  return packages;
}

function generateDisbursementHistory(disbursed, total, parcelId) {
  if (disbursed === 0) return [];
  const history = [];
  let remaining = disbursed;
  let installment = 1;
  while (remaining > 0) {
    const amount = installment === 1
      ? Math.round(Math.min(remaining, total * 0.4))
      : Math.round(Math.min(remaining, total * 0.3));
    history.push({
      installment,
      amount: Math.min(amount, remaining),
      date: randomDate(2024, 2025),
      mode: DISBURSEMENT_MODES[(parcelId + installment) % DISBURSEMENT_MODES.length],
      voucher_no: `VCH-${parcelId}-${installment}-${String(Math.random()).slice(2, 8)}`,
      status: 'Credited'
    });
    remaining -= amount;
    installment++;
    if (installment > 5) break; // Max 5 installments
  }
  return history;
}

function randomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().split('T')[0];
}

// ── R&R API Routes ────────────────────────────────────────────────────────────

// GET /api/rr/beneficiaries - All R&R beneficiaries with filtering
router.get('/beneficiaries', (req, res) => {
  const parcelsMap = req.app.get('parcelsMap');
  if (parcelsMap) seedFromParcels(parcelsMap);

  let result = [...beneficiaries];

  // Filters
  if (req.query.state && req.query.state !== 'All' && req.query.state !== 'ALL' && req.query.state !== 'National') {
    result = result.filter(b => b.state.toLowerCase() === req.query.state.toLowerCase());
  }
  if (req.query.district && req.query.district !== 'ALL' && req.query.district !== 'All' && req.query.district !== 'National') {
    result = result.filter(b => b.district.toLowerCase() === req.query.district.toLowerCase());
  }
  if (req.query.status && req.query.status !== 'All' && req.query.status !== 'ALL') {
    result = result.filter(b => b.rr_status === req.query.status);
  }
  if (req.query.search) {
    const s = req.query.search.toLowerCase();
    result = result.filter(b =>
      b.beneficiary_name.toLowerCase().includes(s) ||
      b.survey_no.toLowerCase().includes(s) ||
      b.la_case_no.toLowerCase().includes(s) ||
      b.ulpin.toLowerCase().includes(s)
    );
  }

  // Summary statistics
  const stats = {
    total_beneficiaries: beneficiaries.length,
    total_entitlement: beneficiaries.reduce((s, b) => s + b.total_entitlement, 0),
    total_disbursed: beneficiaries.reduce((s, b) => s + b.disbursed_amount, 0),
    total_pending: beneficiaries.reduce((s, b) => s + b.pending_amount, 0),
    fully_compensated: beneficiaries.filter(b => b.rr_status === 'Fully Compensated').length,
    grievances_open: beneficiaries.filter(b => b.grievance_status === 'Objection Pending').length,
    by_state: {}
  };

  beneficiaries.forEach(b => {
    if (!stats.by_state[b.state]) {
      stats.by_state[b.state] = { count: 0, entitlement: 0, disbursed: 0 };
    }
    stats.by_state[b.state].count++;
    stats.by_state[b.state].entitlement += b.total_entitlement;
    stats.by_state[b.state].disbursed += b.disbursed_amount;
  });

  res.json({ beneficiaries: result, stats, statuses: RR_STATUSES });
});

// GET /api/rr/beneficiaries/:id - Single beneficiary full details
router.get('/beneficiaries/:id', (req, res) => {
  const parcelsMap = req.app.get('parcelsMap');
  if (parcelsMap) seedFromParcels(parcelsMap);

  const b = beneficiaries.find(x => x.id === Number(req.params.id));
  if (!b) return res.status(404).json({ error: 'Beneficiary not found' });
  res.json(b);
});

// PATCH /api/rr/beneficiaries/:id/disburse - Process a disbursement installment
router.patch('/beneficiaries/:id/disburse', (req, res) => {
  const parcelsMap = req.app.get('parcelsMap');
  if (parcelsMap) seedFromParcels(parcelsMap);

  const b = beneficiaries.find(x => x.id === Number(req.params.id));
  if (!b) return res.status(404).json({ error: 'Beneficiary not found' });

  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (amount > b.pending_amount) return res.status(400).json({ error: 'Amount exceeds pending balance' });

  b.disbursed_amount += amount;
  b.pending_amount -= amount;
  if (b.pending_amount <= 0) {
    b.rr_status = 'Fully Compensated';
    b.pending_amount = 0;
  } else {
    b.rr_status = 'Partial Disbursement';
  }

  const installment = b.disbursement_history.length + 1;
  b.disbursement_history.push({
    installment,
    amount,
    date: new Date().toISOString().split('T')[0],
    mode: req.body.mode || 'Direct Benefit Transfer (DBT)',
    voucher_no: `VCH-${b.parcel_id}-${installment}-${Date.now().toString(36)}`,
    status: 'Credited'
  });
  b.last_updated = new Date().toISOString();

  // Broadcast via socket
  const io = req.app.get('io');
  if (io) io.emit('rr_updated', { beneficiary: b });

  res.json(b);
});

// PATCH /api/rr/beneficiaries/:id/status - Update R&R status
router.patch('/beneficiaries/:id/status', (req, res) => {
  const parcelsMap = req.app.get('parcelsMap');
  if (parcelsMap) seedFromParcels(parcelsMap);

  const b = beneficiaries.find(x => x.id === Number(req.params.id));
  if (!b) return res.status(404).json({ error: 'Beneficiary not found' });

  if (req.body.status && RR_STATUSES.includes(req.body.status)) {
    b.rr_status = req.body.status;
  }
  if (req.body.grievance_status) {
    b.grievance_status = req.body.grievance_status;
  }
  b.last_updated = new Date().toISOString();

  const io = req.app.get('io');
  if (io) io.emit('rr_updated', { beneficiary: b });

  res.json(b);
});

// POST /api/rr/beneficiaries - Create new R&R compensation award / record
router.post('/beneficiaries', (req, res) => {
  const parcelsMap = req.app.get('parcelsMap');
  if (parcelsMap) seedFromParcels(parcelsMap);

  const {
    parcel_id, survey_no, land_name, ulpin, state, state_code, district, taluk, village,
    beneficiary_name, beneficiary_relation, aadhaar_masked, pan_masked,
    bank_account, bank_ifsc, bank_name,
    area_acres, land_use, market_rate_per_acre, market_value,
    multiplier_factor = 1.0, solatium_amount, additional_benefits = [],
    acquisition_purpose, acquiring_body, rehabilitation_package = []
  } = req.body;

  const totalBenefits = (additional_benefits || []).reduce((s, b) => s + Number(b.amount || 0), 0);
  const totalEntitlement = Number(market_value || 0) + Number(solatium_amount || 0) + totalBenefits;

  const newBeneficiary = {
    id: nextBeneficiaryId++,
    parcel_id: parcel_id ? Number(parcel_id) : (1000 + nextBeneficiaryId),
    survey_no: survey_no || `SRV-${nextBeneficiaryId}`,
    land_name: land_name || `Land Parcel ${survey_no || nextBeneficiaryId}`,
    ulpin: ulpin || `ULPIN-${state_code || 'IN'}-${Date.now().toString(36).toUpperCase()}`,
    state: state || 'Karnataka',
    state_code: state_code || 'KA',
    district: district || 'Central',
    taluk: taluk || 'Taluk-1',
    village: village || 'Gram-1',
    beneficiary_name: beneficiary_name || 'Beneficiary Name',
    beneficiary_relation: beneficiary_relation || 'Self / Land Owner',
    aadhaar_masked: aadhaar_masked || 'XXXX-XXXX-9999',
    pan_masked: pan_masked || 'XXXXX9999X',
    bank_account: bank_account || 'XXXX-XXXX-8888',
    bank_ifsc: bank_ifsc || 'SBIN0001234',
    bank_name: bank_name || 'State Bank of India',
    area_acres: Number(area_acres) || 1.0,
    area_sqm: Math.round((Number(area_acres) || 1.0) * 4046.86),
    land_use: land_use || 'Agricultural (Wet)',
    market_rate_per_acre: Number(market_rate_per_acre) || 2000000,
    market_value: Number(market_value) || 2000000,
    multiplier_factor: Number(multiplier_factor) || 1.0,
    solatium_amount: Number(solatium_amount) || Number(market_value || 2000000),
    additional_benefits: additional_benefits || [],
    total_entitlement: totalEntitlement,
    disbursed_amount: 0,
    pending_amount: totalEntitlement,
    acquisition_purpose: acquisition_purpose || 'National Highway Expansion (NHAI)',
    acquiring_body: acquiring_body || 'National Highways Authority of India',
    la_case_no: `LA/${state_code || 'KA'}/${(district || 'DIS').slice(0, 3).toUpperCase()}/2025/${String(9000 + nextBeneficiaryId).padStart(6, '0')}`,
    notification_date: new Date().toISOString().split('T')[0],
    award_date: new Date().toISOString().split('T')[0],
    rr_status: 'Award Declared (Sec 23)',
    disbursement_mode: 'Direct Benefit Transfer (DBT)',
    disbursement_history: [],
    grievance_status: 'No Grievance',
    grievances: [],
    rehabilitation_package: rehabilitation_package.length > 0 ? rehabilitation_package : [
      { benefit: 'Alternative Plot Allotment', status: 'Pending' },
      { benefit: 'Subsistence Allowance for 12 Months', status: 'Approved' },
      { benefit: 'Skill Training Assistance', status: 'Scheduled' }
    ],
    last_updated: new Date().toISOString()
  };

  beneficiaries.unshift(newBeneficiary);

  const io = req.app.get('io');
  if (io) io.emit('rr_updated', { beneficiary: newBeneficiary });

  res.status(201).json(newBeneficiary);
});

// POST /api/rr/batch-disburse - Disburse payments to multiple beneficiaries at once
router.post('/batch-disburse', (req, res) => {
  const parcelsMap = req.app.get('parcelsMap');
  if (parcelsMap) seedFromParcels(parcelsMap);

  const { items, mode = 'Direct Benefit Transfer (DBT)', percentage } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No beneficiaries specified for batch disbursement' });
  }

  const processed = [];
  const batchId = `BATCH-${Date.now().toString(36).toUpperCase()}`;

  items.forEach(item => {
    const b = beneficiaries.find(x => x.id === Number(item.id));
    if (!b || b.pending_amount <= 0) return;

    let amt = Number(item.amount);
    if (!amt && percentage) {
      amt = Math.min(b.pending_amount, Math.round(b.total_entitlement * (percentage / 100)));
    }
    if (!amt || amt <= 0) amt = Math.min(b.pending_amount, Math.round(b.pending_amount * 0.5));
    amt = Math.min(amt, b.pending_amount);

    b.disbursed_amount += amt;
    b.pending_amount -= amt;
    if (b.pending_amount <= 0) {
      b.rr_status = 'Fully Compensated';
      b.pending_amount = 0;
    } else {
      b.rr_status = 'Partial Disbursement';
    }

    const installment = b.disbursement_history.length + 1;
    b.disbursement_history.push({
      installment,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      mode: mode || 'Direct Benefit Transfer (DBT)',
      voucher_no: `PFMS-${batchId}-${b.id}-${installment}`,
      status: 'Credited'
    });
    b.last_updated = new Date().toISOString();
    processed.push({ id: b.id, beneficiary_name: b.beneficiary_name, disbursed: amt, remaining: b.pending_amount });
  });

  const io = req.app.get('io');
  if (io) io.emit('rr_updated', { batch: true, count: processed.length });

  res.json({
    success: true,
    batch_id: batchId,
    processed_count: processed.length,
    total_disbursed: processed.reduce((s, p) => s + p.disbursed, 0),
    items: processed
  });
});

// POST /api/rr/beneficiaries/:id/grievance - File an objection or dispute
router.post('/beneficiaries/:id/grievance', (req, res) => {
  const parcelsMap = req.app.get('parcelsMap');
  if (parcelsMap) seedFromParcels(parcelsMap);

  const b = beneficiaries.find(x => x.id === Number(req.params.id));
  if (!b) return res.status(404).json({ error: 'Beneficiary not found' });

  const { type, description, complainant_name, complainant_contact } = req.body;
  if (!b.grievances) b.grievances = [];

  const grievanceRecord = {
    id: `GRV-${b.id}-${b.grievances.length + 1}-${Date.now().toString(36)}`,
    type: type || 'Valuation Dispute (Section 64)',
    description: description || 'Objection raised regarding land measurement / compensation rate',
    complainant_name: complainant_name || b.beneficiary_name,
    complainant_contact: complainant_contact || '',
    filed_date: new Date().toISOString().split('T')[0],
    status: 'Hearing Scheduled',
    resolution_notes: ''
  };

  b.grievances.unshift(grievanceRecord);
  b.grievance_status = 'Objection Pending';
  b.rr_status = 'Objection Filed';
  b.last_updated = new Date().toISOString();

  const io = req.app.get('io');
  if (io) io.emit('rr_updated', { beneficiary: b });

  res.status(201).json({ beneficiary: b, grievance: grievanceRecord });
});

// PATCH /api/rr/beneficiaries/:id/grievance-status - Resolve or update grievance
router.patch('/beneficiaries/:id/grievance-status', (req, res) => {
  const parcelsMap = req.app.get('parcelsMap');
  if (parcelsMap) seedFromParcels(parcelsMap);

  const b = beneficiaries.find(x => x.id === Number(req.params.id));
  if (!b) return res.status(404).json({ error: 'Beneficiary not found' });

  const { status, remarks, additional_amount } = req.body;
  b.grievance_status = status === 'Resolved' ? 'No Grievance' : status;
  if (status === 'Resolved') {
    b.rr_status = b.pending_amount === 0 ? 'Fully Compensated' : 'Partial Disbursement';
    if (additional_amount && Number(additional_amount) > 0) {
      const extra = Number(additional_amount);
      b.total_entitlement += extra;
      b.pending_amount += extra;
      b.additional_benefits.push({ type: 'Grievance Award Revision', amount: extra });
    }
  }

  if (b.grievances && b.grievances.length > 0) {
    b.grievances[0].status = status;
    b.grievances[0].resolution_notes = remarks || 'Case resolved by Competent Authority';
    b.grievances[0].resolved_date = new Date().toISOString().split('T')[0];
  }

  b.last_updated = new Date().toISOString();

  const io = req.app.get('io');
  if (io) io.emit('rr_updated', { beneficiary: b });

  res.json(b);
});

// ── Field Surveyor Routes ─────────────────────────────────────────────────────

// POST /api/rr/field-surveys - Submit a field verification
router.post('/field-surveys', (req, res) => {
  const parcelsMap = req.app.get('parcelsMap');
  if (parcelsMap) seedFromParcels(parcelsMap);

  const {
    parcel_id, survey_no, gps_lat, gps_lng, gps_accuracy,
    boundary_status, land_use_observed, structure_present,
    encroachment_detected, soil_type, water_source,
    photos_count, field_notes, surveyor_name,
    // Enhanced fields
    trees_count, wells_count, structures_data, boundary_markers,
    photo_urls, witness_name, surveyor_signature
  } = req.body;

  // Try to look up actual parcel data
  let parcel = null;
  if (parcelsMap && parcel_id) {
    parcel = parcelsMap.get(Number(parcel_id));
  }
  if (!parcel && parcelsMap && survey_no) {
    parcel = [...parcelsMap.values()].find(p =>
      p.properties.survey_no.toLowerCase() === survey_no.toLowerCase()
    );
  }

  const survey = {
    id: nextSurveyId++,
    parcel_id: parcel ? parcel.id : null,
    survey_no: parcel ? parcel.properties.survey_no : (survey_no || 'Unknown'),
    land_name: parcel ? parcel.properties.land_name : 'Unlinked Parcel',
    ulpin: parcel ? parcel.properties.ulpin : null,
    owner_name: parcel ? parcel.properties.owner_name : null,
    state: parcel ? parcel.properties.state : null,
    district: parcel ? parcel.properties.district : null,
    village: parcel ? parcel.properties.village : null,
    // GPS data
    gps_lat: Number(gps_lat) || null,
    gps_lng: Number(gps_lng) || null,
    gps_accuracy: gps_accuracy || null,
    // Verification fields
    boundary_status: boundary_status || 'Not Verified',
    land_use_observed: land_use_observed || '',
    structure_present: structure_present || 'None',
    encroachment_detected: Boolean(encroachment_detected),
    soil_type: soil_type || '',
    water_source: water_source || '',
    photos_count: Number(photos_count) || 0,
    field_notes: field_notes || '',
    // Detailed enumeration
    trees_count: Number(trees_count) || 0,
    wells_count: Number(wells_count) || 0,
    structures_data: structures_data || null,
    boundary_markers: boundary_markers || { north: 'Intact', south: 'Intact', east: 'Intact', west: 'Intact' },
    photo_urls: photo_urls || [],
    witness_name: witness_name || 'Village Administrative Officer / Panchayat Rep',
    surveyor_signature: surveyor_signature || 'Digitally Certified by Field Surveyor',
    // Meta
    surveyor_name: surveyor_name || 'Field Surveyor',
    verification_status: 'Submitted',
    submitted_at: new Date().toISOString(),
    synced: true
  };

  // If encroachment is detected, update the corresponding parcel in parcelsMap!
  if (parcel && survey.encroachment_detected) {
    parcel.properties.status = 'Disputed';
    parcel.properties.last_updated = new Date().toISOString();
    parcelsMap.set(parcel.id, parcel);

    const io = req.app.get('io');
    if (io) {
      io.emit('parcel_updated', {
        feature: parcel,
        log: {
          id: Date.now(),
          parcel_id: parcel.id,
          action: 'FLAGGED_ENCROACHMENT',
          old_status: 'Under Acquisition',
          new_status: 'Disputed',
          actor: survey.surveyor_name,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  fieldSurveys.unshift(survey);

  // Broadcast
  const io = req.app.get('io');
  if (io) io.emit('survey_submitted', { survey });

  res.status(201).json(survey);
});

// GET /api/rr/field-surveys - List all submitted field surveys
router.get('/field-surveys', (req, res) => {
  const parcelsMap = req.app.get('parcelsMap');
  if (parcelsMap) seedFromParcels(parcelsMap);

  let result = [...fieldSurveys];
  if (req.query.state && req.query.state !== 'All') {
    result = result.filter(s => s.state === req.query.state);
  }
  if (req.query.status && req.query.status !== 'All') {
    result = result.filter(s => s.verification_status === req.query.status);
  }
  res.json({
    surveys: result,
    stats: {
      total: fieldSurveys.length,
      verified: fieldSurveys.filter(s => s.verification_status === 'Verified').length,
      submitted: fieldSurveys.filter(s => s.verification_status === 'Submitted').length,
      flagged: fieldSurveys.filter(s => s.encroachment_detected).length
    }
  });
});

// PATCH /api/rr/field-surveys/:id/verify - Approve/reject field verification
router.patch('/field-surveys/:id/verify', (req, res) => {
  const survey = fieldSurveys.find(s => s.id === Number(req.params.id));
  if (!survey) return res.status(404).json({ error: 'Survey not found' });

  survey.verification_status = req.body.status || 'Verified';
  survey.verified_by = req.body.verified_by || 'Revenue Inspector';
  survey.verified_at = new Date().toISOString();

  // If verified and survey had linked parcel, update parcel status to Acquired / Verified
  const parcelsMap = req.app.get('parcelsMap');
  if (parcelsMap && survey.parcel_id && survey.verification_status === 'Verified') {
    const parcel = parcelsMap.get(survey.parcel_id);
    if (parcel && !survey.encroachment_detected) {
      parcel.properties.status = 'Acquired';
      parcel.properties.last_updated = new Date().toISOString();
      parcelsMap.set(parcel.id, parcel);
      const io = req.app.get('io');
      if (io) io.emit('parcel_updated', { feature: parcel });
    }
  }

  const io = req.app.get('io');
  if (io) io.emit('survey_verified', { survey });

  res.json(survey);
});

// GET /api/rr/parcels-for-survey - Get parcel list for surveyor lookup
router.get('/parcels-for-survey', (req, res) => {
  const parcelsMap = req.app.get('parcelsMap');
  if (!parcelsMap) return res.json([]);

  const search = (req.query.search || '').toLowerCase();
  let parcels = [...parcelsMap.values()].map(p => ({
    id: p.id,
    survey_no: p.properties.survey_no,
    land_name: p.properties.land_name,
    ulpin: p.properties.ulpin,
    owner_name: p.properties.owner_name,
    state: p.properties.state,
    district: p.properties.district,
    village: p.properties.village,
    status: p.properties.status,
    area_acres: p.properties.area_acres,
    land_use: p.properties.land_use,
    centroid_lat: (p.geometry.coordinates[0][0][1] + p.geometry.coordinates[0][2][1]) / 2,
    centroid_lng: (p.geometry.coordinates[0][0][0] + p.geometry.coordinates[0][2][0]) / 2
  }));

  if (search) {
    parcels = parcels.filter(p =>
      p.survey_no.toLowerCase().includes(search) ||
      p.land_name.toLowerCase().includes(search) ||
      p.ulpin.toLowerCase().includes(search) ||
      p.owner_name.toLowerCase().includes(search)
    );
  }

  res.json(parcels.slice(0, 50));
});

module.exports = router;

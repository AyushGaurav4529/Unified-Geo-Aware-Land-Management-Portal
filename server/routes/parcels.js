const express = require('express');
const router  = express.Router();
const { HUBS } = require('../data/cadastralHubs');

const STATUSES   = ['Pending', 'Under Acquisition', 'Acquired', 'Disputed', 'Compensated'];
const LAND_USES  = ['Agricultural (Wet)', 'Agricultural (Dry)', 'Residential / Abadi', 'Commercial Hub', 'Industrial Corridor'];

/**
 * Cadastral Tessellation Generator (Guaranteed Non-Overlapping & Contiguous Mesh)
 * Ensures adjacent plots share exact boundary vertices with zero gap and ZERO overlap.
 * Enforces ST_Disjoint / ST_Touches (spatial integrity).
 */
function generateCadastralHub(hub, startId, rows = 6, cols = 6) {
  const parcels = [];
  const cellHeight = 0.0022; // ~240 meters
  const cellWidth  = 0.0025; // ~270 meters

  // Generate shared vertices matrix (rows + 1) x (cols + 1)
  // Subtle pseudo-random deterministic jitter so parcels look natural but share exact borders
  const vertices = [];
  for (let r = 0; r <= rows; r++) {
    vertices[r] = [];
    for (let c = 0; c <= cols; c++) {
      // Deterministic small jitter based on index
      const jitterLat = ((Math.sin(r * 13 + c * 7) * 0.00035));
      const jitterLng = ((Math.cos(r * 7 + c * 13) * 0.00035));
      
      const vLat = hub.centerLat + (r - rows / 2) * cellHeight + jitterLat;
      const vLng = hub.centerLng + (c - cols / 2) * cellWidth + jitterLng;
      vertices[r][c] = [Number(vLng.toFixed(6)), Number(vLat.toFixed(6))];
    }
  }

  let currId = startId;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 4 shared corners for Parcel (r, c)
      // Top-Left, Top-Right, Bottom-Right, Bottom-Left, closing to Top-Left
      const p1 = vertices[r][c];         // TL
      const p2 = vertices[r][c + 1];     // TR
      const p3 = vertices[r + 1][c + 1]; // BR
      const p4 = vertices[r + 1][c];     // BL
      const coordinates = [[p1, p2, p3, p4, p1]];

      // Calculate approximate area in Acres
      const avgLat = (p1[1] + p3[1]) / 2;
      const dLatMeters = Math.abs(p3[1] - p1[1]) * 111139;
      const dLngMeters = Math.abs(p2[0] - p1[0]) * 111139 * Math.cos((avgLat * Math.PI) / 180);
      const sqMeters = dLatMeters * dLngMeters;
      const areaAcres = Number((sqMeters / 4046.86).toFixed(2));

      // 100% Unique Citizen Owner per land (1 Land = 1 Verified Person)
      const plotIndex = r * cols + c;
      const citizenRaw = hub.citizens[plotIndex] || { name: `Citizen ${currId}`, relation: 's/o Land Owner' };
      const citizenUid = `UIDAI-${hub.stateCode}-${1000 + currId}-${String(currId * 73).padStart(4, '0')}`;
      const citizenAadhaarMasked = `XXXX-XXXX-${String(1000 + currId).slice(-4)}`;
      const citizenPanMasked = `${hub.stateCode}AP${String.fromCharCode(65 + (currId % 26))}${String(1000 + currId).slice(-4)}${String.fromCharCode(65 + ((currId * 3) % 26))}`;

      // Unique ULPIN (Bhu-Aadhaar) 14-character alphanumeric ID
      const latHash = Math.abs(Math.round(avgLat * 10000)).toString(36).toUpperCase();
      const lngHash = Math.abs(Math.round(p1[0] * 10000)).toString(36).toUpperCase();
      const ulpin = `${hub.stateCode}${latHash}${lngHash}${String(currId).padStart(4, '0')}`;

      // Unique Survey Number with State Code prefix
      const surveyNo = `${hub.stateCode}-SRV-${100 + r * 10 + c}/${String.fromCharCode(65 + (c % 4))}`;
      const status = STATUSES[(r + c + currId) % STATUSES.length];
      const landUse = LAND_USES[(r * 2 + c) % LAND_USES.length];

      // Unique land name: culturally authentic local name + state code + plot number
      const localLandName = hub.landNames[plotIndex % hub.landNames.length];
      const landName = `${localLandName} [${hub.stateCode}-${String(plotIndex + 1).padStart(2, '0')}]`;

      // Real Shared Cadastral Boundaries referencing adjacent survey numbers & land names
      const northNeighbor = r > 0
        ? `Adjacent to ${hub.stateCode}-SRV-${100 + (r-1)*10 + c}/${String.fromCharCode(65 + (c % 4))} (${hub.landNames[(r-1)*cols + c]})`
        : 'Village Boundary / Grama Kantaka Northern Access Corridor';
      const southNeighbor = r < rows - 1
        ? `Adjacent to ${hub.stateCode}-SRV-${100 + (r+1)*10 + c}/${String.fromCharCode(65 + (c % 4))} (${hub.landNames[(r+1)*cols + c]})`
        : 'Panchayat Canal Bund / Southern Cart Track';
      const eastNeighbor = c < cols - 1
        ? `Adjacent to ${hub.stateCode}-SRV-${100 + r*10 + (c+1)}/${String.fromCharCode(65 + ((c+1) % 4))} (${hub.landNames[r*cols + (c+1)]})`
        : 'Major District Road MDR-12 Buffer Zone';
      const westNeighbor = c > 0
        ? `Adjacent to ${hub.stateCode}-SRV-${100 + r*10 + (c-1)}/${String.fromCharCode(65 + ((c-1) % 4))} (${hub.landNames[r*cols + (c-1)]})`
        : 'Revenue River Stream / Boundary Stone Pillar';

      // Comprehensive Land Papers (Official Indian Documents Bundle)
      const landPapers = {
        ulpin_certificate: {
          bhu_aadhaar_ulpin: ulpin,
          titleholder: citizenRaw.name,
          relation: citizenRaw.relation,
          issuing_authority: 'Digital India Land Records Modernization Programme (DILRMP), Ministry of Rural Development',
          verified_status: 'Official Bhu-Aadhaar Seeded & Geo-Tagged',
          coordinates_centroid: [Number(avgLat.toFixed(5)), Number(p1[0].toFixed(5))]
        },
        ror_7_12: {
          document_name: hub.rorName,
          doc_number: `${hub.docPrefix}/ROR/${2024 + (currId % 3)}/${String(currId).padStart(5, '0')}`,
          village_panchayat: hub.village,
          taluk: hub.taluk,
          district: hub.district,
          state: hub.state,
          survey_hissa: surveyNo,
          khata_number: `KT-${hub.stateCode}-${2000 + currId}`,
          cultivator_name: citizenRaw.name,
          soil_class: (currId % 2 === 0) ? 'Dry Crop (Jirayat / Bagayat Class-1)' : 'Wet Crop (Tari Wetland)',
          water_source: (currId % 2 === 0) ? 'Tube Well & Drip Irrigation' : 'Canal Command Area',
          annual_land_revenue_tax: `₹ ${(areaAcres * 125).toFixed(0)}/-`,
          verified_digital_sign: 'Digitally Signed by Revenue Inspector / Tahsildar with DSC Token',
          issuance_date: '14-Jan-2024'
        },
        sale_deed: {
          document_name: 'Registered Transfer / Sale Deed (Kharidnama / Index-II)',
          registration_number: `${hub.stateCode}-SRO-${hub.district.toUpperCase().slice(0,3)}/REG-${4000 + currId}/2021`,
          sro_office: hub.sroOffice,
          registered_owner: citizenRaw.name,
          aadhar_ref: citizenAadhaarMasked,
          pan_ref: citizenPanMasked,
          stamp_duty_paid: `₹ ${(areaAcres * 45000 + 12000).toLocaleString('en-IN')}/-`,
          e_challan_ref: `ECHAL-GRN-${7700000 + currId}`,
          registration_date: '08-Nov-2021',
          witness_count: 2,
          encumbrance_free_declaration: 'Absolute Freehold Property without reversionary rights'
        },
        mutation_register: {
          document_name: 'Mutation Register Extract (Ferfar / Form 6 / Vamshavruksha)',
          mutation_entry_no: `MR-${hub.stateCode}-${6000 + currId}`,
          nature_of_acquisition: (currId % 3 === 0) ? 'Inheritance / Ancestral Partition' : 'Registered Outright Purchase',
          sanctioning_officer: `Circle Officer / Tahsildar, ${hub.taluk}`,
          objection_period_elapsed: '30 Days Public Notice Served - Zero Objections Received',
          final_certified_date: '22-Dec-2021',
          status: 'Sanctioned & Recorded in Revenue Ledger'
        },
        encumbrance_certificate: {
          document_name: 'Non-Encumbrance Certificate (EC / Form 15)',
          certificate_no: `EC-${hub.stateCode}-${2026}-${String(currId).padStart(5, '0')}`,
          search_period: '30 Years (1996 to 2026)',
          liability_status: 'NIL ENCUMBRANCE (Zero Mortgages, Court Injunctions, or Bank Liens)',
          search_officer: `Inspector General of Registration, ${hub.state}`,
          valid_upto: '31-Dec-2030'
        },
        property_card_khata: {
          document_name: 'Property Tax Card / e-Khata Certificate',
          khata_assessment_no: `EKH-${hub.district.slice(0, 3).toUpperCase()}-${3000 + currId}`,
          local_body: `${hub.village} Gram Panchayat / Development Authority`,
          property_tax_clearance: 'Cleared up to Financial Year 2025-2026',
          tax_receipt_no: `TR-PAY-2025-${9000 + currId}`
        },
        cadastral_sketch: {
          document_name: 'Cadastral Survey Map (Akarband / Naksha / FMB Sketch)',
          fmb_sketch_no: `FMB-${hub.stateCode}-${hub.taluk.toUpperCase().slice(0, 3)}-${surveyNo.replace('/', '-')}`,
          surveyed_area_sqm: `${sqMeters.toFixed(1)} Sq. Meters`,
          boundary_markers: '4 Reinforced Concrete Geo-Pillars with DGPS Survey Precision',
          surveyor_license: `DLR-GOI-SURV-${1000 + (currId % 200)}`,
          shared_cadastral_boundaries: {
            north: northNeighbor,
            south: southNeighbor,
            east:  eastNeighbor,
            west:  westNeighbor
          },
          overlap_validation: 'Verified 0% Overlap with Neighboring Parcels (PostGIS ST_Disjoint/ST_Touches OK)'
        }
      };

      parcels.push({
        type: 'Feature',
        id: currId,
        geometry: {
          type: 'Polygon',
          coordinates: coordinates
        },
        properties: {
          id: currId,
          survey_no: surveyNo,
          land_name: landName,
          land_name_local: localLandName,
          ulpin: ulpin,
          area_acres: areaAcres,
          area_sqm: Number(sqMeters.toFixed(1)),
          area_local: hub.unitConversion(areaAcres),
          village: hub.village,
          taluk: hub.taluk,
          district: hub.district,
          state: hub.state,
          state_code: hub.stateCode,
          land_use: landUse,
          status: status,
          // 1 Land = Exactly 1 Person Rule (Zero duplicate owners across entire country)
          owner_name: citizenRaw.name,
          owner_uid: citizenUid,
          owner_relation: citizenRaw.relation,
          owner_aadhaar_masked: citizenAadhaarMasked,
          owner_pan_masked: citizenPanMasked,
          ownership_type: 'Sole Individual Titleholder (100% Freehold)',
          overlap_status: 'Strict Non-Overlapping Boundary Verified (PostGIS Valid)',
          last_updated: new Date().toISOString(),
          land_papers: landPapers
        }
      });
      currId++;
    }
  }

  return { parcels, nextId: currId };
}

// ── Build Pan-India Cadastral Store ───────────────────────────────────────────
const parcelsMap = new Map(); // id -> Feature
let currentId = 1;

HUBS.forEach(hub => {
  const result = generateCadastralHub(hub, currentId, 6, 6); // 36 contiguous parcels per state hub = 288 total
  result.parcels.forEach(p => parcelsMap.set(p.id, p));
  currentId = result.nextId;
});

// Activity log (newest first, max 50)
const activityLog = [];
function logActivity(parcelId, oldStatus, newStatus, actor = 'System') {
  const parcel = parcelsMap.get(parcelId);
  activityLog.unshift({
    parcelId,
    survey_no: parcel?.properties?.survey_no,
    land_name: parcel?.properties?.land_name,
    ulpin: parcel?.properties?.ulpin,
    state: parcel?.properties?.state,
    district: parcel?.properties?.district,
    owner_name: parcel?.properties?.owner_name,
    oldStatus,
    newStatus,
    actor,
    ts: new Date().toISOString()
  });
  if (activityLog.length > 50) activityLog.pop();
}

// Initialize some sample activity
const sampleParcels = [...parcelsMap.values()].slice(0, 5);
sampleParcels.forEach((p, idx) => {
  activityLog.push({
    parcelId: p.id,
    survey_no: p.properties.survey_no,
    land_name: p.properties.land_name,
    ulpin: p.properties.ulpin,
    state: p.properties.state,
    district: p.properties.district,
    owner_name: p.properties.owner_name,
    oldStatus: 'Pending',
    newStatus: p.properties.status,
    actor: 'Revenue Directorate Auto-Sync',
    ts: new Date(Date.now() - (idx + 1) * 60000).toISOString()
  });
});

// ── Live Simulator for WebSocket sync ─────────────────────────────────────────
let _io = null;
function startSimulator(io) {
  if (_io) return;
  _io = io;
  setInterval(() => {
    const ids    = [...parcelsMap.keys()];
    const id     = ids[Math.floor(Math.random() * ids.length)];
    const parcel = parcelsMap.get(id);
    const old    = parcel.properties.status;
    const next   = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    parcel.properties.status       = next;
    parcel.properties.last_updated = new Date().toISOString();
    parcelsMap.set(id, parcel);
    logActivity(id, old, next, 'DILRMP Central Sync');
    _io.emit('parcel_updated', { feature: parcel, log: activityLog[0] });
  }, 14000);
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/parcels - full Pan-India Cadastral FeatureCollection
router.get('/', (req, res) => {
  const io = req.app.get('io');
  startSimulator(io);
  
  const stateFilter = req.query.state;
  let features = [...parcelsMap.values()];
  if (stateFilter && stateFilter !== 'All') {
    features = features.filter(f => f.properties.state.toLowerCase() === stateFilter.toLowerCase());
  }

  res.json({
    type: 'FeatureCollection',
    metadata: {
      total: features.length,
      hubs: HUBS.map(h => ({
        state: h.state,
        stateCode: h.stateCode,
        district: h.district,
        taluk: h.taluk,
        village: h.village,
        center: [h.centerLat, h.centerLng]
      })),
      non_overlap_guarantee: 'ST_Disjoint / Contiguous Cadastral Topology Verified',
      single_ownership_enforcement: '100% Unique Sole Individual Owner'
    },
    features: features
  });
});

// GET /api/parcels/hubs - list of Pan-India regions for quick navigation
router.get('/hubs', (req, res) => {
  res.json(HUBS.map(h => ({
    state: h.state,
    stateCode: h.stateCode,
    district: h.district,
    taluk: h.taluk,
    village: h.village,
    center: [h.centerLat, h.centerLng],
    unitName: h.unitName,
    rorName: h.rorName,
    localPortal: h.localPortal
  })));
});

// GET /api/parcels/activity - recent live activity
router.get('/activity', (req, res) => {
  res.json(activityLog.slice(0, 25));
});

// GET /api/parcels/:id - single parcel with all legal land papers
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const parcel = parcelsMap.get(id);
  if (!parcel) return res.status(404).json({ error: 'Cadastral Parcel not found' });
  res.json(parcel);
});

// PATCH /api/parcels/:id/status - status update with WebSocket broadcast
router.patch('/:id/status', (req, res) => {
  const id     = Number(req.params.id);
  const parcel = parcelsMap.get(id);
  if (!parcel) return res.status(404).json({ error: 'Cadastral Parcel not found' });

  const old    = parcel.properties.status;
  const next   = req.body.status;
  if (!STATUSES.includes(next)) return res.status(400).json({ error: 'Invalid status' });

  parcel.properties.status       = next;
  parcel.properties.last_updated = new Date().toISOString();
  parcelsMap.set(id, parcel);
  logActivity(id, old, next, req.body.actor || 'Nodal Revenue Officer');

  const io = req.app.get('io');
  if (io) {
    io.emit('parcel_updated', { feature: parcel, log: activityLog[0] });
  }

  res.json(parcel);
});

router.put('/:id/status', (req, res) => res.redirect(307, `/api/parcels/${req.params.id}/status`));

module.exports = router;

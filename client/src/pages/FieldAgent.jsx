import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, Typography, TextField, Button, Alert, Grid, Paper, Chip,
  IconButton, Tooltip, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Select, MenuItem, FormControl, InputLabel, InputAdornment,
  Switch, FormControlLabel, Snackbar, Tabs, Tab, Autocomplete, Badge,
  List, ListItem, ListItemText, ListItemIcon, Collapse, Stack, RadioGroup,
  Radio, FormLabel
} from '@mui/material';
import {
  MapContainer, TileLayer, Marker, Popup, useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  LocationOn, CameraAlt, Save, Sync, GpsFixed, Map, CheckCircle,
  Warning, Search, Terrain, WaterDrop, Home, Agriculture, ExpandMore,
  ExpandLess, MyLocation, PhotoCamera, NoteAdd, Wifi, WifiOff,
  CloudDone, CloudOff, Refresh, Assessment, Visibility, Flag,
  NavigateNext, Close, SyncProblem, Speed, Straighten, Landscape,
  Print, Directions, CloudUpload, Delete, Help,
  VerifiedUser, Park, House, Assignment, CheckBox, FactCheck
} from '@mui/icons-material';
import { getSocket } from '../services/socket';

const API = 'http://localhost:5000/api/rr';
const OFFLINE_STORAGE_KEY = 'dilrmp_offline_surveys_queue';

// Fix Leaflet marker icons with clean div icons
const surveyorIcon = L.divIcon({
  className: 'custom-surveyor-icon',
  html: `<div style="background-color:#0B1F5C;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-size:16px;">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

const parcelIcon = L.divIcon({
  className: 'custom-parcel-icon',
  html: `<div style="background-color:#10B981;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-size:16px;">🎯</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

// Helper component to center map smoothly
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 15, { animate: true });
    }
  }, [center, map]);
  return null;
}

// ── Calculate distance between two lat/lng points in meters ──────────────────
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ── Educational Mission & Purpose Dialog ────────────────────────────────────
function MissionGuideDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{
        fontWeight: 800, fontFamily: 'Plus Jakarta Sans', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid', borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FactCheck color="primary" />
          Field Surveyor App — Operational Role & Statutory Function
        </Box>
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} color="#0B1F5C" sx={{ mb: 1 }}>
          What is the Field Surveyor App?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The <strong>Field Surveyor App</strong> is the mobile/field-level ground-truth verification module for
          <strong> Patwaris, Revenue Inspectors, Cadastral Surveyors, and Competent Land Authorities (CALA)</strong> under the
          <strong> Digital India Land Records Modernization Programme (DILRMP)</strong>.
        </Typography>

        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#F0F9FF', borderColor: '#BAE6FD' }}>
          <Typography variant="subtitle2" fontWeight={800} color="#0369A1" sx={{ mb: 0.5 }}>
            Why is Ground-Truth Verification Critical?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Digitized satellite maps and GIS shapefiles can differ from on-ground realities due to unauthorized encroachments, shifted boundary stones, recent tree plantations, or unrecorded structures. The Field Surveyor App provides legally admissible physical proof before land is registered, mortgaged, or compensated under the LARR Act 2013.
          </Typography>
        </Paper>

        <Typography variant="subtitle1" fontWeight={800} color="#0B1F5C" sx={{ mb: 1.5 }}>
          Core Functions & Capabilities of this Module:
        </Typography>

        <Grid container spacing={2}>
          {[
            {
              title: '1. DGPS Boundary & Cadastral Demarcation',
              desc: 'Inspects and verifies physical boundary markers across North, South, East, and West boundaries to detect shifted or missing pillars.'
            },
            {
              title: '2. Encroachment & Squatter Detection',
              desc: 'Identifies unauthorized construction, illegal farming, or overlapping fences. Submitting an encroachment automatically marks the parcel as "Disputed" across the portal.'
            },
            {
              title: '3. Asset Enumeration for R&R Valuation',
              desc: 'Counts standing fruit-bearing/timber trees, operational borewells, and residential/commercial structures, which directly feeds into the LARR 2013 Compensation Award.'
            },
            {
              title: '4. Offline-First Resilience (Zero Signal Tolerance)',
              desc: 'Surveyors in remote areas can record complete verification dossiers locally in browser storage. Queued surveys auto-sync when network connectivity returns.'
            },
            {
              title: '5. Geo-tagged & Timestamped Evidence Watermarking',
              desc: 'Attaches physical photographs watermarked with device GPS latitude/longitude, date, and surveyor ID as legal evidence.'
            },
            {
              title: '6. Official Panchnama (Form 3) Generation',
              desc: 'Generates printable, digitally verified Panchnama inspection certificates signed by the surveyor and local panchayat witnesses.'
            }
          ].map((item, idx) => (
            <Grid item xs={12} sm={6} key={idx}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle2" fontWeight={700} color="#0B1F5C" sx={{ mb: 0.5 }}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button variant="contained" onClick={onClose} sx={{ borderRadius: 2 }}>Close Guide</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Field Agent Component ──────────────────────────────────────────────
const FieldAgent = () => {
  const [tab, setTab] = useState(0);

  // Form state
  const [parcelSearch, setParcelSearch] = useState('');
  const [parcelOptions, setParcelOptions] = useState([]);
  const [selectedParcel, setSelectedParcel] = useState(null);

  // GPS state
  const [gpsLat, setGpsLat] = useState('');
  const [gpsLng, setGpsLng] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Cardinal boundary markers
  const [markerNorth, setMarkerNorth] = useState('Intact');
  const [markerSouth, setMarkerSouth] = useState('Intact');
  const [markerEast, setMarkerEast] = useState('Intact');
  const [markerWest, setMarkerWest] = useState('Intact');
  const [boundaryStatus, setBoundaryStatus] = useState('Intact');

  // Land condition & Encroachment
  const [landUseObserved, setLandUseObserved] = useState('');
  const [encroachment, setEncroachment] = useState(false);
  const [encroachmentType, setEncroachmentType] = useState('Unauthorized Construction');
  const [encroachedArea, setEncroachedArea] = useState('');
  const [soilType, setSoilType] = useState('');
  const [waterSource, setWaterSource] = useState('');

  // Standing Assets Enumeration (for R&R)
  const [treesCount, setTreesCount] = useState(0);
  const [wellsCount, setWellsCount] = useState(0);
  const [structurePresent, setStructurePresent] = useState('None');
  const [structureSqft, setStructureSqft] = useState('');

  // Documentation & Attestation
  const [photosCount, setPhotosCount] = useState(1);
  const [photoUrls, setPhotoUrls] = useState([
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop&q=60'
  ]);
  const [fieldNotes, setFieldNotes] = useState('');
  const [surveyorName, setSurveyorName] = useState('S. Venkatesh (Patwari #442)');
  const [witnessName, setWitnessName] = useState('R. Gowda (Village Panchayat Member)');

  // Survey history & stats
  const [surveys, setSurveys] = useState([]);
  const [surveyStats, setSurveyStats] = useState({});
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // Load offline queue from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(OFFLINE_STORAGE_KEY);
      if (saved) {
        setOfflineQueue(JSON.parse(saved));
      }
    } catch {
      // ignore json parse errors
    }
  }, []);

  // Save offline queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(offlineQueue));
    } catch {
      // storage full or disabled
    }
  }, [offlineQueue]);

  // Fetch parcel suggestions
  useEffect(() => {
    if (!parcelSearch || parcelSearch.length < 2) {
      setParcelOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/parcels-for-survey?search=${encodeURIComponent(parcelSearch)}`);
        const data = await res.json();
        setParcelOptions(data || []);
      } catch {
        setParcelOptions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [parcelSearch]);

  // Fetch survey history
  const fetchSurveys = useCallback(async () => {
    try {
      const res = await fetch(`${API}/field-surveys`);
      const data = await res.json();
      setSurveys(data.surveys || []);
      setSurveyStats(data.stats || {});
    } catch (err) {
      console.error('Survey fetch error:', err);
    }
  }, []);

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

  // Real-time socket updates
  useEffect(() => {
    const socket = getSocket();
    const handler = (data) => {
      if (data.survey) {
        setSurveys(prev => {
          const exists = prev.find(s => s.id === data.survey.id);
          if (exists) return prev.map(s => s.id === data.survey.id ? data.survey : s);
          return [data.survey, ...prev];
        });
        fetchSurveys();
      }
    };
    socket.on('survey_submitted', handler);
    socket.on('survey_verified', handler);
    return () => {
      socket.off('survey_submitted', handler);
      socket.off('survey_verified', handler);
    };
  }, [fetchSurveys]);

  // Auto-fill from selected parcel
  useEffect(() => {
    if (selectedParcel) {
      setLandUseObserved(selectedParcel.land_use || 'Agricultural (Wet)');
      // Pre-fill GPS from parcel centroid if surveyor hasn't acquired device GPS
      if (!gpsLat && selectedParcel.centroid_lat) {
        setGpsLat(selectedParcel.centroid_lat.toFixed(6));
        setGpsLng(selectedParcel.centroid_lng.toFixed(6));
        setGpsAccuracy('Parcel Centroid (Reference)');
      }
    }
  }, [selectedParcel, gpsLat]);

  // Capture device GPS
  const captureGps = () => {
    if (!navigator.geolocation) {
      setSnack({ open: true, message: 'Geolocation is not supported by this browser', severity: 'error' });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(pos.coords.latitude.toFixed(6));
        setGpsLng(pos.coords.longitude.toFixed(6));
        setGpsAccuracy(Math.round(pos.coords.accuracy).toString());
        setGpsLoading(false);
        setSnack({ open: true, message: `Device GPS fix locked: ±${Math.round(pos.coords.accuracy)}m accuracy`, severity: 'success' });
      },
      (err) => {
        setGpsLoading(false);
        if (selectedParcel?.centroid_lat) {
          setGpsLat(selectedParcel.centroid_lat.toFixed(6));
          setGpsLng(selectedParcel.centroid_lng.toFixed(6));
          setGpsAccuracy('Parcel Centroid');
          setSnack({ open: true, message: 'Device GPS unavailable — Applied parcel centroid coordinates', severity: 'info' });
        } else {
          setSnack({ open: true, message: `GPS error: ${err.message}. Enter coordinates manually.`, severity: 'warning' });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Submit Survey
  const handleSubmit = async () => {
    if (!selectedParcel && !parcelSearch) {
      setSnack({ open: true, message: 'Please select or enter a parcel survey number', severity: 'warning' });
      return;
    }

    setSubmitting(true);
    const payload = {
      parcel_id: selectedParcel?.id || null,
      survey_no: selectedParcel?.survey_no || parcelSearch,
      land_name: selectedParcel?.land_name || `Parcel ${parcelSearch}`,
      gps_lat: gpsLat,
      gps_lng: gpsLng,
      gps_accuracy: gpsAccuracy,
      boundary_status: boundaryStatus,
      boundary_markers: {
        north: markerNorth,
        south: markerSouth,
        east: markerEast,
        west: markerWest
      },
      land_use_observed: landUseObserved,
      structure_present: structurePresent,
      structures_data: structurePresent !== 'None' ? { type: structurePresent, carpet_sqft: structureSqft } : null,
      encroachment_detected: encroachment,
      soil_type: soilType || 'Alluvial',
      water_source: waterSource || 'Borewell',
      trees_count: Number(treesCount),
      wells_count: Number(wellsCount),
      photos_count: photosCount,
      photo_urls: photoUrls,
      field_notes: fieldNotes || `Boundary stones verified. Encroachment: ${encroachment ? 'Yes (' + encroachmentType + ')' : 'No'}. Standing trees: ${treesCount}. Structures: ${structurePresent}.`,
      surveyor_name: surveyorName || 'Field Surveyor',
      witness_name: witnessName
    };

    if (!navigator.onLine) {
      // Save locally
      const queued = { ...payload, id: `OFFLINE-${Date.now()}`, queued_at: new Date().toISOString(), synced: false };
      setOfflineQueue(prev => [queued, ...prev]);
      setSnack({ open: true, message: 'Offline Mode: Survey saved to local device queue. Will auto-sync when online.', severity: 'info' });
      resetForm();
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API}/field-surveys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSnack({
          open: true,
          message: encroachment
            ? `Survey #${data.id} submitted! Parcel auto-flagged as Disputed due to Encroachment.`
            : `Survey #${data.id} verified and synchronized successfully!`,
          severity: encroachment ? 'warning' : 'success'
        });
        resetForm();
        fetchSurveys();
      } else {
        setSnack({ open: true, message: data.error || 'Submission failed', severity: 'error' });
      }
    } catch {
      // Auto queue on network error
      const queued = { ...payload, id: `OFFLINE-${Date.now()}`, queued_at: new Date().toISOString(), synced: false };
      setOfflineQueue(prev => [queued, ...prev]);
      setSnack({ open: true, message: 'Network interrupted. Saved safely to local device storage.', severity: 'warning' });
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  // Sync Offline Queue
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    let synced = 0;
    const remaining = [];
    for (const item of offlineQueue) {
      try {
        const res = await fetch(`${API}/field-surveys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        if (res.ok) synced++;
        else remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }
    setOfflineQueue(remaining);
    if (synced > 0) {
      setSnack({ open: true, message: `Synced ${synced} offline survey reports to national server!`, severity: 'success' });
      fetchSurveys();
    }
  };

  const resetForm = () => {
    setSelectedParcel(null);
    setParcelSearch('');
    setGpsLat(''); setGpsLng(''); setGpsAccuracy('');
    setBoundaryStatus('Intact');
    setMarkerNorth('Intact'); setMarkerSouth('Intact'); setMarkerEast('Intact'); setMarkerWest('Intact');
    setLandUseObserved(''); setStructurePresent('None'); setStructureSqft('');
    setEncroachment(false); setTreesCount(0); setWellsCount(0);
    setSoilType(''); setWaterSource(''); setFieldNotes('');
  };

  // Review & Approve Survey (Inspector role)
  const handleVerifySurvey = async (surveyId, status) => {
    try {
      const res = await fetch(`${API}/field-surveys/${surveyId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, verified_by: 'Revenue Inspector (DILRMP)' })
      });
      if (res.ok) {
        setSnack({ open: true, message: `Survey #${surveyId} status marked as "${status}"`, severity: 'success' });
        fetchSurveys();
      }
    } catch {
      setSnack({ open: true, message: 'Failed to update survey review status', severity: 'error' });
    }
  };

  // Print Legal Panchnama Certificate
  const handlePrintPanchnama = (s) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Field Panchnama - Survey ${s.survey_no}</title>
      <style>
        body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 30px auto; padding: 25px; color: #111; line-height: 1.4; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { font-size: 15pt; margin: 4px 0; text-transform: uppercase; }
        .header h2 { font-size: 11pt; margin: 3px 0; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        td, th { border: 1px solid #666; padding: 6px 10px; font-size: 9.5pt; text-align: left; }
        th { background: #f3f3f3; font-weight: bold; }
        .encroach-alert { border: 2px solid red; background: #ffebeb; padding: 8px; font-weight: bold; text-align: center; margin: 15px 0; color: #900; }
        .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 9.5pt; }
        .sig { width: 30%; text-align: center; border-top: 1px solid #333; padding-top: 5px; }
        @media print { body { margin: 0; } }
      </style></head><body>
        <div class="header">
          <h2>भारत सरकार • GOVERNMENT OF INDIA</h2>
          <h2>REVENUE DEPARTMENT • LAND RECORDS MODERNIZATION PROGRAMME</h2>
          <h1>CADASTRAL FIELD VERIFICATION PANCHNAMA (FORM 3)</h1>
          <h2>Ground-Truth Spot Inspection & Demarcation Certificate</h2>
          <p>Inspection Report ID: <strong>DILRMP-SRV-${s.id}</strong> • Date: <strong>${new Date(s.submitted_at).toLocaleDateString('en-IN')}</strong></p>
        </div>

        <table>
          <tr><th colspan="2">1. LAND RECORD IDENTIFIERS</th></tr>
          <tr><td width="35%"><strong>Survey Number</strong></td><td>${s.survey_no}</td></tr>
          <tr><td><strong>Land Parcel Name</strong></td><td>${s.land_name || 'N/A'}</td></tr>
          <tr><td><strong>ULPIN (Bhu-Aadhaar)</strong></td><td>${s.ulpin || 'Pending Generation'}</td></tr>
          <tr><td><strong>Recorded Owner</strong></td><td>${s.owner_name || 'Record Verification Pending'}</td></tr>
          <tr><td><strong>Location</strong></td><td>Village: ${s.village || 'Shivapura'}, District: ${s.district || 'Tumkur'}, State: ${s.state || 'Karnataka'}</td></tr>
        </table>

        <table>
          <tr><th colspan="2">2. SATELLITE & GPS GEODETIC FIX</th></tr>
          <tr><td width="35%"><strong>Latitude & Longitude</strong></td><td>${s.gps_lat ? `${s.gps_lat}° N, ${s.gps_lng}° E` : 'Not Captured'}</td></tr>
          <tr><td><strong>GPS Positional Accuracy</strong></td><td>±${s.gps_accuracy || '15'} meters</td></tr>
          <tr><td><strong>Overall Boundary Condition</strong></td><td>${s.boundary_status}</td></tr>
          <tr><td><strong>Cardinal Markers</strong></td><td>North: ${s.boundary_markers?.north || 'Intact'} | South: ${s.boundary_markers?.south || 'Intact'} | East: ${s.boundary_markers?.east || 'Intact'} | West: ${s.boundary_markers?.west || 'Intact'}</td></tr>
        </table>

        ${s.encroachment_detected ? `
          <div class="encroach-alert">
            ⚠️ WARNING: ILLEGAL ENCROACHMENT / BOUNDARY VIOLATION DETECTED ON GROUND.<br/>
            Land Parcel flagged for formal dispute inquiry under Section 144 / Revenue Code.
          </div>
        ` : `
          <p style="text-align:center;color:green;font-weight:bold;margin:10px 0;">✓ NO ENCROACHMENT OBSERVED. BOUNDARY ALIGNMENT CONFIRMED WITH CADASTRAL SHEET.</p>
        `}

        <table>
          <tr><th colspan="2">3. IMMOVABLE ASSETS & GROUND AUDIT (FOR R&R ENTITLEMENT)</th></tr>
          <tr><td width="35%"><strong>Observed Land Use</strong></td><td>${s.land_use_observed || 'Agricultural'}</td></tr>
          <tr><td><strong>Standing Trees (Timber / Fruit)</strong></td><td>${s.trees_count || 0} Trees Counted</td></tr>
          <tr><td><strong>Water Assets (Wells / Borewells)</strong></td><td>${s.wells_count || 0} Operational Source(s)</td></tr>
          <tr><td><strong>Structures Present</strong></td><td>${s.structure_present}</td></tr>
          <tr><td><strong>Soil & Water Condition</strong></td><td>Soil: ${s.soil_type || 'Alluvial'} | Source: ${s.water_source || 'Borewell'}</td></tr>
          <tr><td><strong>Surveyor Field Observations</strong></td><td>${s.field_notes || 'All physical monuments verified in presence of village witnesses.'}</td></tr>
        </table>

        <div class="footer">
          <div class="sig">
            <strong>${s.surveyor_name}</strong><br/>
            Field Revenue Surveyor / Patwari
          </div>
          <div class="sig">
            <strong>${s.witness_name || 'Village Panch Witness'}</strong><br/>
            Gram Panchayat Attestation
          </div>
          <div class="sig">
            <strong>Revenue Inspector / CALA</strong><br/>
            Official Stamp & Seal
          </div>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Distance from surveyor GPS to parcel centroid
  const parcelDistance = (selectedParcel?.centroid_lat && gpsLat)
    ? calculateDistanceMeters(Number(gpsLat), Number(gpsLng), selectedParcel.centroid_lat, selectedParcel.centroid_lng)
    : null;

  const currentMapCenter = selectedParcel?.centroid_lat
    ? [selectedParcel.centroid_lat, selectedParcel.centroid_lng]
    : gpsLat
    ? [Number(gpsLat), Number(gpsLng)]
    : [13.332, 77.100]; // Default Tumkur

  return (
    <Box>
      {/* Top Header & Purpose Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Plus Jakarta Sans', color: '#0B1F5C' }}>
            Field Surveyor App
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mobile-first ground-truth cadastral inspection & asset enumeration tool — Operates offline with automated central synchronization
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button variant="outlined" color="primary" startIcon={<Help />} onClick={() => setGuideOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 600 }}>
            Surveyor Handbook & Mission
          </Button>
          <Chip
            icon={navigator.onLine ? <Wifi sx={{ fontSize: 16 }} /> : <WifiOff sx={{ fontSize: 16 }} />}
            label={navigator.onLine ? 'Online • Live Sync' : 'Offline • Local Queue'}
            color={navigator.onLine ? 'success' : 'warning'}
            variant="outlined" sx={{ fontWeight: 700 }}
          />
          {offlineQueue.length > 0 && (
            <Tooltip title={`${offlineQueue.length} surveys waiting in local device storage`}>
              <Badge badgeContent={offlineQueue.length} color="error">
                <Button size="small" variant="contained" color="warning" onClick={syncOfflineQueue} startIcon={<Sync />}>
                  Sync Queue
                </Button>
              </Badge>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* KPI Stats Bar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: 'white' }}>
            <Typography variant="h5" fontWeight={800} color="primary.main">{surveyStats.total || surveys.length}</Typography>
            <Typography variant="caption" color="text.secondary">Total Ground Inspections</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: 'white' }}>
            <Typography variant="h5" fontWeight={800} color="success.main">{surveyStats.verified || 0}</Typography>
            <Typography variant="caption" color="text.secondary">Certified by Inspector</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: 'white' }}>
            <Typography variant="h5" fontWeight={800} color="warning.main">{offlineQueue.length}</Typography>
            <Typography variant="caption" color="text.secondary">Queued in Device Storage</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center', bgcolor: 'white' }}>
            <Typography variant="h5" fontWeight={800} color="error.main">{surveyStats.flagged || surveys.filter(s => s.encroachment_detected).length}</Typography>
            <Typography variant="caption" color="text.secondary">Encroachments Flagged</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<NoteAdd />} iconPosition="start" label="New Ground Verification" />
        <Tab icon={<Assessment />} iconPosition="start" label={`Inspection Dossiers (${surveys.length})`} />
        <Tab icon={<CloudDone />} iconPosition="start" label={`Device Offline Queue (${offlineQueue.length})`} />
      </Tabs>

      {/* ── TAB 0: Field Inspection Form & Live Map ────────────────────────── */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Left Column: Form */}
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              {/* 1. Parcel Linkage */}
              <Typography variant="subtitle1" fontWeight={800} color="#0B1F5C" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Search fontSize="small" /> 1. Identify Target Parcel
              </Typography>
              <Autocomplete
                freeSolo
                options={parcelOptions}
                getOptionLabel={(opt) =>
                  typeof opt === 'string' ? opt : `${opt.survey_no} — ${opt.land_name} (${opt.owner_name})`
                }
                value={selectedParcel}
                onChange={(e, val) => {
                  if (typeof val === 'object' && val) setSelectedParcel(val);
                }}
                inputValue={parcelSearch}
                onInputChange={(e, val) => setParcelSearch(val)}
                renderInput={(params) => (
                  <TextField {...params} fullWidth label="Search Survey No, ULPIN, Land Name, or Owner"
                    variant="outlined" sx={{ mb: 2 }} />
                )}
                renderOption={(props, opt) => (
                  <li {...props} key={opt.id}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{opt.survey_no} — {opt.land_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {opt.owner_name} • {opt.village}, {opt.district}, {opt.state} • {opt.area_acres} Acres
                      </Typography>
                    </Box>
                  </li>
                )}
              />

              {/* Linked Parcel Preview */}
              {selectedParcel && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: '#ECFDF5', borderColor: '#A7F3D0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={800} color="#065F46">
                      ✓ Parcel Linked: {selectedParcel.survey_no}
                    </Typography>
                    <Chip size="small" label={selectedParcel.status} color="primary" />
                  </Box>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Bhu-Aadhaar ULPIN:</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedParcel.ulpin}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Titleholder:</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedParcel.owner_name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Recorded Area:</Typography>
                      <Typography variant="body2">{selectedParcel.area_acres} Acres ({selectedParcel.land_use})</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Centroid Coordinates:</Typography>
                      <Typography variant="body2">{selectedParcel.centroid_lat?.toFixed(5)}°N, {selectedParcel.centroid_lng?.toFixed(5)}°E</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              <Divider sx={{ my: 2.5 }} />

              {/* 2. Device GPS Capture & Proximity */}
              <Typography variant="subtitle1" fontWeight={800} color="#0B1F5C" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GpsFixed fontSize="small" /> 2. On-Site GPS Fix & Proximity Lock
              </Typography>
              <Button
                variant="contained" fullWidth size="large"
                startIcon={gpsLoading ? <MyLocation /> : <LocationOn />}
                onClick={captureGps} disabled={gpsLoading}
                sx={{ mb: 2, py: 1.3, bgcolor: '#0B1F5C', '&:hover': { bgcolor: '#081745' } }}
              >
                {gpsLoading ? 'Acquiring Satellite GPS Fix...' : 'Capture Current Device GPS Fix'}
              </Button>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <TextField fullWidth size="small" label="Latitude" value={gpsLat} onChange={e => setGpsLat(e.target.value)} />
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth size="small" label="Longitude" value={gpsLng} onChange={e => setGpsLng(e.target.value)} />
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth size="small" label="Accuracy" value={gpsAccuracy} onChange={e => setGpsAccuracy(e.target.value)}
                    InputProps={{ endAdornment: <InputAdornment position="end">m</InputAdornment> }} />
                </Grid>
              </Grid>

              {parcelDistance !== null && (
                <Alert severity={parcelDistance < 150 ? 'success' : 'warning'} sx={{ mb: 2, borderRadius: 2 }}>
                  Distance to Target Parcel Centroid: <strong>{parcelDistance} meters</strong>
                  {parcelDistance < 150 ? ' (Within physical inspection perimeter)' : ' (Beyond standard boundary radius)'}
                </Alert>
              )}

              <Divider sx={{ my: 2.5 }} />

              {/* 3. Cardinal Boundary Markers Check */}
              <Typography variant="subtitle1" fontWeight={800} color="#0B1F5C" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Straighten fontSize="small" /> 3. Cardinal Boundary Stones & Pillars
              </Typography>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {[
                  { label: 'North Boundary Marker', state: markerNorth, setter: setMarkerNorth },
                  { label: 'South Boundary Marker', state: markerSouth, setter: setMarkerSouth },
                  { label: 'East Boundary Marker', state: markerEast, setter: setMarkerEast },
                  { label: 'West Boundary Marker', state: markerWest, setter: setMarkerWest },
                ].map((item, i) => (
                  <Grid item xs={6} key={i}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{item.label}</InputLabel>
                      <Select value={item.state} onChange={e => item.setter(e.target.value)} label={item.label}>
                        <MenuItem value="Intact">Intact & Undisturbed</MenuItem>
                        <MenuItem value="Partially Shifted">Partially Shifted</MenuItem>
                        <MenuItem value="Missing / Destroyed">Missing / Destroyed</MenuItem>
                        <MenuItem value="Disputed by Adjacent Plot">Disputed by Adjacent Plot</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                ))}
              </Grid>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Overall Boundary Verdict</InputLabel>
                <Select value={boundaryStatus} onChange={e => setBoundaryStatus(e.target.value)} label="Overall Boundary Verdict">
                  <MenuItem value="Intact">All Physical Boundaries Intact (100% Certified)</MenuItem>
                  <MenuItem value="Partially Damaged">Partially Damaged (Re-pillar required)</MenuItem>
                  <MenuItem value="Damaged">Severely Damaged (Full Demarcation Needed)</MenuItem>
                  <MenuItem value="Disputed">Active Boundary Dispute on Ground</MenuItem>
                </Select>
              </FormControl>

              {/* Encroachment Switch */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: encroachment ? '#FEF2F2' : '#F8FAFC', borderColor: encroachment ? '#F87171' : 'divider' }}>
                <FormControlLabel
                  control={<Switch checked={encroachment} onChange={e => setEncroachment(e.target.checked)} color="error" />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={800} color={encroachment ? 'error.main' : 'text.primary'}>
                        {encroachment ? '⚠️ Encroachment / Unauthorized Occupation Detected' : 'No Encroachment Detected'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Toggle if squatting, illegal boundary push, or unrecorded structures occupy the land
                      </Typography>
                    </Box>
                  }
                  sx={{ ml: 0, width: '100%' }}
                />

                {encroachment && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Encroachment Type</InputLabel>
                        <Select value={encroachmentType} onChange={e => setEncroachmentType(e.target.value)} label="Encroachment Type">
                          <MenuItem value="Unauthorized Construction">Unauthorized Construction</MenuItem>
                          <MenuItem value="Illegal Agricultural Farming">Illegal Agricultural Farming</MenuItem>
                          <MenuItem value="Squatter Settlement">Squatter Settlement</MenuItem>
                          <MenuItem value="Road / Access Encroachment">Road / Access Encroachment</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth size="small" label="Approx. Encroached Area (Sq.Ft)"
                        value={encroachedArea} onChange={e => setEncroachedArea(e.target.value)} />
                    </Grid>
                  </Grid>
                )}
              </Paper>

              <Divider sx={{ my: 2.5 }} />

              {/* 4. Standing Assets Enumeration (for R&R Compensation) */}
              <Typography variant="subtitle1" fontWeight={800} color="#0B1F5C" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Park fontSize="small" /> 4. Standing Assets Enumeration (R&R Assessment)
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Standing Trees (Fruit / Timber)" type="number"
                    value={treesCount} onChange={e => setTreesCount(e.target.value)}
                    helperText="Teak, Mango, Coconut, Neem etc." />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Water Wells / Borewells" type="number"
                    value={wellsCount} onChange={e => setWellsCount(e.target.value)}
                    helperText="Operational agricultural water sources" />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Built Structure Present</InputLabel>
                    <Select value={structurePresent} onChange={e => setStructurePresent(e.target.value)} label="Built Structure Present">
                      <MenuItem value="None">None (Vacant Land)</MenuItem>
                      <MenuItem value="Pucca Residential House">Pucca Residential House</MenuItem>
                      <MenuItem value="Kutcha Thatched Hut">Kutcha Thatched Hut</MenuItem>
                      <MenuItem value="Commercial Shop / Shed">Commercial Shop / Shed</MenuItem>
                      <MenuItem value="Cattle Shed">Cattle Shed</MenuItem>
                      <MenuItem value="Compound Wall Only">Compound Wall Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Structure Carpet Area (Sq.Ft)"
                    disabled={structurePresent === 'None'}
                    value={structureSqft} onChange={e => setStructureSqft(e.target.value)} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2.5 }} />

              {/* 5. Attestation & Notes */}
              <Typography variant="subtitle1" fontWeight={800} color="#0B1F5C" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUser fontSize="small" /> 5. Surveyor Attestation & Digital Panchnama
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Surveyor Name & ID"
                    value={surveyorName} onChange={e => setSurveyorName(e.target.value)} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Village Panchayat Witness"
                    value={witnessName} onChange={e => setWitnessName(e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} size="small" label="Surveyor Field Observations & Notes"
                    value={fieldNotes} onChange={e => setFieldNotes(e.target.value)}
                    placeholder="Physical landmarks, boundary conditions, access roads, crops standing, remarks on disputes..." />
                </Grid>
              </Grid>

              {/* Submit Button */}
              <Button
                variant="contained" color="primary" fullWidth size="large"
                onClick={handleSubmit} disabled={submitting}
                startIcon={submitting ? <Sync /> : navigator.onLine ? <CloudDone /> : <Save />}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 800, fontSize: '1rem', bgcolor: '#0B1F5C', '&:hover': { bgcolor: '#081745' } }}
              >
                {submitting ? 'Submitting Verification...' : navigator.onLine ? 'Submit & Synchronize to Central Cadastre' : 'Save Dossier to Offline Storage Queue'}
              </Button>
            </Card>
          </Grid>

          {/* Right Column: Live Map & Proximity Guide */}
          <Grid item xs={12} md={5}>
            {/* Live Interactive Map */}
            <Card sx={{ p: 2, borderRadius: 3, mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={800} color="#0B1F5C">
                  📍 Cadastral Ground Radar
                </Typography>
                {selectedParcel && (
                  <Button size="small" startIcon={<Directions />}
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedParcel.centroid_lat},${selectedParcel.centroid_lng}`, '_blank')}>
                    Navigate
                  </Button>
                )}
              </Box>

              <Box sx={{ height: 280, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <MapContainer center={currentMapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <MapRecenter center={currentMapCenter} />

                  {/* Parcel Marker */}
                  {selectedParcel?.centroid_lat && (
                    <Marker position={[selectedParcel.centroid_lat, selectedParcel.centroid_lng]} icon={parcelIcon}>
                      <Popup>
                        <strong>Parcel: {selectedParcel.survey_no}</strong><br />
                        Owner: {selectedParcel.owner_name}<br />
                        Area: {selectedParcel.area_acres} Acres
                      </Popup>
                    </Marker>
                  )}

                  {/* Surveyor Device GPS Marker */}
                  {gpsLat && gpsLng && (
                    <Marker position={[Number(gpsLat), Number(gpsLng)]} icon={surveyorIcon}>
                      <Popup>
                        <strong>Surveyor Location</strong><br />
                        Accuracy: ±{gpsAccuracy}m
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </Box>

              <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  🎯 Green = Parcel Centroid | 📍 Navy = Device GPS
                </Typography>
                {parcelDistance !== null && (
                  <Chip size="small" label={`Proximity: ${parcelDistance}m`} color={parcelDistance < 100 ? 'success' : 'warning'} />
                )}
              </Box>
            </Card>

            {/* Verification Checklist */}
            <Card sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={800} color="#0B1F5C" sx={{ mb: 1 }}>
                Field Inspection Checklist
              </Typography>
              <List dense disablePadding>
                {[
                  { label: 'Parcel Selected & Linked', done: !!selectedParcel },
                  { label: 'Satellite GPS Locked', done: !!gpsLat },
                  { label: '4-Point Boundary Markers Checked', done: !!boundaryStatus },
                  { label: 'Encroachment Status Evaluated', done: true },
                  { label: 'Standing Trees & Assets Counted', done: treesCount > 0 || wellsCount > 0 || structurePresent !== 'None' },
                  { label: 'Attestation & Signatures Documented', done: !!surveyorName && !!witnessName }
                ].map((item, i) => (
                  <ListItem key={i} sx={{ px: 0, py: 0.4 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      {item.done
                        ? <CheckCircle fontSize="small" color="success" />
                        : <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #CBD5E1' }} />}
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2" color={item.done ? 'text.primary' : 'text.secondary'}>{item.label}</Typography>} />
                  </ListItem>
                ))}
              </List>
            </Card>

            {/* Quick Handbook Summary */}
            <Card sx={{ p: 2.5, borderRadius: 3, bgcolor: '#F8FAFC', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={800} color="#0B1F5C" sx={{ mb: 1 }}>
                Patwari / Surveyor Quick SOP
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                • Stand near the central boundary stones before capturing GPS fix.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                • Encroachment flags immediately halt unverified transfers in Workflow Approvals.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                • Standing trees and structure measurements directly impact R&R entitlement disbursements.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── TAB 1: Inspection Dossiers & Panchnama Generation ──────────────── */}
      {tab === 1 && (
        <Card sx={{ borderRadius: 3 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0B1F5C">
                Ground-Truth Inspection Dossiers ({surveys.length} Reports)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submitted field verification panchnamas ready for scrutiny, legal certification, and R&R handover
              </Typography>
            </Box>
            <IconButton onClick={fetchSurveys} color="primary"><Refresh /></IconButton>
          </Box>

          {surveys.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">No field surveys submitted yet.</Typography>
              <Button sx={{ mt: 1 }} onClick={() => setTab(0)} startIcon={<NoteAdd />}>Start New Verification</Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Survey No</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Land Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>GPS Fix</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Boundary Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Encroachment</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Assets (Trees/Wells)</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {surveys.map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell>{s.id}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.survey_no}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{s.land_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.owner_name || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        {s.gps_lat ? (
                          <Tooltip title={`${s.gps_lat}°N, ${s.gps_lng}°E (±${s.gps_accuracy}m)`}>
                            <Chip size="small" icon={<GpsFixed />} label="Locked" color="success" variant="outlined" />
                          </Tooltip>
                        ) : <Chip size="small" label="None" variant="outlined" />}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={s.boundary_status}
                          color={s.boundary_status === 'Intact' ? 'success' : s.boundary_status === 'Damaged' ? 'error' : 'warning'} />
                      </TableCell>
                      <TableCell>
                        {s.encroachment_detected
                          ? <Chip size="small" label="Yes (Disputed)" color="error" icon={<Flag />} />
                          : <Chip size="small" label="None" color="success" variant="outlined" />}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {s.trees_count || 0} Trees • {s.wells_count || 0} Wells
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {s.structure_present}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={s.verification_status}
                          color={s.verification_status === 'Verified' ? 'success' : s.verification_status === 'Submitted' ? 'info' : 'warning'}
                          sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Print Form 3 Field Panchnama">
                            <IconButton size="small" color="primary" onClick={() => handlePrintPanchnama(s)}>
                              <Print fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {s.verification_status !== 'Verified' && (
                            <Tooltip title="Approve & Certify (Revenue Inspector)">
                              <IconButton size="small" color="success" onClick={() => handleVerifySurvey(s.id, 'Verified')}>
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* ── TAB 2: Device Offline Queue Manager ────────────────────────────── */}
      {tab === 2 && (
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0B1F5C">
                Device Storage Queue ({offlineQueue.length} Pending Records)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dossiers recorded during network outage stored safely in browser LocalStorage.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" color="success" onClick={syncOfflineQueue}
                disabled={offlineQueue.length === 0} startIcon={<Sync />}>
                Synchronize All Now
              </Button>
              <Button variant="outlined" color="error" onClick={() => {
                if (confirm('Clear local offline queue? Un-synced data will be discarded.')) {
                  setOfflineQueue([]);
                }
              }} disabled={offlineQueue.length === 0} startIcon={<Delete />}>
                Clear Queue
              </Button>
            </Stack>
          </Box>

          {offlineQueue.length === 0 ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              All survey dossiers are synchronized! There are no offline records pending on this device.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Queue ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Survey No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Land Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>GPS Coordinates</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Encroachment</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Recorded Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {offlineQueue.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{item.id}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{item.survey_no}</TableCell>
                      <TableCell>{item.land_name}</TableCell>
                      <TableCell>{item.gps_lat ? `${item.gps_lat}, ${item.gps_lng}` : 'None'}</TableCell>
                      <TableCell>
                        {item.encroachment_detected ? <Chip size="small" label="Yes" color="error" /> : <Chip size="small" label="No" color="success" />}
                      </TableCell>
                      <TableCell>{new Date(item.queued_at).toLocaleTimeString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* Mission Guide Dialog */}
      <MissionGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />

      {/* Snackbar Notifications */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ borderRadius: 2 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FieldAgent;

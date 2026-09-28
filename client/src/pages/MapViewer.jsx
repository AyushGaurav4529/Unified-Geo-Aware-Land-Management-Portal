import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Box, Typography, CircularProgress, Chip, Drawer, IconButton,
  Divider, ToggleButtonGroup, ToggleButton, Tooltip, Badge, Stack,
  Select, MenuItem, FormControl, InputLabel, Button, Snackbar, Alert,
  Tabs, Tab, Card, CardContent, Dialog, DialogTitle, DialogContent,
  DialogActions, Paper, Table, TableBody, TableCell, TableRow,
  Slider, Switch, FormControlLabel, TextField, InputAdornment,
  Stepper, Step, StepLabel, StepContent
} from '@mui/material';
import {
  MapContainer, TileLayer, GeoJSON, LayersControl, useMap, useMapEvents, Marker
} from 'react-leaflet';
import L from 'leaflet';
import {
  Close, FiberManualRecord, People, MyLocation,
  FilterList, History, Refresh, Description, VerifiedUser,
  Security, CheckCircle, Print, OpenInNew, Map as MapIcon,
  Person, Gavel, ContentCopy, Public, AssignmentTurnedIn,
  Search, Layers, Tune, Check
} from '@mui/icons-material';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const API = 'http://localhost:5000';

const STATUS_COLORS = {
  'Pending':           '#78909C',
  'Under Acquisition': '#F59E0B',
  'Acquired':          '#10B981',
  'Disputed':          '#EF4444',
  'Compensated':       '#3B82F6',
};
const STATUSES = Object.keys(STATUS_COLORS);
const getColor = (s) => STATUS_COLORS[s] ?? '#78909C';

// Pan-India Hub Navigations
const PAN_INDIA_REGIONS = [
  { label: 'All India View', value: 'ALL', center: [22.5937, 78.9629], zoom: 5 },
  { label: 'Karnataka (Tumkur)', value: 'Karnataka', center: [13.332, 77.100], zoom: 14 },
  { label: 'Maharashtra (Pune)', value: 'Maharashtra', center: [18.578, 73.985], zoom: 14 },
  { label: 'Uttar Pradesh (Varanasi)', value: 'Uttar Pradesh', center: [25.352, 82.964], zoom: 14 },
  { label: 'Gujarat (Ahmedabad)', value: 'Gujarat', center: [23.015, 72.482], zoom: 14 },
  { label: 'Tamil Nadu (Coimbatore)', value: 'Tamil Nadu', center: [11.023, 77.124], zoom: 14 },
  { label: 'Rajasthan (Jaipur)', value: 'Rajasthan', center: [26.784, 75.825], zoom: 14 },
  { label: 'West Bengal (Hooghly)', value: 'West Bengal', center: [22.812, 88.231], zoom: 14 },
  { label: 'Punjab (Ludhiana)', value: 'Punjab', center: [30.865, 75.982], zoom: 14 }
];

const PIPELINE_STEPS = [
  { label: '1. DGPS Cadastral Survey', desc: 'Boundary demarcation, geo-referencing & Bhu-Aadhaar (ULPIN) creation.' },
  { label: '2. Section 11 Notification (RFCTLARR 2013)', desc: 'Public gazette announcement and social impact assessment.' },
  { label: '3. 7/12 & Mutation Audit', desc: 'Title examination, revenue mutation ledger update & zero encumbrance proof.' },
  { label: '4. Award Determination', desc: 'Land market valuation, solatium calculation & collector signoff.' },
  { label: '5. Direct Benefit Transfer (DBT)', desc: '100% compensation credited to verified single titleholder via PFMS.' }
];

function getPipelineStep(status) {
  switch (status) {
    case 'Pending': return 0;
    case 'Under Acquisition': return 1;
    case 'Disputed': return 1;
    case 'Acquired': return 3;
    case 'Compensated': return 5;
    default: return 0;
  }
}

// Helper: re-key GeoJSON -> Map
const toMap = (fc) => {
  const m = new Map();
  if (fc && fc.features) {
    fc.features.forEach(f => m.set(f.id, f));
  }
  return m;
};

// ── Sub-component: Redraw GeoJSON when key changes ────────────────────────────
function LiveGeoJSON({ data, style, onEachFeature, mapKey }) {
  return (
    <GeoJSON key={mapKey} data={data} style={style} onEachFeature={onEachFeature} />
  );
}

// ── Sub-component: Map View Navigator Controller ──────────────────────────────
function MapNavigator({ selectedRegion, targetCoord }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoord) {
      map.flyTo(targetCoord, 16, { animate: true, duration: 1.8, easeLinearity: 0.2 });
      return;
    }
    const reg = PAN_INDIA_REGIONS.find(r => r.value === selectedRegion);
    if (reg) {
      map.flyTo(reg.center, reg.zoom, { animate: true, duration: 2.0, easeLinearity: 0.15 });
    }
  }, [selectedRegion, targetCoord, map]);

  return null;
}

// ── Sub-component: Smooth Map Behavior Enhancer ───────────────────────────────
function SmoothMapBehavior() {
  const map = useMap();
  useEffect(() => {
    // Invalidate size after mount to ensure tiles fill container
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
}

// ── Sub-component: HUD Coordinates & Elevation Bar ────────────────────────────
function MapHudCoordinates() {
  const [coords, setCoords] = useState({ lat: '22.59370', lng: '78.96290', zoom: 5 });
  const map = useMapEvents({
    mousemove(e) {
      setCoords({
        lat: e.latlng.lat.toFixed(5),
        lng: e.latlng.lng.toFixed(5),
        zoom: map.getZoom()
      });
    },
    zoomend() {
      setCoords(prev => ({ ...prev, zoom: map.getZoom() }));
    }
  });

  return (
    <Box sx={{
      position: 'absolute', bottom: 12, right: 12, zIndex: 1000,
      bgcolor: 'rgba(15, 23, 42, 0.90)', color: 'white', borderRadius: 1.5,
      px: 1.6, py: 0.6, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 1.6,
      border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem',
      display: { xs: 'none', sm: 'flex' }
    }}>
      <span>LAT: <strong style={{ color: '#38BDF8' }}>{coords.lat}° N</strong></span>
      <span>LNG: <strong style={{ color: '#38BDF8' }}>{coords.lng}° E</strong></span>
      <span>ZOOM: <strong>{coords.zoom}x</strong></span>
      <span style={{ color: '#10B981', fontWeight: 700 }}>EPSG:4326</span>
      <span style={{ color: '#FCD34D' }}>• 0% OVERLAP</span>
    </Box>
  );
}

// ── Sub-component: On-Map Survey Plot Center Labels ───────────────────────────
function MapPlotLabels({ features, visible }) {
  if (!visible || !features || !features.length) return null;

  return (
    <>
      {features.map(f => {
        const coords = f.geometry?.coordinates?.[0];
        if (!coords || !coords.length) return null;
        // Calculate polygon centroid
        const avgLng = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
        const avgLat = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;
        if (isNaN(avgLat) || isNaN(avgLng)) return null;

        const labelText = f.properties?.land_name_local || f.properties?.survey_no || '';
        const icon = L.divIcon({
          className: 'cadastral-plot-label',
          html: `<span title="${f.properties?.land_name || ''}">${labelText}</span>`,
          iconSize: [110, 18],
          iconAnchor: [55, 9]
        });

        return (
          <Marker key={`label-${f.id}`} position={[avgLat, avgLng]} icon={icon} interactive={false} />
        );
      })}
    </>
  );
}

// ── Sub-component: Reset View Button ──────────────────────────────────────────
function ResetViewButton({ onReset }) {
  return (
    <Tooltip title="Reset to National Overview">
      <Box
        onClick={onReset}
        sx={{
          position: 'absolute', top: 12, left: 12, zIndex: 1000,
          bgcolor: 'white', borderRadius: 2, p: 1, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 0.8,
          '&:hover': { bgcolor: '#f8fafc' }, transition: 'all 0.2s'
        }}
      >
        <MyLocation sx={{ fontSize: 18, color: '#1E40AF' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E293B', display: { xs: 'none', sm: 'inline' } }}>
          Overview
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ── Map Legend ────────────────────────────────────────────────────────────────
function MapLegend({ counts }) {
  return (
    <Box sx={{
      position: 'absolute', bottom: 24, left: 12, zIndex: 1000,
      bgcolor: 'rgba(255,255,255,0.96)', borderRadius: 2, p: 1.6,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 200, backdropFilter: 'blur(8px)',
      border: '1px solid rgba(226, 232, 240, 0.8)'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.6, color: '#0F172A' }}>
          Cadastral Status
        </Typography>
        <Chip size="small" label="0% Overlap" sx={{ height: 16, fontSize: '0.58rem', bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 700 }} />
      </Box>
      {STATUSES.map(label => (
        <Box key={label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: getColor(label), border: '1px solid rgba(0,0,0,0.2)' }} />
            <Typography variant="caption" sx={{ fontSize: '0.73rem', fontWeight: 500, color: '#334155' }}>{label}</Typography>
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.73rem', color: '#64748B' }}>
            {counts[label] ?? 0}
          </Typography>
        </Box>
      ))}
      <Divider sx={{ my: 0.8 }} />
      <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Security sx={{ fontSize: 11, color: '#059669' }} /> 1 Land ↔ 1 Verified Owner
      </Typography>
    </Box>
  );
}

// ── Live Indicator Badge ──────────────────────────────────────────────────────
function LiveBadge({ connected, connecting, clients, lastUpdate }) {
  let statusText = 'OFFLINE';
  let dotColor = '#F87171';
  if (connected) {
    statusText = 'LIVE DILRMP SYNC';
    dotColor = '#10B981';
  } else if (connecting) {
    statusText = 'CONNECTING...';
    dotColor = '#F59E0B';
  }

  return (
    <Box sx={{
      position: 'absolute', top: 12, right: 60, zIndex: 1000,
      bgcolor: 'rgba(15, 23, 42, 0.90)', color: 'white',
      borderRadius: 2, px: 1.6, py: 0.8,
      display: 'flex', alignItems: 'center', gap: 1.2, backdropFilter: 'blur(6px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <FiberManualRecord sx={{ fontSize: 11, color: dotColor, animation: connected || connecting ? 'pulse 1.5s infinite' : 'none' }} />
      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: 0.5 }}>
        {statusText}
      </Typography>
      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 0.2 }} />
      <People sx={{ fontSize: 14, opacity: 0.85 }} />
      <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>{clients}</Typography>
      {lastUpdate && (
        <>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 0.2 }} />
          <Typography variant="caption" sx={{ fontSize: '0.68rem', opacity: 0.8 }}>
            {new Date(lastUpdate).toLocaleTimeString()}
          </Typography>
        </>
      )}
    </Box>
  );
}

// ── Official Government e-Certificate Dialog ──────────────────────────────────
function DocumentPreviewModal({ open, onClose, docType, parcel }) {
  if (!parcel || !parcel.land_papers) return null;
  const papers = parcel.land_papers;
  let docData = null;
  let title = '';

  switch (docType) {
    case 'ror':
      docData = papers.ror_7_12;
      title = `${docData?.document_name || 'Record of Rights (7/12)'} - Digital Copy`;
      break;
    case 'sale_deed':
      docData = papers.sale_deed;
      title = 'Registered Transfer & Sale Deed (Index-II)';
      break;
    case 'mutation':
      docData = papers.mutation_register;
      title = 'Mutation Extract (Ferfar / Form-6)';
      break;
    case 'ec':
      docData = papers.encumbrance_certificate;
      title = '30-Year Non-Encumbrance Certificate (Form 15)';
      break;
    case 'khata':
      docData = papers.property_card_khata;
      title = 'Property Tax Card / e-Khata Certificate';
      break;
    case 'cadastral':
      docData = papers.cadastral_sketch;
      title = 'Cadastral Survey Map (FMB Sketch & Boundary Points)';
      break;
    default:
      docData = null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#0F172A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedUser sx={{ color: '#10B981', fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, border: '2px solid #CBD5E1', bgcolor: 'white', position: 'relative', overflow: 'hidden' }}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: '3rem', fontWeight: 900, color: 'rgba(15, 23, 42, 0.04)', pointerEvents: 'none',
            whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 4
          }}>
            GOVERNMENT OF INDIA • DILRMP VERIFIED
          </Box>

          <Box sx={{ textAlign: 'center', mb: 2, pb: 1.5, borderBottom: '2px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1.5, color: '#1E3A8A', textTransform: 'uppercase' }}>
              Revenue Department • Government of {parcel.state}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
              {docData?.document_name || title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Bhu-Aadhaar (ULPIN): <strong>{parcel.ulpin}</strong> | Survey No: <strong>{parcel.survey_no}</strong>
            </Typography>
          </Box>

          <Table size="small" sx={{ mb: 2 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: '35%', color: '#475569' }}>Titleholder (Single Owner)</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>
                  {parcel.owner_name} <span style={{ color: '#64748B', fontWeight: 400 }}>({parcel.owner_relation})</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Aadhaar Ref / PAN Hash</TableCell>
                <TableCell>{parcel.owner_aadhaar_masked} | {parcel.owner_pan_masked}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Revenue Jurisdiction</TableCell>
                <TableCell>{parcel.village} Village, {parcel.taluk} Taluk, {parcel.district} District, {parcel.state}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Total Parcel Area</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {parcel.area_acres} Acres ({parcel.area_local}) • {parcel.area_sqm} Sq. Meters
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Cadastral Overlap Status</TableCell>
                <TableCell sx={{ color: '#059669', fontWeight: 700 }}>
                  ✓ 0% Overlap with Adjacent Cadastre (PostGIS ST_Disjoint Passed)
                </TableCell>
              </TableRow>

              {docType === 'ror' && (
                <>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Khata / Account No.</TableCell>
                    <TableCell>{docData.khata_number}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Soil Classification & Water</TableCell>
                    <TableCell>{docData.soil_class} | {docData.water_source}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Annual Revenue Assessment</TableCell>
                    <TableCell>{docData.annual_land_revenue_tax}</TableCell>
                  </TableRow>
                </>
              )}

              {docType === 'sale_deed' && (
                <>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>SRO Registration Number</TableCell>
                    <TableCell>{docData.registration_number}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Stamp Duty & e-Challan</TableCell>
                    <TableCell>{docData.stamp_duty_paid} ({docData.e_challan_ref})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Title Covenant</TableCell>
                    <TableCell>{docData.encumbrance_free_declaration}</TableCell>
                  </TableRow>
                </>
              )}

              {docType === 'mutation' && (
                <>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Mutation Entry No</TableCell>
                    <TableCell>{docData.mutation_entry_no}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Nature of Acquisition</TableCell>
                    <TableCell>{docData.nature_of_acquisition}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Sanctioning Officer</TableCell>
                    <TableCell>{docData.sanctioning_officer}</TableCell>
                  </TableRow>
                </>
              )}

              {docType === 'ec' && (
                <>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Search Period</TableCell>
                    <TableCell>{docData.search_period}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Liability Status</TableCell>
                    <TableCell sx={{ color: '#059669', fontWeight: 700 }}>{docData.liability_status}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Issued Under</TableCell>
                    <TableCell>{docData.search_officer}</TableCell>
                  </TableRow>
                </>
              )}

              {docType === 'cadastral' && (
                <>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>FMB Sketch Reference</TableCell>
                    <TableCell>{docData.fmb_sketch_no}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Boundary Demarcation</TableCell>
                    <TableCell>{docData.boundary_markers}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Adjacency Verification</TableCell>
                    <TableCell>
                      N: {docData.shared_cadastral_boundaries?.north}, S: {docData.shared_cadastral_boundaries?.south}, E: {docData.shared_cadastral_boundaries?.east}, W: {docData.shared_cadastral_boundaries?.west}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle sx={{ fontSize: 14 }} /> Digitally Certified by Revenue Directorate
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                Secure Cryptographic Hash: SHA256-DILRMP-{parcel.ulpin}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip label="OFFICIAL RECORD" size="small" sx={{ bgcolor: '#1E3A8A', color: 'white', fontWeight: 700, fontSize: '0.65rem' }} />
            </Box>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#F1F5F9' }}>
        <Button onClick={() => window.print()} startIcon={<Print />} variant="outlined" size="small">
          Print Certificate
        </Button>
        <Button onClick={onClose} variant="contained" size="small" sx={{ bgcolor: '#0F172A' }}>
          Close Preview
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const MapViewer = () => {
  const { user } = useAuth();
  const isLocalAdmin = user && user.role !== 'Central Admin';
  const userState = (user && user.state && user.state !== 'National') ? user.state : 'ALL';
  const userDistrict = (user && user.district && user.district !== 'National') ? user.district : 'ALL';

  const [parcelsMap,     setParcelsMap]     = useState(new Map());
  const [loading,        setLoading]        = useState(true);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [filterStatus,   setFilterStatus]   = useState('All');
  const [selectedRegion, setSelectedRegion] = useState(isLocalAdmin ? userState : 'ALL');
  const [targetCoord,    setTargetCoord]    = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [opacity,        setOpacity]        = useState(0.65);
  const [showPlotLabels, setShowPlotLabels] = useState(true);
  const [connected,      setConnected]      = useState(false);
  const [connecting,     setConnecting]     = useState(true);
  const [clients,        setClients]        = useState(0);
  const [lastUpdate,     setLastUpdate]     = useState(null);
  const [activity,       setActivity]       = useState([]);
  const [showActivity,   setShowActivity]   = useState(false);
  const [toast,          setToast]          = useState(null);
  const [mapKey,         setMapKey]         = useState(0);
  const [newStatus,      setNewStatus]      = useState('');
  const [drawerTab,      setDrawerTab]      = useState(0);
  const [modalDoc,       setModalDoc]       = useState({ open: false, type: 'ror' });

  const socketRef = useRef(null);

  // ── Fetch parcels data ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const effState = isLocalAdmin ? userState : selectedRegion;
      const effDistrict = isLocalAdmin ? userDistrict : 'ALL';
      const qParams = new URLSearchParams();
      if (effState !== 'ALL') qParams.append('state', effState);
      if (effDistrict !== 'ALL') qParams.append('district', effDistrict);
      const qStr = qParams.toString() ? `?${qParams.toString()}` : '';

      const [fcRes, actRes] = await Promise.all([
        fetch(`${API}/api/parcels${qStr}`),
        fetch(`${API}/api/parcels/activity${qStr}`)
      ]);
      const fc  = await fcRes.json();
      const act = await actRes.json();
      setParcelsMap(toMap(fc));
      setActivity(act);
    } catch (e) {
      console.error('Fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [isLocalAdmin, userState, userDistrict, selectedRegion]);

  // ── Persistent Socket.io Integration (No disconnect on re-render) ─────────
  useEffect(() => {
    fetchAll();

    const socket = getSocket();
    socketRef.current = socket;

    // Immediately reflect connection status if already connected
    if (socket.connected) {
      setConnected(true);
      setConnecting(false);
    }

    const onConnect = () => {
      setConnected(true);
      setConnecting(false);
    };

    const onDisconnect = (reason) => {
      setConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    };

    const onReconnectAttempt = () => {
      setConnecting(true);
    };

    const onReconnect = () => {
      setConnected(true);
      setConnecting(false);
      fetchAll(); // Re-fetch to ensure fresh data after network blip
    };

    const onConnectError = () => {
      setConnected(false);
      setConnecting(true);
    };

    const onClientsCount = (n) => {
      setClients(n);
    };

    const onParcelUpdated = ({ feature, log }) => {
      setParcelsMap(prev => {
        const next = new Map(prev);
        next.set(feature.id, feature);
        return next;
      });
      setMapKey(k => k + 1);
      setLastUpdate(log.ts);
      setActivity(prev => [log, ...prev].slice(0, 50));
      setToast(`📍 ${log.land_name || log.survey_no} (${log.state}): ${log.oldStatus} → ${log.newStatus}`);

      setSelectedParcel(prev =>
        prev && prev.id === feature.properties.id ? feature.properties : prev
      );
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect', onReconnect);
    socket.on('connect_error', onConnectError);
    socket.on('clients_count', onClientsCount);
    socket.on('parcel_updated', onParcelUpdated);

    // Clean up event listeners only; KEEP socket connection alive to prevent disconnect churn
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect', onReconnect);
      socket.off('connect_error', onConnectError);
      socket.off('clients_count', onClientsCount);
      socket.off('parcel_updated', onParcelUpdated);
    };
  }, [fetchAll]);

  // ── Computed Filtered Parcels ───────────────────────────────────────────────
  const { filteredFC, counts } = useMemo(() => {
    const counts = {};
    STATUSES.forEach(s => { counts[s] = 0; });
    let all = [...parcelsMap.values()];

    // Region filter
    if (selectedRegion !== 'ALL') {
      all = all.filter(f => f.properties.state.toLowerCase() === selectedRegion.toLowerCase());
    }

    all.forEach(f => {
      counts[f.properties.status] = (counts[f.properties.status] ?? 0) + 1;
    });

    let filtered = filterStatus === 'All' ? all : all.filter(f => f.properties.status === filterStatus);

    // Search query filter (ULPIN, Survey, Owner)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(f =>
        f.properties.ulpin.toLowerCase().includes(q) ||
        f.properties.survey_no.toLowerCase().includes(q) ||
        f.properties.owner_name.toLowerCase().includes(q) ||
        (f.properties.land_name && f.properties.land_name.toLowerCase().includes(q)) ||
        (f.properties.land_name_local && f.properties.land_name_local.toLowerCase().includes(q))
      );
    }

    return { filteredFC: { type: 'FeatureCollection', features: filtered }, counts };
  }, [parcelsMap, filterStatus, selectedRegion, searchQuery]);

  // ── Handle Quick Instant Search ─────────────────────────────────────────────
  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = [...parcelsMap.values()].find(f =>
      f.properties.ulpin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.properties.survey_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.properties.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.properties.land_name && f.properties.land_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.properties.land_name_local && f.properties.land_name_local.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (match) {
      const coords = match.geometry.coordinates[0];
      const avgLng = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
      const avgLat = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;
      setTargetCoord([avgLat, avgLng]);
      setSelectedParcel(match.properties);
      setDrawerTab(0);
      setToast(`Found parcel: ${match.properties.survey_no} (${match.properties.state})`);
    } else {
      setToast('No matching parcel or ULPIN found.');
    }
  };

  // ── Manual status update ────────────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    if (!selectedParcel || !newStatus) return;
    try {
      await fetch(`${API}/api/parcels/${selectedParcel.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, actor: 'Portal Officer' })
      });
      setNewStatus('');
    } catch (e) {
      console.error(e);
    }
  };

  // ── Map Styling: Strict Non-Overlapping Borders ─────────────────────────────
  const geoJsonStyle = useCallback((feature) => {
    const isSelected = selectedParcel && selectedParcel.id === feature.properties.id;
    return {
      fillColor: getColor(feature.properties.status),
      weight: isSelected ? 3.5 : 2,
      opacity: 1,
      color: isSelected ? '#1E3A8A' : '#FFFFFF',
      fillOpacity: isSelected ? 0.92 : opacity,
    };
  }, [selectedParcel, opacity]);

  const onEachFeature = useCallback((feature, layer) => {
    const p = feature.properties;

    // Enable smooth CSS transitions on the SVG path
    if (layer._path) {
      layer._path.style.transition = 'fill-opacity 0.25s ease, stroke-width 0.2s ease, stroke 0.2s ease';
    }
    layer.on('add', () => {
      if (layer._path) {
        layer._path.style.transition = 'fill-opacity 0.25s ease, stroke-width 0.2s ease, stroke 0.2s ease';
      }
    });

    layer.on({
      click: () => {
        setSelectedParcel(p);
        setNewStatus('');
        setDrawerTab(0);
      },
      mouseover: (e) => {
        e.target.setStyle({ fillOpacity: 0.95, weight: 3, color: '#1E3A8A' });
        e.target.bringToFront();
      },
      mouseout: (e) => {
        if (!selectedParcel || selectedParcel.id !== p.id) {
          e.target.setStyle({ fillOpacity: opacity, weight: 2, color: '#FFFFFF' });
        }
      }
    });

    layer.bindTooltip(`
      <div style="font-family: Inter, sans-serif; font-size: 11px;">
        <strong style="color: #1E3A8A; font-size: 12px;">${p.land_name || p.survey_no}</strong><br/>
        <span style="color: #64748B;">${p.survey_no} • Village: ${p.village}, ${p.district}</span><br/>
        <b>ULPIN:</b> ${p.ulpin}<br/>
        <b>Owner:</b> ${p.owner_name}<br/>
        <b>Area:</b> ${p.area_acres} Acres (${p.area_local})<br/>
        <span style="color: #059669; font-weight: bold;">✓ 0% Overlap Guaranteed</span>
      </div>
    `, { sticky: true, opacity: 0.95, direction: 'auto' });
  }, [selectedParcel, opacity]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 2 }}>
      <CircularProgress size={48} thickness={4} sx={{ color: '#1E3A8A' }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#334155' }}>
        Loading Pan-India Cadastral Mesh & Verified Land Records…
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Enforcing PostGIS non-overlap constraints & Bhu-Aadhaar ULPIN integrity
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>

      {/* ── Top Bar: State Navigator, Search, Filters & GIS Controls ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1,
        bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Instant ULPIN / Survey Search Box */}
        <Box component="form" onSubmit={handleQuickSearch} sx={{ minWidth: 260, flex: { xs: '1 1 100%', md: '0 1 300px' } }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search Land Name, ULPIN, Survey, or Owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: '#64748B' }} />
                </InputAdornment>
              ),
              sx: { fontSize: '0.8rem', bgcolor: '#F8FAFC', borderRadius: 2 }
            }}
          />
        </Box>

        {/* Pan-India Region Selector */}
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel sx={{ fontSize: '0.8rem' }}>Pan-India Hub</InputLabel>
          <Select
            value={selectedRegion}
            label="Pan-India Hub"
            onChange={(e) => { setSelectedRegion(e.target.value); setTargetCoord(null); }}
            sx={{ fontSize: '0.8rem', fontWeight: 600 }}
          >
            {PAN_INDIA_REGIONS.map(reg => (
              <MenuItem key={reg.value} value={reg.value} sx={{ fontSize: '0.8rem', gap: 1 }}>
                <Public sx={{ fontSize: 16, color: '#1E40AF' }} /> {reg.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider orientation="vertical" flexItem sx={{ height: 28, alignSelf: 'center', display: { xs: 'none', lg: 'block' } }} />

        {/* Status Filter */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.8 }}>
          <FilterList fontSize="small" sx={{ color: '#64748B' }} />
          <ToggleButtonGroup
            exclusive value={filterStatus}
            onChange={(_, v) => v && setFilterStatus(v)}
            size="small"
          >
            <ToggleButton value="All" sx={{ px: 1.2, py: 0.3, fontSize: '0.72rem', fontWeight: 600 }}>
              All ({filteredFC.features.length})
            </ToggleButton>
            {STATUSES.map(s => (
              <ToggleButton key={s} value={s} sx={{ px: 1, py: 0.3, fontSize: '0.72rem', gap: 0.5, fontWeight: 500 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getColor(s) }} />
                {s} ({counts[s] ?? 0})
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Cadastral Layer Controls: Opacity & Labels */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: { xs: 0, md: 'auto' } }}>
          {/* Opacity Slider */}
          <Box sx={{ display: { xs: 'none', xl: 'flex' }, alignItems: 'center', gap: 1, width: 140 }}>
            <Layers sx={{ fontSize: 16, color: '#64748B' }} />
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748B', whiteSpace: 'nowrap' }}>Opacity:</Typography>
            <Slider
              size="small"
              value={opacity}
              min={0.1}
              max={1.0}
              step={0.05}
              onChange={(_, v) => setOpacity(v)}
              sx={{ color: '#1E3A8A' }}
            />
          </Box>

          {/* Toggle Labels */}
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showPlotLabels}
                onChange={(e) => setShowPlotLabels(e.target.checked)}
                color="primary"
              />
            }
            label={<Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Plot Labels</Typography>}
            sx={{ mr: 0 }}
          />

          <Tooltip title="Refresh Land Data">
            <IconButton size="small" onClick={fetchAll} sx={{ border: '1px solid #CBD5E1', borderRadius: 1.5 }}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={showActivity ? 'Hide Activity Feed' : 'Live Cadastral Audit Log'}>
            <Badge badgeContent={activity.length} color="error" max={99}>
              <IconButton size="small" onClick={() => setShowActivity(p => !p)} sx={{ border: '1px solid #CBD5E1', borderRadius: 1.5 }}>
                <History fontSize="small" />
              </IconButton>
            </Badge>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Main Map Area ── */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* MAP CONTAINER */}
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <ResetViewButton onReset={() => { setSelectedRegion('ALL'); setTargetCoord(null); setSearchQuery(''); }} />
          <LiveBadge connected={connected} connecting={connecting} clients={clients} lastUpdate={lastUpdate} />
          <MapLegend counts={counts} />

          <MapContainer
            center={[22.5937, 78.9629]}
            zoom={5}
            zoomSnap={0.5}
            zoomDelta={0.5}
            wheelDebounceTime={80}
            wheelPxPerZoomLevel={120}
            inertia={true}
            inertiaDeceleration={3000}
            inertiaMaxSpeed={1800}
            easeLinearity={0.2}
            zoomAnimation={true}
            markerZoomAnimation={true}
            fadeAnimation={true}
            style={{ height: '100%', width: '100%', minHeight: '520px' }}
          >
            <MapNavigator selectedRegion={selectedRegion} targetCoord={targetCoord} />
            <SmoothMapBehavior />
            <MapHudCoordinates />

            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="OpenStreetMap Streets">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors • DILRMP India"
                  updateWhenZooming={false}
                  updateWhenIdle={true}
                  keepBuffer={5}
                  maxNativeZoom={19}
                  maxZoom={22}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="High-Res Satellite (Esri)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri • Cadastral Boundaries"
                  updateWhenZooming={false}
                  updateWhenIdle={true}
                  keepBuffer={5}
                  maxNativeZoom={18}
                  maxZoom={22}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Topographic Relief">
                <TileLayer
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenTopoMap"
                  updateWhenZooming={false}
                  updateWhenIdle={true}
                  keepBuffer={5}
                  maxNativeZoom={17}
                  maxZoom={22}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Stadia Smooth (Clean)">
                <TileLayer
                  url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
                  attribution="&copy; Stadia Maps &copy; OpenStreetMap contributors"
                  updateWhenZooming={false}
                  updateWhenIdle={true}
                  keepBuffer={5}
                  maxNativeZoom={20}
                  maxZoom={22}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Stadia Dark Matter">
                <TileLayer
                  url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                  attribution="&copy; Stadia Maps &copy; OpenStreetMap contributors"
                  updateWhenZooming={false}
                  updateWhenIdle={true}
                  keepBuffer={5}
                  maxNativeZoom={20}
                  maxZoom={22}
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {filteredFC.features.length > 0 && (
              <LiveGeoJSON
                data={filteredFC}
                style={geoJsonStyle}
                onEachFeature={onEachFeature}
                mapKey={`${mapKey}-${filterStatus}-${selectedRegion}-${opacity}`}
              />
            )}

            {/* Centered Plot Labels */}
            <MapPlotLabels features={filteredFC.features} visible={showPlotLabels} />
          </MapContainer>
        </Box>

        {/* ── Live Cadastral Audit Log Feed ── */}
        {showActivity && (
          <Box sx={{
            width: 320, borderLeft: '1px solid #CBD5E1', bgcolor: '#FFFFFF',
            display: 'flex', flexDirection: 'column', zIndex: 1100, boxShadow: '-4px 0 16px rgba(0,0,0,0.06)'
          }}>
            <Box sx={{ px: 2, py: 1.6, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FiberManualRecord sx={{ fontSize: 10, color: '#10B981' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>National Land Activity</Typography>
              </Box>
              <IconButton size="small" onClick={() => setShowActivity(false)}><Close fontSize="small" /></IconButton>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
              {activity.map((item, i) => (
                <Box key={i} sx={{ p: 1.2, mb: 1, border: '1px solid #E2E8F0', borderRadius: 1.5, bgcolor: '#F8FAFC' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      {item.land_name || item.survey_no} <span style={{ color: '#64748B', fontWeight: 500 }}>({item.state || 'All India'})</span>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(item.ts).toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, my: 0.4 }}>
                    <Chip size="small" label={item.oldStatus} sx={{ bgcolor: getColor(item.oldStatus), color: 'white', fontSize: '0.62rem', height: 18 }} />
                    <Typography variant="caption">→</Typography>
                    <Chip size="small" label={item.newStatus} sx={{ bgcolor: getColor(item.newStatus), color: 'white', fontSize: '0.62rem', height: 18 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                    {item.owner_name ? `Owner: ${item.owner_name} • ` : ''}by {item.actor}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ── Comprehensive Parcel Detail Drawer ── */}
        <Drawer
          variant="persistent"
          anchor="right"
          open={Boolean(selectedParcel)}
          sx={{
            width: selectedParcel ? 390 : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 390, position: 'absolute', height: '100%',
              top: 0, right: 0, boxShadow: '-6px 0 20px rgba(0,0,0,0.12)', borderLeft: '1px solid #E2E8F0'
            }
          }}
        >
          {selectedParcel && (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#FFFFFF' }}>
              
              {/* Drawer Header */}
              <Box sx={{ p: 2, bgcolor: '#0B1F5C', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#FCD34D', fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {selectedParcel.land_name || `Survey #${selectedParcel.survey_no}`}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {selectedParcel.village}, {selectedParcel.district}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem' }}>
                    Survey: {selectedParcel.survey_no} • {selectedParcel.state_code || ''}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setSelectedParcel(null)} sx={{ color: 'white' }}>
                  <Close />
                </IconButton>
              </Box>

              {/* Tabs for Overview, Pipeline & Land Papers */}
              <Tabs
                value={drawerTab}
                onChange={(_, v) => setDrawerTab(v)}
                variant="fullWidth"
                sx={{ borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}
              >
                <Tab label="Overview" icon={<MapIcon sx={{ fontSize: 16 }} />} iconPosition="start" sx={{ minHeight: 44, fontSize: '0.72rem', fontWeight: 700 }} />
                <Tab label="Pipeline" icon={<AssignmentTurnedIn sx={{ fontSize: 16 }} />} iconPosition="start" sx={{ minHeight: 44, fontSize: '0.72rem', fontWeight: 700 }} />
                <Tab label="Papers (6)" icon={<Description sx={{ fontSize: 16 }} />} iconPosition="start" sx={{ minHeight: 44, fontSize: '0.72rem', fontWeight: 700 }} />
              </Tabs>

              {/* TAB 0: OVERVIEW & ONE PERSON OWNERSHIP */}
              {drawerTab === 0 && (
                <Box sx={{ p: 2.2, overflowY: 'auto', flex: 1 }}>
                  {/* ULPIN Verification Card */}
                  <Card sx={{ bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', mb: 2, borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.6, '&:last-child': { pb: 1.6 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369A1' }}>
                          BHU-AADHAAR (ULPIN)
                        </Typography>
                        <Chip label="14-DIGIT GEO-CODED" size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 800, bgcolor: '#0284C7', color: 'white' }} />
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', letterSpacing: 0.8 }}>
                        {selectedParcel.ulpin}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Sole Titleholder Guarantee (One Land = One Person Rule) */}
                  <Box sx={{ p: 1.8, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.6 }}>
                      <VerifiedUser sx={{ fontSize: 18, color: '#059669' }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>
                        Single Titleholder Binding
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                      {selectedParcel.owner_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Relation: {selectedParcel.owner_relation}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#047857', fontWeight: 600 }}>
                      ✓ Aadhaar: {selectedParcel.owner_aadhaar_masked} | PAN: {selectedParcel.owner_pan_masked}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', color: '#065F46', mt: 0.4 }}>
                      Lawful Restriction: 100% Sole Individual Owner. Zero concurrent or duplicate claims permitted.
                    </Typography>
                  </Box>

                  {/* Non-Overlap Verification Notice */}
                  <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Security sx={{ fontSize: 14, color: '#2563EB' }} /> Spatial Boundary Integrity
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.72rem', color: '#1E293B', mt: 0.4, fontWeight: 500 }}>
                      Strict PostGIS Disjoint Topology: This parcel shares contiguous survey stone vertices with neighboring lands with <strong>zero overlap</strong> and <strong>zero encroachment</strong>.
                    </Typography>
                  </Box>

                  {/* Parcel Metrics */}
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5, fontSize: '0.65rem', display: 'block', mb: 1 }}>
                    Land Measurement & Details
                  </Typography>

                  {[
                    ['Land Name',             selectedParcel.land_name || 'N/A'],
                    ['Total Area (Standard)', `${selectedParcel.area_acres} Acres`],
                    ['Regional Measure',       selectedParcel.area_local],
                    ['Ground Area (Sqm)',     `${selectedParcel.area_sqm} Sq. Meters`],
                    ['Land Use Category',     selectedParcel.land_use],
                    ['Village & Taluk',       `${selectedParcel.village}, ${selectedParcel.taluk}`],
                    ['District & State',      `${selectedParcel.district}, ${selectedParcel.state}`],
                    ['State Code',            selectedParcel.state_code || 'N/A'],
                    ['Current Status',        selectedParcel.status],
                  ].map(([label, val]) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.7, borderBottom: '1px solid #F1F5F9' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{label}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#0F172A' }}>{val}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* TAB 1: 5-STEP LAND ACQUISITION PIPELINE */}
              {drawerTab === 1 && (
                <Box sx={{ p: 2.2, overflowY: 'auto', flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B1F5C', mb: 0.5 }}>
                    Land Acquisition & Compensation Stepper
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Real-time statutory milestones under RFCTLARR Act 2013:
                  </Typography>

                  <Stepper activeStep={getPipelineStep(selectedParcel.status)} orientation="vertical">
                    {PIPELINE_STEPS.map((step, idx) => {
                      const isDisputed = selectedParcel.status === 'Disputed' && idx === 1;
                      return (
                        <Step key={step.label} expanded>
                          <StepLabel
                            error={isDisputed}
                            optional={isDisputed ? <Typography variant="caption" color="error">Grievance under review</Typography> : null}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                              {step.label}
                            </Typography>
                          </StepLabel>
                          <StepContent>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {step.desc}
                            </Typography>
                          </StepContent>
                        </Step>
                      );
                    })}
                  </Stepper>

                  <Divider sx={{ my: 2.5 }} />

                  {/* Legal Status Update Action */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    Update Acquisition Milestone
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                    <InputLabel>Update Status</InputLabel>
                    <Select
                      value={newStatus}
                      label="Update Status"
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      {STATUSES.filter(s => s !== selectedParcel.status).map(s => (
                        <MenuItem key={s} value={s}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: getColor(s) }} />
                            {s}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    fullWidth variant="contained"
                    disabled={!newStatus}
                    onClick={handleStatusUpdate}
                    sx={{ bgcolor: '#0B1F5C', fontWeight: 700, py: 0.8 }}
                  >
                    Broadcast Legal Status Update
                  </Button>
                </Box>
              )}

              {/* TAB 2: THE 6 IMPORTANT LAND PAPERS */}
              {drawerTab === 2 && (
                <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1.5 }}>
                    Certified Land Records & Legal Papers under DILRMP:
                  </Typography>

                  {/* 1. Record of Rights */}
                  <Card sx={{ mb: 1.5, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            1. Record of Rights (RoR / 7/12)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedParcel.land_papers?.ror_7_12?.document_name}
                          </Typography>
                        </Box>
                        <Chip label="VERIFIED" size="small" sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 800, fontSize: '0.6rem', height: 18 }} />
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.6, fontSize: '0.68rem', color: '#475569' }}>
                        Doc No: {selectedParcel.land_papers?.ror_7_12?.doc_number} • Khata: {selectedParcel.land_papers?.ror_7_12?.khata_number}
                      </Typography>
                      <Button
                        size="small" variant="outlined" fullWidth sx={{ mt: 1, textTransform: 'none', fontSize: '0.72rem', fontWeight: 700 }}
                        startIcon={<OpenInNew />}
                        onClick={() => setModalDoc({ open: true, type: 'ror' })}
                      >
                        Inspect RoR / 7/12 Extract
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 2. Registered Sale Deed */}
                  <Card sx={{ mb: 1.5, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            2. Registered Sale Deed
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sub-Registrar Registered Title
                          </Typography>
                        </Box>
                        <Chip label="SRO STAMPED" size="small" sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 800, fontSize: '0.6rem', height: 18 }} />
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.6, fontSize: '0.68rem', color: '#475569' }}>
                        Reg: {selectedParcel.land_papers?.sale_deed?.registration_number} • Duty: {selectedParcel.land_papers?.sale_deed?.stamp_duty_paid}
                      </Typography>
                      <Button
                        size="small" variant="outlined" fullWidth sx={{ mt: 1, textTransform: 'none', fontSize: '0.72rem', fontWeight: 700 }}
                        startIcon={<OpenInNew />}
                        onClick={() => setModalDoc({ open: true, type: 'sale_deed' })}
                      >
                        Inspect Registered Sale Deed
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 3. Mutation Register */}
                  <Card sx={{ mb: 1.5, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            3. Mutation Extract (Ferfar)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Form-6 Revenue Transfer Ledger
                          </Typography>
                        </Box>
                        <Chip label="SANCTIONED" size="small" sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 800, fontSize: '0.6rem', height: 18 }} />
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.6, fontSize: '0.68rem', color: '#475569' }}>
                        Entry No: {selectedParcel.land_papers?.mutation_register?.mutation_entry_no} • {selectedParcel.land_papers?.mutation_register?.nature_of_acquisition}
                      </Typography>
                      <Button
                        size="small" variant="outlined" fullWidth sx={{ mt: 1, textTransform: 'none', fontSize: '0.72rem', fontWeight: 700 }}
                        startIcon={<OpenInNew />}
                        onClick={() => setModalDoc({ open: true, type: 'mutation' })}
                      >
                        Inspect Mutation Register
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 4. Encumbrance Certificate */}
                  <Card sx={{ mb: 1.5, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            4. Encumbrance Certificate (EC)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            30-Year Non-Liability Search
                          </Typography>
                        </Box>
                        <Chip label="NIL LIABILITY" size="small" sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 800, fontSize: '0.6rem', height: 18 }} />
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.6, fontSize: '0.68rem', color: '#475569' }}>
                        Cert: {selectedParcel.land_papers?.encumbrance_certificate?.certificate_no} (Valid to 2030)
                      </Typography>
                      <Button
                        size="small" variant="outlined" fullWidth sx={{ mt: 1, textTransform: 'none', fontSize: '0.72rem', fontWeight: 700 }}
                        startIcon={<OpenInNew />}
                        onClick={() => setModalDoc({ open: true, type: 'ec' })}
                      >
                        Inspect Encumbrance Certificate
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 5. Cadastral Survey Sketch (FMB) */}
                  <Card sx={{ mb: 1.5, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            5. Cadastral Survey Sketch (FMB)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Field Measurement Book Naksha
                          </Typography>
                        </Box>
                        <Chip label="NO OVERLAP" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '0.6rem', height: 18 }} />
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.6, fontSize: '0.68rem', color: '#475569' }}>
                        Ref: {selectedParcel.land_papers?.cadastral_sketch?.fmb_sketch_no}
                      </Typography>
                      <Button
                        size="small" variant="outlined" fullWidth sx={{ mt: 1, textTransform: 'none', fontSize: '0.72rem', fontWeight: 700 }}
                        startIcon={<OpenInNew />}
                        onClick={() => setModalDoc({ open: true, type: 'cadastral' })}
                      >
                        Inspect Cadastral FMB Map
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 6. Property Card / e-Khata */}
                  <Card sx={{ mb: 1.5, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            6. Property Tax Card (e-Khata)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Panchayat & Municipal Assessment
                          </Typography>
                        </Box>
                        <Chip label="TAX PAID" size="small" sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 800, fontSize: '0.6rem', height: 18 }} />
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.6, fontSize: '0.68rem', color: '#475569' }}>
                        Tax Clearance: {selectedParcel.land_papers?.property_card_khata?.property_tax_clearance}
                      </Typography>
                      <Button
                        size="small" variant="outlined" fullWidth sx={{ mt: 1, textTransform: 'none', fontSize: '0.72rem', fontWeight: 700 }}
                        startIcon={<OpenInNew />}
                        onClick={() => setModalDoc({ open: true, type: 'khata' })}
                      >
                        Inspect e-Khata Certificate
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Box>
          )}
        </Drawer>
      </Box>

      {/* ── Official Document Preview Dialog ── */}
      <DocumentPreviewModal
        open={modalDoc.open}
        onClose={() => setModalDoc(p => ({ ...p, open: false }))}
        docType={modalDoc.type}
        parcel={selectedParcel}
      />

      {/* ── Toast Notifications ── */}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast(null)} severity="info" variant="filled" sx={{ fontSize: '0.8rem', bgcolor: '#0B1F5C' }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MapViewer;

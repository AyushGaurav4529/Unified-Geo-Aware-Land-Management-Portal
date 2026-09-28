import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, Card, Typography, TextField, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, Chip,
  IconButton, Tooltip, Button, FormControl, InputLabel, Select, MenuItem,
  Stack
} from '@mui/material';
import {
  Description, VerifiedUser, Security, CheckCircle, Print,
  Public, OpenInNew, Refresh
} from '@mui/icons-material';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import LandPapersModal from '../components/LandPapersModal';

const STATUS_COLORS = {
  'Pending':           { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  'Under Acquisition': { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  'Acquired':          { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
  'Disputed':          { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
  'Compensated':       { bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD' },
};

const LandRecords = () => {
  const { user } = useAuth();
  const isLocalAdmin = user && user.role !== 'Central Admin';
  const userState = (user && user.state && user.state !== 'National') ? user.state : 'ALL';
  const userDistrict = (user && user.district && user.district !== 'National') ? user.district : 'ALL';

  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState(isLocalAdmin ? userState : 'ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedDoc, setSelectedDoc] = useState({ open: false, parcel: null });

  const fetchParcels = useCallback(async () => {
    try {
      const effState = isLocalAdmin ? userState : stateFilter;
      const effDistrict = isLocalAdmin ? userDistrict : 'ALL';
      const qParams = new URLSearchParams();
      if (effState !== 'ALL') qParams.append('state', effState);
      if (effDistrict !== 'ALL') qParams.append('district', effDistrict);
      const qStr = qParams.toString() ? `?${qParams.toString()}` : '';

      const res = await fetch(`http://localhost:5000/api/parcels${qStr}`);
      const data = await res.json();
      const flatData = data.features.map(f => ({
        id: f.properties.id,
        geometry: f.geometry,
        ...f.properties
      }));
      setRecords(flatData);
      applyFilter(flatData, search, effState);
    } catch (err) {
      console.error('Failed to fetch land records:', err);
    }
  }, [search, stateFilter, isLocalAdmin, userState, userDistrict]);

  const applyFilter = (dataList, term, state) => {
    let result = dataList;
    if (state !== 'ALL') {
      result = result.filter(r => r.state.toLowerCase() === state.toLowerCase());
    }
    if (isLocalAdmin && userDistrict !== 'ALL') {
      result = result.filter(r => r.district.toLowerCase() === userDistrict.toLowerCase());
    }
    if (term.trim()) {
      const lower = term.toLowerCase().trim();
      result = result.filter(r => 
        r.land_name?.toLowerCase().includes(lower) ||
        r.land_name_local?.toLowerCase().includes(lower) ||
        r.survey_no?.toLowerCase().includes(lower) ||
        r.ulpin?.toLowerCase().includes(lower) ||
        r.village?.toLowerCase().includes(lower) ||
        r.district?.toLowerCase().includes(lower) ||
        r.owner_name?.toLowerCase().includes(lower)
      );
    }
    setFiltered(result);
  };

  useEffect(() => {
    fetchParcels();

    // Real-time synchronization via Socket.IO
    const socket = getSocket();
    const onParcelUpdated = ({ feature }) => {
      setRecords(prev => {
        const next = prev.map(p => p.id === feature.id ? { id: feature.id, geometry: feature.geometry, ...feature.properties } : p);
        applyFilter(next, search, stateFilter);
        return next;
      });
      // Also update currently viewed modal if open
      setSelectedDoc(cur => cur.open && cur.parcel?.id === feature.id ? { open: true, parcel: { id: feature.id, ...feature.properties } } : cur);
    };

    socket.on('parcel_updated', onParcelUpdated);
    return () => {
      socket.off('parcel_updated', onParcelUpdated);
    };
  }, [fetchParcels, search, stateFilter]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearch(term);
    applyFilter(records, term, stateFilter);
    setPage(0);
  };

  const handleStateChange = (e) => {
    const s = e.target.value;
    setStateFilter(s);
    applyFilter(records, search, s);
    setPage(0);
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Plus Jakarta Sans', color: '#0F172A' }}>
            {isLocalAdmin ? `${userState} Land Records Register` : 'National Land Records Master (Pan-India)'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isLocalAdmin 
              ? `Jurisdiction Area: ${userState} ${userDistrict !== 'ALL' ? `• District: ${userDistrict}` : ''} • Certified Bhu-Aadhaar Register` 
              : 'Certified Bhu-Aadhaar Cadastral Register • 100% Sole Titleholder Binding • Zero Encroachment PostGIS Disjoint Topology'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip 
            icon={<Security sx={{ fontSize: 16 }} />} 
            label={isLocalAdmin ? `SCOPE: ${userState.toUpperCase()}` : "0% Overlap Guaranteed"} 
            color="success" 
            variant="outlined" 
            sx={{ fontWeight: 700 }}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchParcels}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>
      
      {/* ── Search and State Filter Toolbar ── */}
      <Card sx={{ mb: 4, borderRadius: 2.5, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 2, flexWrap: 'wrap', bgcolor: '#F8FAFC', alignItems: 'center' }}>
          <TextField 
            sx={{ flex: 1, minWidth: 280 }}
            size="small"
            placeholder="Search by Land Name, ULPIN, Survey No, Village, or Owner..." 
            variant="outlined" 
            value={search}
            onChange={handleSearchChange}
          />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>State Cadastre Hub</InputLabel>
            <Select
              value={isLocalAdmin ? userState : stateFilter}
              label="State Cadastre Hub"
              onChange={handleStateChange}
              disabled={isLocalAdmin}
              sx={{ fontWeight: 600 }}
            >
              {isLocalAdmin ? (
                <MenuItem value={userState}>{userState} Jurisdiction</MenuItem>
              ) : (
                [
                  <MenuItem key="ALL" value="ALL">All India (All 8 States)</MenuItem>,
                  <MenuItem key="KA" value="Karnataka">Karnataka (Tumkur)</MenuItem>,
                  <MenuItem key="MH" value="Maharashtra">Maharashtra (Pune)</MenuItem>,
                  <MenuItem key="UP" value="Uttar Pradesh">Uttar Pradesh (Varanasi)</MenuItem>,
                  <MenuItem key="GJ" value="Gujarat">Gujarat (Ahmedabad)</MenuItem>,
                  <MenuItem key="TN" value="Tamil Nadu">Tamil Nadu (Coimbatore)</MenuItem>,
                  <MenuItem key="RJ" value="Rajasthan">Rajasthan (Jaipur)</MenuItem>,
                  <MenuItem key="WB" value="West Bengal">West Bengal (Hooghly)</MenuItem>,
                  <MenuItem key="PB" value="Punjab">Punjab (Ludhiana)</MenuItem>
                ]
              )}
            </Select>
          </FormControl>
        </Box>

        {/* ── Master Land Records Table ── */}
        <TableContainer>
          <Table sx={{ minWidth: 1050 }}>
            <TableHead sx={{ bgcolor: '#F1F5F9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#1E293B', py: 1.5 }}>Land Name & Plot</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#1E293B', py: 1.5 }}>Bhu-Aadhaar (ULPIN)</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#1E293B', py: 1.5 }}>Survey Number</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#1E293B', py: 1.5 }}>Location Hierarchy</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#1E293B', py: 1.5 }}>Land Measurement</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#1E293B', py: 1.5 }}>Sole Titleholder</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#1E293B', py: 1.5 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#1E293B', py: 1.5, textAlign: 'center' }}>Official Papers</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                const sc = STATUS_COLORS[row.status] || STATUS_COLORS['Pending'];
                return (
                  <TableRow key={row.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                    {/* Land Name */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0B1F5C' }}>
                        {row.land_name || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {row.land_name_local || ''}
                      </Typography>
                    </TableCell>

                    {/* ULPIN */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#0284C7', fontSize: '0.82rem' }}>
                        {row.ulpin}
                      </Typography>
                    </TableCell>

                    {/* Survey No */}
                    <TableCell>
                      <Chip
                        label={row.survey_no}
                        size="small"
                        sx={{ fontWeight: 700, fontFamily: 'monospace', bgcolor: '#F1F5F9', border: '1px solid #CBD5E1' }}
                      />
                    </TableCell>

                    {/* Location */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                        {row.district}, {row.state}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.village} Village • {row.taluk}
                      </Typography>
                    </TableCell>

                    {/* Area */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {row.area_acres} Acres
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                        {row.area_local}
                      </Typography>
                    </TableCell>

                    {/* Titleholder */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {row.owner_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {row.owner_relation}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748B' }}>
                        Aadhaar: {row.owner_aadhaar_masked}
                      </Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={row.status} 
                        sx={{ 
                          fontWeight: 800, 
                          fontSize: '0.68rem',
                          bgcolor: sc.bg, 
                          color: sc.color, 
                          border: `1px solid ${sc.border}` 
                        }} 
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Description />}
                          onClick={() => setSelectedDoc({ open: true, parcel: row })}
                          sx={{ 
                            fontSize: '0.7rem', 
                            textTransform: 'none', 
                            fontWeight: 700, 
                            borderRadius: 1.5,
                            bgcolor: '#0B1F5C'
                          }}
                        >
                          Inspect Papers (6)
                        </Button>
                        <Tooltip title="Direct Print Land Papers">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedDoc({ open: true, parcel: row })}
                            sx={{ border: '1px solid #CBD5E1', borderRadius: 1.5, color: '#0F172A' }}
                          >
                            <Print fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                      No cadastral land records found matching criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* ── Official Certified Land Papers Modal with Print Support ── */}
      <LandPapersModal
        open={selectedDoc.open}
        onClose={() => setSelectedDoc({ open: false, parcel: null })}
        parcel={selectedDoc.parcel}
      />
    </Box>
  );
};

export default LandRecords;

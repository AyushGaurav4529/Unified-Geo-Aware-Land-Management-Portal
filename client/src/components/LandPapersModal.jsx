import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Button, Chip, Divider, Paper, Grid,
  Tabs, Tab, IconButton, Stack, Alert
} from '@mui/material';
import {
  Print, Close, VerifiedUser, Security, Description,
  Gavel, CheckCircle, AssignmentTurnedIn, Business,
  LocationOn, AccountBalance, AspectRatio
} from '@mui/icons-material';

export default function LandPapersModal({ open, onClose, parcel }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!parcel) return null;

  const lp = parcel.land_papers || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2.5,
          overflow: 'hidden'
        }
      }}
    >
      {/* ── Dialog Header with Gov Banner ── */}
      <DialogTitle
        sx={{
          bgcolor: '#0B1F5C',
          color: 'white',
          p: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#FCD34D', fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              भारत सरकार • Government of India | DILRMP Cadastre
            </Typography>
            <Chip
              label="CERTIFIED OFFICIAL RECORD"
              size="small"
              sx={{ bgcolor: '#10B981', color: 'white', fontWeight: 800, fontSize: '0.6rem', height: 20 }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {parcel.land_name || `Survey #${parcel.survey_no}`}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
            Survey No: <strong>{parcel.survey_no}</strong> • Bhu-Aadhaar ULPIN: <strong>{parcel.ulpin}</strong> • {parcel.village} Village, {parcel.district}, {parcel.state}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" className="no-print">
          <Button
            variant="contained"
            size="small"
            startIcon={<Print />}
            onClick={handlePrint}
            sx={{
              bgcolor: '#F59E0B',
              color: '#0F172A',
              fontWeight: 800,
              fontSize: '0.75rem',
              '&:hover': { bgcolor: '#D97706' }
            }}
          >
            Print Land Papers
          </Button>
          <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* ── Tabs for Overview and All 6 Documents ── */}
      <Box sx={{ borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }} className="no-print">
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 44 }}
        >
          <Tab label="1. Complete Docket" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
          <Tab label="2. RoR (7/12 / RTC)" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
          <Tab label="3. Sale Deed" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
          <Tab label="4. Mutation (Ferfar)" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
          <Tab label="5. Encumbrance (EC)" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
          <Tab label="6. Cadastral FMB" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
          <Tab label="7. e-Khata Card" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
        </Tabs>
      </Box>

      {/* ── Dialog Content: Full Printable Dossier ── */}
      <DialogContent sx={{ p: 3, bgcolor: '#FFFFFF' }} className="printable-land-papers">
        {/* Printable Official Header */}
        <Box sx={{ display: 'none', displayPrint: 'block', mb: 2, pb: 1, borderBottom: '2px solid #0B1F5C' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0B1F5C' }}>
            GOVERNMENT OF INDIA • MINISTRY OF RURAL DEVELOPMENT
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Digital India Land Records Modernization Programme (DILRMP) Cadastral Extract
          </Typography>
          <Typography variant="caption">
            Certified Cadastral Title Dossier • Printed on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Typography>
        </Box>

        {/* ── SECTION 0: SOLE TITLEHOLDER & NON-OVERLAP CERTIFICATE ── */}
        {(activeTab === 0 || activeTab === 1) && (
          <Paper sx={{ p: 2, mb: 2.5, borderRadius: 2, border: '1px solid #BAE6FD', bgcolor: '#F0F9FF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUser sx={{ color: '#0284C7', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369A1' }}>
                  100% SOLE TITLEHOLDER BINDING GUARANTEE
                </Typography>
              </Box>
              <Chip label="1 LAND = 1 PERSON VERIFIED" size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.62rem' }} />
            </Box>
            <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 700, mb: 0.5 }}>
              Registered Owner: {parcel.owner_name} ({parcel.owner_relation})
            </Typography>
            <Typography variant="caption" sx={{ color: '#0369A1', display: 'block', mb: 0.5 }}>
              National UID: {parcel.owner_uid} • Masked Aadhaar: {parcel.owner_aadhaar_masked} • Masked PAN: {parcel.owner_pan_masked}
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
              Legal Declaration: Single individual freehold titleholder with zero co-owners, zero conflicting claims, and zero overlapping boundary polygons. PostGIS ST_Disjoint spatial validation certified.
            </Typography>
          </Paper>
        )}

        {/* ── LAND SPECIFICATION METRICS ── */}
        {(activeTab === 0 || activeTab === 1) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', mb: 1 }}>
              Cadastral Measurement & Location Specifications
            </Typography>
            <Grid container spacing={1.5}>
              {[
                { label: 'Land Name', value: parcel.land_name },
                { label: 'Survey Number', value: parcel.survey_no },
                { label: 'Total Area (Standard)', value: `${parcel.area_acres} Acres` },
                { label: 'Regional Measurement', value: parcel.area_local },
                { label: 'Ground Area (Sqm)', value: `${parcel.area_sqm} Sq. Meters` },
                { label: 'Land Use Category', value: parcel.land_use },
                { label: 'Village / Mauza', value: `${parcel.village} Village` },
                { label: 'Taluk / Tehsil', value: parcel.taluk },
                { label: 'District & State', value: `${parcel.district}, ${parcel.state} (${parcel.state_code})` },
                { label: 'Acquisition Status', value: parcel.status }
              ].map((item, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Box sx={{ p: 1.2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.82rem' }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* ── THE 6 OFFICIAL CERTIFIED LAND PAPERS ── */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B1F5C', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Description sx={{ fontSize: 18 }} />
          Official Certified Land Records Bundle (6 Statutory Documents):
        </Typography>

        <Stack spacing={2}>
          {/* Document 1: Record of Rights (7/12 / RTC / Khatauni) */}
          {(activeTab === 0 || activeTab === 1) && lp.ror_7_12 && (
            <Paper sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    1. Record of Rights (RoR / 7/12 / RTC / Khatauni)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lp.ror_7_12.document_name}
                  </Typography>
                </Box>
                <Chip label="DIGITALLY CERTIFIED" size="small" sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 800, fontSize: '0.62rem' }} />
              </Box>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Document Number</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.ror_7_12.doc_number}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Khata / Ledger No</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.ror_7_12.khata_number}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Soil Classification</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.ror_7_12.soil_class}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Irrigation Source</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.ror_7_12.water_source}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Annual Land Revenue Tax</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>{lp.ror_7_12.annual_land_revenue_tax}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Digital Verification</Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#1E40AF' }}>{lp.ror_7_12.verified_digital_sign}</Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Document 2: Registered Sale Deed */}
          {(activeTab === 0 || activeTab === 2) && lp.sale_deed && (
            <Paper sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    2. Registered Transfer / Sale Deed (Kharidnama / Index-II)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lp.sale_deed.sro_office}
                  </Typography>
                </Box>
                <Chip label="SRO STAMPED" size="small" sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 800, fontSize: '0.62rem' }} />
              </Box>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Registration Number</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.sale_deed.registration_number}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Stamp Duty Paid</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E40AF' }}>{lp.sale_deed.stamp_duty_paid}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">e-Challan Reference</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.sale_deed.e_challan_ref}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Registration Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.sale_deed.registration_date}</Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="caption" color="text.secondary">Title Nature</Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#065F46' }}>{lp.sale_deed.encumbrance_free_declaration}</Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Document 3: Mutation Register (Ferfar / Form 6) */}
          {(activeTab === 0 || activeTab === 3) && lp.mutation_register && (
            <Paper sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    3. Mutation Register Extract (Ferfar / Form 6 / Vamshavruksha)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lp.mutation_register.sanctioning_officer}
                  </Typography>
                </Box>
                <Chip label="SANCTIONED & ENTERED" size="small" sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 800, fontSize: '0.62rem' }} />
              </Box>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Mutation Entry No</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.mutation_register.mutation_entry_no}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Acquisition Nature</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.mutation_register.nature_of_acquisition}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Certified Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.mutation_register.final_certified_date}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Public Notice Clearance</Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#059669' }}>
                    ✓ {lp.mutation_register.objection_period_elapsed}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Document 4: Encumbrance Certificate (EC) */}
          {(activeTab === 0 || activeTab === 4) && lp.encumbrance_certificate && (
            <Paper sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    4. Non-Encumbrance Certificate (EC / Form 15)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lp.encumbrance_certificate.search_officer}
                  </Typography>
                </Box>
                <Chip label="NIL LIABILITY (0 LIENS)" size="small" sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 800, fontSize: '0.62rem' }} />
              </Box>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Certificate No</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.encumbrance_certificate.certificate_no}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Search Period</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.encumbrance_certificate.search_period}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Validity</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Valid upto {lp.encumbrance_certificate.valid_upto}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Status of Liens & Mortgages</Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#059669' }}>
                    ✓ {lp.encumbrance_certificate.liability_status}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Document 5: Cadastral Survey Map (FMB) */}
          {(activeTab === 0 || activeTab === 5) && lp.cadastral_sketch && (
            <Paper sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    5. Cadastral Survey Sketch (FMB / Akarband / Naksha)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Official Boundary Map Ref: {lp.cadastral_sketch.fmb_sketch_no}
                  </Typography>
                </Box>
                <Chip label="DGPS 0% OVERLAP" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '0.62rem' }} />
              </Box>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Surveyed Area</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.cadastral_sketch.surveyed_area_sqm}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Surveyor License</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.cadastral_sketch.surveyor_license}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 0.5 }}>
                    Cadastral Shared Neighbors (North, South, East, West):
                  </Typography>
                  <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0', fontSize: '0.75rem' }}>
                    <div><strong>North:</strong> {lp.cadastral_sketch.shared_cadastral_boundaries?.north}</div>
                    <div><strong>South:</strong> {lp.cadastral_sketch.shared_cadastral_boundaries?.south}</div>
                    <div><strong>East:</strong> {lp.cadastral_sketch.shared_cadastral_boundaries?.east}</div>
                    <div><strong>West:</strong> {lp.cadastral_sketch.shared_cadastral_boundaries?.west}</div>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Document 6: Property Tax Card (e-Khata) */}
          {(activeTab === 0 || activeTab === 6) && lp.property_card_khata && (
            <Paper sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    6. Property Tax Card (e-Khata / Assessment Extract)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lp.property_card_khata.local_body}
                  </Typography>
                </Box>
                <Chip label="TAX PAID & ACTIVE" size="small" sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 800, fontSize: '0.62rem' }} />
              </Box>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Assessment No</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.property_card_khata.khata_assessment_no}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Tax Clearance Status</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>{lp.property_card_khata.property_tax_clearance}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Payment Receipt Ref</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{lp.property_card_khata.tax_receipt_no}</Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Stack>
      </DialogContent>

      {/* ── Dialog Actions ── */}
      <DialogActions sx={{ p: 2, bgcolor: '#F1F5F9', justifyContent: 'space-between' }} className="no-print">
        <Typography variant="caption" color="text.secondary">
          DILRMP Ministry of Rural Development • Certified Freehold Cadastre
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Print />}
            onClick={handlePrint}
            sx={{ bgcolor: '#0B1F5C', fontWeight: 700 }}
          >
            Print Certified Papers
          </Button>
          <Button variant="outlined" size="small" onClick={onClose} sx={{ fontWeight: 700 }}>
            Close
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

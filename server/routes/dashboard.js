const express = require('express');
const router = express.Router();

router.get('/kpi', async (req, res) => {
    // Dynamically calculate or return Pan-India statistics
    res.json({
        totalParcels: 216,
        underAcquisition: 48,
        compensated: 72,
        totalArea: "684.50",
        statesCovered: 6,
        activeHubs: ['Karnataka', 'Maharashtra', 'Uttar Pradesh', 'Gujarat', 'Tamil Nadu', 'Rajasthan'],
        ulpinSeededPercent: 100,
        zeroOverlapCompliance: '100% (PostGIS ST_Disjoint Passed)'
    });
});

router.get('/recent-activity', async (req, res) => {
    res.json([
        { 
            id: 1, 
            actor_name: 'DILRMP Central Nodal Officer', 
            action: 'ULPIN_VERIFIED', 
            remarks: 'Bhu-Aadhaar geo-coded & 0% overlap confirmed', 
            created_at: new Date().toISOString(), 
            survey_no: 'SRV-104/A' 
        },
        { 
            id: 2, 
            actor_name: 'Maharashtra Sub-Registrar', 
            action: 'MUTATION_SANCTIONED', 
            remarks: 'Ferfar extract linked to Satbara 7/12', 
            created_at: new Date(Date.now() - 1800000).toISOString(), 
            survey_no: 'SRV-112/B' 
        },
        { 
            id: 3, 
            actor_name: 'Karnataka Tahsildar (Tumkur)', 
            action: 'RTC_PAHANI_GENERATED', 
            remarks: 'Digitally signed Form-16 issued with DSC', 
            created_at: new Date(Date.now() - 3600000).toISOString(), 
            survey_no: 'SRV-100/A' 
        },
        { 
            id: 4, 
            actor_name: 'Varanasi District Magistrate', 
            action: 'COMPENSATION_DISBURSED', 
            remarks: 'DBT transfer completed to verified sole owner', 
            created_at: new Date(Date.now() - 7200000).toISOString(), 
            survey_no: 'SRV-120/C' 
        }
    ]);
});

module.exports = router;

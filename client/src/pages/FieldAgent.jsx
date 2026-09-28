import React, { useState } from 'react';
import { Box, Card, Typography, TextField, Button, Alert } from '@mui/material';
import { LocationOn } from '@mui/icons-material';

const FieldAgent = () => {
  const [surveyNo, setSurveyNo] = useState('');
  const [status, setStatus] = useState('Verification Pending');
  const [synced, setSynced] = useState(false);

  const handleSave = () => {
    // Mock offline-first IndexedDB save logic
    if (navigator.onLine) {
       setSynced(true);
       setTimeout(() => setSynced(false), 3000);
    } else {
       alert('Saved locally to IndexedDB queue. Will sync automatically when connection is restored.');
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, fontFamily: 'Plus Jakarta Sans' }}>
        Field Verification Form
      </Typography>
      
      {synced && <Alert severity="success" sx={{ mb: 2 }}>Data synced successfully to central server.</Alert>}
      
      <Card sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Use this form to verify parcel boundaries and status on the ground. Works offline.
        </Typography>
        
        <TextField 
          fullWidth 
          label="Survey No" 
          variant="outlined"
          value={surveyNo} 
          onChange={e => setSurveyNo(e.target.value)} 
          sx={{ mb: 3 }}
        />
        
        <TextField 
          fullWidth 
          label="Verification Status" 
          variant="outlined"
          value={status} 
          onChange={e => setStatus(e.target.value)} 
          sx={{ mb: 3 }}
        />
        
        <Button 
          variant="outlined" 
          color="secondary" 
          fullWidth 
          startIcon={<LocationOn />}
          sx={{ mb: 3, py: 1.5 }}
        >
          Capture GPS Coordinates
        </Button>

        <Button 
          variant="contained" 
          color="primary" 
          fullWidth 
          size="large"
          onClick={handleSave}
        >
          Save & Sync
        </Button>
      </Card>
    </Box>
  );
};

export default FieldAgent;

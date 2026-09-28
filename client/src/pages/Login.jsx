import React, { useState } from 'react';
import { 
  Box, Card, CardContent, Typography, TextField, Button, Alert, 
  Container, FormControl, InputLabel, Select, MenuItem, Chip, Stack, Divider,
  InputAdornment, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Public, AdminPanelSettings, Place, Visibility, VisibilityOff } from '@mui/icons-material';

const PRESET_ACCOUNTS = [
  { name: 'Central Nodal Admin', email: 'admin@sih.gov.in', role: 'Central Admin', place: 'National (All India)' },
  { name: 'Karnataka State Admin', email: 'karnataka@sih.gov.in', role: 'State Officer', place: 'Karnataka State' },
  { name: 'Tumkur District Admin', email: 'tumkur@sih.gov.in', role: 'District Officer', place: 'Tumkur, Karnataka' },
  { name: 'Maharashtra State Admin', email: 'maharashtra@sih.gov.in', role: 'State Officer', place: 'Maharashtra State' },
  { name: 'Pune District Admin', email: 'pune@sih.gov.in', role: 'District Officer', place: 'Pune, Maharashtra' },
  { name: 'Uttar Pradesh State Admin', email: 'up@sih.gov.in', role: 'State Officer', place: 'Uttar Pradesh State' },
  { name: 'Varanasi District Admin', email: 'varanasi@sih.gov.in', role: 'District Officer', place: 'Varanasi, Uttar Pradesh' },
  { name: 'Gujarat State Admin', email: 'gujarat@sih.gov.in', role: 'State Officer', place: 'Gujarat State' },
  { name: 'Ahmedabad District Admin', email: 'ahmedabad@sih.gov.in', role: 'District Officer', place: 'Ahmedabad, Gujarat' },
  { name: 'Tamil Nadu State Admin', email: 'tamilnadu@sih.gov.in', role: 'State Officer', place: 'Tamil Nadu State' },
  { name: 'Coimbatore District Admin', email: 'coimbatore@sih.gov.in', role: 'District Officer', place: 'Coimbatore, Tamil Nadu' },
  { name: 'Rajasthan State Admin', email: 'rajasthan@sih.gov.in', role: 'State Officer', place: 'Rajasthan State' },
  { name: 'Jaipur District Admin', email: 'jaipur@sih.gov.in', role: 'District Officer', place: 'Jaipur, Rajasthan' },
  { name: 'West Bengal State Admin', email: 'westbengal@sih.gov.in', role: 'State Officer', place: 'West Bengal State' },
  { name: 'Hooghly District Admin', email: 'hooghly@sih.gov.in', role: 'District Officer', place: 'Hooghly, West Bengal' },
  { name: 'Punjab State Admin', email: 'punjab@sih.gov.in', role: 'State Officer', place: 'Punjab State' },
  { name: 'Ludhiana District Admin', email: 'ludhiana@sih.gov.in', role: 'District Officer', place: 'Ludhiana, Punjab' },
  { name: 'Field Agent Ramesh', email: 'ramesh@sih.gov.in', role: 'Field Agent', place: 'Tumkur, Karnataka' }
];

const Login = () => {
  // Initialize with empty credential fields as requested
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handlePresetChange = (e) => {
    const val = e.target.value;
    setSelectedPreset(val);
    setEmail(val);
  };

  const handleSelectAccount = (accEmail) => {
    setSelectedPreset(accEmail);
    setEmail(accEmail);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      login(data.user, data.token);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Card sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: 2, bgcolor: '#0B1F5C', color: '#F59E0B', mb: 1.5 }}>
              <Public sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, color: '#0B1F5C' }}>
              DILRMP Officer Portal Login
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Geo-Aware Land Governance & Cadastral Acquisition Portal
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleLogin}>
            {/* Quick Admin Selector Dropdown */}
            <FormControl fullWidth margin="normal">
              <InputLabel id="place-admin-select-label">Select Regional / Place Admin Account</InputLabel>
              <Select
                labelId="place-admin-select-label"
                value={selectedPreset}
                label="Select Regional / Place Admin Account"
                onChange={handlePresetChange}
                renderValue={(val) => {
                  const acc = PRESET_ACCOUNTS.find(a => a.email === val);
                  return acc ? `${acc.name} — ${acc.place} (${acc.email})` : val;
                }}
              >
                {PRESET_ACCOUNTS.map((acc) => (
                  <MenuItem key={acc.email} value={acc.email}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{acc.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{acc.place}</Typography>
                      </Box>
                      <Chip label={acc.role} size="small" color={acc.role === 'Central Admin' ? 'primary' : acc.role === 'State Officer' ? 'warning' : 'success'} sx={{ ml: 2, height: 20, fontSize: '0.65rem' }} />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Officer Email Address"
              variant="outlined"
              margin="normal"
              placeholder="e.g. admin@sih.gov.in"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSelectedPreset(e.target.value);
              }}
            />

            {/* Password Field with Toggle Visibility Eye Icon Button */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Default demo password for all accounts is 'password'"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#0B1F5C' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: '#0B1F5C' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{ 
                mt: 3, mb: 3, py: 1.4, 
                bgcolor: '#0B1F5C', 
                fontWeight: 700, 
                fontSize: '1rem',
                '&:hover': { bgcolor: '#1E3A8A' } 
              }}
            >
              Sign In to Jurisdiction Portal
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Quick Select Buttons Grid */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminPanelSettings sx={{ fontSize: 18, color: '#F59E0B' }} /> Quick Switch Place Admins:
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {PRESET_ACCOUNTS.map((acc) => (
              <Chip
                key={acc.email}
                icon={<Place sx={{ fontSize: 14 }} />}
                label={`${acc.name.replace(' Admin', '').replace(' Officer', '')}`}
                onClick={() => handleSelectAccount(acc.email)}
                color={email === acc.email ? 'primary' : 'default'}
                variant={email === acc.email ? 'filled' : 'outlined'}
                sx={{ 
                  cursor: 'pointer', 
                  fontSize: '0.75rem',
                  fontWeight: email === acc.email ? 700 : 500,
                  bgcolor: email === acc.email ? '#0B1F5C' : undefined
                }}
              />
            ))}
          </Box>

        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;

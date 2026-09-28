import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('admin@sih.gov.in');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      login(data.user, data.token);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card sx={{ p: 2 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center" sx={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, color: 'primary.main' }}>
            Officer Portal Login
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Secure access for authorized personnel only.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Typography variant="caption" display="block" align="center" sx={{ color: 'text.secondary', mt: 2 }}>
              Seed credentials: admin@sih.gov.in / password
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;

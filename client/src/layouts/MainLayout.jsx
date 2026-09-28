import React, { useState } from 'react';
import { Outlet, Navigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, 
  IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Menu, MenuItem, Chip, Tooltip, Stack, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  InputAdornment
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard, Map, Description, 
  Assignment, AccountBalance, Logout, Public, FiberManualRecord,
  VerifiedUser, Language, TextFields, VpnKey, Visibility, VisibilityOff,
  ChevronRight, Security, Person
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 260;

const TICKER_ITEMS = [
  '⚡ [Tumkur, KA] SRV-100/B: Bhu-Aadhaar ULPIN verified with 0% boundary overlap',
  '⚡ [Pune, MH] SRV-105/A: 7/12 Satbara & Ferfar Mutation entry digitally signed',
  '⚡ [Varanasi, UP] SRV-112/C: Direct Benefit Transfer (DBT) ₹18.5L compensation approved',
  '⚡ [Ahmedabad, GJ] SRV-104/A: DGPS Cadastral Mesh certified by District Surveyor',
  '⚡ [Coimbatore, TN] SRV-110/B: 30-Year Nil Encumbrance Certificate (EC) issued',
  '⚡ [Jaipur, RJ] SRV-108/A: Section 11 RFCTLARR 2013 Gazette notification published'
];

const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // -1, 0, 1
  const [lang, setLang] = useState('EN');

  // Change password modal state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleOpenChangePassword = () => {
    handleMenuClose();
    setChangeError('');
    setChangeSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordOpen(true);
  };

  const handleCloseChangePassword = () => {
    setChangePasswordOpen(false);
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangeError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 4) {
      setChangeError('New password must be at least 4 characters.');
      return;
    }

    setSubmittingPassword(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setChangeSuccess('Password updated successfully! You can now use your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setChangeError(err.message);
    } finally {
      setSubmittingPassword(false);
    }
  };

  const menuItems = [
    { text: 'National Dashboard', icon: <Dashboard />, path: '/app/dashboard' },
    { text: 'Pan-India Cadastral Map', icon: <Map />, path: '/app/map' },
    { text: 'Land Records Master', icon: <Description />, path: '/app/records' },
    { text: 'Workflow Approvals', icon: <Assignment />, path: '/app/workflows' },
    { text: 'R&R Compensation', icon: <AccountBalance />, path: '/app/rr-tracker' },
    { text: 'Field Surveyor App', icon: <Description />, path: '/app/field-agent' },
  ];

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0B1F5C', color: 'white' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: 1.5, bgcolor: '#F59E0B',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B1F5C', fontWeight: 900
          }}>
            <Public sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF', fontFamily: 'Plus Jakarta Sans' }}>
              Bhu-Aadhaar
            </Typography>
            <Typography variant="caption" sx={{ color: '#93C5FD', fontSize: '0.65rem', fontWeight: 600 }}>
              DILRMP • SIH PORTAL
            </Typography>
          </Box>
        </Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.68rem', display: 'block', mt: 0.8 }}>
          Unified Land Governance & Acquisition Cadastre
        </Typography>
      </Box>

      {/* Navigation Links */}
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 1.5,
                  bgcolor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#CBD5E1',
                  borderLeft: isActive ? '4px solid #F59E0B' : '4px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <ListItemIcon sx={{ color: isActive ? '#F59E0B' : '#94A3B8', minWidth: 38 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Interactive User Card at bottom of Drawer */}
      <Box 
        onClick={handleMenuOpen}
        sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          bgcolor: 'rgba(0,0,0,0.2)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
            <Avatar sx={{ bgcolor: '#F59E0B', color: '#0B1F5C', fontWeight: 800, width: 36, height: 36, fontSize: '0.95rem' }}>
              {user.name.charAt(0)}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.1, noWrap: true }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#93C5FD', fontSize: '0.68rem', display: 'block' }}>
                {user.role} ({user.state || 'National'})
              </Typography>
            </Box>
          </Box>
          <ChevronRight sx={{ color: '#94A3B8', fontSize: 20 }} />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      
      {/* ── Top Government Header & AppBar ── */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#FFFFFF',
          color: '#0F172A',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          borderBottom: '1px solid #E2E8F0',
          zIndex: 1200
        }}
      >
        {/* Tricolor National Stripe */}
        <div className="tricolor-stripe" />

        {/* Official Gov Strip */}
        <Box sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center', justifyContent: 'space-between',
          px: 3, py: 0.5, bgcolor: '#0B1F5C', color: '#FFFFFF', fontSize: '0.72rem'
        }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#E2E8F0' }}>
            भारत सरकार • Government of India | डिजिटल भारत भूमि रिकॉर्ड आधुनिकीकरण कार्यक्रम (DILRMP)
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Accessibility: Font Resizer */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <TextFields sx={{ fontSize: 13, color: '#94A3B8' }} />
              <Button size="small" onClick={() => setFontSizeLevel(-1)} sx={{ color: 'white', minWidth: 20, p: 0, fontSize: '0.65rem' }}>A-</Button>
              <Button size="small" onClick={() => setFontSizeLevel(0)} sx={{ color: '#F59E0B', minWidth: 20, p: 0, fontSize: '0.65rem', fontWeight: 800 }}>A</Button>
              <Button size="small" onClick={() => setFontSizeLevel(1)} sx={{ color: 'white', minWidth: 20, p: 0, fontSize: '0.65rem' }}>A+</Button>
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
            {/* Language Switcher */}
            <Stack direction="row" spacing={0.8} alignItems="center">
              <Language sx={{ fontSize: 13, color: '#94A3B8' }} />
              {['EN', 'हिंदी', 'ಕನ್ನಡ'].map((l) => (
                <Typography
                  key={l}
                  onClick={() => setLang(l)}
                  variant="caption"
                  sx={{
                    cursor: 'pointer',
                    fontWeight: lang === l ? 800 : 400,
                    color: lang === l ? '#F59E0B' : '#CBD5E1',
                    fontSize: '0.68rem',
                    '&:hover': { color: '#FFFFFF' }
                  }}
                >
                  {l}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Box>

        {/* Main Toolbar */}
        <Toolbar sx={{ minHeight: { xs: 54, sm: 58 }, px: { xs: 2, sm: 3 } }}>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B1F5C', fontFamily: 'Plus Jakarta Sans', display: { xs: 'none', sm: 'block' } }}>
              National Land Portal
            </Typography>
            <Chip
              label="PROD v2.4 (LIVE)"
              size="small"
              sx={{ height: 18, fontSize: '0.58rem', fontWeight: 800, bgcolor: '#ECFDF5', color: '#065F46' }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* User profile & actions */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                {user.role} ({user.state || 'National'})
              </Typography>
            </Box>

            <Tooltip title="Officer Account Menu">
              <IconButton onClick={handleMenuOpen} sx={{ p: 0.5, border: '1px solid #CBD5E1' }}>
                <Avatar sx={{ bgcolor: '#0B1F5C', width: 32, height: 32, fontSize: '0.85rem', fontWeight: 700 }}>
                  {user.name.charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>

            {/* Combined User Profile Menu (Active for top-right and bottom-left icons) */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 4,
                sx: { minWidth: 220, borderRadius: 2, mt: 1, border: '1px solid #E2E8F0' }
              }}
            >
              <Box sx={{ px: 2, py: 1.5, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B1F5C' }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem' }}>
                  {user.email}
                </Typography>
                <Chip 
                  label={user.role} 
                  size="small" 
                  color="primary" 
                  sx={{ mt: 0.8, height: 18, fontSize: '0.6rem', fontWeight: 700 }} 
                />
              </Box>

              <MenuItem onClick={handleOpenChangePassword} sx={{ py: 1.2, fontSize: '0.85rem', fontWeight: 600 }}>
                <ListItemIcon><VpnKey fontSize="small" sx={{ color: '#0B1F5C' }} /></ListItemIcon>
                Change Password
              </MenuItem>

              <Divider />

              <MenuItem onClick={() => { handleMenuClose(); logout(); }} sx={{ py: 1.2, color: 'error.main', fontSize: '0.85rem', fontWeight: 700 }}>
                <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                Logout Session
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>

        {/* Live Government Ticker Ribbon */}
        <Box sx={{
          bgcolor: '#F1F5F9', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0',
          py: 0.4, px: 2, display: 'flex', alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mr: 2, flexShrink: 0 }}>
            <FiberManualRecord sx={{ fontSize: 9, color: '#10B981', animation: 'pulse 1.5s infinite' }} />
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#0B1F5C', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              National Ticker:
            </Typography>
          </Box>
          <div className="ticker-wrap">
            <div className="ticker-content">
              {TICKER_ITEMS.concat(TICKER_ITEMS).map((item, index) => (
                <Typography key={index} variant="caption" sx={{ mr: 4, fontSize: '0.72rem', color: '#334155', fontWeight: 500 }}>
                  {item}
                </Typography>
              ))}
            </div>
          </div>
        </Box>
      </AppBar>

      {/* ── Sidebar Navigation ── */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* ── Content Area ── */}
      <Box component="main" sx={{
        flexGrow: 1,
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        bgcolor: '#F8FAFC',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Spacer for AppBar + Header + Ticker */}
        <Box sx={{ height: { xs: 90, md: 104 } }} />
        <Box sx={{ flex: 1, p: { xs: 1.5, sm: 2.5 } }}>
          <Outlet />
        </Box>
      </Box>

      {/* ── Change Password Modal Dialog ── */}
      <Dialog 
        open={changePasswordOpen} 
        onClose={handleCloseChangePassword} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: '#0B1F5C', color: 'white', py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <VpnKey sx={{ color: '#F59E0B' }} />
          <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Plus Jakarta Sans', fontSize: '1.1rem' }}>
            Change Officer Password
          </Typography>
        </DialogTitle>

        <Box component="form" onSubmit={handleChangePasswordSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            {changeError && <Alert severity="error" sx={{ mb: 2 }}>{changeError}</Alert>}
            {changeSuccess && <Alert severity="success" sx={{ mb: 2 }}>{changeSuccess}</Alert>}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Update password for <strong>{user.email}</strong> ({user.role})
            </Typography>

            <TextField
              fullWidth
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              size="small"
              margin="normal"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end" size="small">
                        {showCurrentPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            <TextField
              fullWidth
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              size="small"
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small">
                        {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              type={showNewPassword ? 'text' : 'password'}
              size="small"
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={handleCloseChangePassword} color="inherit">
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={submittingPassword}
              sx={{ bgcolor: '#0B1F5C', fontWeight: 700, '&:hover': { bgcolor: '#1E3A8A' } }}
            >
              {submittingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default MainLayout;

import React, { useState } from 'react';
import { Outlet, Navigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, 
  IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Menu, MenuItem, Chip, Tooltip, Stack, Button
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard, Map, Description, 
  Assignment, AccountBalance, Logout, Public, FiberManualRecord,
  VerifiedUser, Language, TextFields
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

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

      {/* User Card at bottom of Drawer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)', bgcolor: 'rgba(0,0,0,0.15)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#F59E0B', color: '#0B1F5C', fontWeight: 800, width: 34, height: 34, fontSize: '0.9rem' }}>
            {user.name.charAt(0)}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', display: 'block', noWrap: true }}>
              {user.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#93C5FD', fontSize: '0.68rem', display: 'block' }}>
              {user.role}
            </Typography>
          </Box>
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

            <Tooltip title="Account & Logout">
              <IconButton onClick={handleMenu} sx={{ p: 0.5, border: '1px solid #CBD5E1' }}>
                <Avatar sx={{ bgcolor: '#0B1F5C', width: 32, height: 32, fontSize: '0.85rem', fontWeight: 700 }}>
                  {user.name.charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1, minWidth: 160 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { handleClose(); logout(); }} sx={{ color: 'error.main', fontSize: '0.85rem' }}>
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

      {/* ── Content Area (Pushed below top header & ticker) ── */}
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
    </Box>
  );
};

export default MainLayout;

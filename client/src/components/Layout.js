import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Science as ScienceIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle,
  Assignment as AssignmentIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  ExpandLess,
  ExpandMore,
  Biotech as BiotechIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Solicitudes', icon: <AssignmentIcon />, path: '/admin/requests', adminOnly: true },
  { text: 'Opciones de Participación', icon: <CategoryIcon />, path: '/admin/participation-options', adminOnly: true },
  { text: 'Proveedores', icon: <BusinessIcon />, path: '/admin/providers', adminOnly: true },
  { text: 'Usuarios', icon: <PeopleIcon />, path: '/admin/users', adminOnly: true },
  {
    text: 'Parámetros',
    icon: <BiotechIcon />,
    adminOnly: true,
    subItems: [
      { text: 'Instrumentos', path: '/admin/instruments' },
      { text: 'Marcas', path: '/admin/brands' },
      { text: 'Principios', path: '/admin/principles' },
      { text: 'Calibraciones', path: '/admin/calibrations' },
      { text: 'Reactivos', path: '/admin/reagents' },
      { text: 'Estándares', path: '/admin/standards' },
      { text: 'Temperaturas', path: '/admin/temperatures' },
      { text: 'Longitudes de Onda', path: '/admin/wavelengths' },
    ]
  },
  { text: 'Muestras Control', icon: <BiotechIcon />, path: '/admin/control-samples', adminOnly: true },
  { text: 'Envío de Resultados', icon: <ShippingIcon />, path: '/admin/shipments', adminOnly: true },
  { text: 'Configuración', icon: <SettingsIcon />, path: '/parameters' },
  { text: 'Estadísticas', icon: <AssessmentIcon />, path: '/statistics' },
];

const Layout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [parametersOpen, setParametersOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          background: `linear-gradient(135deg, ${colors.navyBlue} 0%, ${colors.cyan} 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <img
            src="/logo.jpeg"
            alt="QUALITTEST"
            style={{ width: '50px', height: '50px', objectFit: 'contain' }}
          />
          <Box sx={{ ml: 2 }}>
            <Typography variant="h6" color="white" fontWeight="bold">
              QUALITTEST
            </Typography>
            <Typography variant="caption" color="white" sx={{ opacity: 0.9 }}>
              Sistema
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Box sx={{ p: 2, bgcolor: colors.lightGray }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Laboratorio
        </Typography>
        <Typography variant="body2" fontWeight="500" noWrap>
          {user?.laboratory?.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Código: {user?.laboratory?.code}
        </Typography>
      </Box>

      <Divider />

      <List sx={{ px: 1, py: 2 }}>
        {menuItems
          .filter(item => !item.adminOnly || user?.role === 'admin')
          .map((item) => (
            <React.Fragment key={item.text}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => item.subItems ? setParametersOpen(!parametersOpen) : handleNavigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: colors.grayBlue,
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: colors.navyBlue }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                  {item.subItems && (parametersOpen ? <ExpandLess /> : <ExpandMore />)}
                </ListItemButton>
              </ListItem>
              {item.subItems && (
                <Collapse in={parametersOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItemButton
                        key={subItem.text}
                        onClick={() => handleNavigate(subItem.path)}
                        sx={{
                          pl: 4,
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: colors.grayBlue,
                          },
                        }}
                      >
                        <ListItemText primary={subItem.text} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: colors.navyBlue,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {/* Page title can be set dynamically */}
          </Typography>

          <IconButton onClick={handleMenuClick} color="inherit">
            <Avatar sx={{ bgcolor: colors.cyan, width: 36, height: 36 }}>
              <AccountCircle />
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">{user?.full_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: colors.lightGray,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;

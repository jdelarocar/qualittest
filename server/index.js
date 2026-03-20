const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/laboratories', require('./routes/laboratories'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/analytes', require('./routes/analytes'));
app.use('/api/parameters', require('./routes/parameters'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/results', require('./routes/results'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/register-request', require('./routes/registrationRequests'));
app.use('/api/participation-options', require('./routes/participationOptions'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/users', require('./routes/users'));

// Phase 3: Parameters Module
const createParameterRouter = require('./routes/parametersCRUD');
app.use('/api/instruments', createParameterRouter('instruments', 'name'));
app.use('/api/brands', createParameterRouter('brands', 'name'));
app.use('/api/principles', createParameterRouter('principles', 'name'));
app.use('/api/calibrations', createParameterRouter('calibrations', 'name'));
app.use('/api/standards', createParameterRouter('standards', 'name'));
app.use('/api/temperatures', createParameterRouter('temperatures', 'value'));
app.use('/api/wavelengths', createParameterRouter('wavelengths', 'value'));
app.use('/api/reagents', require('./routes/reagents'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PEEC System API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

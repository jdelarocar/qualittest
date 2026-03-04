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

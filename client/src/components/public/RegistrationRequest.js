import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors } from '../../theme';

const steps = ['Datos del Laboratorio', 'Químico Biólogo', 'Contacto y Facturación'];

const RegistrationRequest = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [participationOptions, setParticipationOptions] = useState([]);

  const [formData, setFormData] = useState({
    // Lab data
    lab_name: '',
    lab_email: '',
    lab_address: '',
    lab_country: 'Guatemala',
    lab_department: '',
    lab_phone: '',
    participation_option_id: '',
    payment_plan: 'annual',

    // QB data
    qb_name: '',
    qb_email: '',
    qb_phone: '',
    qb_license_number: '',

    // Contact data
    contact_name: '',
    contact_email: '',
    contact_phone: '',

    // Billing data
    billing_name: '',
    billing_nit: '',
    billing_address: '',
  });

  useEffect(() => {
    loadParticipationOptions();
  }, []);

  const loadParticipationOptions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/participation-options`);
      setParticipationOptions(response.data);
    } catch (error) {
      console.error('Error loading participation options:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!formData.lab_name || !formData.lab_email || !formData.lab_address ||
          !formData.lab_department || !formData.lab_phone) {
        setError('Por favor complete todos los campos obligatorios');
        return false;
      }
      if (!formData.participation_option_id) {
        setError('Debe seleccionar una opción de participación');
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(formData.lab_email)) {
        setError('Email inválido');
        return false;
      }
    } else if (activeStep === 1) {
      if (!formData.qb_name || !formData.qb_email || !formData.qb_phone || !formData.qb_license_number) {
        setError('Por favor complete todos los campos obligatorios');
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(formData.qb_email)) {
        setError('Email inválido');
        return false;
      }
    } else if (activeStep === 2) {
      if (!formData.billing_name || !formData.billing_nit || !formData.billing_address) {
        setError('Por favor complete todos los campos obligatorios');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError('');

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/register-request`, formData);
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${colors.navyBlue} 0%, ${colors.cyan} 100%)`,
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Card elevation={6}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" gutterBottom>
                ¡Solicitud Enviada!
              </Typography>
              <Typography variant="body1" sx={{ my: 3 }}>
                Su solicitud ha sido recibida exitosamente. Recibirá una respuesta en las próximas 48 horas
                en el correo electrónico proporcionado.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{ mt: 2 }}
              >
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.navyBlue} 0%, ${colors.cyan} 100%)`,
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Card elevation={6}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <img
                src="/logo.jpeg"
                alt="QUALITTEST"
                style={{ maxWidth: '150px', marginBottom: '20px' }}
              />
              <Typography variant="h4" color="primary" gutterBottom>
                Solicitud de Registro
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete el formulario para unirse al programa QUALITTEST
              </Typography>
            </Box>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Step 0: Lab Data */}
            {activeStep === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Datos del Laboratorio
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Nombre del Laboratorio"
                    name="lab_name"
                    value={formData.lab_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Correo Electrónico"
                    name="lab_email"
                    type="email"
                    value={formData.lab_email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Teléfono"
                    name="lab_phone"
                    value={formData.lab_phone}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Dirección"
                    name="lab_address"
                    value={formData.lab_address}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>País</InputLabel>
                    <Select
                      name="lab_country"
                      value={formData.lab_country}
                      onChange={handleChange}
                      label="País"
                    >
                      <MenuItem value="Guatemala">Guatemala</MenuItem>
                      <MenuItem value="El Salvador">El Salvador</MenuItem>
                      <MenuItem value="Honduras">Honduras</MenuItem>
                      <MenuItem value="Nicaragua">Nicaragua</MenuItem>
                      <MenuItem value="Costa Rica">Costa Rica</MenuItem>
                      <MenuItem value="Panamá">Panamá</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Departamento/Estado"
                    name="lab_department"
                    value={formData.lab_department}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Opción de Participación</InputLabel>
                    <Select
                      name="participation_option_id"
                      value={formData.participation_option_id || ''}
                      onChange={handleChange}
                      label="Opción de Participación"
                    >
                      {participationOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name} - Q{parseFloat(option.price).toFixed(2)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Forma de Pago *</FormLabel>
                    <RadioGroup
                      row
                      name="payment_plan"
                      value={formData.payment_plan}
                      onChange={handleChange}
                    >
                      <FormControlLabel value="annual" control={<Radio />} label="Anual" />
                      <FormControlLabel value="two_payments" control={<Radio />} label="2 Cuotas" />
                      <FormControlLabel value="three_payments" control={<Radio />} label="3 Cuotas" />
                      <FormControlLabel value="six_payments" control={<Radio />} label="6 Cuotas" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            {/* Step 1: QB Data */}
            {activeStep === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Datos del Químico Biólogo
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Nombre Completo"
                    name="qb_name"
                    value={formData.qb_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Correo Electrónico"
                    name="qb_email"
                    type="email"
                    value={formData.qb_email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Celular"
                    name="qb_phone"
                    value={formData.qb_phone}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Número de Colegiado"
                    name="qb_license_number"
                    value={formData.qb_license_number}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            )}

            {/* Step 2: Contact & Billing */}
            {activeStep === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Datos de Contacto
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre del Responsable"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Datos de Facturación
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Nombre (Razón Social)"
                    name="billing_name"
                    value={formData.billing_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="NIT"
                    name="billing_nit"
                    value={formData.billing_nit}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Dirección Fiscal"
                    name="billing_address"
                    value={formData.billing_address}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Atrás
              </Button>
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Enviar Solicitud'}
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext}>
                    Siguiente
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default RegistrationRequest;

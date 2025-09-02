// src/utils/validation.js
// Utilidades de validación para Costa Rica

/**
 * Valida el formato de cédula costarricense
 * Formato: #-####-#### donde # puede ser 1-9
 */
export const validateCedulaFormat = (cedula) => {
  if (!cedula) return { valid: false, error: 'Cédula es requerida' };
  
  // Remover espacios y guiones para validación
  const cleanCedula = cedula.replace(/[\s-]/g, '');
  
  // Debe tener 9 dígitos
  if (cleanCedula.length !== 9) {
    return { valid: false, error: 'La cédula debe tener 9 dígitos' };
  }
  
  // Solo debe contener números
  if (!/^\d{9}$/.test(cleanCedula)) {
    return { valid: false, error: 'La cédula solo debe contener números' };
  }
  
  // El primer dígito debe ser 1-9 (no puede ser 0)
  const firstDigit = parseInt(cleanCedula[0]);
  if (firstDigit < 1 || firstDigit > 9) {
    return { valid: false, error: 'El primer dígito debe ser entre 1 y 9' };
  }
  
  return { valid: true, cleanCedula, formatted: formatCedula(cleanCedula) };
};

/**
 * Formatea una cédula con guiones
 * Ejemplo: "123456789" -> "1-2345-6789"
 */
export const formatCedula = (cedula) => {
  if (!cedula) return '';
  
  const clean = cedula.replace(/[\s-]/g, '');
  if (clean.length !== 9) return cedula;
  
  return `${clean[0]}-${clean.substring(1, 5)}-${clean.substring(5)}`;
};

/**
 * Valida número de teléfono costarricense
 * Formatos aceptados: 8888-8888, 88888888, 2222-2222, 22222222
 */
export const validatePhoneFormat = (phone) => {
  if (!phone) return { valid: false, error: 'Teléfono es requerido' };
  
  // Remover espacios y guiones
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  // Debe tener 8 dígitos
  if (cleanPhone.length !== 8) {
    return { valid: false, error: 'El teléfono debe tener 8 dígitos' };
  }
  
  // Solo números
  if (!/^\d{8}$/.test(cleanPhone)) {
    return { valid: false, error: 'El teléfono solo debe contener números' };
  }
  
  // Validar prefijos válidos en Costa Rica
  const firstDigit = cleanPhone[0];
  const validPrefixes = ['2', '4', '5', '6', '7', '8', '9'];
  
  if (!validPrefixes.includes(firstDigit)) {
    return { valid: false, error: 'Prefijo de teléfono no válido para Costa Rica' };
  }
  
  return { valid: true, cleanPhone, formatted: formatPhone(cleanPhone) };
};

/**
 * Formatea número de teléfono con guión
 * Ejemplo: "88888888" -> "8888-8888"
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  const clean = phone.replace(/[\s-]/g, '');
  if (clean.length !== 8) return phone;
  
  return `${clean.substring(0, 4)}-${clean.substring(4)}`;
};

/**
 * Valida email
 */
export const validateEmail = (email) => {
  if (!email) return { valid: false, error: 'Email es requerido' };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Formato de email inválido' };
  }
  
  return { valid: true };
};

/**
 * Valida nombre de usuario
 * - Mínimo 3 caracteres
 * - Solo letras, números y guiones bajos
 * - Debe empezar con letra
 */
export const validateUsername = (username) => {
  if (!username) return { valid: false, error: 'Nombre de usuario es requerido' };
  
  if (username.length < 3) {
    return { valid: false, error: 'Mínimo 3 caracteres' };
  }
  
  if (username.length > 20) {
    return { valid: false, error: 'Máximo 20 caracteres' };
  }
  
  // Solo letras, números y guiones bajos
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
    return { valid: false, error: 'Solo letras, números y guiones bajos. Debe empezar con letra' };
  }
  
  return { valid: true };
};

/**
 * Valida contraseña
 * - Mínimo 6 caracteres
 * - Al menos una letra y un número
 */
export const validatePassword = (password) => {
  if (!password) return { valid: false, error: 'Contraseña es requerida' };
  
  if (password.length < 6) {
    return { valid: false, error: 'Mínimo 6 caracteres' };
  }
  
  // Al menos una letra
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Debe contener al menos una letra' };
  }
  
  // Al menos un número
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Debe contener al menos un número' };
  }
  
  return { valid: true };
};

/**
 * Valida formulario completo de registro
 */
export const validateRegistrationForm = (formData) => {
  const errors = {};
  
  // Validar cada campo
  const usernameValidation = validateUsername(formData.username);
  if (!usernameValidation.valid) errors.username = usernameValidation.error;
  
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.valid) errors.email = emailValidation.error;
  
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.valid) errors.password = passwordValidation.error;
  
  const phoneValidation = validatePhoneFormat(formData.phone);
  if (!phoneValidation.valid) errors.phone = phoneValidation.error;
  
  const cedulaValidation = validateCedulaFormat(formData.cedula);
  if (!cedulaValidation.valid) errors.cedula = cedulaValidation.error;
  
  if (!formData.province) {
    errors.province = 'Provincia es requerida';
  }
  
  const isValid = Object.keys(errors).length === 0;
  
  return {
    valid: isValid,
    errors,
    // Datos formateados si son válidos
    formattedData: isValid ? {
      ...formData,
      phone: phoneValidation.formatted || formData.phone,
      cedula: cedulaValidation.formatted || formData.cedula
    } : null
  };
};

// Utilidad para obtener mensaje de error amigable
export const getValidationMessage = (field, error) => {
  const messages = {
    cedula: 'Cédula: ' + error,
    phone: 'Teléfono: ' + error,
    email: 'Email: ' + error,
    username: 'Usuario: ' + error,
    password: 'Contraseña: ' + error,
    province: 'Provincia: ' + error
  };
  
  return messages[field] || error;
};
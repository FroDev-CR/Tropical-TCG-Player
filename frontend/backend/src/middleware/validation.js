// src/middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

// Middleware para procesar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: formattedErrors
    });
  }
  
  next();
};

// Validaciones para autenticación
const validateRegister = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('El username debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El username solo puede contener letras, números y guiones bajos'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre completo debe tener entre 2 y 100 caracteres')
    .trim(),
  
  body('phone')
    .matches(/^[0-9]{4}-[0-9]{4}$/)
    .withMessage('El teléfono debe tener el formato ####-####'),
  
  body('province')
    .isIn(['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'])
    .withMessage('Provincia inválida'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
  
  handleValidationErrors
];

// Validaciones para listings
const validateCreateListing = [
  body('cardId')
    .notEmpty()
    .withMessage('ID de carta es requerido'),
  
  body('cardName')
    .isLength({ min: 1, max: 200 })
    .withMessage('El nombre de carta debe tener entre 1 y 200 caracteres')
    .trim(),
  
  body('tcgType')
    .isIn(['pokemon', 'magic', 'onepiece', 'dragonball', 'digimon', 'unionarena', 'gundam'])
    .withMessage('Tipo de TCG inválido'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  
  body('condition')
    .isIn(['mint', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged'])
    .withMessage('Condición de carta inválida'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero positivo'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres')
    .trim(),
  
  handleValidationErrors
];

const validateUpdateListing = [
  param('id')
    .isMongoId()
    .withMessage('ID de listing inválido'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  
  body('condition')
    .optional()
    .isIn(['mint', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged'])
    .withMessage('Condición de carta inválida'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero positivo'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres')
    .trim(),
  
  handleValidationErrors
];

// Validaciones para binders
const validateCreateBinder = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre del binder debe tener entre 1 y 100 caracteres')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres')
    .trim(),
  
  body('tcgType')
    .optional()
    .isIn(['pokemon', 'magic', 'onepiece', 'dragonball', 'digimon', 'unionarena', 'gundam', 'mixed'])
    .withMessage('Tipo de TCG inválido'),
  
  handleValidationErrors
];

const validateAddCardToBinder = [
  param('id')
    .isMongoId()
    .withMessage('ID de binder inválido'),
  
  body('cardId')
    .notEmpty()
    .withMessage('ID de carta es requerido'),
  
  body('cardName')
    .isLength({ min: 1, max: 200 })
    .withMessage('El nombre de carta debe tener entre 1 y 200 caracteres')
    .trim(),
  
  body('tcgType')
    .isIn(['pokemon', 'magic', 'onepiece', 'dragonball', 'digimon', 'unionarena', 'gundam'])
    .withMessage('Tipo de TCG inválido'),
  
  body('condition')
    .isIn(['mint', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged'])
    .withMessage('Condición de carta inválida'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero positivo'),
  
  body('estimatedValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El valor estimado debe ser un número positivo'),
  
  handleValidationErrors
];

// Validaciones para perfil de usuario
const validateUpdateProfile = [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre completo debe tener entre 2 y 100 caracteres')
    .trim(),
  
  body('phone')
    .optional()
    .matches(/^[0-9]{4}-[0-9]{4}$/)
    .withMessage('El teléfono debe tener el formato ####-####'),
  
  body('province')
    .optional()
    .isIn(['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'])
    .withMessage('Provincia inválida'),
  
  handleValidationErrors
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
  
  handleValidationErrors
];

// Validaciones para paginación
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser entre 1 y 100'),
  
  handleValidationErrors
];

// Validaciones para MongoDB IDs
const validateMongoId = (field = 'id') => [
  param(field)
    .isMongoId()
    .withMessage(`${field} inválido`),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateCreateListing,
  validateUpdateListing,
  validateCreateBinder,
  validateAddCardToBinder,
  validateUpdateProfile,
  validateChangePassword,
  validatePagination,
  validateMongoId
};
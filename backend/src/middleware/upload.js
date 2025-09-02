// src/middleware/upload.js
// Middleware de subida de archivos con Cloudinary

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const config = require('../config');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

class UploadService {
  constructor() {
    this.cloudinary = cloudinary;
  }

  /**
   * Crear storage para diferentes tipos de imágenes
   */
  createStorage(folder, transformation = {}) {
    return new CloudinaryStorage({
      cloudinary: this.cloudinary,
      params: {
        folder: `tropical-tcg/${folder}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: {
          width: 800,
          height: 600,
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto',
          ...transformation
        },
        public_id: (req, file) => {
          // Generar ID único basado en timestamp y usuario
          const timestamp = Date.now();
          const userId = req.user?._id || 'anonymous';
          const cleanFileName = file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_');
          return `${userId}_${timestamp}_${cleanFileName}`;
        },
      },
    });
  }

  /**
   * Storage para fotos de perfil
   */
  get profilePictureStorage() {
    return this.createStorage('profiles', {
      width: 400,
      height: 400,
      crop: 'fill',
      gravity: 'face'
    });
  }

  /**
   * Storage para imágenes de cartas en listings
   */
  get listingImageStorage() {
    return this.createStorage('listings', {
      width: 600,
      height: 600,
      crop: 'fit',
      background: 'white'
    });
  }

  /**
   * Storage para verificación de identidad
   */
  get verificationImageStorage() {
    return this.createStorage('verification', {
      width: 1200,
      height: 1200,
      crop: 'limit',
      quality: 'auto:best'
    });
  }

  /**
   * Storage para comprobantes de transacciones
   */
  get transactionProofStorage() {
    return this.createStorage('transaction-proofs', {
      width: 1000,
      height: 1000,
      crop: 'limit',
      quality: 'auto:best'
    });
  }

  /**
   * Filtro de archivos
   */
  fileFilter(req, file, cb) {
    // Verificar tipo MIME
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG, GIF y WebP.'), false);
    }

    // Verificar usuario autenticado para uploads protegidos
    if (req.route && req.route.path.includes('profile') && !req.user) {
      return cb(new Error('Debes estar autenticado para subir imágenes de perfil.'), false);
    }

    cb(null, true);
  }

  /**
   * Crear configuración de multer para diferentes tipos de upload
   */
  createUploadConfig(storage, limits = {}) {
    const defaultLimits = {
      fileSize: config.security.maxFileSize, // 5MB
      files: config.security.maxFilesPerUpload // 5 archivos
    };

    return multer({
      storage,
      fileFilter: this.fileFilter,
      limits: { ...defaultLimits, ...limits }
    });
  }

  /**
   * Middleware para foto de perfil
   */
  get profilePicture() {
    return this.createUploadConfig(this.profilePictureStorage, {
      files: 1,
      fileSize: 2 * 1024 * 1024 // 2MB para perfiles
    });
  }

  /**
   * Middleware para imágenes de listings
   */
  get listingImages() {
    return this.createUploadConfig(this.listingImageStorage, {
      files: 5, // Máximo 5 imágenes por listing
      fileSize: 3 * 1024 * 1024 // 3MB por imagen
    });
  }

  /**
   * Middleware para verificación de identidad
   */
  get verificationImages() {
    return this.createUploadConfig(this.verificationImageStorage, {
      files: 3, // Cédula frente, atrás, selfie
      fileSize: 5 * 1024 * 1024 // 5MB para verificación
    });
  }

  /**
   * Middleware para comprobantes de transacciones
   */
  get transactionProof() {
    return this.createUploadConfig(this.transactionProofStorage, {
      files: 1,
      fileSize: 3 * 1024 * 1024 // 3MB para comprobantes
    });
  }

  /**
   * Eliminar imagen de Cloudinary
   */
  async deleteImage(publicId) {
    try {
      const result = await this.cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('❌ Error eliminando imagen de Cloudinary:', error);
      return false;
    }
  }

  /**
   * Obtener URL de imagen con transformaciones
   */
  getImageUrl(publicId, transformations = {}) {
    if (!publicId) return null;
    
    return this.cloudinary.url(publicId, {
      secure: true,
      ...transformations
    });
  }

  /**
   * Obtener múltiples variantes de una imagen
   */
  getImageVariants(publicId) {
    if (!publicId) return {};
    
    return {
      original: this.getImageUrl(publicId),
      thumbnail: this.getImageUrl(publicId, { 
        width: 150, 
        height: 150, 
        crop: 'fill' 
      }),
      medium: this.getImageUrl(publicId, { 
        width: 400, 
        height: 400, 
        crop: 'fit' 
      }),
      large: this.getImageUrl(publicId, { 
        width: 800, 
        height: 600, 
        crop: 'fit' 
      })
    };
  }

  /**
   * Validar configuración de Cloudinary
   */
  validateConfig() {
    const required = ['cloudName', 'apiKey', 'apiSecret'];
    const missing = required.filter(key => !config.cloudinary[key]);
    
    if (missing.length > 0) {
      console.warn(`⚠️ Cloudinary no configurado. Faltan: ${missing.join(', ')}`);
      return false;
    }
    
    return true;
  }

  /**
   * Middleware de manejo de errores de upload
   */
  handleUploadError(error, req, res, next) {
    console.error('❌ Error en upload:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'Archivo muy grande',
          message: 'El archivo excede el tamaño máximo permitido'
        });
      }
      
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({
          error: 'Demasiados archivos',
          message: 'Excedes el límite de archivos permitidos'
        });
      }
      
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          error: 'Campo de archivo inesperado',
          message: 'El campo de archivo no coincide con el esperado'
        });
      }
    }
    
    // Error de tipo de archivo
    if (error.message.includes('Tipo de archivo no permitido')) {
      return res.status(400).json({
        error: 'Tipo de archivo no permitido',
        message: error.message
      });
    }
    
    // Error genérico de upload
    res.status(500).json({
      error: 'Error de subida',
      message: 'Error interno procesando la imagen'
    });
  }

  /**
   * Middleware para limpiar archivos temporales en caso de error
   */
  cleanup(req, res, next) {
    // Si hay archivos subidos y ocurre un error posterior,
    // intentar eliminarlos de Cloudinary
    res.on('error', async () => {
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          if (file.filename) {
            await this.deleteImage(file.filename);
          }
        }
      } else if (req.file && req.file.filename) {
        await this.deleteImage(req.file.filename);
      }
    });
    
    next();
  }
}

// Instancia singleton
const uploadService = new UploadService();

// Verificar configuración al cargar
if (process.env.NODE_ENV !== 'test') {
  uploadService.validateConfig();
}

module.exports = uploadService;
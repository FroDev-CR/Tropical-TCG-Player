# 🎯 Tropical TCG Players - Backend API

Backend escalable para la plataforma de Trading Card Games P2P de Costa Rica.

## 🚀 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT + bcrypt
- **Validation:** Joi + express-validator
- **File Upload:** Multer + Cloudinary
- **Real-time:** Socket.io
- **Testing:** Jest + Supertest

## 📋 Requisitos

- Node.js >= 18.0.0
- MongoDB (local o Atlas)
- npm o yarn

## ⚡ Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Modo desarrollo
npm run dev

# Producción
npm start
```

## 🌐 Endpoints Principales

### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/refresh` - Renovar token

### Usuarios
- `GET /api/v1/users/profile` - Perfil del usuario
- `PUT /api/v1/users/profile` - Actualizar perfil
- `POST /api/v1/users/verify-phone` - Verificar teléfono
- `POST /api/v1/users/verify-cedula` - Verificar cédula

### Listados
- `GET /api/v1/listings` - Obtener listados
- `POST /api/v1/listings` - Crear listado
- `PUT /api/v1/listings/:id` - Actualizar listado
- `DELETE /api/v1/listings/:id` - Eliminar listado

### Transacciones P2P
- `GET /api/v1/transactions` - Mis transacciones
- `POST /api/v1/transactions` - Crear transacción
- `PUT /api/v1/transactions/:id/accept` - Aceptar transacción
- `PUT /api/v1/transactions/:id/reject` - Rechazar transacción

### Cartas
- `GET /api/v1/cards/search` - Buscar cartas
- `GET /api/v1/cards/:id` - Detalles de carta

## 🗂️ Estructura del Proyecto

```
src/
├── config/           # Configuraciones (DB, JWT, etc)
├── models/           # Modelos Mongoose
├── controllers/      # Controladores de rutas
├── services/         # Lógica de negocio
├── middleware/       # Middlewares Express
├── routes/           # Definición de rutas
├── utils/            # Utilidades
├── validators/       # Validaciones
└── app.js           # Configuración Express
```

## 🔧 Scripts Disponibles

```bash
npm run dev         # Desarrollo con nodemon
npm start           # Producción
npm test            # Ejecutar tests
npm run test:watch  # Tests en modo watch
npm run lint        # Linting
npm run lint:fix    # Arreglar problemas de linting
```

## 🔐 Autenticación

El sistema usa JWT (JSON Web Tokens) para autenticación:

```javascript
// Headers requeridos para rutas protegidas
Authorization: Bearer <jwt_token>
```

## 📊 Base de Datos

### Colecciones Principales

- `users` - Información de usuarios y verificación
- `listings` - Listados de cartas en venta
- `transactions` - Transacciones P2P
- `notifications` - Sistema de notificaciones
- `ratings` - Calificaciones mutuas
- `disputes` - Gestión de disputas
- `stores` - Red de tiendas físicas

## 🚀 Despliegue

### Variables de Entorno Requeridas

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=tu-secreto-seguro
FRONTEND_URL=https://tropicaltcg.com
```

### Plataformas Recomendadas

- **Railway** - Fácil deployment con Git
- **Render** - Free tier generoso
- **DigitalOcean** - App Platform
- **Heroku** - Clásico y confiable

## 📝 Desarrollo

### Estructura de Commits

```bash
git commit -m "feat: agregar endpoint de transacciones"
git commit -m "fix: corregir validación de cédula"
git commit -m "docs: actualizar README"
```

### Testing

```bash
# Tests unitarios
npm test

# Tests específicos
npm test -- --grep "authentication"

# Coverage
npm test -- --coverage
```

## 🤝 Contribuir

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'feat: agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📜 Licencia

MIT License - ver archivo `LICENSE` para más detalles.

## 🆘 Soporte

- **Issues:** [GitHub Issues](https://github.com/tu-usuario/tropical-tcg-backend/issues)
- **Docs:** `/docs` en la API
- **Email:** dev@tropicaltcg.com

---

**Estado:** 🚧 En desarrollo activo
**Versión:** 1.0.0
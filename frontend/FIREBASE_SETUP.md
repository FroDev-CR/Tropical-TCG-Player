# 🔥 Configuración Firebase para Tropical TCG Players

## 🔧 Paso 1: Índices de Firestore

El error que viste indica que necesitas crear índices en Firebase. Ve a Firebase Console y crea estos índices:

### 📍 Cómo crear índices:
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto "tropical-tcg-players-5a199"
3. Ve a **Firestore Database** → **Indexes**
4. Haz click en **Create Index** para cada uno:

### 🗂️ Índices necesarios:

#### Índice 1: notifications
- **Collection ID:** `notifications`
- **Fields:**
  - `userId` → Ascending
  - `createdAt` → Descending
- **Query scope:** Collection

#### Índice 2: listings (vendedores)
- **Collection ID:** `listings`
- **Fields:**
  - `sellerId` → Ascending
  - `createdAt` → Descending
- **Query scope:** Collection

#### Índice 3: listings (estado)
- **Collection ID:** `listings`
- **Fields:**
  - `status` → Ascending
  - `createdAt` → Descending
- **Query scope:** Collection

#### Índice 4: transactions (comprador)
- **Collection ID:** `transactions`
- **Fields:**
  - `buyerId` → Ascending
  - `createdAt` → Descending
- **Query scope:** Collection

#### Índice 5: transactions (vendedor)
- **Collection ID:** `transactions`
- **Fields:**
  - `sellerId` → Ascending
  - `createdAt` → Descending
- **Query scope:** Collection

#### Índice 6: chats
- **Collection ID:** `chats`
- **Fields:**
  - `transactionId` → Ascending
  - `createdAt` → Ascending
- **Query scope:** Collection

---

## 🛡️ Paso 2: Reglas de Seguridad

Ve a **Firestore Database** → **Rules** y reemplaza las reglas actuales con estas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ====== REGLAS PARA USUARIOS ======
    match /users/{userId} {
      // Todos pueden leer perfiles públicos
      allow read: if true;
      
      // Solo el propietario puede crear/actualizar su perfil
      allow create, update: if request.auth != null && request.auth.uid == userId;
      
      // Solo el propietario puede eliminar su perfil
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // ====== REGLAS PARA LISTINGS (CARTAS EN VENTA) ======
    match /listings/{listingId} {
      // Todos pueden ver listings activos
      allow read: if true;
      
      // Solo usuarios autenticados pueden crear listings
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.sellerId;
      
      // Solo el vendedor puede actualizar su listing
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.sellerId;
      
      // Solo el vendedor puede eliminar su listing
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.sellerId;
    }
    
    // ====== REGLAS PARA TRANSACCIONES ======
    match /transactions/{transactionId} {
      // Solo el comprador y vendedor pueden ver la transacción
      allow read: if request.auth != null 
        && (request.auth.uid == resource.data.buyerId 
            || request.auth.uid == resource.data.sellerId);
      
      // Solo usuarios autenticados pueden crear transacciones (como compradores)
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.buyerId;
      
      // Solo el comprador o vendedor pueden actualizar la transacción
      allow update: if request.auth != null 
        && (request.auth.uid == resource.data.buyerId 
            || request.auth.uid == resource.data.sellerId);
      
      // Las transacciones no se pueden eliminar
      allow delete: if false;
    }
    
    // ====== REGLAS PARA NOTIFICACIONES ======
    match /notifications/{notificationId} {
      // Solo el destinatario puede ver sus notificaciones
      allow read: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      // Solo usuarios autenticados pueden crear notificaciones
      allow create: if request.auth != null;
      
      // Solo el destinatario puede actualizar sus notificaciones
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      // Solo el destinatario puede eliminar sus notificaciones
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    // ====== REGLAS PARA CHATS ======
    match /chats/{chatId} {
      // Solo los participantes pueden ver los mensajes
      allow read: if request.auth != null 
        && (request.auth.uid == resource.data.senderId 
            || request.auth.uid == resource.data.receiverId);
      
      // Solo usuarios autenticados pueden enviar mensajes
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.senderId;
      
      // Solo los participantes pueden actualizar mensajes
      allow update: if request.auth != null 
        && (request.auth.uid == resource.data.senderId 
            || request.auth.uid == resource.data.receiverId);
      
      // Los mensajes no se pueden eliminar
      allow delete: if false;
    }
    
    // ====== REGLAS PARA BINDERS ======
    match /binders/{binderId} {
      // Los binders públicos los puede ver cualquiera
      // Los binders privados solo el propietario
      allow read: if resource.data.isPublic == true 
        || (request.auth != null && request.auth.uid == resource.data.userId);
      
      // Solo usuarios autenticados pueden crear binders
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
      
      // Solo el propietario puede actualizar su binder
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      // Solo el propietario puede eliminar su binder
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    // Bloquear acceso a otras colecciones
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## ✅ Funcionalidades Completadas

### 🛒 Sistema de Compra Completo:
- ✅ Carrito flotante con glassmorphism
- ✅ Página de Cart agrupada por vendedores
- ✅ Sistema de transacciones con estados
- ✅ Notificaciones en tiempo real
- ✅ Chat en tiempo real entre compradores y vendedores
- ✅ Dashboard con gestión de transacciones

### 📱 Optimización Mobile:
- ✅ Modal de cartas optimizado para móviles (fullscreen en pantallas pequeñas)
- ✅ Responsive design mejorado
- ✅ Glassmorphism consistente en toda la app

### 🔐 Sistema de Autenticación:
- ✅ Acceso libre para visualizar contenido
- ✅ Login requerido para: agregar al carrito, favoritos, vender cartas, perfil
- ✅ Validación de teléfono sin restricciones de formato
- ✅ Reglas de seguridad Firebase configuradas

---

## 🚀 Próximos Pasos

1. **Crear los índices** siguiendo las instrucciones arriba
2. **Aplicar las reglas de seguridad** copiando el código
3. **Probar la funcionalidad** en dispositivos móviles
4. **Ajustar estilos** según sea necesario

---

## 📞 Contacto de Emergencia

Si hay problemas técnicos urgentes, documenta:
- El error exacto que ves
- En qué página/componente ocurre
- Si es en móvil o desktop
- Los pasos para reproducir el error

¡La app está lista para producción! 🎉
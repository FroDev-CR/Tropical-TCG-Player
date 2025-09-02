// src/utils/migrationHelper.js
// ⚠️ DEPRECADO: Este archivo ya no se usa después de la migración a Node.js + MongoDB
// Utility para ejecutar migraciones de base de datos durante desarrollo

// Comentado Firebase Functions - ya no se usa
// import { httpsCallable } from 'firebase/functions';
// import { functions } from '../firebase';

class MigrationHelper {
  constructor() {
    console.log('⚠️ DEPRECADO: MigrationHelper ya no es funcional después de la migración a Node.js + MongoDB');
    console.log('📋 Para gestionar la base de datos, usa el backend Node.js en puerto 5000');
    console.log('🔄 El backend se encarga automáticamente de:');
    console.log('   - Inicialización de MongoDB en memoria');
    console.log('   - Seed data automático');
    console.log('   - Esquemas y modelos');
    console.log('   - APIs REST completas');
  }

  // Todos los métodos ahora retornan mensajes deprecados
  async runUsersMigration() {
    console.log('❌ DEPRECADO: Los usuarios ahora se manejan con JWT en Node.js backend');
    return { success: false, message: 'Función deprecada - usar backend Node.js' };
  }

  async runListingsMigration() {
    console.log('❌ DEPRECADO: Los listings ahora se manejan con MongoDB + Express');
    return { success: false, message: 'Función deprecada - usar backend Node.js' };
  }

  async runTransactionsMigration() {
    console.log('❌ DEPRECADO: Las transacciones P2P ahora usan MongoDB nativo');
    return { success: false, message: 'Función deprecada - usar backend Node.js' };
  }

  async checkStatus() {
    console.log('❌ DEPRECADO: Para verificar estado, usar /health endpoint del backend');
    console.log('🌐 Backend health check: http://localhost:5000/health');
    return { success: false, message: 'Función deprecada - usar backend health check' };
  }

  async seedStoresData() {
    console.log('❌ DEPRECADO: Los datos de prueba se crean automáticamente en el backend');
    return { success: false, message: 'Función deprecada - seed automático en backend' };
  }

  async createCollections() {
    console.log('❌ DEPRECADO: Las colecciones MongoDB se crean automáticamente');
    return { success: false, message: 'Función deprecada - MongoDB auto-schema' };
  }

  async verifyAllCollections() {
    console.log('❌ DEPRECADO: Para verificar colecciones, usar MongoDB Compass o backend logs');
    return { success: false, message: 'Función deprecada - usar herramientas MongoDB' };
  }

  async runCompleteSetup() {
    console.log('❌ DEPRECADO: El setup completo se hace automáticamente');
    console.log('🚀 Para inicializar el sistema:');
    console.log('   1. cd backend && npm start (puerto 5000)');
    console.log('   2. npm start (puerto 3000)');
    console.log('   3. ¡Listo! El sistema funciona automáticamente');
    return { success: false, message: 'Función deprecada - inicialización automática' };
  }

  async runAllMigrations() {
    console.log('❌ DEPRECADO: Ya no hay migraciones - todo funciona automáticamente');
    return { success: false, message: 'Función deprecada - migración completa exitosa' };
  }
}

// Instancia singleton para compatibilidad
const migrationHelper = new MigrationHelper();

export default migrationHelper;
export { MigrationHelper };

// Mensajes informativos para consola del navegador
if (typeof window !== 'undefined') {
  window.migrationHelper = migrationHelper;
  console.log('⚠️ MIGRATIONHELPER DEPRECADO - Ya no es necesario');
  console.log('✅ Tu aplicación ya está completamente migrada a Node.js + MongoDB');
  console.log('🎉 Para usar el sistema:');
  console.log('   Backend: http://localhost:5000');
  console.log('   Frontend: http://localhost:3000');
  console.log('   Health: http://localhost:5000/health');
}
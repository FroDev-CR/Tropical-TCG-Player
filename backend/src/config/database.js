// src/config/database.js
// Configuración de conexión a MongoDB con Mongoose

const mongoose = require('mongoose');
const config = require('./index');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      // Siempre usar MongoDB Atlas para persistencia de datos
      const mongoUri = config.database.uri;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI no está definida en las variables de entorno');
      }

      console.log('☁️ Conectando a MongoDB Atlas...');
      console.log('✅ Los datos persistirán entre reinicios');

      // Configuración de Mongoose
      mongoose.set('strictQuery', false);
      
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      // Conectar a MongoDB
      this.connection = await mongoose.connect(mongoUri, options);

      console.log('🗃️ MongoDB Atlas conectado exitosamente');
      console.log(`📍 Base de datos: ${this.connection.connection.name}`);
      console.log(`🌐 Host: ${this.connection.connection.host}`);
      console.log('🔒 Datos seguros en la nube - persistencia garantizada');

      // Eventos de conexión
      mongoose.connection.on('error', (err) => {
        console.error('❌ Error de conexión MongoDB:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB desconectado');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconectado');
      });

      return this.connection;
    } catch (error) {
      console.error('💥 Error conectando a MongoDB:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('👋 Conexión MongoDB Atlas cerrada');
    } catch (error) {
      console.error('❌ Error cerrando conexión:', error);
    }
  }

  isConnected() {
    if (!this.connection) return false;
    return mongoose.connection.readyState === 1;
  }

  getConnection() {
    return this.connection;
  }

  // Utilidad para transacciones
  async withTransaction(callback) {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Estadísticas de la base de datos
  async getStats() {
    try {
      const stats = await mongoose.connection.db.stats();
      return {
        database: stats.db,
        collections: stats.collections,
        objects: stats.objects,
        dataSize: Math.round(stats.dataSize / 1024 / 1024 * 100) / 100, // MB
        indexSize: Math.round(stats.indexSize / 1024 / 1024 * 100) / 100, // MB
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }
}

// Instancia singleton
const database = new Database();

module.exports = database;
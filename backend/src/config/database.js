// src/config/database.js
// Configuración de conexión a MongoDB con Mongoose

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

class Database {
  constructor() {
    this.connection = null;
    this.mongoServer = null;
  }

  async connect() {
    try {
      let mongoUri;

      // En desarrollo, usar MongoDB Memory Server
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Iniciando MongoDB Memory Server para desarrollo...');
        this.mongoServer = await MongoMemoryServer.create({
          binary: {
            version: '7.0.0'
          }
        });
        mongoUri = this.mongoServer.getUri();
        console.log('💾 MongoDB Memory Server iniciado');
      } else {
        // En producción, usar MongoDB Atlas
        mongoUri = process.env.MONGODB_URI;
        console.log('☁️  Conectando a MongoDB Atlas...');
      }

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

      console.log('🗃️  MongoDB conectado exitosamente');
      if (process.env.NODE_ENV === 'development') {
        console.log('💾 Usando MongoDB Memory Server (datos en memoria)');
      } else {
        console.log(`📍 Base de datos: ${this.connection.connection.name}`);
        console.log(`🌐 Host: ${this.connection.connection.host}`);
      }

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
      
      // Cerrar MongoDB Memory Server si está activo
      if (this.mongoServer) {
        await this.mongoServer.stop();
        console.log('💾 MongoDB Memory Server cerrado');
      }
      
      console.log('👋 Conexión MongoDB cerrada');
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
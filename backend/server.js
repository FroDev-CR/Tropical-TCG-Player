// server.js
// Entry point de la aplicación

const App = require('./src/app');
const database = require('./src/config/database');
const config = require('./src/config');

async function startServer() {
  try {
    console.log('🚀 Iniciando Tropical TCG Backend...');
    console.log(`🌍 Entorno: ${config.NODE_ENV}`);
    
    // Conectar a la base de datos
    await database.connect();

    // Crear aplicación Express
    const app = new App();
    const expressApp = app.getExpressApp();

    // Iniciar servidor
    const server = expressApp.listen(config.PORT, () => {
      console.log('✅ Servidor iniciado exitosamente');
      console.log(`📡 Puerto: ${config.PORT}`);
      console.log(`🔗 URL local: http://localhost:${config.PORT}`);
      console.log(`💚 Health check: http://localhost:${config.PORT}/health`);
      console.log(`🎯 API base: http://localhost:${config.PORT}/api/v1`);
      
      if (config.NODE_ENV === 'development') {
        console.log('');
        console.log('📋 ENDPOINTS DISPONIBLES:');
        console.log('   🏠 GET  /                    - Info de la API');
        console.log('   💚 GET  /health              - Health check');
        console.log('   🔐 POST /api/v1/auth/register - Registro');
        console.log('   🔑 POST /api/v1/auth/login    - Login');
        console.log('   👤 GET  /api/v1/users/profile - Perfil usuario');
        console.log('');
        console.log('🛠️  En desarrollo: Agrega más endpoints conforme implementemos...');
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  Recibida señal ${signal}. Cerrando servidor...`);
      
      server.close(async () => {
        console.log('🔌 Servidor HTTP cerrado');
        
        try {
          await database.disconnect();
          console.log('👋 Desconexión completa. ¡Hasta pronto!');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error durante desconexión:', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('⏰ Forzando cierre después de 10 segundos...');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${config.PORT} ya está en uso`);
        console.log('💡 Intenta cambiar el puerto en el archivo .env');
        process.exit(1);
      } else {
        console.error('❌ Error del servidor:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('💥 Error fatal iniciando servidor:', error);
    process.exit(1);
  }
}

// Iniciar aplicación
startServer();
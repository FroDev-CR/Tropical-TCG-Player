import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// SPRINT 1 - FASE 1.2: Poblar colección stores con datos iniciales
export const seedStores = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  try {
    const db = admin.firestore();
    const storesCollection = db.collection('stores');
    
    // Datos iniciales de tiendas en Costa Rica (2 por provincia mínimo)
    const initialStores = [
      // SAN JOSÉ
      {
        id: 'store_sj_central',
        name: 'TCG Store San José Centro',
        province: 'San José',
        city: 'San José',
        address: 'Avenida Central, entre Calle 1 y 3, San José Centro',
        phone: '+506 2222-3333',
        email: 'sanjose@tropicaltcg.com',
        operatingHours: {
          monday: { open: '10:00', close: '19:00' },
          tuesday: { open: '10:00', close: '19:00' },
          wednesday: { open: '10:00', close: '19:00' },
          thursday: { open: '10:00', close: '19:00' },
          friday: { open: '10:00', close: '20:00' },
          saturday: { open: '09:00', close: '20:00' },
          sunday: { open: '10:00', close: '18:00' }
        },
        isActive: true,
        acceptsDeliveries: true,
        acceptsPickups: true
      },
      {
        id: 'store_sj_escazu',
        name: 'TCG Store Escazú',
        province: 'San José',
        city: 'Escazú',
        address: 'Centro Comercial Multiplaza, Escazú',
        phone: '+506 2289-4444',
        email: 'escazu@tropicaltcg.com',
        operatingHours: {
          monday: { open: '10:00', close: '21:00' },
          tuesday: { open: '10:00', close: '21:00' },
          wednesday: { open: '10:00', close: '21:00' },
          thursday: { open: '10:00', close: '21:00' },
          friday: { open: '10:00', close: '21:00' },
          saturday: { open: '10:00', close: '21:00' },
          sunday: { open: '11:00', close: '20:00' }
        },
        isActive: true,
        acceptsDeliveries: true,
        acceptsPickups: true
      },

      // ALAJUELA
      {
        id: 'store_al_central',
        name: 'TCG Store Alajuela Centro',
        province: 'Alajuela',
        city: 'Alajuela',
        address: 'Calle 2, Avenida 1, Alajuela Centro',
        phone: '+506 2441-5555',
        email: 'alajuela@tropicaltcg.com',
        operatingHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '19:00' },
          saturday: { open: '09:00', close: '19:00' },
          sunday: { open: '10:00', close: '17:00' }
        },
        isActive: true,
        acceptsDeliveries: true,
        acceptsPickups: true
      },
      {
        id: 'store_al_cartago',
        name: 'TCG Store Cartago',
        province: 'Alajuela',
        city: 'Cartago',
        address: 'Avenida 2, Calle 4, Cartago Centro',
        phone: '+506 2551-6666',
        email: 'cartago@tropicaltcg.com',
        operatingHours: {
          monday: { open: '10:00', close: '18:00' },
          tuesday: { open: '10:00', close: '18:00' },
          wednesday: { open: '10:00', close: '18:00' },
          thursday: { open: '10:00', close: '18:00' },
          friday: { open: '10:00', close: '19:00' },
          saturday: { open: '09:00', close: '19:00' },
          sunday: { open: '10:00', close: '17:00' }
        },
        isActive: true,
        acceptsDeliveries: true,
        acceptsPickups: true
      },

      // HEREDIA
      {
        id: 'store_he_central',
        name: 'TCG Store Heredia',
        province: 'Heredia',
        city: 'Heredia',
        address: 'Avenida Central, Heredia Centro',
        phone: '+506 2237-7777',
        email: 'heredia@tropicaltcg.com',
        operatingHours: {
          monday: { open: '10:00', close: '19:00' },
          tuesday: { open: '10:00', close: '19:00' },
          wednesday: { open: '10:00', close: '19:00' },
          thursday: { open: '10:00', close: '19:00' },
          friday: { open: '10:00', close: '20:00' },
          saturday: { open: '09:00', close: '20:00' },
          sunday: { open: '10:00', close: '18:00' }
        },
        isActive: true,
        acceptsDeliveries: true,
        acceptsPickups: true
      },
      {
        id: 'store_he_barva',
        name: 'TCG Store Barva',
        province: 'Heredia',
        city: 'Barva',
        address: 'Centro de Barva, costado norte de la iglesia',
        phone: '+506 2260-8888',
        email: 'barva@tropicaltcg.com',
        operatingHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '19:00' },
          saturday: { open: '09:00', close: '19:00' },
          sunday: { open: '10:00', close: '17:00' }
        },
        isActive: true,
        acceptsDeliveries: true,
        acceptsPickups: true
      },

      // PUNTARENAS
      {
        id: 'store_pu_central',
        name: 'TCG Store Puntarenas',
        province: 'Puntarenas',
        city: 'Puntarenas',
        address: 'Paseo de los Turistas, Puntarenas Centro',
        phone: '+506 2661-9999',
        email: 'puntarenas@tropicaltcg.com',
        operatingHours: {
          monday: { open: '10:00', close: '18:00' },
          tuesday: { open: '10:00', close: '18:00' },
          wednesday: { open: '10:00', close: '18:00' },
          thursday: { open: '10:00', close: '18:00' },
          friday: { open: '10:00', close: '19:00' },
          saturday: { open: '09:00', close: '19:00' },
          sunday: { open: '10:00', close: '18:00' }
        },
        isActive: true,
        acceptsDeliveries: true,
        acceptsPickups: true
      },
      {
        id: 'store_pu_jaco',
        name: 'TCG Store Jacó',
        province: 'Puntarenas',
        city: 'Jacó',
        address: 'Avenida Pastor Díaz, Jacó Centro',
        phone: '+506 2643-1010',
        email: 'jaco@tropicaltcg.com',
        operatingHours: {
          monday: { open: '11:00', close: '19:00' },
          tuesday: { open: '11:00', close: '19:00' },
          wednesday: { open: '11:00', close: '19:00' },
          thursday: { open: '11:00', close: '19:00' },
          friday: { open: '11:00', close: '20:00' },
          saturday: { open: '10:00', close: '20:00' },
          sunday: { open: '11:00', close: '19:00' }
        },
        isActive: true,
        acceptsDeliveries: true,
        acceptsPickups: true
      },

      // GUANACASTE
      {
        id: 'store_gu_liberia',
        name: 'TCG Store Liberia',
        province: 'Guanacaste',
        city: 'Liberia',
        address: 'Avenida Central, Liberia Centro',
        phone: '+506 2666-1111',
        email: 'liberia@tropicaltcg.com',
        operatingHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '19:00' },
          saturday: { open: '09:00', close: '19:00' },
          sunday: { open: '10:00', close: '18:00' }
        },
        isActive: true,
        acceptsDeliveries: true,
        acceptsPickups: true
      },
      {
        id: 'store_gu_tamarindo',
        name: 'TCG Store Tamarindo',
        province: 'Guanacaste',
        city: 'Tamarindo',
        address: 'Plaza Tamarindo, frente a la playa',
        phone: '+506 2653-1212',
        email: 'tamarindo@tropicaltcg.com',
        operatingHours: {
          monday: { open: '11:00', close: '19:00' },
          tuesday: { open: '11:00', close: '19:00' },
          wednesday: { open: '11:00', close: '19:00' },
          thursday: { open: '11:00', close: '19:00' },
          friday: { open: '11:00', close: '20:00' },
          saturday: { open: '10:00', close: '20:00' },
          sunday: { open: '11:00', close: '19:00' }
        },
        isActive: true,
        acceptsDeliveries: true,
        acceptsPickups: true
      },

      // LIMÓN
      {
        id: 'store_li_central',
        name: 'TCG Store Limón Centro',
        province: 'Limón',
        city: 'Limón',
        address: 'Avenida 2, Calle 3, Puerto Limón',
        phone: '+506 2758-1313',
        email: 'limon@tropicaltcg.com',
        operatingHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '19:00' },
          saturday: { open: '09:00', close: '19:00' },
          sunday: { open: '10:00', close: '17:00' }
        },
        isActive: true,
        acceptsDeliveries: true,
        acceptsPickups: true
      },
      {
        id: 'store_li_cahuita',
        name: 'TCG Store Cahuita',
        province: 'Limón',
        city: 'Cahuita',
        address: 'Calle Principal, Cahuita Centro',
        phone: '+506 2755-1414',
        email: 'cahuita@tropicaltcg.com',
        operatingHours: {
          monday: { open: '10:00', close: '18:00' },
          tuesday: { open: '10:00', close: '18:00' },
          wednesday: { open: '10:00', close: '18:00' },
          thursday: { open: '10:00', close: '18:00' },
          friday: { open: '10:00', close: '19:00' },
          saturday: { open: '09:00', close: '19:00' },
          sunday: { open: '10:00', close: '18:00' }
        },
        isActive: true,
        acceptsDeliveries: true,
        acceptsPickups: true
      }
    ];

    console.log(`Poblando ${initialStores.length} tiendas en la base de datos...`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const store of initialStores) {
      const storeRef = storesCollection.doc(store.id);
      const storeDoc = await storeRef.get();
      
      if (storeDoc.exists) {
        skippedCount++;
        continue;
      }
      
      // Agregar timestamps
      const storeData = {
        ...store,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await storeRef.set(storeData);
      createdCount++;
    }
    
    const result = {
      success: true,
      message: `Stores pobladas: ${createdCount} creadas, ${skippedCount} ya existían`,
      createdCount,
      skippedCount,
      totalStores: initialStores.length
    };
    
    console.log('Población de stores completada:', result);
    return result;
    
  } catch (error) {
    console.error('Error poblando stores:', error);
    throw new functions.https.HttpsError('internal', `Error poblando stores: ${error}`);
  }
});

// SPRINT 1 - FASE 1.2: Crear colecciones vacías con documentos de ejemplo
export const createEmptyCollections = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  try {
    const db = admin.firestore();
    const collections = [
      'pendingTransactions',
      'notifications', 
      'disputes',
      'userRecommendations'
    ];
    
    const results = [];
    
    for (const collectionName of collections) {
      // Crear documento temporal para inicializar la colección
      const tempDoc = {
        _temp: true,
        _note: `Documento temporal para inicializar colección ${collectionName}`,
        _deleteAfterFirstRealDocument: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection(collectionName).doc('_temp_init').set(tempDoc);
      
      results.push({
        collection: collectionName,
        status: 'created',
        note: 'Colección inicializada con documento temporal'
      });
    }
    
    const result = {
      success: true,
      message: `${collections.length} colecciones inicializadas correctamente`,
      collections: results
    };
    
    console.log('Colecciones P2P inicializadas:', result);
    return result;
    
  } catch (error) {
    console.error('Error creando colecciones:', error);
    throw new functions.https.HttpsError('internal', `Error creando colecciones: ${error}`);
  }
});

// Función de utilidad para verificar todas las colecciones
export const verifyCollections = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  try {
    const db = admin.firestore();
    const collectionsToCheck = [
      'users', 'listings', 'transactions', 'binders',
      'stores', 'pendingTransactions', 'notifications', 
      'disputes', 'userRecommendations'
    ];
    
    const verificationResults = [];
    
    for (const collectionName of collectionsToCheck) {
      const snapshot = await db.collection(collectionName).limit(1).get();
      verificationResults.push({
        collection: collectionName,
        exists: !snapshot.empty,
        documentCount: snapshot.size,
        status: snapshot.empty ? 'empty' : 'has_documents'
      });
    }
    
    const result = {
      success: true,
      message: 'Verificación de colecciones completada',
      collections: verificationResults,
      summary: {
        total: collectionsToCheck.length,
        existing: verificationResults.filter(r => r.exists).length,
        empty: verificationResults.filter(r => !r.exists).length
      }
    };
    
    console.log('Verificación de colecciones:', result);
    return result;
    
  } catch (error) {
    console.error('Error verificando colecciones:', error);
    throw new functions.https.HttpsError('internal', `Error verificando colecciones: ${error}`);
  }
});
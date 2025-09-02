"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCollections = exports.createEmptyCollections = exports.seedStores = exports.checkMigrationStatus = exports.migrateTransactions = exports.migrateListings = exports.migrateUsers = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Initialize Firebase Admin
admin.initializeApp();
// SPRINT 1 - FASE 1.1: Cloud Function para migrar colección users
exports.migrateUsers = functions.https.onCall(async (data, context) => {
    // Verificar que el usuario esté autenticado y sea admin
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    // TODO: Agregar verificación de permisos de admin aquí
    // Por ahora permitimos la ejecución para desarrollo
    try {
        const db = admin.firestore();
        const usersCollection = db.collection('users');
        const usersSnapshot = await usersCollection.get();
        let migratedCount = 0;
        let skippedCount = 0;
        console.log(`Iniciando migración de ${usersSnapshot.docs.length} usuarios...`);
        // Procesar usuarios en lotes para evitar timeouts
        const batch = db.batch();
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            // Verificar si ya tiene los nuevos campos
            if (userData.verificationStatus && userData.suspensionStatus) {
                skippedCount++;
                continue;
            }
            // Campos nuevos a agregar según especificación P2P
            const newFields = {
                // Cédula (inicialmente vacía, se llenará durante verificación)
                cedula: userData.cedula || '',
                // Contadores de actividad
                completedSales: userData.completedSales || 0,
                completedPurchases: userData.completedPurchases || 0,
                recommendations: userData.recommendations || 0,
                // Estado de verificación
                verificationStatus: userData.verificationStatus || {
                    phone: false,
                    cedula: false,
                    email: true // Ya verificado por Firebase Auth
                },
                // Sistema de sanciones
                suspensionStatus: userData.suspensionStatus || {
                    suspended: false,
                    reason: '',
                    until: null
                },
                // Timestamp de actualización
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            // Actualizar documento manteniendo campos existentes
            batch.update(userDoc.ref, newFields);
            migratedCount++;
        }
        // Ejecutar el batch
        await batch.commit();
        const result = {
            success: true,
            message: `Migración completada: ${migratedCount} usuarios migrados, ${skippedCount} omitidos`,
            migratedCount,
            skippedCount,
            totalUsers: usersSnapshot.docs.length
        };
        console.log('Migración de usuarios completada:', result);
        return result;
    }
    catch (error) {
        console.error('Error en migración de usuarios:', error);
        throw new functions.https.HttpsError('internal', `Error de migración: ${error}`);
    }
});
// SPRINT 1 - FASE 1.1: Cloud Function para migrar colección listings
exports.migrateListings = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    try {
        const db = admin.firestore();
        const listingsCollection = db.collection('listings');
        const listingsSnapshot = await listingsCollection.get();
        let migratedCount = 0;
        let skippedCount = 0;
        console.log(`Iniciando migración de ${listingsSnapshot.docs.length} listings...`);
        const batch = db.batch();
        for (const listingDoc of listingsSnapshot.docs) {
            const listingData = listingDoc.data();
            // Verificar si ya tiene los nuevos campos
            if (listingData.reservedQuantity !== undefined && listingData.reservations) {
                skippedCount++;
                continue;
            }
            // Campos nuevos para el sistema P2P
            const newFields = {
                // Cantidad reservada en transacciones pendientes
                reservedQuantity: listingData.reservedQuantity || 0,
                // Envío incluido (por defecto no)
                shippingIncluded: listingData.shippingIncluded || false,
                // Tienda de origen (vacío inicialmente)
                originStore: listingData.originStore || '',
                // Array de reservas activas
                reservations: listingData.reservations || [],
                // Verificar consistencia: availableQuantity debe existir
                availableQuantity: listingData.availableQuantity || listingData.quantity || 0,
                // Timestamp de actualización
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            batch.update(listingDoc.ref, newFields);
            migratedCount++;
        }
        await batch.commit();
        const result = {
            success: true,
            message: `Migración de listings completada: ${migratedCount} migrados, ${skippedCount} omitidos`,
            migratedCount,
            skippedCount,
            totalListings: listingsSnapshot.docs.length
        };
        console.log('Migración de listings completada:', result);
        return result;
    }
    catch (error) {
        console.error('Error en migración de listings:', error);
        throw new functions.https.HttpsError('internal', `Error de migración: ${error}`);
    }
});
// SPRINT 1 - FASE 1.1: Cloud Function para backup y migración de transactions
exports.migrateTransactions = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    try {
        const db = admin.firestore();
        // 1. Crear backup de transacciones existentes
        const transactionsSnapshot = await db.collection('transactions').get();
        const backupBatch = db.batch();
        console.log(`Creando backup de ${transactionsSnapshot.docs.length} transacciones...`);
        // Crear colección de backup con timestamp
        const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupCollectionName = `transactions_backup_${backupTimestamp}`;
        transactionsSnapshot.docs.forEach(doc => {
            const backupRef = db.collection(backupCollectionName).doc(doc.id);
            backupBatch.set(backupRef, Object.assign(Object.assign({}, doc.data()), { backedUpAt: admin.firestore.FieldValue.serverTimestamp() }));
        });
        await backupBatch.commit();
        console.log(`Backup creado en colección: ${backupCollectionName}`);
        // 2. Migrar transacciones al nuevo formato P2P
        let migratedCount = 0;
        const migrationBatch = db.batch();
        for (const transactionDoc of transactionsSnapshot.docs) {
            const oldData = transactionDoc.data();
            // Mapear campos antiguos a nueva estructura P2P
            const newTransactionData = {
                // Mantener campos existentes básicos
                id: transactionDoc.id,
                buyerId: oldData.buyerId,
                buyerName: oldData.buyerName,
                buyerNotes: oldData.buyerNotes || '',
                items: oldData.items || [],
                totalAmount: oldData.totalAmount || 0,
                // Nuevos campos P2P requeridos
                sellerId: oldData.sellerId || ((_b = (_a = oldData.items) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.sellerId) || '',
                sellerName: oldData.sellerName || ((_d = (_c = oldData.items) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.sellerName) || '',
                shippingCost: oldData.shippingCost || 0,
                finalTotal: oldData.finalTotal || oldData.totalAmount || 0,
                // Convertir status antiguo a nuevo sistema
                status: convertOldStatus(oldData.status),
                // Timeline completo (inicializar con datos existentes)
                timeline: {
                    created: oldData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
                    sellerDeadline: null,
                    sellerResponded: null,
                    deliveryDeadline: null,
                    delivered: null,
                    paymentRequested: null,
                    paymentConfirmed: null,
                    buyerDeadline: null,
                    buyerConfirmed: null,
                    ratingDeadline: null,
                    completed: oldData.status === 'completed' ? oldData.updatedAt : null
                },
                // Información de entrega (vacía inicialmente)
                deliveryInfo: {
                    originStore: '',
                    destinationStore: '',
                    deliveryProof: {
                        imageUrl: '',
                        uploadedAt: null
                    }
                },
                // Información de pago (vacía inicialmente)
                paymentInfo: {
                    method: '',
                    paymentProof: {
                        imageUrl: '',
                        uploadedAt: null
                    },
                    buyerConfirmed: false
                },
                // Calificaciones (vacías inicialmente)
                ratings: {
                    buyerToSeller: {
                        stars: 0,
                        comment: '',
                        timestamp: null
                    },
                    sellerToBuyer: {
                        stars: 0,
                        comment: '',
                        timestamp: null
                    }
                },
                // Información de cancelación (si aplica)
                cancellationInfo: {
                    cancelledBy: '',
                    reason: '',
                    timestamp: null
                },
                // Mantener campos de contacto
                contactMethod: oldData.contactMethod || 'whatsapp',
                // Timestamps
                createdAt: oldData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            migrationBatch.set(transactionDoc.ref, newTransactionData);
            migratedCount++;
        }
        await migrationBatch.commit();
        const result = {
            success: true,
            message: `Migración de transactions completada: ${migratedCount} migradas`,
            migratedCount,
            backupCollection: backupCollectionName,
            totalTransactions: transactionsSnapshot.docs.length
        };
        console.log('Migración de transactions completada:', result);
        return result;
    }
    catch (error) {
        console.error('Error en migración de transactions:', error);
        throw new functions.https.HttpsError('internal', `Error de migración: ${error}`);
    }
});
// Helper function para convertir status antiguos a nuevos
function convertOldStatus(oldStatus) {
    const statusMapping = {
        'initiated': 'pending_seller_response',
        'contacted': 'accepted_pending_delivery',
        'completed': 'completed',
        'rated': 'completed',
        'cancelled': 'cancelled_by_buyer'
    };
    return statusMapping[oldStatus] || 'pending_seller_response';
}
// Función de utilidad para verificar el estado de las migraciones
exports.checkMigrationStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    try {
        const db = admin.firestore();
        // Verificar usuarios
        const usersSnapshot = await db.collection('users').limit(5).get();
        const usersMigrated = usersSnapshot.docs.every(doc => doc.data().verificationStatus && doc.data().suspensionStatus);
        // Verificar listings
        const listingsSnapshot = await db.collection('listings').limit(5).get();
        const listingsMigrated = listingsSnapshot.docs.every(doc => doc.data().reservedQuantity !== undefined);
        // Verificar transactions
        const transactionsSnapshot = await db.collection('transactions').limit(5).get();
        const transactionsMigrated = transactionsSnapshot.docs.every(doc => doc.data().timeline && doc.data().deliveryInfo);
        return {
            users: {
                migrated: usersMigrated,
                total: usersSnapshot.size
            },
            listings: {
                migrated: listingsMigrated,
                total: listingsSnapshot.size
            },
            transactions: {
                migrated: transactionsMigrated,
                total: transactionsSnapshot.size
            }
        };
    }
    catch (error) {
        console.error('Error verificando migración:', error);
        throw new functions.https.HttpsError('internal', `Error verificando migración: ${error}`);
    }
});
// Importar funciones de población de datos
var seedData_1 = require("./seedData");
Object.defineProperty(exports, "seedStores", { enumerable: true, get: function () { return seedData_1.seedStores; } });
Object.defineProperty(exports, "createEmptyCollections", { enumerable: true, get: function () { return seedData_1.createEmptyCollections; } });
Object.defineProperty(exports, "verifyCollections", { enumerable: true, get: function () { return seedData_1.verifyCollections; } });
//# sourceMappingURL=index.js.map
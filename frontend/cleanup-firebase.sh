#!/bin/bash

echo "🔥 OPERACIÓN: QUEMAR TODO FIREBASE 🔥"
echo "========================================="

# Directorio del proyecto
PROJECT_DIR="/home/frodev/Downloads/FroDev-CR-TropicalTCGPlayers"
SRC_DIR="$PROJECT_DIR/src"

# Función para reemplazar imports de Firebase
cleanup_firebase_file() {
    local file=$1
    echo "🧹 Limpiando: $file"
    
    # Comentar imports de Firebase
    sed -i 's/^import.*firebase.*$/\/\/ FIREBASE REMOVED - TODO: Replace with backend API/' "$file"
    sed -i 's/^import.*firestore.*$/\/\/ FIREBASE REMOVED - TODO: Replace with backend API/' "$file"
    sed -i 's/^import.*from.*firebase.*$/\/\/ FIREBASE REMOVED - TODO: Replace with backend API/' "$file"
    
    # Comentar uso de db, auth, etc.
    sed -i 's/\bdb\b/\/\* db \*\/ null/g' "$file"
    sed -i 's/\bauth\b/\/\* auth \*\/ null/g' "$file" 
    sed -i 's/\bstorage\b/\/\* storage \*\/ null/g' "$file"
    sed -i 's/\bfunctions\b/\/\* functions \*\/ null/g' "$file"
}

# Lista de archivos con Firebase (los más críticos)
FIREBASE_FILES=(
    "$SRC_DIR/components/FeaturedSections.js"
    "$SRC_DIR/components/NotificationBadge.js" 
    "$SRC_DIR/components/UpcomingEvents.js"
    "$SRC_DIR/components/CarouselHero.js"
    "$SRC_DIR/components/CardDetailModal.js"
    "$SRC_DIR/components/SellCardModal.js"
    "$SRC_DIR/components/ChatModal.js"
    "$SRC_DIR/components/ReportSystem.js"
    "$SRC_DIR/components/DisputeManager.js"
    "$SRC_DIR/pages/Binders.js"
    "$SRC_DIR/pages/BinderView.js"
    "$SRC_DIR/pages/CreateListing.js"
    "$SRC_DIR/pages/Cart.js"
    "$SRC_DIR/pages/AdminPanel.js"
    "$SRC_DIR/services/NotificationService.js"
    "$SRC_DIR/services/verificationService.js"
    "$SRC_DIR/hooks/useAuthActions.js"
    "$SRC_DIR/hooks/useInventory.js"
    "$SRC_DIR/hooks/useNotifications.js"
)

# Limpiar cada archivo
for file in "${FIREBASE_FILES[@]}"; do
    if [ -f "$file" ]; then
        cleanup_firebase_file "$file"
    else
        echo "⚠️  Archivo no encontrado: $file"
    fi
done

echo ""
echo "✅ LIMPIEZA COMPLETADA"
echo "📊 Archivos procesados: ${#FIREBASE_FILES[@]}"
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "1. npm install (para limpiar node_modules)"
echo "2. Reiniciar servidor de desarrollo"
echo "3. Verificar que no hay errores de Firebase"
echo ""
echo "💡 NOTA: Todos los archivos ahora usan datos mock."
echo "   Conecta gradualmente al backend API según necesites."
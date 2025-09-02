// src/utils/seedData.js
const User = require('../models/User');
const Listing = require('../models/Listing');
const Binder = require('../models/Binder');

const seedData = async () => {
  try {
    console.log('🌱 Iniciando seed de datos...');
    
    // Crear usuario administrador
    let admin = await User.findOne({ email: 'admin@tropicaltcg.com' });
    if (!admin) {
      admin = new User({
        username: 'admin',
        email: 'admin@tropicaltcg.com',
        password: 'admin123',
        fullName: 'Administrador',
        role: 'admin',
        verification: {
          email: { verified: true, verifiedAt: new Date() },
          phone: { verified: true, verifiedAt: new Date() }
        }
      });
      await admin.save();
      console.log('👤 Usuario admin creado');
    }
    
    // Crear usuario de prueba
    let testUser = await User.findOne({ email: 'test@test.com' });
    if (!testUser) {
      testUser = new User({
        username: 'testuser',
        email: 'test@test.com',
        password: 'test123',
        fullName: 'Usuario de Prueba',
        phone: '8888-8888',
        province: 'San José'
      });
      await testUser.save();
      console.log('👤 Usuario test creado');
    }
    
    // Crear segundo usuario de prueba para transacciones
    let testUser2 = await User.findOne({ email: 'test2@test.com' });
    if (!testUser2) {
      testUser2 = new User({
        username: 'testuser2',
        email: 'test2@test.com',
        password: 'test123',
        fullName: 'Usuario de Prueba 2',
        phone: '8888-8889',
        province: 'Alajuela'
      });
      await testUser2.save();
      console.log('👤 Usuario test2 creado');
    }
    
    // Crear listings de prueba
    const listingsCount = await Listing.countDocuments();
    if (listingsCount === 0) {
      const sampleListings = [
        {
          cardId: 'xy1-1',
          cardName: 'Charizard EX',
          cardImage: 'https://images.pokemontcg.io/xy1/1.png',
          tcgType: 'pokemon',
          setName: 'XY Base Set',
          rarity: 'Ultra Rare',
          price: 25000,
          condition: 'near_mint',
          quantity: 2,
          availableQuantity: 2,
          sellerId: testUser._id,
          sellerName: testUser.username,
          userPhone: testUser.phone,
          userEmail: testUser.email,
          description: 'Carta en excelente estado, directo del pack',
          location: 'San José',
          status: 'active'
        },
        {
          cardId: 'op01-001',
          cardName: 'Monkey D. Luffy',
          cardImage: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png',
          tcgType: 'onepiece',
          setName: 'Romance Dawn',
          rarity: 'Leader',
          price: 15000,
          condition: 'mint',
          quantity: 1,
          availableQuantity: 1,
          sellerId: testUser2._id,
          sellerName: testUser2.username,
          userPhone: testUser2.phone,
          userEmail: testUser2.email,
          description: 'Leader card en condición mint',
          location: 'Alajuela',
          status: 'active'
        },
        {
          cardId: 'db-bt1-001',
          cardName: 'Son Goku',
          cardImage: 'https://www.dbs-cardgame.com/images/cardlist/series1/BT1-001.png',
          tcgType: 'dragonball',
          setName: 'Galactic Battle',
          rarity: 'Super Rare',
          price: 8000,
          condition: 'near_mint',
          quantity: 3,
          availableQuantity: 3,
          sellerId: testUser._id,
          sellerName: testUser.username,
          userPhone: testUser.phone,
          userEmail: testUser.email,
          description: 'Goku en perfecto estado',
          location: 'San José',
          status: 'active'
        },
        {
          cardId: 'mtg-dom-001',
          cardName: 'Lightning Bolt',
          cardImage: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=1234&type=card',
          tcgType: 'magic',
          setName: 'Dominaria',
          rarity: 'Common',
          price: 2000,
          condition: 'light_played',
          quantity: 4,
          availableQuantity: 4,
          sellerId: testUser2._id,
          sellerName: testUser2.username,
          userPhone: testUser2.phone,
          userEmail: testUser2.email,
          description: 'Clásico Lightning Bolt',
          location: 'Alajuela',
          status: 'active'
        },
        {
          cardId: 'digi-bt1-001',
          cardName: 'Agumon',
          cardImage: 'https://digimoncard.com/images/cardlist/BT1-001.png',
          tcgType: 'digimon',
          setName: 'Release Special Booster',
          rarity: 'Rare',
          price: 12000,
          condition: 'mint',
          quantity: 2,
          availableQuantity: 2,
          sellerId: testUser._id,
          sellerName: testUser.username,
          userPhone: testUser.phone,
          userEmail: testUser.email,
          description: 'Agumon en condición perfecta',
          location: 'San José',
          status: 'active'
        }
      ];
      
      await Listing.insertMany(sampleListings);
      
      // Actualizar usuarios con las listings
      await User.findByIdAndUpdate(testUser._id, {
        $push: { 
          listings: { 
            $each: sampleListings
              .filter(l => l.sellerId.toString() === testUser._id.toString())
              .map(l => l._id) 
          } 
        }
      });
      
      await User.findByIdAndUpdate(testUser2._id, {
        $push: { 
          listings: { 
            $each: sampleListings
              .filter(l => l.sellerId.toString() === testUser2._id.toString())
              .map(l => l._id) 
          } 
        }
      });
      
      console.log('🃏 Listings de muestra creados');
    }
    
    // Crear binders de prueba
    const bindersCount = await Binder.countDocuments();
    if (bindersCount === 0) {
      const sampleBinders = [
        {
          name: 'Mi Colección Pokémon',
          description: 'Mis cartas favoritas de Pokémon',
          userId: testUser._id,
          tcgType: 'pokemon',
          cards: [{
            cardId: 'xy1-1',
            cardName: 'Charizard EX',
            cardImage: 'https://images.pokemontcg.io/xy1/1.png',
            tcgType: 'pokemon',
            setName: 'XY Base Set',
            rarity: 'Ultra Rare',
            condition: 'near_mint',
            quantity: 1,
            estimatedValue: 25000,
            notes: 'Mi carta más preciada'
          }]
        },
        {
          name: 'One Piece Leaders',
          description: 'Colección de cartas leader de One Piece',
          userId: testUser2._id,
          tcgType: 'onepiece',
          cards: [{
            cardId: 'op01-001',
            cardName: 'Monkey D. Luffy',
            cardImage: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png',
            tcgType: 'onepiece',
            setName: 'Romance Dawn',
            rarity: 'Leader',
            condition: 'mint',
            quantity: 1,
            estimatedValue: 15000,
            notes: 'Leader principal'
          }]
        }
      ];
      
      const createdBinders = await Binder.insertMany(sampleBinders);
      
      // Actualizar usuarios con los binders
      await User.findByIdAndUpdate(testUser._id, {
        $push: { binders: createdBinders[0]._id }
      });
      
      await User.findByIdAndUpdate(testUser2._id, {
        $push: { binders: createdBinders[1]._id }
      });
      
      console.log('📚 Binders de muestra creados');
    }
    
    console.log('✅ Seed de datos completado exitosamente');
    console.log('');
    console.log('🔑 CREDENCIALES DE PRUEBA:');
    console.log('👑 Admin: admin@tropicaltcg.com / admin123');
    console.log('👤 Test User: test@test.com / test123');
    console.log('👤 Test User 2: test2@test.com / test123');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error en seed de datos:', error);
    throw error;
  }
};

module.exports = seedData;
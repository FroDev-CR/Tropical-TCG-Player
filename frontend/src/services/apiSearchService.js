// src/services/apiSearchService.js
class APISearchService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    this.tcgApiKey = process.env.REACT_APP_TCG_API_KEY;
    this.useMockData = false; // Desactivado - usando proxy para evitar CORS
  }

  // Mock data para cuando las APIs fallen
  getMockCards(searchTerm, tcgType = 'all') {
    const mockCards = [
      {
        id: 'mock-charizard-1',
        name: 'Charizard',
        images: {
          small: 'https://images.pokemontcg.io/base1/4.png',
          large: 'https://images.pokemontcg.io/base1/4_hires.png'
        },
        set: { name: 'Base Set' },
        rarity: 'Rare Holo',
        tcgType: 'pokemon',
        apiSource: 'mock',
        hp: 120,
        types: ['Fire'],
        attacks: [
          { name: 'Fire Spin', damage: '100', cost: ['Fire', 'Fire', 'Fire', 'Fire'] }
        ],
        flavorText: 'Spits fire that is hot enough to melt boulders.',
        artist: 'Mitsuhiro Arita'
      },
      {
        id: 'mock-pikachu-1',
        name: 'Pikachu',
        images: {
          small: 'https://images.pokemontcg.io/base1/58.png',
          large: 'https://images.pokemontcg.io/base1/58_hires.png'
        },
        set: { name: 'Base Set' },
        rarity: 'Common',
        tcgType: 'pokemon',
        apiSource: 'mock',
        hp: 60,
        types: ['Lightning'],
        attacks: [
          { name: 'Thunder Jolt', damage: '30', cost: ['Lightning', 'Colorless'] }
        ],
        flavorText: 'When several of these Pokémon gather, their electricity could build and cause lightning storms.',
        artist: 'Atsuko Nishida'
      },
      {
        id: 'mock-luffy-1',
        name: 'Monkey D. Luffy',
        images: {
          small: 'https://images.pokemontcg.io/base1/25.png',
          large: 'https://images.pokemontcg.io/base1/25_hires.png'
        },
        set: { name: 'Romance Dawn' },
        rarity: 'Leader',
        tcgType: 'onepiece',
        apiSource: 'mock',
        cost: '1',
        power: '5000',
        color: 'Red',
        ability: '[Activate: Main] You may rest this Leader: Add up to 1 DON!! card from your DON!! deck and set it as active.'
      },
      {
        id: 'mock-goku-1',
        name: 'Son Goku',
        images: {
          small: 'https://images.pokemontcg.io/base1/6.png',
          large: 'https://images.pokemontcg.io/base1/6_hires.png'
        },
        set: { name: 'Dragon Ball Super' },
        rarity: 'Super Rare',
        tcgType: 'dragonball',
        apiSource: 'mock',
        cost: '4',
        power: '20000',
        color: 'Orange',
        ability: '[Auto] When you play this card, draw 1 card.'
      },
      {
        id: 'mock-black-lotus',
        name: 'Black Lotus',
        images: {
          small: 'https://images.pokemontcg.io/base1/2.png',
          large: 'https://images.pokemontcg.io/base1/2_hires.png'
        },
        set: { name: 'Alpha' },
        rarity: 'Rare',
        tcgType: 'magic',
        apiSource: 'mock',
        cost: '0',
        type: 'Artifact',
        ability: '{T}, Sacrifice Black Lotus: Add three mana of any one color.'
      },
      {
        id: 'mock-agumon-1',
        name: 'Agumon',
        images: {
          small: 'https://images.pokemontcg.io/base1/32.png',
          large: 'https://images.pokemontcg.io/base1/32_hires.png'
        },
        set: { name: 'BT01 New Evolution' },
        rarity: 'Common',
        tcgType: 'digimon',
        apiSource: 'mock',
        cost: '3',
        power: '2000',
        type: 'Rookie',
        attribute: 'Vaccine'
      },
      {
        id: 'mock-naruto-1',
        name: 'Naruto Uzumaki',
        images: {
          small: 'https://images.pokemontcg.io/base1/44.png',
          large: 'https://images.pokemontcg.io/base1/44_hires.png'
        },
        set: { name: 'Union Arena' },
        rarity: 'Rare',
        tcgType: 'unionarena',
        apiSource: 'mock',
        cost: '2',
        power: '3000',
        color: 'Orange',
        ability: 'Shadow Clone Jutsu: Create multiple copies to confuse enemies.'
      },
      {
        id: 'mock-gundam-1',
        name: 'RX-78-2 Gundam',
        images: {
          small: 'https://images.pokemontcg.io/base1/7.png',
          large: 'https://images.pokemontcg.io/base1/7_hires.png'
        },
        set: { name: 'Mobile Suit Gundam' },
        rarity: 'Ultra Rare',
        tcgType: 'gundam',
        apiSource: 'mock',
        cost: '5',
        power: '8000',
        type: 'Mobile Suit',
        ability: 'Beam Rifle: Deal 2000 damage to target enemy unit.'
      }
    ];

    // Filtrar por término de búsqueda
    return mockCards.filter(card => {
      const matchesName = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         searchTerm.toLowerCase().includes(card.name.toLowerCase().substring(0, 3));
      const matchesType = tcgType === 'all' || card.tcgType === tcgType;
      return matchesName && matchesType;
    });
  }

  // Método para buscar en una API específica usando nuestro proxy
  async searchSpecificAPI(tcgType, searchTerm, page = 1, pageSize = 24) {
    if (!searchTerm.trim()) {
      return { cards: [], totalResults: 0, errors: [] };
    }

    console.log(`🔍 Buscando "${searchTerm}" en ${tcgType} via proxy`);

    try {
      // Construir URL de nuestro proxy
      const proxyUrl = `/api/search?tcgType=${encodeURIComponent(tcgType)}&searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&limit=${pageSize}`;
      
      console.log(`📡 Llamando a proxy: ${proxyUrl}`);

      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API proxy failed');
      }

      // Normalizar las cartas recibidas
      const normalizedCards = this.normalizeCards(data.cards);
      const uniqueCards = this.removeDuplicates(normalizedCards);
      const sortedCards = this.sortByRelevance(uniqueCards, searchTerm);

      // Paginación local (las APIs pueden devolver más de lo que necesitamos)
      const startIndex = (page - 1) * pageSize;
      const paginatedCards = sortedCards.slice(startIndex, startIndex + pageSize);

      const result = {
        cards: paginatedCards,
        totalResults: sortedCards.length,
        errors: [],
        page: page,
        totalPages: Math.ceil(sortedCards.length / pageSize),
        usingMockData: false
      };

      console.log(`✅ Búsqueda en ${tcgType} completada: ${sortedCards.length} cartas encontradas`);
      return result;

    } catch (error) {
      console.error(`Error en búsqueda de ${tcgType}:`, error);
      
      // Fallback: usar datos de demostración
      console.log('📝 Error en proxy - usando datos de demostración como fallback');
      const mockCards = this.getMockCards(searchTerm, tcgType);
      const normalizedMockCards = this.normalizeCards(mockCards);
      const sortedCards = this.sortByRelevance(normalizedMockCards, searchTerm);
      
      const startIndex = (page - 1) * pageSize;
      const paginatedCards = sortedCards.slice(startIndex, startIndex + pageSize);

      return {
        cards: paginatedCards,
        totalResults: sortedCards.length,
        errors: [{ api: 'Proxy', error: 'Proxy no disponible - mostrando datos de demostración' }],
        page: page,
        totalPages: Math.ceil(sortedCards.length / pageSize),
        usingMockData: true
      };
    }
  }

  // Método principal para buscar en todas las APIs
  async searchAllAPIs(searchTerm, page = 1, pageSize = 24, tcgFilter = 'all') {
    if (!searchTerm.trim()) {
      return { cards: [], totalResults: 0, errors: [] };
    }

    const cacheKey = `${searchTerm}-${page}-${pageSize}-${tcgFilter}`;
    
    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('🚀 Resultado obtenido desde cache');
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    console.log(`🔍 Buscando "${searchTerm}" en APIs externas (filtro: ${tcgFilter})`);

    // Usar datos de demostración (activado por defecto para evitar CORS)
    if (this.useMockData) {
      console.log('📝 Usando datos de demostración');
      const mockCards = this.getMockCards(searchTerm, tcgFilter);
      const normalizedMockCards = this.normalizeCards(mockCards);
      const sortedCards = this.sortByRelevance(normalizedMockCards, searchTerm);
      
      const startIndex = (page - 1) * pageSize;
      const paginatedCards = sortedCards.slice(startIndex, startIndex + pageSize);

      return {
        cards: paginatedCards,
        totalResults: sortedCards.length,
        errors: [{ api: 'Demo', error: 'Modo demostración activado - configura las API keys y cambia useMockData a false' }],
        page: page,
        totalPages: Math.ceil(sortedCards.length / pageSize),
        usingMockData: true
      };
    }

    let allCards = [];
    let errors = [];
    let successfulAPIs = 0;

    try {
      // Buscar en TCGS APIs - ahora incluye Pokemon también
      const tcgGames = ['pokemon', 'onepiece', 'dragonball', 'digimon', 'magic', 'unionarena', 'gundam'];
      for (const game of tcgGames) {
        if ((tcgFilter === 'all' || tcgFilter === game) && this.tcgApiKey) {
          try {
            const tcgResult = await this.searchTCGSAPI(game, searchTerm, 1, 30);
            if (tcgResult.cards && tcgResult.cards.length > 0) {
              allCards = allCards.concat(tcgResult.cards);
              successfulAPIs++;
              console.log(`✅ ${game} API: ${tcgResult.cards.length} cartas encontradas`);
            }
          } catch (error) {
            console.warn(`⚠️ ${game} API falló:`, error.message);
            errors.push({ api: game, error: 'Error de CORS o conectividad' });
          }
        }
      }

      // Si todas las APIs fallaron, usar datos de demostración
      if (allCards.length === 0 && successfulAPIs === 0) {
        console.log('📝 Todas las APIs fallaron - usando datos de demostración');
        const mockCards = this.getMockCards(searchTerm, tcgFilter);
        allCards = mockCards;
        errors.push({ api: 'Fallback', error: 'APIs no disponibles - mostrando datos de demostración' });
      }

      // Normalizar y eliminar duplicados
      const normalizedCards = this.normalizeCards(allCards);
      const uniqueCards = this.removeDuplicates(normalizedCards);

      // Ordenar por relevancia
      const sortedCards = this.sortByRelevance(uniqueCards, searchTerm);

      // Paginación
      const startIndex = (page - 1) * pageSize;
      const paginatedCards = sortedCards.slice(startIndex, startIndex + pageSize);

      const result = {
        cards: paginatedCards,
        totalResults: sortedCards.length,
        errors: errors,
        page: page,
        totalPages: Math.ceil(sortedCards.length / pageSize),
        usingMockData: allCards.length > 0 && allCards[0]?.apiSource === 'mock'
      };

      // Guardar en cache solo si obtuvimos resultados reales
      if (!result.usingMockData) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      console.log(`✅ Búsqueda completada: ${sortedCards.length} cartas encontradas (${successfulAPIs} APIs exitosas)`);
      return result;

    } catch (error) {
      console.error('Error general en búsqueda de APIs:', error);
      
      // Fallback final: usar datos de demostración
      console.log('📝 Error general - usando datos de demostración como fallback');
      const mockCards = this.getMockCards(searchTerm, tcgFilter);
      const normalizedMockCards = this.normalizeCards(mockCards);
      const sortedCards = this.sortByRelevance(normalizedMockCards, searchTerm);
      
      const startIndex = (page - 1) * pageSize;
      const paginatedCards = sortedCards.slice(startIndex, startIndex + pageSize);

      return {
        cards: paginatedCards,
        totalResults: sortedCards.length,
        errors: [{ api: 'Error', error: 'Error de conectividad - mostrando datos de demostración' }],
        page: page,
        totalPages: Math.ceil(sortedCards.length / pageSize),
        usingMockData: true
      };
    }
  }


  // Buscar en TCGS API
  async searchTCGSAPI(tcgType, searchTerm, page = 1, limit = 30) {
    if (!this.tcgApiKey) {
      console.warn('⚠️ TCGS API key no configurada');
      return { cards: [] };
    }

    const apiEndpoints = {
      onepiece: '/one-piece/cards',
      dragonball: '/dragon-ball-fusion/cards', 
      digimon: '/digimon/cards',
      magic: '/magic/cards',
      unionarena: '/union-arena/cards',
      gundam: '/gundam/cards'
    };

    const endpoint = apiEndpoints[tcgType];
    if (!endpoint) {
      console.warn(`⚠️ TCG tipo desconocido: ${tcgType}`);
      return { cards: [] };
    }

    try {
      const response = await fetch(
        `https://apitcg.com/api${endpoint}?name=${encodeURIComponent(searchTerm)}&limit=${limit}&page=${page}`,
        {
          headers: {
            'x-api-key': this.tcgApiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`TCGS API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Agregar tcgType a cada carta
      const cards = (data.data || data.cards || []).map(card => ({
        ...card,
        tcgType: tcgType,
        apiSource: 'tcgapis'
      }));

      return { cards };

    } catch (error) {
      console.error(`Error en ${tcgType} API:`, error);
      throw error;
    }
  }

  // Obtener detalles de una carta específica
  async getCardDetails(cardId, tcgType) {
    return this.getTCGSCardDetails(cardId, tcgType);
  }

  async getTCGSCardDetails(cardId, tcgType) {
    const apiEndpoints = {
      pokemon: '/pokemon/cards',
      onepiece: '/one-piece/cards',
      dragonball: '/dragon-ball-fusion/cards',
      digimon: '/digimon/cards', 
      magic: '/magic/cards',
      unionarena: '/union-arena/cards',
      gundam: '/gundam/cards'
    };

    const endpoint = apiEndpoints[tcgType];
    if (!endpoint) {
      return null;
    }

    try {
      const response = await fetch(
        `https://apitcg.com/api${endpoint}/${cardId}`,
        {
          headers: {
            'x-api-key': this.tcgApiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`TCGS API error: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeTCGSCard(data.data || data, tcgType);

    } catch (error) {
      console.error(`Error obteniendo detalles de carta ${tcgType}:`, error);
      return null;
    }
  }

  // Normalizar cartas usando solo formato TCGS API
  normalizeCards(cards) {
    return cards.map(card => {
      return this.normalizeTCGSCard(card, card.tcgType);
    });
  }


  normalizeTCGSCard(card, tcgType) {
    // Mapear nombres de TCG
    const tcgNames = {
      pokemon: 'Pokémon TCG',
      onepiece: 'One Piece',
      dragonball: 'Dragon Ball',
      digimon: 'Digimon',
      magic: 'Magic: The Gathering',
      unionarena: 'Union Arena',
      gundam: 'Gundam'
    };

    // Función helper para convertir valores a string seguro
    const safeString = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') {
        // Para objetos set, extraer name y series
        if (value.name) {
          const name = value.name || '';
          const series = value.series || '';
          if (name && series) return `${name}, ${series}`;
          else if (name) return name;
          else return 'Desconocido';
        }
        // Para otros objetos, convertir a JSON como fallback
        return JSON.stringify(value);
      }
      return String(value);
    };

    // Función helper para obtener imagen
    const getImageUrl = (card) => {
      if (card.image) return safeString(card.image);
      if (card.images?.small) return safeString(card.images.small);
      if (card.card_image) return safeString(card.card_image);
      return '';
    };

    // Función para procesar arrays de forma segura
    const safeArray = (value) => {
      if (!Array.isArray(value)) return [];
      return value.map(item => {
        if (typeof item === 'object') {
          // Para objetos como attacks/abilities, mantener estructura pero convertir valores
          const safeItem = {};
          for (const [key, val] of Object.entries(item)) {
            safeItem[key] = safeString(val);
          }
          return safeItem;
        }
        return safeString(item);
      });
    };

    return {
      id: safeString(card.id || card._id || `${tcgType}-${Date.now()}`),
      name: safeString(card.name || card.card_name || 'Sin nombre'),
      images: {
        small: getImageUrl(card),
        large: getImageUrl(card)
      },
      set: {
        name: safeString(card.set || card.set_name || card.expansion || 'Desconocido')
      },
      rarity: safeString(card.rarity || 'Común'),
      tcgType: tcgType,
      tcgName: tcgNames[tcgType] || tcgType,
      apiSource: safeString(card.apiSource || 'tcgapis'),
      
      // Campos específicos por TCG - todos convertidos a string
      cost: safeString(card.cost || card.play_cost || ''),
      power: safeString(card.power || card.battle_power || ''),
      color: safeString(card.color || card.colours || ''),
      type: safeString(card.type || card.card_type || ''),
      attribute: safeString(card.attribute || ''),
      ability: safeString(card.ability || card.card_text || ''),
      effect: safeString(card.effect || card.effect_text || ''),
      flavorText: safeString(card.flavor_text || card.flavour_text || ''),
      
      // Campos específicos de Pokemon (si están disponibles)
      hp: safeString(card.hp || ''),
      types: safeArray(card.types || []),
      attacks: safeArray(card.attacks || []),
      abilities: safeArray(card.abilities || []),
      artist: safeString(card.artist || ''),
      
      // Precios y legalidades (mantener objetos para el modal)
      tcgplayer: card.tcgplayer || null,
      legalities: card.legalities || null
    };
  }

  // Eliminar cartas duplicadas basándose en el ID
  removeDuplicates(cards) {
    const seen = new Set();
    return cards.filter(card => {
      const key = `${card.id}-${card.tcgType}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Ordenar por relevancia (nombre más similar primero)
  sortByRelevance(cards, searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    return cards.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Coincidencia exacta
      if (aName === term && bName !== term) return -1;
      if (bName === term && aName !== term) return 1;
      
      // Comienza con el término
      const aStarts = aName.startsWith(term);
      const bStarts = bName.startsWith(term);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;
      
      // Contiene el término
      const aContains = aName.includes(term);
      const bContains = bName.includes(term);
      if (aContains && !bContains) return -1;
      if (bContains && !aContains) return 1;
      
      // Por longitud del nombre (más corto primero)
      return aName.length - bName.length;
    });
  }

  // Limpiar cache manualmente
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache de API limpiado');
  }

  // Obtener estadísticas del cache
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  // Método para activar/desactivar datos de demostración
  setUseMockData(useMock) {
    this.useMockData = useMock;
    console.log(`📝 Modo demostración: ${useMock ? 'ACTIVADO' : 'DESACTIVADO'}`);
  }
}

// Exportar como singleton
const apiSearchService = new APISearchService();
export default apiSearchService;
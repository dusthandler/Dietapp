export const foodDB = {
    // PROTEÍNAS ANIMALES
    'Pollo (muslo)': {
        category: 'Proteínas',
        emoji: '🍗',
        price: 0.70,
        calories: 239,
        protein: 27,
        carbs: 0,
        fats: 14,
        intolerancias: []
    },
    'Pechuga de pollo': {
        category: 'Proteínas',
        emoji: '🍗',
        price: 0.75,
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        intolerancias: []
    },
    'Huevo': {
        category: 'Proteínas',
        emoji: '🥚',
        price: 0.25,
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fats: 11,
        intolerancias: ['huevo']
    },
    'Claras': {
        category: 'Proteínas',
        emoji: '🥚',
        price: 0.40,
        calories: 52,
        protein: 11,
        carbs: 0.7,
        fats: 0.2,
        intolerancias: ['huevo']
    },
    'Salmón fresco': {
        category: 'Proteínas',
        emoji: '🐟',
        price: 2.10,
        calories: 208,
        protein: 20,
        carbs: 0,
        fats: 13,
        intolerancias: ['pescado']
    },
    'Atún en lata (agua)': {
        category: 'Proteínas',
        emoji: '🐟',
        price: 0.90,
        calories: 116,
        protein: 25.5,
        carbs: 0,
        fats: 0.8,
        intolerancias: ['pescado']
    },
    'Salmón ahumado': {
        category: 'Proteínas',
        emoji: '🐟',
        price: 2.50,
        calories: 117,
        protein: 18,
        carbs: 0,
        fats: 4.3,
        intolerancias: ['pescado']
    },
    'Pavo': {
        category: 'Proteínas',
        emoji: '🦃',
        price: 1.40,
        calories: 135,
        protein: 29,
        carbs: 0,
        fats: 1.7,
        intolerancias: []
    },
    'Merluza': {
        category: 'Proteínas',
        emoji: '🐟',
        price: 1.80,
        calories: 91,
        protein: 19,
        carbs: 0,
        fats: 1.5,
        intolerancias: ['pescado']
    },
    'Caballa': {
        category: 'Proteínas',
        emoji: '🐟',
        price: 1.50,
        calories: 205,
        protein: 19,
        carbs: 0,
        fats: 14,
        intolerancias: ['pescado']
    },
    'Sardinas en lata': {
        category: 'Proteínas',
        emoji: '🐟',
        price: 0.90,
        calories: 208,
        protein: 25,
        carbs: 0,
        fats: 11,
        intolerancias: ['pescado']
    },
    'Jamón serrano': {
        category: 'Proteínas',
        emoji: '🍖',
        price: 2.50,
        calories: 185,
        protein: 30,
        carbs: 0,
        fats: 7,
        intolerancias: ['gluten']
    },

    // PROTEÍNAS VEGETALES
    'Tofu': {
        category: 'Proteínas',
        emoji: '🧈',
        price: 1.50,
        calories: 76,
        protein: 8,
        carbs: 1.9,
        fats: 4.8,
        intolerancias: ['soja']
    },
    'Seitán': {
        category: 'Proteínas',
        emoji: '🌾',
        price: 2.20,
        calories: 370,
        protein: 75,
        carbs: 14,
        fats: 1.2,
        intolerancias: ['gluten']
    },

    // LÁCTEOS
    'Yogur griego natural': {
        category: 'Lácteos',
        emoji: '🥛',
        price: 0.45,
        calories: 59,
        protein: 10,
        carbs: 3.6,
        fats: 0.4,
        intolerancias: ['lactosa']
    },
    'Leche semidesnatada': {
        category: 'Lácteos',
        emoji: '🥛',
        price: 0.12,
        calories: 47,
        protein: 3.4,
        carbs: 4.8,
        fats: 1.6,
        intolerancias: ['lactosa']
    },
    'Queso burgos desnatado': {
        category: 'Lácteos',
        emoji: '🧀',
        price: 1.20,
        calories: 72,
        protein: 12,
        carbs: 2,
        fats: 1,
        intolerancias: ['lactosa']
    },

    // CEREALES
    'Copos de avena': {
        category: 'Cereales',
        emoji: '🌾',
        price: 0.15,
        calories: 389,
        protein: 16.9,
        carbs: 66.3,
        fats: 6.9,
        intolerancias: []
    },
    'Arroz integral': {
        category: 'Cereales',
        emoji: '🍚',
        price: 0.18,
        calories: 111,
        protein: 2.6,
        carbs: 23,
        fats: 0.9,
        intolerancias: []
    },
    'Quinoa': {
        category: 'Cereales',
        emoji: '🌾',
        price: 1.80,
        calories: 120,
        protein: 4.4,
        carbs: 21,
        fats: 1.9,
        intolerancias: []
    },

    // TUBÉRCULOS
    'Patata': {
        category: 'Tubérculos',
        emoji: '🥔',
        price: 0.15,
        calories: 86,
        protein: 1.7,
        carbs: 20,
        fats: 0.1,
        intolerancias: []
    },
    'Boniato': {
        category: 'Tubérculos',
        emoji: '🍠',
        price: 0.40,
        calories: 90,
        protein: 2.0,
        carbs: 21,
        fats: 0.3,
        intolerancias: []
    },

    // VERDURAS
    'Brócoli': {
        category: 'Verduras',
        emoji: '🥦',
        price: 0.35,
        calories: 34,
        protein: 2.8,
        carbs: 6.6,
        fats: 0.4,
        intolerancias: []
    },
    'Espinacas crudas': {
        category: 'Verduras',
        emoji: '🥬',
        price: 0.45,
        calories: 23,
        protein: 2.9,
        carbs: 3.6,
        fats: 0.4,
        intolerancias: []
    },
    'Calabacín': {
        category: 'Verduras',
        emoji: '🥒',
        price: 0.35,
        calories: 17,
        protein: 1.2,
        carbs: 3.1,
        fats: 0.3,
        intolerancias: []
    },

    // FRUTAS
    'Plátano': {
        category: 'Frutas',
        emoji: '🍌',
        price: 0.25,
        calories: 89,
        protein: 1.1,
        carbs: 23,
        fats: 0.3,
        intolerancias: []
    },
    'Fresas': {
        category: 'Frutas',
        emoji: '🍓',
        price: 0.65,
        calories: 32,
        protein: 0.7,
        carbs: 7.7,
        fats: 0.3,
        intolerancias: []
    },
    'Naranja': {
        category: 'Frutas',
        emoji: '🍊',
        price: 0.35,
        calories: 47,
        protein: 0.9,
        carbs: 12,
        fats: 0.1,
        intolerancias: []
    },

    // LEGUMBRES
    'Lentejas': {
        category: 'Legumbres',
        emoji: '🥣',
        price: 0.25,
        calories: 116,
        protein: 9,
        carbs: 20,
        fats: 0.4,
        intolerancias: []
    },
    'Edamame': {
        category: 'Legumbres',
        emoji: '🟢',
        price: 1.80,
        calories: 122,
        protein: 11,
        carbs: 10,
        fats: 5.2,
        intolerancias: ['soja']
    },

    // GRASAS
    'Aceite de oliva': {
        category: 'Grasas',
        emoji: '🫒',
        price: 0.85,
        calories: 884,
        protein: 0,
        carbs: 0,
        fats: 100,
        intolerancias: []
    },
    'Aguacate': {
        category: 'Grasas',
        emoji: '🥑',
        price: 0.95,
        calories: 160,
        protein: 2,
        carbs: 9,
        fats: 15,
        intolerancias: []
    },

    // ENDULZANTES
    'Miel': {
        category: 'Endulzantes',
        emoji: '🍯',
        price: 0.70,
        calories: 304,
        protein: 0.3,
        carbs: 82.4,
        fats: 0,
        intolerancias: []
    },
    'Mermelada de fresa light': {
        category: 'Endulzantes',
        emoji: '🍓',
        price: 0.65,
        calories: 100,
        protein: 0.3,
        carbs: 25,
        fats: 0,
        intolerancias: []
    },

    // NUEVOS ALIMENTOS AÑADIDOS
    'Alcachofas': {
        category: 'Verduras',
        emoji: '🌿',
        price: 0.80,
        calories: 47,
        protein: 3.3,
        carbs: 10.5,
        fats: 0.2,
        intolerancias: []
    },
    'Cuscús integral': {
        category: 'Cereales',
        emoji: '🌾',
        price: 0.95,
        calories: 112,
        protein: 4.0,
        carbs: 23,
        fats: 0.6,
        intolerancias: ['gluten']
    },
    'Tortitas de maíz': {
        category: 'Cereales',
        emoji: '🌽',
        price: 0.50,
        calories: 387,
        protein: 8.0,
        carbs: 80,
        fats: 2.5,
        intolerancias: []
    },

    // BEBIDAS (categoría existente)
    'Agua': {
        category: 'Bebidas',
        emoji: '💧',
        price: 0.01,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        intolerancias: []
    },
    'Leche de avena': {
        category: 'Bebidas',
        emoji: '🌾',
        price: 0.95,
        calories: 47,
        protein: 0.3,
        carbs: 9.7,
        fats: 1.0,
        intolerancias: []
    },
    'Leche de almendras': {
        category: 'Bebidas',
        emoji: '🥤',
        price: 1.10,
        calories: 24,
        protein: 0.5,
        carbs: 3.0,
        fats: 1.1,
        intolerancias: ['frutos secos']
    },
    // ESPECIAS (categoría existente)
    'Canela': {
        category: 'Especias',
        emoji: '🌿',
        price: 0.50,
        calories: 247,
        protein: 4,
        carbs: 80.6,
        fats: 1.2,
        intolerancias: []
    },
    'Curry': {
        category: 'Especias',
        emoji: '🌿',
        price: 0.70,
        calories: 325,
        protein: 12.7,
        carbs: 58.2,
        fats: 14.0,
        intolerancias: []
    },

    // PLATOS PREPARADOS (categoría existente)
    'Pisto de verduras': {
        category: 'Platos preparados',
        emoji: '🍲',
        price: 0.85,
        calories: 80,
        protein: 2.5,
        carbs: 10,
        fats: 4,
        intolerancias: []
    },
    'Gazpacho': {
        category: 'Platos preparados',
        emoji: '🍲',
        price: 1.20,
        calories: 55,
        protein: 1.2,
        carbs: 10,
        fats: 1.0,
        intolerancias: ['gluten']
    }
};
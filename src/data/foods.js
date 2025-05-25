export const foodDB = {
    // PROTEÍNAS ANIMALES
    'Atún en lata (agua)': {
        category: 'Proteínas',
        emoji: '🐟',
        price: 9.00,
        calories: 116,
        protein: 25.5,
        carbs: 0,
        fats: 0.8,
        intolerancias: ['pescado']
    },
    'Caballa': {
        category: 'Proteínas',
        emoji: '🐟',
        price: 15.00,
        calories: 205,
        protein: 19,
        carbs: 0,
        fats: 14,
        intolerancias: ['pescado']
    },
    'Carne picada de vacuno': {
        category: 'Proteínas',
        emoji: '🥩',
        price: 9.40,
        calories: 250,
        protein: 26,
        carbs: 0,
        fats: 15,
        intolerancias: []
    },
    'Claras': {
        category: 'Proteínas',
        emoji: '🥚',
        price: 4.00,
        calories: 52,
        protein: 11,
        carbs: 0.7,
        fats: 0.2,
        intolerancias: ['huevo']
    },
    'Filete de ternera': {
        category: 'Proteínas',
        emoji: '🥩',
        price: 15.00,
        calories: 250,
        protein: 30,
        carbs: 0,
        fats: 13,
        intolerancias: []
    },
    'Huevo': {
        category: 'Proteínas',
        emoji: '🥚',
        price: 4.15,
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fats: 11,
        intolerancias: ['huevo']
    },
    'Jamón serrano': {
        category: 'Proteínas',
        emoji: '🍖',
        price: 25.00,
        calories: 185,
        protein: 30,
        carbs: 0,
        fats: 7,
        intolerancias: ['gluten']
    },
    'Lomo de cerdo': {
        category: 'Proteínas',
        emoji: '🐖',
        price: 8.90,
        calories: 242,
        protein: 26,
        carbs: 0,
        fats: 14,
        intolerancias: []
    },
    'Merluza': {
        category: 'Proteínas',
        emoji: '🐟',
        price: 18.00,
        calories: 91,
        protein: 19,
        carbs: 0,
        fats: 1.5,
        intolerancias: ['pescado']
    },
    'Pavo': {
        category: 'Proteínas',
        emoji: '🦃',
        price: 14.00,
        calories: 135,
        protein: 29,
        carbs: 0,
        fats: 1.7,
        intolerancias: []
    },
    'Pechuga de pollo': {
        category: 'Proteínas',
        emoji: '🍗',
        price: 7.50,
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        intolerancias: []
    },
    'Pollo (muslo)': {  // Actualizado según datos Mercadona :cite[3]
        category: 'Proteínas',
        emoji: '🍗',
        price: 5.55,  // Precio ajustado a 5.55€/kg (antes 7.00€)
        calories: 135,
        protein: 18,
        carbs: 0,
        fats: 6.9,
        intolerancias: []
    },
    'Salmón ahumado': {
        category: 'Proteínas',
        emoji: '🐟',
        price: 25.00,
        calories: 117,
        protein: 18,
        carbs: 0,
        fats: 4.3,
        intolerancias: ['pescado']
    },
    'Salmón fresco': {
        category: 'Proteínas',
        emoji: '🐟',
        price: 21.00,
        calories: 208,
        protein: 20,
        carbs: 0,
        fats: 13,
        intolerancias: ['pescado']
    },
    'Sardinas en lata': {
        category: 'Proteínas',
        emoji: '🐟',
        price: 9.00,
        calories: 208,
        protein: 25,
        carbs: 0,
        fats: 11,
        intolerancias: ['pescado']
    },

    // PROTEÍNAS VEGETALES
    'Seitán': {
        category: 'Proteínas',
        emoji: '🌾',
        price: 14.36,  // Ajustado según Carrefour Bio :cite[2]
        calories: 370,
        protein: 75,
        carbs: 14,
        fats: 1.2,
        intolerancias: ['gluten']
    },
    'Tofu': {
        category: 'Proteínas',
        emoji: '🧈',
        price: 15.00,
        calories: 76,
        protein: 8,
        carbs: 1.9,
        fats: 4.8,
        intolerancias: ['soja']
    },

    // LÁCTEOS
    'Leche condensada': {
        category: 'Lácteos',
        emoji: '🥛',
        price: 4.00,  // Actualizado: 1.60€/400g → 4.00€/kg
        calories: 321,
        protein: 8.0,
        carbs: 54,
        fats: 9.0,
        intolerancias: ['lactosa']
    },
    'Leche entera': {
        category: 'Lácteos',
        emoji: '🥛',
        price: 0.90,  // Mercadona 1L = 0.90€
        calories: 61,
        protein: 3.2,
        carbs: 4.8,
        fats: 3.6,
        intolerancias: ['lactosa']
    },
    'Leche semidesnatada': {
        category: 'Lácteos',
        emoji: '🥛',
        price: 0.95,  // Ajustado según FACUA
        calories: 47,
        protein: 3.4,
        carbs: 4.8,
        fats: 1.6,
        intolerancias: ['lactosa']
    },
    'Nata para cocinar': {
        category: 'Lácteos',
        emoji: '🥣',
        price: 7.50,  // Hacendado 200ml = 1.50€ → 7.50€/kg
        calories: 193,
        protein: 1.5,
        carbs: 3.0,
        fats: 20,
        intolerancias: ['lactosa']
    },
    'Queso burgos desnatado': {
        category: 'Lácteos',
        emoji: '🧀',
        price: 8.00,  // Carrefour 250g = 2.00€
        calories: 72,
        protein: 12,
        carbs: 2,
        fats: 1,
        intolerancias: ['lactosa']
    },
    'Queso Cheddar': {
        category: 'Lácteos',
        emoji: '🧀',
        price: 15.00,  // Hacendado 200g = 3.00€ → 15.00€/kg
        calories: 402,
        protein: 25,
        carbs: 1.3,
        fats: 33,
        intolerancias: ['lactosa']
    },
    'Queso emmental': {
        category: 'Lácteos',
        emoji: '🧀',
        price: 20.00,  // Carrefour 200g = 4.00€ → 20.00€/kg
        calories: 380,
        protein: 29,
        carbs: 1.5,
        fats: 29,
        intolerancias: ['lactosa']
    },
    'Queso feta': {
        category: 'Lácteos',
        emoji: '🧀',
        price: 12.00,  // Hacendado 200g = 2.40€ → 12.00€/kg
        calories: 264,
        protein: 14,
        carbs: 4.1,
        fats: 21,
        intolerancias: ['lactosa']
    },
    'Queso mozzarella': {
        category: 'Lácteos',
        emoji: '🧀',
        price: 17.50,  // Mercadona 200g = 3.50€
        calories: 280,
        protein: 28,
        carbs: 3.1,
        fats: 17,
        intolerancias: ['lactosa']
    },
    'Requesón': {
        category: 'Lácteos',
        emoji: '🥣',
        price: 10.00,  // Mercadona 250g = 2.50€
        calories: 98,
        protein: 12,
        carbs: 3.4,
        fats: 4.3,
        intolerancias: ['lactosa']
    },
    'Skyr natural': {
        category: 'Lácteos',
        emoji: '🥄',
        price: 4.00,  // Hacendado 500g = 2.00€
        calories: 66,
        protein: 11,
        carbs: 4.0,
        fats: 0.2,
        intolerancias: ['lactosa']
    },
    'Yogur de soja': {
        category: 'Lácteos',
        emoji: '🥛',
        price: 3.50,  // Alpro 1L = 3.50€
        calories: 63,
        protein: 3.5,
        carbs: 6.0,
        fats: 2.5,
        intolerancias: ['soja']
    },
    'Yogur griego 0%': {
        category: 'Lácteos',
        emoji: '🥛',
        price: 3.00,  // Mercadona 500g = 1.50€
        calories: 57,
        protein: 10,
        carbs: 4.0,
        fats: 0,
        intolerancias: ['lactosa']
    },
    'Yogur griego natural': {
        category: 'Lácteos',
        emoji: '🥛',
        price: 3.00,  // Actualizado (antes 4.50€)
        calories: 59,
        protein: 10,
        carbs: 3.6,
        fats: 0.4,
        intolerancias: ['lactosa']
    },
    'Yogur natural entero': {
        category: 'Lácteos',
        emoji: '🥛',
        price: 2.50,  // Hacendado 1kg = 2.50€
        calories: 62,
        protein: 3.5,
        carbs: 4.7,
        fats: 3.3,
        intolerancias: ['lactosa']
    },

    // CEREALES
        'Amaranto': {
        category: 'Cereales',
        emoji: '🌾',
        price: 4.90,
        calories: 371,
        protein: 14,
        carbs: 65,
        fats: 7.0,
        intolerancias: []
    },
    'Arroz basmati': {
        category: 'Cereales',
        emoji: '🍚',
        price: 2.10,
        calories: 350,
        protein: 7.1,
        carbs: 77,
        fats: 0.7,
        intolerancias: []
    },
    'Arroz integral': {
        category: 'Cereales',
        emoji: '🍚',
        price: 1.80,
        calories: 367,  // Corregido (valor crudo)
        protein: 7.5,
        carbs: 77,
        fats: 2.9,
        intolerancias: []
    },
    'Bulgur': {
        category: 'Cereales',
        emoji: '🌾',
        price: 3.20,
        calories: 342,
        protein: 12,
        carbs: 76,
        fats: 1.3,
        intolerancias: ['gluten']
    },
    'Cebada perlada': {
        category: 'Cereales',
        emoji: '🌾',
        price: 2.10,
        calories: 354,
        protein: 12,
        carbs: 73,
        fats: 2.3,
        intolerancias: ['gluten']
    },
    'Centeno integral': {
        category: 'Cereales',
        emoji: '🌾',
        price: 2.50,
        calories: 325,
        protein: 15,
        carbs: 69,
        fats: 2.2,
        intolerancias: ['gluten']
    },
    'Cereales All-Bran': {
        category: 'Cereales',
        emoji: '🌾',
        price: 3.30,
        calories: 259,
        protein: 14,
        carbs: 66,
        fats: 3.5,
        intolerancias: ['gluten']
    },
    'Copos de avena': {
        category: 'Cereales',
        emoji: '🌾',
        price: 1.50,
        calories: 389,
        protein: 16.9,
        carbs: 66.3,
        fats: 6.9,
        intolerancias: []
    },
    'Cuscús integral': {
        category: 'Cereales',
        emoji: '🌾',
        price: 9.50,
        calories: 376,  // Valor crudo actualizado
        protein: 12.8,
        carbs: 77.4,
        fats: 2.5,
        intolerancias: ['gluten']
    },
    'Granola sin azúcar': {
        category: 'Cereales',
        emoji: '🥣',
        price: 5.60,
        calories: 471,
        protein: 10,
        carbs: 64,
        fats: 19,
        intolerancias: []
    },
    'Harina de maíz': {
        category: 'Cereales',
        emoji: '🌽',
        price: 1.40,
        calories: 364,
        protein: 6.9,
        carbs: 79,
        fats: 3.9,
        intolerancias: []
    },
    'Mijo': {
        category: 'Cereales',
        emoji: '🌾',
        price: 2.80,
        calories: 378,
        protein: 11,
        carbs: 73,
        fats: 4.2,
        intolerancias: []
    },
    'Polenta': {
        category: 'Cereales',
        emoji: '🟡',
        price: 2.15,
        calories: 358,
        protein: 8.1,
        carbs: 77,
        fats: 2.3,
        intolerancias: []
    },
    'Quinoa': {
        category: 'Cereales',
        emoji: '🌾',
        price: 18.00,
        calories: 368,  // Valor crudo actualizado
        protein: 14.1,
        carbs: 64.2,
        fats: 6.1,
        intolerancias: []
    },
    'Salvado de trigo': {
        category: 'Cereales',
        emoji: '🌾',
        price: 1.95,
        calories: 216,
        protein: 15,
        carbs: 64,
        fats: 4.3,
        intolerancias: ['gluten']
    },
    'Tortitas de maíz': {
        category: 'Cereales',
        emoji: '🌽',
        price: 5.00,
        calories: 387,
        protein: 8.0,
        carbs: 80,
        fats: 2.5,
        intolerancias: []
    },
    'Trigo sarraceno': {
        category: 'Cereales',
        emoji: '🌾',
        price: 3.80,
        calories: 343,
        protein: 13,
        carbs: 71,
        fats: 3.4,
        intolerancias: []
    },

    // TUBÉRCULOS
    'Boniato': {
        category: 'Tubérculos',
        emoji: '🍠',
        price: 2.90,  // Ajustado según Carrefour 
        calories: 90,
        protein: 2.0,
        carbs: 21,
        fats: 0.3,
        intolerancias: []
    },
    'Chirivía': {
        category: 'Tubérculos',
        emoji: '🥕',
        price: 3.20,
        calories: 75,
        protein: 1.2,
        carbs: 18,
        fats: 0.3,
        intolerancias: []
    },
    'Jícama': {
        category: 'Tubérculos',
        emoji: '🌱',
        price: 4.00,
        calories: 38,
        protein: 0.7,
        carbs: 9,
        fats: 0.1,
        intolerancias: []
    },
    'Ñame': {
        category: 'Tubérculos',
        emoji: '🍠',
        price: 4.80,
        calories: 118,
        protein: 1.5,
        carbs: 28,
        fats: 0.2,
        intolerancias: []
    },
    'Patata': {
        category: 'Tubérculos',
        emoji: '🥔',
        price: 1.20,  // Actualizado según FACUA (antes 1.50€)
        calories: 86,
        protein: 1.7,
        carbs: 20,
        fats: 0.1,
        intolerancias: []
    },
    'Patata roja': {
        category: 'Tubérculos',
        emoji: '🥔',
        price: 3.50,
        calories: 86,
        protein: 1.7,
        carbs: 20,
        fats: 0.1,
        intolerancias: []
    },
    'Remolacha roja': {
        category: 'Tubérculos',
        emoji: '🥕',
        price: 1.80,
        calories: 43,
        protein: 1.6,
        carbs: 9.6,
        fats: 0.2,
        intolerancias: []
    },
    'Taro (malanga)': {
        category: 'Tubérculos',
        emoji: '🌱',
        price: 5.60,
        calories: 112,
        protein: 1.5,
        carbs: 26,
        fats: 0.2,
        intolerancias: []
    },
    'Yuca fresca': {
        category: 'Tubérculos',
        emoji: '🌿',
        price: 3.50,
        calories: 160,
        protein: 1.4,
        carbs: 38,
        fats: 0.3,
        intolerancias: []
    },

    // VERDURAS
    'Ajo': {
        category: 'Verduras',
        emoji: '🧄',
        price: 7.50,  // Mercadona (100g ≈ 0.75€ → 7.50€/kg)
        calories: 149,
        protein: 6.4,
        carbs: 33,
        fats: 0.5,
        intolerancias: []
    },
    'Alcachofa': {
        category: 'Verduras',
        emoji: '🌿',
        price: 8.00,
        calories: 47,
        protein: 3.3,
        carbs: 10.5,
        fats: 0.2,
        intolerancias: []
    },
    'Berenjena': {
        category: 'Verduras',
        emoji: '🍆',
        price: 2.80,
        calories: 25,
        protein: 1.0,
        carbs: 6.0,
        fats: 0.2,
        intolerancias: []
    },
    'Brócoli': {
        category: 'Verduras',
        emoji: '🥦',
        price: 3.50,
        calories: 34,
        protein: 2.8,
        carbs: 6.6,
        fats: 0.4,
        intolerancias: []
    },
    'Calabacín': {
        category: 'Verduras',
        emoji: '🥒',
        price: 2.20,  // Ajustado según ofertas Mercadona 
        calories: 17,
        protein: 1.2,
        carbs: 3.1,
        fats: 0.3,
        intolerancias: []
    },
    'Calabaza': {
        category: 'Verduras',
        emoji: '🎃',
        price: 1.90,  // Precio por kg (pieza entera)
        calories: 26,
        protein: 1.0,
        carbs: 7.0,
        fats: 0.1,
        intolerancias: []
    },
    'Cebolla': {
        category: 'Verduras',
        emoji: '🧅',
        price: 1.80,  // Actualizado (+20% FACUA 2025)
        calories: 40,
        protein: 1.1,
        carbs: 9.3,
        fats: 0.1,
        intolerancias: []
    },
    'Coliflor': {
        category: 'Verduras',
        emoji: '🥦',
        price: 2.40,
        calories: 25,
        protein: 2.0,
        carbs: 5.0,
        fats: 0.3,
        intolerancias: []
    },
    'Espárragos verdes': {
        category: 'Verduras',
        emoji: '🌱',
        price: 6.00,  // Mercadona (manojo 250g ≈ 1.50€)
        calories: 20,
        protein: 2.2,
        carbs: 3.7,
        fats: 0.1,
        intolerancias: []
    },
    'Espinacas crudas': {
        category: 'Verduras',
        emoji: '🥬',
        price: 4.50,
        calories: 23,
        protein: 2.9,
        carbs: 3.6,
        fats: 0.4,
        intolerancias: []
    },
    'Lechuga iceberg': {
        category: 'Verduras',
        emoji: '🥬',
        price: 1.50,  // Carrefour (unidad ≈ 0.60€/400g)
        calories: 15,
        protein: 1.4,
        carbs: 2.9,
        fats: 0.2,
        intolerancias: []
    },
    'Pepino': {
        category: 'Verduras',
        emoji: '🥒',
        price: 1.90,
        calories: 15,
        protein: 0.7,
        carbs: 3.6,
        fats: 0.1,
        intolerancias: []
    },
    'Pimiento verde': {
        category: 'Verduras',
        emoji: '🫑',
        price: 2.20,
        calories: 20,
        protein: 0.9,
        carbs: 4.6,
        fats: 0.2,
        intolerancias: []
    },
    'Pimiento rojo': {
        category: 'Verduras',
        emoji: '🫑',
        price: 3.50,  // Aumento del 40% por temporada 
        calories: 31,
        protein: 1,
        carbs: 6,
        fats: 0.3,
        intolerancias: []
    },
    'Puerro': {
        category: 'Verduras',
        emoji: '🌱',
        price: 2.20,  // Actualizado según OCU 
        calories: 61,
        protein: 1.5,
        carbs: 14,
        fats: 0.3,
        intolerancias: []
    },
    'Tomate': {
        category: 'Verduras',
        emoji: '🍅',
        price: 2.50,  // Subida del 19% (FACUA)
        calories: 18,
        protein: 0.9,
        carbs: 3.9,
        fats: 0.2,
        intolerancias: []
    },
    'Zanahoria': {
        category: 'Verduras',
        emoji: '🥕',
        price: 1.80,
        calories: 41,
        protein: 0.9,
        carbs: 10,
        fats: 0.2,
        intolerancias: []
    },

    // FRUTAS
        'Ciruela': {
        category: 'Frutas',
        emoji: '🍑',
        price: 3.40,
        calories: 46,
        protein: 0.7,
        carbs: 11,
        fats: 0.3,
        intolerancias: []
    },
    'Fresas': {
        category: 'Frutas',
        emoji: '🍓',
        price: 6.50,
        calories: 32,
        protein: 0.7,
        carbs: 7.7,
        fats: 0.3,
        intolerancias: []
    },
    'Granada': {
        category: 'Frutas',
        emoji: '🍎',
        price: 3.90,
        calories: 83,
        protein: 1.7,
        carbs: 19,
        fats: 1.2,
        intolerancias: []
    },
    'Higo': {
        category: 'Frutas',
        emoji: '🍯',
        price: 6.50,
        calories: 74,
        protein: 0.8,
        carbs: 19,
        fats: 0.3,
        intolerancias: []
    },
    'Kiwi': {
        category: 'Frutas',
        emoji: '🥝',
        price: 3.50,
        calories: 61,
        protein: 1.1,
        carbs: 15,
        fats: 0.5,
        intolerancias: []
    },
    'Limón': {
        category: 'Frutas',
        emoji: '🍋',
        price: 2.20,  // Actualizado: malla 1kg = 2.20€
        calories: 29,
        protein: 1.1,
        carbs: 9,
        fats: 0.3,
        intolerancias: []
    },
    'Mandarina': {
        category: 'Frutas',
        emoji: '🍊',
        price: 2.20,
        calories: 53,
        protein: 0.8,
        carbs: 13,
        fats: 0.3,
        intolerancias: []
    },
    'Mango': {
        category: 'Frutas',
        emoji: '🥭',
        price: 4.90,
        calories: 60,
        protein: 0.8,
        carbs: 15,
        fats: 0.4,
        intolerancias: []
    },
    'Manzana': {
        category: 'Frutas',
        emoji: '🍎',
        price: 2.50,  // Ajustado según FACUA
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fats: 0.2,
        intolerancias: []
    },
    'Melón': {
        category: 'Frutas',
        emoji: '🍈',
        price: 1.50,
        calories: 34,
        protein: 0.8,
        carbs: 8.0,
        fats: 0.2,
        intolerancias: []
    },
    'Naranja': {
        category: 'Frutas',
        emoji: '🍊',
        price: 2.80,  // Baja temporada
        calories: 47,
        protein: 0.9,
        carbs: 12,
        fats: 0.1,
        intolerancias: []
    },
    'Pera': {
        category: 'Frutas',
        emoji: '🍐',
        price: 3.00,
        calories: 57,
        protein: 0.4,
        carbs: 15,
        fats: 0.1,
        intolerancias: []
    },
    'Piña': {
        category: 'Frutas',
        emoji: '🍍',
        price: 2.80,
        calories: 50,
        protein: 0.5,
        carbs: 13,
        fats: 0.1,
        intolerancias: []
    },
    'Plátano': {
        category: 'Frutas',
        emoji: '🍌',
        price: 1.95,  // Oferta Mercadona
        calories: 89,
        protein: 1.1,
        carbs: 23,
        fats: 0.3,
        intolerancias: []
    },
    'Sandía': {
        category: 'Frutas',
        emoji: '🍉',
        price: 0.95,  // +19% por sequía
        calories: 30,
        protein: 0.6,
        carbs: 7.5,
        fats: 0.2,
        intolerancias: []
    },
    'Uvas blancas': {
        category: 'Frutas',
        emoji: '🍇',
        price: 4.20,
        calories: 69,
        protein: 0.7,
        carbs: 18,
        fats: 0.2,
        intolerancias: []
    },
    'Uvas rojas': {
        category: 'Frutas',
        emoji: '🍇',
        price: 4.80,
        calories: 69,
        protein: 0.7,
        carbs: 18,
        fats: 0.2,
        intolerancias: []
    },

    // LEGUMBRES
    'Alubias blancas Hacendado (1kg)': {
        category: 'Legumbres',
        emoji: '🥣',
        price: 2.54,
        calories: 335,  // Valor crudo actualizado
        protein: 21.4,
        carbs: 61.3,
        fats: 1.4,
        intolerancias: []
    },
    'Alubias negras': {
        category: 'Legumbres',
        emoji: '🖤',
        price: 2.80,
        calories: 341,
        protein: 21.6,
        carbs: 62.4,
        fats: 1.4,
        intolerancias: []
    },
    'Altramuces en salmuera': {
        category: 'Legumbres',
        emoji: '🟡',
        price: 3.20,  // Precio por kg escurrido
        calories: 116,
        protein: 16,
        carbs: 9.7,
        fats: 2.9,
        intolerancias: []
    },
    'Azuki rojos': {
        category: 'Legumbres',
        emoji: '🫘',
        price: 7.80,
        calories: 329,
        protein: 19.9,
        carbs: 62.9,
        fats: 0.5,
        intolerancias: []
    },
    'Edamame': {
        category: 'Legumbres',
        emoji: '🟢',
        price: 18.00,  // Precio por kg congelado (sin vaina)
        calories: 122,
        protein: 11,
        carbs: 10,
        fats: 5.2,
        intolerancias: ['soja']
    },
    'Garbanzos cocidos': {
        category: 'Legumbres',
        emoji: '🥫',
        price: 3.00,  // Lata 400g = 1.20€ → 3.00€/kg
        calories: 164,
        protein: 9,
        carbs: 27,
        fats: 2.6,
        intolerancias: []
    },
    'Garbanzos crudos': {
        category: 'Legumbres',
        emoji: '🥙',
        price: 2.10,
        calories: 364,
        protein: 19,
        carbs: 61,
        fats: 6.0,
        intolerancias: []
    },
    'Guisantes secos': {
        category: 'Legumbres',
        emoji: '🟢',
        price: 3.50,
        calories: 348,
        protein: 24.6,
        carbs: 60.4,
        fats: 1.2,
        intolerancias: []
    },
    'Habas secas': {
        category: 'Legumbres',
        emoji: '🫘',
        price: 4.20,
        calories: 341,
        protein: 26.1,
        carbs: 58.3,
        fats: 1.5,
        intolerancias: []
    },
    'Lenteja beluga': {
        category: 'Legumbres',
        emoji: '⚫',
        price: 8.50,
        calories: 344,
        protein: 25.8,
        carbs: 63.1,
        fats: 1.2,
        intolerancias: []
    },
    'Lentejas': {
        category: 'Legumbres',
        emoji: '🥣',
        price: 2.50,
        calories: 353,  // Valor crudo actualizado
        protein: 25.8,
        carbs: 63.1,
        fats: 1.1,
        intolerancias: []
    },
    'Lentejas pardinas': {
        category: 'Legumbres',
        emoji: '🥣',
        price: 2.80,
        calories: 353,
        protein: 25.8,
        carbs: 63.1,
        fats: 1.1,
        intolerancias: []
    },
    'Soja texturizada fina': {
        category: 'Legumbres',
        emoji: '🌱',
        price: 6.90,
        calories: 340,
        protein: 52,
        carbs: 30,
        fats: 1.0,
        intolerancias: ['soja']
    },

    // GRASAS
    'Aceite de coco': {
        category: 'Grasas',
        emoji: '🥥',
        price: 22.00,  // 22€/kg (Hacendado 500ml ≈ 11€/500g)
        calories: 862,
        protein: 0,
        carbs: 0,
        fats: 100,
        intolerancias: []
    },
    'Aceite de girasol': {
        category: 'Grasas',
        emoji: '🌻',
        price: 1.80,  // 9.50€/kg (Hacendado 1L = 1.90€ → densidad 0.92g/ml)
        calories: 884,
        protein: 0,
        carbs: 0,
        fats: 100,
        intolerancias: []
    },
    'Aceite de oliva': {
        category: 'Grasas',
        emoji: '🫒',
        price: 8.50,  // Precio actualizado (OCU 2025)
        calories: 884,
        protein: 0,
        carbs: 0,
        fats: 100,
        intolerancias: []
    },
    'Aguacate': {
        category: 'Grasas',
        emoji: '🥑',
        price: 9.50,
        calories: 160,
        protein: 2,
        carbs: 9,
        fats: 15,
        intolerancias: []
    },
    'Anacardos tostados': {
        category: 'Grasas',
        emoji: '🥜',
        price: 36.97, 
        calories: 553,
        protein: 18,
        carbs: 30,
        fats: 44,
        intolerancias: ['frutos secos']
    },
    'Crema de almendras': {
        category: 'Grasas',
        emoji: '🌰',
        price: 39.00,  // 39€/kg (Mercadona 200g = 7.80€)
        calories: 614,
        protein: 21,
        carbs: 19,
        fats: 55,
        intolerancias: ['frutos secos']
    },
    'Linaza dorada': {
        category: 'Grasas',
        emoji: '🌾',
        price: 21.00,  // 21€/kg (Mercadona 500g = 10.50€)
        calories: 534,
        protein: 18,
        carbs: 29,
        fats: 42,
        intolerancias: []
    },
    'Mantequilla': {
        category: 'Grasas',
        emoji: '🧈',
        price: 6.00,  // 6€/kg (Hacendado 250g = 1.50€)
        calories: 717,
        protein: 0.8,
        carbs: 0.1,
        fats: 81,
        intolerancias: ['lactosa']
    },
    'Mantequilla de cacahuete': {
        category: 'Grasas',
        emoji: '🥜',
        price: 55.00,  // 55€/kg (alta calidad, sin azúcares añadidos)
        calories: 588,
        protein: 25,
        carbs: 20,
        fats: 50,
        intolerancias: ['frutos secos']
    },
    'Margarina sin sal': {
        category: 'Grasas',
        emoji: '🟡',
        price: 4.50,  // 4.50€/kg (Carrefour 500g = 2.25€)
        calories: 717,
        protein: 0.3,
        carbs: 0.7,
        fats: 81,
        intolerancias: []
    },
    'Nueces': {
        category: 'Grasas',
        emoji: '🌰',
        price: 12.00,
        calories: 654,
        protein: 15,
        carbs: 14,
        fats: 65,
        intolerancias: ['frutos secos']
    },
    'Piñones': {
        category: 'Grasas',
        emoji: '🌲',
        price: 18.00,  // 18€/kg (Mercadona 150g = 2.70€)
        calories: 673,
        protein: 14,
        carbs: 13,
        fats: 68,
        intolerancias: ['frutos secos']
    },
    'Semillas de calabaza': {
        category: 'Grasas',
        emoji: '🎃',
        price: 15.00,  // 15€/kg (Carrefour 150g = 2.25€)
        calories: 559,
        protein: 30,
        carbs: 11,
        fats: 49,
        intolerancias: []
    },
    'Semillas de chía': {
        category: 'Grasas',
        emoji: '🌱',
        price: 8.60,
        calories: 458,
        protein: 21,
        carbs: 4.6,
        fats: 32,
        intolerancias: []
    },

    // ENDULZANTES
        'Azúcar de coco': {
        category: 'Endulzantes',
        emoji: '🥥',
        price: 27.20,  // Mercadona 250g = 6.80€ → 27.20€/kg
        calories: 385,
        protein: 1.1,
        carbs: 93,
        fats: 0.5,
        intolerancias: []
    },
    'Edulcorante de fruta del monje': {
        category: 'Endulzantes',
        emoji: '🍈',
        price: 100.00,  // Carrefour 75g = 7.50€ → 100€/kg
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        intolerancias: []
    },
    'Eritritol': {
        category: 'Endulzantes',
        emoji: '❄️',
        price: 11.80,  // Carrefour 500g = 5.90€ → 11.80€/kg
        calories: 20,
        protein: 0,
        carbs: 100,  // Polioles (0.7x dulzor vs azúcar)
        fats: 0,
        intolerancias: ['polioles']
    },
    'Mermelada de fresa light': {
        category: 'Endulzantes',
        emoji: '🍓',
        price: 6.50,
        calories: 100,
        protein: 0.3,
        carbs: 25,
        fats: 0,
        intolerancias: []
    },
    'Miel': {
        category: 'Endulzantes',
        emoji: '🍯',
        price: 7.00,
        calories: 304,
        protein: 0.3,
        carbs: 82.4,
        fats: 0,
        intolerancias: []
    },
    'Panela': {
        category: 'Endulzantes',
        emoji: '🟫',
        price: 3.90,  // Hacendado 500g = 1.95€ → 3.90€/kg
        calories: 380,
        protein: 0.5,
        carbs: 95,
        fats: 0,
        intolerancias: []
    },
    'Stevia líquida': {
        category: 'Endulzantes',
        emoji: '🌿',
        price: 90.00,  // 50ml ≈ 4.50€ → 90€/kg (densidad ≈1g/ml)
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        intolerancias: []
    },
    'Sirope de ágave': {
        category: 'Endulzantes',
        emoji: '🌵',
        price: 12.80,  // Mercadona 250ml = 3.20€ → 12.80€/kg (densidad 1.4g/ml)
        calories: 310,
        protein: 0,
        carbs: 76,
        fats: 0,
        intolerancias: []
    },
    'Xilitol': {
        category: 'Endulzantes',
        emoji: '🌾',
        price: 28.00,  // 100g ≈ 2.80€ → 28€/kg
        calories: 240,
        protein: 0,
        carbs: 100,
        fats: 0,
        intolerancias: ['polioles']
    },

    // BEBIDAS
        'Agua': {
        category: 'Bebidas',
        emoji: '💧',
        price: 0.45,  // 1.5L ≈ 0.68€ → 0.45€/kg
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        intolerancias: []
    },
    'Agua con gas': {
        category: 'Bebidas',
        emoji: '💧',
        price: 0.45,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        intolerancias: []
    },
    'Batido de fresa (sin lactosa)': {
        category: 'Bebidas',
        emoji: '🥤',
        price: 5.20,  // Alpro 1L ≈ 5.20€
        calories: 90,
        protein: 1.2,
        carbs: 18,
        fats: 2.1,
        intolerancias: []
    },
    'Leche de almendras': {
        category: 'Bebidas',
        emoji: '🥤',
        price: 2.20,  // Mercadona 1L ≈ 2.20€
        calories: 24,
        protein: 0.5,
        carbs: 3.0,
        fats: 1.1,
        intolerancias: ['frutos secos']
    },
    'Leche de avena': {
        category: 'Bebidas',
        emoji: '🌾',
        price: 1.80,  // Hacendado 1L ≈ 1.80€
        calories: 47,
        protein: 0.3,
        carbs: 9.7,
        fats: 1.0,
        intolerancias: []
    },
    'Néctar de melocotón': {
        category: 'Bebidas',
        emoji: '🍑',
        price: 1.05,
        calories: 68,
        protein: 0.3,
        carbs: 17,
        fats: 0,
        intolerancias: []
    },
    'Smoothie de mango y maracuyá': {
        category: 'Bebidas',
        emoji: '🥭',
        price: 10.00,  // Realfooding 250ml ≈ 2.50€ → 10€/kg
        calories: 72,
        protein: 0.7,
        carbs: 16,
        fats: 0.3,
        intolerancias: []
    },
    'Té verde': {
        category: 'Bebidas',
        emoji: '🍵',
        price: 1.80,
        calories: 1,
        protein: 0,
        carbs: 0,
        fats: 0,
        intolerancias: []
    },
    'Zumo de manzana': {
        category: 'Bebidas',
        emoji: '🍎',
        price: 1.10,
        calories: 46,
        protein: 0.1,
        carbs: 11,
        fats: 0.1,
        intolerancias: []
    },
    'Zumo de naranja natural': {
        category: 'Bebidas',
        emoji: '🧃',
        price: 2.30,
        calories: 45,
        protein: 0.7,
        carbs: 10,
        fats: 0.2,
        intolerancias: []
    },
    'Zumo de piña': {
        category: 'Bebidas',
        emoji: '🍍',
        price: 1.40,
        calories: 53,
        protein: 0.4,
        carbs: 13,
        fats: 0.1,
        intolerancias: []
    },
    'Zumo de tomate': {
        category: 'Bebidas',
        emoji: '🍅',
        price: 1.30,
        calories: 17,
        protein: 0.8,
        carbs: 3.5,
        fats: 0.1,
        intolerancias: []
    },
    'Zumo de uva': {
        category: 'Bebidas',
        emoji: '🍇',
        price: 1.60,
        calories: 70,
        protein: 0.3,
        carbs: 17,
        fats: 0.1,
        intolerancias: []
    },
    'Zumo multifrutas (tropical)': {
        category: 'Bebidas',
        emoji: '🍹',
        price: 9.35,  // 6x200ml = 1.2L → 2.25€/1.2kg ≈ 1.87€/kg
        calories: 60,
        protein: 0.3,
        carbs: 14,
        fats: 0.2,
        intolerancias: ['lactosa']
    },
    
    // ESPECIAS
        'Ajo granulado': {
        category: 'Especias',
        emoji: '🧄',
        price: 13.50,  // 11.44€/850g → 13.50€/kg
        calories: 331,
        protein: 16.6,
        carbs: 72.7,
        fats: 0.73,
        intolerancias: []
    },
    'Canela': {
        category: 'Especias',
        emoji: '🌿',
        price: 50.00,  // Hacendado 45g = 2.25€ → 50€/kg
        calories: 247,
        protein: 4,
        carbs: 80.6,
        fats: 1.2,
        intolerancias: []
    },
    'Canela en rama': {
        category: 'Especias',
        emoji: '🪵',
        price: 123.10,  // Gama premium
        calories: 247,
        protein: 4,
        carbs: 80.6,
        fats: 1.2,
        intolerancias: []
    },
    'Clavo molido': {
        category: 'Especias',
        emoji: '🌼',
        price: 34.00,  // Precio medio
        calories: 274,
        protein: 6,
        carbs: 65.5,
        fats: 13,
        intolerancias: []
    },
    'Comino en grano': {
        category: 'Especias',
        emoji: '🌿',
        price: 62.90,  // Web especializada
        calories: 375,
        protein: 17.8,
        carbs: 44.2,
        fats: 22.5,
        intolerancias: []
    },
    'Comino molido': {
        category: 'Especias',
        emoji: '🌿',
        price: 29.00,  // Mercadona
        calories: 375,
        protein: 18,
        carbs: 44,
        fats: 22,
        intolerancias: []
    },
    'Cúrcuma molida': {
        category: 'Especias',
        emoji: '🟡',
        price: 19.50,  // Hacendado
        calories: 312,
        protein: 9.7,
        carbs: 67.1,
        fats: 3.25,
        intolerancias: []
    },
    'Curry en polvo': {
        category: 'Especias',
        emoji: '🌿',
        price: 70.00,  // Carrefour 50g = 3.50€
        calories: 325,
        protein: 12.7,
        carbs: 58.2,
        fats: 14.0,
        intolerancias: []
    },
    'Mezcla de pimientas': {
        category: 'Especias',
        emoji: '⚫',
        price: 87.70,  // Congelados7Mares
        calories: 251,
        protein: 10.4,
        carbs: 64,
        fats: 3.26,
        intolerancias: []
    },
    'Nuez moscada molida': {
        category: 'Especias',
        emoji: '🌰',
        price: 91.70,  // Mercadona a granel
        calories: 525,
        protein: 5.8,
        carbs: 49.3,
        fats: 36.3,
        intolerancias: []
    },
    'Pimentón cayena': {
        category: 'Especias',
        emoji: '🌶️',
        price: 28.80,  // Oferta Mercadona
        calories: 318,
        protein: 12,
        carbs: 56.6,
        fats: 17.3,
        intolerancias: []
    },
    'Pimentón dulce': {
        category: 'Especias',
        emoji: '🌶️',
        price: 22.20,  // Carrefour
        calories: 282,
        protein: 14,
        carbs: 54,
        fats: 13,
        intolerancias: []
    },
    'Semillas de amapola': {
        category: 'Especias',
        emoji: '⚫',
        price: 31.40,  // Tiendas a granel
        calories: 525,
        protein: 17.9,
        carbs: 28.3,
        fats: 41.6,
        intolerancias: []
    },

    // PLATOS PREPARADOS
        'Ensaladilla rusa': {
        category: 'Platos preparados',
        emoji: '🥗',
        price: 11.20,  // 250g = 2.80€ → 11.20€/kg
        calories: 150,
        protein: 3,
        carbs: 18,
        fats: 7,
        intolerancias: ['huevo']
    },
    'Fabada asturiana': {
        category: 'Platos preparados',
        emoji: '🥣',
        price: 6.88,  // 800g = 5.50€ → 6.88€/kg
        calories: 320,
        protein: 16,
        carbs: 35,
        fats: 12,
        intolerancias: []
    },
    'Fabada asturiana en lata': {
        category: 'Platos preparados',
        emoji: '🥫',
        price: 4.26,  // Lata 420g = 1.79€
        calories: 128,
        protein: 6.5,
        carbs: 12,
        fats: 6.1,
        intolerancias: []
    },
    'Fideuá de marisco': {
        category: 'Platos preparados',
        emoji: '🍤',
        price: 16.22,  // 450g = 7.30€ → 16.22€/kg
        calories: 240,
        protein: 14,
        carbs: 30,
        fats: 8,
        intolerancias: ['marisco', 'gluten']
    },
    'Gazpacho refrigerado': {
        category: 'Platos preparados',
        emoji: '🍅',
        price: 1.60,  // 1L ≈ 1kg
        calories: 55,
        protein: 1.2,
        carbs: 10,
        fats: 1.0,
        intolerancias: []
    },
    'Hamburguesa vegetal precocinada': {
        category: 'Platos preparados',
        emoji: '🍔',
        price: 14.00,  // 150g = 2.10€ → 14€/kg
        calories: 250,
        protein: 13,
        carbs: 18,
        fats: 14,
        intolerancias: ['soja']
    },
    'Lasaña de carne refrigerada': {
        category: 'Platos preparados',
        emoji: '🍝',
        price: 8.40,  // 500g = 4.20€ → 8.40€/kg
        calories: 220,
        protein: 11,
        carbs: 24,
        fats: 9,
        intolerancias: ['lactosa', 'gluten']
    },
    'Lentejas con chorizo (conserva)': {
        category: 'Platos preparados',
        emoji: '🥣',
        price: 3.83,  // Lata 420g = 1.61€
        calories: 320,
        protein: 16,
        carbs: 35,
        fats: 12,
        intolerancias: []
    },
    'Paella de marisco congelada': {
        category: 'Platos preparados',
        emoji: '🥘',
        price: 15.33,  // 450g = 6.90€ → 15.33€/kg
        calories: 190,
        protein: 12,
        carbs: 22,
        fats: 5,
        intolerancias: ['marisco', 'gluten']
    },
    'Pisto de verduras': {
        category: 'Platos preparados',
        emoji: '🍲',
        price: 8.50,
        calories: 80,
        protein: 2.5,
        carbs: 10,
        fats: 4,
        intolerancias: []
    },
    'Pizza cuatro quesos': {
        category: 'Platos preparados',
        emoji: '🍕',
        price: 8.75,  // 400g = 3.50€ → 8.75€/kg
        calories: 265,
        protein: 15,
        carbs: 26,
        fats: 11,
        intolerancias: ['lactosa', 'gluten']
    },
    'Pollo rebozado con patatas': {
        category: 'Platos preparados',
        emoji: '🍗',
        price: 10.00,  // 400g = 4.00€ → 10€/kg
        calories: 280,
        protein: 15,
        carbs: 25,
        fats: 14,
        intolerancias: ['gluten']
    },
    'Pulled pork BBQ': {
        category: 'Platos preparados',
        emoji: '🐖',
        price: 11.09,  // 450g = 4.99€ → 11.09€/kg
        calories: 250,
        protein: 18,
        carbs: 15,
        fats: 14,
        intolerancias: []
    },
    'Tortilla de patatas': {
        category: 'Platos preparados',
        emoji: '🥔',
        price: 8.75,  // 400g = 3.50€ → 8.75€/kg
        calories: 210,
        protein: 8,
        carbs: 18,
        fats: 12,
        intolerancias: ['huevo', 'gluten']
    },
    'Verduras asadas': {
        category: 'Platos preparados',
        emoji: '🍆',
        price: 6.40,  // 500g = 3.20€ → 6.40€/kg
        calories: 90,
        protein: 3,
        carbs: 12,
        fats: 4,
        intolerancias: []
    },

    // SUPLEMENTOS
        'Ashwagandha KSM-66®': {
        category: 'Suplementos',
        emoji: '🌿',
        price: 833.33,  // 60 cápsulas (30g) ≈ 25€ → 833.33€/kg
        calories: 5,
        protein: 0,
        carbs: 1,
        fats: 0,
        intolerancias: []
    },
    'Caseína micelar': {
        category: 'Suplementos',
        emoji: '🥛',
        price: 34.50,  // 2kg = 69€ → 34.50€/kg
        calories: 120,
        protein: 24,
        carbs: 4,
        fats: 1,
        intolerancias: ['lactosa']
    },
    'Creatina monohidrato (Creapure®)': {
        category: 'Suplementos',
        emoji: '💥',
        price: 66.33,  // 300g = 19.90€ → 66.33€/kg
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        intolerancias: []
    },
    'Geles energéticos (4Energy Gel)': {
        category: 'Suplementos',
        emoji: '🏃',
        price: 83.33,  // Unidad 30g ≈ 2.50€ → 83.33€/kg
        calories: 100,
        protein: 0,
        carbs: 25,
        fats: 0,
        intolerancias: []
    },
    'Magnesio bisglicinato + B6': {
        category: 'Suplementos',
        emoji: '⚡',
        price: 833.33,  // 30 cápsulas (15g) ≈ 12.50€ → 833.33€/kg
        calories: 5,
        protein: 0,
        carbs: 1,
        fats: 0,
        intolerancias: []
    },
    'Omega-3 (EPA/DHA)': {
        category: 'Suplementos',
        emoji: '🐟',
        price: 300.00,  // 60 cápsulas (60g) ≈ 18€ → 300€/kg
        calories: 10,
        protein: 0,
        carbs: 0,
        fats: 1,
        intolerancias: ['pescado']
    },
    'Probióticos + Prebióticos': {
        category: 'Suplementos',
        emoji: '🦠',
        price: 733.33,  // 30 dosis (30g) ≈ 22€ → 733.33€/kg
        calories: 15,
        protein: 0,
        carbs: 3,
        fats: 0,
        intolerancias: []
    },
    'Proteína de suero': {
        category: 'Suplementos',
        emoji: '🥤',
        price: 27.86,
        calories: 383,
        protein: 70,
        carbs: 9.7,
        fats: 6.8,
        intolerancias: ['lactosa']
    },
    'Proteína de suero hidrolizado (sin lactosa)': {
        category: 'Suplementos',
        emoji: '💪',
        price: 29.90,
        calories: 110,
        protein: 25,
        carbs: 2,
        fats: 1.5,
        intolerancias: []
    },
    'Resveratrol (98% pureza)': {
        category: 'Suplementos',
        emoji: '🍇',
        price: 916.67,  // 30 cápsulas (30g) ≈ 27.50€ → 916.67€/kg
        calories: 10,
        protein: 0,
        carbs: 2,
        fats: 0,
        intolerancias: []
    },
    'Vitamina D3 + K2': {
        category: 'Suplementos',
        emoji: '☀️',
        price: 248.33,  // 60 cápsulas (60g) ≈ 14.90€ → 248.33€/kg
        calories: 5,
        protein: 0,
        carbs: 0,
        fats: 0.5,
        intolerancias: []
    },
};